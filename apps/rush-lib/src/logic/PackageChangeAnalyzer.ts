// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';
import colors from 'colors';
import * as crypto from 'crypto';

import { getPackageDeps, getGitHashForFiles } from '@rushstack/package-deps-hash';
import { Path, InternalError, FileSystem } from '@rushstack/node-core-library';

import { RushConfiguration } from '../api/RushConfiguration';
import { Git } from './Git';
import { PnpmProjectDependencyManifest } from './pnpm/PnpmProjectDependencyManifest';
import { RushConfigurationProject } from '../api/RushConfigurationProject';
import { RushConstants } from './RushConstants';

export class PackageChangeAnalyzer {
  // Allow this function to be overwritten during unit tests
  public static getPackageDeps: typeof getPackageDeps;

  private _data: Map<string, Map<string, string>>;
  private _projectStateCache: Map<string, string> = new Map<string, string>();
  private _rushConfiguration: RushConfiguration;
  private readonly _git: Git;

  public constructor(rushConfiguration: RushConfiguration) {
    this._rushConfiguration = rushConfiguration;
    this._git = new Git(this._rushConfiguration);
    this._data = this._getData();
  }

  public getPackageDeps(projectName: string): Map<string, string> | undefined {
    if (!this._data) {
      this._data = this._getData();
    }

    return this._data.get(projectName);
  }

  /**
   * The project state hash is calculated in the following way:
   * - Project dependencies are collected (see PackageChangeAnalyzer.getPackageDeps)
   *   - If project dependencies cannot be collected (i.e. - if Git isn't available),
   *     this function returns `undefined`
   * - The (path separator normalized) repo-root-relative dependencies' file paths are sorted
   * - A SHA1 hash is created and each (sorted) file path is fed into the hash and then its
   *   Git SHA is fed into the hash
   * - A hex digest of the hash is returned
   */
  public getProjectStateHash(projectName: string): string | undefined {
    let projectState: string | undefined = this._projectStateCache.get(projectName);
    if (!projectState) {
      const packageDeps: Map<string, string> | undefined = this.getPackageDeps(projectName);
      if (!packageDeps) {
        return undefined;
      } else {
        const sortedPackageDepsFiles: string[] = Array.from(packageDeps.keys()).sort();
        const hash: crypto.Hash = crypto.createHash('sha1');
        for (const packageDepsFile of sortedPackageDepsFiles) {
          hash.update(packageDepsFile);
          hash.update(RushConstants.hashDelimiter);
          hash.update(packageDeps.get(packageDepsFile)!);
          hash.update(RushConstants.hashDelimiter);
        }

        projectState = hash.digest('hex');
        this._projectStateCache.set(projectName, projectState);
      }
    }

    return projectState;
  }

  private _getData(): Map<string, Map<string, string>> {
    // If we are not in a unit test, use the correct resources
    if (!PackageChangeAnalyzer.getPackageDeps) {
      PackageChangeAnalyzer.getPackageDeps = getPackageDeps;
    }

    const projectHashDeps: Map<string, Map<string, string>> = new Map<string, Map<string, string>>();

    // pre-populate the map with the projects from the config
    for (const project of this._rushConfiguration.projects) {
      projectHashDeps.set(project.packageName, new Map<string, string>());
    }

    const noProjectHashes: { [key: string]: string } = {};

    let repoDeps: Map<string, string>;
    try {
      if (this._git.isPathUnderGitWorkingTree()) {
        // Load the package deps hash for the whole repository
        const gitPath: string = this._git.getGitPathOrThrow();
        repoDeps = PackageChangeAnalyzer.getPackageDeps(this._rushConfiguration.rushJsonFolder, [], gitPath);
      } else {
        return projectHashDeps;
      }
    } catch (e) {
      // If getPackageDeps fails, don't fail the whole build. Treat this case as if we don't know anything about
      // the state of the files in the repo. This can happen if the environment doesn't have Git.
      console.log(
        colors.yellow(
          `Error calculating the state of the repo. (inner error: ${e}). Continuing without diffing files.`
        )
      );

      return projectHashDeps;
    }

    // Sort each project folder into its own package deps hash
    for (const [filePath, fileHash] of repoDeps.entries()) {
      const projectName: string | undefined = this._getProjectForFile(filePath);

      // If we found a project for the file, go ahead and store this file's hash
      if (projectName) {
        projectHashDeps.get(projectName)!.set(filePath, fileHash);
      } else {
        noProjectHashes[filePath] = fileHash;
      }
    }

    if (
      this._rushConfiguration.packageManager === 'pnpm' &&
      !this._rushConfiguration.experimentsConfiguration.configuration
        .legacyIncrementalBuildDependencyDetection
    ) {
      const projects: RushConfigurationProject[] = [];
      const projectDependencyManifestPaths: string[] = [];

      for (const project of this._rushConfiguration.projects) {
        const dependencyManifestFilePath: string = PnpmProjectDependencyManifest.getFilePathForProject(
          project
        );
        const relativeDependencyManifestFilePath: string = Path.convertToSlashes(
          path.relative(this._rushConfiguration.rushJsonFolder, dependencyManifestFilePath)
        );

        if (!FileSystem.exists(dependencyManifestFilePath)) {
          throw new Error(
            `A project dependency file (${relativeDependencyManifestFilePath}) is missing. You may need to run ` +
              '"rush install" or "rush update".'
          );
        }

        projects.push(project);
        projectDependencyManifestPaths.push(relativeDependencyManifestFilePath);
      }

      const gitPath: string = this._git.getGitPathOrThrow();
      const hashes: Map<string, string> = getGitHashForFiles(
        projectDependencyManifestPaths,
        this._rushConfiguration.rushJsonFolder,
        gitPath
      );
      for (let i: number = 0; i < projects.length; i++) {
        const project: RushConfigurationProject = projects[i];
        const projectDependencyManifestPath: string = projectDependencyManifestPaths[i];
        if (!hashes.has(projectDependencyManifestPath)) {
          throw new InternalError(`Expected to get a hash for ${projectDependencyManifestPath}`);
        }

        const hash: string = hashes.get(projectDependencyManifestPath)!;
        projectHashDeps.get(project.packageName)!.set(projectDependencyManifestPath, hash);
      }
    } else {
      // Determine the current variant from the link JSON.
      const variant: string | undefined = this._rushConfiguration.currentInstalledVariant;

      // Add the shrinkwrap file to every project's dependencies
      const shrinkwrapFile: string = Path.convertToSlashes(
        path.relative(
          this._rushConfiguration.rushJsonFolder,
          this._rushConfiguration.getCommittedShrinkwrapFilename(variant)
        )
      );

      for (const project of this._rushConfiguration.projects) {
        const shrinkwrapHash: string | undefined = noProjectHashes[shrinkwrapFile];
        if (shrinkwrapHash) {
          projectHashDeps.get(project.packageName)!.set(shrinkwrapFile, shrinkwrapHash);
        }
      }
    }

    return projectHashDeps;
  }

  private _getProjectForFile(filePath: string): string | undefined {
    for (const project of this._rushConfiguration.projects) {
      if (this._fileExistsInFolder(filePath, project.projectRelativeFolder)) {
        return project.packageName;
      }
    }

    return undefined;
  }

  private _fileExistsInFolder(filePath: string, folderPath: string): boolean {
    return Path.isUnder(filePath, folderPath);
  }
}

// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as os from 'os';
import * as path from 'path';
import { FileSystem, Sort, Text, Import } from '@rushstack/node-core-library';

import { BaseWorkspaceFile } from '../base/BaseWorkspaceFile';
import { PNPM_SHRINKWRAP_YAML_FORMAT } from './PnpmYamlCommon';

const yamlModule: typeof import('js-yaml') = Import.lazy('js-yaml', require);

const globEscape: (unescaped: string) => string = require('glob-escape'); // No @types/glob-escape package exists

/**
 * This interface represents the raw pnpm-workspace.YAML file
 * Example:
 *  {
 *    "packages": [
 *      "../../apps/project1"
 *    ]
 *  }
 */
interface IPnpmWorkspaceYaml {
  /** The list of local package directories */
  packages: string[];
}

export class PnpmWorkspaceFile extends BaseWorkspaceFile {
  /**
   * The filename of the workspace file.
   */
  public readonly workspaceFilename: string;

  private _workspacePackages: Set<string>;

  /**
   * The PNPM workspace file is used to specify the location of workspaces relative to the root
   * of your PNPM install.
   */
  public constructor(workspaceYamlFilename: string) {
    super();

    this.workspaceFilename = workspaceYamlFilename;
    let workspaceYaml: IPnpmWorkspaceYaml;
    try {
      // Populate with the existing file, or an empty list if the file doesn't exist
      workspaceYaml = FileSystem.exists(workspaceYamlFilename)
        ? yamlModule.safeLoad(FileSystem.readFile(workspaceYamlFilename).toString())
        : { packages: [] };
    } catch (error) {
      throw new Error(`Error reading "${workspaceYamlFilename}":${os.EOL}  ${error.message}`);
    }

    this._workspacePackages = new Set<string>(workspaceYaml.packages);
  }

  /** @override */
  public addPackage(packagePath: string): void {
    // Ensure the path is relative to the pnpm-workspace.yaml file
    if (path.isAbsolute(packagePath)) {
      packagePath = path.relative(path.dirname(this.workspaceFilename), packagePath);
    }

    // Glob can't handle Windows paths
    const globPath: string = Text.replaceAll(packagePath, '\\', '/');
    this._workspacePackages.add(globEscape(globPath));
  }

  /** @override */
  protected serialize(): string {
    // Ensure stable sort order when serializing
    Sort.sortSet(this._workspacePackages);

    const workspaceYaml: IPnpmWorkspaceYaml = {
      packages: Array.from(this._workspacePackages)
    };
    return yamlModule.safeDump(workspaceYaml, PNPM_SHRINKWRAP_YAML_FORMAT);
  }
}

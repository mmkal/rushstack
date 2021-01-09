import { InternalError } from '@rushstack/node-core-library';
// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as os from 'os';
import * as path from 'path';
import { trueCasePathSync } from 'true-case-path';

import { IEnvironment } from '../utilities/Utilities';

export interface IEnvironmentConfigurationInitializeOptions {
  doNotNormalizePaths?: boolean;
}

/**
 * Names of environment variables used by Rush.
 * @public
 */
export const enum EnvironmentVariableNames {
  /**
   * This variable overrides the temporary folder used by Rush.
   * The default value is "common/temp" under the repository root.
   */
  RUSH_TEMP_FOLDER = 'RUSH_TEMP_FOLDER',

  /**
   * This variable overrides the version of Rush that will be installed by
   * the version selector.  The default value is determined by the "rushVersion"
   * field from rush.json.
   */
  RUSH_PREVIEW_VERSION = 'RUSH_PREVIEW_VERSION',

  /**
   * If this variable is set to "true", Rush will not fail the build when running a version
   * of Node that does not match the criteria specified in the "nodeSupportedVersionRange"
   * field from rush.json.
   */
  RUSH_ALLOW_UNSUPPORTED_NODEJS = 'RUSH_ALLOW_UNSUPPORTED_NODEJS',

  /**
   * This variable selects a specific installation variant for Rush to use when installing
   * and linking package dependencies.
   * For more information, see the command-line help for the `--variant` parameter
   * and this article:  https://rushjs.io/pages/advanced/installation_variants/
   */
  RUSH_VARIANT = 'RUSH_VARIANT',

  /**
   * Specifies the maximum number of concurrent processes to launch during a build.
   * For more information, see the command-line help for the `--parallelism` parameter for "rush build".
   */
  RUSH_PARALLELISM = 'RUSH_PARALLELISM',

  /**
   * If this variable is set to "true", Rush will create symlinks with absolute paths instead
   * of relative paths. This can be necessary when a repository is moved during a build or
   * if parts of a repository are moved into a sandbox.
   */
  RUSH_ABSOLUTE_SYMLINKS = 'RUSH_ABSOLUTE_SYMLINKS',

  /**
   * When using PNPM as the package manager, this variable can be used to configure the path that
   * PNPM will use as the store directory.
   *
   * If a relative path is used, then the store path will be resolved relative to the process's
   * current working directory.  An absolute path is recommended.
   */
  RUSH_PNPM_STORE_PATH = 'RUSH_PNPM_STORE_PATH',

  /**
   * This environment variable can be used to specify the `--target-folder` parameter
   * for the "rush deploy" command.
   */
  RUSH_DEPLOY_TARGET_FOLDER = 'RUSH_DEPLOY_TARGET_FOLDER',

  /**
   * Overrides the location of the `~/.rush` global folder where Rush stores temporary files.
   *
   * @remarks
   *
   * Most of the temporary files created by Rush are stored separately for each monorepo working folder,
   * to avoid issues of concurrency and compatibility between tool versions.  However, a small set
   * of files (e.g. installations of the `@microsoft/rush-lib` engine and the package manager) are stored
   * in a global folder to speed up installations.  The default location is `~/.rush` on POSIX-like
   * operating systems or `C:\Users\YourName` on Windows.
   *
   * Use `RUSH_GLOBAL_FOLDER` to specify a different folder path.  This is useful for example if a Windows
   * group policy forbids executing scripts installed in a user's home directory.
   *
   * POSIX is a registered trademark of the Institute of Electrical and Electronic Engineers, Inc.
   */
  RUSH_GLOBAL_FOLDER = 'RUSH_GLOBAL_FOLDER',

  /**
   * Provides a credential for a remote build cache, if configured. Setting this environment variable
   * overrides a "isCacheWriteAllowed": false setting.
   *
   * @remarks
   * This credential overrides any cached credentials.
   *
   * If Azure Blob Storage is used to store cache entries, this must be a SAS token serialized as query
   * parameters.
   *
   * For information on SAS tokens, see here: https://docs.microsoft.com/en-us/azure/storage/common/storage-sas-overview
   */
  RUSH_BUILD_CACHE_WRITE_CREDENTIAL = 'RUSH_BUILD_CACHE_WRITE_CREDENTIAL',

  /**
   * Allows the git binary path to be explicitly specified.
   */
  RUSH_GIT_BINARY_PATH = 'RUSH_GIT_BINARY_PATH'
}

/**
 * Provides Rush-specific environment variable data. All Rush environment variables must start with "RUSH_". This class
 * is designed to be used by RushConfiguration.
 *
 * @remarks
 * Initialize will throw if any unknown parameters are present.
 */
export class EnvironmentConfiguration {
  private static _hasBeenInitialized: boolean = false;

  private static _rushTempFolderOverride: string | undefined;

  private static _absoluteSymlinks: boolean = false;

  private static _allowUnsupportedNodeVersion: boolean = false;

  private static _pnpmStorePathOverride: string | undefined;

  private static _rushGlobalFolderOverride: string | undefined;

  private static _buildCacheCredential: string | undefined;

  private static _gitBinaryPath: string | undefined;

  /**
   * An override for the common/temp folder path.
   */
  public static get rushTempFolderOverride(): string | undefined {
    EnvironmentConfiguration._ensureInitialized();
    return EnvironmentConfiguration._rushTempFolderOverride;
  }

  /**
   * If "true", create symlinks with absolute paths instead of relative paths.
   * See {@link EnvironmentVariableNames.RUSH_ABSOLUTE_SYMLINKS}
   */
  public static get absoluteSymlinks(): boolean {
    EnvironmentConfiguration._ensureInitialized();
    return EnvironmentConfiguration._absoluteSymlinks;
  }

  /**
   * If this environment variable is set to "true", the Node.js version check will print a warning
   * instead of causing a hard error if the environment's Node.js version doesn't match the
   * version specifier in `rush.json`'s "nodeSupportedVersionRange" property.
   *
   * See {@link EnvironmentVariableNames.RUSH_ALLOW_UNSUPPORTED_NODEJS}.
   */
  public static get allowUnsupportedNodeVersion(): boolean {
    EnvironmentConfiguration._ensureInitialized();
    return EnvironmentConfiguration._allowUnsupportedNodeVersion;
  }

  /**
   * An override for the PNPM store path, if `pnpmStore` configuration is set to 'path'
   * See {@link EnvironmentVariableNames.RUSH_PNPM_STORE_PATH}
   */
  public static get pnpmStorePathOverride(): string | undefined {
    EnvironmentConfiguration._ensureInitialized();
    return EnvironmentConfiguration._pnpmStorePathOverride;
  }

  /**
   * Overrides the location of the `~/.rush` global folder where Rush stores temporary files.
   * See {@link EnvironmentVariableNames.RUSH_GLOBAL_FOLDER}
   */
  public static get rushGlobalFolderOverride(): string | undefined {
    EnvironmentConfiguration._ensureInitialized();
    return EnvironmentConfiguration._rushGlobalFolderOverride;
  }

  /**
   * Provides a credential for reading from and writing to a remote build cache, if configured.
   * See {@link EnvironmentVariableNames.RUSH_BUILD_CACHE_CONNECTION_STRING}
   */
  public static get buildCacheWriteCredential(): string | undefined {
    EnvironmentConfiguration._ensureInitialized();
    return EnvironmentConfiguration._buildCacheCredential;
  }

  /**
   * Allows the git binary path to be explicitly provided.
   * See {@link EnvironmentVariableNames.RUSH_GIT_BINARY_PATH}
   */
  public static get gitBinaryPath(): string | undefined {
    EnvironmentConfiguration._ensureInitialized();
    return EnvironmentConfiguration._gitBinaryPath;
  }

  /**
   * The front-end RushVersionSelector relies on `RUSH_GLOBAL_FOLDER`, so its value must be read before
   * `EnvironmentConfiguration` is initialized (and actually before the correct version of `EnvironmentConfiguration`
   * is even installed). Thus we need to read this environment variable differently from all the others.
   * @internal
   */
  public static _getRushGlobalFolderOverride(processEnv: IEnvironment): string | undefined {
    const value: string | undefined = processEnv[EnvironmentVariableNames.RUSH_GLOBAL_FOLDER];
    if (value) {
      const normalizedValue: string | undefined = EnvironmentConfiguration._normalizeDeepestParentFolderPath(
        value
      );
      return normalizedValue;
    }
  }

  /**
   * Reads and validates environment variables. If any are invalid, this function will throw.
   */
  public static initialize(options: IEnvironmentConfigurationInitializeOptions = {}): void {
    EnvironmentConfiguration.reset();

    const unknownEnvVariables: string[] = [];
    for (const envVarName in process.env) {
      if (process.env.hasOwnProperty(envVarName) && envVarName.match(/^RUSH_/i)) {
        const value: string | undefined = process.env[envVarName];
        // Environment variables are only case-insensitive on Windows
        const normalizedEnvVarName: string =
          os.platform() === 'win32' ? envVarName.toUpperCase() : envVarName;
        switch (normalizedEnvVarName) {
          case EnvironmentVariableNames.RUSH_TEMP_FOLDER: {
            EnvironmentConfiguration._rushTempFolderOverride =
              value && !options.doNotNormalizePaths
                ? EnvironmentConfiguration._normalizeDeepestParentFolderPath(value) || value
                : value;
            break;
          }

          case EnvironmentVariableNames.RUSH_ABSOLUTE_SYMLINKS: {
            EnvironmentConfiguration._absoluteSymlinks = value === 'true';
            break;
          }

          case EnvironmentVariableNames.RUSH_ALLOW_UNSUPPORTED_NODEJS: {
            EnvironmentConfiguration._allowUnsupportedNodeVersion = value === 'true';
            break;
          }

          case EnvironmentVariableNames.RUSH_PNPM_STORE_PATH: {
            EnvironmentConfiguration._pnpmStorePathOverride =
              value && !options.doNotNormalizePaths
                ? EnvironmentConfiguration._normalizeDeepestParentFolderPath(value) || value
                : value;
            break;
          }

          case EnvironmentVariableNames.RUSH_GLOBAL_FOLDER: {
            // Handled specially below
            break;
          }

          case EnvironmentVariableNames.RUSH_BUILD_CACHE_WRITE_CREDENTIAL: {
            EnvironmentConfiguration._buildCacheCredential = value;
            break;
          }

          case EnvironmentVariableNames.RUSH_GIT_BINARY_PATH: {
            EnvironmentConfiguration._gitBinaryPath = value;
            break;
          }

          case EnvironmentVariableNames.RUSH_PARALLELISM:
          case EnvironmentVariableNames.RUSH_PREVIEW_VERSION:
          case EnvironmentVariableNames.RUSH_VARIANT:
          case EnvironmentVariableNames.RUSH_DEPLOY_TARGET_FOLDER:
            // Handled by @microsoft/rush front end
            break;
          default:
            unknownEnvVariables.push(envVarName);
            break;
        }
      }
    }

    // This strictness intends to catch mistakes where variables are misspelled or not used correctly.
    if (unknownEnvVariables.length > 0) {
      throw new Error(
        'The following environment variables were found with the "RUSH_" prefix, but they are not ' +
          `recognized by this version of Rush: ${unknownEnvVariables.join(', ')}`
      );
    }

    // See doc comment for EnvironmentConfiguration._getRushGlobalFolderOverride().
    EnvironmentConfiguration._rushGlobalFolderOverride = EnvironmentConfiguration._getRushGlobalFolderOverride(
      process.env
    );

    EnvironmentConfiguration._hasBeenInitialized = true;
  }

  /**
   * Resets EnvironmentConfiguration into an un-initialized state.
   */
  public static reset(): void {
    EnvironmentConfiguration._rushTempFolderOverride = undefined;

    EnvironmentConfiguration._hasBeenInitialized = false;
  }

  private static _ensureInitialized(): void {
    if (!EnvironmentConfiguration._hasBeenInitialized) {
      throw new InternalError(
        'The EnvironmentConfiguration must be initialized before values can be accessed.'
      );
    }
  }

  /**
   * Given a path to a folder (that may or may not exist), normalize the path, including casing,
   * to the first existing parent folder in the path.
   *
   * If no existing path can be found (for example, if the root is a volume that doesn't exist),
   * this function returns undefined.
   *
   * @example
   * If the following path exists on disk: C:\Folder1\folder2\
   * _normalizeFirstExistingFolderPath('c:\\folder1\\folder2\\temp\\subfolder')
   * returns 'C:\\Folder1\\folder2\\temp\\subfolder'
   */
  private static _normalizeDeepestParentFolderPath(folderPath: string): string | undefined {
    folderPath = path.normalize(folderPath);
    const endsWithSlash: boolean = folderPath.charAt(folderPath.length - 1) === path.sep;
    const parsedPath: path.ParsedPath = path.parse(folderPath);
    const pathRoot: string = parsedPath.root;
    const pathWithoutRoot: string = parsedPath.dir.substr(pathRoot.length);
    const pathParts: string[] = [...pathWithoutRoot.split(path.sep), parsedPath.name].filter(
      (part) => !!part
    );

    // Starting with all path sections, and eliminating one from the end during each loop iteration,
    // run trueCasePathSync. If trueCasePathSync returns without exception, we've found a subset
    // of the path that exists and we've now gotten the correct casing.
    //
    // Once we've found a parent folder that exists, append the path sections that didn't exist.
    for (let i: number = pathParts.length; i >= 0; i--) {
      const constructedPath: string = path.join(pathRoot, ...pathParts.slice(0, i));
      try {
        const normalizedConstructedPath: string = trueCasePathSync(constructedPath);
        const result: string = path.join(normalizedConstructedPath, ...pathParts.slice(i));
        if (endsWithSlash) {
          return `${result}${path.sep}`;
        } else {
          return result;
        }
      } catch (e) {
        // This path doesn't exist, continue to the next subpath
      }
    }

    return undefined;
  }
}

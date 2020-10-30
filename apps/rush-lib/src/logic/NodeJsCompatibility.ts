// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import colors from 'colors';
import * as semver from 'semver';

import { RushConfiguration } from '../api/RushConfiguration';

/**
 * This constant is the major version of the next LTS node Node.js release. This constant should be updated when
 * a new LTS version is added to Rush's support matrix.
 */
const UPCOMING_NODE_LTS_VERSION: number = 14;
const nodeVersion: string = process.versions.node;
const nodeMajorVersion: number = semver.major(nodeVersion);

export interface IWarnAboutVersionTooNewOptions {
  isRushLib: boolean;
  alreadyReportedNodeTooNewError: boolean;
}

export interface IWarnAboutCompatibilityIssuesOptions extends IWarnAboutVersionTooNewOptions {
  rushConfiguration: RushConfiguration | undefined;
}

/**
 * This class provides useful functions for warning if the current Node.js runtime isn't supported.
 *
 * @internal
 */
export class NodeJsCompatibility {
  public static warnAboutCompatibilityIssues(options: IWarnAboutCompatibilityIssuesOptions): boolean {
    // Only show the first warning
    return (
      NodeJsCompatibility.warnAboutVersionTooOld() ||
      NodeJsCompatibility.warnAboutVersionTooNew(options) ||
      NodeJsCompatibility.warnAboutOddNumberedVersion() ||
      NodeJsCompatibility.warnAboutNonLtsVersion(options.rushConfiguration)
    );
  }

  public static warnAboutVersionTooOld(): boolean {
    if (semver.satisfies(nodeVersion, '< 8.9.0')) {
      // We are on an ancient version of Node.js that is known not to work with Rush
      console.error(
        colors.red(
          `Your version of Node.js (${nodeVersion}) is very old and incompatible with Rush. ` +
            `Please upgrade to the latest Long-Term Support (LTS) version.`
        )
      );

      return true;
    } else {
      return false;
    }
  }

  public static warnAboutVersionTooNew(options: IWarnAboutVersionTooNewOptions): boolean {
    if (!options.alreadyReportedNodeTooNewError && nodeMajorVersion >= UPCOMING_NODE_LTS_VERSION + 1) {
      // We are on a much newer release than we have tested and support
      if (options.isRushLib) {
        console.warn(
          colors.yellow(
            `Your version of Node.js (${nodeVersion}) has not been tested with this release ` +
              `of the Rush engine. Please consider upgrading the "rushVersion" setting in rush.json, ` +
              `or downgrading Node.js.`
          )
        );
      } else {
        console.warn(
          colors.yellow(
            `Your version of Node.js (${nodeVersion}) has not been tested with this release ` +
              `of Rush. Please consider installing a newer version of the "@microsoft/rush" ` +
              `package, or downgrading Node.js.`
          )
        );
      }

      return true;
    } else {
      return false;
    }
  }

  public static warnAboutNonLtsVersion(rushConfiguration: RushConfiguration | undefined): boolean {
    if (rushConfiguration && !rushConfiguration.suppressNodeLtsWarning && !NodeJsCompatibility.isLtsVersion) {
      console.warn(
        colors.yellow(
          `Your version of Node.js (${nodeVersion}) is not a Long-Term Support (LTS) release. ` +
            'These versions frequently have bugs. Please consider installing a stable release.'
        )
      );

      return true;
    } else {
      return false;
    }
  }

  public static warnAboutOddNumberedVersion(): boolean {
    if (NodeJsCompatibility.isOddNumberedVersion) {
      console.warn(
        colors.yellow(
          `Your version of Node.js (${nodeVersion}) is an odd-numbered release. ` +
            `These releases frequently have bugs. Please consider installing a Long Term Support (LTS) ` +
            `version instead.`
        )
      );

      return true;
    } else {
      return false;
    }
  }

  public static get isLtsVersion(): boolean {
    return !!process.release.lts;
  }

  public static get isOddNumberedVersion(): boolean {
    return nodeMajorVersion % 2 !== 0;
  }
}

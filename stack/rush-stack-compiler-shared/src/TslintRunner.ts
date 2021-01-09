// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';
import { ITerminalProvider } from '@rushstack/node-core-library';

import { CmdRunner } from './CmdRunner';
import { ToolPaths } from './ToolPaths';
import { Tslint } from './index';
import { ILintRunnerConfig } from './ILintRunnerConfig';
import { RushStackCompilerBase, WriteFileIssueFunction } from './RushStackCompilerBase';

/**
 * @public
 */
export interface ITslintRunnerConfig extends ILintRunnerConfig {}

/**
 * @beta
 */
export class TslintRunner extends RushStackCompilerBase<ITslintRunnerConfig> {
  private _cmdRunner: CmdRunner;

  public constructor(
    taskOptions: ITslintRunnerConfig,
    rootPath: string,
    terminalProvider: ITerminalProvider
  ) {
    super(taskOptions, rootPath, terminalProvider);
    this._cmdRunner = new CmdRunner(this._standardBuildFolders, this._terminal, {
      packagePath: ToolPaths.tslintPackagePath,
      packageJson: ToolPaths.tslintPackageJson,
      packageBinPath: path.join('bin', 'tslint')
    });
  }

  public invoke(): Promise<void> {
    const args: string[] = ['--format', 'json', '--project', this._standardBuildFolders.projectFolderPath];

    return this._cmdRunner.runCmdAsync({
      args: args,
      onData: (data: Buffer) => {
        const dataStr: string = data.toString().trim();
        const tslintErrorLogFn: WriteFileIssueFunction = this._taskOptions.displayAsError
          ? this._taskOptions.fileError
          : this._taskOptions.fileWarning;

        // TSLint errors are logged to stdout
        try {
          const errors: Tslint.IRuleFailureJson[] = JSON.parse(dataStr);
          for (const error of errors) {
            const pathFromRoot: string = path.relative(
              this._standardBuildFolders.projectFolderPath,
              error.name
            );
            tslintErrorLogFn(
              pathFromRoot,
              error.startPosition.line + 1,
              error.startPosition.character + 1,
              error.ruleName,
              error.failure
            );
          }
        } catch (e) {
          // If we fail to parse the JSON, it's likely TSLint encountered an error parsing the config file,
          // or it experienced an inner error. In this case, log the output as an error regardless of the
          // displayAsError value
          this._terminal.writeErrorLine(dataStr);
        }
      },
      onClose: (code: number, hasErrors: boolean, resolve: () => void, reject: (error: Error) => void) => {
        if (this._taskOptions.displayAsError && (code !== 0 || hasErrors)) {
          reject(new Error(`exited with code ${code}`));
        } else {
          resolve();
        }
      }
    });
  }
}

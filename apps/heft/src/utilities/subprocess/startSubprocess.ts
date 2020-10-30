// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import {
  SubprocessRunnerBase,
  ISubprocessInnerConfiguration,
  SUBPROCESS_RUNNER_CLASS_LABEL,
  SUBPROCESS_RUNNER_INNER_INVOKE
} from './SubprocessRunnerBase';

const [
  ,
  ,
  subprocessModulePath,
  serializedInnerConfiguration,
  serializedSubprocessConfiguration
] = process.argv;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subprocessRunnerModule: any = require(subprocessModulePath);
const subprocessRunnerModuleExports: string[] = Object.getOwnPropertyNames(subprocessRunnerModule).filter(
  (exportName) => exportName !== '__esModule'
);
if (subprocessRunnerModuleExports.length !== 1) {
  throw new Error(
    `The provided subprocess module path (${subprocessModulePath}) must only have a single value exported.`
  );
}

declare class SubprocessRunnerSubclass extends SubprocessRunnerBase<object> {
  public filename: string;
  public invokeAsync(): Promise<void>;
}

const SubprocessRunnerClass: typeof SubprocessRunnerSubclass =
  subprocessRunnerModule[subprocessRunnerModuleExports[0]];
if (!SubprocessRunnerClass[SUBPROCESS_RUNNER_CLASS_LABEL]) {
  throw new Error(
    `The provided subprocess module path (${subprocessModulePath}) does not extend from the ` +
      'SubprocessRunnerBase class.'
  );
}

const innerConfiguration: ISubprocessInnerConfiguration = JSON.parse(serializedInnerConfiguration);
const subprocessConfiguration: object = JSON.parse(serializedSubprocessConfiguration);

const subprocessRunner: SubprocessRunnerSubclass = SubprocessRunnerClass.initializeSubprocess(
  SubprocessRunnerClass,
  innerConfiguration,
  subprocessConfiguration
);

subprocessRunner[SUBPROCESS_RUNNER_INNER_INVOKE].call(subprocessRunner).catch(console.error);

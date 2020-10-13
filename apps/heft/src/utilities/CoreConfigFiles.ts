// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';
import {
  ConfigurationFile,
  IConfigurationFileOptions,
  InheritanceType,
  PathResolutionMethod
} from '@rushstack/heft-config-file';

import { IApiExtractorPluginConfiguration } from '../plugins/ApiExtractorPlugin/ApiExtractorPlugin';
import { ITypeScriptConfigurationJson } from '../plugins/TypeScriptPlugin/TypeScriptPlugin';
import { HeftConfiguration } from '../configuration/HeftConfiguration';
import { Terminal } from '@rushstack/node-core-library';
import { ISharedCopyStaticAssetsConfiguration } from '../plugins/CopyStaticAssetsPlugin';
import { ISassConfigurationJson } from '../plugins/SassTypingsPlugin/SassTypingsPlugin';

export enum HeftEvent {
  clean = 'clean',
  preCompile = 'pre-compile',
  compile = 'compile',
  bundle = 'bundle',
  postBuild = 'post-build'
}

export interface IHeftConfigurationJsonEventActionBase {
  actionKind: string;
  heftEvent: 'clean' | 'pre-compile' | 'compile' | 'bundle' | 'post-build';
  actionId: string;
}

export interface IHeftConfigurationDeleteGlobsEventAction extends IHeftConfigurationJsonEventActionBase {
  actionKind: 'deleteGlobs';
  globsToDelete: string[];
}

export interface IHeftConfigurationJsonPluginSpecifier {
  plugin: string;
  options?: object;
}

export interface IHeftConfigurationJson {
  eventActions?: IHeftConfigurationJsonEventActionBase[];
  heftPlugins?: IHeftConfigurationJsonPluginSpecifier[];
}

export interface IHeftEventActions {
  deleteGlobs: Map<HeftEvent, IHeftConfigurationDeleteGlobsEventAction[]>;
}

export class CoreConfigFiles {
  private static _heftConfigFileLoader: ConfigurationFile<IHeftConfigurationJson> | undefined;

  private static _heftConfigFileEventActionsCache: Map<HeftConfiguration, IHeftEventActions> = new Map<
    HeftConfiguration,
    IHeftEventActions
  >();

  private static _apiExtractorTaskConfigurationLoader:
    | ConfigurationFile<IApiExtractorPluginConfiguration>
    | undefined;
  private static _typeScriptConfigurationFileLoader:
    | ConfigurationFile<ITypeScriptConfigurationJson>
    | undefined;
  private static _sassConfigurationFileLoader: ConfigurationFile<ISassConfigurationJson> | undefined;

  /**
   * Returns the loader for the `config/heft.json` config file.
   */
  public static get heftConfigFileLoader(): ConfigurationFile<IHeftConfigurationJson> {
    if (!CoreConfigFiles._heftConfigFileLoader) {
      const schemaPath: string = path.join(__dirname, '..', 'schemas', 'heft.schema.json');
      CoreConfigFiles._heftConfigFileLoader = new ConfigurationFile<IHeftConfigurationJson>({
        projectRelativeFilePath: 'config/heft.json',
        jsonSchemaPath: schemaPath,
        propertyInheritance: {
          heftPlugins: {
            inheritanceType: InheritanceType.append
          }
        },
        jsonPathMetadata: {
          '$.heftPlugins.*.plugin': {
            pathResolutionMethod: PathResolutionMethod.NodeResolve
          }
        }
      });
    }

    return CoreConfigFiles._heftConfigFileLoader;
  }

  /**
   * Gets the eventActions from config/heft.json
   */
  public static async getConfigConfigFileEventActionsAsync(
    terminal: Terminal,
    heftConfiguration: HeftConfiguration
  ): Promise<IHeftEventActions> {
    let result: IHeftEventActions | undefined = CoreConfigFiles._heftConfigFileEventActionsCache.get(
      heftConfiguration
    );
    if (!result) {
      const heftConfigJson:
        | IHeftConfigurationJson
        | undefined = await CoreConfigFiles.heftConfigFileLoader.tryLoadConfigurationFileForProjectAsync(
        terminal,
        heftConfiguration.buildFolder,
        heftConfiguration.rigConfig
      );

      result = {
        deleteGlobs: new Map<HeftEvent, IHeftConfigurationDeleteGlobsEventAction[]>()
      };
      CoreConfigFiles._heftConfigFileEventActionsCache.set(heftConfiguration, result);

      for (const eventAction of heftConfigJson?.eventActions || []) {
        switch (eventAction.actionKind) {
          case 'deleteGlobs': {
            CoreConfigFiles._addEventActionToMap(
              eventAction as IHeftConfigurationDeleteGlobsEventAction,
              result.deleteGlobs
            );
            break;
          }

          default: {
            throw new Error(
              `Unknown heft eventAction actionKind "${eventAction.actionKind}" in ` +
                `"${CoreConfigFiles.heftConfigFileLoader.getObjectSourceFilePath(eventAction)}" `
            );
          }
        }
      }
    }

    return result;
  }

  /**
   * Returns the loader for the `config/api-extractor-task.json` config file.
   */
  public static get apiExtractorTaskConfigurationLoader(): ConfigurationFile<
    IApiExtractorPluginConfiguration
  > {
    if (!CoreConfigFiles._apiExtractorTaskConfigurationLoader) {
      const schemaPath: string = path.resolve(__dirname, '..', 'schemas', 'api-extractor-task.schema.json');
      CoreConfigFiles._apiExtractorTaskConfigurationLoader = new ConfigurationFile<
        IApiExtractorPluginConfiguration
      >({
        projectRelativeFilePath: 'config/api-extractor-task.json',
        jsonSchemaPath: schemaPath
      });
    }

    return CoreConfigFiles._apiExtractorTaskConfigurationLoader;
  }

  /**
   * Returns the loader for the `config/typescript.json` config file.
   */
  public static get typeScriptConfigurationFileLoader(): ConfigurationFile<ITypeScriptConfigurationJson> {
    if (!CoreConfigFiles._typeScriptConfigurationFileLoader) {
      const schemaPath: string = path.resolve(__dirname, '..', 'schemas', 'typescript.schema.json');
      CoreConfigFiles._typeScriptConfigurationFileLoader = new ConfigurationFile<
        ITypeScriptConfigurationJson
      >({
        projectRelativeFilePath: 'config/typescript.json',
        jsonSchemaPath: schemaPath,
        propertyInheritance: {
          staticAssetsToCopy: {
            inheritanceType: InheritanceType.custom,
            inheritanceFunction: (
              currentObject: ISharedCopyStaticAssetsConfiguration,
              parentObject: ISharedCopyStaticAssetsConfiguration
            ): ISharedCopyStaticAssetsConfiguration => {
              const result: ISharedCopyStaticAssetsConfiguration = {};

              if (currentObject.fileExtensions && parentObject.fileExtensions) {
                result.fileExtensions = [...currentObject.fileExtensions, ...parentObject.fileExtensions];
              } else {
                result.fileExtensions = currentObject.fileExtensions || parentObject.fileExtensions;
              }

              if (currentObject.includeGlobs && parentObject.includeGlobs) {
                result.includeGlobs = [...currentObject.includeGlobs, ...parentObject.includeGlobs];
              } else {
                result.includeGlobs = currentObject.includeGlobs || parentObject.includeGlobs;
              }

              if (currentObject.excludeGlobs && parentObject.excludeGlobs) {
                result.excludeGlobs = [...currentObject.excludeGlobs, ...parentObject.excludeGlobs];
              } else {
                result.excludeGlobs = currentObject.excludeGlobs || parentObject.excludeGlobs;
              }

              return result;
            }
          }
        }
      } as IConfigurationFileOptions<ITypeScriptConfigurationJson>);
    }

    return CoreConfigFiles._typeScriptConfigurationFileLoader;
  }

  public static get sassConfigurationFileLoader(): ConfigurationFile<ISassConfigurationJson> {
    const schemaPath: string = path.resolve(__dirname, '..', 'schemas', 'sass.schema.json');
    CoreConfigFiles._sassConfigurationFileLoader = new ConfigurationFile<ISassConfigurationJson>({
      projectRelativeFilePath: 'config/sass.json',
      jsonSchemaPath: schemaPath,
      jsonPathMetadata: {
        '$.includePaths.*': {
          pathResolutionMethod: PathResolutionMethod.resolvePathRelativeToProjectRoot
        },
        '$.generatedTsFolder.*': {
          pathResolutionMethod: PathResolutionMethod.resolvePathRelativeToProjectRoot
        },
        '$.srcFolder.*': {
          pathResolutionMethod: PathResolutionMethod.resolvePathRelativeToProjectRoot
        }
      }
    });

    return CoreConfigFiles._sassConfigurationFileLoader;
  }

  private static _addEventActionToMap<TEventAction extends IHeftConfigurationJsonEventActionBase>(
    eventAction: TEventAction,
    map: Map<HeftEvent, TEventAction[]>
  ): void {
    const heftEvent: HeftEvent = CoreConfigFiles._parseHeftEvent(eventAction);
    let eventArray: TEventAction[] | undefined = map.get(heftEvent);
    if (!eventArray) {
      eventArray = [];
      map.set(heftEvent, eventArray);
    }

    eventArray.push(eventAction);
  }

  private static _parseHeftEvent(eventAction: IHeftConfigurationJsonEventActionBase): HeftEvent {
    switch (eventAction.heftEvent) {
      case 'clean':
        return HeftEvent.clean;

      case 'pre-compile':
        return HeftEvent.preCompile;

      case 'compile':
        return HeftEvent.compile;

      case 'bundle':
        return HeftEvent.bundle;

      case 'post-build':
        return HeftEvent.postBuild;

      default:
        throw new Error(
          `Unknown heft event "${eventAction.heftEvent}" in ` +
            ` "${CoreConfigFiles.heftConfigFileLoader.getObjectSourceFilePath(eventAction)}".`
        );
    }
  }
}

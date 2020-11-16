// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as nodeJsPath from 'path';
import * as fs from 'fs';
import * as fsx from 'fs-extra';

import { Text, NewlineKind, Encoding } from './Text';
import { PosixModeBits } from './PosixModeBits';

/**
 * An alias for the Node.js `fs.Stats` object.
 *
 * @remarks
 * This avoids the need to import the `fs` package when using the {@link FileSystem} API.
 * @public
 */
export type FileSystemStats = fs.Stats;

// The PosixModeBits are intended to be used with bitwise operations.
/* eslint-disable no-bitwise */

/**
 * The options for {@link FileSystem.readFolder}
 * @public
 */
export interface IFileSystemReadFolderOptions {
  /**
   * If true, returns the absolute paths of the files in the folder.
   * @defaultValue false
   */
  absolutePaths?: boolean;
}

/**
 * The options for {@link FileSystem.writeFile}
 * @public
 */
export interface IFileSystemWriteFileOptions {
  /**
   * If true, will ensure the folder is created before writing the file.
   * @defaultValue false
   */
  ensureFolderExists?: boolean;

  /**
   * If specified, will normalize line endings to the specified style of newline.
   * @defaultValue `undefined` which means no conversion will be performed
   */
  convertLineEndings?: NewlineKind;

  /**
   * If specified, will change the encoding of the file that will be written.
   * @defaultValue "utf8"
   */
  encoding?: Encoding;
}

/**
 * The options for {@link FileSystem.readFile}
 * @public
 */
export interface IFileSystemReadFileOptions {
  /**
   * If specified, will change the encoding of the file that will be written.
   * @defaultValue Encoding.Utf8
   */
  encoding?: Encoding;

  /**
   * If specified, will normalize line endings to the specified style of newline.
   * @defaultValue `undefined` which means no conversion will be performed
   */
  convertLineEndings?: NewlineKind;
}

/**
 * The options for {@link FileSystem.move}
 * @public
 */
export interface IFileSystemMoveOptions {
  /**
   * The path of the existing object to be moved.
   * The path may be absolute or relative.
   */
  sourcePath: string;

  /**
   * The new path for the object.
   * The path may be absolute or relative.
   */
  destinationPath: string;

  /**
   * If true, will overwrite the file if it already exists.
   * @defaultValue true
   */
  overwrite?: boolean;

  /**
   * If true, will ensure the folder is created before writing the file.
   * @defaultValue false
   */
  ensureFolderExists?: boolean;
}

/**
 * @public
 */
export interface IFileSystemCopyFileBaseOptions {
  /**
   * The path of the existing object to be copied.
   * The path may be absolute or relative.
   */
  sourcePath: string;

  /**
   * Specifies what to do if the target object already exists.
   * @defaultValue {@link AlreadyExistsBehavior.Overwrite}
   */
  alreadyExistsBehavior?: AlreadyExistsBehavior;
}

/**
 * The options for {@link FileSystem.copyFile}
 * @public
 */
export interface IFileSystemCopyFileOptions extends IFileSystemCopyFileBaseOptions {
  /**
   * The path that the object will be copied to.
   * The path may be absolute or relative.
   */
  destinationPath: string;
}

/**
 * The options for {@link FileSystem.copyFile}
 * @public
 */
export interface IFileSystemCopyFileToManyOptions extends IFileSystemCopyFileBaseOptions {
  /**
   * The path that the object will be copied to.
   * The path may be absolute or relative.
   */
  destinationPaths: string[];
}

/**
 * Specifies the behavior of {@link FileSystem.copyFiles} in a situation where the target object
 * already exists.
 * @public
 */
export const enum AlreadyExistsBehavior {
  /**
   * If the destination object exists, overwrite it.
   * This is the default behavior for {@link FileSystem.copyFiles}.
   */
  Overwrite = 'overwrite',

  /**
   * If the destination object exists, report an error.
   */
  Error = 'error',

  /**
   * If the destination object exists, skip it and continue the operation.
   */
  Ignore = 'ignore'
}

/**
 * Callback function type for {@link IFileSystemCopyFilesAsyncOptions.filter}
 * @public
 */
export type FileSystemCopyFilesAsyncFilter = (
  sourcePath: string,
  destinationPath: string
) => Promise<boolean>;

/**
 * Callback function type for {@link IFileSystemCopyFilesOptions.filter}
 * @public
 */
export type FileSystemCopyFilesFilter = (sourcePath: string, destinationPath: string) => boolean;

/**
 * The options for {@link FileSystem.copyFilesAsync}
 * @public
 */
export interface IFileSystemCopyFilesAsyncOptions {
  /**
   * The starting path of the file or folder to be copied.
   * The path may be absolute or relative.
   */
  sourcePath: string;

  /**
   * The path that the files will be copied to.
   * The path may be absolute or relative.
   */
  destinationPath: string;

  /**
   * If true, then when copying symlinks, copy the target object instead of copying the link.
   */
  dereferenceSymlinks?: boolean;

  /**
   * Specifies what to do if the target object already exists.
   */
  alreadyExistsBehavior?: AlreadyExistsBehavior;

  /**
   * If true, then the target object will be assigned "last modification" and "last access" timestamps
   * that are the same as the source.  Otherwise, the OS default timestamps are assigned.
   */
  preserveTimestamps?: boolean;

  /**
   * A callback that will be invoked for each path that is copied.  The callback can return `false`
   * to cause the object to be excluded from the operation.
   */
  filter?: FileSystemCopyFilesAsyncFilter | FileSystemCopyFilesFilter;
}

/**
 * The options for {@link FileSystem.copyFiles}
 * @public
 */
export interface IFileSystemCopyFilesOptions extends IFileSystemCopyFilesAsyncOptions {
  /**  {@inheritdoc IFileSystemCopyFilesAsyncOptions.filter} */
  filter?: FileSystemCopyFilesFilter; // narrow the type to exclude FileSystemCopyFilesAsyncFilter
}

/**
 * The options for {@link FileSystem.deleteFile}
 * @public
 */
export interface IFileSystemDeleteFileOptions {
  /**
   * If true, will throw an exception if the file did not exist before `deleteFile()` was called.
   * @defaultValue false
   */
  throwIfNotExists?: boolean;
}

/**
 * The options for {@link FileSystem.updateTimes}
 * Both times must be specified.
 * @public
 */
export interface IFileSystemUpdateTimeParameters {
  /**
   * The POSIX epoch time or Date when this was last accessed.
   */
  accessedTime: number | Date;

  /**
   * The POSIX epoch time or Date when this was last modified
   */
  modifiedTime: number | Date;
}

/**
 * The options for {@link FileSystem.createSymbolicLinkJunction}, {@link FileSystem.createSymbolicLinkFile},
 * {@link FileSystem.createSymbolicLinkFolder}, and {@link FileSystem.createHardLink}.
 *
 * @public
 */
export interface IFileSystemCreateLinkOptions {
  /**
   * The existing path that the symbolic link will point to.
   */
  linkTargetPath: string;

  /**
   * The new path for the new symlink link to be created.
   */
  newLinkPath: string;

  /**
   * Specifies what to do if the target object already exists. Defaults to `AlreadyExistsBehavior.Error`.
   */
  alreadyExistsBehavior?: AlreadyExistsBehavior;
}

const MOVE_DEFAULT_OPTIONS: Partial<IFileSystemMoveOptions> = {
  overwrite: true,
  ensureFolderExists: false
};

const READ_FOLDER_DEFAULT_OPTIONS: Partial<IFileSystemReadFolderOptions> = {
  absolutePaths: false
};

const WRITE_FILE_DEFAULT_OPTIONS: Partial<IFileSystemWriteFileOptions> = {
  ensureFolderExists: false,
  convertLineEndings: undefined,
  encoding: Encoding.Utf8
};

const APPEND_TO_FILE_DEFAULT_OPTIONS: Partial<IFileSystemWriteFileOptions> = {
  ...WRITE_FILE_DEFAULT_OPTIONS
};

const READ_FILE_DEFAULT_OPTIONS: Partial<IFileSystemReadFileOptions> = {
  encoding: Encoding.Utf8,
  convertLineEndings: undefined
};

const COPY_FILE_DEFAULT_OPTIONS: Partial<IFileSystemCopyFileOptions> = {
  alreadyExistsBehavior: AlreadyExistsBehavior.Overwrite
};

const COPY_FILES_DEFAULT_OPTIONS: Partial<IFileSystemCopyFilesOptions> = {
  alreadyExistsBehavior: AlreadyExistsBehavior.Overwrite
};

const DELETE_FILE_DEFAULT_OPTIONS: Partial<IFileSystemDeleteFileOptions> = {
  throwIfNotExists: false
};

/**
 * The FileSystem API provides a complete set of recommended operations for interacting with the file system.
 *
 * @remarks
 * We recommend to use this instead of the native `fs` API, because `fs` is a minimal set of low-level
 * primitives that must be mapped for each supported operating system. The FileSystem API takes a
 * philosophical approach of providing "one obvious way" to do each operation. We also prefer synchronous
 * operations except in cases where there would be a clear performance benefit for using async, since synchronous
 * code is much easier to read and debug. Also, indiscriminate parallelism has been seen to actually worsen
 * performance, versus improving it.
 *
 * Note that in the documentation, we refer to "filesystem objects", this can be a
 * file, folder, symbolic link, hard link, directory junction, etc.
 *
 * @public
 */
export class FileSystem {
  // ===============
  // COMMON OPERATIONS
  // ===============

  /**
   * Returns true if the path exists on disk.
   * Behind the scenes it uses `fs.existsSync()`.
   * @remarks
   * There is a debate about the fact that after `fs.existsSync()` returns true,
   * the file might be deleted before fs.readSync() is called, which would imply that everybody
   * should catch a `readSync()` exception, and nobody should ever use `fs.existsSync()`.
   * We find this to be unpersuasive, since "unexceptional exceptions" really hinder the
   * break-on-exception debugging experience. Also, throwing/catching is generally slow.
   * @param path - The absolute or relative path to the filesystem object.
   */
  public static exists(path: string): boolean {
    return FileSystem._wrapException(() => {
      return fsx.existsSync(path);
    });
  }

  /**
   * An async version of {@link FileSystem.exists}.
   */
  public static async existsAsync(path: string): Promise<boolean> {
    return await FileSystem._wrapExceptionAsync(() => {
      return new Promise<boolean>((resolve: (result: boolean) => void) => {
        fsx.exists(path, resolve);
      });
    });
  }

  /**
   * Gets the statistics for a particular filesystem object.
   * If the path is a link, this function follows the link and returns statistics about the link target.
   * Behind the scenes it uses `fs.statSync()`.
   * @param path - The absolute or relative path to the filesystem object.
   */
  public static getStatistics(path: string): FileSystemStats {
    return FileSystem._wrapException(() => {
      return fsx.statSync(path);
    });
  }

  /**
   * An async version of {@link FileSystem.getStatistics}.
   */
  public static async getStatisticsAsync(path: string): Promise<FileSystemStats> {
    return await FileSystem._wrapExceptionAsync(() => {
      return fsx.stat(path);
    });
  }

  /**
   * Updates the accessed and modified timestamps of the filesystem object referenced by path.
   * Behind the scenes it uses `fs.utimesSync()`.
   * The caller should specify both times in the `times` parameter.
   * @param path - The path of the file that should be modified.
   * @param times - The times that the object should be updated to reflect.
   */
  public static updateTimes(path: string, times: IFileSystemUpdateTimeParameters): void {
    return FileSystem._wrapException(() => {
      fsx.utimesSync(path, times.accessedTime, times.modifiedTime);
    });
  }

  /**
   * An async version of {@link FileSystem.updateTimes}.
   */
  public static async updateTimesAsync(path: string, times: IFileSystemUpdateTimeParameters): Promise<void> {
    await FileSystem._wrapExceptionAsync(() => {
      // This cast is needed because the fs-extra typings require both parameters
      // to have the same type (number or Date), whereas Node.js does not require that.
      return fsx.utimes(path, times.accessedTime as number, times.modifiedTime as number);
    });
  }

  /**
   * Changes the permissions (i.e. file mode bits) for a filesystem object.
   * Behind the scenes it uses `fs.chmodSync()`.
   * @param path - The absolute or relative path to the object that should be updated.
   * @param modeBits - POSIX-style file mode bits specified using the {@link PosixModeBits} enum
   */
  public static changePosixModeBits(path: string, mode: PosixModeBits): void {
    FileSystem._wrapException(() => {
      fs.chmodSync(path, mode);
    });
  }

  /**
   * An async version of {@link FileSystem.changePosixModeBits}.
   */
  public static async changePosixModeBitsAsync(path: string, mode: PosixModeBits): Promise<void> {
    await FileSystem._wrapExceptionAsync(() => {
      return fsx.chmod(path, mode);
    });
  }

  /**
   * Retrieves the permissions (i.e. file mode bits) for a filesystem object.
   * Behind the scenes it uses `fs.chmodSync()`.
   * @param path - The absolute or relative path to the object that should be updated.
   *
   * @remarks
   * This calls {@link FileSystem.getStatistics} to get the POSIX mode bits.
   * If statistics in addition to the mode bits are needed, it is more efficient
   * to call {@link FileSystem.getStatistics} directly instead.
   */
  public static getPosixModeBits(path: string): PosixModeBits {
    return FileSystem._wrapException(() => {
      return FileSystem.getStatistics(path).mode;
    });
  }

  /**
   * An async version of {@link FileSystem.getPosixModeBits}.
   */
  public static async getPosixModeBitsAsync(path: string): Promise<PosixModeBits> {
    return await FileSystem._wrapExceptionAsync(async () => {
      return (await FileSystem.getStatisticsAsync(path)).mode;
    });
  }

  /**
   * Returns a 10-character string representation of a PosixModeBits value similar to what
   * would be displayed by a command such as "ls -l" on a POSIX-like operating system.
   * @remarks
   * For example, `PosixModeBits.AllRead | PosixModeBits.AllWrite` would be formatted as "-rw-rw-rw-".
   * @param modeBits - POSIX-style file mode bits specified using the {@link PosixModeBits} enum
   */
  public static formatPosixModeBits(modeBits: PosixModeBits): string {
    let result: string = '-'; // (later we may add support for additional states such as S_IFDIR or S_ISUID)

    result += modeBits & PosixModeBits.UserRead ? 'r' : '-';
    result += modeBits & PosixModeBits.UserWrite ? 'w' : '-';
    result += modeBits & PosixModeBits.UserExecute ? 'x' : '-';

    result += modeBits & PosixModeBits.GroupRead ? 'r' : '-';
    result += modeBits & PosixModeBits.GroupWrite ? 'w' : '-';
    result += modeBits & PosixModeBits.GroupExecute ? 'x' : '-';

    result += modeBits & PosixModeBits.OthersRead ? 'r' : '-';
    result += modeBits & PosixModeBits.OthersWrite ? 'w' : '-';
    result += modeBits & PosixModeBits.OthersExecute ? 'x' : '-';

    return result;
  }

  /**
   * Moves a file. The folder must exist, unless the `ensureFolderExists` option is provided.
   * Behind the scenes it uses `fs-extra.moveSync()`
   */
  public static move(options: IFileSystemMoveOptions): void {
    FileSystem._wrapException(() => {
      options = {
        ...MOVE_DEFAULT_OPTIONS,
        ...options
      };

      try {
        fsx.moveSync(options.sourcePath, options.destinationPath, { overwrite: options.overwrite });
      } catch (error) {
        if (options.ensureFolderExists) {
          if (!FileSystem.isNotExistError(error)) {
            throw error;
          }

          const folderPath: string = nodeJsPath.dirname(options.destinationPath);
          FileSystem.ensureFolder(folderPath);
          fsx.moveSync(options.sourcePath, options.destinationPath, { overwrite: options.overwrite });
        } else {
          throw error;
        }
      }
    });
  }

  /**
   * An async version of {@link FileSystem.move}.
   */
  public static async moveAsync(options: IFileSystemMoveOptions): Promise<void> {
    await FileSystem._wrapExceptionAsync(async () => {
      options = {
        ...MOVE_DEFAULT_OPTIONS,
        ...options
      };

      try {
        await fsx.move(options.sourcePath, options.destinationPath, { overwrite: options.overwrite });
      } catch (error) {
        if (options.ensureFolderExists) {
          if (!FileSystem.isNotExistError(error)) {
            throw error;
          }

          const folderPath: string = nodeJsPath.dirname(options.destinationPath);
          await FileSystem.ensureFolderAsync(nodeJsPath.dirname(folderPath));
          await fsx.move(options.sourcePath, options.destinationPath, { overwrite: options.overwrite });
        } else {
          throw error;
        }
      }
    });
  }

  // ===============
  // FOLDER OPERATIONS
  // ===============

  /**
   * Recursively creates a folder at a given path.
   * Behind the scenes is uses `fs-extra.ensureDirSync()`.
   * @remarks
   * Throws an exception if anything in the folderPath is not a folder.
   * @param folderPath - The absolute or relative path of the folder which should be created.
   */
  public static ensureFolder(folderPath: string): void {
    FileSystem._wrapException(() => {
      fsx.ensureDirSync(folderPath);
    });
  }

  /**
   * An async version of {@link FileSystem.ensureFolder}.
   */
  public static async ensureFolderAsync(folderPath: string): Promise<void> {
    await FileSystem._wrapExceptionAsync(() => {
      return fsx.ensureDir(folderPath);
    });
  }

  /**
   * Reads the contents of the folder, not including "." or "..".
   * Behind the scenes it uses `fs.readdirSync()`.
   * @param folderPath - The absolute or relative path to the folder which should be read.
   * @param options - Optional settings that can change the behavior. Type: `IReadFolderOptions`
   */
  public static readFolder(folderPath: string, options?: IFileSystemReadFolderOptions): string[] {
    return FileSystem._wrapException(() => {
      options = {
        ...READ_FOLDER_DEFAULT_OPTIONS,
        ...options
      };

      // @todo: Update this to use Node 10's `withFileTypes: true` option when we drop support for Node 8
      const fileNames: string[] = fsx.readdirSync(folderPath);
      if (options.absolutePaths) {
        return fileNames.map((fileName) => nodeJsPath.resolve(folderPath, fileName));
      } else {
        return fileNames;
      }
    });
  }

  /**
   * An async version of {@link FileSystem.readFolder}.
   */
  public static async readFolderAsync(
    folderPath: string,
    options?: IFileSystemReadFolderOptions
  ): Promise<string[]> {
    return await FileSystem._wrapExceptionAsync(async () => {
      options = {
        ...READ_FOLDER_DEFAULT_OPTIONS,
        ...options
      };

      // @todo: Update this to use Node 10's `withFileTypes: true` option when we drop support for Node 8
      const fileNames: string[] = await fsx.readdir(folderPath);
      if (options.absolutePaths) {
        return fileNames.map((fileName) => nodeJsPath.resolve(folderPath, fileName));
      } else {
        return fileNames;
      }
    });
  }

  /**
   * Deletes a folder, including all of its contents.
   * Behind the scenes is uses `fs-extra.removeSync()`.
   * @remarks
   * Does not throw if the folderPath does not exist.
   * @param folderPath - The absolute or relative path to the folder which should be deleted.
   */
  public static deleteFolder(folderPath: string): void {
    FileSystem._wrapException(() => {
      fsx.removeSync(folderPath);
    });
  }

  /**
   * An async version of {@link FileSystem.deleteFolder}.
   */
  public static async deleteFolderAsync(folderPath: string): Promise<void> {
    await FileSystem._wrapExceptionAsync(() => {
      return fsx.remove(folderPath);
    });
  }

  /**
   * Deletes the content of a folder, but not the folder itself. Also ensures the folder exists.
   * Behind the scenes it uses `fs-extra.emptyDirSync()`.
   * @remarks
   * This is a workaround for a common race condition, where the virus scanner holds a lock on the folder
   * for a brief period after it was deleted, causing EBUSY errors for any code that tries to recreate the folder.
   * @param folderPath - The absolute or relative path to the folder which should have its contents deleted.
   */
  public static ensureEmptyFolder(folderPath: string): void {
    FileSystem._wrapException(() => {
      fsx.emptyDirSync(folderPath);
    });
  }

  /**
   * An async version of {@link FileSystem.ensureEmptyFolder}.
   */
  public static async ensureEmptyFolderAsync(folderPath: string): Promise<void> {
    await FileSystem._wrapExceptionAsync(() => {
      return fsx.emptyDir(folderPath);
    });
  }

  // ===============
  // FILE OPERATIONS
  // ===============

  /**
   * Writes a text string to a file on disk, overwriting the file if it already exists.
   * Behind the scenes it uses `fs.writeFileSync()`.
   * @remarks
   * Throws an error if the folder doesn't exist, unless ensureFolder=true.
   * @param filePath - The absolute or relative path of the file.
   * @param contents - The text that should be written to the file.
   * @param options - Optional settings that can change the behavior. Type: `IWriteFileOptions`
   */
  public static writeFile(
    filePath: string,
    contents: string | Buffer,
    options?: IFileSystemWriteFileOptions
  ): void {
    FileSystem._wrapException(() => {
      options = {
        ...WRITE_FILE_DEFAULT_OPTIONS,
        ...options
      };

      if (options.convertLineEndings) {
        contents = Text.convertTo(contents.toString(), options.convertLineEndings);
      }

      try {
        fsx.writeFileSync(filePath, contents, { encoding: options.encoding });
      } catch (error) {
        if (options.ensureFolderExists) {
          if (!FileSystem.isNotExistError(error)) {
            throw error;
          }

          const folderPath: string = nodeJsPath.dirname(filePath);
          FileSystem.ensureFolder(folderPath);
          fsx.writeFileSync(filePath, contents, { encoding: options.encoding });
        } else {
          throw error;
        }
      }
    });
  }

  /**
   * An async version of {@link FileSystem.writeFile}.
   */
  public static async writeFileAsync(
    filePath: string,
    contents: string | Buffer,
    options?: IFileSystemWriteFileOptions
  ): Promise<void> {
    await FileSystem._wrapExceptionAsync(async () => {
      options = {
        ...WRITE_FILE_DEFAULT_OPTIONS,
        ...options
      };

      if (options.convertLineEndings) {
        contents = Text.convertTo(contents.toString(), options.convertLineEndings);
      }

      try {
        await fsx.writeFile(filePath, contents, { encoding: options.encoding });
      } catch (error) {
        if (options.ensureFolderExists) {
          if (!FileSystem.isNotExistError(error)) {
            throw error;
          }

          const folderPath: string = nodeJsPath.dirname(filePath);
          await FileSystem.ensureFolderAsync(folderPath);
          await fsx.writeFile(filePath, contents, { encoding: options.encoding });
        } else {
          throw error;
        }
      }
    });
  }

  /**
   * Writes a text string to a file on disk, appending to the file if it already exists.
   * Behind the scenes it uses `fs.appendFileSync()`.
   * @remarks
   * Throws an error if the folder doesn't exist, unless ensureFolder=true.
   * @param filePath - The absolute or relative path of the file.
   * @param contents - The text that should be written to the file.
   * @param options - Optional settings that can change the behavior. Type: `IWriteFileOptions`
   */
  public static appendToFile(
    filePath: string,
    contents: string | Buffer,
    options?: IFileSystemWriteFileOptions
  ): void {
    FileSystem._wrapException(() => {
      options = {
        ...APPEND_TO_FILE_DEFAULT_OPTIONS,
        ...options
      };

      if (options.convertLineEndings) {
        contents = Text.convertTo(contents.toString(), options.convertLineEndings);
      }

      try {
        fsx.appendFileSync(filePath, contents, { encoding: options.encoding });
      } catch (error) {
        if (options.ensureFolderExists) {
          if (!FileSystem.isNotExistError(error)) {
            throw error;
          }

          const folderPath: string = nodeJsPath.dirname(filePath);
          FileSystem.ensureFolder(folderPath);
          fsx.appendFileSync(filePath, contents, { encoding: options.encoding });
        } else {
          throw error;
        }
      }
    });
  }

  /**
   * An async version of {@link FileSystem.appendToFile}.
   */
  public static async appendToFileAsync(
    filePath: string,
    contents: string | Buffer,
    options?: IFileSystemWriteFileOptions
  ): Promise<void> {
    await FileSystem._wrapExceptionAsync(async () => {
      options = {
        ...APPEND_TO_FILE_DEFAULT_OPTIONS,
        ...options
      };

      if (options.convertLineEndings) {
        contents = Text.convertTo(contents.toString(), options.convertLineEndings);
      }

      try {
        await fsx.appendFile(filePath, contents, { encoding: options.encoding });
      } catch (error) {
        if (options.ensureFolderExists) {
          if (!FileSystem.isNotExistError(error)) {
            throw error;
          }

          const folderPath: string = nodeJsPath.dirname(filePath);
          await FileSystem.ensureFolderAsync(folderPath);
          await fsx.appendFile(filePath, contents, { encoding: options.encoding });
        } else {
          throw error;
        }
      }
    });
  }

  /**
   * Reads the contents of a file into a string.
   * Behind the scenes it uses `fs.readFileSync()`.
   * @param filePath - The relative or absolute path to the file whose contents should be read.
   * @param options - Optional settings that can change the behavior. Type: `IReadFileOptions`
   */
  public static readFile(filePath: string, options?: IFileSystemReadFileOptions): string {
    return FileSystem._wrapException(() => {
      options = {
        ...READ_FILE_DEFAULT_OPTIONS,
        ...options
      };

      let contents: string = FileSystem.readFileToBuffer(filePath).toString(options.encoding);
      if (options.convertLineEndings) {
        contents = Text.convertTo(contents, options.convertLineEndings);
      }

      return contents;
    });
  }

  /**
   * An async version of {@link FileSystem.readFile}.
   */
  public static async readFileAsync(filePath: string, options?: IFileSystemReadFileOptions): Promise<string> {
    return await FileSystem._wrapExceptionAsync(async () => {
      options = {
        ...READ_FILE_DEFAULT_OPTIONS,
        ...options
      };

      let contents: string = (await FileSystem.readFileToBufferAsync(filePath)).toString(options.encoding);
      if (options.convertLineEndings) {
        contents = Text.convertTo(contents, options.convertLineEndings);
      }

      return contents;
    });
  }

  /**
   * Reads the contents of a file into a buffer.
   * Behind the scenes is uses `fs.readFileSync()`.
   * @param filePath - The relative or absolute path to the file whose contents should be read.
   */
  public static readFileToBuffer(filePath: string): Buffer {
    return FileSystem._wrapException(() => {
      return fsx.readFileSync(filePath);
    });
  }

  /**
   * An async version of {@link FileSystem.readFileToBuffer}.
   */
  public static async readFileToBufferAsync(filePath: string): Promise<Buffer> {
    return await FileSystem._wrapExceptionAsync(() => {
      return fsx.readFile(filePath);
    });
  }

  /**
   * Copies a single file from one location to another.
   * By default, destinationPath is overwritten if it already exists.
   *
   * @remarks
   * The `copyFile()` API cannot be used to copy folders.  It copies at most one file.
   * Use {@link FileSystem.copyFiles} if you need to recursively copy a tree of folders.
   *
   * The implementation is based on `copySync()` from the `fs-extra` package.
   */
  public static copyFile(options: IFileSystemCopyFileOptions): void {
    options = {
      ...COPY_FILE_DEFAULT_OPTIONS,
      ...options
    };

    if (FileSystem.getStatistics(options.sourcePath).isDirectory()) {
      throw new Error(
        'The specified path refers to a folder; this operation expects a file object:\n' + options.sourcePath
      );
    }

    FileSystem._wrapException(() => {
      fsx.copySync(options.sourcePath, options.destinationPath, {
        errorOnExist: options.alreadyExistsBehavior === AlreadyExistsBehavior.Error,
        overwrite: options.alreadyExistsBehavior === AlreadyExistsBehavior.Overwrite
      });
    });
  }

  /**
   * An async version of {@link FileSystem.copyFile}.
   */
  public static async copyFileAsync(options: IFileSystemCopyFileOptions): Promise<void> {
    options = {
      ...COPY_FILE_DEFAULT_OPTIONS,
      ...options
    };

    if (FileSystem.getStatistics(options.sourcePath).isDirectory()) {
      throw new Error(
        'The specified path refers to a folder; this operation expects a file object:\n' + options.sourcePath
      );
    }

    await FileSystem._wrapExceptionAsync(() => {
      return fsx.copy(options.sourcePath, options.destinationPath, {
        errorOnExist: options.alreadyExistsBehavior === AlreadyExistsBehavior.Error,
        overwrite: options.alreadyExistsBehavior === AlreadyExistsBehavior.Overwrite
      });
    });
  }

  /**
   * Copies a single file from one location to one or more other locations.
   * By default, the file at the destination is overwritten if it already exists.
   *
   * @remarks
   * The `copyFileToManyAsync()` API cannot be used to copy folders.  It copies at most one file.
   *
   * The implementation is based on `createReadStream()` and `createWriteStream()` from the
   * `fs-extra` package.
   */
  public static async copyFileToManyAsync(options: IFileSystemCopyFileToManyOptions): Promise<void> {
    options = {
      ...COPY_FILE_DEFAULT_OPTIONS,
      ...options
    };

    if (FileSystem.getStatistics(options.sourcePath).isDirectory()) {
      throw new Error(
        'The specified path refers to a folder; this operation expects a file path:\n' + options.sourcePath
      );
    }

    await FileSystem._wrapExceptionAsync(async () => {
      // See flags documentation: https://nodejs.org/api/fs.html#fs_file_system_flags
      const writeFlags: string[] = [];
      switch (options.alreadyExistsBehavior) {
        case AlreadyExistsBehavior.Error:
        case AlreadyExistsBehavior.Ignore:
          writeFlags.push('wx');
          break;
        case AlreadyExistsBehavior.Overwrite:
        default:
          writeFlags.push('w');
      }
      const flags: string = writeFlags.join();

      const createPipePromise: (sourceStream: fs.ReadStream, destinationPath: string) => Promise<void> = (
        sourceStream: fs.ReadStream,
        destinationPath: string
      ) => {
        return new Promise((resolve: () => void, reject: (error: Error) => void) => {
          const destinationStream: fs.WriteStream = fs.createWriteStream(destinationPath);
          const streamsToDestroy: fs.WriteStream[] = [destinationStream];
          sourceStream.on('error', (e: Error) => {
            for (const streamToDestroy of streamsToDestroy) {
              streamToDestroy.destroy();
            }
            reject(e);
          });
          sourceStream
            .pipe(destinationStream)
            .on('close', () => {
              resolve();
            })
            .on('error', (e: Error) => {
              if (FileSystem.isNotExistError(e)) {
                destinationStream.destroy();
                FileSystem.ensureFolder(nodeJsPath.dirname(destinationStream.path as string));
                const retryDestinationStream: fs.WriteStream = fsx.createWriteStream(destinationPath, {
                  flags
                });
                streamsToDestroy.push(retryDestinationStream);
                sourceStream
                  .pipe(retryDestinationStream)
                  .on('close', () => {
                    resolve();
                  })
                  .on('error', (e2: Error) => {
                    reject(e2);
                  });
              } else if (
                options.alreadyExistsBehavior === AlreadyExistsBehavior.Ignore &&
                FileSystem.isErrnoException(e) &&
                e.code === 'EEXIST'
              ) {
                resolve();
              } else {
                reject(e);
              }
            });
        });
      };

      const sourceStream: fs.ReadStream = fsx.createReadStream(options.sourcePath);
      const uniqueDestinationPaths: Set<string> = new Set(options.destinationPaths);
      const pipePromises: Promise<void>[] = [];
      for (const destinationPath of uniqueDestinationPaths) {
        pipePromises.push(createPipePromise(sourceStream, destinationPath));
      }

      await Promise.all(pipePromises);
    });
  }

  /**
   * Copies a file or folder from one location to another, recursively copying any folder contents.
   * By default, destinationPath is overwritten if it already exists.
   *
   * @remarks
   * If you only intend to copy a single file, it is recommended to use {@link FileSystem.copyFile}
   * instead to more clearly communicate the intended operation.
   *
   * The implementation is based on `copySync()` from the `fs-extra` package.
   */
  public static copyFiles(options: IFileSystemCopyFilesOptions): void {
    options = {
      ...COPY_FILES_DEFAULT_OPTIONS,
      ...options
    };

    FileSystem._wrapException(() => {
      fsx.copySync(options.sourcePath, options.destinationPath, {
        dereference: !!options.dereferenceSymlinks,
        errorOnExist: options.alreadyExistsBehavior === AlreadyExistsBehavior.Error,
        overwrite: options.alreadyExistsBehavior === AlreadyExistsBehavior.Overwrite,
        preserveTimestamps: !!options.preserveTimestamps,
        filter: options.filter
      });
    });
  }

  /**
   * An async version of {@link FileSystem.copyFiles}.
   */
  public static async copyFilesAsync(options: IFileSystemCopyFilesOptions): Promise<void> {
    options = {
      ...COPY_FILES_DEFAULT_OPTIONS,
      ...options
    };

    await FileSystem._wrapExceptionAsync(async () => {
      fsx.copySync(options.sourcePath, options.destinationPath, {
        dereference: !!options.dereferenceSymlinks,
        errorOnExist: options.alreadyExistsBehavior === AlreadyExistsBehavior.Error,
        overwrite: options.alreadyExistsBehavior === AlreadyExistsBehavior.Overwrite,
        preserveTimestamps: !!options.preserveTimestamps,
        filter: options.filter
      });
    });
  }

  /**
   * Deletes a file. Can optionally throw if the file doesn't exist.
   * Behind the scenes it uses `fs.unlinkSync()`.
   * @param filePath - The absolute or relative path to the file that should be deleted.
   * @param options - Optional settings that can change the behavior. Type: `IDeleteFileOptions`
   */
  public static deleteFile(filePath: string, options?: IFileSystemDeleteFileOptions): void {
    FileSystem._wrapException(() => {
      options = {
        ...DELETE_FILE_DEFAULT_OPTIONS,
        ...options
      };

      try {
        fsx.unlinkSync(filePath);
      } catch (error) {
        if (options.throwIfNotExists || !FileSystem.isNotExistError(error)) {
          throw error;
        }
      }
    });
  }

  /**
   * An async version of {@link FileSystem.deleteFile}.
   */
  public static async deleteFileAsync(
    filePath: string,
    options?: IFileSystemDeleteFileOptions
  ): Promise<void> {
    await FileSystem._wrapExceptionAsync(async () => {
      options = {
        ...DELETE_FILE_DEFAULT_OPTIONS,
        ...options
      };

      try {
        await fsx.unlink(filePath);
      } catch (error) {
        if (options.throwIfNotExists || !FileSystem.isNotExistError(error)) {
          throw error;
        }
      }
    });
  }

  // ===============
  // LINK OPERATIONS
  // ===============

  /**
   * Gets the statistics of a filesystem object. Does NOT follow the link to its target.
   * Behind the scenes it uses `fs.lstatSync()`.
   * @param path - The absolute or relative path to the filesystem object.
   */
  public static getLinkStatistics(path: string): FileSystemStats {
    return FileSystem._wrapException(() => {
      return fsx.lstatSync(path);
    });
  }

  /**
   * An async version of {@link FileSystem.getLinkStatistics}.
   */
  public static async getLinkStatisticsAsync(path: string): Promise<FileSystemStats> {
    return await FileSystem._wrapExceptionAsync(() => {
      return fsx.lstat(path);
    });
  }

  /**
   * If `path` refers to a symbolic link, this returns the path of the link target, which may be
   * an absolute or relative path.
   *
   * @remarks
   * If `path` refers to a filesystem object that is not a symbolic link, then an `ErrnoException` is thrown
   * with code 'UNKNOWN'.  If `path` does not exist, then an `ErrnoException` is thrown with code `ENOENT`.
   *
   * @param path - The absolute or relative path to the symbolic link.
   * @returns the path of the link target
   */
  public static readLink(path: string): string {
    return FileSystem._wrapException(() => {
      return fsx.readlinkSync(path);
    });
  }

  /**
   * An async version of {@link FileSystem.readLink}.
   */
  public static async readLinkAsync(path: string): Promise<string> {
    return await FileSystem._wrapExceptionAsync(() => {
      return fsx.readlink(path);
    });
  }

  /**
   * Creates a Windows "directory junction". Behaves like `createSymbolicLinkToFile()` on other platforms.
   * Behind the scenes it uses `fs.symlinkSync()`.
   */
  public static createSymbolicLinkJunction(options: IFileSystemCreateLinkOptions): void {
    FileSystem._wrapException(() => {
      // For directories, we use a Windows "junction".  On POSIX operating systems, this produces a regular symlink.
      fsx.symlinkSync(options.linkTargetPath, options.newLinkPath, 'junction');
    });
  }

  /**
   * An async version of {@link FileSystem.createSymbolicLinkJunction}.
   */
  public static async createSymbolicLinkJunctionAsync(options: IFileSystemCreateLinkOptions): Promise<void> {
    await FileSystem._wrapExceptionAsync(() => {
      // For directories, we use a Windows "junction".  On POSIX operating systems, this produces a regular symlink.
      return fsx.symlink(options.linkTargetPath, options.newLinkPath, 'junction');
    });
  }

  /**
   * Creates a symbolic link to a file (on Windows this requires elevated permissionsBits).
   * Behind the scenes it uses `fs.symlinkSync()`.
   */
  public static createSymbolicLinkFile(options: IFileSystemCreateLinkOptions): void {
    FileSystem._wrapException(() => {
      fsx.symlinkSync(options.linkTargetPath, options.newLinkPath, 'file');
    });
  }

  /**
   * An async version of {@link FileSystem.createSymbolicLinkFile}.
   */
  public static async createSymbolicLinkFileAsync(options: IFileSystemCreateLinkOptions): Promise<void> {
    await FileSystem._wrapExceptionAsync(() => {
      return fsx.symlink(options.linkTargetPath, options.newLinkPath, 'file');
    });
  }

  /**
   * Creates a symbolic link to a folder (on Windows this requires elevated permissionsBits).
   * Behind the scenes it uses `fs.symlinkSync()`.
   */
  public static createSymbolicLinkFolder(options: IFileSystemCreateLinkOptions): void {
    FileSystem._wrapException(() => {
      fsx.symlinkSync(options.linkTargetPath, options.newLinkPath, 'dir');
    });
  }

  /**
   * An async version of {@link FileSystem.createSymbolicLinkFolder}.
   */
  public static async createSymbolicLinkFolderAsync(options: IFileSystemCreateLinkOptions): Promise<void> {
    await FileSystem._wrapExceptionAsync(() => {
      return fsx.symlink(options.linkTargetPath, options.newLinkPath, 'dir');
    });
  }

  /**
   * Creates a hard link.
   * Behind the scenes it uses `fs.linkSync()`.
   */
  public static createHardLink(options: IFileSystemCreateLinkOptions): void {
    FileSystem._wrapException(() => {
      try {
        fsx.linkSync(options.linkTargetPath, options.newLinkPath);
      } catch (error) {
        if (error.code === 'EEXIST') {
          switch (options.alreadyExistsBehavior) {
            case AlreadyExistsBehavior.Ignore:
              return;
            case AlreadyExistsBehavior.Overwrite:
              this.deleteFile(options.newLinkPath);
              break;
            case AlreadyExistsBehavior.Error:
            default:
              throw error;
          }
        } else {
          const linkTargetExists: boolean = FileSystem.exists(options.linkTargetPath);
          if (FileSystem.isNotExistError(error) && linkTargetExists) {
            this.ensureFolder(nodeJsPath.dirname(options.newLinkPath));
            this.createHardLink(options);
          } else {
            throw error;
          }
        }
      }
    });
  }

  /**
   * An async version of {@link FileSystem.createHardLink}.
   */
  public static async createHardLinkAsync(options: IFileSystemCreateLinkOptions): Promise<void> {
    await FileSystem._wrapExceptionAsync(async () => {
      try {
        await fsx.link(options.linkTargetPath, options.newLinkPath);
      } catch (error) {
        if (error.code === 'EEXIST') {
          switch (options.alreadyExistsBehavior) {
            case AlreadyExistsBehavior.Ignore:
              return;
            case AlreadyExistsBehavior.Overwrite:
              await this.deleteFileAsync(options.newLinkPath);
              break;
            case AlreadyExistsBehavior.Error:
            default:
              throw error;
          }
        } else {
          const linkTargetExists: boolean = await FileSystem.exists(options.linkTargetPath);
          if (FileSystem.isNotExistError(error) && linkTargetExists) {
            await this.ensureFolderAsync(nodeJsPath.dirname(options.newLinkPath));
            await this.createHardLinkAsync(options);
          } else {
            throw error;
          }
        }
      }
    });
  }

  /**
   * Follows a link to its destination and returns the absolute path to the final target of the link.
   * Behind the scenes it uses `fs.realpathSync()`.
   * @param linkPath - The path to the link.
   */
  public static getRealPath(linkPath: string): string {
    return FileSystem._wrapException(() => {
      return fsx.realpathSync(linkPath);
    });
  }

  /**
   * An async version of {@link FileSystem.getRealPath}.
   */
  public static async getRealPathAsync(linkPath: string): Promise<string> {
    return await FileSystem._wrapExceptionAsync(() => {
      return fsx.realpath(linkPath);
    });
  }

  // ===============
  // UTILITY FUNCTIONS
  // ===============

  /**
   * Returns true if the error provided indicates the file or folder does not exist.
   */
  public static isNotExistError(error: Error): boolean {
    return FileSystem.isFileDoesNotExistError(error) || FileSystem.isFolderDoesNotExistError(error);
  }

  /**
   * Returns true if the error provided indicates the file does not exist.
   */
  public static isFileDoesNotExistError(error: Error): boolean {
    return FileSystem.isErrnoException(error) && error.code === 'ENOENT';
  }

  /**
   * Returns true if the error provided indicates the folder does not exist.
   */
  public static isFolderDoesNotExistError(error: Error): boolean {
    return FileSystem.isErrnoException(error) && error.code === 'ENOTDIR';
  }

  /**
   * Detects if the provided error object is a `NodeJS.ErrnoException`
   */
  public static isErrnoException(error: Error): error is NodeJS.ErrnoException {
    const typedError: NodeJS.ErrnoException = error;
    return (
      typeof typedError.code === 'string' &&
      typeof typedError.errno === 'number' &&
      typeof typedError.path === 'string' &&
      typeof typedError.syscall === 'string'
    );
  }

  private static _wrapException<TResult>(fn: () => TResult): TResult {
    try {
      return fn();
    } catch (error) {
      FileSystem._updateErrorMessage(error);
      throw error;
    }
  }

  private static async _wrapExceptionAsync<TResult>(fn: () => Promise<TResult>): Promise<TResult> {
    try {
      return await fn();
    } catch (error) {
      FileSystem._updateErrorMessage(error);
      throw error;
    }
  }

  private static _updateErrorMessage(error: Error): void {
    if (FileSystem.isErrnoException(error)) {
      if (FileSystem.isFileDoesNotExistError(error)) {
        // eslint-disable-line @typescript-eslint/no-use-before-define
        error.message = `File does not exist: ${error.path}\n${error.message}`;
      } else if (FileSystem.isFolderDoesNotExistError(error)) {
        // eslint-disable-line @typescript-eslint/no-use-before-define
        error.message = `Folder does not exist: ${error.path}\n${error.message}`;
      }
    }
  }
}

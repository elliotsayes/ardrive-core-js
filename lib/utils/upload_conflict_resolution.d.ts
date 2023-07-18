import { ArFSFolderToUpload } from '../arfs/arfs_file_wrapper';
import { ResolveFileNameConflictsParams, ResolveFolderNameConflictsParams, UploadStats } from '../types';
/** Throws an error if the entitiesToUpload contain conflicting file names being sent to the same destination folder */
export declare function assertLocalNameConflicts(entitiesToUpload: UploadStats[]): void;
/** Recursive function to assert any name conflicts between entities within each folder */
export declare function assertConflictsWithinFolder(wrappedFolder: ArFSFolderToUpload): void;
export declare function resolveFileNameConflicts({ wrappedFile, conflictResolution, destinationFileName: destFileName, prompts, getConflictInfoFn, destFolderId }: ResolveFileNameConflictsParams): Promise<void>;
export declare function resolveFolderNameConflicts({ wrappedFolder, destinationFolderName: destFolderName, prompts, conflictResolution, getConflictInfoFn, destFolderId }: ResolveFolderNameConflictsParams): Promise<void>;
/** Uses conflictResolution on each file and folder to recursively remove skipped entities or error on conflicts */
export declare function assertAndRemoveConflictingEntities(folder: ArFSFolderToUpload): void;

import { FileID, FolderID } from '.';
import { ArFSDataToUpload, ArFSFolderToUpload } from '../arfs/arfs_file_wrapper';
import { FileConflictInfo, NameConflictInfo } from '../utils/mapper_functions';
export declare const skipOnConflicts = "skip";
export declare const replaceOnConflicts = "replace";
export declare const upsertOnConflicts = "upsert";
export declare const askOnConflicts = "ask";
export declare const renameOnConflicts = "rename";
export declare const useExistingFolder = "useFolder";
export declare const errorOnConflict = "error";
/** Conflict settings used by ArDrive class */
export declare type FileNameConflictResolution = typeof skipOnConflicts | typeof replaceOnConflicts | typeof upsertOnConflicts | typeof askOnConflicts;
export interface ConflictPromptParams {
    namesWithinDestFolder: string[];
}
export interface FileConflictPromptParams extends ConflictPromptParams {
    fileName: string;
    fileId: FileID;
}
export interface FileToFileConflictPromptParams extends FileConflictPromptParams {
    hasSameLastModifiedDate: boolean;
}
export interface FolderConflictPromptParams extends ConflictPromptParams {
    folderName: string;
    folderId: FolderID;
}
export declare type FileToFileNameConflictPrompt = (params: FileToFileConflictPromptParams) => Promise<{
    resolution: typeof skipOnConflicts | typeof replaceOnConflicts;
} | {
    resolution: typeof renameOnConflicts;
    newFileName: string;
}>;
export declare type FileToFolderConflictAskPrompt = (params: FolderConflictPromptParams) => Promise<{
    resolution: typeof skipOnConflicts;
} | {
    resolution: typeof renameOnConflicts;
    newFileName: string;
}>;
export declare type FolderToFileConflictAskPrompt = (params: FileConflictPromptParams) => Promise<{
    resolution: typeof skipOnConflicts;
} | {
    resolution: typeof renameOnConflicts;
    newFolderName: string;
}>;
export declare type FolderToFolderConflictAskPrompt = (params: FolderConflictPromptParams) => Promise<{
    resolution: typeof skipOnConflicts | typeof useExistingFolder;
} | {
    resolution: typeof renameOnConflicts;
    newFolderName: string;
}>;
export declare type FileConflictResolutionFnResult = {
    existingFileId?: FileID;
    newFileName?: string;
} | typeof skipOnConflicts;
export interface FileConflictPrompts {
    fileToFileNameConflict: FileToFileNameConflictPrompt;
    fileToFolderNameConflict: FileToFolderConflictAskPrompt;
}
export interface FolderConflictPrompts extends FileConflictPrompts {
    folderToFileNameConflict: FolderToFileConflictAskPrompt;
    folderToFolderNameConflict: FolderToFolderConflictAskPrompt;
}
export declare type FileConflictResolutionFn = (params: {
    conflictResolution: FileNameConflictResolution;
    conflictingFileInfo: FileConflictInfo;
    hasSameLastModifiedDate: boolean;
    prompts?: FileConflictPrompts;
    namesWithinDestFolder: string[];
}) => Promise<FileConflictResolutionFnResult>;
export interface ResolveNameConflictsParams {
    conflictResolution: FileNameConflictResolution;
    getConflictInfoFn: (parentFolderId: FolderID) => Promise<NameConflictInfo>;
    destFolderId: FolderID;
}
export interface ResolveFileNameConflictsParams extends ResolveNameConflictsParams {
    destinationFileName: string;
    wrappedFile: ArFSDataToUpload;
    prompts?: FileConflictPrompts;
}
export interface ResolveFolderNameConflictsParams extends ResolveNameConflictsParams {
    destinationFolderName: string;
    wrappedFolder: ArFSFolderToUpload;
    prompts?: FolderConflictPrompts;
}

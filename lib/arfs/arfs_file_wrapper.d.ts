/// <reference types="node" />
import { Stats } from 'fs';
import { Duplex, Readable } from 'stream';
import { ByteCount, DataContentType, UnixTime, Manifest, TransactionID, EntityID, EntityType } from '../types';
import { errorOnConflict, skipOnConflicts, upsertOnConflicts } from '../types';
import { ArFSPrivateFile, ArFSPublicFile, ArFSWithPath } from './arfs_entities';
import { ArFSPublicFileWithPaths, ArFSPublicFolderWithPaths, CustomMetaData, SourceUri } from '../exports';
declare type BaseName = string;
declare type LocalEntityPath = string;
export interface FileInfo {
    dataContentType: DataContentType;
    lastModifiedDateMS: UnixTime;
    fileSize: ByteCount;
}
export declare function resolveEntityPathToLocalSourceUri(entityPath: LocalEntityPath): SourceUri;
/**
 * Reads stats of a file or folder  and constructs a File or Folder wrapper class
 *
 * @remarks import and use `isFolder` type-guard to later determine whether a folder or file
 *
 * @example
 *
 * const fileOrFolder = wrapFileOrFolder(myFilePath);
 *
 * if (isFolder(fileOrFolder)) {
 * 	// Type is: Folder
 * } else {
 * 	// Type is: File
 * }
 *
 */
export declare function wrapFileOrFolder(fileOrFolderPath: LocalEntityPath, customContentType?: DataContentType, customMetaData?: CustomMetaData): ArFSFileToUpload | ArFSFolderToUpload;
/** Type-guard function to determine if returned class is a File or Folder */
export declare function isFolder(fileOrFolder: ArFSDataToUpload | ArFSFolderToUpload): fileOrFolder is ArFSFolderToUpload;
export declare abstract class ArFSBaseEntityToUpload {
    abstract getBaseName(): BaseName;
    abstract readonly entityType: EntityType;
    readonly sourceUri?: SourceUri;
    readonly customMetaData?: CustomMetaData;
    destName?: string;
    existingId?: EntityID;
    get destinationBaseName(): string;
    constructor();
}
export declare abstract class ArFSDataToUpload extends ArFSBaseEntityToUpload {
    abstract gatherFileInfo(): FileInfo;
    abstract getFileDataBuffer(): Buffer;
    abstract readonly contentType: DataContentType;
    abstract readonly lastModifiedDate: UnixTime;
    abstract readonly size: ByteCount;
    conflictResolution?: FileConflictResolution;
    readonly customContentType?: DataContentType;
    readonly entityType = "file";
}
export declare class ArFSManifestToUpload extends ArFSDataToUpload {
    readonly folderToGenManifest: (ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths)[];
    readonly destManifestName: string;
    readonly customMetaData?: CustomMetaData;
    manifest: Manifest;
    lastModifiedDateMS: UnixTime;
    constructor(folderToGenManifest: (ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths)[], destManifestName: string, customMetaData?: CustomMetaData);
    getLinksOutput(dataTxId: TransactionID, gateway?: URL): string[];
    gatherFileInfo(): FileInfo;
    get contentType(): DataContentType;
    getBaseName(): BaseName;
    getFileDataBuffer(): Buffer;
    get size(): ByteCount;
    get lastModifiedDate(): UnixTime;
}
export declare type FolderConflictResolution = typeof skipOnConflicts | typeof errorOnConflict | undefined;
export declare type FileConflictResolution = FolderConflictResolution | typeof upsertOnConflicts;
export declare class ArFSFileToUpload extends ArFSDataToUpload {
    readonly filePath: LocalEntityPath;
    readonly fileStats: Stats;
    readonly customContentType?: DataContentType;
    readonly customMetaData?: CustomMetaData;
    constructor(filePath: LocalEntityPath, fileStats: Stats, customContentType?: DataContentType, customMetaData?: CustomMetaData);
    readonly sourceUri: string;
    gatherFileInfo(): FileInfo;
    get size(): ByteCount;
    get lastModifiedDate(): UnixTime;
    getFileDataBuffer(): Buffer;
    get contentType(): DataContentType;
    getBaseName(): BaseName;
    /** Computes the size of a private file encrypted with AES256-GCM */
    encryptedDataSize(): ByteCount;
}
export declare class ArFSFolderToUpload extends ArFSBaseEntityToUpload {
    readonly filePath: LocalEntityPath;
    readonly fileStats: Stats;
    readonly customMetaData?: CustomMetaData;
    files: ArFSFileToUpload[];
    folders: ArFSFolderToUpload[];
    conflictResolution: FolderConflictResolution;
    readonly entityType = "folder";
    readonly sourceUri: string;
    constructor(filePath: LocalEntityPath, fileStats: Stats, customMetaData?: CustomMetaData);
    getBaseName(): BaseName;
    getTotalByteCount(encrypted?: boolean): ByteCount;
}
export declare abstract class ArFSFileToDownload {
    readonly fileEntity: ArFSPublicFile | ArFSPrivateFile;
    readonly dataStream: Readable;
    readonly localFilePath: string;
    constructor(fileEntity: ArFSPublicFile | ArFSPrivateFile, dataStream: Readable, localFilePath: string);
    abstract write(): Promise<void>;
    protected setLastModifiedDate: () => void;
}
export declare class ArFSPublicFileToDownload extends ArFSFileToDownload {
    constructor(fileEntity: ArFSPublicFile, dataStream: Readable, localFilePath: string);
    write(): Promise<void>;
}
export declare class ArFSPrivateFileToDownload extends ArFSFileToDownload {
    private readonly decryptingStream;
    constructor(fileEntity: ArFSPrivateFile, dataStream: Readable, localFilePath: string, decryptingStream: Duplex);
    write(): Promise<void>;
}
export declare class ArFSFolderToDownload<P extends ArFSWithPath> {
    readonly folderWithPaths: P;
    protected readonly customBaseName?: string;
    constructor(folderWithPaths: P, customBaseName?: string);
    getRelativePathOf(childPath: string): string;
    ensureFolderExistence(folderPath: string, recursive?: boolean): void;
}
export {};

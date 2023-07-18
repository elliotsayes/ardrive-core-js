import { FolderHierarchy } from './folder_hierarchy';
import { CipherIV, DataContentType, DriveID, FileID, FolderID, ByteCount, TransactionID, UnixTime, ContentType, DriveAuthMode, DrivePrivacy, EntityType, FileKey, DriveKey, EntityIDTypeForEntityType, CustomMetaDataGqlTags, CustomMetaDataJsonFields, FeeMultiple } from '../types';
import { ENCRYPTED_DATA_PLACEHOLDER_TYPE } from '../utils/constants';
export declare class ArFSEntity {
    readonly appName: string;
    readonly appVersion: string;
    readonly arFS: string;
    readonly contentType: ContentType;
    readonly driveId: DriveID;
    readonly entityType: EntityType;
    readonly name: string;
    readonly txId: TransactionID;
    readonly unixTime: UnixTime;
    readonly boost?: FeeMultiple;
    readonly customMetaDataGqlTags?: CustomMetaDataGqlTags;
    readonly customMetaDataJson?: CustomMetaDataJsonFields;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: DriveID, entityType: EntityType, name: string, txId: TransactionID, unixTime: UnixTime, boost?: FeeMultiple, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export interface ArFSDriveEntity extends ArFSEntity {
    drivePrivacy: string;
    rootFolderId: FolderID | ENCRYPTED_DATA_PLACEHOLDER_TYPE;
}
export declare class ArFSPublicDrive extends ArFSEntity implements ArFSDriveEntity {
    readonly appName: string;
    readonly appVersion: string;
    readonly arFS: string;
    readonly contentType: ContentType;
    readonly driveId: DriveID;
    readonly entityType: EntityType;
    readonly name: string;
    readonly txId: TransactionID;
    readonly unixTime: UnixTime;
    readonly drivePrivacy: DrivePrivacy;
    readonly rootFolderId: FolderID;
    readonly boost?: FeeMultiple;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: DriveID, entityType: EntityType, name: string, txId: TransactionID, unixTime: UnixTime, drivePrivacy: DrivePrivacy, rootFolderId: FolderID, boost?: FeeMultiple, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export declare class ArFSPrivateDrive extends ArFSEntity implements ArFSDriveEntity {
    readonly appName: string;
    readonly appVersion: string;
    readonly arFS: string;
    readonly contentType: ContentType;
    readonly driveId: DriveID;
    readonly entityType: EntityType;
    readonly name: string;
    readonly txId: TransactionID;
    readonly unixTime: UnixTime;
    readonly drivePrivacy: DrivePrivacy;
    readonly rootFolderId: FolderID;
    readonly driveAuthMode: DriveAuthMode;
    readonly cipher: string;
    readonly cipherIV: CipherIV;
    readonly driveKey: DriveKey;
    readonly boost?: FeeMultiple;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: DriveID, entityType: EntityType, name: string, txId: TransactionID, unixTime: UnixTime, drivePrivacy: DrivePrivacy, rootFolderId: FolderID, driveAuthMode: DriveAuthMode, cipher: string, cipherIV: CipherIV, driveKey: DriveKey, boost?: FeeMultiple, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export declare class ArFSPrivateDriveKeyless extends ArFSPrivateDrive {
    readonly boost?: FeeMultiple;
    driveKey: never;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: DriveID, entityType: EntityType, name: string, txId: TransactionID, unixTime: UnixTime, drivePrivacy: DrivePrivacy, rootFolderId: FolderID, driveAuthMode: DriveAuthMode, cipher: string, cipherIV: CipherIV, boost?: FeeMultiple, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export interface ArFSFileFolderEntity extends ArFSEntity {
    parentFolderId: FolderID;
    entityId: FileID | FolderID;
    lastModifiedDate: UnixTime;
}
export declare abstract class ArFSFileOrFolderEntity<T extends 'file' | 'folder'> extends ArFSEntity implements ArFSFileFolderEntity {
    readonly entityType: T;
    size: ByteCount;
    lastModifiedDate: UnixTime;
    dataTxId: TransactionID;
    dataContentType: DataContentType;
    readonly parentFolderId: FolderID;
    readonly entityId: EntityIDTypeForEntityType<T>;
    readonly boost?: FeeMultiple;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: DriveID, entityType: T, name: string, size: ByteCount, txId: TransactionID, unixTime: UnixTime, lastModifiedDate: UnixTime, dataTxId: TransactionID, dataContentType: DataContentType, parentFolderId: FolderID, entityId: EntityIDTypeForEntityType<T>, boost?: FeeMultiple, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export declare function publicEntityWithPathsFactory(entity: ArFSPublicFolder | ArFSPublicFile, hierarchy: FolderHierarchy): ArFSPublicFolderWithPaths | ArFSPublicFileWithPaths;
export declare function privateEntityWithPathsFactory(entity: ArFSPrivateFolder | ArFSPrivateFile, hierarchy: FolderHierarchy): ArFSPrivateFolderWithPaths | ArFSPrivateFileWithPaths;
export declare function privateEntityWithPathsKeylessFactory(entity: ArFSPrivateFolder | ArFSPrivateFile, hierarchy: FolderHierarchy): ArFSPrivateFolderWithPaths | ArFSPrivateFileWithPaths;
export interface ArFSWithPath {
    readonly path: string;
    readonly txIdPath: string;
    readonly entityIdPath: string;
}
export declare class ArFSPublicFile extends ArFSFileOrFolderEntity<'file'> {
    readonly fileId: FileID;
    readonly boost?: FeeMultiple;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: DriveID, name: string, txId: TransactionID, unixTime: UnixTime, parentFolderId: FolderID, fileId: FileID, size: ByteCount, lastModifiedDate: UnixTime, dataTxId: TransactionID, dataContentType: DataContentType, boost?: FeeMultiple, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export declare class ArFSPublicFileWithPaths extends ArFSPublicFile implements ArFSWithPath {
    readonly path: string;
    readonly txIdPath: string;
    readonly entityIdPath: string;
    constructor(entity: ArFSPublicFile, hierarchy: FolderHierarchy);
}
export declare class ArFSPrivateFile extends ArFSFileOrFolderEntity<'file'> {
    readonly fileId: FileID;
    readonly cipher: string;
    readonly cipherIV: CipherIV;
    readonly fileKey: FileKey;
    readonly driveKey: DriveKey;
    readonly boost?: FeeMultiple;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: DriveID, name: string, txId: TransactionID, unixTime: UnixTime, parentFolderId: FolderID, fileId: FileID, size: ByteCount, lastModifiedDate: UnixTime, dataTxId: TransactionID, dataContentType: DataContentType, cipher: string, cipherIV: CipherIV, fileKey: FileKey, driveKey: DriveKey, boost?: FeeMultiple, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
    get encryptedDataSize(): ByteCount;
}
export declare class ArFSPrivateFileWithPaths extends ArFSPrivateFile implements ArFSWithPath {
    readonly path: string;
    readonly txIdPath: string;
    readonly entityIdPath: string;
    constructor(entity: ArFSPrivateFile, hierarchy: FolderHierarchy);
}
export declare class ArFSPrivateFileWithPathsKeyless extends ArFSPrivateFileWithPaths {
    driveKey: never;
    fileKey: never;
    constructor(entity: ArFSPrivateFile, hierarchy: FolderHierarchy);
}
export declare class ArFSPrivateFileKeyless extends ArFSPrivateFile {
    driveKey: never;
    fileKey: never;
    constructor(entity: ArFSPrivateFile);
}
export declare class ArFSPublicFolder extends ArFSFileOrFolderEntity<'folder'> {
    readonly folderId: FolderID;
    readonly boost?: FeeMultiple;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: DriveID, name: string, txId: TransactionID, unixTime: UnixTime, parentFolderId: FolderID, folderId: FolderID, boost?: FeeMultiple, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export declare class ArFSPublicFolderWithPaths extends ArFSPublicFolder implements ArFSWithPath {
    readonly path: string;
    readonly txIdPath: string;
    readonly entityIdPath: string;
    constructor(entity: ArFSPublicFolder, hierarchy: FolderHierarchy);
}
export declare class ArFSPrivateFolder extends ArFSFileOrFolderEntity<'folder'> {
    readonly folderId: FolderID;
    readonly cipher: string;
    readonly cipherIV: CipherIV;
    readonly driveKey: DriveKey;
    readonly boost?: FeeMultiple;
    constructor(appName: string, appVersion: string, arFS: string, contentType: ContentType, driveId: DriveID, name: string, txId: TransactionID, unixTime: UnixTime, parentFolderId: FolderID, folderId: FolderID, cipher: string, cipherIV: CipherIV, driveKey: DriveKey, boost?: FeeMultiple, customMetaDataGqlTags?: CustomMetaDataGqlTags, customMetaDataJson?: CustomMetaDataJsonFields);
}
export declare class ArFSPrivateFolderWithPaths extends ArFSPrivateFolder implements ArFSWithPath {
    readonly path: string;
    readonly txIdPath: string;
    readonly entityIdPath: string;
    constructor(entity: ArFSPrivateFolder, hierarchy: FolderHierarchy);
}
export declare class ArFSPrivateFolderWithPathsKeyless extends ArFSPrivateFolderWithPaths {
    driveKey: never;
    constructor(entity: ArFSPrivateFolder, hierarchy: FolderHierarchy);
}
export declare class ArFSPrivateFolderKeyless extends ArFSPrivateFolder {
    driveKey: never;
    constructor(entity: ArFSPrivateFolder);
}

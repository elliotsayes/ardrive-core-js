import { ArFSDriveTransactionData, ArFSFileDataTransactionData, ArFSFileMetadataTransactionData, ArFSFolderTransactionData, ArFSObjectTransactionData, ArFSPrivateDriveTransactionData, ArFSPrivateFileDataTransactionData, ArFSPrivateFileMetadataTransactionData, ArFSPrivateFolderTransactionData, ArFSPublicDriveTransactionData, ArFSPublicFileDataTransactionData, ArFSPublicFileMetadataTransactionData, ArFSPublicFolderTransactionData } from './arfs_tx_data_types';
import { DataContentType, DriveID, FileID, FolderID, PRIVATE_CONTENT_TYPE, UnixTime, ContentType, DrivePrivacy, GQLTagInterface, EntityType, TransactionID, CustomMetaDataGqlTags } from '../../types';
import { ArFSDataToUpload } from '../arfs_file_wrapper';
import { WithDriveKey } from '../arfs_entity_result_factory';
export declare abstract class ArFSObjectMetadataPrototype {
    protected readonly customMetaDataTags: CustomMetaDataGqlTags;
    abstract readonly objectData: ArFSObjectTransactionData;
    protected abstract readonly protectedTags: GQLTagInterface[];
    constructor(customMetaDataTags: CustomMetaDataGqlTags);
    get gqlTags(): GQLTagInterface[];
    private parseCustomGqlTags;
    assertProtectedTags(tags: GQLTagInterface[]): void;
}
export declare abstract class ArFSEntityMetaDataPrototype extends ArFSObjectMetadataPrototype {
    protected readonly customMetaDataTags: CustomMetaDataGqlTags;
    readonly unixTime: UnixTime;
    abstract readonly contentType: ContentType;
    abstract readonly entityType: EntityType;
    abstract readonly driveId: DriveID;
    constructor(customMetaDataTags: CustomMetaDataGqlTags);
    protected get protectedTags(): GQLTagInterface[];
}
export declare abstract class ArFSDriveMetaDataPrototype extends ArFSEntityMetaDataPrototype {
    abstract driveId: DriveID;
    abstract objectData: ArFSDriveTransactionData;
    abstract readonly privacy: DrivePrivacy;
    readonly entityType: EntityType;
    protected get protectedTags(): GQLTagInterface[];
}
export declare class ArFSPublicDriveMetaDataPrototype extends ArFSDriveMetaDataPrototype {
    readonly objectData: ArFSPublicDriveTransactionData;
    readonly driveId: DriveID;
    readonly customMetaDataTags: {};
    readonly privacy: DrivePrivacy;
    readonly contentType: ContentType;
    constructor(objectData: ArFSPublicDriveTransactionData, driveId: DriveID, customMetaDataTags?: {});
}
export declare class ArFSPrivateDriveMetaDataPrototype extends ArFSDriveMetaDataPrototype {
    readonly driveId: DriveID;
    readonly objectData: ArFSPrivateDriveTransactionData;
    readonly customMetaDataTags: {};
    readonly privacy: DrivePrivacy;
    readonly contentType: ContentType;
    constructor(driveId: DriveID, objectData: ArFSPrivateDriveTransactionData, customMetaDataTags?: {});
    protected get protectedTags(): GQLTagInterface[];
}
export declare abstract class ArFSFolderMetaDataPrototype extends ArFSEntityMetaDataPrototype {
    abstract driveId: DriveID;
    abstract folderId: FolderID;
    abstract objectData: ArFSFolderTransactionData;
    abstract parentFolderId?: FolderID;
    abstract readonly contentType: ContentType;
    readonly entityType: EntityType;
    protected get protectedTags(): GQLTagInterface[];
}
export declare class ArFSPublicFolderMetaDataPrototype extends ArFSFolderMetaDataPrototype {
    readonly objectData: ArFSPublicFolderTransactionData;
    readonly driveId: DriveID;
    readonly folderId: FolderID;
    readonly parentFolderId?: FolderID;
    readonly customMetaDataTags: CustomMetaDataGqlTags;
    readonly contentType: ContentType;
    constructor(objectData: ArFSPublicFolderTransactionData, driveId: DriveID, folderId: FolderID, parentFolderId?: FolderID, customMetaDataTags?: CustomMetaDataGqlTags);
}
export declare class ArFSPrivateFolderMetaDataPrototype extends ArFSFolderMetaDataPrototype {
    readonly driveId: DriveID;
    readonly folderId: FolderID;
    readonly objectData: ArFSPrivateFolderTransactionData;
    readonly parentFolderId?: FolderID;
    readonly customMetaDataTags: CustomMetaDataGqlTags;
    readonly privacy: DrivePrivacy;
    readonly contentType: ContentType;
    constructor(driveId: DriveID, folderId: FolderID, objectData: ArFSPrivateFolderTransactionData, parentFolderId?: FolderID, customMetaDataTags?: CustomMetaDataGqlTags);
    protected get protectedTags(): GQLTagInterface[];
}
export declare abstract class ArFSFileMetaDataPrototype extends ArFSEntityMetaDataPrototype {
    abstract driveId: DriveID;
    abstract fileId: FileID;
    abstract objectData: ArFSFileMetadataTransactionData;
    abstract parentFolderId: FolderID;
    abstract contentType: ContentType;
    readonly entityType: EntityType;
    protected get protectedTags(): GQLTagInterface[];
}
export interface ArFSPublicFileMetaDataPrototypeFromFileParams {
    wrappedFile: ArFSDataToUpload;
    dataTxId: TransactionID;
    driveId: DriveID;
    fileId: FileID;
    parentFolderId: FolderID;
}
export declare class ArFSPublicFileMetaDataPrototype extends ArFSFileMetaDataPrototype {
    readonly objectData: ArFSPublicFileMetadataTransactionData;
    readonly driveId: DriveID;
    readonly fileId: FileID;
    readonly parentFolderId: FolderID;
    readonly customMetaDataTags: CustomMetaDataGqlTags;
    readonly contentType: ContentType;
    constructor(objectData: ArFSPublicFileMetadataTransactionData, driveId: DriveID, fileId: FileID, parentFolderId: FolderID, customMetaDataTags?: CustomMetaDataGqlTags);
    static fromFile({ wrappedFile, dataTxId, parentFolderId, fileId, driveId }: ArFSPublicFileMetaDataPrototypeFromFileParams): ArFSPublicFileMetaDataPrototype;
}
export declare type ArFSPrivateFileMetaDataPrototypeFromFileParams = ArFSPublicFileMetaDataPrototypeFromFileParams & WithDriveKey;
export declare class ArFSPrivateFileMetaDataPrototype extends ArFSFileMetaDataPrototype {
    readonly objectData: ArFSPrivateFileMetadataTransactionData;
    readonly driveId: DriveID;
    readonly fileId: FileID;
    readonly parentFolderId: FolderID;
    readonly customMetaDataTags: CustomMetaDataGqlTags;
    readonly contentType: ContentType;
    constructor(objectData: ArFSPrivateFileMetadataTransactionData, driveId: DriveID, fileId: FileID, parentFolderId: FolderID, customMetaDataTags?: CustomMetaDataGqlTags);
    protected get protectedTags(): GQLTagInterface[];
    static fromFile({ wrappedFile, dataTxId, parentFolderId, fileId, driveId, driveKey }: ArFSPrivateFileMetaDataPrototypeFromFileParams): Promise<ArFSPrivateFileMetaDataPrototype>;
}
export declare abstract class ArFSFileDataPrototype extends ArFSObjectMetadataPrototype {
    abstract readonly objectData: ArFSFileDataTransactionData;
    abstract readonly contentType: DataContentType | typeof PRIVATE_CONTENT_TYPE;
    protected get protectedTags(): GQLTagInterface[];
}
export declare class ArFSPublicFileDataPrototype extends ArFSFileDataPrototype {
    readonly objectData: ArFSPublicFileDataTransactionData;
    readonly contentType: DataContentType;
    readonly customMetaDataTags: CustomMetaDataGqlTags;
    constructor(objectData: ArFSPublicFileDataTransactionData, contentType: DataContentType, customMetaDataTags?: CustomMetaDataGqlTags);
}
export declare class ArFSPrivateFileDataPrototype extends ArFSFileDataPrototype {
    readonly objectData: ArFSPrivateFileDataTransactionData;
    readonly customMetaDataTags: CustomMetaDataGqlTags;
    readonly contentType = "application/octet-stream";
    constructor(objectData: ArFSPrivateFileDataTransactionData, customMetaDataTags?: CustomMetaDataGqlTags);
    protected get protectedTags(): GQLTagInterface[];
}

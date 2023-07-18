/// <reference types="node" />
import { CipherIV, DataContentType, DriveKey, FileID, FileKey, FolderID, ByteCount, TransactionID, UnixTime, CipherType, DriveAuthMode, EntityMetaDataTransactionData, CustomMetaDataJsonFields } from '../../types';
/** Base class of an ArFS MetaData Tx's Data JSON */
export declare abstract class ArFSObjectTransactionData {
    abstract asTransactionData(): string | Buffer;
    sizeOf(): ByteCount;
    protected static parseCustomDataJsonFields(baseDataJson: EntityMetaDataTransactionData, dataJsonCustomMetaData: CustomMetaDataJsonFields): EntityMetaDataTransactionData;
    protected static assertProtectedDataJsonField(tagName: string): void;
    protected static get protectedDataJsonFields(): string[];
}
export declare abstract class ArFSDriveTransactionData extends ArFSObjectTransactionData {
    protected static get protectedDataJsonFields(): string[];
}
export declare class ArFSPublicDriveTransactionData extends ArFSDriveTransactionData {
    private readonly name;
    private readonly rootFolderId;
    protected readonly dataJsonCustomMetaData: CustomMetaDataJsonFields;
    private baseDataJson;
    private fullDataJson;
    constructor(name: string, rootFolderId: FolderID, dataJsonCustomMetaData?: CustomMetaDataJsonFields);
    asTransactionData(): string;
}
export declare class ArFSPrivateDriveTransactionData extends ArFSDriveTransactionData {
    readonly cipher: CipherType;
    readonly cipherIV: CipherIV;
    readonly encryptedDriveData: Buffer;
    readonly driveKey: DriveKey;
    readonly driveAuthMode: DriveAuthMode;
    private constructor();
    static from(name: string, rootFolderId: FolderID, driveKey: DriveKey, dataJsonCustomMetaData?: CustomMetaDataJsonFields): Promise<ArFSPrivateDriveTransactionData>;
    asTransactionData(): Buffer;
}
export declare abstract class ArFSFolderTransactionData extends ArFSObjectTransactionData {
}
export declare class ArFSPublicFolderTransactionData extends ArFSFolderTransactionData {
    private readonly name;
    protected readonly dataJsonCustomMetaData: CustomMetaDataJsonFields;
    private baseDataJson;
    private fullDataJson;
    constructor(name: string, dataJsonCustomMetaData?: CustomMetaDataJsonFields);
    asTransactionData(): string;
}
export declare class ArFSPrivateFolderTransactionData extends ArFSFolderTransactionData {
    readonly name: string;
    readonly cipher: CipherType;
    readonly cipherIV: CipherIV;
    readonly encryptedFolderData: Buffer;
    readonly driveKey: DriveKey;
    private constructor();
    static from(name: string, driveKey: DriveKey, dataJsonCustomMetaData?: CustomMetaDataJsonFields): Promise<ArFSPrivateFolderTransactionData>;
    asTransactionData(): Buffer;
}
export declare abstract class ArFSFileMetadataTransactionData extends ArFSObjectTransactionData {
    protected static get protectedDataJsonFields(): string[];
}
export declare class ArFSPublicFileMetadataTransactionData extends ArFSFileMetadataTransactionData {
    private readonly name;
    private readonly size;
    private readonly lastModifiedDate;
    private readonly dataTxId;
    private readonly dataContentType;
    private readonly dataJsonCustomMetaData;
    private baseDataJson;
    private fullDataJson;
    constructor(name: string, size: ByteCount, lastModifiedDate: UnixTime, dataTxId: TransactionID, dataContentType: DataContentType, dataJsonCustomMetaData?: CustomMetaDataJsonFields);
    asTransactionData(): string;
}
export declare class ArFSPrivateFileMetadataTransactionData extends ArFSFileMetadataTransactionData {
    readonly cipher: CipherType;
    readonly cipherIV: CipherIV;
    readonly encryptedFileMetadata: Buffer;
    readonly fileKey: FileKey;
    readonly driveAuthMode: DriveAuthMode;
    private constructor();
    static from(name: string, size: ByteCount, lastModifiedDate: UnixTime, dataTxId: TransactionID, dataContentType: DataContentType, fileId: FileID, driveKey: DriveKey, dataJsonCustomMetaData?: CustomMetaDataJsonFields): Promise<ArFSPrivateFileMetadataTransactionData>;
    asTransactionData(): Buffer;
}
export declare abstract class ArFSFileDataTransactionData extends ArFSObjectTransactionData {
}
export declare class ArFSPublicFileDataTransactionData extends ArFSFileDataTransactionData {
    private readonly fileData;
    constructor(fileData: Buffer);
    asTransactionData(): Buffer;
}
export declare class ArFSPrivateFileDataTransactionData extends ArFSFileDataTransactionData {
    readonly cipher: CipherType;
    readonly cipherIV: CipherIV;
    readonly encryptedFileData: Buffer;
    readonly driveAuthMode: DriveAuthMode;
    private constructor();
    static from(fileData: Buffer, fileId: FileID, driveKey: DriveKey): Promise<ArFSPrivateFileDataTransactionData>;
    asTransactionData(): string | Buffer;
}

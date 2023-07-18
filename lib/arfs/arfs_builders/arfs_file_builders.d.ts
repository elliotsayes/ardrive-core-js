import { ArweaveAddress, CipherIV, DriveKey, FileID, FileKey, ByteCount, TransactionID, UnixTime, GQLNodeInterface, GQLTagInterface, EntityMetaDataTransactionData, DataContentType } from '../../types';
import { ArFSPublicFile, ArFSPrivateFile } from '../arfs_entities';
import { ArFSFileOrFolderBuilder } from './arfs_builders';
import { GatewayAPI } from '../../utils/gateway_api';
export interface FileMetaDataTransactionData extends EntityMetaDataTransactionData {
    name: string;
    size: number;
    lastModifiedDate: number;
    dataTxId: string;
    dataContentType: DataContentType;
}
export declare abstract class ArFSFileBuilder<T extends ArFSPublicFile | ArFSPrivateFile> extends ArFSFileOrFolderBuilder<'file', T> {
    size?: ByteCount;
    lastModifiedDate?: UnixTime;
    dataTxId?: TransactionID;
    dataContentType?: DataContentType;
    getGqlQueryParameters(): GQLTagInterface[];
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    protected readonly protectedDataJsonKeys: string[];
}
export declare class ArFSPublicFileBuilder extends ArFSFileBuilder<ArFSPublicFile> {
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI): ArFSPublicFileBuilder;
    protected buildEntity(): Promise<ArFSPublicFile>;
}
export declare class ArFSPrivateFileBuilder extends ArFSFileBuilder<ArFSPrivateFile> {
    readonly fileId: FileID;
    private readonly driveKey;
    readonly owner?: ArweaveAddress;
    readonly fileKey?: FileKey;
    cipher?: string;
    cipherIV?: CipherIV;
    constructor(fileId: FileID, gatewayApi: GatewayAPI, driveKey: DriveKey, owner?: ArweaveAddress, fileKey?: FileKey);
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI, driveKey: DriveKey): ArFSPrivateFileBuilder;
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    protected buildEntity(): Promise<ArFSPrivateFile>;
}

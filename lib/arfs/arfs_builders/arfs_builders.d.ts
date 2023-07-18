/// <reference types="node" />
import { ArFSEntity, ArFSFileOrFolderEntity } from '../arfs_entities';
import { ArweaveAddress, DriveID, AnyEntityID, EntityKey, FolderID, TransactionID, UnixTime, ContentType, EntityType, GQLNodeInterface, GQLTagInterface, CustomMetaData, CustomMetaDataJsonFields, FeeMultiple } from '../../types';
import { GatewayAPI } from '../../utils/gateway_api';
export interface ArFSMetadataEntityBuilderParams {
    entityId: AnyEntityID;
    gatewayApi: GatewayAPI;
    owner?: ArweaveAddress;
}
export declare type ArFSPublicMetadataEntityBuilderParams = ArFSMetadataEntityBuilderParams;
export interface ArFSPrivateMetadataEntityBuilderParams extends ArFSMetadataEntityBuilderParams {
    key: EntityKey;
}
export declare type ArFSMetadataEntityBuilderFactoryFunction<T extends ArFSEntity, B extends ArFSMetadataEntityBuilder<T>, P extends ArFSMetadataEntityBuilderParams> = (params: P) => B;
export declare abstract class ArFSMetadataEntityBuilder<T extends ArFSEntity> {
    appName?: string;
    appVersion?: string;
    arFS?: string;
    contentType?: ContentType;
    driveId?: DriveID;
    entityType?: EntityType;
    name?: string;
    txId?: TransactionID;
    unixTime?: UnixTime;
    boost?: FeeMultiple;
    protected readonly entityId: AnyEntityID;
    protected readonly gatewayApi: GatewayAPI;
    protected readonly owner?: ArweaveAddress;
    customMetaData: CustomMetaData;
    constructor({ entityId, gatewayApi, owner }: ArFSMetadataEntityBuilderParams);
    abstract getGqlQueryParameters(): GQLTagInterface[];
    protected abstract buildEntity(): Promise<T>;
    getDataForTxID(txId: TransactionID): Promise<Buffer>;
    /**
     * Parses data for builder fields from either the provided GQL tags, or from a fresh request to Arweave for tag data
     *
     * @param node (optional) a pre-fetched GQL node containing the txID and tags that will be parsed out of the on-chain data
     *
     * @param owner (optional) filter all transactions out by owner's public arweave address
     *
     * @returns an array of unparsed tags
     */
    protected parseFromArweaveNode(node?: GQLNodeInterface, owner?: ArweaveAddress): Promise<GQLTagInterface[]>;
    build(node?: GQLNodeInterface): Promise<T>;
    private parseCustomMetaDataFromGqlTags;
    protected abstract protectedDataJsonKeys: string[];
    protected parseCustomMetaDataFromDataJson(dataJson: CustomMetaDataJsonFields): void;
}
export declare abstract class ArFSFileOrFolderBuilder<U extends 'file' | 'folder', T extends ArFSFileOrFolderEntity<U>> extends ArFSMetadataEntityBuilder<T> {
    parentFolderId?: FolderID;
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
}

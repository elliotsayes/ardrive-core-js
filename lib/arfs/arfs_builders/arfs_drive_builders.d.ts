import { PrivateKeyData } from '../private_key_data';
import { CipherIV, DriveKey, FolderID, EntityID, DriveAuthMode, DrivePrivacy, GQLNodeInterface, GQLTagInterface, EntityMetaDataTransactionData } from '../../types';
import { ArFSPublicDrive, ArFSPrivateDrive, ArFSDriveEntity } from '../arfs_entities';
import { ArFSMetadataEntityBuilder, ArFSMetadataEntityBuilderParams, ArFSPrivateMetadataEntityBuilderParams } from './arfs_builders';
import { GatewayAPI } from '../../utils/gateway_api';
export interface DriveMetaDataTransactionData extends EntityMetaDataTransactionData {
    name: string;
    rootFolderId: string;
}
declare abstract class ArFSDriveBuilder<T extends ArFSDriveEntity> extends ArFSMetadataEntityBuilder<T> {
    protected readonly protectedDataJsonKeys: string[];
}
export declare class ArFSPublicDriveBuilder extends ArFSDriveBuilder<ArFSPublicDrive> {
    drivePrivacy?: DrivePrivacy;
    rootFolderId?: FolderID;
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI): ArFSPublicDriveBuilder;
    getGqlQueryParameters(): GQLTagInterface[];
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    protected buildEntity(): Promise<ArFSPublicDrive>;
}
export declare class ArFSPrivateDriveBuilder extends ArFSDriveBuilder<ArFSPrivateDrive> {
    drivePrivacy?: DrivePrivacy;
    rootFolderId?: FolderID;
    driveAuthMode?: DriveAuthMode;
    cipher?: string;
    cipherIV?: CipherIV;
    private readonly driveKey;
    constructor({ entityId: driveId, key: driveKey, owner, gatewayApi }: ArFSPrivateMetadataEntityBuilderParams);
    getGqlQueryParameters(): GQLTagInterface[];
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI, driveKey: DriveKey): ArFSPrivateDriveBuilder;
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    protected buildEntity(): Promise<ArFSPrivateDrive>;
}
export declare class EncryptedEntityID extends EntityID {
    constructor();
}
export interface SafeArFSPrivateMetadataEntityBuilderParams extends ArFSMetadataEntityBuilderParams {
    privateKeyData: PrivateKeyData;
}
export declare class SafeArFSDriveBuilder extends ArFSDriveBuilder<ArFSDriveEntity> {
    drivePrivacy?: DrivePrivacy;
    rootFolderId?: FolderID;
    driveAuthMode?: DriveAuthMode;
    cipher?: string;
    cipherIV?: CipherIV;
    private readonly privateKeyData;
    constructor({ entityId: driveId, privateKeyData, gatewayApi }: SafeArFSPrivateMetadataEntityBuilderParams);
    getGqlQueryParameters(): GQLTagInterface[];
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI, privateKeyData: PrivateKeyData): SafeArFSDriveBuilder;
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    protected buildEntity(): Promise<ArFSDriveEntity>;
}
export {};

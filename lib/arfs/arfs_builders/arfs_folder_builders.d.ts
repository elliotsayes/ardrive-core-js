import { ArFSFileOrFolderBuilder } from './arfs_builders';
import { ArweaveAddress, CipherIV, DriveKey, FolderID, EntityID, GQLNodeInterface, GQLTagInterface } from '../../types';
import { ArFSPublicFolder, ArFSPrivateFolder } from '../arfs_entities';
import { GatewayAPI } from '../../utils/gateway_api';
export declare const ROOT_FOLDER_ID_PLACEHOLDER = "root folder";
export declare class RootFolderID extends EntityID {
    constructor();
}
export declare abstract class ArFSFolderBuilder<T extends ArFSPublicFolder | ArFSPrivateFolder> extends ArFSFileOrFolderBuilder<'folder', T> {
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    getGqlQueryParameters(): GQLTagInterface[];
    protected readonly protectedDataJsonKeys: string[];
}
export declare class ArFSPublicFolderBuilder extends ArFSFolderBuilder<ArFSPublicFolder> {
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI): ArFSPublicFolderBuilder;
    protected buildEntity(): Promise<ArFSPublicFolder>;
}
export declare class ArFSPrivateFolderBuilder extends ArFSFolderBuilder<ArFSPrivateFolder> {
    readonly folderId: FolderID;
    readonly gatewayApi: GatewayAPI;
    protected readonly driveKey: DriveKey;
    readonly owner?: ArweaveAddress;
    cipher?: string;
    cipherIV?: CipherIV;
    constructor(folderId: FolderID, gatewayApi: GatewayAPI, driveKey: DriveKey, owner?: ArweaveAddress);
    static fromArweaveNode(node: GQLNodeInterface, gatewayApi: GatewayAPI, driveKey: DriveKey): ArFSPrivateFolderBuilder;
    protected parseFromArweaveNode(node?: GQLNodeInterface): Promise<GQLTagInterface[]>;
    protected buildEntity(): Promise<ArFSPrivateFolder>;
}

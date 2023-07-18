/// <reference types="node" />
import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import Transaction from 'arweave/node/lib/transaction';
import { ArFSFileOrFolderBuilder } from './arfs_builders/arfs_builders';
import { ArFSFileOrFolderEntity, ArFSPrivateDrive, ArFSPublicFile, ArFSPrivateFile, ArFSPublicFolder, ArFSPrivateFolder, ArFSPrivateFileWithPaths, ArFSPrivateFolderWithPaths } from './arfs_entities';
import { ArFSCreateFolderResult, ArFSCreatePrivateDriveResult, ArFSMoveEntityResult, ArFSMoveEntityResultFactory, ArFSMovePublicFileResult, ArFSMovePrivateFileResult, ArFSMovePublicFolderResult, ArFSMovePrivateFolderResult, ArFSCreatePrivateBundledDriveResult, ArFSCreatePublicDriveResult, ArFSCreatePublicBundledDriveResult, ArFSUploadEntitiesResult, ArFSRenamePrivateFileResult, ArFSRenamePublicFileResult, ArFSRenamePublicFolderResult, ArFSRenamePrivateFolderResult, ArFSRenamePublicDriveResult, ArFSRenamePrivateDriveResult, ArFSV2PublicRetryResult } from './arfs_entity_result_factory';
import { ArFSManifestToUpload } from './arfs_file_wrapper';
import { MoveEntityMetaDataFactory } from './arfs_meta_data_factory';
import { ArFSAnonymousCache, ArFSDAOAnonymous, ArFSPublicDriveCacheKey, ArFSPublicFolderCacheKey } from './arfsdao_anonymous';
import { ArweaveAddress, GQLNodeInterface, DriveID, DriveKey, FolderID, RewardSettings, FileID, FileKey, TransactionID, CipherIV } from '../types';
import { NameConflictInfo } from '../utils/mapper_functions';
import { Wallet } from '../wallet';
import { ArFSEntityCache } from './arfs_entity_cache';
import { DataItem } from 'arbundles';
import { ArFSPrivateCreateFolderParams, ArFSPublicCreateFolderParams, ArFSCreatePublicDriveParams, ArFSCreatePrivateDriveParams, ArFSMoveParams, ArFSUploadPublicFileParams, ArFSUploadPrivateFileParams, ArFSAllPrivateFoldersOfDriveParams, ArFSGetPrivateChildFolderIdsParams, ArFSGetPublicChildFolderIdsParams, ArFSListPrivateFolderParams, ArFSRenamePublicFileParams, ArFSRenamePrivateDriveParams, ArFSRenamePrivateFolderParams, ArFSRenamePublicDriveParams, ArFSRenamePublicFolderParams, ArFSRenamePrivateFileParams, ArFSPrepareFileParams, ArFSPrepareFileResult, ArFSDownloadPrivateFolderParams, SeparatedFolderHierarchy, ArFSPrepareDataItemsParams, ArFSPrepareObjectBundleParams, ArFSPrepareObjectTransactionParams, ArFSRetryPublicFileUploadParams } from '../types/arfsdao_types';
import { CalculatedUploadPlan } from '../types/upload_planner_types';
import { Readable } from 'stream';
import { CipherIVQueryResult } from '../types/cipher_iv_query_result';
import { GatewayAPI } from '../utils/gateway_api';
import { ArFSTagSettings } from './arfs_tag_settings';
import { TxPreparer } from './tx/tx_preparer';
import { ArFSPublicFolderTransactionData, ArFSPrivateFolderTransactionData, ArFSPublicFileMetadataTransactionData, ArFSPrivateFileMetadataTransactionData } from './tx/arfs_tx_data_types';
/** Utility class for holding the driveId and driveKey of a new drive */
export declare class PrivateDriveKeyData {
    readonly driveId: DriveID;
    readonly driveKey: DriveKey;
    private constructor();
    static from(drivePassword: string, privateKey: JWKInterface): Promise<PrivateDriveKeyData>;
}
export interface ArFSPrivateDriveCacheKey extends ArFSPublicDriveCacheKey {
    driveKey: DriveKey;
}
export interface ArFSPrivateFolderCacheKey {
    folderId: FolderID;
    owner: ArweaveAddress;
    driveKey: DriveKey;
}
export interface ArFSPrivateFileCacheKey {
    fileId: FileID;
    owner: ArweaveAddress;
    fileKey: FileKey;
}
export interface ArFSCache extends ArFSAnonymousCache {
    privateDriveCache: ArFSEntityCache<ArFSPrivateDriveCacheKey, ArFSPrivateDrive>;
    privateFolderCache: ArFSEntityCache<ArFSPrivateFolderCacheKey, ArFSPrivateFolder>;
    privateFileCache: ArFSEntityCache<ArFSPrivateFileCacheKey, ArFSPrivateFile>;
    publicConflictCache: ArFSEntityCache<ArFSPublicFolderCacheKey, NameConflictInfo>;
    privateConflictCache: ArFSEntityCache<ArFSPrivateFolderCacheKey, NameConflictInfo>;
}
export declare class ArFSDAO extends ArFSDAOAnonymous {
    private readonly wallet;
    private readonly dryRun;
    /** @deprecated App Name should be provided with ArFSTagSettings  */
    protected appName: string;
    /** @deprecated App Version should be provided with ArFSTagSettings  */
    protected appVersion: any;
    protected readonly arFSTagSettings: ArFSTagSettings;
    protected caches: ArFSCache;
    protected gatewayApi: GatewayAPI;
    protected txPreparer: TxPreparer;
    constructor(wallet: Wallet, arweave: Arweave, dryRun?: boolean, 
    /** @deprecated App Name should be provided with ArFSTagSettings  */
    appName?: string, 
    /** @deprecated App Version should be provided with ArFSTagSettings  */
    appVersion?: any, arFSTagSettings?: ArFSTagSettings, caches?: ArFSCache, gatewayApi?: GatewayAPI, txPreparer?: TxPreparer);
    private shouldProgressLog;
    /** Prepare an ArFS folder entity for upload */
    private prepareFolder;
    /** Create a single folder as a V2 transaction */
    private createFolder;
    /** Create a single private folder as a V2 transaction */
    createPrivateFolder({ driveId, rewardSettings, parentFolderId, folderData }: ArFSPrivateCreateFolderParams): Promise<ArFSCreateFolderResult>;
    /** Create a single public folder as a V2 transaction */
    createPublicFolder({ driveId, rewardSettings, parentFolderId, folderData }: ArFSPublicCreateFolderParams): Promise<ArFSCreateFolderResult>;
    /** Prepare an ArFS drive entity for upload */
    private prepareDrive;
    /** Create drive and root folder together as bundled transaction */
    private createBundledDrive;
    /** Create drive and root folder as separate V2 transactions */
    private createV2TxDrive;
    /**
     * Create drive and root folder as a V2 transaction
     * OR a direct to network bundled transaction
     *
     * @remarks To bundle or not is determined during cost estimation,
     * and the provided rewardSettings will be type checked here to
     * determine the result type
     */
    private createDrive;
    /** Create an ArFS public drive */
    createPublicDrive({ driveName, rewardSettings }: ArFSCreatePublicDriveParams): Promise<ArFSCreatePublicDriveResult | ArFSCreatePublicBundledDriveResult>;
    /** Create an ArFS private drive */
    createPrivateDrive({ driveName, rewardSettings, newDriveData }: ArFSCreatePrivateDriveParams): Promise<ArFSCreatePrivateDriveResult | ArFSCreatePrivateBundledDriveResult>;
    moveEntity<R extends ArFSMoveEntityResult>(metaDataBaseReward: RewardSettings, metaDataFactory: MoveEntityMetaDataFactory, resultFactory: ArFSMoveEntityResultFactory<R>, cacheInvalidateFn: () => Promise<void>): Promise<R>;
    movePublicFile({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }: ArFSMoveParams<ArFSPublicFile, ArFSPublicFileMetadataTransactionData>): Promise<ArFSMovePublicFileResult>;
    movePrivateFile({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }: ArFSMoveParams<ArFSPrivateFile, ArFSPrivateFileMetadataTransactionData>): Promise<ArFSMovePrivateFileResult>;
    movePublicFolder({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }: ArFSMoveParams<ArFSPublicFolder, ArFSPublicFolderTransactionData>): Promise<ArFSMovePublicFolderResult>;
    movePrivateFolder({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }: ArFSMoveParams<ArFSPrivateFolder, ArFSPrivateFolderTransactionData>): Promise<ArFSMovePrivateFolderResult>;
    prepareFile<T extends DataItem | Transaction, U extends DataItem | Transaction>({ wrappedFile, dataPrototypeFactoryFn, metadataTxDataFactoryFn, prepareArFSObject, prepareMetaDataArFSObject }: ArFSPrepareFileParams<T, U>): Promise<ArFSPrepareFileResult<T, U>>;
    /** @deprecated -- Now uses the uploadAllEntities method internally. Will be removed in a future major release */
    uploadPublicFile({ parentFolderId: destFolderId, wrappedFile: wrappedEntity, driveId: destDriveId, rewardSettings, communityTipSettings }: ArFSUploadPublicFileParams): Promise<ArFSUploadEntitiesResult>;
    /** @deprecated -- Now uses the uploadAllEntities method internally. Will be removed in a future major release */
    uploadPrivateFile({ parentFolderId: destFolderId, wrappedFile: wrappedEntity, driveId: destDriveId, driveKey, rewardSettings, communityTipSettings }: ArFSUploadPrivateFileParams): Promise<ArFSUploadEntitiesResult>;
    private uploadFileAndMetaDataAsV2;
    private uploadOnlyFileAsV2;
    uploadAllEntities({ bundlePlans, v2TxPlans }: CalculatedUploadPlan): Promise<ArFSUploadEntitiesResult>;
    /** @deprecated -- Logic has been moved from ArFSDAO, use TxPreparer methods instead */
    prepareArFSDataItem({ objectMetaData, excludedTagNames }: ArFSPrepareDataItemsParams): Promise<DataItem>;
    /** @deprecated -- Logic has been moved from ArFSDAO, use TxPreparer methods instead */
    prepareArFSObjectBundle({ dataItems, rewardSettings, communityTipSettings }: ArFSPrepareObjectBundleParams): Promise<Transaction>;
    /** @deprecated -- Logic has been moved from ArFSDAO, use TxPreparer methods instead */
    prepareArFSObjectTransaction({ objectMetaData, rewardSettings, communityTipSettings, excludedTagNames }: ArFSPrepareObjectTransactionParams): Promise<Transaction>;
    sendTransactionsAsChunks(transactions: Transaction[], resumeChunkUpload?: boolean): Promise<void>;
    retryV2ArFSPublicFileTransaction({ wrappedFile, arFSDataTxId, createMetaDataPlan }: ArFSRetryPublicFileUploadParams): Promise<ArFSV2PublicRetryResult>;
    private createV2PublicFileMetaData;
    private reSeedV2FileTransaction;
    getPrivateDrive(driveId: DriveID, driveKey: DriveKey, owner: ArweaveAddress): Promise<ArFSPrivateDrive>;
    getPrivateFolder(folderId: FolderID, driveKey: DriveKey, owner: ArweaveAddress): Promise<ArFSPrivateFolder>;
    getPrivateFile(fileId: FileID, driveKey: DriveKey, owner: ArweaveAddress): Promise<ArFSPrivateFile>;
    getAllFoldersOfPrivateDrive({ driveId, driveKey, owner, latestRevisionsOnly }: ArFSAllPrivateFoldersOfDriveParams): Promise<ArFSPrivateFolder[]>;
    getPrivateFilesWithParentFolderIds(folderIDs: FolderID[], driveKey: DriveKey, owner: ArweaveAddress, latestRevisionsOnly?: boolean): Promise<ArFSPrivateFile[]>;
    getEntitiesInFolder<T extends ArFSFileOrFolderEntity<'file'> | ArFSFileOrFolderEntity<'folder'>>(parentFolderId: FolderID, owner: ArweaveAddress, builder: (node: GQLNodeInterface, entityType: 'file' | 'folder') => ArFSFileOrFolderBuilder<'file', ArFSFileOrFolderEntity<'file'>> | ArFSFileOrFolderBuilder<'folder', ArFSFileOrFolderEntity<'folder'>>, latestRevisionsOnly?: boolean, filterOnOwner?: boolean): Promise<T[]>;
    getPrivateEntitiesInFolder(parentFolderId: FolderID, owner: ArweaveAddress, driveKey: DriveKey, latestRevisionsOnly?: boolean): Promise<(ArFSPrivateFile | ArFSPrivateFolder)[]>;
    getPublicEntitiesInFolder(parentFolderId: FolderID, owner: ArweaveAddress, latestRevisionsOnly?: boolean): Promise<(ArFSPublicFile | ArFSPublicFolder)[]>;
    getChildrenFolderIds(folderId: FolderID, allFolderEntitiesOfDrive: ArFSFileOrFolderEntity<'folder'>[]): Promise<FolderID[]>;
    getPrivateEntityNamesInFolder(folderId: FolderID, owner: ArweaveAddress, driveKey: DriveKey): Promise<string[]>;
    getPublicEntityNamesInFolder(folderId: FolderID, owner: ArweaveAddress): Promise<string[]>;
    getPublicNameConflictInfoInFolder(folderId: FolderID, owner: ArweaveAddress): Promise<NameConflictInfo>;
    getPrivateNameConflictInfoInFolder(folderId: FolderID, owner: ArweaveAddress, driveKey: DriveKey): Promise<NameConflictInfo>;
    getPrivateChildrenFolderIds({ folderId, driveId, driveKey, owner }: ArFSGetPrivateChildFolderIdsParams): Promise<FolderID[]>;
    getPublicChildrenFolderIds({ folderId, owner, driveId }: ArFSGetPublicChildFolderIdsParams): Promise<FolderID[]>;
    getOwnerAndAssertDrive(driveId: DriveID, driveKey?: DriveKey): Promise<ArweaveAddress>;
    /**
     * Lists the children of certain private folder
     * @param {FolderID} folderId the folder ID to list children of
     * @param {DriveKey} driveKey the drive key used for drive and folder data decryption and file key derivation
     * @param {number} maxDepth a non-negative integer value indicating the depth of the folder tree to list where 0 = this folder's contents only
     * @param {boolean} includeRoot whether or not folderId's folder data should be included in the listing
     * @param {ArweaveAddress} owner the arweave address of the wallet which owns the drive
     * @param withPathsFactory a factory function used to map the returned entities into
     * @returns {Promise<(ArFSPrivateFolderWithPaths | ArFSPrivateFileWithPaths)[]>} an array representation of the children and parent folder
     */
    listPrivateFolder({ folderId, driveKey, maxDepth, includeRoot, owner, withPathsFactory }: ArFSListPrivateFolderParams): Promise<(ArFSPrivateFolderWithPaths | ArFSPrivateFileWithPaths)[]>;
    assertValidPassword(password: string): Promise<void>;
    getPrivateTransactionCipherIV(txId: TransactionID): Promise<CipherIV>;
    getCipherIVOfPrivateTransactionIDs(txIDs: TransactionID[]): Promise<CipherIVQueryResult[]>;
    /**
     * Returns the data stream of a private file
     * @param privateFile - the entity of the data to be download
     * @returns {Promise<Readable>}
     */
    getPrivateDataStream(privateFile: ArFSPrivateFile): Promise<Readable>;
    getAuthTagForPrivateFile(privateFile: ArFSPrivateFile): Promise<Buffer>;
    renamePublicFile({ file, newName, metadataRewardSettings }: ArFSRenamePublicFileParams): Promise<ArFSRenamePublicFileResult>;
    renamePrivateFile({ file, newName, metadataRewardSettings, driveKey }: ArFSRenamePrivateFileParams): Promise<ArFSRenamePrivateFileResult>;
    renamePublicFolder({ folder, newName, metadataRewardSettings }: ArFSRenamePublicFolderParams): Promise<ArFSRenamePublicFolderResult>;
    renamePrivateFolder({ folder, newName, metadataRewardSettings, driveKey }: ArFSRenamePrivateFolderParams): Promise<ArFSRenamePrivateFolderResult>;
    renamePublicDrive({ drive, newName, metadataRewardSettings }: ArFSRenamePublicDriveParams): Promise<ArFSRenamePublicDriveResult>;
    renamePrivateDrive({ drive, newName, metadataRewardSettings, driveKey }: ArFSRenamePrivateDriveParams): Promise<ArFSRenamePrivateDriveResult>;
    downloadPrivateFolder({ folderId, destFolderPath, customFolderName, maxDepth, driveKey, owner }: ArFSDownloadPrivateFolderParams): Promise<void>;
    separatedHierarchyOfFolder(folder: ArFSPrivateFolder, owner: ArweaveAddress, driveKey: DriveKey, maxDepth: number): Promise<SeparatedFolderHierarchy<ArFSPrivateFile, ArFSPrivateFolder>>;
    getManifestLinks(dataTxId: TransactionID, manifest: ArFSManifestToUpload): string[];
}

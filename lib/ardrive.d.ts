import { ArDriveAnonymous } from './ardrive_anonymous';
import { ArFSPrivateDrive, ArFSPrivateFolder, ArFSPrivateFile, ArFSPrivateFolderKeyless, ArFSPrivateFolderWithPaths, ArFSPrivateFileWithPaths } from './arfs/arfs_entities';
import { ArFSFileMetadataTransactionData, ArFSObjectTransactionData } from './arfs/tx/arfs_tx_data_types';
import { ArFSDAO } from './arfs/arfsdao';
import { CommunityOracle } from './community/community_oracle';
import { ARDataPriceEstimator } from './pricing/ar_data_price_estimator';
import { FeeMultiple, ArweaveAddress, FolderID, Winston, FileID, DriveID, UploadPublicFileParams, UploadPrivateFileParams, ArFSManifestResult, UploadPublicManifestParams, DownloadPrivateFileParameters, DownloadPrivateFolderParameters, DownloadPrivateDriveParameters, UploadAllEntitiesParams, RenamePublicFileParams, RenamePrivateFileParams, RenamePublicFolderParams, RenamePrivateFolderParams, CommunityTipParams, TipResult, MovePublicFileParams, ArFSResult, MovePrivateFileParams, MovePublicFolderParams, MovePrivateFolderParams, BulkPublicUploadParams, BulkPrivateUploadParams, CreatePublicFolderParams, CreatePrivateFolderParams, CreatePublicDriveParams, CreatePrivateDriveParams, GetPrivateDriveParams, GetPrivateFolderParams, GetPrivateFileParams, ListPrivateFolderParams, MetaDataBaseCosts, RenamePublicDriveParams, RenamePrivateDriveParams, DriveKey, RetryPublicArFSFileByFileIdParams, RetryPublicArFSFileByDestFolderIdParams } from './types';
import { Wallet } from './wallet';
import { WalletDAO } from './wallet_dao';
import { UploadPlanner } from './arfs/arfs_upload_planner';
import { ArFSTagSettings } from './arfs/arfs_tag_settings';
import { CostCalculator } from './arfs/arfs_cost_calculator';
export declare class ArDrive extends ArDriveAnonymous {
    private readonly wallet;
    private readonly walletDao;
    protected readonly arFsDao: ArFSDAO;
    private readonly communityOracle;
    /** @deprecated App Name should be provided with ArFSTagSettings  */
    protected readonly appName: string;
    /** @deprecated App Version should be provided with ArFSTagSettings  */
    protected readonly appVersion: string;
    private readonly priceEstimator;
    private readonly feeMultiple;
    private readonly dryRun;
    private readonly arFSTagSettings;
    private readonly uploadPlanner;
    private readonly costCalculator;
    constructor(wallet: Wallet, walletDao: WalletDAO, arFsDao: ArFSDAO, communityOracle: CommunityOracle, 
    /** @deprecated App Name should be provided with ArFSTagSettings  */
    appName?: string, 
    /** @deprecated App Version should be provided with ArFSTagSettings  */
    appVersion?: string, priceEstimator?: ARDataPriceEstimator, feeMultiple?: FeeMultiple, dryRun?: boolean, arFSTagSettings?: ArFSTagSettings, uploadPlanner?: UploadPlanner, costCalculator?: CostCalculator);
    /**
     * @deprecated Sending separate layer 1 community tips is discouraged due
     *  to concerns with network congestion. We find it safer to place the tip
     *  on the layer 1 data transaction or bundle transaction. This also prevents
     *  separation of file data and tip payment
     *
     * @remarks Presumes that there's a sufficient wallet balance
     */
    sendCommunityTip({ communityWinstonTip, assertBalance }: CommunityTipParams): Promise<TipResult>;
    movePublicFile({ fileId, newParentFolderId }: MovePublicFileParams): Promise<ArFSResult>;
    movePrivateFile({ fileId, newParentFolderId, driveKey }: MovePrivateFileParams): Promise<ArFSResult>;
    movePublicFolder({ folderId, newParentFolderId }: MovePublicFolderParams): Promise<ArFSResult>;
    movePrivateFolder({ folderId, newParentFolderId, driveKey }: MovePrivateFolderParams): Promise<ArFSResult>;
    /**
     * Utility method to resolve any name conflicts for a bulk upload
     *
     * @returns An array of upload stats that have had their name conflicts resolved
     */
    private resolveBulkNameConflicts;
    /**
     * Upload any number of entities, each to their own destination folder and with their own potential driveKeys
     *
     * @remarks The presence of a drive key on the entitiesToUpload determines the privacy of each upload
     */
    uploadAllEntities({ entitiesToUpload, conflictResolution, prompts }: UploadAllEntitiesParams): Promise<ArFSResult>;
    retryPublicArFSFileUploadByFileId({ dataTxId, wrappedFile, fileId }: RetryPublicArFSFileByFileIdParams): Promise<ArFSResult>;
    retryPublicArFSFileUploadByDestFolderId({ dataTxId, wrappedFile, conflictResolution, destinationFolderId }: RetryPublicArFSFileByDestFolderIdParams): Promise<ArFSResult>;
    private retryPublicArFSFileUpload;
    private deriveMetaDataTxIdForFileId;
    private deriveMetaDataTxFromPublicFolder;
    private assertFolderExists;
    private assertWriteFileMetaData;
    private deriveAndAssertV2PublicFileMetaDataRewardSettings;
    /** @deprecated -- Now uses the uploadAllEntities method internally. Will be removed in a future major release */
    uploadPublicFile({ parentFolderId, wrappedFile, conflictResolution, destinationFileName, prompts }: UploadPublicFileParams): Promise<ArFSResult>;
    /** @deprecated -- Now uses the uploadAllEntities method internally. Will be removed in a future major release */
    uploadPrivateFile({ wrappedFile, parentFolderId, prompts, destinationFileName, conflictResolution, driveKey }: UploadPrivateFileParams): Promise<ArFSResult>;
    /** @deprecated -- Now uses the uploadAllEntities method internally. Will be removed in a future major release */
    createPublicFolderAndUploadChildren({ parentFolderId, wrappedFolder, destParentFolderName, conflictResolution, prompts }: BulkPublicUploadParams): Promise<ArFSResult>;
    /** @deprecated -- Now uses the uploadAllEntities method internally. Will be removed in a future major release */
    createPrivateFolderAndUploadChildren({ parentFolderId, wrappedFolder, driveKey, destParentFolderName, conflictResolution, prompts }: BulkPrivateUploadParams): Promise<ArFSResult>;
    uploadPublicManifest({ folderId, destManifestName, maxDepth, conflictResolution, prompts }: UploadPublicManifestParams): Promise<ArFSManifestResult>;
    createPublicFolder({ folderName, parentFolderId }: CreatePublicFolderParams): Promise<ArFSResult>;
    createPrivateFolder({ folderName, driveKey, parentFolderId, driveId }: CreatePrivateFolderParams): Promise<ArFSResult>;
    private createDrive;
    createPublicDrive(params: CreatePublicDriveParams): Promise<ArFSResult>;
    createPrivateDrive(params: CreatePrivateDriveParams): Promise<ArFSResult>;
    assertOwnerAddress(owner: ArweaveAddress): Promise<void>;
    getPrivateDrive({ driveId, driveKey, owner, withKeys }: GetPrivateDriveParams): Promise<ArFSPrivateDrive>;
    getPrivateFolder({ folderId, driveKey, owner, withKeys }: GetPrivateFolderParams): Promise<ArFSPrivateFolder>;
    getPrivateFolderKeyless({ folderId, driveKey, owner }: GetPrivateFolderParams): Promise<ArFSPrivateFolderKeyless>;
    getPrivateFile({ fileId, driveKey, owner, withKeys }: GetPrivateFileParams): Promise<ArFSPrivateFile>;
    /**
     * Lists the children of certain private folder
     * @param {FolderID} folderId the folder ID to list children of
     * @returns {ArFSPrivateFileOrFolderWithPaths[]} an array representation of the children and parent folder
     */
    listPrivateFolder({ folderId, driveKey, maxDepth, includeRoot, owner, withKeys }: ListPrivateFolderParams): Promise<(ArFSPrivateFolderWithPaths | ArFSPrivateFileWithPaths)[]>;
    /** Throw an error if wallet balance does not cover cost of the provided winston  */
    assertWalletBalance(winston: Winston): Promise<void>;
    estimateAndAssertCostOfMoveFile(metadata: ArFSFileMetadataTransactionData): Promise<MetaDataBaseCosts>;
    estimateAndAssertCostOfFolderUpload(metaData: ArFSObjectTransactionData): Promise<MetaDataBaseCosts>;
    estimateAndAssertCostOfFileRename(metadata: ArFSObjectTransactionData): Promise<MetaDataBaseCosts>;
    estimateAndAssertCostOfFolderRename(metadata: ArFSObjectTransactionData): Promise<MetaDataBaseCosts>;
    estimateAndAssertCostOfDriveRename(metadata: ArFSObjectTransactionData): Promise<MetaDataBaseCosts>;
    private estimateAndAssertCostOfMetaDataTx;
    getDriveIdForFileId(fileId: FileID): Promise<DriveID>;
    getDriveIdForFolderId(folderId: FolderID): Promise<DriveID>;
    assertValidPassword(password: string): Promise<void>;
    downloadPrivateFile({ fileId, driveKey, destFolderPath, defaultFileName }: DownloadPrivateFileParameters): Promise<void>;
    assertUniqueNameWithinPublicFolder(name: string, folderId: FolderID): Promise<void>;
    assertUniqueNameWithinPrivateFolder(name: string, folderId: FolderID, driveKey: DriveKey): Promise<void>;
    renamePublicFile({ fileId, newName }: RenamePublicFileParams): Promise<ArFSResult>;
    renamePrivateFile({ fileId, newName, driveKey }: RenamePrivateFileParams): Promise<ArFSResult>;
    renamePublicFolder({ folderId, newName }: RenamePublicFolderParams): Promise<ArFSResult>;
    renamePrivateFolder({ folderId, newName, driveKey }: RenamePrivateFolderParams): Promise<ArFSResult>;
    renamePublicDrive({ driveId, newName }: RenamePublicDriveParams): Promise<ArFSResult>;
    renamePrivateDrive({ driveId, newName, driveKey }: RenamePrivateDriveParams): Promise<ArFSResult>;
    downloadPrivateFolder({ folderId, destFolderPath, customFolderName, maxDepth, driveKey, owner }: DownloadPrivateFolderParameters): Promise<void>;
    downloadPrivateDrive({ driveId, destFolderPath, customFolderName, maxDepth, driveKey, owner }: DownloadPrivateDriveParameters): Promise<void>;
}

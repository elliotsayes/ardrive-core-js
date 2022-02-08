import Arweave from 'arweave';
import { v4 as uuidv4 } from 'uuid';
import { CreateTransactionInterface } from 'arweave/node/common';
import { JWKInterface } from 'arweave/node/lib/wallet';
import Transaction from 'arweave/node/lib/transaction';
import { ArFSFileOrFolderBuilder } from './arfs_builders/arfs_builders';
import { ArFSPrivateDriveBuilder, SafeArFSDriveBuilder } from './arfs_builders/arfs_drive_builders';
import { ArFSPrivateFileBuilder, ArFSPublicFileBuilder } from './arfs_builders/arfs_file_builders';
import { ArFSPrivateFolderBuilder, ArFSPublicFolderBuilder } from './arfs_builders/arfs_folder_builders';
import {
	ArFSFileOrFolderEntity,
	ArFSPrivateDrive,
	ArFSPublicFile,
	ArFSPrivateFile,
	ArFSPublicFolder,
	ArFSPrivateFolder,
	ArFSPrivateFileOrFolderWithPaths,
	ENCRYPTED_DATA_PLACEHOLDER
} from './arfs_entities';
import {
	ArFSCreateFolderResult,
	ArFSCreateDriveResult,
	ArFSCreatePrivateDriveResult,
	ArFSMoveEntityResult,
	ArFSMoveEntityResultFactory,
	ArFSMovePublicFileResult,
	ArFSMovePrivateFileResult,
	ArFSMovePublicFolderResult,
	ArFSMovePrivateFolderResult,
	ArFSUploadFileResult,
	ArFSUploadPrivateFileResult,
	ArFSCreateBundledDriveResult,
	ArFSCreatePrivateBundledDriveResult,
	ArFSCreatePublicDriveResult,
	ArFSCreatePublicBundledDriveResult,
	ArFSUploadBundledFileResult,
	ArFSUploadFileV2TxResult
} from './arfs_entity_result_factory';
import { ArFSFolderToDownload, ArFSPrivateFileToDownload } from './arfs_file_wrapper';
import { MoveEntityMetaDataFactory } from './arfs_meta_data_factory';
import {
	ArFSPublicFolderMetaDataPrototype,
	ArFSPrivateFolderMetaDataPrototype,
	ArFSPrivateDriveMetaDataPrototype,
	ArFSPublicFileMetaDataPrototype,
	ArFSPrivateFileMetaDataPrototype,
	ArFSPublicFileDataPrototype,
	ArFSPrivateFileDataPrototype,
	ArFSFolderMetaDataPrototype,
	ArFSDriveMetaDataPrototype,
	ArFSPublicDriveMetaDataPrototype
} from './arfs_prototypes';
import {
	ArFSPublicFolderTransactionData,
	ArFSPrivateFolderTransactionData,
	ArFSPrivateDriveTransactionData,
	ArFSPublicFileMetadataTransactionData,
	ArFSPrivateFileMetadataTransactionData,
	ArFSPublicFileDataTransactionData,
	ArFSPrivateFileDataTransactionData,
	ArFSPublicDriveTransactionData
} from './arfs_tx_data_types';
import { FolderHierarchy } from './folder_hierarchy';

import {
	ArFSAnonymousCache,
	ArFSDAOAnonymous,
	ArFSPublicDriveCacheKey,
	defaultArFSAnonymousCache
} from './arfsdao_anonymous';
import { deriveDriveKey, deriveFileKey, driveDecrypt } from '../utils/crypto';
import { DEFAULT_APP_NAME, DEFAULT_APP_VERSION, gatewayURL, authTagLength, graphQLURL } from '../utils/constants';
import { PrivateKeyData } from './private_key_data';
import {
	EID,
	ArweaveAddress,
	TxID,
	W,
	GQLTagInterface,
	GQLEdgeInterface,
	GQLNodeInterface,
	DrivePrivacy,
	DriveID,
	DriveKey,
	FolderID,
	RewardSettings,
	FileID,
	FileKey,
	TransactionID,
	CipherIV,
	GQLTransactionsResultInterface
} from '../types';
import { latestRevisionFilter, fileFilter, folderFilter } from '../utils/filter_methods';
import {
	entityToNameMap,
	NameConflictInfo,
	fileConflictInfoMap,
	folderToNameAndIdMap
} from '../utils/mapper_functions';
import { buildQuery, ASCENDING_ORDER } from '../utils/query';
import { Wallet } from '../wallet';
import { JWKWallet } from '../jwk_wallet';
import { ArFSEntityCache } from './arfs_entity_cache';

import { bundleAndSignData, createData, DataItem } from 'arbundles';
import { ArweaveSigner } from 'arbundles/src/signing';
import {
	ArFSPrepareFolderParams,
	ArFSPrepareFolderResult,
	ArFSPrivateCreateFolderParams,
	ArFSPublicCreateFolderParams,
	ArFSPrepareDriveParams,
	ArFSPrepareDriveResult,
	ArFSCreatePublicDriveParams,
	ArFSCreatePrivateDriveParams,
	ArFSMoveParams,
	ArFSUploadPublicFileParams,
	ArFSUploadPrivateFileParams,
	ArFSPrepareObjectTransactionParams,
	ArFSAllPrivateFoldersOfDriveParams,
	ArFSGetPrivateChildFolderIdsParams,
	ArFSGetPublicChildFolderIdsParams,
	ArFSListPrivateFolderParams,
	ArFSTxResult,
	ArFSPrepareDataItemsParams,
	ArFSPrepareObjectBundleParams,
	ArFSPrepareFileParams,
	ArFSPrepareFileResult,
	CommunityTipSettings,
	PartialPrepareFileParams,
	PartialPrepareDriveParams,
	ArFSDownloadPrivateFolderParams,
	SeparatedFolderHierarchy
} from '../types/arfsdao_types';
import {
	CreateDriveRewardSettings,
	CreateDriveV2TxRewardSettings,
	isBundleRewardSetting,
	UploadFileRewardSettings,
	UploadFileV2TxRewardSettings
} from '../types/upload_planner_types';
import { ArFSTagSettings } from './arfs_tag_settings';
import axios, { AxiosRequestConfig } from 'axios';
import axiosRetry, { exponentialDelay } from 'axios-retry';
import { Readable } from 'stream';
import { join as joinPath } from 'path';
import { StreamDecrypt } from '../utils/stream_decrypt';
import { CipherIVQueryResult } from '../types/cipher_iv_query_result';
import { alphabeticalOrder } from '../utils/sort_functions';
import { ArFSPublicFileOrFolderWithPaths } from '../exports';

/** Utility class for holding the driveId and driveKey of a new drive */
export class PrivateDriveKeyData {
	private constructor(readonly driveId: DriveID, readonly driveKey: DriveKey) {}

	static async from(drivePassword: string, privateKey: JWKInterface): Promise<PrivateDriveKeyData> {
		const driveId = uuidv4();
		const driveKey = await deriveDriveKey(drivePassword, driveId, JSON.stringify(privateKey));
		return new PrivateDriveKeyData(EID(driveId), driveKey);
	}
}

// export interface PrepareObjectTransactionParams {
// 	objectMetaData: ArFSObjectMetadataPrototype;
// 	rewardSettings?: RewardSettings;
// 	excludedTagNames?: string[];
// 	otherTags?: GQLTagInterface[];
// }

// export interface ArFSMoveParams<O extends ArFSFileOrFolderEntity, T extends ArFSObjectTransactionData> {
// 	originalMetaData: O;
// 	newParentFolderId: FolderID;
// 	metaDataBaseReward: RewardSettings;
// 	transactionData: T;
// }

// export type GetDriveFunction = () => Promise<ArFSPublicDrive | ArFSPrivateDrive>;
// export type CreateFolderFunction = (driveId: DriveID) => Promise<ArFSCreateFolderResult>;
// export type GenerateDriveIdFn = () => DriveID;

// export type ArFSListPrivateFolderParams = Required<ListPrivateFolderParams>;

// export interface ArFSUploadPublicFileParams {
// 	parentFolderId: FolderID;
// 	wrappedFile: ArFSEntityToUpload;
// 	driveId: DriveID;
// 	fileDataRewardSettings: RewardSettings;
// 	metadataRewardSettings: RewardSettings;
// 	destFileName?: string;
// 	existingFileId?: FileID;
// }

// export interface ArFSUploadPrivateFileParams extends ArFSUploadPublicFileParams {
// 	driveKey: DriveKey;
// }

// export type ArFSAllPrivateFoldersOfDriveParams = ArFSAllPublicFoldersOfDriveParams & WithDriveKey;

// export interface CreateFolderSettings {
// 	driveId: DriveID;
// 	rewardSettings: RewardSettings;
// 	parentFolderId?: FolderID;
// 	syncParentFolderId?: boolean;
// 	owner: ArweaveAddress;
// }

// export interface CreatePublicFolderSettings extends CreateFolderSettings {
// 	folderData: ArFSPublicFolderTransactionData;
// }

// export interface CreatePrivateFolderSettings extends CreateFolderSettings {
// 	folderData: ArFSPrivateFolderTransactionData;
// 	driveKey: DriveKey;
// }

// interface getPublicChildrenFolderIdsParams {
// 	folderId: FolderID;
// 	driveId: DriveID;
// 	owner: ArweaveAddress;
// }
// interface getPrivateChildrenFolderIdsParams extends getPublicChildrenFolderIdsParams {
// 	driveKey: DriveKey;
// }

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
}

export class ArFSDAO extends ArFSDAOAnonymous {
	// TODO: Can we abstract Arweave type(s)?
	constructor(
		private readonly wallet: Wallet,
		arweave: Arweave,
		private readonly dryRun = false,
		/** @deprecated App Name should be provided with ArFSTagSettings  */
		protected appName = DEFAULT_APP_NAME,
		/** @deprecated App Version should be provided with ArFSTagSettings  */
		protected appVersion = DEFAULT_APP_VERSION,
		protected readonly arFSTagSettings: ArFSTagSettings = new ArFSTagSettings({ appName, appVersion }),
		protected caches: ArFSCache = {
			...defaultArFSAnonymousCache,
			privateDriveCache: new ArFSEntityCache<ArFSPrivateDriveCacheKey, ArFSPrivateDrive>(10),
			privateFolderCache: new ArFSEntityCache<ArFSPrivateFolderCacheKey, ArFSPrivateFolder>(10),
			privateFileCache: new ArFSEntityCache<ArFSPrivateFileCacheKey, ArFSPrivateFile>(10)
		}
	) {
		super(arweave, undefined, undefined, caches);
	}

	/** Prepare an ArFS folder entity for upload */
	private async prepareFolder<T>({
		folderPrototypeFactory,
		prepareArFSObject
	}: ArFSPrepareFolderParams<T>): Promise<ArFSPrepareFolderResult<T>> {
		// Generate a new folder ID
		const folderId = EID(uuidv4());

		// Create a folder metadata transaction
		const folderMetadata = folderPrototypeFactory(folderId);

		// Prepare the ArFS folder transaction or dataItem
		const arFSObjects = [await prepareArFSObject(folderMetadata)];

		return { arFSObjects, folderId };
	}

	/** Create a single folder as a V2 transaction */
	private async createFolder(
		folderPrototypeFactory: (folderId: FolderID) => ArFSFolderMetaDataPrototype,
		rewardSettings: RewardSettings
	): Promise<ArFSCreateFolderResult> {
		const { arFSObjects, folderId } = await this.prepareFolder({
			folderPrototypeFactory,
			prepareArFSObject: (folderMetaData) =>
				this.prepareArFSObjectTransaction({ objectMetaData: folderMetaData, rewardSettings })
		});
		const folderTx = arFSObjects[0];

		await this.sendTransactionsAsChunks([folderTx]);

		return { metaDataTxId: TxID(folderTx.id), metaDataTxReward: W(folderTx.reward), folderId };
	}

	/** Create a single private folder as a V2 transaction */
	public async createPrivateFolder({
		driveId,
		rewardSettings,
		parentFolderId,
		folderData
	}: ArFSPrivateCreateFolderParams): Promise<ArFSCreateFolderResult> {
		return this.createFolder(
			(folderId) => new ArFSPrivateFolderMetaDataPrototype(driveId, folderId, folderData, parentFolderId),
			rewardSettings
		);
	}

	/** Create a single public folder as a V2 transaction */
	public async createPublicFolder({
		driveId,
		rewardSettings,
		parentFolderId,
		folderData
	}: ArFSPublicCreateFolderParams): Promise<ArFSCreateFolderResult> {
		return this.createFolder(
			(folderId) => new ArFSPublicFolderMetaDataPrototype(folderData, driveId, folderId, parentFolderId),
			rewardSettings
		);
	}

	/** Prepare an ArFS drive entity for upload */
	private async prepareDrive<T>({
		drivePrototypeFactory,
		prepareArFSObject,
		rootFolderPrototypeFactory,
		generateDriveIdFn
	}: ArFSPrepareDriveParams<T>): Promise<ArFSPrepareDriveResult<T>> {
		// Generate a new drive ID for the new drive
		const driveId = generateDriveIdFn();

		// Create ArFS root folder object
		const { arFSObjects, folderId: rootFolderId } = await this.prepareFolder({
			folderPrototypeFactory: (folderId) => rootFolderPrototypeFactory(folderId, driveId),
			prepareArFSObject
		});
		const rootFolderArFSObject = arFSObjects[0];

		// Create ArFS drive object
		const driveMetaData = await drivePrototypeFactory(driveId, rootFolderId);
		const driveArFSObject = await prepareArFSObject(driveMetaData);

		return { arFSObjects: [rootFolderArFSObject, driveArFSObject], driveId, rootFolderId };
	}

	/** Create drive and root folder together as bundled transaction */
	private async createBundledDrive(
		sharedPrepDriveParams: PartialPrepareDriveParams,
		rewardSettings: RewardSettings
	): Promise<ArFSTxResult<ArFSCreateBundledDriveResult>> {
		const { arFSObjects, driveId, rootFolderId } = await this.prepareDrive({
			...sharedPrepDriveParams,
			prepareArFSObject: (objectMetaData) =>
				this.prepareArFSDataItem({
					objectMetaData
				})
		});

		// Pack data items into a bundle
		const bundledTx = await this.prepareArFSObjectBundle({ dataItems: arFSObjects, rewardSettings });

		const [rootFolderDataItem, driveDataItem] = arFSObjects;
		return {
			transactions: [bundledTx],
			result: {
				bundleTxId: TxID(bundledTx.id),
				bundleTxReward: W(bundledTx.reward),
				driveId,
				metaDataTxId: TxID(driveDataItem.id),
				rootFolderId,
				rootFolderTxId: TxID(rootFolderDataItem.id)
			}
		};
	}

	/** Create drive and root folder as separate V2 transactions */
	private async createV2TxDrive(
		sharedPrepDriveParams: PartialPrepareDriveParams,
		{ driveRewardSettings, rootFolderRewardSettings }: CreateDriveV2TxRewardSettings
	): Promise<ArFSTxResult<ArFSCreateDriveResult>> {
		const { arFSObjects, driveId, rootFolderId } = await this.prepareDrive({
			...sharedPrepDriveParams,
			prepareArFSObject: (objectMetaData) =>
				this.prepareArFSObjectTransaction({
					objectMetaData,
					rewardSettings:
						// Type-check the metadata to conditionally pass correct reward setting
						objectMetaData instanceof ArFSDriveMetaDataPrototype
							? driveRewardSettings
							: rootFolderRewardSettings
				})
		});

		const [rootFolderTx, driveTx] = arFSObjects;
		return {
			transactions: arFSObjects,
			result: {
				metaDataTxId: TxID(driveTx.id),
				metaDataTxReward: W(driveTx.reward),
				driveId,
				rootFolderId,
				rootFolderTxId: TxID(rootFolderTx.id),
				rootFolderTxReward: W(rootFolderTx.reward)
			}
		};
	}

	/**
	 * Create drive and root folder as a V2 transaction
	 * OR a direct to network bundled transaction
	 *
	 * @remarks To bundle or not is determined during cost estimation,
	 * and the provided rewardSettings will be type checked here to
	 * determine the result type
	 */
	private async createDrive(
		sharedPrepDriveParams: PartialPrepareDriveParams,
		rewardSettings: CreateDriveRewardSettings
	): Promise<ArFSCreateDriveResult | ArFSCreateBundledDriveResult> {
		const { transactions, result } = isBundleRewardSetting(rewardSettings)
			? await this.createBundledDrive(sharedPrepDriveParams, rewardSettings.bundleRewardSettings)
			: await this.createV2TxDrive(sharedPrepDriveParams, rewardSettings);

		// Upload all v2 transactions or direct to network bundles
		await this.sendTransactionsAsChunks(transactions);
		return result;
	}

	/** Create an ArFS public drive */
	public async createPublicDrive({
		driveName,
		rewardSettings
	}: ArFSCreatePublicDriveParams): Promise<ArFSCreatePublicDriveResult | ArFSCreatePublicBundledDriveResult> {
		const folderData = new ArFSPublicFolderTransactionData(driveName);

		const prepPublicDriveParams: PartialPrepareDriveParams = {
			rootFolderPrototypeFactory: (folderId: FolderID, driveId: DriveID) =>
				new ArFSPublicFolderMetaDataPrototype(folderData, driveId, folderId),
			generateDriveIdFn: () => EID(uuidv4()),
			drivePrototypeFactory: async (driveId: DriveID, rootFolderId: FolderID) =>
				Promise.resolve(
					new ArFSPublicDriveMetaDataPrototype(
						new ArFSPublicDriveTransactionData(driveName, rootFolderId),
						driveId
					)
				)
		};

		return this.createDrive(prepPublicDriveParams, rewardSettings);
	}

	/** Create an ArFS private drive */
	public async createPrivateDrive({
		driveName,
		rewardSettings,
		newDriveData
	}: ArFSCreatePrivateDriveParams): Promise<ArFSCreatePrivateDriveResult | ArFSCreatePrivateBundledDriveResult> {
		const folderData = await ArFSPrivateFolderTransactionData.from(driveName, newDriveData.driveKey);

		const prepPrivateDriveParams: PartialPrepareDriveParams = {
			rootFolderPrototypeFactory: (folderId: FolderID, driveId: DriveID) =>
				new ArFSPrivateFolderMetaDataPrototype(driveId, folderId, folderData),
			generateDriveIdFn: () => newDriveData.driveId,
			drivePrototypeFactory: async (driveId: DriveID, rootFolderId: FolderID) =>
				Promise.resolve(
					new ArFSPrivateDriveMetaDataPrototype(
						driveId,
						await ArFSPrivateDriveTransactionData.from(driveName, rootFolderId, newDriveData.driveKey)
					)
				)
		};

		return {
			...(await this.createDrive(prepPrivateDriveParams, rewardSettings)),
			driveKey: folderData.driveKey
		};
	}

	async moveEntity<R extends ArFSMoveEntityResult>(
		metaDataBaseReward: RewardSettings,
		metaDataFactory: MoveEntityMetaDataFactory,
		resultFactory: ArFSMoveEntityResultFactory<R>,
		cacheInvalidateFn: () => Promise<void>
	): Promise<R> {
		const metadataPrototype = metaDataFactory();

		// Prepare meta data transaction
		const metaDataTx = await this.prepareArFSObjectTransaction({
			objectMetaData: metadataPrototype,
			rewardSettings: metaDataBaseReward
		});

		// Upload meta data
		if (!this.dryRun) {
			const metaDataUploader = await this.arweave.transactions.getUploader(metaDataTx);
			while (!metaDataUploader.isComplete) {
				await metaDataUploader.uploadChunk();
			}
		}

		await cacheInvalidateFn();

		return resultFactory({ metaDataTxId: TxID(metaDataTx.id), metaDataTxReward: W(metaDataTx.reward) });
	}

	async movePublicFile({
		metaDataBaseReward,
		originalMetaData,
		transactionData,
		newParentFolderId
	}: ArFSMoveParams<ArFSPublicFile, ArFSPublicFileMetadataTransactionData>): Promise<ArFSMovePublicFileResult> {
		return this.moveEntity<ArFSMovePublicFileResult>(
			metaDataBaseReward,
			() => {
				return new ArFSPublicFileMetaDataPrototype(
					transactionData,
					originalMetaData.driveId,
					originalMetaData.fileId,
					newParentFolderId
				);
			},
			(results) => {
				return { ...results, dataTxId: originalMetaData.dataTxId };
			},
			async () => {
				// Invalidate any cached entry
				const owner = await this.getDriveOwnerForFolderId(originalMetaData.entityId);
				this.caches.publicFileCache.remove({ fileId: originalMetaData.entityId, owner });
			}
		);
	}

	async movePrivateFile({
		metaDataBaseReward,
		originalMetaData,
		transactionData,
		newParentFolderId
	}: ArFSMoveParams<ArFSPrivateFile, ArFSPrivateFileMetadataTransactionData>): Promise<ArFSMovePrivateFileResult> {
		return this.moveEntity<ArFSMovePrivateFileResult>(
			metaDataBaseReward,
			() => {
				return new ArFSPrivateFileMetaDataPrototype(
					transactionData,
					originalMetaData.driveId,
					originalMetaData.fileId,
					newParentFolderId
				);
			},
			(results) => {
				return { ...results, dataTxId: originalMetaData.dataTxId, fileKey: transactionData.fileKey };
			},
			async () => {
				// Invalidate any cached entry
				const owner = await this.getDriveOwnerForFolderId(originalMetaData.entityId);
				this.caches.privateFileCache.remove({
					fileId: originalMetaData.entityId,
					owner,
					fileKey: transactionData.fileKey
				});
			}
		);
	}

	async movePublicFolder({
		metaDataBaseReward,
		originalMetaData,
		transactionData,
		newParentFolderId
	}: ArFSMoveParams<ArFSPublicFolder, ArFSPublicFolderTransactionData>): Promise<ArFSMovePublicFolderResult> {
		// Complete the move
		return this.moveEntity<ArFSMovePublicFolderResult>(
			metaDataBaseReward,
			() => {
				return new ArFSPublicFolderMetaDataPrototype(
					transactionData,
					originalMetaData.driveId,
					originalMetaData.entityId,
					newParentFolderId
				);
			},
			(results) => results,
			async () => {
				// Invalidate any cached entry
				const owner = await this.getDriveOwnerForFolderId(originalMetaData.entityId);
				this.caches.publicFolderCache.remove({ folderId: originalMetaData.entityId, owner });
			}
		);
	}

	async movePrivateFolder({
		metaDataBaseReward,
		originalMetaData,
		transactionData,
		newParentFolderId
	}: ArFSMoveParams<ArFSPrivateFolder, ArFSPrivateFolderTransactionData>): Promise<ArFSMovePrivateFolderResult> {
		// Complete the move
		return this.moveEntity<ArFSMovePrivateFolderResult>(
			metaDataBaseReward,
			() => {
				return new ArFSPrivateFolderMetaDataPrototype(
					originalMetaData.driveId,
					originalMetaData.entityId,
					transactionData,
					newParentFolderId
				);
			},
			(results) => {
				return { ...results, driveKey: transactionData.driveKey };
			},
			async () => {
				// Invalidate any cached entry
				const owner = await this.getDriveOwnerForFolderId(originalMetaData.entityId);
				this.caches.privateFolderCache.remove({
					folderId: originalMetaData.entityId,
					owner,
					driveKey: transactionData.driveKey
				});
			}
		);
	}

	async prepareFile<T extends DataItem | Transaction>({
		wrappedFile,
		dataPrototypeFactoryFn,
		metadataTxDataFactoryFn,
		prepareArFSObject,
		prepareMetaDataArFSObject
	}: ArFSPrepareFileParams<T>): Promise<ArFSPrepareFileResult<T>> {
		// Use existing file ID (create a revision) or generate new file ID
		const fileId = wrappedFile.existingId ?? EID(uuidv4());

		// Read file data into memory
		const fileData = wrappedFile.getFileDataBuffer();

		// Build file data transaction or dataItem
		const fileDataPrototype = await dataPrototypeFactoryFn(fileData, fileId);
		const dataArFSObject = await prepareArFSObject(fileDataPrototype);

		const metaDataPrototype = await metadataTxDataFactoryFn(fileId, TxID(dataArFSObject.id));
		const metaDataArFSObject = await prepareMetaDataArFSObject(metaDataPrototype);

		return { arFSObjects: [dataArFSObject, metaDataArFSObject], fileId };
	}

	private async uploadFileV2Tx(
		prepFileParams: PartialPrepareFileParams,
		{ dataTxRewardSettings, metaDataRewardSettings }: UploadFileV2TxRewardSettings,
		communityTipSettings?: CommunityTipSettings
	): Promise<ArFSTxResult<ArFSUploadFileV2TxResult>> {
		const { arFSObjects, fileId } = await this.prepareFile({
			...prepFileParams,
			prepareArFSObject: (objectMetaData) =>
				this.prepareArFSObjectTransaction({
					objectMetaData,
					rewardSettings: dataTxRewardSettings,
					communityTipSettings
				}),
			prepareMetaDataArFSObject: (objectMetaData) =>
				this.prepareArFSObjectTransaction({
					objectMetaData,
					rewardSettings: metaDataRewardSettings
				})
		});

		const [dataTx, metaDataTx] = arFSObjects;
		return {
			transactions: arFSObjects,
			result: {
				dataTxId: TxID(dataTx.id),
				dataTxReward: W(dataTx.reward),
				fileId,
				metaDataTxId: TxID(metaDataTx.id),
				metaDataTxReward: W(metaDataTx.reward)
			}
		};
	}

	private async uploadBundledFile(
		prepFileParams: PartialPrepareFileParams,
		rewardSettings: RewardSettings,
		communityTipSettings?: CommunityTipSettings
	): Promise<ArFSTxResult<ArFSUploadBundledFileResult>> {
		const { arFSObjects, fileId } = await this.prepareFile({
			...prepFileParams,
			prepareArFSObject: (objectMetaData) =>
				this.prepareArFSDataItem({
					objectMetaData
				}),
			prepareMetaDataArFSObject: (objectMetaData) =>
				this.prepareArFSDataItem({
					objectMetaData
				})
		});

		// Pack data items into a bundle
		const bundledTx = await this.prepareArFSObjectBundle({
			dataItems: arFSObjects,
			rewardSettings,
			communityTipSettings
		});

		const [dataTxDataItem, metaDataDataItem] = arFSObjects;
		return {
			transactions: [bundledTx],
			result: {
				dataTxId: TxID(dataTxDataItem.id),
				fileId,
				bundleTxId: TxID(bundledTx.id),
				bundleTxReward: W(bundledTx.reward),
				metaDataTxId: TxID(metaDataDataItem.id)
			}
		};
	}

	async uploadFile(
		prepFileParams: PartialPrepareFileParams,
		rewardSettings: UploadFileRewardSettings,
		communityTipSettings?: CommunityTipSettings
	): Promise<ArFSUploadBundledFileResult | ArFSUploadFileV2TxResult> {
		const { transactions, result } = isBundleRewardSetting(rewardSettings)
			? await this.uploadBundledFile(prepFileParams, rewardSettings.bundleRewardSettings, communityTipSettings)
			: await this.uploadFileV2Tx(prepFileParams, rewardSettings, communityTipSettings);

		// Upload all v2 transactions or direct to network bundles
		await this.sendTransactionsAsChunks(transactions);
		return result;
	}

	async uploadPublicFile({
		parentFolderId,
		wrappedFile,
		driveId,
		rewardSettings,
		communityTipSettings
	}: ArFSUploadPublicFileParams): Promise<ArFSUploadFileResult> {
		const { fileSize, dataContentType, lastModifiedDateMS } = wrappedFile.gatherFileInfo();

		const prepFileParams: PartialPrepareFileParams = {
			wrappedFile,
			dataPrototypeFactoryFn: (fileData) =>
				Promise.resolve(
					new ArFSPublicFileDataPrototype(new ArFSPublicFileDataTransactionData(fileData), dataContentType)
				),
			metadataTxDataFactoryFn: (fileId, dataTxId) =>
				Promise.resolve(
					new ArFSPublicFileMetaDataPrototype(
						new ArFSPublicFileMetadataTransactionData(
							wrappedFile.destinationBaseName,
							fileSize,
							lastModifiedDateMS,
							dataTxId,
							dataContentType
						),
						driveId,
						fileId,
						parentFolderId
					)
				)
		};

		return this.uploadFile(prepFileParams, rewardSettings, communityTipSettings);
	}

	async uploadPrivateFile({
		parentFolderId,
		wrappedFile,
		driveId,
		driveKey,
		rewardSettings,
		communityTipSettings
	}: ArFSUploadPrivateFileParams): Promise<ArFSUploadPrivateFileResult> {
		const { fileSize, dataContentType, lastModifiedDateMS } = wrappedFile.gatherFileInfo();
		let fileKey: FileKey;

		const prepFileParams: PartialPrepareFileParams = {
			wrappedFile,
			dataPrototypeFactoryFn: async (fileData, fileId) =>
				new ArFSPrivateFileDataPrototype(
					await ArFSPrivateFileDataTransactionData.from(fileData, fileId, driveKey)
				),
			metadataTxDataFactoryFn: async (fileId, dataTxId) => {
				const metaDataTxData = await ArFSPrivateFileMetadataTransactionData.from(
					wrappedFile.destinationBaseName,
					fileSize,
					lastModifiedDateMS,
					dataTxId,
					dataContentType,
					fileId,
					driveKey
				);

				// Preserve file key on private metadata for return
				fileKey = metaDataTxData.fileKey;

				return new ArFSPrivateFileMetaDataPrototype(metaDataTxData, driveId, fileId, parentFolderId);
			}
		};

		const uploadFileResult = await this.uploadFile(prepFileParams, rewardSettings, communityTipSettings);

		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return { ...uploadFileResult, fileKey: fileKey! };
	}

	async prepareArFSDataItem({
		objectMetaData,
		excludedTagNames = [],
		otherTags = []
	}: ArFSPrepareDataItemsParams): Promise<DataItem> {
		// Enforce that other tags are not protected
		objectMetaData.assertProtectedTags(otherTags);

		const tags = this.arFSTagSettings.baseArFSTagsIncluding({
			tags: [...objectMetaData.gqlTags, ...otherTags],
			excludedTagNames
		});

		const signer = new ArweaveSigner((this.wallet as JWKWallet).getPrivateKey());

		// Sign the data item
		const dataItem = createData(objectMetaData.objectData.asTransactionData(), signer, { tags });
		await dataItem.sign(signer);

		return dataItem;
	}

	async prepareArFSObjectBundle({
		dataItems,
		rewardSettings = {},
		excludedTagNames = [],
		otherTags = [],
		communityTipSettings
	}: ArFSPrepareObjectBundleParams): Promise<Transaction> {
		const wallet = this.wallet as JWKWallet;
		const signer = new ArweaveSigner(wallet.getPrivateKey());

		const bundle = await bundleAndSignData(dataItems, signer);

		// Verify the bundle and dataItems
		if (!(await bundle.verify())) {
			throw new Error('Bundle format could not be verified!');
		}

		const txAttributes: Partial<CreateTransactionInterface> = {
			data: bundle.getRaw()
		};

		if (rewardSettings.reward) {
			// If we provided our own reward setting, use it now
			txAttributes.reward = rewardSettings.reward.toString();
		}

		if (process.env.NODE_ENV === 'test') {
			// TODO: Use a mock arweave server instead
			txAttributes.last_tx = 'STUB';
		}

		if (communityTipSettings) {
			// Add community tip to the bundle trx
			txAttributes.target = `${communityTipSettings.communityTipTarget}`;
			txAttributes.quantity = `${communityTipSettings.communityWinstonTip}`;

			// Add tip tags to transaction
			otherTags = [...otherTags, ...this.arFSTagSettings.getTipTags()];
		}

		// We use arweave directly to create our transaction so we can assign our own reward and skip network request
		const bundledDataTx = await this.arweave.createTransaction(txAttributes);

		// If we've opted to boost the transaction, do so now
		if (rewardSettings.feeMultiple?.wouldBoostReward()) {
			bundledDataTx.reward = rewardSettings.feeMultiple.boostReward(bundledDataTx.reward);

			// Add a Boost tag
			otherTags.push({ name: 'Boost', value: rewardSettings.feeMultiple.toString() });
		}

		const tags: GQLTagInterface[] = this.arFSTagSettings.baseBundleTagsIncluding({
			tags: otherTags,
			excludedTagNames
		});

		for (const tag of tags) {
			bundledDataTx.addTag(tag.name, tag.value);
		}

		await this.arweave.transactions.sign(bundledDataTx, wallet.getPrivateKey());
		return bundledDataTx;
	}

	async prepareArFSObjectTransaction({
		objectMetaData,
		rewardSettings = {},
		excludedTagNames = [],
		otherTags = [],
		communityTipSettings
	}: ArFSPrepareObjectTransactionParams): Promise<Transaction> {
		// Enforce that other tags are not protected
		objectMetaData.assertProtectedTags(otherTags);

		// Create transaction
		const txAttributes: Partial<CreateTransactionInterface> = {
			data: objectMetaData.objectData.asTransactionData()
		};

		// If we provided our own reward setting, use it now
		if (rewardSettings.reward) {
			txAttributes.reward = rewardSettings.reward.toString();
		}

		// TODO: Use a mock arweave server instead
		if (process.env.NODE_ENV === 'test') {
			txAttributes.last_tx = 'STUB';
		}

		if (communityTipSettings) {
			// Add community tip to the v2 transaction
			txAttributes.target = `${communityTipSettings.communityTipTarget}`;
			txAttributes.quantity = `${communityTipSettings.communityWinstonTip}`;

			// Add tip tags to transaction
			otherTags = [...otherTags, ...this.arFSTagSettings.getTipTags()];
		}

		const wallet = this.wallet as JWKWallet;
		const transaction = await this.arweave.createTransaction(txAttributes, wallet.getPrivateKey());

		// If we've opted to boost the transaction, do so now
		if (rewardSettings.feeMultiple?.wouldBoostReward()) {
			transaction.reward = rewardSettings.feeMultiple.boostReward(transaction.reward);

			// Add a Boost tag
			otherTags.push({ name: 'Boost', value: rewardSettings.feeMultiple.toString() });
		}

		const tags = this.arFSTagSettings.baseArFSTagsIncluding({
			tags: [...objectMetaData.gqlTags, ...otherTags],
			excludedTagNames
		});

		for (const tag of tags) {
			transaction.addTag(tag.name, tag.value);
		}

		// Sign the transaction
		await this.arweave.transactions.sign(transaction, wallet.getPrivateKey());
		return transaction;
	}

	async sendTransactionsAsChunks(transactions: Transaction[]): Promise<void> {
		// Execute the uploads
		if (!this.dryRun) {
			await Promise.all(
				transactions.map(async (transaction) => {
					const driveUploader = await this.arweave.transactions.getUploader(transaction);
					while (!driveUploader.isComplete) {
						await driveUploader.uploadChunk();
					}
				})
			);
		}
	}

	// Convenience function for known-private use cases
	async getPrivateDrive(driveId: DriveID, driveKey: DriveKey, owner: ArweaveAddress): Promise<ArFSPrivateDrive> {
		const cacheKey = { driveId, driveKey, owner };
		const cachedDrive = this.caches.privateDriveCache.get(cacheKey);
		if (cachedDrive) {
			return cachedDrive;
		}
		return this.caches.privateDriveCache.put(
			cacheKey,
			new ArFSPrivateDriveBuilder({ entityId: driveId, arweave: this.arweave, key: driveKey, owner }).build()
		);
	}

	// Convenience function for known-private use cases
	async getPrivateFolder(folderId: FolderID, driveKey: DriveKey, owner: ArweaveAddress): Promise<ArFSPrivateFolder> {
		const cacheKey = { folderId, driveKey, owner };
		const cachedFolder = this.caches.privateFolderCache.get(cacheKey);
		if (cachedFolder) {
			return cachedFolder;
		}
		return this.caches.privateFolderCache.put(
			cacheKey,
			new ArFSPrivateFolderBuilder(folderId, this.arweave, driveKey, owner).build()
		);
	}

	async getPrivateFile(fileId: FileID, driveKey: DriveKey, owner: ArweaveAddress): Promise<ArFSPrivateFile> {
		const fileKey = await deriveFileKey(`${fileId}`, driveKey);
		const cacheKey = { fileId, owner, fileKey };
		const cachedFile = this.caches.privateFileCache.get(cacheKey);
		if (cachedFile) {
			return cachedFile;
		}
		return this.caches.privateFileCache.put(
			cacheKey,
			new ArFSPrivateFileBuilder(fileId, this.arweave, driveKey, owner).build()
		);
	}

	async getAllFoldersOfPrivateDrive({
		driveId,
		driveKey,
		owner,
		latestRevisionsOnly = false
	}: ArFSAllPrivateFoldersOfDriveParams): Promise<ArFSPrivateFolder[]> {
		let cursor = '';
		let hasNextPage = true;
		const allFolders: ArFSPrivateFolder[] = [];

		while (hasNextPage) {
			const gqlQuery = buildQuery({
				tags: [
					{ name: 'Drive-Id', value: `${driveId}` },
					{ name: 'Entity-Type', value: 'folder' }
				],
				cursor,
				owner
			});

			const response = await this.arweave.api.post(graphQLURL, gqlQuery);
			const { data } = response.data;
			const { transactions } = data;
			const { edges } = transactions;
			hasNextPage = transactions.pageInfo.hasNextPage;

			const folders: Promise<ArFSPrivateFolder>[] = edges.map(async (edge: GQLEdgeInterface) => {
				cursor = edge.cursor;
				const { node } = edge;
				const folderBuilder = ArFSPrivateFolderBuilder.fromArweaveNode(node, this.arweave, driveKey);
				// Build the folder so that we don't add something invalid to the cache
				const folder = await folderBuilder.build(node);
				const cacheKey = { folderId: folder.entityId, owner, driveKey };
				return this.caches.privateFolderCache.put(cacheKey, Promise.resolve(folder));
			});
			allFolders.push(...(await Promise.all(folders)));
		}

		return latestRevisionsOnly ? allFolders.filter(latestRevisionFilter) : allFolders;
	}

	async getPrivateFilesWithParentFolderIds(
		folderIDs: FolderID[],
		driveKey: DriveKey,
		owner: ArweaveAddress,
		latestRevisionsOnly = false
	): Promise<ArFSPrivateFile[]> {
		let cursor = '';
		let hasNextPage = true;
		const allFiles: ArFSPrivateFile[] = [];

		while (hasNextPage) {
			const gqlQuery = buildQuery({
				tags: [
					{ name: 'Parent-Folder-Id', value: folderIDs.map((fid) => fid.toString()) },
					{ name: 'Entity-Type', value: 'file' }
				],
				cursor,
				owner
			});

			const response = await this.arweave.api.post(graphQLURL, gqlQuery);
			const { data } = response.data;
			const { transactions } = data;
			const { edges } = transactions;
			hasNextPage = transactions.pageInfo.hasNextPage;
			const files: Promise<ArFSPrivateFile>[] = edges.map(async (edge: GQLEdgeInterface) => {
				const { node } = edge;
				cursor = edge.cursor;
				const fileBuilder = ArFSPrivateFileBuilder.fromArweaveNode(node, this.arweave, driveKey);
				// Build the file so that we don't add something invalid to the cache
				const file = await fileBuilder.build(node);
				const cacheKey = {
					fileId: file.fileId,
					owner,
					fileKey: await deriveFileKey(`${file.fileId}`, driveKey)
				};
				return this.caches.privateFileCache.put(cacheKey, Promise.resolve(file));
			});
			allFiles.push(...(await Promise.all(files)));
		}
		return latestRevisionsOnly ? allFiles.filter(latestRevisionFilter) : allFiles;
	}

	async getEntitiesInFolder(
		parentFolderId: FolderID,
		builder: (
			node: GQLNodeInterface,
			entityType: 'file' | 'folder'
		) => ArFSFileOrFolderBuilder<ArFSFileOrFolderEntity>,
		latestRevisionsOnly = true,
		filterOnOwner = true
	): Promise<ArFSFileOrFolderEntity[]> {
		let cursor = '';
		let hasNextPage = true;
		const allEntities: ArFSFileOrFolderEntity[] = [];

		// TODO: Derive the owner of a wallet from earliest transaction of a drive by default
		const owner = await this.wallet.getAddress();

		while (hasNextPage) {
			const gqlQuery = buildQuery({
				tags: [
					{ name: 'Parent-Folder-Id', value: `${parentFolderId}` },
					{ name: 'Entity-Type', value: ['file', 'folder'] }
				],
				cursor,
				owner: filterOnOwner ? owner : undefined
			});

			const response = await this.arweave.api.post(graphQLURL, gqlQuery);
			const { data } = response.data;
			const { transactions } = data;
			const { edges } = transactions;
			hasNextPage = transactions.pageInfo.hasNextPage;

			const folders: Promise<ArFSFileOrFolderEntity>[] = edges.map(async (edge: GQLEdgeInterface) => {
				const { node } = edge;
				cursor = edge.cursor;
				const { tags } = node;

				// Check entityType to determine which builder to use
				const entityType = tags.find((t) => t.name === 'Entity-Type')?.value;
				if (!entityType || (entityType !== 'file' && entityType !== 'folder')) {
					throw new Error('Entity-Type tag is missing or invalid!');
				}

				return builder(node, entityType).build(node);
			});

			allEntities.push(...(await Promise.all(folders)));
		}
		return latestRevisionsOnly ? allEntities.filter(latestRevisionFilter) : allEntities;
	}

	async getPrivateEntitiesInFolder(
		parentFolderId: FolderID,
		driveKey: DriveKey,
		latestRevisionsOnly = true
	): Promise<ArFSFileOrFolderEntity[]> {
		return this.getEntitiesInFolder(
			parentFolderId,
			(node, entityType) =>
				entityType === 'folder'
					? ArFSPrivateFolderBuilder.fromArweaveNode(node, this.arweave, driveKey)
					: ArFSPrivateFileBuilder.fromArweaveNode(node, this.arweave, driveKey),
			latestRevisionsOnly
		);
	}

	async getPublicEntitiesInFolder(
		parentFolderId: FolderID,
		latestRevisionsOnly = true
	): Promise<ArFSFileOrFolderEntity[]> {
		return this.getEntitiesInFolder(
			parentFolderId,
			(node, entityType) =>
				entityType === 'folder'
					? ArFSPublicFolderBuilder.fromArweaveNode(node, this.arweave)
					: ArFSPublicFileBuilder.fromArweaveNode(node, this.arweave),
			latestRevisionsOnly
		);
	}

	async getChildrenFolderIds(
		folderId: FolderID,
		allFolderEntitiesOfDrive: ArFSFileOrFolderEntity[]
	): Promise<FolderID[]> {
		const hierarchy = FolderHierarchy.newFromEntities(allFolderEntitiesOfDrive);
		return hierarchy.folderIdSubtreeFromFolderId(folderId, Number.MAX_SAFE_INTEGER);
	}

	async getPrivateEntityNamesInFolder(folderId: FolderID, driveKey: DriveKey): Promise<string[]> {
		const childrenOfFolder = await this.getPrivateEntitiesInFolder(folderId, driveKey, true);
		return childrenOfFolder.map(entityToNameMap);
	}

	async getPublicEntityNamesInFolder(folderId: FolderID): Promise<string[]> {
		const childrenOfFolder = await this.getPublicEntitiesInFolder(folderId, true);
		return childrenOfFolder.map(entityToNameMap);
	}

	async getPublicNameConflictInfoInFolder(folderId: FolderID): Promise<NameConflictInfo> {
		const childrenOfFolder = await this.getPublicEntitiesInFolder(folderId, true);
		return {
			files: childrenOfFolder.filter(fileFilter).map(fileConflictInfoMap),
			folders: childrenOfFolder.filter(folderFilter).map(folderToNameAndIdMap)
		};
	}

	async getPrivateNameConflictInfoInFolder(folderId: FolderID, driveKey: DriveKey): Promise<NameConflictInfo> {
		const childrenOfFolder = await this.getPrivateEntitiesInFolder(folderId, driveKey, true);
		return {
			files: childrenOfFolder.filter(fileFilter).map(fileConflictInfoMap),
			folders: childrenOfFolder.filter(folderFilter).map(folderToNameAndIdMap)
		};
	}

	async getPrivateChildrenFolderIds({
		folderId,
		driveId,
		driveKey,
		owner
	}: ArFSGetPrivateChildFolderIdsParams): Promise<FolderID[]> {
		return this.getChildrenFolderIds(
			folderId,
			await this.getAllFoldersOfPrivateDrive({ driveId, driveKey, owner, latestRevisionsOnly: true })
		);
	}

	async getPublicChildrenFolderIds({
		folderId,
		owner,
		driveId
	}: ArFSGetPublicChildFolderIdsParams): Promise<FolderID[]> {
		return this.getChildrenFolderIds(
			folderId,
			await this.getAllFoldersOfPublicDrive({ driveId, owner, latestRevisionsOnly: true })
		);
	}

	public async getOwnerAndAssertDrive(driveId: DriveID, driveKey?: DriveKey): Promise<ArweaveAddress> {
		const cachedOwner = this.caches.ownerCache.get(driveId);
		if (cachedOwner) {
			return cachedOwner;
		}

		return this.caches.ownerCache.put(
			driveId,
			(async () => {
				const gqlQuery = buildQuery({
					tags: [
						{ name: 'Entity-Type', value: 'drive' },
						{ name: 'Drive-Id', value: `${driveId}` }
					],
					sort: ASCENDING_ORDER
				});
				const response = await this.arweave.api.post(graphQLURL, gqlQuery);
				const edges: GQLEdgeInterface[] = response.data.data.transactions.edges;

				if (!edges.length) {
					throw new Error(`Could not find a transaction with "Drive-Id": ${driveId}`);
				}

				const edgeOfFirstDrive = edges[0];
				const driveOwnerAddress = edgeOfFirstDrive.node.owner.address;
				const driveOwner = new ArweaveAddress(driveOwnerAddress);

				const drivePrivacy: DrivePrivacy = driveKey ? 'private' : 'public';
				const drivePrivacyFromTag = edgeOfFirstDrive.node.tags.find((t) => t.name === 'Drive-Privacy');

				if (!drivePrivacyFromTag) {
					throw new Error('Target drive has no "Drive-Privacy" tag!');
				}

				if (drivePrivacyFromTag.value !== drivePrivacy) {
					throw new Error(`Target drive is not a ${drivePrivacy} drive!`);
				}

				if (driveKey) {
					const cipherIVFromTag = edgeOfFirstDrive.node.tags.find((t) => t.name === 'Cipher-IV');
					if (!cipherIVFromTag) {
						throw new Error('Target private drive has no "Cipher-IV" tag!');
					}

					const protocol = this.arweave.api.config.protocol ?? 'https';
					const host = this.arweave.api.config.host ?? 'arweave.net';
					const portStr = this.arweave.api.config.port ? `:${this.arweave.api.config.port}` : '';
					const reqURL = `${protocol}://${host}${portStr}/${edgeOfFirstDrive.node.id}`;
					const axiosInstance = axios.create();
					const maxRetries = 5;
					axiosRetry(axiosInstance, {
						retries: maxRetries,
						retryDelay: (retryNumber) => {
							console.error(`Retry attempt ${retryNumber}/${maxRetries} of request to ${reqURL}`);
							return exponentialDelay(retryNumber);
						}
					});
					const {
						data: driveDataBuffer
					}: {
						data: Buffer;
					} = await axiosInstance.get(reqURL, {
						responseType: 'arraybuffer'
					});

					try {
						// Attempt to decrypt drive to assert drive key is correct
						await driveDecrypt(cipherIVFromTag.value, driveKey, driveDataBuffer);
					} catch {
						throw new Error('Provided drive key or password could not decrypt target private drive!');
					}
				}

				return driveOwner;
			})()
		);
	}

	/**
	 * Lists the children of certain private folder
	 * @param {FolderID} folderId the folder ID to list children of
	 * @param {DriveKey} driveKey the drive key used for drive and folder data decryption and file key derivation
	 * @param {number} maxDepth a non-negative integer value indicating the depth of the folder tree to list where 0 = this folder's contents only
	 * @param {boolean} includeRoot whether or not folderId's folder data should be included in the listing
	 * @param {ArweaveAddress} owner the arweave address of the wallet which owns the drive
	 * @param entityWrapper a wrapper used to map the returned entities into
	 * @returns {ArFSPrivateFileOrFolderWithPaths[]} an array representation of the children and parent folder
	 */
	async listPrivateFolder({
		folderId,
		driveKey,
		maxDepth,
		includeRoot,
		owner,
		entityWrapper = ArFSPrivateFileOrFolderWithPaths
	}: ArFSListPrivateFolderParams): Promise<ArFSPrivateFileOrFolderWithPaths[]> {
		if (!Number.isInteger(maxDepth) || maxDepth < 0) {
			throw new Error('maxDepth should be a non-negative integer!');
		}

		const folder = await this.getPrivateFolder(folderId, driveKey, owner);

		// Fetch all of the folder entities within the drive
		const { hierarchy, childFiles, childFolders } = await this.separatedHierarchyOfFolder(
			folder,
			owner,
			driveKey,
			maxDepth
		);

		if (includeRoot) {
			childFolders.unshift(folder);
		}

		const children = [...childFolders, ...childFiles];

		const entitiesWithPath = children.map((entity) => new entityWrapper(entity, hierarchy));
		return entitiesWithPath;
	}

	async assertValidPassword(password: string): Promise<void> {
		const wallet = this.wallet;
		const walletAddress = await wallet.getAddress();
		const query = buildQuery({
			tags: [
				{ name: 'Entity-Type', value: 'drive' },
				{ name: 'Drive-Privacy', value: 'private' }
			],
			owner: walletAddress,
			sort: ASCENDING_ORDER
		});
		const response = await this.arweave.api.post(graphQLURL, query);
		const { data } = response.data;
		const { transactions } = data;
		const { edges } = transactions;
		if (!edges.length) {
			// No drive has been created for this wallet
			return;
		}
		const { node }: { node: GQLNodeInterface } = edges[0];
		const safeDriveBuilder = SafeArFSDriveBuilder.fromArweaveNode(
			node,
			this.arweave,
			new PrivateKeyData({ password, wallet: this.wallet as JWKWallet })
		);
		const safelyBuiltDrive = await safeDriveBuilder.build();
		if (
			safelyBuiltDrive.name === ENCRYPTED_DATA_PLACEHOLDER ||
			`${safelyBuiltDrive.rootFolderId}` === ENCRYPTED_DATA_PLACEHOLDER
		) {
			throw new Error(`Invalid password! Please type the same as your other private drives!`);
		}
	}

	async getPrivateTransactionCipherIV(txId: TransactionID): Promise<CipherIV> {
		const results = await this.getCipherIVOfPrivateTransactionIDs([txId]);
		if (results.length !== 1) {
			throw new Error(`Could not fetch the CipherIV for transaction with id: ${txId}`);
		}
		const [fileCipherIvResult] = results;
		return fileCipherIvResult.cipherIV;
	}

	async getCipherIVOfPrivateTransactionIDs(txIDs: TransactionID[]): Promise<CipherIVQueryResult[]> {
		const result: CipherIVQueryResult[] = [];
		const wallet = this.wallet;
		const walletAddress = await wallet.getAddress();
		let cursor = '';
		let hasNextPage = true;
		while (hasNextPage) {
			const query = buildQuery({
				tags: [],
				owner: walletAddress,
				ids: txIDs,
				cursor
			});
			const response = await this.arweave.api.post(graphQLURL, query);
			const { data } = response.data;
			const { errors } = response.data;
			if (errors) {
				throw new Error(`GQL error: ${JSON.stringify(errors)}`);
			}
			const { transactions }: { transactions: GQLTransactionsResultInterface } = data;
			const { edges } = transactions;
			hasNextPage = transactions.pageInfo.hasNextPage;
			if (!edges.length) {
				throw new Error(`No such private transactions with IDs: "${txIDs}"`);
			}
			edges.forEach((edge) => {
				cursor = edge.cursor;
				const { node } = edge;
				const { tags } = node;
				const txId = TxID(node.id);
				const cipherIVTag = tags.find((tag) => tag.name === 'Cipher-IV');
				if (!cipherIVTag) {
					throw new Error("The private file doesn't have a valid Cipher-IV");
				}
				const cipherIV = cipherIVTag.value;
				result.push({ txId, cipherIV });
			});
		}
		return result;
	}

	/**
	 * Returns the data stream of a private file
	 * @param privateFile - the entity of the data to be download
	 * @returns {Promise<Readable>}
	 */
	async getPrivateDataStream(privateFile: ArFSPrivateFile): Promise<Readable> {
		const dataLength = privateFile.encryptedDataSize;
		const authTagIndex = +dataLength - authTagLength;
		const dataTxUrl = `${gatewayURL}${privateFile.dataTxId}`;
		const requestConfig: AxiosRequestConfig = {
			method: 'get',
			url: dataTxUrl,
			responseType: 'stream',
			headers: {
				Range: `bytes=0-${+authTagIndex - 1}`
			}
		};
		const response = await axios(requestConfig);
		return response.data;
	}

	async getAuthTagForPrivateFile(privateFile: ArFSPrivateFile): Promise<Buffer> {
		const dataLength = privateFile.encryptedDataSize;
		const authTagIndex = +dataLength - authTagLength;
		const response = await axios({
			method: 'GET',
			url: `${gatewayURL}${privateFile.dataTxId}`,
			headers: {
				Range: `bytes=${authTagIndex}-${+dataLength - 1}`
			},
			responseType: 'arraybuffer'
		});
		const { data }: { data: Buffer } = response;
		if (data.length === authTagLength) {
			return data;
		}
		throw new Error(
			`The retrieved auth tag does not have the length of ${authTagLength} bytes, but instead: ${data.length}`
		);
	}

	async downloadPrivateFolder({
		folderId,
		destFolderPath,
		customFolderName,
		maxDepth,
		driveKey,
		owner
	}: ArFSDownloadPrivateFolderParams): Promise<void> {
		const privateFolder = await this.getPrivateFolder(folderId, driveKey, owner);

		// Fetch all file and folder entities within all Folders of the drive
		const { hierarchy, childFiles, childFolders } = await this.separatedHierarchyOfFolder(
			privateFolder,
			owner,
			driveKey,
			maxDepth
		);
		const folderWrapper = new ArFSFolderToDownload(
			new ArFSPrivateFileOrFolderWithPaths(privateFolder, hierarchy),
			customFolderName
		);

		// Fetch the file CipherIVs
		const fileDataTxIDs = childFiles.map((file) => file.dataTxId);
		const fileCipherIVResults = await this.getCipherIVOfPrivateTransactionIDs(fileDataTxIDs);
		const cipherIVMap: Record<string, CipherIVQueryResult> = fileCipherIVResults.reduce((accumulator, ivResult) => {
			return Object.assign(accumulator, { [`${ivResult.txId}`]: ivResult });
		}, {});

		const foldersWithPath = [privateFolder, ...childFolders]
			.map((folder) => new ArFSPublicFileOrFolderWithPaths(folder, hierarchy))
			.sort((a, b) => alphabeticalOrder(a.path, b.path));

		// Iteratively download all child files in the hierarchy
		for (const folder of foldersWithPath) {
			// assert the existence of the folder on disk
			const relativeFolderPath = folderWrapper.getRelativePathOf(folder.path);
			const absoluteLocalFolderPath = joinPath(destFolderPath, relativeFolderPath);
			folderWrapper.ensureFolderExistence(absoluteLocalFolderPath);

			// download child files into the folder
			const childrenFiles = childFiles.filter(
				(file) => `${file.parentFolderId}` === `${folder.entityId}` /* FIXME: use the `equals` method */
			);
			for (const file of childrenFiles) {
				const relativeFilePath = folderWrapper.getRelativePathOf(
					new ArFSPrivateFileOrFolderWithPaths(file, hierarchy).path
				);
				const absoluteLocalFilePath = joinPath(destFolderPath, relativeFilePath);

				/*
				 * FIXME: Downloading all files at once consumes a lot of resources.
				 * TODO: Implement a download manager for downloading in parallel
				 * Doing it sequentially for now
				 */
				const dataStream = await this.getPrivateDataStream(file);
				const fileKey = await deriveFileKey(`${file.fileId}`, driveKey);
				const fileCipherIVResult = cipherIVMap[`${file.dataTxId}`];
				if (!fileCipherIVResult) {
					throw new Error(`Could not find the CipherIV for the private file with ID ${file.fileId}`);
				}
				const authTag = await this.getAuthTagForPrivateFile(file);
				const decryptingStream = new StreamDecrypt(fileCipherIVResult.cipherIV, fileKey, authTag);
				const fileWrapper = new ArFSPrivateFileToDownload(
					file,
					dataStream,
					absoluteLocalFilePath,
					decryptingStream
				);
				await fileWrapper.write();
			}
		}
	}

	async separatedHierarchyOfFolder(
		folder: ArFSPrivateFolder,
		owner: ArweaveAddress,
		driveKey: DriveKey,
		maxDepth: number
	): Promise<SeparatedFolderHierarchy<ArFSPrivateFile, ArFSPrivateFolder>> {
		// Fetch all of the folder entities within the drive
		const driveIdOfFolder = folder.driveId;
		const allFolderEntitiesOfDrive = await this.getAllFoldersOfPrivateDrive({
			driveId: driveIdOfFolder,
			owner,
			latestRevisionsOnly: true,
			driveKey
		});

		// Feed entities to FolderHierarchy
		const hierarchy = FolderHierarchy.newFromEntities(allFolderEntitiesOfDrive);
		const searchFolderIDs = hierarchy.folderIdSubtreeFromFolderId(folder.entityId, maxDepth - 1);

		// Fetch all file entities within all Folders of the drive
		const childFiles = await this.getPrivateFilesWithParentFolderIds(searchFolderIDs, driveKey, owner, true);

		const [, ...subFolderIDs]: FolderID[] = hierarchy.folderIdSubtreeFromFolderId(folder.entityId, maxDepth);
		const childFolders = allFolderEntitiesOfDrive.filter((folder) =>
			subFolderIDs.some((folderId) => `${folderId}` === `${folder.entityId}` /* FIXME: use the `equals` method */)
		);

		return { hierarchy, childFiles, childFolders };
	}
}

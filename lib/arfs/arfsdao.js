"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArFSDAO = exports.PrivateDriveKeyData = void 0;
const uuid_1 = require("uuid");
const arfs_drive_builders_1 = require("./arfs_builders/arfs_drive_builders");
const arfs_file_builders_1 = require("./arfs_builders/arfs_file_builders");
const arfs_folder_builders_1 = require("./arfs_builders/arfs_folder_builders");
const arfs_entities_1 = require("./arfs_entities");
const arfs_file_wrapper_1 = require("./arfs_file_wrapper");
const arfs_meta_data_factory_1 = require("./arfs_meta_data_factory");
const arfs_prototypes_1 = require("./tx/arfs_prototypes");
const folder_hierarchy_1 = require("./folder_hierarchy");
const arfsdao_anonymous_1 = require("./arfsdao_anonymous");
const crypto_1 = require("../utils/crypto");
const constants_1 = require("../utils/constants");
const private_key_data_1 = require("./private_key_data");
const types_1 = require("../types");
const filter_methods_1 = require("../utils/filter_methods");
const mapper_functions_1 = require("../utils/mapper_functions");
const query_1 = require("../utils/query");
const arfs_entity_cache_1 = require("./arfs_entity_cache");
const upload_planner_types_1 = require("../types/upload_planner_types");
const axios_1 = __importDefault(require("axios"));
const path_1 = require("path");
const stream_decrypt_1 = require("../utils/stream_decrypt");
const sort_functions_1 = require("../utils/sort_functions");
const common_1 = require("../utils/common");
const multi_chunk_tx_uploader_1 = require("./multi_chunk_tx_uploader");
const gateway_api_1 = require("../utils/gateway_api");
const arfs_tag_settings_1 = require("./arfs_tag_settings");
const tx_preparer_1 = require("./tx/tx_preparer");
const arfs_tx_data_types_1 = require("./tx/arfs_tx_data_types");
const tag_assembler_1 = require("./tags/tag_assembler");
const arfsdao_utils_1 = require("../utils/arfsdao_utils");
/** Utility class for holding the driveId and driveKey of a new drive */
class PrivateDriveKeyData {
    constructor(driveId, driveKey) {
        this.driveId = driveId;
        this.driveKey = driveKey;
    }
    static from(drivePassword, privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const driveId = uuid_1.v4();
            const driveKey = yield crypto_1.deriveDriveKey(drivePassword, driveId, JSON.stringify(privateKey));
            return new PrivateDriveKeyData(types_1.EID(driveId), driveKey);
        });
    }
}
exports.PrivateDriveKeyData = PrivateDriveKeyData;
class ArFSDAO extends arfsdao_anonymous_1.ArFSDAOAnonymous {
    // TODO: Can we abstract Arweave type(s)?
    constructor(wallet, arweave, dryRun = false, 
    /** @deprecated App Name should be provided with ArFSTagSettings  */
    appName = constants_1.DEFAULT_APP_NAME, 
    /** @deprecated App Version should be provided with ArFSTagSettings  */
    appVersion = constants_1.DEFAULT_APP_VERSION, arFSTagSettings = new arfs_tag_settings_1.ArFSTagSettings({ appName, appVersion }), caches = Object.assign(Object.assign({}, arfsdao_anonymous_1.defaultArFSAnonymousCache), { privateDriveCache: new arfs_entity_cache_1.ArFSEntityCache(10), privateFolderCache: new arfs_entity_cache_1.ArFSEntityCache(10), privateFileCache: new arfs_entity_cache_1.ArFSEntityCache(10), publicConflictCache: new arfs_entity_cache_1.ArFSEntityCache(10), privateConflictCache: new arfs_entity_cache_1.ArFSEntityCache(10) }), gatewayApi = new gateway_api_1.GatewayAPI({ gatewayUrl: common_1.gatewayUrlForArweave(arweave) }), txPreparer = new tx_preparer_1.TxPreparer({
        arweave: arweave,
        wallet: wallet,
        arFSTagAssembler: new tag_assembler_1.ArFSTagAssembler(arFSTagSettings)
    })) {
        super(arweave, undefined, undefined, caches);
        this.wallet = wallet;
        this.dryRun = dryRun;
        this.appName = appName;
        this.appVersion = appVersion;
        this.arFSTagSettings = arFSTagSettings;
        this.caches = caches;
        this.gatewayApi = gatewayApi;
        this.txPreparer = txPreparer;
        this.shouldProgressLog = process.env['ARDRIVE_PROGRESS_LOG'] === '1';
    }
    /** Prepare an ArFS folder entity for upload */
    prepareFolder({ folderPrototypeFactory, prepareArFSObject }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate a new folder ID
            const folderId = types_1.EID(uuid_1.v4());
            // Create a folder metadata transaction
            const folderMetadata = folderPrototypeFactory(folderId);
            // Prepare the ArFS folder transaction or dataItem
            const arFSObjects = [yield prepareArFSObject(folderMetadata)];
            return { arFSObjects, folderId: folderMetadata.folderId };
        });
    }
    /** Create a single folder as a V2 transaction */
    createFolder(folderPrototypeFactory, rewardSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const { arFSObjects, folderId } = yield this.prepareFolder({
                folderPrototypeFactory,
                prepareArFSObject: (folderMetaData) => this.txPreparer.prepareMetaDataTx({ objectMetaData: folderMetaData, rewardSettings })
            });
            const folderTx = arFSObjects[0];
            yield this.sendTransactionsAsChunks([folderTx]);
            return { metaDataTxId: types_1.TxID(folderTx.id), metaDataTxReward: types_1.W(folderTx.reward), folderId };
        });
    }
    /** Create a single private folder as a V2 transaction */
    createPrivateFolder({ driveId, rewardSettings, parentFolderId, folderData }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createFolder((folderId) => new arfs_prototypes_1.ArFSPrivateFolderMetaDataPrototype(driveId, folderId, folderData, parentFolderId), rewardSettings);
        });
    }
    /** Create a single public folder as a V2 transaction */
    createPublicFolder({ driveId, rewardSettings, parentFolderId, folderData }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createFolder((folderId) => new arfs_prototypes_1.ArFSPublicFolderMetaDataPrototype(folderData, driveId, folderId, parentFolderId), rewardSettings);
        });
    }
    /** Prepare an ArFS drive entity for upload */
    prepareDrive({ drivePrototypeFactory, prepareArFSObject, rootFolderPrototypeFactory, generateDriveIdFn }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate a new drive ID for the new drive
            const driveId = generateDriveIdFn();
            // Create ArFS root folder object
            const { arFSObjects, folderId: rootFolderId } = yield this.prepareFolder({
                folderPrototypeFactory: (folderId) => rootFolderPrototypeFactory(folderId, driveId),
                prepareArFSObject
            });
            const rootFolderArFSObject = arFSObjects[0];
            // Create ArFS drive object
            const driveMetaData = yield drivePrototypeFactory(driveId, rootFolderId);
            const driveArFSObject = yield prepareArFSObject(driveMetaData);
            return { arFSObjects: [rootFolderArFSObject, driveArFSObject], driveId, rootFolderId };
        });
    }
    /** Create drive and root folder together as bundled transaction */
    createBundledDrive(sharedPrepDriveParams, rewardSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const { arFSObjects, driveId, rootFolderId } = yield this.prepareDrive(Object.assign(Object.assign({}, sharedPrepDriveParams), { prepareArFSObject: (objectMetaData) => this.txPreparer.prepareMetaDataDataItem({
                    objectMetaData
                }) }));
            // Pack data items into a bundle
            const bundledTx = yield this.txPreparer.prepareBundleTx({ dataItems: arFSObjects, rewardSettings });
            const [rootFolderDataItem, driveDataItem] = arFSObjects;
            return {
                transactions: [bundledTx],
                result: {
                    bundleTxId: types_1.TxID(bundledTx.id),
                    bundleTxReward: types_1.W(bundledTx.reward),
                    driveId,
                    metaDataTxId: types_1.TxID(driveDataItem.id),
                    rootFolderId,
                    rootFolderTxId: types_1.TxID(rootFolderDataItem.id)
                }
            };
        });
    }
    /** Create drive and root folder as separate V2 transactions */
    createV2TxDrive(sharedPrepDriveParams, { driveRewardSettings, rootFolderRewardSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { arFSObjects, driveId, rootFolderId } = yield this.prepareDrive(Object.assign(Object.assign({}, sharedPrepDriveParams), { prepareArFSObject: (objectMetaData) => this.txPreparer.prepareMetaDataTx({
                    objectMetaData,
                    rewardSettings: 
                    // Type-check the metadata to conditionally pass correct reward setting
                    objectMetaData instanceof arfs_prototypes_1.ArFSDriveMetaDataPrototype
                        ? driveRewardSettings
                        : rootFolderRewardSettings
                }) }));
            const [rootFolderTx, driveTx] = arFSObjects;
            return {
                transactions: arFSObjects,
                result: {
                    metaDataTxId: types_1.TxID(driveTx.id),
                    metaDataTxReward: types_1.W(driveTx.reward),
                    driveId,
                    rootFolderId,
                    rootFolderTxId: types_1.TxID(rootFolderTx.id),
                    rootFolderTxReward: types_1.W(rootFolderTx.reward)
                }
            };
        });
    }
    /**
     * Create drive and root folder as a V2 transaction
     * OR a direct to network bundled transaction
     *
     * @remarks To bundle or not is determined during cost estimation,
     * and the provided rewardSettings will be type checked here to
     * determine the result type
     */
    createDrive(sharedPrepDriveParams, rewardSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const { transactions, result } = upload_planner_types_1.isBundleRewardSetting(rewardSettings)
                ? yield this.createBundledDrive(sharedPrepDriveParams, rewardSettings.bundleRewardSettings)
                : yield this.createV2TxDrive(sharedPrepDriveParams, rewardSettings);
            // Upload all v2 transactions or direct to network bundles
            yield this.sendTransactionsAsChunks(transactions);
            return result;
        });
    }
    /** Create an ArFS public drive */
    createPublicDrive({ driveName, rewardSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            const folderData = new arfs_tx_data_types_1.ArFSPublicFolderTransactionData(driveName);
            const prepPublicDriveParams = {
                rootFolderPrototypeFactory: (folderId, driveId) => new arfs_prototypes_1.ArFSPublicFolderMetaDataPrototype(folderData, driveId, folderId),
                generateDriveIdFn: () => types_1.EID(uuid_1.v4()),
                drivePrototypeFactory: (driveId, rootFolderId) => __awaiter(this, void 0, void 0, function* () {
                    return Promise.resolve(new arfs_prototypes_1.ArFSPublicDriveMetaDataPrototype(new arfs_tx_data_types_1.ArFSPublicDriveTransactionData(driveName, rootFolderId), driveId));
                })
            };
            return this.createDrive(prepPublicDriveParams, rewardSettings);
        });
    }
    /** Create an ArFS private drive */
    createPrivateDrive({ driveName, rewardSettings, newDriveData }) {
        return __awaiter(this, void 0, void 0, function* () {
            const folderData = yield arfs_tx_data_types_1.ArFSPrivateFolderTransactionData.from(driveName, newDriveData.driveKey);
            const prepPrivateDriveParams = {
                rootFolderPrototypeFactory: (folderId, driveId) => new arfs_prototypes_1.ArFSPrivateFolderMetaDataPrototype(driveId, folderId, folderData),
                generateDriveIdFn: () => newDriveData.driveId,
                drivePrototypeFactory: (driveId, rootFolderId) => __awaiter(this, void 0, void 0, function* () {
                    return Promise.resolve(new arfs_prototypes_1.ArFSPrivateDriveMetaDataPrototype(driveId, yield arfs_tx_data_types_1.ArFSPrivateDriveTransactionData.from(driveName, rootFolderId, newDriveData.driveKey)));
                })
            };
            return Object.assign(Object.assign({}, (yield this.createDrive(prepPrivateDriveParams, rewardSettings))), { driveKey: folderData.driveKey });
        });
    }
    moveEntity(metaDataBaseReward, metaDataFactory, resultFactory, cacheInvalidateFn) {
        return __awaiter(this, void 0, void 0, function* () {
            const metadataPrototype = metaDataFactory();
            // Prepare meta data transaction
            const metaDataTx = yield this.txPreparer.prepareMetaDataTx({
                objectMetaData: metadataPrototype,
                rewardSettings: metaDataBaseReward
            });
            // Upload meta data
            if (!this.dryRun) {
                const metaDataUploader = yield this.arweave.transactions.getUploader(metaDataTx);
                while (!metaDataUploader.isComplete) {
                    yield metaDataUploader.uploadChunk();
                }
            }
            yield cacheInvalidateFn();
            return resultFactory({ metaDataTxId: types_1.TxID(metaDataTx.id), metaDataTxReward: types_1.W(metaDataTx.reward) });
        });
    }
    movePublicFile({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.moveEntity(metaDataBaseReward, () => {
                return new arfs_prototypes_1.ArFSPublicFileMetaDataPrototype(transactionData, originalMetaData.driveId, originalMetaData.fileId, newParentFolderId);
            }, (results) => {
                return Object.assign(Object.assign({}, results), { dataTxId: originalMetaData.dataTxId });
            }, () => __awaiter(this, void 0, void 0, function* () {
                // Invalidate any cached entry
                const owner = yield this.getDriveOwnerForFolderId(originalMetaData.entityId);
                this.caches.publicFileCache.remove({ fileId: originalMetaData.entityId, owner });
            }));
        });
    }
    movePrivateFile({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.moveEntity(metaDataBaseReward, () => {
                return new arfs_prototypes_1.ArFSPrivateFileMetaDataPrototype(transactionData, originalMetaData.driveId, originalMetaData.fileId, newParentFolderId);
            }, (results) => {
                return Object.assign(Object.assign({}, results), { dataTxId: originalMetaData.dataTxId, fileKey: transactionData.fileKey });
            }, () => __awaiter(this, void 0, void 0, function* () {
                // Invalidate any cached entry
                const owner = yield this.getDriveOwnerForFolderId(originalMetaData.entityId);
                this.caches.privateFileCache.remove({
                    fileId: originalMetaData.entityId,
                    owner,
                    fileKey: transactionData.fileKey
                });
            }));
        });
    }
    movePublicFolder({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Complete the move
            return this.moveEntity(metaDataBaseReward, () => {
                return new arfs_prototypes_1.ArFSPublicFolderMetaDataPrototype(transactionData, originalMetaData.driveId, originalMetaData.entityId, newParentFolderId);
            }, (results) => results, () => __awaiter(this, void 0, void 0, function* () {
                // Invalidate any cached entry
                const owner = yield this.getDriveOwnerForFolderId(originalMetaData.entityId);
                this.caches.publicFolderCache.remove({ folderId: originalMetaData.entityId, owner });
            }));
        });
    }
    movePrivateFolder({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Complete the move
            return this.moveEntity(metaDataBaseReward, () => {
                return new arfs_prototypes_1.ArFSPrivateFolderMetaDataPrototype(originalMetaData.driveId, originalMetaData.entityId, transactionData, newParentFolderId);
            }, (results) => {
                return Object.assign(Object.assign({}, results), { driveKey: transactionData.driveKey });
            }, () => __awaiter(this, void 0, void 0, function* () {
                // Invalidate any cached entry
                const owner = yield this.getDriveOwnerForFolderId(originalMetaData.entityId);
                this.caches.privateFolderCache.remove({
                    folderId: originalMetaData.entityId,
                    owner,
                    driveKey: transactionData.driveKey
                });
            }));
        });
    }
    prepareFile({ wrappedFile, dataPrototypeFactoryFn, metadataTxDataFactoryFn, prepareArFSObject, prepareMetaDataArFSObject }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Use existing file ID (create a revision) or generate new file ID
            const fileId = (_a = wrappedFile.existingId) !== null && _a !== void 0 ? _a : types_1.EID(uuid_1.v4());
            // Read file data into memory
            const fileData = wrappedFile.getFileDataBuffer();
            // Build file data transaction or dataItem
            const fileDataPrototype = yield dataPrototypeFactoryFn(fileData, fileId);
            const dataArFSObject = yield prepareArFSObject(fileDataPrototype);
            const metaDataPrototype = yield metadataTxDataFactoryFn(fileId, types_1.TxID(dataArFSObject.id));
            const metaDataArFSObject = yield prepareMetaDataArFSObject(metaDataPrototype);
            // Always preserve file key here for private files
            let fileKey = undefined;
            if (metaDataPrototype instanceof arfs_prototypes_1.ArFSPrivateFileMetaDataPrototype) {
                fileKey = metaDataPrototype.objectData.fileKey;
            }
            return { arFSObjects: [dataArFSObject, metaDataArFSObject], fileId, fileKey };
        });
    }
    /** @deprecated -- Now uses the uploadAllEntities method internally. Will be removed in a future major release */
    uploadPublicFile({ parentFolderId: destFolderId, wrappedFile: wrappedEntity, driveId: destDriveId, rewardSettings, communityTipSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = yield this.getDriveOwnerForFolderId(destDriveId);
            const uploadPlan = (() => {
                if (upload_planner_types_1.isBundleRewardSetting(rewardSettings)) {
                    return {
                        bundlePlans: [
                            {
                                bundleRewardSettings: rewardSettings.bundleRewardSettings,
                                uploadStats: [
                                    {
                                        wrappedEntity,
                                        destDriveId,
                                        destFolderId,
                                        owner
                                    }
                                ],
                                communityTipSettings,
                                metaDataDataItems: []
                            }
                        ],
                        v2TxPlans: upload_planner_types_1.emptyV2TxPlans
                    };
                }
                return {
                    bundlePlans: [],
                    v2TxPlans: Object.assign(Object.assign({}, upload_planner_types_1.emptyV2TxPlans), { fileAndMetaDataPlans: [
                            {
                                uploadStats: { destDriveId, destFolderId, wrappedEntity, owner },
                                dataTxRewardSettings: rewardSettings.dataTxRewardSettings,
                                metaDataRewardSettings: rewardSettings.metaDataRewardSettings,
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                communityTipSettings: communityTipSettings
                            }
                        ] })
                };
            })();
            return this.uploadAllEntities(uploadPlan);
        });
    }
    /** @deprecated -- Now uses the uploadAllEntities method internally. Will be removed in a future major release */
    uploadPrivateFile({ parentFolderId: destFolderId, wrappedFile: wrappedEntity, driveId: destDriveId, driveKey, rewardSettings, communityTipSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = yield this.getDriveOwnerForFolderId(destDriveId);
            const uploadPlan = (() => {
                if (upload_planner_types_1.isBundleRewardSetting(rewardSettings)) {
                    return {
                        bundlePlans: [
                            {
                                bundleRewardSettings: rewardSettings.bundleRewardSettings,
                                uploadStats: [
                                    {
                                        wrappedEntity,
                                        destDriveId,
                                        destFolderId,
                                        driveKey,
                                        owner
                                    }
                                ],
                                communityTipSettings,
                                metaDataDataItems: []
                            }
                        ],
                        v2TxPlans: upload_planner_types_1.emptyV2TxPlans
                    };
                }
                return {
                    bundlePlans: [],
                    v2TxPlans: Object.assign(Object.assign({}, upload_planner_types_1.emptyV2TxPlans), { fileAndMetaDataPlans: [
                            {
                                uploadStats: { destDriveId, destFolderId, wrappedEntity, owner, driveKey },
                                dataTxRewardSettings: rewardSettings.dataTxRewardSettings,
                                metaDataRewardSettings: rewardSettings.metaDataRewardSettings,
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                communityTipSettings: communityTipSettings
                            }
                        ] })
                };
            })();
            return this.uploadAllEntities(uploadPlan);
        });
    }
    uploadFileAndMetaDataAsV2(prepFileParams, dataTxRewardSettings, metaDataRewardSettings, communityTipSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const { arFSObjects, fileId, fileKey } = yield this.prepareFile(Object.assign(Object.assign({}, prepFileParams), { prepareArFSObject: (objectMetaData) => this.txPreparer.prepareFileDataTx({
                    objectMetaData,
                    rewardSettings: dataTxRewardSettings,
                    communityTipSettings
                }), prepareMetaDataArFSObject: (objectMetaData) => this.txPreparer.prepareMetaDataTx({
                    objectMetaData,
                    rewardSettings: metaDataRewardSettings
                }) }));
            // Send both v2 transactions
            yield this.sendTransactionsAsChunks(arFSObjects);
            const [dataTx, metaDataTx] = arFSObjects;
            const { sourceUri, destinationBaseName } = prepFileParams.wrappedFile;
            return {
                sourceUri,
                entityName: destinationBaseName,
                fileDataTxId: types_1.TxID(dataTx.id),
                fileDataReward: types_1.W(dataTx.reward),
                entityId: fileId,
                metaDataTxId: types_1.TxID(metaDataTx.id),
                fileMetaDataReward: types_1.W(metaDataTx.reward),
                fileKey,
                communityTipSettings
            };
        });
    }
    uploadOnlyFileAsV2(prepFileParams, dataTxRewardSettings, communityTipSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const { arFSObjects, fileId, fileKey } = yield this.prepareFile(Object.assign(Object.assign({}, prepFileParams), { prepareArFSObject: (objectMetaData) => this.txPreparer.prepareFileDataTx({
                    objectMetaData,
                    rewardSettings: dataTxRewardSettings,
                    communityTipSettings
                }), prepareMetaDataArFSObject: (objectMetaData) => this.txPreparer.prepareMetaDataDataItem({
                    objectMetaData
                }) }));
            const [dataTx, metaDataDataItem] = arFSObjects;
            // Send only file data as v2 transaction
            yield this.sendTransactionsAsChunks([dataTx]);
            const { sourceUri, destinationBaseName } = prepFileParams.wrappedFile;
            return {
                fileResult: {
                    sourceUri,
                    entityName: destinationBaseName,
                    fileDataTxId: types_1.TxID(dataTx.id),
                    fileDataReward: types_1.W(dataTx.reward),
                    entityId: fileId,
                    metaDataTxId: types_1.TxID(metaDataDataItem.id),
                    fileKey,
                    communityTipSettings
                },
                // Return the meta data data item
                metaDataDataItem
            };
        });
    }
    uploadAllEntities({ bundlePlans, v2TxPlans }) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = { fileResults: [], folderResults: [], bundleResults: [] };
            const { fileAndMetaDataPlans, fileDataOnlyPlans, folderMetaDataPlans: folderMetaDataPlan } = v2TxPlans;
            const totalFileAndBundleUploads = fileAndMetaDataPlans.length + fileDataOnlyPlans.length + bundlePlans.length;
            let uploadsCompleted = 0;
            const logProgress = () => {
                if (this.shouldProgressLog && totalFileAndBundleUploads > 1) {
                    console.error(`Uploading file transaction ${uploadsCompleted + 1} of total ${totalFileAndBundleUploads} transactions...`);
                }
            };
            // First, we must upload all planned v2 transactions so we can preserve any file metaData data items
            for (const { dataTxRewardSettings, uploadStats, communityTipSettings, metaDataBundleIndex } of fileDataOnlyPlans) {
                logProgress();
                const { fileResult, metaDataDataItem } = yield this.uploadOnlyFileAsV2(arfs_meta_data_factory_1.getPrepFileParams(uploadStats), dataTxRewardSettings, communityTipSettings);
                uploadsCompleted++;
                results.fileResults.push(fileResult);
                // Add data item to its intended bundle plan
                bundlePlans[metaDataBundleIndex].metaDataDataItems.push(metaDataDataItem);
            }
            v2TxPlans.fileDataOnlyPlans = [];
            for (const { dataTxRewardSettings, metaDataRewardSettings, uploadStats, communityTipSettings } of fileAndMetaDataPlans) {
                logProgress();
                const fileResult = yield this.uploadFileAndMetaDataAsV2(arfs_meta_data_factory_1.getPrepFileParams(Object.assign({}, uploadStats)), dataTxRewardSettings, metaDataRewardSettings, communityTipSettings);
                uploadsCompleted++;
                results.fileResults.push(fileResult);
            }
            v2TxPlans.fileAndMetaDataPlans = [];
            for (const { metaDataRewardSettings, uploadStats } of folderMetaDataPlan) {
                // Send this folder metadata up as a v2 tx
                const { folderId, metaDataTxId, metaDataTxReward } = yield this.createFolder(yield arfs_meta_data_factory_1.getPrepFolderFactoryParams(uploadStats), metaDataRewardSettings);
                results.folderResults.push({
                    entityId: folderId,
                    entityName: uploadStats.wrappedEntity.destinationBaseName,
                    folderTxId: metaDataTxId,
                    folderMetaDataReward: metaDataTxReward,
                    driveKey: uploadStats.driveKey,
                    sourceUri: uploadStats.wrappedEntity.sourceUri
                });
            }
            v2TxPlans.folderMetaDataPlans = [];
            for (const { uploadStats, bundleRewardSettings, metaDataDataItems, communityTipSettings } of bundlePlans) {
                // The upload planner has planned to upload bundles, proceed with bundling
                let dataItems = [];
                // We accumulate results from the current bundle in order to add on the
                // bundledIn field after we have the bundleTxId from signing bundle
                const currentBundleResults = {
                    folderResults: [],
                    fileResults: []
                };
                logProgress();
                for (const uploadStat of uploadStats) {
                    const { wrappedEntity, driveKey } = uploadStat;
                    if (wrappedEntity.entityType === 'folder') {
                        if (uploadStats.length === 1 && metaDataDataItems.length < 1) {
                            throw new Error('Invalid bundle plan, a single metadata transaction can not be bundled alone!');
                        }
                        // Prepare folder data item and results
                        const { arFSObjects, folderId } = yield this.prepareFolder({
                            folderPrototypeFactory: yield arfs_meta_data_factory_1.getPrepFolderFactoryParams(Object.assign(Object.assign({}, uploadStat), { wrappedEntity })),
                            prepareArFSObject: (objectMetaData) => this.txPreparer.prepareMetaDataDataItem({
                                objectMetaData
                            })
                        });
                        const folderDataItem = arFSObjects[0];
                        dataItems.push(folderDataItem);
                        currentBundleResults.folderResults.push({
                            entityId: folderId,
                            folderTxId: types_1.TxID(folderDataItem.id),
                            driveKey,
                            entityName: wrappedEntity.destinationBaseName,
                            sourceUri: wrappedEntity.sourceUri
                        });
                    }
                    else {
                        if (!communityTipSettings) {
                            throw new Error('Invalid bundle plan, file uploads must include communityTipSettings!');
                        }
                        // Prepare file data item and results
                        const prepFileParams = arfs_meta_data_factory_1.getPrepFileParams(Object.assign(Object.assign({}, uploadStat), { wrappedEntity }));
                        const { arFSObjects, fileId, fileKey } = yield this.prepareFile(Object.assign(Object.assign({}, prepFileParams), { prepareArFSObject: (objectMetaData) => this.txPreparer.prepareFileDataDataItem({
                                objectMetaData
                            }), prepareMetaDataArFSObject: (objectMetaData) => this.txPreparer.prepareMetaDataDataItem({
                                objectMetaData
                            }) }));
                        const [fileDataItem, metaDataItem] = arFSObjects;
                        dataItems.push(...arFSObjects);
                        currentBundleResults.fileResults.push({
                            entityId: fileId,
                            fileDataTxId: types_1.TxID(fileDataItem.id),
                            metaDataTxId: types_1.TxID(metaDataItem.id),
                            fileKey,
                            entityName: wrappedEntity.destinationBaseName,
                            sourceUri: wrappedEntity.sourceUri
                        });
                    }
                }
                // Add any metaData data items from over-sized files sent as v2
                dataItems.push(...metaDataDataItems);
                const bundleTx = yield this.txPreparer.prepareBundleTx({
                    dataItems,
                    rewardSettings: bundleRewardSettings,
                    communityTipSettings
                });
                // Drop data items from memory immediately after the bundle has been assembled
                dataItems = [];
                // This bundle is now complete, send it off before starting a new one
                yield this.sendTransactionsAsChunks([bundleTx]);
                uploadsCompleted++;
                for (const res of currentBundleResults.fileResults) {
                    res.bundledIn = types_1.TxID(bundleTx.id);
                    results.fileResults.push(res);
                }
                for (const res of currentBundleResults.folderResults) {
                    res.bundledIn = types_1.TxID(bundleTx.id);
                    results.folderResults.push(res);
                }
                results.bundleResults.push({
                    bundleTxId: types_1.TxID(bundleTx.id),
                    communityTipSettings,
                    bundleReward: types_1.W(bundleTx.reward)
                });
            }
            return results;
        });
    }
    /** @deprecated -- Logic has been moved from ArFSDAO, use TxPreparer methods instead */
    prepareArFSDataItem({ objectMetaData, excludedTagNames = [] }) {
        return __awaiter(this, void 0, void 0, function* () {
            return excludedTagNames.includes('ArFS')
                ? this.txPreparer.prepareFileDataDataItem({
                    objectMetaData: objectMetaData
                })
                : this.txPreparer.prepareMetaDataDataItem({
                    objectMetaData: objectMetaData
                });
        });
    }
    /** @deprecated -- Logic has been moved from ArFSDAO, use TxPreparer methods instead */
    prepareArFSObjectBundle({ dataItems, rewardSettings = {}, communityTipSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.txPreparer.prepareBundleTx({ dataItems, communityTipSettings, rewardSettings });
        });
    }
    /** @deprecated -- Logic has been moved from ArFSDAO, use TxPreparer methods instead */
    prepareArFSObjectTransaction({ objectMetaData, rewardSettings = {}, communityTipSettings, excludedTagNames = [] }) {
        return __awaiter(this, void 0, void 0, function* () {
            return excludedTagNames.includes('ArFS')
                ? this.txPreparer.prepareFileDataTx({
                    objectMetaData: objectMetaData,
                    rewardSettings,
                    communityTipSettings
                })
                : this.txPreparer.prepareMetaDataTx({
                    objectMetaData: objectMetaData,
                    rewardSettings
                });
        });
    }
    sendTransactionsAsChunks(transactions, resumeChunkUpload = false) {
        return __awaiter(this, void 0, void 0, function* () {
            // Execute the uploads
            if (!this.dryRun) {
                for (const transaction of transactions) {
                    if (!resumeChunkUpload) {
                        // Resumed uploads will already have their chunks prepared in order to assert that the data_root is consistent
                        yield transaction.prepareChunks(transaction.data);
                    }
                    // Only log progress if total chunks of transaction is greater than the max concurrent chunks setting
                    const shouldProgressLog = 
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    this.shouldProgressLog && transaction.chunks.chunks.length > constants_1.defaultMaxConcurrentChunks;
                    const uploaderParams = {
                        transaction,
                        gatewayApi: this.gatewayApi,
                        progressCallback: shouldProgressLog
                            ? (pct) => {
                                // TODO: Test if this is still progress logging, otherwise lift this var into above scope 👍
                                let progressLogDebounce = false;
                                if (!progressLogDebounce || pct === 100) {
                                    console.error(`Transaction ${transaction.id} Upload Progress: ${pct}%`);
                                    progressLogDebounce = true;
                                    setTimeout(() => {
                                        progressLogDebounce = false;
                                    }, 500); // .5 sec debounce
                                }
                            }
                            : undefined
                    };
                    const transactionUploader = resumeChunkUpload
                        ? multi_chunk_tx_uploader_1.MultiChunkTxUploader.resumeChunkUpload(uploaderParams)
                        : new multi_chunk_tx_uploader_1.MultiChunkTxUploader(uploaderParams);
                    yield transactionUploader.batchUploadChunks();
                }
            }
        });
    }
    retryV2ArFSPublicFileTransaction({ wrappedFile, arFSDataTxId, createMetaDataPlan }) {
        return __awaiter(this, void 0, void 0, function* () {
            const arFSDataTx = yield this.gatewayApi.getTransaction(arFSDataTxId);
            const newMetaDataInfo = createMetaDataPlan
                ? yield this.createV2PublicFileMetaData({
                    wrappedFile,
                    arFSDataTxId,
                    createMetaDataPlan
                })
                : undefined;
            yield this.reSeedV2FileTransaction(wrappedFile, arFSDataTx);
            return {
                communityTipSettings: {
                    communityTipTarget: types_1.ADDR(arFSDataTx.target),
                    communityWinstonTip: types_1.W(arFSDataTx.quantity)
                },
                fileDataReward: types_1.W(arFSDataTx.reward),
                newMetaDataInfo
            };
        });
    }
    createV2PublicFileMetaData({ createMetaDataPlan, wrappedFile, arFSDataTxId }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const { destinationFolderId, rewardSettings } = createMetaDataPlan;
            const fileId = (_a = createMetaDataPlan.fileId) !== null && _a !== void 0 ? _a : types_1.EID(uuid_1.v4());
            const fileMetaDataPrototype = arfs_prototypes_1.ArFSPublicFileMetaDataPrototype.fromFile({
                wrappedFile,
                parentFolderId: destinationFolderId,
                fileId,
                driveId: yield this.getDriveIdForFolderId(destinationFolderId),
                dataTxId: arFSDataTxId
            });
            const fileMetaDataTransaction = yield this.prepareArFSObjectTransaction({
                objectMetaData: fileMetaDataPrototype,
                rewardSettings
            });
            yield this.sendTransactionsAsChunks([fileMetaDataTransaction]);
            return {
                fileId,
                fileMetaDataReward: types_1.W(fileMetaDataTransaction.reward),
                metaDataTxId: types_1.TxID(fileMetaDataTransaction.id)
            };
        });
    }
    // Retry a single public file transaction
    reSeedV2FileTransaction(wrappedFile, transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataRootFromGateway = transaction.data_root;
            transaction = yield arfsdao_utils_1.rePrepareV2Tx(transaction, wrappedFile.getFileDataBuffer());
            arfsdao_utils_1.assertDataRootsMatch(transaction, dataRootFromGateway);
            yield this.sendTransactionsAsChunks([transaction], true);
        });
    }
    // Convenience function for known-private use cases
    getPrivateDrive(driveId, driveKey, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = { driveId, driveKey, owner };
            const cachedDrive = this.caches.privateDriveCache.get(cacheKey);
            if (cachedDrive) {
                return cachedDrive;
            }
            return this.caches.privateDriveCache.put(cacheKey, new arfs_drive_builders_1.ArFSPrivateDriveBuilder({
                entityId: driveId,
                key: driveKey,
                owner,
                gatewayApi: this.gatewayApi
            }).build());
        });
    }
    // Convenience function for known-private use cases
    getPrivateFolder(folderId, driveKey, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = { folderId, driveKey, owner };
            const cachedFolder = this.caches.privateFolderCache.get(cacheKey);
            if (cachedFolder) {
                return cachedFolder;
            }
            return this.caches.privateFolderCache.put(cacheKey, new arfs_folder_builders_1.ArFSPrivateFolderBuilder(folderId, this.gatewayApi, driveKey, owner).build());
        });
    }
    getPrivateFile(fileId, driveKey, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileKey = yield crypto_1.deriveFileKey(`${fileId}`, driveKey);
            const cacheKey = { fileId, owner, fileKey };
            const cachedFile = this.caches.privateFileCache.get(cacheKey);
            if (cachedFile) {
                return cachedFile;
            }
            return this.caches.privateFileCache.put(cacheKey, new arfs_file_builders_1.ArFSPrivateFileBuilder(fileId, this.gatewayApi, driveKey, owner).build());
        });
    }
    getAllFoldersOfPrivateDrive({ driveId, driveKey, owner, latestRevisionsOnly = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            let cursor = '';
            let hasNextPage = true;
            const allFolders = [];
            while (hasNextPage) {
                const gqlQuery = query_1.buildQuery({
                    tags: [
                        { name: 'Drive-Id', value: `${driveId}` },
                        { name: 'Entity-Type', value: 'folder' }
                    ],
                    cursor,
                    owner
                });
                const transactions = yield this.gatewayApi.gqlRequest(gqlQuery);
                const { edges } = transactions;
                hasNextPage = transactions.pageInfo.hasNextPage;
                const folders = edges.map((edge) => __awaiter(this, void 0, void 0, function* () {
                    cursor = edge.cursor;
                    const { node } = edge;
                    const folderBuilder = arfs_folder_builders_1.ArFSPrivateFolderBuilder.fromArweaveNode(node, this.gatewayApi, driveKey);
                    // Build the folder so that we don't add something invalid to the cache
                    const folder = yield folderBuilder.build(node);
                    const cacheKey = { folderId: folder.entityId, owner, driveKey };
                    return this.caches.privateFolderCache.put(cacheKey, Promise.resolve(folder));
                }));
                allFolders.push(...(yield Promise.all(folders)));
            }
            return latestRevisionsOnly ? allFolders.filter(filter_methods_1.latestRevisionFilter) : allFolders;
        });
    }
    getPrivateFilesWithParentFolderIds(folderIDs, driveKey, owner, latestRevisionsOnly = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let cursor = '';
            let hasNextPage = true;
            const allFiles = [];
            while (hasNextPage) {
                const gqlQuery = query_1.buildQuery({
                    tags: [
                        { name: 'Parent-Folder-Id', value: folderIDs.map((fid) => fid.toString()) },
                        { name: 'Entity-Type', value: 'file' }
                    ],
                    cursor,
                    owner
                });
                const transactions = yield this.gatewayApi.gqlRequest(gqlQuery);
                const { edges } = transactions;
                hasNextPage = transactions.pageInfo.hasNextPage;
                const files = edges.map((edge) => __awaiter(this, void 0, void 0, function* () {
                    const { node } = edge;
                    cursor = edge.cursor;
                    const fileBuilder = arfs_file_builders_1.ArFSPrivateFileBuilder.fromArweaveNode(node, this.gatewayApi, driveKey);
                    // Build the file so that we don't add something invalid to the cache
                    const file = yield fileBuilder.build(node);
                    const fileKey = yield crypto_1.deriveFileKey(`${file.fileId}`, driveKey);
                    const cacheKey = {
                        fileId: file.fileId,
                        owner,
                        fileKey
                    };
                    return this.caches.privateFileCache.put(cacheKey, Promise.resolve(file));
                }));
                allFiles.push(...(yield Promise.all(files)));
            }
            return latestRevisionsOnly ? allFiles.filter(filter_methods_1.latestRevisionFilter) : allFiles;
        });
    }
    getEntitiesInFolder(parentFolderId, owner, builder, latestRevisionsOnly = true, filterOnOwner = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let cursor = '';
            let hasNextPage = true;
            const allEntities = [];
            while (hasNextPage) {
                const gqlQuery = query_1.buildQuery({
                    tags: [
                        { name: 'Parent-Folder-Id', value: `${parentFolderId}` },
                        { name: 'Entity-Type', value: ['file', 'folder'] }
                    ],
                    cursor,
                    owner: filterOnOwner ? owner : undefined
                });
                const transactions = yield this.gatewayApi.gqlRequest(gqlQuery);
                const { edges } = transactions;
                hasNextPage = transactions.pageInfo.hasNextPage;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const folders = edges.map((edge) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    const { node } = edge;
                    cursor = edge.cursor;
                    const { tags } = node;
                    // Check entityType to determine which builder to use
                    const entityType = (_a = tags.find((t) => t.name === 'Entity-Type')) === null || _a === void 0 ? void 0 : _a.value;
                    if (!entityType || (entityType !== 'file' && entityType !== 'folder')) {
                        throw new Error('Entity-Type tag is missing or invalid!');
                    }
                    return builder(node, entityType).build(node);
                }));
                allEntities.push(...(yield Promise.all(folders)));
            }
            return latestRevisionsOnly ? allEntities.filter(filter_methods_1.latestRevisionFilter) : allEntities;
        });
    }
    getPrivateEntitiesInFolder(parentFolderId, owner, driveKey, latestRevisionsOnly = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getEntitiesInFolder(parentFolderId, owner, (node, entityType) => entityType === 'folder'
                ? arfs_folder_builders_1.ArFSPrivateFolderBuilder.fromArweaveNode(node, this.gatewayApi, driveKey)
                : arfs_file_builders_1.ArFSPrivateFileBuilder.fromArweaveNode(node, this.gatewayApi, driveKey), latestRevisionsOnly);
        });
    }
    getPublicEntitiesInFolder(parentFolderId, owner, latestRevisionsOnly = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getEntitiesInFolder(parentFolderId, owner, (node, entityType) => entityType === 'folder'
                ? arfs_folder_builders_1.ArFSPublicFolderBuilder.fromArweaveNode(node, this.gatewayApi)
                : arfs_file_builders_1.ArFSPublicFileBuilder.fromArweaveNode(node, this.gatewayApi), latestRevisionsOnly);
        });
    }
    getChildrenFolderIds(folderId, allFolderEntitiesOfDrive) {
        return __awaiter(this, void 0, void 0, function* () {
            const hierarchy = folder_hierarchy_1.FolderHierarchy.newFromEntities(allFolderEntitiesOfDrive);
            return hierarchy.folderIdSubtreeFromFolderId(folderId, Number.MAX_SAFE_INTEGER);
        });
    }
    getPrivateEntityNamesInFolder(folderId, owner, driveKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const childrenOfFolder = yield this.getPrivateEntitiesInFolder(folderId, owner, driveKey, true);
            return childrenOfFolder.map(mapper_functions_1.entityToNameMap);
        });
    }
    getPublicEntityNamesInFolder(folderId, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const childrenOfFolder = yield this.getPublicEntitiesInFolder(folderId, owner, true);
            return childrenOfFolder.map(mapper_functions_1.entityToNameMap);
        });
    }
    getPublicNameConflictInfoInFolder(folderId, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = { folderId, owner };
            const cachedConflictInfo = this.caches.publicConflictCache.get(cacheKey);
            if (cachedConflictInfo) {
                return cachedConflictInfo;
            }
            return this.caches.publicConflictCache.put(cacheKey, (() => __awaiter(this, void 0, void 0, function* () {
                const childrenOfFolder = yield this.getPublicEntitiesInFolder(folderId, owner, true);
                return {
                    files: childrenOfFolder.filter(filter_methods_1.fileFilter).map(mapper_functions_1.fileConflictInfoMap),
                    folders: childrenOfFolder.filter(filter_methods_1.folderFilter).map(mapper_functions_1.folderToNameAndIdMap)
                };
            }))());
        });
    }
    getPrivateNameConflictInfoInFolder(folderId, owner, driveKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = { folderId, owner, driveKey };
            const cachedConflictInfo = this.caches.privateConflictCache.get(cacheKey);
            if (cachedConflictInfo) {
                return cachedConflictInfo;
            }
            return this.caches.privateConflictCache.put(cacheKey, (() => __awaiter(this, void 0, void 0, function* () {
                const childrenOfFolder = yield this.getPrivateEntitiesInFolder(folderId, owner, driveKey, true);
                // Hack to deal with potential typescript bug
                const files = childrenOfFolder.filter(filter_methods_1.fileFilter);
                const folders = childrenOfFolder.filter(filter_methods_1.folderFilter);
                return {
                    files: files.map(mapper_functions_1.fileConflictInfoMap),
                    folders: folders.map(mapper_functions_1.folderToNameAndIdMap)
                };
            }))());
        });
    }
    getPrivateChildrenFolderIds({ folderId, driveId, driveKey, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getChildrenFolderIds(folderId, yield this.getAllFoldersOfPrivateDrive({ driveId, driveKey, owner, latestRevisionsOnly: true }));
        });
    }
    getPublicChildrenFolderIds({ folderId, owner, driveId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getChildrenFolderIds(folderId, yield this.getAllFoldersOfPublicDrive({ driveId, owner, latestRevisionsOnly: true }));
        });
    }
    getOwnerAndAssertDrive(driveId, driveKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedOwner = this.caches.ownerCache.get(driveId);
            if (cachedOwner) {
                return cachedOwner;
            }
            return this.caches.ownerCache.put(driveId, (() => __awaiter(this, void 0, void 0, function* () {
                const gqlQuery = query_1.buildQuery({
                    tags: [
                        { name: 'Entity-Type', value: 'drive' },
                        { name: 'Drive-Id', value: `${driveId}` }
                    ],
                    sort: query_1.ASCENDING_ORDER
                });
                const transactions = yield this.gatewayApi.gqlRequest(gqlQuery);
                const edges = transactions.edges;
                if (!edges.length) {
                    throw new Error(`Could not find a transaction with "Drive-Id": ${driveId}`);
                }
                const edgeOfFirstDrive = edges[0];
                const driveOwnerAddress = edgeOfFirstDrive.node.owner.address;
                const driveOwner = new types_1.ArweaveAddress(driveOwnerAddress);
                const drivePrivacy = driveKey ? 'private' : 'public';
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
                    const driveDataBuffer = yield this.gatewayApi.getTxData(types_1.TxID(edgeOfFirstDrive.node.id));
                    try {
                        // Attempt to decrypt drive to assert drive key is correct
                        yield crypto_1.driveDecrypt(cipherIVFromTag.value, driveKey, driveDataBuffer);
                    }
                    catch (_a) {
                        throw new Error('Provided drive key or password could not decrypt target private drive!');
                    }
                }
                return driveOwner;
            }))());
        });
    }
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
    listPrivateFolder({ folderId, driveKey, maxDepth, includeRoot, owner, withPathsFactory = arfs_entities_1.privateEntityWithPathsKeylessFactory }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Number.isInteger(maxDepth) || maxDepth < 0) {
                throw new Error('maxDepth should be a non-negative integer!');
            }
            const folder = yield this.getPrivateFolder(folderId, driveKey, owner);
            // Fetch all of the folder entities within the drive
            const { hierarchy, childFiles, childFolders } = yield this.separatedHierarchyOfFolder(folder, owner, driveKey, maxDepth);
            if (includeRoot) {
                childFolders.unshift(folder);
            }
            const children = [];
            for (const en of childFolders) {
                children.push(en);
            }
            for (const en of childFiles) {
                children.push(en);
            }
            const entitiesWithPath = children.map((entity) => withPathsFactory(entity, hierarchy, driveKey));
            return entitiesWithPath;
        });
    }
    assertValidPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = this.wallet;
            const walletAddress = yield wallet.getAddress();
            const query = query_1.buildQuery({
                tags: [
                    { name: 'Entity-Type', value: 'drive' },
                    { name: 'Drive-Privacy', value: 'private' }
                ],
                owner: walletAddress,
                sort: query_1.ASCENDING_ORDER
            });
            const transactions = yield this.gatewayApi.gqlRequest(query);
            const { edges } = transactions;
            if (!edges.length) {
                // No drive has been created for this wallet
                return;
            }
            const { node } = edges[0];
            const safeDriveBuilder = arfs_drive_builders_1.SafeArFSDriveBuilder.fromArweaveNode(node, this.gatewayApi, new private_key_data_1.PrivateKeyData({ password, wallet: this.wallet }));
            const safelyBuiltDrive = yield safeDriveBuilder.build();
            if (safelyBuiltDrive.name === constants_1.ENCRYPTED_DATA_PLACEHOLDER ||
                `${safelyBuiltDrive.rootFolderId}` === constants_1.ENCRYPTED_DATA_PLACEHOLDER) {
                throw new Error(`Invalid password! Please type the same as your other private drives!`);
            }
        });
    }
    getPrivateTransactionCipherIV(txId) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield this.getCipherIVOfPrivateTransactionIDs([txId]);
            if (results.length !== 1) {
                throw new Error(`Could not fetch the CipherIV for transaction with id: ${txId}`);
            }
            const [fileCipherIvResult] = results;
            return fileCipherIvResult.cipherIV;
        });
    }
    getCipherIVOfPrivateTransactionIDs(txIDs) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = [];
            const wallet = this.wallet;
            const walletAddress = yield wallet.getAddress();
            let cursor = '';
            let hasNextPage = true;
            while (hasNextPage) {
                const query = query_1.buildQuery({
                    tags: [],
                    owner: walletAddress,
                    ids: txIDs,
                    cursor
                });
                const transactions = yield this.gatewayApi.gqlRequest(query);
                const { edges } = transactions;
                hasNextPage = transactions.pageInfo.hasNextPage;
                if (!edges.length) {
                    throw new Error(`No such private transactions with IDs: "${txIDs}"`);
                }
                edges.forEach((edge) => {
                    cursor = edge.cursor;
                    const { node } = edge;
                    const { tags } = node;
                    const txId = types_1.TxID(node.id);
                    const cipherIVTag = tags.find((tag) => tag.name === 'Cipher-IV');
                    if (!cipherIVTag) {
                        throw new Error("The private file doesn't have a valid Cipher-IV");
                    }
                    const cipherIV = cipherIVTag.value;
                    result.push({ txId, cipherIV });
                });
            }
            return result;
        });
    }
    /**
     * Returns the data stream of a private file
     * @param privateFile - the entity of the data to be download
     * @returns {Promise<Readable>}
     */
    getPrivateDataStream(privateFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataLength = privateFile.encryptedDataSize;
            const authTagIndex = +dataLength - constants_1.authTagLength;
            const dataTxUrl = `${common_1.gatewayUrlForArweave(this.arweave).href}${privateFile.dataTxId}`;
            const requestConfig = {
                method: 'get',
                url: dataTxUrl,
                responseType: 'stream',
                headers: {
                    Range: `bytes=0-${+authTagIndex - 1}`
                }
            };
            const response = yield axios_1.default(requestConfig);
            return response.data;
        });
    }
    getAuthTagForPrivateFile(privateFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataLength = privateFile.encryptedDataSize;
            const authTagIndex = +dataLength - constants_1.authTagLength;
            const response = yield axios_1.default({
                method: 'GET',
                url: `${common_1.gatewayUrlForArweave(this.arweave).href}${privateFile.dataTxId}`,
                headers: {
                    Range: `bytes=${authTagIndex}-${+dataLength - 1}`
                },
                responseType: 'arraybuffer'
            });
            const { data } = response;
            if (data.length === constants_1.authTagLength) {
                return data;
            }
            throw new Error(`The retrieved auth tag does not have the length of ${constants_1.authTagLength} bytes, but instead: ${data.length}`);
        });
    }
    renamePublicFile({ file, newName, metadataRewardSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prepare meta data transaction
            const metadataTxData = new arfs_tx_data_types_1.ArFSPublicFileMetadataTransactionData(newName, file.size, file.lastModifiedDate, file.dataTxId, file.dataContentType);
            const fileMetadata = new arfs_prototypes_1.ArFSPublicFileMetaDataPrototype(metadataTxData, file.driveId, file.fileId, file.parentFolderId);
            const metaDataTx = yield this.txPreparer.prepareMetaDataTx({
                objectMetaData: fileMetadata,
                rewardSettings: metadataRewardSettings
            });
            // Upload meta data
            if (!this.dryRun) {
                const metaDataUploader = yield this.arweave.transactions.getUploader(metaDataTx);
                while (!metaDataUploader.isComplete) {
                    yield metaDataUploader.uploadChunk();
                }
            }
            return {
                entityId: file.fileId,
                metaDataTxId: types_1.TxID(metaDataTx.id),
                metaDataTxReward: types_1.W(metaDataTx.reward)
            };
        });
    }
    renamePrivateFile({ file, newName, metadataRewardSettings, driveKey }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prepare meta data transaction
            const fileMetadataTxData = yield arfs_tx_data_types_1.ArFSPrivateFileMetadataTransactionData.from(newName, file.size, file.lastModifiedDate, file.dataTxId, file.dataContentType, file.fileId, driveKey);
            const fileMetadata = new arfs_prototypes_1.ArFSPrivateFileMetaDataPrototype(fileMetadataTxData, file.driveId, file.fileId, file.parentFolderId);
            const metaDataTx = yield this.txPreparer.prepareMetaDataTx({
                objectMetaData: fileMetadata,
                rewardSettings: metadataRewardSettings
            });
            // Upload meta data
            if (!this.dryRun) {
                const metaDataUploader = yield this.arweave.transactions.getUploader(metaDataTx);
                while (!metaDataUploader.isComplete) {
                    yield metaDataUploader.uploadChunk();
                }
            }
            return {
                entityId: file.fileId,
                fileKey: fileMetadataTxData.fileKey,
                metaDataTxId: types_1.TxID(metaDataTx.id),
                metaDataTxReward: types_1.W(metaDataTx.reward)
            };
        });
    }
    renamePublicFolder({ folder, newName, metadataRewardSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prepare meta data transaction
            const metadataTxData = new arfs_tx_data_types_1.ArFSPublicFolderTransactionData(newName);
            const folderMetadata = new arfs_prototypes_1.ArFSPublicFolderMetaDataPrototype(metadataTxData, folder.driveId, folder.entityId, folder.parentFolderId);
            const metaDataTx = yield this.txPreparer.prepareMetaDataTx({
                objectMetaData: folderMetadata,
                rewardSettings: metadataRewardSettings
            });
            // Upload meta data
            if (!this.dryRun) {
                const metaDataUploader = yield this.arweave.transactions.getUploader(metaDataTx);
                while (!metaDataUploader.isComplete) {
                    yield metaDataUploader.uploadChunk();
                }
            }
            return {
                entityId: folder.entityId,
                metaDataTxId: types_1.TxID(metaDataTx.id),
                metaDataTxReward: types_1.W(metaDataTx.reward)
            };
        });
    }
    renamePrivateFolder({ folder, newName, metadataRewardSettings, driveKey }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prepare meta data transaction
            const folderMetadataTxData = yield arfs_tx_data_types_1.ArFSPrivateFolderTransactionData.from(newName, driveKey);
            const folderMetadata = new arfs_prototypes_1.ArFSPrivateFolderMetaDataPrototype(folder.driveId, folder.entityId, folderMetadataTxData, folder.parentFolderId);
            const metaDataTx = yield this.txPreparer.prepareMetaDataTx({
                objectMetaData: folderMetadata,
                rewardSettings: metadataRewardSettings
            });
            // Upload meta data
            if (!this.dryRun) {
                const metaDataUploader = yield this.arweave.transactions.getUploader(metaDataTx);
                while (!metaDataUploader.isComplete) {
                    yield metaDataUploader.uploadChunk();
                }
            }
            return {
                entityId: folder.entityId,
                metaDataTxId: types_1.TxID(metaDataTx.id),
                driveKey,
                metaDataTxReward: types_1.W(metaDataTx.reward)
            };
        });
    }
    renamePublicDrive({ drive, newName, metadataRewardSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prepare meta data transaction
            const driveMetadataTxData = new arfs_tx_data_types_1.ArFSPublicDriveTransactionData(newName, drive.rootFolderId);
            const driveMetadata = new arfs_prototypes_1.ArFSPublicDriveMetaDataPrototype(driveMetadataTxData, drive.driveId);
            const metaDataTx = yield this.txPreparer.prepareMetaDataTx({
                objectMetaData: driveMetadata,
                rewardSettings: metadataRewardSettings
            });
            // Upload meta data
            if (!this.dryRun) {
                const metaDataUploader = yield this.arweave.transactions.getUploader(metaDataTx);
                while (!metaDataUploader.isComplete) {
                    yield metaDataUploader.uploadChunk();
                }
            }
            return {
                entityId: drive.driveId,
                metaDataTxId: types_1.TxID(metaDataTx.id),
                metaDataTxReward: types_1.W(metaDataTx.reward)
            };
        });
    }
    renamePrivateDrive({ drive, newName, metadataRewardSettings, driveKey }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Prepare meta data transaction
            const driveMetadataTxData = yield arfs_tx_data_types_1.ArFSPrivateDriveTransactionData.from(newName, drive.rootFolderId, driveKey);
            const driveMetadata = new arfs_prototypes_1.ArFSPrivateDriveMetaDataPrototype(drive.driveId, driveMetadataTxData);
            const metaDataTx = yield this.txPreparer.prepareMetaDataTx({
                objectMetaData: driveMetadata,
                rewardSettings: metadataRewardSettings
            });
            // Upload meta data
            if (!this.dryRun) {
                const metaDataUploader = yield this.arweave.transactions.getUploader(metaDataTx);
                while (!metaDataUploader.isComplete) {
                    yield metaDataUploader.uploadChunk();
                }
            }
            return {
                entityId: drive.driveId,
                metaDataTxId: types_1.TxID(metaDataTx.id),
                driveKey,
                metaDataTxReward: types_1.W(metaDataTx.reward)
            };
        });
    }
    downloadPrivateFolder({ folderId, destFolderPath, customFolderName, maxDepth, driveKey, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            const privateFolder = yield this.getPrivateFolder(folderId, driveKey, owner);
            // Fetch all file and folder entities within all Folders of the drive
            const { hierarchy, childFiles, childFolders } = yield this.separatedHierarchyOfFolder(privateFolder, owner, driveKey, maxDepth);
            const folderWrapper = new arfs_file_wrapper_1.ArFSFolderToDownload(arfs_entities_1.privateEntityWithPathsKeylessFactory(privateFolder, hierarchy), customFolderName);
            // Fetch the file CipherIVs
            const fileDataTxIDs = childFiles.map((file) => file.dataTxId);
            const fileCipherIVResults = yield this.getCipherIVOfPrivateTransactionIDs(fileDataTxIDs);
            const cipherIVMap = fileCipherIVResults.reduce((accumulator, ivResult) => {
                return Object.assign(accumulator, { [`${ivResult.txId}`]: ivResult });
            }, {});
            const foldersWithPath = [privateFolder, ...childFolders]
                .map((folder) => arfs_entities_1.privateEntityWithPathsKeylessFactory(folder, hierarchy))
                .sort((a, b) => sort_functions_1.alphabeticalOrder(a.path, b.path));
            // Iteratively download all child files in the hierarchy
            for (const folder of foldersWithPath) {
                // assert the existence of the folder on disk
                const relativeFolderPath = folderWrapper.getRelativePathOf(folder.path);
                const absoluteLocalFolderPath = path_1.join(destFolderPath, relativeFolderPath);
                folderWrapper.ensureFolderExistence(absoluteLocalFolderPath);
                // download child files into the folder
                const childrenFiles = childFiles.filter((file) => `${file.parentFolderId}` === `${folder.entityId}` /* FIXME: use the `equals` method */);
                for (const file of childrenFiles) {
                    const relativeFilePath = folderWrapper.getRelativePathOf(arfs_entities_1.privateEntityWithPathsKeylessFactory(file, hierarchy).path);
                    const absoluteLocalFilePath = path_1.join(destFolderPath, relativeFilePath);
                    /*
                     * FIXME: Downloading all files at once consumes a lot of resources.
                     * TODO: Implement a download manager for downloading in parallel
                     * Doing it sequentially for now
                     */
                    const dataStream = yield this.getPrivateDataStream(file);
                    const fileKey = yield crypto_1.deriveFileKey(`${file.fileId}`, driveKey);
                    const fileCipherIVResult = cipherIVMap[`${file.dataTxId}`];
                    if (!fileCipherIVResult) {
                        throw new Error(`Could not find the CipherIV for the private file with ID ${file.fileId}`);
                    }
                    const authTag = yield this.getAuthTagForPrivateFile(file);
                    const decryptingStream = new stream_decrypt_1.StreamDecrypt(fileCipherIVResult.cipherIV, fileKey, authTag);
                    const fileWrapper = new arfs_file_wrapper_1.ArFSPrivateFileToDownload(file, dataStream, absoluteLocalFilePath, decryptingStream);
                    yield fileWrapper.write();
                }
            }
        });
    }
    separatedHierarchyOfFolder(folder, owner, driveKey, maxDepth) {
        return __awaiter(this, void 0, void 0, function* () {
            // Fetch all of the folder entities within the drive
            const driveIdOfFolder = folder.driveId;
            const allFolderEntitiesOfDrive = yield this.getAllFoldersOfPrivateDrive({
                driveId: driveIdOfFolder,
                owner,
                latestRevisionsOnly: true,
                driveKey
            });
            // Feed entities to FolderHierarchy
            const hierarchy = folder_hierarchy_1.FolderHierarchy.newFromEntities(allFolderEntitiesOfDrive);
            const searchFolderIDs = hierarchy.folderIdSubtreeFromFolderId(folder.entityId, maxDepth);
            // Fetch all file entities within all Folders of the drive
            const childFiles = [];
            for (const id of searchFolderIDs) {
                (yield this.getPrivateFilesWithParentFolderIds([id], driveKey, owner, true)).forEach((e) => {
                    childFiles.push(e);
                });
            }
            const [, ...subFolderIDs] = hierarchy.folderIdSubtreeFromFolderId(folder.entityId, maxDepth + 1);
            const childFolders = allFolderEntitiesOfDrive.filter((folder) => subFolderIDs.some((folderId) => `${folderId}` === `${folder.entityId}` /* FIXME: use the `equals` method */));
            return { hierarchy, childFiles, childFolders };
        });
    }
    getManifestLinks(dataTxId, manifest) {
        return manifest.getLinksOutput(dataTxId, common_1.gatewayUrlForArweave(this.arweave));
    }
}
exports.ArFSDAO = ArFSDAO;

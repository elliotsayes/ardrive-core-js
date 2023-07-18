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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArDrive = void 0;
const ardrive_anonymous_1 = require("./ardrive_anonymous");
const arfs_entities_1 = require("./arfs/arfs_entities");
const arfs_file_wrapper_1 = require("./arfs/arfs_file_wrapper");
const arfs_tx_data_types_1 = require("./arfs/tx/arfs_tx_data_types");
const crypto_1 = require("./utils/crypto");
const types_1 = require("./types");
const error_message_1 = require("./utils/error_message");
const constants_1 = require("./utils/constants");
const stream_decrypt_1 = require("./utils/stream_decrypt");
const assert_folder_1 = require("./utils/assert_folder");
const path_1 = require("path");
const upload_conflict_resolution_1 = require("./utils/upload_conflict_resolution");
const arfs_entity_result_factory_1 = require("./arfs/arfs_entity_result_factory");
const arfs_upload_planner_1 = require("./arfs/arfs_upload_planner");
const estimation_prototypes_1 = require("./pricing/estimation_prototypes");
const arfs_tag_settings_1 = require("./arfs/arfs_tag_settings");
const ar_data_price_network_estimator_1 = require("./pricing/ar_data_price_network_estimator");
const arfs_folder_builders_1 = require("./arfs/arfs_builders/arfs_folder_builders");
const arfs_cost_calculator_1 = require("./arfs/arfs_cost_calculator");
const arfs_entity_name_validators_1 = require("./arfs/arfs_entity_name_validators");
class ArDrive extends ardrive_anonymous_1.ArDriveAnonymous {
    constructor(wallet, walletDao, arFsDao, communityOracle, 
    /** @deprecated App Name should be provided with ArFSTagSettings  */
    appName = constants_1.DEFAULT_APP_NAME, 
    /** @deprecated App Version should be provided with ArFSTagSettings  */
    appVersion = constants_1.DEFAULT_APP_VERSION, priceEstimator = new ar_data_price_network_estimator_1.ARDataPriceNetworkEstimator(), feeMultiple = new types_1.FeeMultiple(1.0), dryRun = false, arFSTagSettings = new arfs_tag_settings_1.ArFSTagSettings({ appName, appVersion }), uploadPlanner = new arfs_upload_planner_1.ArFSUploadPlanner({
        priceEstimator,
        arFSTagSettings: arFSTagSettings,
        feeMultiple,
        communityOracle
    }), costCalculator = new arfs_cost_calculator_1.ArFSCostCalculator({
        communityOracle,
        feeMultiple,
        priceEstimator
    })) {
        super(arFsDao);
        this.wallet = wallet;
        this.walletDao = walletDao;
        this.arFsDao = arFsDao;
        this.communityOracle = communityOracle;
        this.appName = appName;
        this.appVersion = appVersion;
        this.priceEstimator = priceEstimator;
        this.feeMultiple = feeMultiple;
        this.dryRun = dryRun;
        this.arFSTagSettings = arFSTagSettings;
        this.uploadPlanner = uploadPlanner;
        this.costCalculator = costCalculator;
    }
    /**
     * @deprecated Sending separate layer 1 community tips is discouraged due
     *  to concerns with network congestion. We find it safer to place the tip
     *  on the layer 1 data transaction or bundle transaction. This also prevents
     *  separation of file data and tip payment
     *
     * @remarks Presumes that there's a sufficient wallet balance
     */
    sendCommunityTip({ communityWinstonTip, assertBalance = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenHolder = yield this.communityOracle.selectTokenHolder();
            const arTransferBaseFee = yield this.priceEstimator.getBaseWinstonPriceForByteCount(new types_1.ByteCount(0));
            const transferResult = yield this.walletDao.sendARToAddress(new types_1.AR(communityWinstonTip), this.wallet, tokenHolder, { reward: arTransferBaseFee, feeMultiple: this.feeMultiple }, this.dryRun, this.arFSTagSettings.getTipTagsWithAppTags(), assertBalance);
            return {
                tipData: { txId: transferResult.txID, recipient: tokenHolder, winston: communityWinstonTip },
                reward: transferResult.reward
            };
        });
    }
    movePublicFile({ fileId, newParentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const destFolderDriveId = yield this.arFsDao.getDriveIdForFolderId(newParentFolderId);
            const owner = yield this.getOwnerForDriveId(destFolderDriveId);
            yield this.assertOwnerAddress(owner);
            const originalFileMetaData = yield this.getPublicFile({ fileId });
            if (!destFolderDriveId.equals(originalFileMetaData.driveId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveToDifferentDrive);
            }
            if (originalFileMetaData.parentFolderId.equals(newParentFolderId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveIntoSamePlace('File', newParentFolderId));
            }
            // Assert that there are no duplicate names in the destination folder
            const entityNamesInParentFolder = yield this.arFsDao.getPublicEntityNamesInFolder(newParentFolderId, owner);
            if (entityNamesInParentFolder.includes(originalFileMetaData.name)) {
                // TODO: Add optional interactive prompt to resolve name conflicts in ticket PE-599
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            const fileTransactionData = new arfs_tx_data_types_1.ArFSPublicFileMetadataTransactionData(originalFileMetaData.name, originalFileMetaData.size, originalFileMetaData.lastModifiedDate, originalFileMetaData.dataTxId, originalFileMetaData.dataContentType);
            const moveFileBaseCosts = yield this.estimateAndAssertCostOfMoveFile(fileTransactionData);
            const fileMetaDataBaseReward = { reward: moveFileBaseCosts.metaDataBaseReward, feeMultiple: this.feeMultiple };
            // Move file will create a new meta data tx with identical meta data except for a new parentFolderId
            const moveFileResult = yield this.arFsDao.movePublicFile({
                originalMetaData: originalFileMetaData,
                transactionData: fileTransactionData,
                newParentFolderId,
                metaDataBaseReward: fileMetaDataBaseReward
            });
            return Promise.resolve({
                created: [
                    {
                        type: 'file',
                        metadataTxId: moveFileResult.metaDataTxId,
                        dataTxId: moveFileResult.dataTxId,
                        entityId: fileId,
                        entityName: originalFileMetaData.name
                    }
                ],
                tips: [],
                fees: {
                    [`${moveFileResult.metaDataTxId}`]: moveFileResult.metaDataTxReward
                }
            });
        });
    }
    movePrivateFile({ fileId, newParentFolderId, driveKey }) {
        return __awaiter(this, void 0, void 0, function* () {
            const destFolderDriveId = yield this.arFsDao.getDriveIdForFolderId(newParentFolderId);
            const owner = yield this.getOwnerForDriveId(destFolderDriveId);
            yield this.assertOwnerAddress(owner);
            const originalFileMetaData = yield this.getPrivateFile({ fileId, driveKey });
            if (!destFolderDriveId.equals(originalFileMetaData.driveId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveToDifferentDrive);
            }
            if (originalFileMetaData.parentFolderId.equals(newParentFolderId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveIntoSamePlace('File', newParentFolderId));
            }
            // Assert that there are no duplicate names in the destination folder
            const entityNamesInParentFolder = yield this.arFsDao.getPrivateEntityNamesInFolder(newParentFolderId, owner, driveKey);
            if (entityNamesInParentFolder.includes(originalFileMetaData.name)) {
                // TODO: Add optional interactive prompt to resolve name conflicts in ticket PE-599
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            const fileTransactionData = yield arfs_tx_data_types_1.ArFSPrivateFileMetadataTransactionData.from(originalFileMetaData.name, originalFileMetaData.size, originalFileMetaData.lastModifiedDate, originalFileMetaData.dataTxId, originalFileMetaData.dataContentType, fileId, driveKey);
            const moveFileBaseCosts = yield this.estimateAndAssertCostOfMoveFile(fileTransactionData);
            const fileMetaDataBaseReward = { reward: moveFileBaseCosts.metaDataBaseReward, feeMultiple: this.feeMultiple };
            // Move file will create a new meta data tx with identical meta data except for a new parentFolderId
            const moveFileResult = yield this.arFsDao.movePrivateFile({
                originalMetaData: originalFileMetaData,
                transactionData: fileTransactionData,
                newParentFolderId,
                metaDataBaseReward: fileMetaDataBaseReward
            });
            return Promise.resolve({
                created: [
                    {
                        type: 'file',
                        metadataTxId: moveFileResult.metaDataTxId,
                        dataTxId: moveFileResult.dataTxId,
                        entityId: fileId,
                        key: moveFileResult.fileKey,
                        entityName: originalFileMetaData.name
                    }
                ],
                tips: [],
                fees: {
                    [`${moveFileResult.metaDataTxId}`]: moveFileResult.metaDataTxReward
                }
            });
        });
    }
    movePublicFolder({ folderId, newParentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (folderId.equals(newParentFolderId)) {
                throw new Error(error_message_1.errorMessage.folderCannotMoveIntoItself);
            }
            const destFolderDriveId = yield this.arFsDao.getDriveIdForFolderId(newParentFolderId);
            const owner = yield this.getOwnerForDriveId(destFolderDriveId);
            yield this.assertOwnerAddress(owner);
            const originalFolderMetaData = yield this.getPublicFolder({ folderId });
            if (!destFolderDriveId.equals(originalFolderMetaData.driveId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveToDifferentDrive);
            }
            if (originalFolderMetaData.parentFolderId.equals(newParentFolderId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveIntoSamePlace('Folder', newParentFolderId));
            }
            // Assert that there are no duplicate names in the destination folder
            const entityNamesInParentFolder = yield this.arFsDao.getPublicEntityNamesInFolder(newParentFolderId, owner);
            if (entityNamesInParentFolder.includes(originalFolderMetaData.name)) {
                // TODO: Add optional interactive prompt to resolve name conflicts in ticket PE-599
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            const childrenFolderIds = yield this.arFsDao.getPublicChildrenFolderIds({
                folderId,
                driveId: destFolderDriveId,
                owner
            });
            if (childrenFolderIds.some((fid) => fid.equals(newParentFolderId))) {
                throw new Error(error_message_1.errorMessage.cannotMoveParentIntoChildFolder);
            }
            const folderTransactionData = new arfs_tx_data_types_1.ArFSPublicFolderTransactionData(originalFolderMetaData.name);
            const { metaDataBaseReward: baseReward } = yield this.estimateAndAssertCostOfFolderUpload(folderTransactionData);
            const folderMetaDataBaseReward = { reward: baseReward, feeMultiple: this.feeMultiple };
            // Move folder will create a new meta data tx with identical meta data except for a new parentFolderId
            const moveFolderResult = yield this.arFsDao.movePublicFolder({
                originalMetaData: originalFolderMetaData,
                transactionData: folderTransactionData,
                newParentFolderId,
                metaDataBaseReward: folderMetaDataBaseReward
            });
            return Promise.resolve({
                created: [
                    {
                        type: 'folder',
                        metadataTxId: moveFolderResult.metaDataTxId,
                        entityId: folderId,
                        entityName: originalFolderMetaData.name
                    }
                ],
                tips: [],
                fees: {
                    [`${moveFolderResult.metaDataTxId}`]: moveFolderResult.metaDataTxReward
                }
            });
        });
    }
    movePrivateFolder({ folderId, newParentFolderId, driveKey }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (folderId.equals(newParentFolderId)) {
                throw new Error(error_message_1.errorMessage.folderCannotMoveIntoItself);
            }
            const destFolderDriveId = yield this.arFsDao.getDriveIdForFolderId(newParentFolderId);
            const owner = yield this.getOwnerForDriveId(destFolderDriveId);
            yield this.assertOwnerAddress(owner);
            const originalFolderMetaData = yield this.getPrivateFolder({ folderId, driveKey });
            if (!destFolderDriveId.equals(originalFolderMetaData.driveId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveToDifferentDrive);
            }
            if (originalFolderMetaData.parentFolderId.equals(newParentFolderId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveIntoSamePlace('Folder', newParentFolderId));
            }
            // Assert that there are no duplicate names in the destination folder
            const entityNamesInParentFolder = yield this.arFsDao.getPrivateEntityNamesInFolder(newParentFolderId, owner, driveKey);
            if (entityNamesInParentFolder.includes(originalFolderMetaData.name)) {
                // TODO: Add optional interactive prompt to resolve name conflicts in ticket PE-599
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            const childrenFolderIds = yield this.arFsDao.getPrivateChildrenFolderIds({
                folderId,
                driveId: destFolderDriveId,
                driveKey,
                owner
            });
            if (childrenFolderIds.some((fid) => fid.equals(newParentFolderId))) {
                throw new Error(error_message_1.errorMessage.cannotMoveParentIntoChildFolder);
            }
            const folderTransactionData = yield arfs_tx_data_types_1.ArFSPrivateFolderTransactionData.from(originalFolderMetaData.name, driveKey);
            const { metaDataBaseReward: baseReward } = yield this.estimateAndAssertCostOfFolderUpload(folderTransactionData);
            const folderMetaDataBaseReward = { reward: baseReward, feeMultiple: this.feeMultiple };
            // Move folder will create a new meta data tx with identical meta data except for a new parentFolderId
            const moveFolderResult = yield this.arFsDao.movePrivateFolder({
                originalMetaData: originalFolderMetaData,
                transactionData: folderTransactionData,
                newParentFolderId,
                metaDataBaseReward: folderMetaDataBaseReward
            });
            return Promise.resolve({
                created: [
                    {
                        type: 'folder',
                        metadataTxId: moveFolderResult.metaDataTxId,
                        entityId: folderId,
                        key: moveFolderResult.driveKey,
                        entityName: originalFolderMetaData.name
                    }
                ],
                tips: [],
                fees: {
                    [`${moveFolderResult.metaDataTxId}`]: moveFolderResult.metaDataTxReward
                }
            });
        });
    }
    /**
     * Utility method to resolve any name conflicts for a bulk upload
     *
     * @returns An array of upload stats that have had their name conflicts resolved
     */
    resolveBulkNameConflicts({ entitiesToUpload, conflictResolution, prompts }) {
        return __awaiter(this, void 0, void 0, function* () {
            // First, assert any name conflicts within the upload itself
            upload_conflict_resolution_1.assertLocalNameConflicts(entitiesToUpload);
            /** Accumulate resolved entities to pass back to the bulk upload method  */
            const resolvedEntitiesToUpload = [];
            for (const entity of entitiesToUpload) {
                const { destFolderId, wrappedEntity, driveKey, owner, destName } = entity;
                const resolveConflictParams = {
                    conflictResolution,
                    getConflictInfoFn: (folderId) => driveKey
                        ? this.arFsDao.getPrivateNameConflictInfoInFolder(folderId, owner, driveKey)
                        : this.arFsDao.getPublicNameConflictInfoInFolder(folderId, owner),
                    prompts,
                    destFolderId
                };
                const destinationName = destName !== null && destName !== void 0 ? destName : wrappedEntity.destinationBaseName;
                if (wrappedEntity.entityType === 'folder') {
                    arfs_entity_name_validators_1.assertArFSCompliantNamesWithinFolder(wrappedEntity, destinationName);
                    yield upload_conflict_resolution_1.resolveFolderNameConflicts(Object.assign({ wrappedFolder: wrappedEntity, destinationFolderName: destinationName }, resolveConflictParams));
                }
                else {
                    arfs_entity_name_validators_1.assertValidArFSFileName(destinationName);
                    yield upload_conflict_resolution_1.resolveFileNameConflicts(Object.assign({ wrappedFile: wrappedEntity, destinationFileName: destinationName }, resolveConflictParams));
                }
                switch (wrappedEntity.conflictResolution) {
                    case types_1.errorOnConflict:
                        throw new Error(error_message_1.errorMessage.entityNameExists);
                    case types_1.skipOnConflicts:
                        // Skip this folder without error, continue with other bulk upload paths
                        break;
                    case undefined:
                        // Conflicts are resolved, add this entity to the accumulating entitiesToUpload
                        resolvedEntitiesToUpload.push(Object.assign(Object.assign({}, entity), { wrappedEntity }));
                        break;
                }
            }
            return resolvedEntitiesToUpload;
        });
    }
    /**
     * Upload any number of entities, each to their own destination folder and with their own potential driveKeys
     *
     * @remarks The presence of a drive key on the entitiesToUpload determines the privacy of each upload
     */
    uploadAllEntities({ entitiesToUpload, conflictResolution = types_1.upsertOnConflicts, prompts }) {
        return __awaiter(this, void 0, void 0, function* () {
            const preparedEntities = [];
            const owner = yield this.wallet.getAddress();
            for (const entity of entitiesToUpload) {
                preparedEntities.push(Object.assign(Object.assign({}, entity), { owner }));
            }
            const resolvedEntities = yield this.resolveBulkNameConflicts({
                entitiesToUpload: preparedEntities,
                conflictResolution,
                prompts
            });
            // Plan the upload
            const uploadPlan = yield this.uploadPlanner.planUploadAllEntities(resolvedEntities);
            // Calculate rewardSettings and communityTipSettings for each upload plan
            const { calculatedUploadPlan, totalWinstonPrice } = yield this.costCalculator.calculateCostsForUploadPlan(uploadPlan);
            // Assert balance for total winston price of upload
            yield this.assertWalletBalance(totalWinstonPrice);
            // Send calculated uploadPlan to ArFSDAO to consume
            const results = yield this.arFsDao.uploadAllEntities(calculatedUploadPlan);
            const arFSResult = {
                created: [],
                tips: [],
                fees: {}
            };
            // Add folder results
            for (const { entityId, folderTxId, driveKey, folderMetaDataReward, entityName, bundledIn, sourceUri } of results.folderResults) {
                arFSResult.created.push({
                    type: 'folder',
                    entityId,
                    metadataTxId: folderTxId,
                    key: driveKey,
                    bundledIn,
                    entityName,
                    sourceUri
                });
                if (folderMetaDataReward) {
                    arFSResult.fees = Object.assign(Object.assign({}, arFSResult.fees), { [`${folderTxId}`]: folderMetaDataReward });
                }
            }
            // Add file results
            for (const { fileDataTxId, entityId, metaDataTxId, fileDataReward, fileKey, fileMetaDataReward, communityTipSettings, bundledIn, entityName, sourceUri } of results.fileResults) {
                arFSResult.created.push({
                    type: 'file',
                    entityName,
                    entityId,
                    dataTxId: fileDataTxId,
                    metadataTxId: metaDataTxId,
                    bundledIn,
                    sourceUri,
                    key: fileKey ? fileKey : undefined
                });
                if (communityTipSettings) {
                    arFSResult.tips.push({
                        recipient: communityTipSettings.communityTipTarget,
                        txId: fileDataTxId,
                        winston: communityTipSettings.communityWinstonTip
                    });
                }
                if (fileDataReward) {
                    arFSResult.fees = Object.assign(Object.assign({}, arFSResult.fees), { [`${fileDataTxId}`]: fileDataReward });
                }
                if (fileMetaDataReward) {
                    arFSResult.fees = Object.assign(Object.assign({}, arFSResult.fees), { [`${metaDataTxId}`]: fileMetaDataReward });
                }
            }
            // Add bundle results
            for (const { bundleTxId, bundleReward, communityTipSettings } of results.bundleResults) {
                arFSResult.created.push({ type: 'bundle', bundleTxId });
                if (communityTipSettings) {
                    arFSResult.tips.push({
                        recipient: communityTipSettings.communityTipTarget,
                        txId: bundleTxId,
                        winston: communityTipSettings.communityWinstonTip
                    });
                }
                arFSResult.fees = Object.assign(Object.assign({}, arFSResult.fees), { [`${bundleTxId}`]: bundleReward });
            }
            return arFSResult;
        });
    }
    retryPublicArFSFileUploadByFileId({ dataTxId, wrappedFile, fileId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const metaDataTxId = yield this.deriveMetaDataTxIdForFileId(fileId, dataTxId);
            return this.retryPublicArFSFileUpload({ dataTxId, wrappedFile, fileId, metaDataTxId });
        });
    }
    retryPublicArFSFileUploadByDestFolderId({ dataTxId, wrappedFile, conflictResolution = 'upsert', destinationFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const metaDataTx = yield this.deriveMetaDataTxFromPublicFolder(destinationFolderId, dataTxId);
            let metaDataTxId = undefined;
            let createMetaDataPlan = undefined;
            let fileId = undefined;
            if (metaDataTx) {
                // MetaData has been verified
                metaDataTxId = metaDataTx.txId;
                fileId = metaDataTx.fileId;
            }
            else {
                // Metadata has not been found, it must be created
                const isValidUpload = yield this.assertWriteFileMetaData({
                    wrappedFile,
                    conflictResolution,
                    destinationFolderId
                });
                if (!isValidUpload) {
                    return types_1.emptyArFSResult;
                }
                createMetaDataPlan = {
                    rewardSettings: yield this.deriveAndAssertV2PublicFileMetaDataRewardSettings(wrappedFile),
                    destinationFolderId,
                    fileId: wrappedFile.existingId
                };
            }
            return this.retryPublicArFSFileUpload({ dataTxId, wrappedFile, fileId, metaDataTxId, createMetaDataPlan });
        });
    }
    retryPublicArFSFileUpload({ dataTxId, wrappedFile, fileId, createMetaDataPlan, metaDataTxId }) {
        return __awaiter(this, void 0, void 0, function* () {
            // prettier-ignore
            const { fileDataReward, communityTipSettings, newMetaDataInfo } = yield this.arFsDao.retryV2ArFSPublicFileTransaction({
                arFSDataTxId: dataTxId,
                wrappedFile,
                createMetaDataPlan
            });
            const fees = { [`${dataTxId}`]: fileDataReward };
            if (newMetaDataInfo) {
                fileId = newMetaDataInfo.fileId;
                metaDataTxId = newMetaDataInfo.metaDataTxId;
                fees[`${metaDataTxId}`] = newMetaDataInfo.fileMetaDataReward;
            }
            if (!fileId || !metaDataTxId) {
                // Provided for increased type safety, this error is considered unreachable with current code
                throw Error('MetaData Tx could not be verified or re-created!');
            }
            return {
                created: [
                    {
                        type: 'file',
                        dataTxId,
                        metadataTxId: metaDataTxId,
                        entityId: fileId,
                        entityName: wrappedFile.destinationBaseName,
                        sourceUri: wrappedFile.sourceUri
                    }
                ],
                tips: [
                    {
                        recipient: communityTipSettings.communityTipTarget,
                        txId: dataTxId,
                        winston: communityTipSettings.communityWinstonTip
                    }
                ],
                fees
            };
        });
    }
    deriveMetaDataTxIdForFileId(fileId, dataTxId) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = yield this.arFsDao.getDriveOwnerForFileId(fileId);
            const fileMetaData = yield this.arFsDao.getPublicFile(fileId, owner);
            if (fileMetaData.dataTxId.equals(dataTxId)) {
                // This metadata tx id is verified
                return fileMetaData.txId;
            }
            throw Error(`File with id "${fileId}" has no metadata that links to dataTxId: "${dataTxId}"`);
        });
    }
    deriveMetaDataTxFromPublicFolder(destinationFolderId, dataTxId) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = yield this.arFsDao.getDriveOwnerForFolderId(destinationFolderId);
            yield this.assertFolderExists(destinationFolderId, owner);
            const allFileMetaDataTxInFolder = yield this.arFsDao.getPublicFilesWithParentFolderIds([destinationFolderId], owner);
            const metaDataTxsForThisTx = allFileMetaDataTxInFolder.filter((f) => `${f.dataTxId}` === `${dataTxId}`);
            if (metaDataTxsForThisTx.length > 0) {
                return metaDataTxsForThisTx[0];
            }
            return undefined;
        });
    }
    assertFolderExists(destinationFolderId, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.arFsDao.getPublicFolder(destinationFolderId, owner);
            }
            catch (error) {
                throw Error(`The supplied public destination folder ID (${destinationFolderId}) cannot be found!`);
            }
        });
    }
    assertWriteFileMetaData({ wrappedFile, destinationFolderId, conflictResolution }) {
        return __awaiter(this, void 0, void 0, function* () {
            const destDriveId = yield this.arFsDao.getDriveIdForFolderId(destinationFolderId);
            const owner = yield this.arFsDao.getOwnerAndAssertDrive(destDriveId);
            yield this.assertOwnerAddress(owner);
            yield upload_conflict_resolution_1.resolveFileNameConflicts({
                wrappedFile,
                conflictResolution,
                destFolderId: destinationFolderId,
                destinationFileName: wrappedFile.destinationBaseName,
                getConflictInfoFn: (folderId) => this.arFsDao.getPublicNameConflictInfoInFolder(folderId, owner)
            });
            if (wrappedFile.conflictResolution) {
                switch (wrappedFile.conflictResolution) {
                    case 'error':
                        throw Error('File names cannot conflict with a folder name in the destination folder!');
                    case 'skip' || 'upsert':
                        console.error('File name conflicts with an existing file, with the current conflictResolution setting this upload would have be skipped. Use `replace` conflict resolution setting to override this and retry this transaction');
                        return false;
                }
            }
            return true;
        });
    }
    deriveAndAssertV2PublicFileMetaDataRewardSettings(wrappedFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileEstimationPrototype = estimation_prototypes_1.getPublicUploadFileEstimationPrototype(wrappedFile);
            // prettier-ignore
            const { metaDataRewardSettings, totalWinstonPrice } = yield this.costCalculator.calculateCostForV2MetaDataUpload(fileEstimationPrototype.objectData.sizeOf());
            this.assertWalletBalance(totalWinstonPrice);
            return metaDataRewardSettings;
        });
    }
    /** @deprecated -- Now uses the uploadAllEntities method internally. Will be removed in a future major release */
    uploadPublicFile({ parentFolderId, wrappedFile, conflictResolution, destinationFileName, prompts }) {
        return __awaiter(this, void 0, void 0, function* () {
            const destDriveId = yield this.arFsDao.getDriveIdForFolderId(parentFolderId);
            return this.uploadAllEntities({
                entitiesToUpload: [
                    { destFolderId: parentFolderId, wrappedEntity: wrappedFile, destName: destinationFileName, destDriveId }
                ],
                conflictResolution,
                prompts: prompts
            });
        });
    }
    /** @deprecated -- Now uses the uploadAllEntities method internally. Will be removed in a future major release */
    uploadPrivateFile({ wrappedFile, parentFolderId, prompts, destinationFileName, conflictResolution, driveKey }) {
        return __awaiter(this, void 0, void 0, function* () {
            const destDriveId = yield this.arFsDao.getDriveIdForFolderId(parentFolderId);
            return this.uploadAllEntities({
                entitiesToUpload: [
                    { destFolderId: parentFolderId, wrappedEntity: wrappedFile, destName: destinationFileName, driveKey, destDriveId }
                ],
                conflictResolution,
                prompts: prompts
            });
        });
    }
    /** @deprecated -- Now uses the uploadAllEntities method internally. Will be removed in a future major release */
    createPublicFolderAndUploadChildren({ parentFolderId, wrappedFolder, destParentFolderName, conflictResolution = types_1.upsertOnConflicts, prompts }) {
        return __awaiter(this, void 0, void 0, function* () {
            const destDriveId = yield this.arFsDao.getDriveIdForFolderId(parentFolderId);
            return this.uploadAllEntities({
                entitiesToUpload: [
                    { wrappedEntity: wrappedFolder, destFolderId: parentFolderId, destName: destParentFolderName, destDriveId }
                ],
                conflictResolution,
                prompts
            });
        });
    }
    /** @deprecated -- Now uses the uploadAllEntities method internally. Will be removed in a future major release */
    createPrivateFolderAndUploadChildren({ parentFolderId, wrappedFolder, driveKey, destParentFolderName, conflictResolution = types_1.upsertOnConflicts, prompts }) {
        return __awaiter(this, void 0, void 0, function* () {
            const destDriveId = yield this.arFsDao.getDriveIdForFolderId(parentFolderId);
            return this.uploadAllEntities({
                entitiesToUpload: [
                    { wrappedEntity: wrappedFolder, destFolderId: parentFolderId, destName: destParentFolderName, driveKey, destDriveId }
                ],
                conflictResolution,
                prompts
            });
        });
    }
    uploadPublicManifest({ folderId, destManifestName = 'DriveManifest.json', maxDepth = Number.MAX_SAFE_INTEGER, conflictResolution = types_1.upsertOnConflicts, prompts }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const driveId = yield this.arFsDao.getDriveIdForFolderId(folderId);
            // Assert that the owner of this drive is consistent with the provided wallet
            const owner = yield this.getOwnerForDriveId(driveId);
            yield this.assertOwnerAddress(owner);
            const children = yield this.listPublicFolder({
                folderId,
                maxDepth,
                includeRoot: true,
                owner
            });
            const arweaveManifest = new arfs_file_wrapper_1.ArFSManifestToUpload(children, destManifestName);
            const uploadManifestResults = yield this.uploadAllEntities({
                entitiesToUpload: [
                    {
                        wrappedEntity: arweaveManifest,
                        destFolderId: folderId,
                        destName: arweaveManifest.destinationBaseName,
                        destDriveId: driveId
                    }
                ],
                conflictResolution,
                prompts: prompts
            });
            const manifestTxId = (_a = uploadManifestResults.created[0]) === null || _a === void 0 ? void 0 : _a.dataTxId;
            if (manifestTxId) {
                const links = this.arFsDao.getManifestLinks(manifestTxId, arweaveManifest);
                return Object.assign(Object.assign({}, uploadManifestResults), { manifest: arweaveManifest.manifest, links });
            }
            // ArFSResult was empty, return expected empty manifest result
            return types_1.emptyManifestResult;
        });
    }
    createPublicFolder({ folderName, parentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            arfs_entity_name_validators_1.assertValidArFSFolderName(folderName);
            const driveId = yield this.arFsDao.getDriveIdForFolderId(parentFolderId);
            const owner = yield this.arFsDao.getOwnerAndAssertDrive(driveId);
            yield this.assertOwnerAddress(owner);
            // Assert that there are no duplicate names in the destination folder
            const entityNamesInParentFolder = yield this.arFsDao.getPublicEntityNamesInFolder(parentFolderId, owner);
            if (entityNamesInParentFolder.includes(folderName)) {
                // TODO: Add optional interactive prompt to resolve name conflicts in ticket PE-599
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            // Assert that there's enough AR available in the wallet
            const folderData = new arfs_tx_data_types_1.ArFSPublicFolderTransactionData(folderName);
            const { metaDataBaseReward } = yield this.estimateAndAssertCostOfFolderUpload(folderData);
            // Create the folder and retrieve its folder ID
            const { metaDataTxId: metaDataTxId, metaDataTxReward: metaDataTxReward, folderId } = yield this.arFsDao.createPublicFolder({
                folderData,
                driveId,
                rewardSettings: { reward: metaDataBaseReward, feeMultiple: this.feeMultiple },
                parentFolderId
            });
            // IN THE FUTURE WE MIGHT SEND A COMMUNITY TIP HERE
            return Promise.resolve({
                created: [
                    {
                        type: 'folder',
                        metadataTxId: metaDataTxId,
                        entityId: folderId,
                        entityName: folderName
                    }
                ],
                tips: [],
                fees: {
                    [`${metaDataTxId}`]: metaDataTxReward
                }
            });
        });
    }
    createPrivateFolder({ folderName, driveKey, parentFolderId, driveId }) {
        return __awaiter(this, void 0, void 0, function* () {
            arfs_entity_name_validators_1.assertValidArFSFolderName(folderName);
            const owner = yield this.wallet.getAddress();
            // Assert that there are no duplicate names in the destination folder
            const entityNamesInParentFolder = yield this.arFsDao.getPrivateEntityNamesInFolder(parentFolderId, owner, driveKey);
            if (entityNamesInParentFolder.includes(folderName)) {
                // TODO: Add optional interactive prompt to resolve name conflicts in ticket PE-599
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            // Assert that there's enough AR available in the wallet
            const folderData = yield arfs_tx_data_types_1.ArFSPrivateFolderTransactionData.from(folderName, driveKey);
            const { metaDataBaseReward } = yield this.estimateAndAssertCostOfFolderUpload(folderData);
            // Create the folder and retrieve its folder ID
            const { metaDataTxId: metaDataTxId, metaDataTxReward: metaDataTxReward, folderId } = yield this.arFsDao.createPrivateFolder({
                folderData,
                driveId,
                rewardSettings: { reward: metaDataBaseReward, feeMultiple: this.feeMultiple },
                parentFolderId
            });
            // IN THE FUTURE WE MIGHT SEND A COMMUNITY TIP HERE
            return Promise.resolve({
                created: [
                    {
                        type: 'folder',
                        metadataTxId: metaDataTxId,
                        entityId: folderId,
                        key: driveKey,
                        entityName: folderName
                    }
                ],
                tips: [],
                fees: {
                    [`${metaDataTxId}`]: metaDataTxReward
                }
            });
        });
    }
    createDrive(arFSPrototypes, arFSCreateDrive) {
        return __awaiter(this, void 0, void 0, function* () {
            const uploadPlan = this.uploadPlanner.planCreateDrive(arFSPrototypes);
            const { rewardSettings, totalWinstonPrice } = yield this.costCalculator.calculateCostForCreateDrive(uploadPlan);
            yield this.assertWalletBalance(totalWinstonPrice);
            const createDriveResult = yield arFSCreateDrive(rewardSettings);
            const arFSResults = {
                created: [
                    {
                        type: 'drive',
                        metadataTxId: createDriveResult.metaDataTxId,
                        entityId: createDriveResult.driveId
                    },
                    {
                        type: 'folder',
                        metadataTxId: createDriveResult.rootFolderTxId,
                        entityId: createDriveResult.rootFolderId
                    }
                ],
                tips: [],
                fees: {}
            };
            if (arfs_entity_result_factory_1.isBundleResult(createDriveResult)) {
                // Add bundle entity and return direct to network bundled tx result
                arFSResults.created.push({
                    type: 'bundle',
                    bundleTxId: createDriveResult.bundleTxId
                });
                arFSResults.created[0].bundledIn = createDriveResult.bundleTxId;
                arFSResults.created[1].bundledIn = createDriveResult.bundleTxId;
                return Object.assign(Object.assign({}, arFSResults), { fees: {
                        [`${createDriveResult.bundleTxId}`]: createDriveResult.bundleTxReward
                    } });
            }
            // Return as V2 Transaction result
            return Object.assign(Object.assign({}, arFSResults), { fees: {
                    [`${createDriveResult.metaDataTxId}`]: createDriveResult.metaDataTxReward,
                    [`${createDriveResult.rootFolderTxId}`]: createDriveResult.rootFolderTxReward
                } });
        });
    }
    createPublicDrive(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { driveName } = params;
            arfs_entity_name_validators_1.assertValidArFSDriveName(driveName);
            const createDriveResult = yield this.createDrive(estimation_prototypes_1.getPublicCreateDriveEstimationPrototypes(params), (rewardSettings) => this.arFsDao.createPublicDrive({ driveName, rewardSettings }));
            createDriveResult.created[0].entityName = driveName;
            createDriveResult.created[1].entityName = driveName;
            return createDriveResult;
        });
    }
    createPrivateDrive(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { driveName, newPrivateDriveData: newDriveData } = params;
            arfs_entity_name_validators_1.assertValidArFSDriveName(driveName);
            const createDriveResult = yield this.createDrive(yield estimation_prototypes_1.getPrivateCreateDriveEstimationPrototypes(params), (rewardSettings) => this.arFsDao.createPrivateDrive({ driveName, newDriveData, rewardSettings }));
            // Add drive keys and entity name to drive and folder entity results
            createDriveResult.created[0].key = newDriveData.driveKey;
            createDriveResult.created[1].key = newDriveData.driveKey;
            createDriveResult.created[0].entityName = driveName;
            createDriveResult.created[1].entityName = driveName;
            return createDriveResult;
        });
    }
    assertOwnerAddress(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner.equals(yield this.wallet.getAddress())) {
                throw new Error('Supplied wallet is not the owner of this drive!');
            }
        });
    }
    getPrivateDrive({ driveId, driveKey, owner, withKeys }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.getOwnerForDriveId(driveId);
            }
            yield this.assertOwnerAddress(owner);
            const drive = yield this.arFsDao.getPrivateDrive(driveId, driveKey, owner);
            return withKeys
                ? drive
                : new arfs_entities_1.ArFSPrivateDriveKeyless(drive.appName, drive.appVersion, drive.arFS, drive.contentType, drive.driveId, drive.entityType, drive.name, drive.txId, drive.unixTime, drive.drivePrivacy, drive.rootFolderId, drive.driveAuthMode, drive.cipher, drive.cipherIV);
        });
    }
    getPrivateFolder({ folderId, driveKey, owner, withKeys }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getDriveOwnerForFolderId(folderId);
            }
            yield this.assertOwnerAddress(owner);
            const folder = yield this.arFsDao.getPrivateFolder(folderId, driveKey, owner);
            return withKeys ? folder : new arfs_entities_1.ArFSPrivateFolderKeyless(folder);
        });
    }
    // Remove me after PE-1027 is applied
    getPrivateFolderKeyless({ folderId, driveKey, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            const folder = yield this.getPrivateFolder({ folderId, driveKey, owner });
            return new arfs_entities_1.ArFSPrivateFolderKeyless(folder);
        });
    }
    getPrivateFile({ fileId, driveKey, owner, withKeys = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getDriveOwnerForFileId(fileId);
            }
            const file = yield this.arFsDao.getPrivateFile(fileId, driveKey, owner);
            return withKeys ? file : new arfs_entities_1.ArFSPrivateFileKeyless(file);
        });
    }
    /**
     * Lists the children of certain private folder
     * @param {FolderID} folderId the folder ID to list children of
     * @returns {ArFSPrivateFileOrFolderWithPaths[]} an array representation of the children and parent folder
     */
    listPrivateFolder({ folderId, driveKey, maxDepth = 0, includeRoot = false, owner, withKeys = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getDriveOwnerForFolderId(folderId);
            }
            yield this.assertOwnerAddress(owner);
            const withPathsFactory = withKeys ? arfs_entities_1.privateEntityWithPathsFactory : arfs_entities_1.privateEntityWithPathsKeylessFactory;
            const children = this.arFsDao.listPrivateFolder({
                folderId,
                driveKey,
                maxDepth,
                includeRoot,
                owner,
                withPathsFactory
            });
            return children;
        });
    }
    /** Throw an error if wallet balance does not cover cost of the provided winston  */
    assertWalletBalance(winston) {
        return __awaiter(this, void 0, void 0, function* () {
            const walletHasBalance = yield this.walletDao.walletHasBalance(this.wallet, winston);
            if (!walletHasBalance) {
                const walletBalance = yield this.walletDao.getWalletWinstonBalance(this.wallet);
                throw new Error(`Wallet balance of ${walletBalance} Winston is not enough (${winston}) for this action!`);
            }
        });
    }
    estimateAndAssertCostOfMoveFile(metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.estimateAndAssertCostOfMetaDataTx(metadata);
        });
    }
    estimateAndAssertCostOfFolderUpload(metaData) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.estimateAndAssertCostOfMetaDataTx(metaData);
        });
    }
    estimateAndAssertCostOfFileRename(metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.estimateAndAssertCostOfMetaDataTx(metadata);
        });
    }
    estimateAndAssertCostOfFolderRename(metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.estimateAndAssertCostOfMetaDataTx(metadata);
        });
    }
    estimateAndAssertCostOfDriveRename(metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.estimateAndAssertCostOfMetaDataTx(metadata);
        });
    }
    estimateAndAssertCostOfMetaDataTx(metaData) {
        return __awaiter(this, void 0, void 0, function* () {
            const metaDataBaseReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(metaData.sizeOf());
            const boostedReward = types_1.W(this.feeMultiple.boostReward(metaDataBaseReward.toString()));
            const walletHasBalance = yield this.walletDao.walletHasBalance(this.wallet, boostedReward);
            if (!walletHasBalance) {
                const walletBalance = yield this.walletDao.getWalletWinstonBalance(this.wallet);
                throw new Error(`Wallet balance of ${walletBalance} Winston is not enough (${boostedReward}) for this transaction!`);
            }
            return {
                metaDataBaseReward
            };
        });
    }
    getDriveIdForFileId(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.arFsDao.getDriveIdForFileId(fileId);
        });
    }
    getDriveIdForFolderId(folderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.arFsDao.getDriveIdForFolderId(folderId);
        });
    }
    assertValidPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.arFsDao.assertValidPassword(password);
        });
    }
    downloadPrivateFile({ fileId, driveKey, destFolderPath, defaultFileName }) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_folder_1.assertFolderExists(destFolderPath);
            const privateFile = yield this.getPrivateFile({ fileId, driveKey });
            const outputFileName = defaultFileName !== null && defaultFileName !== void 0 ? defaultFileName : privateFile.name;
            const fullPath = path_1.join(destFolderPath, outputFileName);
            const data = yield this.arFsDao.getPrivateDataStream(privateFile);
            const fileKey = yield crypto_1.deriveFileKey(`${fileId}`, driveKey);
            const fileCipherIV = yield this.arFsDao.getPrivateTransactionCipherIV(privateFile.dataTxId);
            const authTag = yield this.arFsDao.getAuthTagForPrivateFile(privateFile);
            const decipher = new stream_decrypt_1.StreamDecrypt(fileCipherIV, fileKey, authTag);
            const fileToDownload = new arfs_file_wrapper_1.ArFSPrivateFileToDownload(privateFile, data, fullPath, decipher);
            yield fileToDownload.write();
        });
    }
    assertUniqueNameWithinPublicFolder(name, folderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const allSiblingNames = yield this.arFsDao.getPublicEntityNamesInFolder(folderId, yield this.wallet.getAddress());
            const collidesWithExistingSiblingName = allSiblingNames.reduce((accumulator, siblingName) => {
                return accumulator || siblingName === name;
            }, false);
            if (collidesWithExistingSiblingName) {
                throw new Error(`There already is an entity named that way`);
            }
        });
    }
    assertUniqueNameWithinPrivateFolder(name, folderId, driveKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const allSiblingNames = yield this.arFsDao.getPrivateEntityNamesInFolder(folderId, yield this.wallet.getAddress(), driveKey);
            const collidesWithExistingSiblingName = allSiblingNames.reduce((accumulator, siblingName) => {
                return accumulator || siblingName === name;
            }, false);
            if (collidesWithExistingSiblingName) {
                throw new Error(`There already is an entity named that way`);
            }
        });
    }
    renamePublicFile({ fileId, newName }) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = yield this.arFsDao.getDriveOwnerForFileId(fileId);
            yield this.assertOwnerAddress(owner);
            const file = yield this.getPublicFile({ fileId, owner });
            if (file.name === newName) {
                throw new Error(`To rename a file, the new name must be different`);
            }
            arfs_entity_name_validators_1.assertValidArFSFileName(newName);
            yield this.assertUniqueNameWithinPublicFolder(newName, file.parentFolderId);
            const fileMetadataTxDataStub = new arfs_tx_data_types_1.ArFSPublicFileMetadataTransactionData(newName, file.size, file.lastModifiedDate, file.dataTxId, file.dataContentType);
            const reward = yield this.estimateAndAssertCostOfFileRename(fileMetadataTxDataStub);
            const metadataRewardSettings = { feeMultiple: this.feeMultiple, reward: reward.metaDataBaseReward };
            const result = yield this.arFsDao.renamePublicFile({
                file,
                newName,
                metadataRewardSettings
            });
            return {
                created: [
                    {
                        type: 'file',
                        entityId: result.entityId,
                        metadataTxId: result.metaDataTxId,
                        entityName: newName
                    }
                ],
                tips: [],
                fees: { [`${result.metaDataTxId}`]: result.metaDataTxReward }
            };
        });
    }
    renamePrivateFile({ fileId, newName, driveKey }) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = yield this.arFsDao.getDriveOwnerForFileId(fileId);
            yield this.assertOwnerAddress(owner);
            const file = yield this.getPrivateFile({ fileId, driveKey, owner });
            if (file.name === newName) {
                throw new Error(`To rename a file, the new name must be different`);
            }
            arfs_entity_name_validators_1.assertValidArFSFileName(newName);
            yield this.assertUniqueNameWithinPrivateFolder(newName, file.parentFolderId, driveKey);
            const fileMetadataTxDataStub = yield arfs_tx_data_types_1.ArFSPrivateFileMetadataTransactionData.from(newName, file.size, file.lastModifiedDate, file.dataTxId, file.dataContentType, file.fileId, driveKey);
            const reward = yield this.estimateAndAssertCostOfFileRename(fileMetadataTxDataStub);
            const metadataRewardSettings = { feeMultiple: this.feeMultiple, reward: reward.metaDataBaseReward };
            const result = yield this.arFsDao.renamePrivateFile({
                file,
                newName,
                metadataRewardSettings,
                driveKey
            });
            return {
                created: [
                    {
                        type: 'file',
                        entityId: result.entityId,
                        key: result.fileKey,
                        metadataTxId: result.metaDataTxId,
                        entityName: newName
                    }
                ],
                tips: [],
                fees: { [`${result.metaDataTxId}`]: result.metaDataTxReward }
            };
        });
    }
    renamePublicFolder({ folderId, newName }) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = yield this.arFsDao.getDriveOwnerForFolderId(folderId);
            yield this.assertOwnerAddress(owner);
            const folder = yield this.getPublicFolder({ folderId, owner });
            if (`${folder.parentFolderId}` === arfs_folder_builders_1.ROOT_FOLDER_ID_PLACEHOLDER) {
                throw new Error(`The root folder with ID '${folderId}' cannot be renamed as it shares its name with its parent drive. Consider renaming the drive instead.`);
            }
            if (folder.name === newName) {
                throw new Error(`New folder name '${newName}' must be different from the current folder name!`);
            }
            arfs_entity_name_validators_1.assertValidArFSFolderName(newName);
            yield this.assertUniqueNameWithinPublicFolder(newName, folder.parentFolderId);
            const folderMetadataTxDataStub = new arfs_tx_data_types_1.ArFSPublicFolderTransactionData(newName);
            const reward = yield this.estimateAndAssertCostOfFolderRename(folderMetadataTxDataStub);
            const metadataRewardSettings = { feeMultiple: this.feeMultiple, reward: reward.metaDataBaseReward };
            const result = yield this.arFsDao.renamePublicFolder({
                folder,
                newName,
                metadataRewardSettings
            });
            return {
                created: [
                    {
                        type: 'folder',
                        entityId: result.entityId,
                        metadataTxId: result.metaDataTxId,
                        entityName: newName
                    }
                ],
                tips: [],
                fees: { [`${result.metaDataTxId}`]: result.metaDataTxReward }
            };
        });
    }
    renamePrivateFolder({ folderId, newName, driveKey }) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = yield this.arFsDao.getDriveOwnerForFolderId(folderId);
            yield this.assertOwnerAddress(owner);
            const folder = yield this.getPrivateFolder({ folderId, driveKey, owner });
            if (`${folder.parentFolderId}` === arfs_folder_builders_1.ROOT_FOLDER_ID_PLACEHOLDER) {
                throw new Error(`The root folder with ID '${folderId}' cannot be renamed as it shares its name with its parent drive. Consider renaming the drive instead.`);
            }
            if (folder.name === newName) {
                throw new Error(`New folder name '${newName}' must be different from the current folder name!`);
            }
            arfs_entity_name_validators_1.assertValidArFSFolderName(newName);
            yield this.assertUniqueNameWithinPrivateFolder(newName, folder.parentFolderId, driveKey);
            const folderMetadataTxDataStub = yield arfs_tx_data_types_1.ArFSPrivateFolderTransactionData.from(newName, driveKey);
            const reward = yield this.estimateAndAssertCostOfFolderRename(folderMetadataTxDataStub);
            const metadataRewardSettings = { feeMultiple: this.feeMultiple, reward: reward.metaDataBaseReward };
            const result = yield this.arFsDao.renamePrivateFolder({
                folder,
                newName,
                metadataRewardSettings,
                driveKey
            });
            return {
                created: [
                    {
                        type: 'folder',
                        entityId: result.entityId,
                        metadataTxId: result.metaDataTxId,
                        entityName: newName
                    }
                ],
                tips: [],
                fees: { [`${result.metaDataTxId}`]: result.metaDataTxReward }
            };
        });
    }
    renamePublicDrive({ driveId, newName }) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = yield this.arFsDao.getOwnerForDriveId(driveId);
            yield this.assertOwnerAddress(owner);
            const drive = yield this.getPublicDrive({ driveId, owner });
            if (drive.name === newName) {
                throw new Error(`New drive name '${newName}' must be different from the current drive name!`);
            }
            arfs_entity_name_validators_1.assertValidArFSDriveName(newName);
            const driveMetadataTxDataStub = new arfs_tx_data_types_1.ArFSPublicDriveTransactionData(newName, drive.rootFolderId);
            const reward = yield this.estimateAndAssertCostOfDriveRename(driveMetadataTxDataStub);
            const metadataRewardSettings = { feeMultiple: this.feeMultiple, reward: reward.metaDataBaseReward };
            const result = yield this.arFsDao.renamePublicDrive({
                drive,
                newName,
                metadataRewardSettings
            });
            return {
                created: [
                    {
                        type: 'drive',
                        entityId: result.entityId,
                        metadataTxId: result.metaDataTxId,
                        entityName: newName
                    }
                ],
                tips: [],
                fees: { [`${result.metaDataTxId}`]: result.metaDataTxReward }
            };
        });
    }
    renamePrivateDrive({ driveId, newName, driveKey }) {
        return __awaiter(this, void 0, void 0, function* () {
            const owner = yield this.arFsDao.getOwnerForDriveId(driveId);
            yield this.assertOwnerAddress(owner);
            const drive = yield this.getPrivateDrive({ driveId, owner, driveKey });
            if (drive.name === newName) {
                throw new Error(`New drive name '${newName}' must be different from the current drive name!`);
            }
            arfs_entity_name_validators_1.assertValidArFSDriveName(newName);
            const driveMetadataTxDataStub = yield arfs_tx_data_types_1.ArFSPrivateDriveTransactionData.from(newName, drive.rootFolderId, driveKey);
            const reward = yield this.estimateAndAssertCostOfDriveRename(driveMetadataTxDataStub);
            const metadataRewardSettings = { feeMultiple: this.feeMultiple, reward: reward.metaDataBaseReward };
            const result = yield this.arFsDao.renamePrivateDrive({
                drive,
                newName,
                metadataRewardSettings,
                driveKey
            });
            return {
                created: [
                    {
                        type: 'drive',
                        entityId: result.entityId,
                        key: driveKey,
                        metadataTxId: result.metaDataTxId,
                        entityName: newName
                    }
                ],
                tips: [],
                fees: { [`${result.metaDataTxId}`]: result.metaDataTxReward }
            };
        });
    }
    downloadPrivateFolder({ folderId, destFolderPath, customFolderName, maxDepth, driveKey, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getDriveOwnerForFolderId(folderId);
            }
            return this.arFsDao.downloadPrivateFolder({
                folderId,
                destFolderPath,
                customFolderName,
                maxDepth,
                driveKey,
                owner
            });
        });
    }
    downloadPrivateDrive({ driveId, destFolderPath, customFolderName, maxDepth, driveKey, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getOwnerForDriveId(driveId);
            }
            const drive = yield this.arFsDao.getPrivateDrive(driveId, driveKey, owner);
            const downloadFolderArgs = {
                folderId: drive.rootFolderId,
                destFolderPath,
                customFolderName,
                maxDepth,
                driveKey,
                owner
            };
            return this.arFsDao.downloadPrivateFolder(downloadFolderArgs);
        });
    }
}
exports.ArDrive = ArDrive;

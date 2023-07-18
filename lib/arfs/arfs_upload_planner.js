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
exports.ArFSUploadPlanner = void 0;
const parser_1 = require("arbundles/src/parser");
const types_1 = require("../types");
const constants_1 = require("../utils/constants");
const uuid_1 = require("uuid");
const estimation_prototypes_1 = require("../pricing/estimation_prototypes");
const bundle_packer_1 = require("../utils/bundle_packer");
const tag_assembler_1 = require("./tags/tag_assembler");
/** Utility class for planning an upload into an UploadPlan */
class ArFSUploadPlanner {
    constructor({ shouldBundle = true, arFSTagSettings, bundlePacker = () => new bundle_packer_1.LowestIndexBundlePacker(constants_1.MAX_BUNDLE_SIZE, constants_1.MAX_DATA_ITEM_LIMIT) }) {
        this.shouldBundle = shouldBundle;
        this.arFSTagSettings = arFSTagSettings;
        this.bundlePacker = bundlePacker;
        this.tagAssembler = new tag_assembler_1.ArFSTagAssembler(arFSTagSettings);
    }
    /**
     * Plans a file as a bundle to upload or v2 transaction to upload
     *
     * @remarks Uses the presence of a driveKey to determine privacy
     * @remarks Uses the `shouldBundle` class setting to determine whether to bundle
     * @remarks Files over the max bundle size limit will not be bundled, but their
     * 	meta data will be bundled if there will be multiple entities uploaded
     */
    planFile(uploadStats, bundlePacker) {
        return __awaiter(this, void 0, void 0, function* () {
            const { wrappedEntity: wrappedFile, isBulkUpload, driveKey } = uploadStats;
            const isPrivate = driveKey !== undefined;
            const { fileDataByteCount, fileMetaDataPrototype } = yield estimation_prototypes_1.getFileEstimationInfo(wrappedFile, isPrivate);
            const fileDataItemByteCount = byteCountAsDataItem(fileDataByteCount, this.arFSTagSettings.getFileDataItemTags(isPrivate, wrappedFile.contentType));
            const metaDataByteCountAsDataItem = byteCountAsDataItem(fileMetaDataPrototype.objectData.sizeOf(), this.tagAssembler.assembleArFSMetaDataGqlTags({ arFSPrototype: fileMetaDataPrototype }));
            const totalByteCountOfFileDataItems = fileDataItemByteCount.plus(metaDataByteCountAsDataItem);
            if (!this.shouldBundle ||
                !bundlePacker.canPackDataItemsWithByteCounts([fileDataItemByteCount, metaDataByteCountAsDataItem])) {
                if (isBulkUpload && this.shouldBundle) {
                    // This metadata can be packed with another bundle since other entities will be uploaded
                    // We will preserve the bundle index in this case because the metadata cannot be separated
                    // from the file data until ArFSDAO has generated a TxID from signing the transaction
                    const metaDataBundleIndex = bundlePacker.packIntoBundle({
                        byteCountAsDataItems: metaDataByteCountAsDataItem,
                        numberOfDataItems: 1
                    });
                    bundlePacker.addV2FileDataOnlyPlan({ fileDataByteCount, metaDataBundleIndex, uploadStats });
                }
                else {
                    // Otherwise we must send the metadata as a v2 tx because there will be nothing to bundle it with
                    bundlePacker.addV2FileAndMetaDataPlan({
                        fileDataByteCount,
                        metaDataByteCount: fileMetaDataPrototype.objectData.sizeOf(),
                        uploadStats
                    });
                }
            }
            else {
                // Otherwise we will always pack the metadata tx and data tx in the same bundle
                bundlePacker.packIntoBundle({
                    byteCountAsDataItems: totalByteCountOfFileDataItems,
                    numberOfDataItems: 2,
                    uploadStats
                });
            }
        });
    }
    /**
     * Flattens a recursive folder and packs all entities within the
     * folder them into bundles to upload or v2 transactions to upload
     *
     * @remarks Uses the presence of a driveKey to determine privacy
     * @remarks Uses the `shouldBundle` class setting to determine whether to bundle
     */
    planFolder(uploadStats, bundlePacker) {
        return __awaiter(this, void 0, void 0, function* () {
            const { wrappedEntity: wrappedFolder, driveKey } = uploadStats;
            const isPrivate = driveKey !== undefined;
            const { folderMetaDataPrototype } = yield estimation_prototypes_1.getFolderEstimationInfo(wrappedFolder, isPrivate);
            if (!wrappedFolder.existingId) {
                // We will only create a new folder here if there is no existing folder on chain
                if (this.shouldBundle) {
                    const folderByteCountAsDataItem = byteCountAsDataItem(folderMetaDataPrototype.objectData.sizeOf(), this.tagAssembler.assembleArFSMetaDataGqlTags({ arFSPrototype: folderMetaDataPrototype }));
                    bundlePacker.packIntoBundle({
                        uploadStats,
                        byteCountAsDataItems: folderByteCountAsDataItem,
                        numberOfDataItems: 1
                    });
                }
                else {
                    bundlePacker.addV2FolderMetaDataPlan({
                        uploadStats,
                        metaDataByteCount: folderMetaDataPrototype.objectData.sizeOf()
                    });
                }
                // Folder IDs must be established at this point so generate new ones for any folders
                // that don't appear to exist on chain yet. This is to prevent the parent to child
                // folder relationship from being lost during this flattening of the folder tree
                wrappedFolder.existingId = types_1.EID(uuid_1.v4());
            }
            const partialPlanParams = Object.assign(Object.assign({}, uploadStats), { destFolderId: wrappedFolder.existingId });
            // Plan each file within the folder
            for (const file of wrappedFolder.files) {
                yield this.planFile(Object.assign(Object.assign({}, partialPlanParams), { wrappedEntity: file }), bundlePacker);
            }
            // Recurse into each folder, flattening each folder into plans
            for (const folder of wrappedFolder.folders) {
                yield this.planFolder(Object.assign(Object.assign({}, partialPlanParams), { wrappedEntity: folder }), bundlePacker);
            }
        });
    }
    /**
     *  Plans an upload using the `uploadAllEntities` ArDrive method
     *  into bundles or v2 transactions and estimates the total winston cost
     */
    planUploadAllEntities(uploadStats) {
        return __awaiter(this, void 0, void 0, function* () {
            if (uploadStats.length === 0) {
                return {
                    bundlePlans: [],
                    v2TxPlans: { fileAndMetaDataPlans: [], fileDataOnlyPlans: [], folderMetaDataPlans: [] }
                };
            }
            const isBulkUpload = (() => {
                if (uploadStats.length > 1) {
                    return true;
                }
                const { wrappedEntity } = uploadStats[0];
                if (wrappedEntity.entityType === 'folder') {
                    if (wrappedEntity.files.length > 0) {
                        return true;
                    }
                    if (wrappedEntity.folders.length > 0) {
                        return true;
                    }
                }
                return false;
            })();
            const bundlePacker = this.bundlePacker();
            for (const uploadStat of uploadStats) {
                const { wrappedEntity } = uploadStat;
                if (wrappedEntity.entityType === 'folder') {
                    yield this.planFolder(Object.assign(Object.assign({}, uploadStat), { wrappedEntity, isBulkUpload }), bundlePacker);
                }
                else {
                    yield this.planFile(Object.assign(Object.assign({}, uploadStat), { wrappedEntity, isBulkUpload }), bundlePacker);
                }
            }
            const bundlePlans = [];
            for (const { uploadStats, totalDataItems, totalSize } of bundlePacker.bundles) {
                if (totalDataItems === 1) {
                    // Edge case: Do not send up a bundle containing a single data item
                    const { wrappedEntity, driveKey } = uploadStats[0];
                    if (wrappedEntity.entityType === 'file') {
                        throw new Error('Invalid bundle plan, files cannot be separated from their metadata!');
                    }
                    const { folderMetaDataPrototype } = yield estimation_prototypes_1.getFolderEstimationInfo(wrappedEntity, driveKey !== undefined);
                    // Unpack this bundle into the v2TxsToUpload
                    bundlePacker.addV2FolderMetaDataPlan({
                        uploadStats: Object.assign(Object.assign({}, uploadStats[0]), { wrappedEntity }),
                        metaDataByteCount: folderMetaDataPrototype.objectData.sizeOf()
                    });
                    continue;
                }
                const bundledByteCount = bundledByteCountOfBundleToPack(totalSize, totalDataItems);
                bundlePlans.push({
                    uploadStats: uploadStats,
                    totalByteCount: bundledByteCount
                });
            }
            return { v2TxPlans: bundlePacker.v2TxPlans, bundlePlans };
        });
    }
    planBundledCreateDrive({ driveMetaDataPrototype, rootFolderMetaDataPrototype }) {
        const driveDataItemByteCount = byteCountAsDataItem(driveMetaDataPrototype.objectData.sizeOf(), this.tagAssembler.assembleArFSMetaDataGqlTags({ arFSPrototype: driveMetaDataPrototype }));
        const rootFolderDataItemByteCount = byteCountAsDataItem(rootFolderMetaDataPrototype.objectData.sizeOf(), this.tagAssembler.assembleArFSMetaDataGqlTags({ arFSPrototype: rootFolderMetaDataPrototype }));
        const totalDataItemByteCount = driveDataItemByteCount.plus(rootFolderDataItemByteCount);
        const totalBundledByteCount = bundledByteCountOfBundleToPack(totalDataItemByteCount, 2);
        return { totalBundledByteCount };
    }
    planV2CreateDrive({ driveMetaDataPrototype, rootFolderMetaDataPrototype }) {
        const driveByteCount = driveMetaDataPrototype.objectData.sizeOf();
        const rootFolderByteCount = rootFolderMetaDataPrototype.objectData.sizeOf();
        return { driveByteCount, rootFolderByteCount };
    }
    /** Plan the strategy and determine byteCounts of a create drive */
    planCreateDrive(arFSPrototypes) {
        if (this.shouldBundle) {
            return this.planBundledCreateDrive(arFSPrototypes);
        }
        return this.planV2CreateDrive(arFSPrototypes);
    }
}
exports.ArFSUploadPlanner = ArFSUploadPlanner;
/** Calculate the total size  of provided ByteCount and GQL Tags as a DataItem */
function byteCountAsDataItem(dataSize, gqlTags) {
    // referenced from https://github.com/Bundlr-Network/arbundles/blob/master/src/ar-data-create.ts
    // We're not using the optional target and anchor fields, they will always be 1 byte
    const targetLength = 1;
    const anchorLength = 1;
    // Get byte length of tags after being serialized for avro schema
    const serializedTags = parser_1.serializeTags(gqlTags);
    const tagsLength = 16 + serializedTags.byteLength;
    const arweaveSignerLength = 512;
    const ownerLength = 512;
    const signatureTypeLength = 2;
    const dataLength = +dataSize;
    const totalByteLength = arweaveSignerLength + ownerLength + signatureTypeLength + targetLength + anchorLength + tagsLength + dataLength;
    return new types_1.ByteCount(totalByteLength);
}
/** Calculate the bundled size from the total dataItem byteCount and the number of dataItems */
function bundledByteCountOfBundleToPack(totalDataItemByteCount, numberOfDataItems) {
    // 32 byte array for representing the number of data items in the bundle
    const byteArraySize = 32;
    // Each data item gets a 64 byte header added to the bundle
    const headersSize = numberOfDataItems * 64;
    return new types_1.ByteCount(byteArraySize + +totalDataItemByteCount + headersSize);
}

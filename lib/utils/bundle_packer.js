"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LowestIndexBundlePacker = exports.BundlePacker = void 0;
const types_1 = require("../types");
class BundlePacker {
    constructor(maxBundleSize, maxDataItemLimit) {
        this.maxBundleSize = maxBundleSize;
        this.maxDataItemLimit = maxDataItemLimit;
        if (!Number.isFinite(maxDataItemLimit) || !Number.isInteger(maxDataItemLimit) || maxDataItemLimit < 2) {
            throw new Error('Maximum data item limit must be an integer value of 2 or more!');
        }
    }
}
exports.BundlePacker = BundlePacker;
/**
 * Pack into lowest index bundle with available size and remaining data items
 *
 * Returns the BundleIndex for use in edge case where FileData is above MAX_BUNDLE_SIZE
 * but the fileMetaData will still be sent up with a bundle
 */
class LowestIndexBundlePacker extends BundlePacker {
    constructor() {
        super(...arguments);
        this.plannedBundles = [];
        this.plannedV2Txs = { fileAndMetaDataPlans: [], fileDataOnlyPlans: [], folderMetaDataPlans: [] };
    }
    get bundles() {
        return this.plannedBundles;
    }
    get v2TxPlans() {
        return this.plannedV2Txs;
    }
    packIntoBundle(dataItemPlan) {
        const { byteCountAsDataItems, numberOfDataItems } = dataItemPlan;
        for (let index = 0; index < this.bundles.length; index++) {
            const bundle = this.bundles[index];
            // Pack into lowest index bundle that has enough remaining size and data items
            if (bundle.remainingSize.isGreaterThanOrEqualTo(byteCountAsDataItems) &&
                numberOfDataItems <= bundle.remainingDataItems) {
                bundle.addToBundle(dataItemPlan);
                return index;
            }
        }
        // Otherwise we pack into a new bundle
        this.bundles.push(new PlannedBundle(dataItemPlan, this.maxBundleSize, this.maxDataItemLimit));
        return this.bundles.length - 1;
    }
    canPackDataItemsWithByteCounts(byteCounts) {
        if (byteCounts.reduce((a, b) => a.plus(b)).isGreaterThan(this.maxBundleSize)) {
            return false;
        }
        if (byteCounts.length > this.maxDataItemLimit) {
            return false;
        }
        return true;
    }
    addV2FileAndMetaDataPlan(fileAndMetaDataPlan) {
        this.v2TxPlans.fileAndMetaDataPlans.push(fileAndMetaDataPlan);
    }
    addV2FileDataOnlyPlan(fileDataOnlyPlan) {
        this.v2TxPlans.fileDataOnlyPlans.push(fileDataOnlyPlan);
    }
    addV2FolderMetaDataPlan(folderMetaDataPlan) {
        this.v2TxPlans.folderMetaDataPlans.push(folderMetaDataPlan);
    }
}
exports.LowestIndexBundlePacker = LowestIndexBundlePacker;
class PlannedBundle {
    constructor(initialDataItemPlan, maxBundleSize, maxDataItemLimit) {
        this.maxBundleSize = maxBundleSize;
        this.maxDataItemLimit = maxDataItemLimit;
        this.uploadStatsInBundle = [];
        this.totalSizeOfBundle = new types_1.ByteCount(0);
        this.totalDataItemsInBundle = 0;
        this.addToBundle(initialDataItemPlan);
    }
    get remainingSize() {
        return this.maxBundleSize.minus(this.totalSizeOfBundle);
    }
    get remainingDataItems() {
        return this.maxDataItemLimit - this.totalDataItemsInBundle;
    }
    get uploadStats() {
        return this.uploadStatsInBundle;
    }
    get totalSize() {
        return this.totalSizeOfBundle;
    }
    get totalDataItems() {
        return this.totalDataItemsInBundle;
    }
    addToBundle({ uploadStats, byteCountAsDataItems, numberOfDataItems }) {
        this.totalSizeOfBundle = this.totalSizeOfBundle.plus(byteCountAsDataItems);
        this.totalDataItemsInBundle += numberOfDataItems;
        // Metadata of over-sized file uploads can be added without an uploadStats
        if (uploadStats) {
            this.uploadStatsInBundle.push(uploadStats);
        }
    }
}

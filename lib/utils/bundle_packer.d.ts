import { ByteCount, UploadStats } from '../types';
import { V2FileAndMetaDataPlan, V2FileDataOnlyPlan, V2FolderMetaDataPlan, V2TxPlans } from '../types/upload_planner_types';
export declare type BundleIndex = number;
interface DataItemPlan {
    uploadStats?: UploadStats;
    byteCountAsDataItems: ByteCount;
    numberOfDataItems: number;
}
export declare abstract class BundlePacker {
    protected readonly maxBundleSize: ByteCount;
    protected readonly maxDataItemLimit: number;
    constructor(maxBundleSize: ByteCount, maxDataItemLimit: number);
    abstract readonly v2TxPlans: V2TxPlans;
    abstract readonly bundles: PlannedBundle[];
    abstract packIntoBundle(bundlePackParams: DataItemPlan): BundleIndex;
    abstract canPackDataItemsWithByteCounts(byteCounts: ByteCount[]): boolean;
    abstract addV2FileAndMetaDataPlan(fileAndMetaDataPlan: V2FileAndMetaDataPlan): void;
    abstract addV2FileDataOnlyPlan(fileDataOnlyPlan: V2FileDataOnlyPlan): void;
    abstract addV2FolderMetaDataPlan(folderMetaDataPlan: V2FolderMetaDataPlan): void;
}
/**
 * Pack into lowest index bundle with available size and remaining data items
 *
 * Returns the BundleIndex for use in edge case where FileData is above MAX_BUNDLE_SIZE
 * but the fileMetaData will still be sent up with a bundle
 */
export declare class LowestIndexBundlePacker extends BundlePacker {
    protected plannedBundles: PlannedBundle[];
    protected plannedV2Txs: V2TxPlans;
    get bundles(): PlannedBundle[];
    get v2TxPlans(): V2TxPlans;
    packIntoBundle(dataItemPlan: DataItemPlan): BundleIndex;
    canPackDataItemsWithByteCounts(byteCounts: ByteCount[]): boolean;
    addV2FileAndMetaDataPlan(fileAndMetaDataPlan: V2FileAndMetaDataPlan): void;
    addV2FileDataOnlyPlan(fileDataOnlyPlan: V2FileDataOnlyPlan): void;
    addV2FolderMetaDataPlan(folderMetaDataPlan: V2FolderMetaDataPlan): void;
}
declare class PlannedBundle {
    private readonly maxBundleSize;
    private readonly maxDataItemLimit;
    protected uploadStatsInBundle: UploadStats[];
    protected totalSizeOfBundle: ByteCount;
    protected totalDataItemsInBundle: number;
    get remainingSize(): ByteCount;
    get remainingDataItems(): number;
    get uploadStats(): UploadStats<import("../exports").ArFSDataToUpload | import("../exports").ArFSFolderToUpload>[];
    get totalSize(): ByteCount;
    get totalDataItems(): number;
    constructor(initialDataItemPlan: DataItemPlan, maxBundleSize: ByteCount, maxDataItemLimit: number);
    addToBundle({ uploadStats, byteCountAsDataItems, numberOfDataItems }: DataItemPlan): void;
}
export {};

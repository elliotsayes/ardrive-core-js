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
exports.ArFSCostCalculator = void 0;
const types_1 = require("../types");
const upload_planner_types_1 = require("../types/upload_planner_types");
/** A utility class for calculating the cost of an ArFS write action */
class ArFSCostCalculator {
    constructor({ priceEstimator, feeMultiple, communityOracle }) {
        this.priceEstimator = priceEstimator;
        this.feeMultiple = feeMultiple;
        this.communityOracle = communityOracle;
    }
    /** Constructs reward settings with the feeMultiple from the cost calculator */
    rewardSettingsForWinston(reward) {
        return { reward, feeMultiple: this.feeMultiple };
    }
    /** Returns a reward boosted by the feeMultiple from the cost calculator */
    boostedReward(reward) {
        return this.feeMultiple.boostedWinstonReward(reward);
    }
    /** Calculates bundleRewardSettings and communityTipSettings for a planned bundle */
    calculateCostsForBundlePlan({ totalByteCount, uploadStats }) {
        return __awaiter(this, void 0, void 0, function* () {
            let totalPriceOfBundle = types_1.W(0);
            const winstonPriceOfBundle = yield this.priceEstimator.getBaseWinstonPriceForByteCount(totalByteCount);
            totalPriceOfBundle = totalPriceOfBundle.plus(this.boostedReward(winstonPriceOfBundle));
            const bundleRewardSettings = this.rewardSettingsForWinston(winstonPriceOfBundle);
            let communityTipSettings = undefined;
            // For now, we only add a community tip if there are files present within the bundle
            const hasFileData = uploadStats.find((u) => u.wrappedEntity.entityType === 'file');
            if (hasFileData) {
                const communityWinstonTip = yield this.communityOracle.getCommunityWinstonTip(winstonPriceOfBundle);
                const communityTipTarget = yield this.communityOracle.selectTokenHolder();
                totalPriceOfBundle = totalPriceOfBundle.plus(communityWinstonTip);
                communityTipSettings = { communityTipTarget, communityWinstonTip };
            }
            return {
                calculatedBundlePlan: {
                    uploadStats,
                    bundleRewardSettings,
                    communityTipSettings,
                    metaDataDataItems: []
                },
                totalPriceOfBundle
            };
        });
    }
    /** Calculates fileDataRewardSettings, metaDataRewardSettings, and communityTipSettings for a planned file and meta data v2 tx */
    calculateCostsForV2FileAndMetaData({ fileDataByteCount, metaDataByteCount, uploadStats }) {
        return __awaiter(this, void 0, void 0, function* () {
            const winstonPriceOfDataTx = yield this.priceEstimator.getBaseWinstonPriceForByteCount(fileDataByteCount);
            const winstonPriceOfMetaDataTx = yield this.priceEstimator.getBaseWinstonPriceForByteCount(metaDataByteCount);
            const communityTipTarget = yield this.communityOracle.selectTokenHolder();
            const communityWinstonTip = yield this.communityOracle.getCommunityWinstonTip(winstonPriceOfDataTx);
            const totalPriceOfV2Tx = this.boostedReward(winstonPriceOfDataTx)
                .plus(this.boostedReward(winstonPriceOfMetaDataTx))
                .plus(communityWinstonTip);
            return {
                calculatedFileAndMetaDataPlan: {
                    uploadStats,
                    communityTipSettings: { communityTipTarget, communityWinstonTip },
                    dataTxRewardSettings: this.rewardSettingsForWinston(winstonPriceOfDataTx),
                    metaDataRewardSettings: this.rewardSettingsForWinston(winstonPriceOfMetaDataTx)
                },
                totalPriceOfV2Tx
            };
        });
    }
    /** Calculates fileDataRewardSettings and communityTipSettings for a planned file data only v2 tx */
    calculateCostsForV2FileDataOnly({ fileDataByteCount, metaDataBundleIndex, uploadStats }) {
        return __awaiter(this, void 0, void 0, function* () {
            const winstonPriceOfDataTx = yield this.priceEstimator.getBaseWinstonPriceForByteCount(fileDataByteCount);
            const communityTipTarget = yield this.communityOracle.selectTokenHolder();
            const communityWinstonTip = yield this.communityOracle.getCommunityWinstonTip(winstonPriceOfDataTx);
            const totalPriceOfV2Tx = this.boostedReward(winstonPriceOfDataTx).plus(communityWinstonTip);
            return {
                calculatedFileDataOnlyPlan: {
                    uploadStats,
                    communityTipSettings: { communityTipTarget, communityWinstonTip },
                    dataTxRewardSettings: this.rewardSettingsForWinston(winstonPriceOfDataTx),
                    metaDataBundleIndex
                },
                totalPriceOfV2Tx
            };
        });
    }
    /** Calculates fileDataRewardSettings and communityTipSettings for a planned folder metadata v2 tx */
    // prettier-ignore
    calculateCostsForV2FolderMetaData({ metaDataByteCount, uploadStats }) {
        return __awaiter(this, void 0, void 0, function* () {
            const winstonPriceOfMetaDataTx = yield this.priceEstimator.getBaseWinstonPriceForByteCount(metaDataByteCount);
            const totalPriceOfV2Tx = this.boostedReward(winstonPriceOfMetaDataTx);
            return {
                calculatedFolderMetaDataPlan: {
                    uploadStats,
                    metaDataRewardSettings: this.rewardSettingsForWinston(winstonPriceOfMetaDataTx)
                },
                totalPriceOfV2Tx
            };
        });
    }
    calculateCostsForUploadPlan({ bundlePlans, v2TxPlans }) {
        return __awaiter(this, void 0, void 0, function* () {
            let totalWinstonPrice = types_1.W(0);
            const calculatedBundlePlans = [];
            const calculatedV2TxPlans = {
                fileAndMetaDataPlans: [],
                fileDataOnlyPlans: [],
                folderMetaDataPlans: []
            };
            for (const plan of bundlePlans) {
                const { calculatedBundlePlan, totalPriceOfBundle } = yield this.calculateCostsForBundlePlan(plan);
                totalWinstonPrice = totalWinstonPrice.plus(totalPriceOfBundle);
                calculatedBundlePlans.push(calculatedBundlePlan);
            }
            for (const plan of v2TxPlans.fileAndMetaDataPlans) {
                const { calculatedFileAndMetaDataPlan, totalPriceOfV2Tx } = yield this.calculateCostsForV2FileAndMetaData(plan);
                totalWinstonPrice = totalWinstonPrice.plus(totalPriceOfV2Tx);
                calculatedV2TxPlans.fileAndMetaDataPlans.push(calculatedFileAndMetaDataPlan);
            }
            for (const plan of v2TxPlans.fileDataOnlyPlans) {
                const { calculatedFileDataOnlyPlan, totalPriceOfV2Tx } = yield this.calculateCostsForV2FileDataOnly(plan);
                totalWinstonPrice = totalWinstonPrice.plus(totalPriceOfV2Tx);
                calculatedV2TxPlans.fileDataOnlyPlans.push(calculatedFileDataOnlyPlan);
            }
            for (const plan of v2TxPlans.folderMetaDataPlans) {
                const { calculatedFolderMetaDataPlan, totalPriceOfV2Tx } = yield this.calculateCostsForV2FolderMetaData(plan);
                totalWinstonPrice = totalWinstonPrice.plus(totalPriceOfV2Tx);
                calculatedV2TxPlans.folderMetaDataPlans.push(calculatedFolderMetaDataPlan);
            }
            return {
                calculatedUploadPlan: { bundlePlans: calculatedBundlePlans, v2TxPlans: calculatedV2TxPlans },
                totalWinstonPrice
            };
        });
    }
    calculateV2CreateDriveCost({ driveByteCount, rootFolderByteCount }) {
        return __awaiter(this, void 0, void 0, function* () {
            const driveReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(driveByteCount);
            const rootFolderReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(rootFolderByteCount);
            const totalWinstonPrice = this.boostedReward(driveReward).plus(this.boostedReward(rootFolderReward));
            const rewardSettings = {
                driveRewardSettings: this.rewardSettingsForWinston(driveReward),
                rootFolderRewardSettings: this.rewardSettingsForWinston(rootFolderReward)
            };
            return { rewardSettings, totalWinstonPrice };
        });
    }
    calculateBundledCreateDriveCost({ totalBundledByteCount }) {
        return __awaiter(this, void 0, void 0, function* () {
            const bundleReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(totalBundledByteCount);
            const totalWinstonPrice = this.boostedReward(bundleReward);
            const rewardSettings = {
                bundleRewardSettings: this.rewardSettingsForWinston(bundleReward)
            };
            return { rewardSettings, totalWinstonPrice };
        });
    }
    calculateCostForCreateDrive(createDrivePlan) {
        return __awaiter(this, void 0, void 0, function* () {
            if (upload_planner_types_1.isBundlePlan(createDrivePlan)) {
                return this.calculateBundledCreateDriveCost(createDrivePlan);
            }
            return this.calculateV2CreateDriveCost(createDrivePlan);
        });
    }
    calculateCostForV2MetaDataUpload(metaDataByteCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const metaDataReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(metaDataByteCount);
            return {
                metaDataRewardSettings: this.rewardSettingsForWinston(metaDataReward),
                totalWinstonPrice: this.boostedReward(metaDataReward)
            };
        });
    }
}
exports.ArFSCostCalculator = ArFSCostCalculator;

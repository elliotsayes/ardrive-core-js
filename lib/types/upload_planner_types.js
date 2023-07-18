"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyV2TxPlans = exports.isBundleRewardSetting = exports.isBundlePlan = void 0;
function isBundlePlan(plan) {
    return Object.keys(plan).includes('totalBundledByteCount');
}
exports.isBundlePlan = isBundlePlan;
function isBundleRewardSetting(rewardSettings) {
    return Object.keys(rewardSettings).includes('bundleRewardSettings');
}
exports.isBundleRewardSetting = isBundleRewardSetting;
exports.emptyV2TxPlans = { fileAndMetaDataPlans: [], fileDataOnlyPlans: [], folderMetaDataPlans: [] };

import { CommunityOracle } from '../community/community_oracle';
import { ARDataPriceEstimator } from '../pricing/ar_data_price_estimator';
import { FeeMultiple, Winston, RewardSettings, ByteCount } from '../types';
import { UploadPlan, CalculatedUploadPlan, CreateDrivePlan, CalculatedCreateDrivePlan, CalculatedV2MetaDataUploadPlan } from '../types/upload_planner_types';
export interface CostCalculator {
    calculateCostsForUploadPlan({ bundlePlans, v2TxPlans }: UploadPlan): Promise<{
        calculatedUploadPlan: CalculatedUploadPlan;
        totalWinstonPrice: Winston;
    }>;
    calculateCostForCreateDrive(createDrivePlan: CreateDrivePlan): Promise<CalculatedCreateDrivePlan>;
    calculateCostForV2MetaDataUpload(metaDataByteCount: ByteCount): Promise<{
        metaDataRewardSettings: RewardSettings;
        totalWinstonPrice: Winston;
    }>;
}
interface ArFSCostCalculatorConstructorParams {
    priceEstimator: ARDataPriceEstimator;
    communityOracle: CommunityOracle;
    feeMultiple: FeeMultiple;
}
/** A utility class for calculating the cost of an ArFS write action */
export declare class ArFSCostCalculator implements CostCalculator {
    private readonly priceEstimator;
    private readonly communityOracle;
    private readonly feeMultiple;
    constructor({ priceEstimator, feeMultiple, communityOracle }: ArFSCostCalculatorConstructorParams);
    /** Constructs reward settings with the feeMultiple from the cost calculator */
    private rewardSettingsForWinston;
    /** Returns a reward boosted by the feeMultiple from the cost calculator */
    private boostedReward;
    /** Calculates bundleRewardSettings and communityTipSettings for a planned bundle */
    private calculateCostsForBundlePlan;
    /** Calculates fileDataRewardSettings, metaDataRewardSettings, and communityTipSettings for a planned file and meta data v2 tx */
    private calculateCostsForV2FileAndMetaData;
    /** Calculates fileDataRewardSettings and communityTipSettings for a planned file data only v2 tx */
    private calculateCostsForV2FileDataOnly;
    /** Calculates fileDataRewardSettings and communityTipSettings for a planned folder metadata v2 tx */
    private calculateCostsForV2FolderMetaData;
    calculateCostsForUploadPlan({ bundlePlans, v2TxPlans }: UploadPlan): Promise<{
        calculatedUploadPlan: CalculatedUploadPlan;
        totalWinstonPrice: Winston;
    }>;
    private calculateV2CreateDriveCost;
    private calculateBundledCreateDriveCost;
    calculateCostForCreateDrive(createDrivePlan: CreateDrivePlan): Promise<CalculatedCreateDrivePlan>;
    calculateCostForV2MetaDataUpload(metaDataByteCount: ByteCount): Promise<CalculatedV2MetaDataUploadPlan>;
}
export {};

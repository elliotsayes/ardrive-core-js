import { FeeMultiple, UploadStats } from '../types';
import { ArFSUploadPlannerConstructorParams, EstimateCreateDriveParams, CreateDrivePlan, UploadPlan } from '../types/upload_planner_types';
import { CommunityOracle } from '../community/community_oracle';
import { ARDataPriceEstimator } from '../pricing/ar_data_price_estimator';
export interface UploadPlanner {
    planUploadAllEntities(uploadStats: UploadStats[]): Promise<UploadPlan>;
    planCreateDrive(arFSPrototypes: EstimateCreateDriveParams): CreateDrivePlan;
}
/** Utility class for planning an upload into an UploadPlan */
export declare class ArFSUploadPlanner implements UploadPlanner {
    private readonly shouldBundle;
    private readonly arFSTagSettings;
    private readonly bundlePacker;
    private readonly tagAssembler;
    /** @deprecated No longer used in the Planner, moved to ArFSCostCalculator */
    protected readonly feeMultiple?: FeeMultiple;
    /** @deprecated No longer used in the Planner, moved to ArFSCostCalculator */
    protected readonly priceEstimator?: ARDataPriceEstimator;
    /** @deprecated No longer used in the Planner, moved to ArFSCostCalculator */
    protected readonly communityOracle?: CommunityOracle;
    constructor({ shouldBundle, arFSTagSettings, bundlePacker }: ArFSUploadPlannerConstructorParams);
    /**
     * Plans a file as a bundle to upload or v2 transaction to upload
     *
     * @remarks Uses the presence of a driveKey to determine privacy
     * @remarks Uses the `shouldBundle` class setting to determine whether to bundle
     * @remarks Files over the max bundle size limit will not be bundled, but their
     * 	meta data will be bundled if there will be multiple entities uploaded
     */
    private planFile;
    /**
     * Flattens a recursive folder and packs all entities within the
     * folder them into bundles to upload or v2 transactions to upload
     *
     * @remarks Uses the presence of a driveKey to determine privacy
     * @remarks Uses the `shouldBundle` class setting to determine whether to bundle
     */
    private planFolder;
    /**
     *  Plans an upload using the `uploadAllEntities` ArDrive method
     *  into bundles or v2 transactions and estimates the total winston cost
     */
    planUploadAllEntities(uploadStats: UploadStats[]): Promise<UploadPlan>;
    private planBundledCreateDrive;
    private planV2CreateDrive;
    /** Plan the strategy and determine byteCounts of a create drive */
    planCreateDrive(arFSPrototypes: EstimateCreateDriveParams): CreateDrivePlan;
}

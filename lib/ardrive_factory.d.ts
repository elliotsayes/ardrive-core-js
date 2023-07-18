import { Wallet } from './wallet';
import Arweave from 'arweave';
import { ArFSDAO } from './arfs/arfsdao';
import { ARDataPriceEstimator } from './pricing/ar_data_price_estimator';
import { CommunityOracle } from './community/community_oracle';
import { ArDrive } from './ardrive';
import { ArDriveAnonymous } from './ardrive_anonymous';
import { FeeMultiple } from './types';
import { WalletDAO } from './wallet_dao';
import { UploadPlanner } from './arfs/arfs_upload_planner';
import { ArFSTagSettings } from './arfs/arfs_tag_settings';
import { CostCalculator } from './arfs/arfs_cost_calculator';
export interface ArDriveSettingsAnonymous {
    arweave?: Arweave;
    /** @deprecated App Version is an unused parameter on anonymous ArDrive and will be removed in a future release */
    appVersion?: string;
    /** @deprecated App Name is an unused parameter on anonymous ArDrive and will be removed in a future release */
    appName?: string;
}
export interface ArDriveSettings extends ArDriveSettingsAnonymous {
    /** @deprecated App Version will be removed in a future release. Use ArFSTagSettings instead */
    appVersion?: string;
    /** @deprecated App Name will be removed in a future release. Use ArFSTagSettings instead */
    appName?: string;
    wallet: Wallet;
    walletDao?: WalletDAO;
    priceEstimator?: ARDataPriceEstimator;
    communityOracle?: CommunityOracle;
    feeMultiple?: FeeMultiple;
    dryRun?: boolean;
    arfsDao?: ArFSDAO;
    shouldBundle?: boolean;
    uploadPlanner?: UploadPlanner;
    costCalculator?: CostCalculator;
    arFSTagSettings?: ArFSTagSettings;
}
export declare function arDriveFactory({ wallet, arweave, priceEstimator, communityOracle, dryRun, feeMultiple, appName, appVersion, walletDao, shouldBundle, arFSTagSettings, uploadPlanner, costCalculator, arfsDao }: ArDriveSettings): ArDrive;
export declare function arDriveAnonymousFactory({ arweave }: ArDriveSettingsAnonymous): ArDriveAnonymous;

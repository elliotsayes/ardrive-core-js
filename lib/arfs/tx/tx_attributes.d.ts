import { CreateTransactionInterface } from 'arweave/node/common';
import { CommunityTipSettings, RewardSettings } from '../../types';
declare type TxAttributes = Partial<CreateTransactionInterface>;
export declare class TxAttributesToAssemble {
    private readonly txAttributes;
    constructor(txAttributes?: TxAttributes);
    addRewardSettings({ feeMultiple, reward }: RewardSettings): void;
    addCommunityTipSettings(communityTipSettings: CommunityTipSettings | undefined): void;
    assemble(): TxAttributes;
}
export {};

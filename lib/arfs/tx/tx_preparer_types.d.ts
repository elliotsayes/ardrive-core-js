/// <reference types="node" />
import { DataItem } from 'arbundles';
import Arweave from 'arweave';
import { CommunityTipSettings, RewardSettings, GQLTagInterface } from '../../exports';
import { JWKWallet } from '../../jwk_wallet';
import { ArFSTagAssembler } from '../tags/tag_assembler';
import { ArFSObjectMetadataPrototype, ArFSFileDataPrototype, ArFSEntityMetaDataPrototype } from './arfs_prototypes';
export declare type ArFSPrepareDataItemsParams<T = ArFSObjectMetadataPrototype> = {
    objectMetaData: T;
};
export declare type ArFSPrepareFileDataItemParams = ArFSPrepareDataItemsParams<ArFSFileDataPrototype>;
export declare type ArFSPrepareMetaDataItemParams = ArFSPrepareDataItemsParams<ArFSEntityMetaDataPrototype>;
export declare type ArFSPrepareObjectBundleParams = {
    dataItems: DataItem[];
} & withRewardSettings & withCommunityTipSettings;
export declare type ArFSPrepareFileDataTxParams = ArFSPrepareDataItemsParams<ArFSFileDataPrototype> & withRewardSettings & withCommunityTipSettings;
export declare type ArFSPrepareMetaDataTxParams = ArFSPrepareDataItemsParams<ArFSEntityMetaDataPrototype> & withRewardSettings;
declare type withCommunityTipSettings = {
    communityTipSettings?: CommunityTipSettings;
};
declare type withRewardSettings = {
    rewardSettings: RewardSettings;
};
export declare type PrepareTxParams<T = string | Buffer> = {
    data: T;
    tags: GQLTagInterface[];
} & withCommunityTipSettings & withRewardSettings;
export interface TxPreparerParams {
    arweave: Arweave;
    wallet: JWKWallet;
    arFSTagAssembler: ArFSTagAssembler;
}
export {};

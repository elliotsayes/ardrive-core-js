import { DataItem } from 'arbundles';
import Transaction from 'arweave/node/lib/transaction';
import { TxPreparerParams, ArFSPrepareFileDataItemParams, ArFSPrepareMetaDataItemParams, ArFSPrepareObjectBundleParams, ArFSPrepareFileDataTxParams, ArFSPrepareMetaDataTxParams } from './tx_preparer_types';
export declare class TxPreparer {
    private readonly arweave;
    private readonly wallet;
    private readonly signer;
    private readonly tagAssembler;
    constructor({ arweave, wallet, arFSTagAssembler }: TxPreparerParams);
    prepareFileDataDataItem({ objectMetaData }: ArFSPrepareFileDataItemParams): Promise<DataItem>;
    prepareMetaDataDataItem({ objectMetaData }: ArFSPrepareMetaDataItemParams): Promise<DataItem>;
    private prepareAndSignDataItem;
    prepareBundleTx({ dataItems, communityTipSettings, rewardSettings }: ArFSPrepareObjectBundleParams): Promise<Transaction>;
    prepareFileDataTx({ objectMetaData, rewardSettings, communityTipSettings }: ArFSPrepareFileDataTxParams): Promise<Transaction>;
    prepareMetaDataTx({ objectMetaData, rewardSettings }: ArFSPrepareMetaDataTxParams): Promise<Transaction>;
    private prepareTx;
    private createAndSignTx;
}

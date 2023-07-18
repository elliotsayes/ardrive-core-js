import Arweave from 'arweave';
import { JWKWallet } from './jwk_wallet';
import { TransactionID, Winston, NetworkReward, SeedPhrase, ArweaveAddress, AR, RewardSettings, GQLTagInterface } from './types';
import { Wallet } from './wallet';
export declare type ARTransferResult = {
    txID: TransactionID;
    winston: Winston;
    reward: NetworkReward;
};
export declare class WalletDAO {
    private readonly arweave;
    private readonly appName;
    private readonly appVersion;
    constructor(arweave: Arweave, appName?: string, appVersion?: any);
    generateSeedPhrase(): Promise<SeedPhrase>;
    generateJWKWallet(seedPhrase: SeedPhrase): Promise<JWKWallet>;
    getWalletWinstonBalance(wallet: Wallet): Promise<Winston>;
    getAddressWinstonBalance(address: ArweaveAddress): Promise<Winston>;
    walletHasBalance(wallet: Wallet, winstonPrice: Winston): Promise<boolean>;
    sendARToAddress(arAmount: AR, fromWallet: Wallet, toAddress: ArweaveAddress, rewardSettings: RewardSettings, dryRun: boolean, [{ value: appName }, { value: appVersion }, { value: txType }, ...otherTags]: GQLTagInterface[], assertBalance?: boolean): Promise<ARTransferResult>;
}

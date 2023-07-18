import type { ArweaveOracle } from './arweave_oracle';
import { AbstractARDataPriceAndCapacityEstimator } from './ar_data_price_estimator';
import { AR, ByteCount, Winston, ArDriveCommunityTip } from '../types';
/**
 * A utility class for Arweave data pricing estimation.
 * Fetches Arweave pricing and caches results based on their chunk size
 */
export declare class ARDataPriceNetworkEstimator extends AbstractARDataPriceAndCapacityEstimator {
    private readonly oracle;
    private bytesToChunks;
    private cachedPricePerChunk;
    /**
     * Creates a new estimator.
     *
     * @param oracle a data source for Arweave data pricing
     */
    constructor(oracle?: ArweaveOracle);
    /**
     * Generates a price estimate, in Winston, for an upload of size `byteCount`.
     *
     * @param byteCount the number of bytes for which a price estimate should be generated
     *
     * @returns Promise for the price of an upload of size `byteCount` in Winston
     *
     * @remarks Will use cached price first for a given chunk size
     *
     */
    getBaseWinstonPriceForByteCount(byteCount: ByteCount): Promise<Winston>;
    /**
     * Estimates the number of bytes that can be stored for a given amount of Winston
     *
     * @remarks This method is meant to only be an estimation at this time, do not use to calculate real values!
     * @remarks The ArDrive community fee is not considered in this estimation
     */
    getByteCountForWinston(winston: Winston): Promise<ByteCount>;
    /**
     * Estimates the number of bytes that can be stored for a given amount of AR
     *
     * @remarks Returns 0 bytes when the price does not cover minimum ArDrive community fee
     */
    getByteCountForAR(arPrice: AR, { minWinstonFee, tipPercentage }: ArDriveCommunityTip): Promise<ByteCount>;
}

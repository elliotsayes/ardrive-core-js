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
exports.ARDataPriceNetworkEstimator = void 0;
const gateway_oracle_1 = require("./gateway_oracle");
const ar_data_price_estimator_1 = require("./ar_data_price_estimator");
const types_1 = require("../types");
const byteCountPerChunk = new types_1.ByteCount(Math.pow(2, 10) * 256); // 256 KiB
/**
 * A utility class for Arweave data pricing estimation.
 * Fetches Arweave pricing and caches results based on their chunk size
 */
class ARDataPriceNetworkEstimator extends ar_data_price_estimator_1.AbstractARDataPriceAndCapacityEstimator {
    /**
     * Creates a new estimator.
     *
     * @param oracle a data source for Arweave data pricing
     */
    constructor(oracle = new gateway_oracle_1.GatewayOracle()) {
        super();
        this.oracle = oracle;
        this.cachedPricePerChunk = {};
    }
    bytesToChunks(bytes) {
        return Math.ceil(+bytes / +byteCountPerChunk);
    }
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
    getBaseWinstonPriceForByteCount(byteCount) {
        return __awaiter(this, void 0, void 0, function* () {
            const chunks = this.bytesToChunks(byteCount);
            const cachedPrice = this.cachedPricePerChunk[`${chunks}`];
            if (cachedPrice) {
                return cachedPrice;
            }
            const winstonPricePromise = this.oracle.getWinstonPriceForByteCount(byteCount);
            this.cachedPricePerChunk[`${chunks}`] = winstonPricePromise;
            return winstonPricePromise;
        });
    }
    /**
     * Estimates the number of bytes that can be stored for a given amount of Winston
     *
     * @remarks This method is meant to only be an estimation at this time, do not use to calculate real values!
     * @remarks The ArDrive community fee is not considered in this estimation
     */
    getByteCountForWinston(winston) {
        return __awaiter(this, void 0, void 0, function* () {
            const baseWinstonPrice = yield this.getBaseWinstonPriceForByteCount(new types_1.ByteCount(0));
            const oneChunkWinstonPrice = yield this.getBaseWinstonPriceForByteCount(new types_1.ByteCount(1));
            if (winston.isGreaterThanOrEqualTo(oneChunkWinstonPrice)) {
                const perChunkEstCost = oneChunkWinstonPrice.minus(baseWinstonPrice);
                const estimatedChunks = Math.floor(+winston.minus(baseWinstonPrice).dividedBy(+perChunkEstCost, 'ROUND_DOWN'));
                return new types_1.ByteCount(estimatedChunks * +byteCountPerChunk);
            }
            // Return 0 if winston price given does not cover the base winston price for a 1 chunk transaction
            return new types_1.ByteCount(0);
        });
    }
    /**
     * Estimates the number of bytes that can be stored for a given amount of AR
     *
     * @remarks Returns 0 bytes when the price does not cover minimum ArDrive community fee
     */
    getByteCountForAR(arPrice, { minWinstonFee, tipPercentage }) {
        const _super = Object.create(null, {
            getByteCountForAR: { get: () => super.getByteCountForAR }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return _super.getByteCountForAR.call(this, arPrice, { minWinstonFee, tipPercentage });
        });
    }
}
exports.ARDataPriceNetworkEstimator = ARDataPriceNetworkEstimator;

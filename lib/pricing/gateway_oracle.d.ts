import type { ArweaveOracle } from './arweave_oracle';
import { ByteCount, Winston } from '../types';
export declare class GatewayOracle implements ArweaveOracle {
    private readonly gateway;
    constructor(gateway?: URL);
    getWinstonPriceForByteCount(byteCount: ByteCount): Promise<Winston>;
}

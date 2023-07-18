/// <reference types="node" />
import { TransactionID } from '../types';
export declare class ArFSMetadataCache {
    private static cacheFolderPromise?;
    private static shouldCacheLog;
    private static metadataCacheFolder;
    private static logTag;
    private static platformCacheFolder;
    static getCacheFolder(): Promise<string>;
    static put(txId: TransactionID, buffer: Buffer): Promise<void>;
    static get(txId: TransactionID): Promise<Buffer | undefined>;
}

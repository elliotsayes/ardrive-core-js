import Transaction from 'arweave/node/lib/transaction';
import { GatewayAPI } from '../utils/gateway_api';
export interface Chunk {
    chunk: string;
    data_root: string;
    data_size: string;
    offset: string;
    data_path: string;
}
export declare type ProgressCallback = (pctComplete: number) => void;
export interface MultiChunkTxUploaderConstructorParams {
    gatewayApi: GatewayAPI;
    transaction: Transaction;
    maxConcurrentChunks?: number;
    progressCallback?: ProgressCallback;
}
/**
 *  A transaction uploader class that has been modified to handle uploading
 *  the chunks of a transaction concurrently to the specified gateway url
 *
 * @example
 *
 *  ```ts
 * 	await transaction.prepareChunks(transaction.data);
 *
 *		const transactionUploader = new MultiChunkTxUploader({
 *			transaction,
 *			gatewayApi: new GatewayAPI({ gatewayUrl: new URL('https://arweave.net:443') })
 *		});
 *
 *		await transactionUploader.batchUploadChunks();
 * ```
 */
export declare class MultiChunkTxUploader {
    private chunkOffset;
    private txPosted;
    private uploadedChunks;
    private hasFailedRequests;
    get isComplete(): boolean;
    get totalChunks(): number;
    get pctComplete(): number;
    private gatewayApi;
    private transaction;
    private maxConcurrentChunks;
    private progressCallback?;
    constructor({ gatewayApi, transaction, maxConcurrentChunks, progressCallback }: MultiChunkTxUploaderConstructorParams);
    static resumeChunkUpload(params: MultiChunkTxUploaderConstructorParams): MultiChunkTxUploader;
    /**
     * Uploads a transaction and all of its chunks until the upload is complete or has failed
     *
     * TODO: Convert this to a stream to report back event triggered progress
     *
     * @throws when any requests have failed beyond the maxRetries setting
     */
    batchUploadChunks(): Promise<void>;
    /**
     * Iterates through and posts each chunk to the `/chunk` endpoint on the provided gateway
     *
     * @remarks Will continue posting chunks until all chunks have been posted
     * @remarks Reports progress if class was initialized with a `progressCallback`
     *
     * @throws when a chunk request has exceeded the maxRetries and has failed to post
     */
    private uploadChunk;
    /**
     * Posts the transaction's header to the `/tx` endpoint on the provided gateway
     *
     * @remarks Will post chunks with header if those chunks will fit into the transaction header's body
     *
     * @throws when a post header request has exceeded the maxRetries and has failed to post
     */
    private postTransactionHeader;
}

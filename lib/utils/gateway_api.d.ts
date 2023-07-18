/// <reference types="node" />
import Transaction from 'arweave/node/lib/transaction';
import { AxiosInstance, AxiosResponse } from 'axios';
import { Chunk } from '../arfs/multi_chunk_tx_uploader';
import { TransactionID } from '../types';
import { GQLTransactionsResultInterface } from '../types/gql_Types';
import { GQLQuery } from './query';
interface GatewayAPIConstParams {
    gatewayUrl: URL;
    maxRetriesPerRequest?: number;
    initialErrorDelayMS?: number;
    fatalErrors?: string[];
    validStatusCodes?: number[];
    axiosInstance?: AxiosInstance;
}
export declare class GatewayAPI {
    private gatewayUrl;
    private maxRetriesPerRequest;
    private initialErrorDelayMS;
    private fatalErrors;
    private validStatusCodes;
    private axiosInstance;
    constructor({ gatewayUrl, maxRetriesPerRequest, initialErrorDelayMS, fatalErrors, validStatusCodes, axiosInstance }: GatewayAPIConstParams);
    private lastError;
    private lastRespStatus;
    postChunk(chunk: Chunk): Promise<void>;
    postTxHeader(transaction: Transaction): Promise<void>;
    gqlRequest(query: GQLQuery): Promise<GQLTransactionsResultInterface>;
    postToEndpoint<T = unknown>(endpoint: string, data?: unknown): Promise<AxiosResponse<T>>;
    getTransaction(txId: TransactionID): Promise<Transaction>;
    /**
     * For fetching the Data JSON of a MetaData Tx
     *
     * @remarks Will use data from `ArFSMetadataCache` if it exists and will cache any fetched data
     * */
    getTxData(txId: TransactionID): Promise<Buffer>;
    /**
     * Retries the given request until the response returns a successful
     * status code or the maxRetries setting has been exceeded
     *
     * @throws when a fatal error has been returned by request
     * @throws when max retries have been exhausted
     */
    private retryRequestUntilMaxRetries;
    private tryRequest;
    private isRequestSuccessful;
    private throwIfFatalError;
    private exponentialBackOffAfterFailedRequest;
    private rateLimitThrottle;
}
export {};

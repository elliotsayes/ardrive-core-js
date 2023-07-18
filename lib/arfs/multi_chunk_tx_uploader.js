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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiChunkTxUploader = void 0;
const transaction_1 = __importDefault(require("arweave/node/lib/transaction"));
const constants_1 = require("../utils/constants");
/** Maximum amount of chunks we will upload in the transaction body */
const MAX_CHUNKS_IN_BODY = 1;
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
class MultiChunkTxUploader {
    constructor({ gatewayApi, transaction, maxConcurrentChunks = constants_1.defaultMaxConcurrentChunks, progressCallback }) {
        this.chunkOffset = 0;
        this.txPosted = false;
        this.uploadedChunks = 0;
        this.hasFailedRequests = false;
        if (!transaction.id) {
            throw new Error(`Transaction is not signed`);
        }
        if (!transaction.chunks) {
            throw new Error(`Transaction chunks not prepared`);
        }
        this.gatewayApi = gatewayApi;
        this.transaction = transaction;
        this.maxConcurrentChunks = maxConcurrentChunks;
        this.progressCallback = progressCallback;
    }
    get isComplete() {
        return this.txPosted && this.uploadedChunks === this.totalChunks;
    }
    get totalChunks() {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return this.transaction.chunks.chunks.length;
    }
    get pctComplete() {
        return Math.trunc((this.uploadedChunks / this.totalChunks) * 100);
    }
    static resumeChunkUpload(params) {
        const uploader = new MultiChunkTxUploader(params);
        uploader.txPosted = true;
        return uploader;
    }
    /**
     * Uploads a transaction and all of its chunks until the upload is complete or has failed
     *
     * TODO: Convert this to a stream to report back event triggered progress
     *
     * @throws when any requests have failed beyond the maxRetries setting
     */
    batchUploadChunks() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.hasFailedRequests) {
                throw new Error('Transaction upload has failed requests!');
            }
            if (!this.txPosted) {
                yield this.postTransactionHeader();
                if (this.isComplete) {
                    return;
                }
            }
            const numRemainingChunks = this.totalChunks - this.chunkOffset;
            const numOfConcurrentUploadPromises = Math.min(numRemainingChunks, this.maxConcurrentChunks);
            const uploadPromises = [];
            for (let index = 0; index < numOfConcurrentUploadPromises; index++) {
                uploadPromises.push(this.uploadChunk());
            }
            yield Promise.all(uploadPromises);
        });
    }
    /**
     * Iterates through and posts each chunk to the `/chunk` endpoint on the provided gateway
     *
     * @remarks Will continue posting chunks until all chunks have been posted
     * @remarks Reports progress if class was initialized with a `progressCallback`
     *
     * @throws when a chunk request has exceeded the maxRetries and has failed to post
     */
    uploadChunk() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            while (this.chunkOffset < this.totalChunks && !this.hasFailedRequests) {
                const chunk = this.transaction.getChunk(this.chunkOffset++, this.transaction.data);
                try {
                    yield this.gatewayApi.postChunk(chunk);
                }
                catch (err) {
                    this.hasFailedRequests = true;
                    throw new Error(`Too many errors encountered while posting chunks: ${err}`);
                }
                this.uploadedChunks++;
                (_a = this.progressCallback) === null || _a === void 0 ? void 0 : _a.call(this, this.pctComplete);
            }
            return;
        });
    }
    /**
     * Posts the transaction's header to the `/tx` endpoint on the provided gateway
     *
     * @remarks Will post chunks with header if those chunks will fit into the transaction header's body
     *
     * @throws when a post header request has exceeded the maxRetries and has failed to post
     */
    postTransactionHeader() {
        return __awaiter(this, void 0, void 0, function* () {
            const uploadInBody = this.totalChunks <= MAX_CHUNKS_IN_BODY;
            // We will send the data with the header if chunks will fit into transaction header body
            // Otherwise we send the header with no data
            const transactionToUpload = uploadInBody
                ? this.transaction
                : new transaction_1.default(Object.assign({}, this.transaction, { data: new Uint8Array(0) }));
            try {
                yield this.gatewayApi.postTxHeader(transactionToUpload);
            }
            catch (err) {
                this.hasFailedRequests = true;
                throw new Error(`Too many errors encountered while posting transaction header: ${err}`);
            }
            this.txPosted = true;
            if (uploadInBody) {
                this.chunkOffset += this.totalChunks;
                this.uploadedChunks += this.totalChunks;
            }
            return;
        });
    }
}
exports.MultiChunkTxUploader = MultiChunkTxUploader;

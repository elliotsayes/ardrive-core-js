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
exports.GatewayAPI = void 0;
const axios_1 = __importDefault(require("axios"));
const arfs_metadata_cache_1 = require("../arfs/arfs_metadata_cache");
const constants_1 = require("./constants");
const rateLimitStatus = 429;
const rateLimitTimeout = 60000; // 60 seconds
// With the current default error delay and max retries, we expect the following wait times after each request sent:
// 1st request attempt
// Retry wait 1: 500ms
// 2nd request attempt
// Retry wait 2: 1,000ms
// 3rd request attempt
// Retry wait 3: 2,000ms
// 4th request attempt
// Retry wait 4: 4,000ms
// 5th request attempt
// Retry wait 5: 8,000ms
// 6th request attempt
// Retry wait 6: 16,000ms
// 7th request attempt
// Retry wait 7: 32,000ms
// 8th request attempt
// Retry wait 8: 64,000ms
// 9th request attempt
// Throw error if 9th request failure
// Total wait time:
// 127,500ms / 2 minutes and 7.5 seconds
class GatewayAPI {
    constructor({ gatewayUrl, maxRetriesPerRequest = 8, initialErrorDelayMS = constants_1.INITIAL_ERROR_DELAY, fatalErrors = constants_1.FATAL_CHUNK_UPLOAD_ERRORS, validStatusCodes = [200], axiosInstance = axios_1.default.create({ validateStatus: undefined }) }) {
        this.lastError = 'unknown error';
        this.lastRespStatus = 0;
        this.gatewayUrl = gatewayUrl;
        this.maxRetriesPerRequest = maxRetriesPerRequest;
        this.initialErrorDelayMS = initialErrorDelayMS;
        this.fatalErrors = fatalErrors;
        this.validStatusCodes = validStatusCodes;
        this.axiosInstance = axiosInstance;
    }
    postChunk(chunk) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.postToEndpoint('chunk', chunk);
        });
    }
    postTxHeader(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.postToEndpoint('tx', transaction);
        });
    }
    gqlRequest(query) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { data } = yield this.postToEndpoint('graphql', query);
                return data.data.transactions;
            }
            catch (error) {
                throw Error(`GQL Error: ${error.message}`);
            }
        });
    }
    postToEndpoint(endpoint, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.retryRequestUntilMaxRetries(() => this.axiosInstance.post(`${this.gatewayUrl.href}${endpoint}`, data));
        });
    }
    getTransaction(txId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return (yield this.retryRequestUntilMaxRetries(() => this.axiosInstance.get(`${this.gatewayUrl.href}tx/${txId}`))).data;
            }
            catch (err) {
                throw Error(`Transaction could not be found from the gateway: (Status: ${this.lastRespStatus}) ${this.lastError}`);
            }
        });
    }
    /**
     * For fetching the Data JSON of a MetaData Tx
     *
     * @remarks Will use data from `ArFSMetadataCache` if it exists and will cache any fetched data
     * */
    getTxData(txId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedData = yield arfs_metadata_cache_1.ArFSMetadataCache.get(txId);
            if (cachedData) {
                return cachedData;
            }
            const { data: txData } = yield this.retryRequestUntilMaxRetries(() => this.axiosInstance.get(`${this.gatewayUrl.href}${txId}`, {
                responseType: 'arraybuffer'
            }));
            yield arfs_metadata_cache_1.ArFSMetadataCache.put(txId, txData);
            return txData;
        });
    }
    /**
     * Retries the given request until the response returns a successful
     * status code or the maxRetries setting has been exceeded
     *
     * @throws when a fatal error has been returned by request
     * @throws when max retries have been exhausted
     */
    retryRequestUntilMaxRetries(request) {
        return __awaiter(this, void 0, void 0, function* () {
            let retryNumber = 0;
            while (retryNumber <= this.maxRetriesPerRequest) {
                const response = yield this.tryRequest(request);
                if (response) {
                    if (retryNumber > 0) {
                        console.error(`Request has been successfully retried!`);
                    }
                    return response;
                }
                this.throwIfFatalError();
                if (this.lastRespStatus === rateLimitStatus) {
                    // When rate limited by the gateway, we will wait without incrementing retry count
                    yield this.rateLimitThrottle();
                    continue;
                }
                console.error(`Request to gateway has failed: (Status: ${this.lastRespStatus}) ${this.lastError}`);
                const nextRetry = retryNumber + 1;
                if (nextRetry <= this.maxRetriesPerRequest) {
                    yield this.exponentialBackOffAfterFailedRequest(retryNumber);
                    console.error(`Retrying request, retry attempt ${nextRetry}...`);
                }
                retryNumber = nextRetry;
            }
            // Didn't succeed within number of allocated retries
            throw new Error(`Request to gateway has failed: (Status: ${this.lastRespStatus}) ${this.lastError}`);
        });
    }
    tryRequest(request) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const resp = yield request();
                this.lastRespStatus = resp.status;
                if (this.isRequestSuccessful()) {
                    return resp;
                }
                this.lastError = (_a = resp.statusText) !== null && _a !== void 0 ? _a : resp.toString();
            }
            catch (err) {
                this.lastError = err instanceof Error ? err.message : err;
            }
            return undefined;
        });
    }
    isRequestSuccessful() {
        return this.validStatusCodes.includes(this.lastRespStatus);
    }
    throwIfFatalError() {
        if (this.fatalErrors.includes(this.lastError)) {
            throw new Error(`Fatal error encountered: (Status: ${this.lastRespStatus}) ${this.lastError}`);
        }
    }
    exponentialBackOffAfterFailedRequest(retryNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            const delay = Math.pow(2, retryNumber) * this.initialErrorDelayMS;
            console.error(`Waiting for ${(delay / 1000).toFixed(1)} seconds before next request...`);
            yield new Promise((res) => setTimeout(res, delay));
        });
    }
    rateLimitThrottle() {
        return __awaiter(this, void 0, void 0, function* () {
            console.error(`Gateway has returned a ${this.lastRespStatus} status which means your IP is being rate limited. Pausing for ${(rateLimitTimeout / 1000).toFixed(1)} seconds before trying next request...`);
            yield new Promise((res) => setTimeout(res, rateLimitTimeout));
        });
    }
}
exports.GatewayAPI = GatewayAPI;

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
exports.ArFSFileOrFolderBuilder = exports.ArFSMetadataEntityBuilder = void 0;
const query_1 = require("../../utils/query");
const types_1 = require("../../types");
class ArFSMetadataEntityBuilder {
    constructor({ entityId, gatewayApi, owner }) {
        this.customMetaData = {};
        this.entityId = entityId;
        this.gatewayApi = gatewayApi;
        this.owner = owner;
    }
    getDataForTxID(txId) {
        return this.gatewayApi.getTxData(txId);
    }
    /**
     * Parses data for builder fields from either the provided GQL tags, or from a fresh request to Arweave for tag data
     *
     * @param node (optional) a pre-fetched GQL node containing the txID and tags that will be parsed out of the on-chain data
     *
     * @param owner (optional) filter all transactions out by owner's public arweave address
     *
     * @returns an array of unparsed tags
     */
    parseFromArweaveNode(node, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const unparsedTags = [];
            if (!node) {
                const gqlQuery = query_1.buildQuery({ tags: this.getGqlQueryParameters(), owner });
                const transactions = yield this.gatewayApi.gqlRequest(gqlQuery);
                const { edges } = transactions;
                if (!edges.length) {
                    throw new Error(`Entity with ID ${this.entityId} not found!`);
                }
                node = edges[0].node;
            }
            this.txId = types_1.TxID(node.id);
            const { tags } = node;
            tags.forEach((tag) => {
                const key = tag.name;
                const { value } = tag;
                switch (key) {
                    case 'App-Name':
                        this.appName = value;
                        break;
                    case 'App-Version':
                        this.appVersion = value;
                        break;
                    case 'ArFS':
                        this.arFS = value;
                        break;
                    case 'Content-Type':
                        this.contentType = value;
                        break;
                    case 'Drive-Id':
                        this.driveId = types_1.EID(value);
                        break;
                    case 'Entity-Type':
                        this.entityType = value;
                        break;
                    case 'Unix-Time':
                        this.unixTime = new types_1.UnixTime(+value);
                        break;
                    case 'Boost':
                        this.boost = new types_1.FeeMultiple(+value);
                        break;
                    default:
                        unparsedTags.push(tag);
                        break;
                }
            });
            return unparsedTags;
        });
    }
    build(node) {
        return __awaiter(this, void 0, void 0, function* () {
            const extraTags = yield this.parseFromArweaveNode(node, this.owner);
            this.parseCustomMetaDataFromGqlTags(extraTags);
            return this.buildEntity();
        });
    }
    parseCustomMetaDataFromGqlTags(gqlTags) {
        const customMetaDataGqlTags = {};
        for (const { name, value: newValue } of gqlTags) {
            const prevValue = customMetaDataGqlTags[name];
            // Accumulate any duplicated GQL tags into string[]
            const nextValue = prevValue
                ? Array.isArray(prevValue)
                    ? [...prevValue, newValue]
                    : [prevValue, newValue]
                : newValue;
            Object.assign(customMetaDataGqlTags, { [name]: nextValue });
        }
        if (!types_1.isCustomMetaDataGqlTags(customMetaDataGqlTags)) {
            console.error(`Parsed an invalid custom metadata shape from MetaData Tx GQL Tags: ${customMetaDataGqlTags}`);
            return;
        }
        if (Object.keys(customMetaDataGqlTags).length > 0) {
            this.customMetaData.metaDataGqlTags = customMetaDataGqlTags;
        }
    }
    parseCustomMetaDataFromDataJson(dataJson) {
        if (!types_1.isCustomMetaDataJsonFields(dataJson)) {
            console.error(`Parsed an invalid custom metadata shape from MetaData Tx Data JSON: ${dataJson}`);
            return;
        }
        const dataJsonEntries = Object.entries(dataJson).filter(([key]) => !this.protectedDataJsonKeys.includes(key));
        const customMetaDataJson = {};
        for (const [key, val] of dataJsonEntries) {
            Object.assign(customMetaDataJson, { [key]: val });
        }
        if (Object.keys(customMetaDataJson).length > 0) {
            this.customMetaData.metaDataJson = customMetaDataJson;
        }
    }
}
exports.ArFSMetadataEntityBuilder = ArFSMetadataEntityBuilder;
class ArFSFileOrFolderBuilder extends ArFSMetadataEntityBuilder {
    parseFromArweaveNode(node) {
        const _super = Object.create(null, {
            parseFromArweaveNode: { get: () => super.parseFromArweaveNode }
        });
        return __awaiter(this, void 0, void 0, function* () {
            const unparsedTags = [];
            const tags = yield _super.parseFromArweaveNode.call(this, node);
            tags.forEach((tag) => {
                const key = tag.name;
                const { value } = tag;
                switch (key) {
                    case 'Parent-Folder-Id':
                        this.parentFolderId = types_1.EID(value);
                        break;
                    default:
                        unparsedTags.push(tag);
                        break;
                }
            });
            return unparsedTags;
        });
    }
}
exports.ArFSFileOrFolderBuilder = ArFSFileOrFolderBuilder;

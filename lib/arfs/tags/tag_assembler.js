"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArFSTagAssembler = void 0;
const tag_assertions_1 = __importDefault(require("./tag_assertions"));
class ArFSTagAssembler {
    constructor(arFSTagSettings) {
        this.arFSTagSettings = arFSTagSettings;
    }
    assembleBundleTags({ feeMultiple, shouldAddTipTag }) {
        return this.assembleTags(this.arFSTagSettings.baseBundleTags, feeMultiple, shouldAddTipTag);
    }
    assembleArFSFileDataTags({ arFSPrototype, feeMultiple, shouldAddTipTag = false }) {
        const tags = arFSPrototype.gqlTags;
        this.arFSTagSettings.baseAppTags.forEach((t) => tags.push(t));
        return this.assembleTags(tags, feeMultiple, shouldAddTipTag);
    }
    assembleArFSMetaDataGqlTags({ arFSPrototype, feeMultiple }) {
        const tags = arFSPrototype.gqlTags;
        this.arFSTagSettings.baseArFSTags.forEach((t) => tags.push(t));
        return this.assembleTags(tags, feeMultiple);
    }
    assembleTags(tags, feeMultiple, shouldAddTipTag = false) {
        this.getBoostTags(feeMultiple).forEach((t) => tags.push(t));
        this.getTipTags(shouldAddTipTag).forEach((t) => tags.push(t));
        tag_assertions_1.default(tags);
        return tags;
    }
    getBoostTags(feeMultiple) {
        return feeMultiple && +feeMultiple > 1 ? this.arFSTagSettings.getBoostTags(feeMultiple) : [];
    }
    getTipTags(addTipTag) {
        return addTipTag ? this.arFSTagSettings.getTipTags() : [];
    }
}
exports.ArFSTagAssembler = ArFSTagAssembler;

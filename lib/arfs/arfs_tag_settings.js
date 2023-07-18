"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArFSTagSettings = void 0;
const constants_1 = require("../utils/constants");
class ArFSTagSettings {
    constructor({ appName = constants_1.DEFAULT_APP_NAME, appVersion = constants_1.DEFAULT_APP_VERSION, arFSVersion = constants_1.CURRENT_ARFS_VERSION }) {
        this.appName = appName;
        this.appVersion = appVersion;
        this.arFSVersion = arFSVersion;
    }
    get baseAppTags() {
        return [
            { name: 'App-Name', value: this.appName },
            { name: 'App-Version', value: this.appVersion }
        ];
    }
    getBoostTags(feeMultiple) {
        return [{ name: 'Boost', value: feeMultiple.toString() }];
    }
    getTipTags(tipType = 'data upload') {
        return [{ name: 'Tip-Type', value: tipType }];
    }
    get baseArFSTags() {
        return [...this.baseAppTags, { name: 'ArFS', value: this.arFSVersion }];
    }
    get baseBundleTags() {
        return [
            ...this.baseAppTags,
            { name: 'Bundle-Format', value: 'binary' },
            { name: 'Bundle-Version', value: '2.0.0' }
        ];
    }
    /** @deprecated Used for the deprecated flow of sending a separate community tip tx */
    getTipTagsWithAppTags() {
        return [...this.baseAppTags, ...this.getTipTags()];
    }
    /**
     * Used for estimating byte count of data items to bypass storing the Buffer from ArFSFileDataPrototype
     *
     * TODO: Don't use the file data Buffer in ArFSFileDataPrototype so it can be used in estimation without memory concerns
     */
    getFileDataItemTags(isPrivate, dataContentType) {
        const tags = this.baseAppTags;
        tags.push(...(isPrivate
            ? [constants_1.privateOctetContentTypeTag, constants_1.privateCipherTag, constants_1.fakePrivateCipherIVTag]
            : [{ name: 'Content-Type', value: dataContentType }]));
        return tags;
    }
}
exports.ArFSTagSettings = ArFSTagSettings;
ArFSTagSettings.protectedArFSGqlTagNames = constants_1.gqlTagNameArray;

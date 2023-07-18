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
exports.ArFSPrivateFileDataPrototype = exports.ArFSPublicFileDataPrototype = exports.ArFSFileDataPrototype = exports.ArFSPrivateFileMetaDataPrototype = exports.ArFSPublicFileMetaDataPrototype = exports.ArFSFileMetaDataPrototype = exports.ArFSPrivateFolderMetaDataPrototype = exports.ArFSPublicFolderMetaDataPrototype = exports.ArFSFolderMetaDataPrototype = exports.ArFSPrivateDriveMetaDataPrototype = exports.ArFSPublicDriveMetaDataPrototype = exports.ArFSDriveMetaDataPrototype = exports.ArFSEntityMetaDataPrototype = exports.ArFSObjectMetadataPrototype = void 0;
const arfs_tx_data_types_1 = require("./arfs_tx_data_types");
const types_1 = require("../../types");
class ArFSObjectMetadataPrototype {
    constructor(customMetaDataTags) {
        this.customMetaDataTags = customMetaDataTags;
    }
    get gqlTags() {
        const tags = this.parseCustomGqlTags(this.customMetaDataTags);
        for (const tag of this.protectedTags) {
            tags.push(tag);
        }
        return tags;
    }
    parseCustomGqlTags(customMetaDataGqlTagInterface) {
        const tagsAsArray = Object.entries(customMetaDataGqlTagInterface);
        const tags = [];
        for (const [name, values] of tagsAsArray) {
            if (typeof values === 'string') {
                tags.push({ name, value: values });
            }
            else {
                for (const value of values) {
                    // Push each unique value as its own tag
                    tags.push({ name, value });
                }
            }
        }
        this.assertProtectedTags(tags);
        return tags;
    }
    // Implementation should throw if any protected tags are identified
    assertProtectedTags(tags) {
        const protectedTags = this.protectedTags.map((t) => t.name);
        tags.forEach((tag) => {
            if (protectedTags.includes(tag.name)) {
                throw new Error(`Tag ${tag.name} is protected and cannot be used in this context!`);
            }
        });
    }
}
exports.ArFSObjectMetadataPrototype = ArFSObjectMetadataPrototype;
class ArFSEntityMetaDataPrototype extends ArFSObjectMetadataPrototype {
    constructor(customMetaDataTags) {
        super(customMetaDataTags);
        this.customMetaDataTags = customMetaDataTags;
        // Get the current time so the app can display the "created" data later on
        this.unixTime = new types_1.UnixTime(Math.round(Date.now() / 1000));
    }
    get protectedTags() {
        return [
            { name: 'Content-Type', value: this.contentType },
            { name: 'Entity-Type', value: this.entityType },
            { name: 'Unix-Time', value: `${this.unixTime}` },
            { name: 'Drive-Id', value: `${this.driveId}` }
        ];
    }
}
exports.ArFSEntityMetaDataPrototype = ArFSEntityMetaDataPrototype;
class ArFSDriveMetaDataPrototype extends ArFSEntityMetaDataPrototype {
    constructor() {
        super(...arguments);
        this.entityType = 'drive';
    }
    get protectedTags() {
        const tags = super.protectedTags;
        tags.push({ name: 'Drive-Privacy', value: this.privacy });
        return tags;
    }
}
exports.ArFSDriveMetaDataPrototype = ArFSDriveMetaDataPrototype;
class ArFSPublicDriveMetaDataPrototype extends ArFSDriveMetaDataPrototype {
    constructor(objectData, driveId, customMetaDataTags = {}) {
        super(customMetaDataTags);
        this.objectData = objectData;
        this.driveId = driveId;
        this.customMetaDataTags = customMetaDataTags;
        this.privacy = 'public';
        this.contentType = types_1.JSON_CONTENT_TYPE;
    }
}
exports.ArFSPublicDriveMetaDataPrototype = ArFSPublicDriveMetaDataPrototype;
class ArFSPrivateDriveMetaDataPrototype extends ArFSDriveMetaDataPrototype {
    constructor(driveId, objectData, customMetaDataTags = {}) {
        super(customMetaDataTags);
        this.driveId = driveId;
        this.objectData = objectData;
        this.customMetaDataTags = customMetaDataTags;
        this.privacy = 'private';
        this.contentType = types_1.PRIVATE_CONTENT_TYPE;
    }
    get protectedTags() {
        const tags = super.protectedTags;
        for (const tag of [
            { name: 'Cipher', value: this.objectData.cipher },
            { name: 'Cipher-IV', value: this.objectData.cipherIV },
            { name: 'Drive-Auth-Mode', value: this.objectData.driveAuthMode }
        ]) {
            tags.push(tag);
        }
        return tags;
    }
}
exports.ArFSPrivateDriveMetaDataPrototype = ArFSPrivateDriveMetaDataPrototype;
class ArFSFolderMetaDataPrototype extends ArFSEntityMetaDataPrototype {
    constructor() {
        super(...arguments);
        this.entityType = 'folder';
    }
    get protectedTags() {
        const tags = super.protectedTags;
        tags.push({ name: 'Folder-Id', value: `${this.folderId}` });
        if (this.parentFolderId) {
            // Root folder transactions do not have Parent-Folder-Id
            tags.push({ name: 'Parent-Folder-Id', value: `${this.parentFolderId}` });
        }
        return tags;
    }
}
exports.ArFSFolderMetaDataPrototype = ArFSFolderMetaDataPrototype;
class ArFSPublicFolderMetaDataPrototype extends ArFSFolderMetaDataPrototype {
    constructor(objectData, driveId, folderId, parentFolderId, customMetaDataTags = {}) {
        super(customMetaDataTags);
        this.objectData = objectData;
        this.driveId = driveId;
        this.folderId = folderId;
        this.parentFolderId = parentFolderId;
        this.customMetaDataTags = customMetaDataTags;
        this.contentType = types_1.JSON_CONTENT_TYPE;
    }
}
exports.ArFSPublicFolderMetaDataPrototype = ArFSPublicFolderMetaDataPrototype;
class ArFSPrivateFolderMetaDataPrototype extends ArFSFolderMetaDataPrototype {
    constructor(driveId, folderId, objectData, parentFolderId, customMetaDataTags = {}) {
        super(customMetaDataTags);
        this.driveId = driveId;
        this.folderId = folderId;
        this.objectData = objectData;
        this.parentFolderId = parentFolderId;
        this.customMetaDataTags = customMetaDataTags;
        this.privacy = 'private';
        this.contentType = types_1.PRIVATE_CONTENT_TYPE;
    }
    get protectedTags() {
        const tags = super.protectedTags;
        for (const tag of [
            { name: 'Cipher', value: this.objectData.cipher },
            { name: 'Cipher-IV', value: this.objectData.cipherIV }
        ]) {
            tags.push(tag);
        }
        return tags;
    }
}
exports.ArFSPrivateFolderMetaDataPrototype = ArFSPrivateFolderMetaDataPrototype;
class ArFSFileMetaDataPrototype extends ArFSEntityMetaDataPrototype {
    constructor() {
        super(...arguments);
        this.entityType = 'file';
    }
    get protectedTags() {
        const tags = super.protectedTags;
        for (const tag of [
            { name: 'File-Id', value: `${this.fileId}` },
            { name: 'Parent-Folder-Id', value: `${this.parentFolderId}` }
        ]) {
            tags.push(tag);
        }
        return tags;
    }
}
exports.ArFSFileMetaDataPrototype = ArFSFileMetaDataPrototype;
class ArFSPublicFileMetaDataPrototype extends ArFSFileMetaDataPrototype {
    constructor(objectData, driveId, fileId, parentFolderId, customMetaDataTags = {}) {
        super(customMetaDataTags);
        this.objectData = objectData;
        this.driveId = driveId;
        this.fileId = fileId;
        this.parentFolderId = parentFolderId;
        this.customMetaDataTags = customMetaDataTags;
        this.contentType = types_1.JSON_CONTENT_TYPE;
    }
    static fromFile({ wrappedFile, dataTxId, parentFolderId, fileId, driveId }) {
        var _a, _b;
        const { fileSize, dataContentType, lastModifiedDateMS } = wrappedFile.gatherFileInfo();
        return new ArFSPublicFileMetaDataPrototype(new arfs_tx_data_types_1.ArFSPublicFileMetadataTransactionData(wrappedFile.destinationBaseName, fileSize, lastModifiedDateMS, dataTxId, dataContentType, (_a = wrappedFile.customMetaData) === null || _a === void 0 ? void 0 : _a.metaDataJson), driveId, fileId, parentFolderId, (_b = wrappedFile.customMetaData) === null || _b === void 0 ? void 0 : _b.metaDataGqlTags);
    }
}
exports.ArFSPublicFileMetaDataPrototype = ArFSPublicFileMetaDataPrototype;
class ArFSPrivateFileMetaDataPrototype extends ArFSFileMetaDataPrototype {
    constructor(objectData, driveId, fileId, parentFolderId, customMetaDataTags = {}) {
        super(customMetaDataTags);
        this.objectData = objectData;
        this.driveId = driveId;
        this.fileId = fileId;
        this.parentFolderId = parentFolderId;
        this.customMetaDataTags = customMetaDataTags;
        this.contentType = types_1.PRIVATE_CONTENT_TYPE;
    }
    get protectedTags() {
        const tags = super.protectedTags;
        for (const tag of [
            { name: 'Cipher', value: this.objectData.cipher },
            { name: 'Cipher-IV', value: this.objectData.cipherIV }
        ]) {
            tags.push(tag);
        }
        return tags;
    }
    static fromFile({ wrappedFile, dataTxId, parentFolderId, fileId, driveId, driveKey }) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const { fileSize, dataContentType, lastModifiedDateMS } = wrappedFile.gatherFileInfo();
            return new ArFSPrivateFileMetaDataPrototype(yield arfs_tx_data_types_1.ArFSPrivateFileMetadataTransactionData.from(wrappedFile.destinationBaseName, fileSize, lastModifiedDateMS, dataTxId, dataContentType, fileId, driveKey, (_a = wrappedFile.customMetaData) === null || _a === void 0 ? void 0 : _a.metaDataJson), driveId, fileId, parentFolderId, (_b = wrappedFile.customMetaData) === null || _b === void 0 ? void 0 : _b.metaDataGqlTags);
        });
    }
}
exports.ArFSPrivateFileMetaDataPrototype = ArFSPrivateFileMetaDataPrototype;
class ArFSFileDataPrototype extends ArFSObjectMetadataPrototype {
    get protectedTags() {
        return [{ name: 'Content-Type', value: this.contentType }];
    }
}
exports.ArFSFileDataPrototype = ArFSFileDataPrototype;
class ArFSPublicFileDataPrototype extends ArFSFileDataPrototype {
    constructor(objectData, contentType, customMetaDataTags = {}) {
        super(customMetaDataTags);
        this.objectData = objectData;
        this.contentType = contentType;
        this.customMetaDataTags = customMetaDataTags;
    }
}
exports.ArFSPublicFileDataPrototype = ArFSPublicFileDataPrototype;
class ArFSPrivateFileDataPrototype extends ArFSFileDataPrototype {
    constructor(objectData, customMetaDataTags = {}) {
        super(customMetaDataTags);
        this.objectData = objectData;
        this.customMetaDataTags = customMetaDataTags;
        this.contentType = types_1.PRIVATE_CONTENT_TYPE;
    }
    get protectedTags() {
        const tags = super.protectedTags;
        for (const tag of [
            { name: 'Cipher', value: this.objectData.cipher },
            { name: 'Cipher-IV', value: this.objectData.cipherIV }
        ]) {
            tags.push(tag);
        }
        return tags;
    }
}
exports.ArFSPrivateFileDataPrototype = ArFSPrivateFileDataPrototype;

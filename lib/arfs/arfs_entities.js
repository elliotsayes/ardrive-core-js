"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArFSPrivateFolderKeyless = exports.ArFSPrivateFolderWithPathsKeyless = exports.ArFSPrivateFolderWithPaths = exports.ArFSPrivateFolder = exports.ArFSPublicFolderWithPaths = exports.ArFSPublicFolder = exports.ArFSPrivateFileKeyless = exports.ArFSPrivateFileWithPathsKeyless = exports.ArFSPrivateFileWithPaths = exports.ArFSPrivateFile = exports.ArFSPublicFileWithPaths = exports.ArFSPublicFile = exports.privateEntityWithPathsKeylessFactory = exports.privateEntityWithPathsFactory = exports.publicEntityWithPathsFactory = exports.ArFSFileOrFolderEntity = exports.ArFSPrivateDriveKeyless = exports.ArFSPrivateDrive = exports.ArFSPublicDrive = exports.ArFSEntity = void 0;
const types_1 = require("../types");
const common_1 = require("../utils/common");
// The primary ArFS entity that all other entities inherit from.
class ArFSEntity {
    constructor(appName, appVersion, arFS, contentType, driveId, entityType, name, txId, unixTime, boost, customMetaDataGqlTags, customMetaDataJson) {
        this.appName = appName;
        this.appVersion = appVersion;
        this.arFS = arFS;
        this.contentType = contentType;
        this.driveId = driveId;
        this.entityType = entityType;
        this.name = name;
        this.txId = txId;
        this.unixTime = unixTime;
        this.boost = boost;
        this.customMetaDataGqlTags = customMetaDataGqlTags;
        this.customMetaDataJson = customMetaDataJson;
    }
}
exports.ArFSEntity = ArFSEntity;
class ArFSPublicDrive extends ArFSEntity {
    constructor(appName, appVersion, arFS, contentType, driveId, entityType, name, txId, unixTime, drivePrivacy, rootFolderId, boost, customMetaDataGqlTags, customMetaDataJson) {
        super(appName, appVersion, arFS, contentType, driveId, entityType, name, txId, unixTime, boost, customMetaDataGqlTags, customMetaDataJson);
        this.appName = appName;
        this.appVersion = appVersion;
        this.arFS = arFS;
        this.contentType = contentType;
        this.driveId = driveId;
        this.entityType = entityType;
        this.name = name;
        this.txId = txId;
        this.unixTime = unixTime;
        this.drivePrivacy = drivePrivacy;
        this.rootFolderId = rootFolderId;
        this.boost = boost;
    }
}
exports.ArFSPublicDrive = ArFSPublicDrive;
class ArFSPrivateDrive extends ArFSEntity {
    constructor(appName, appVersion, arFS, contentType, driveId, entityType, name, txId, unixTime, drivePrivacy, rootFolderId, driveAuthMode, cipher, cipherIV, driveKey, boost, customMetaDataGqlTags, customMetaDataJson) {
        super(appName, appVersion, arFS, contentType, driveId, entityType, name, txId, unixTime, boost, customMetaDataGqlTags, customMetaDataJson);
        this.appName = appName;
        this.appVersion = appVersion;
        this.arFS = arFS;
        this.contentType = contentType;
        this.driveId = driveId;
        this.entityType = entityType;
        this.name = name;
        this.txId = txId;
        this.unixTime = unixTime;
        this.drivePrivacy = drivePrivacy;
        this.rootFolderId = rootFolderId;
        this.driveAuthMode = driveAuthMode;
        this.cipher = cipher;
        this.cipherIV = cipherIV;
        this.driveKey = driveKey;
        this.boost = boost;
    }
}
exports.ArFSPrivateDrive = ArFSPrivateDrive;
class ArFSPrivateDriveKeyless extends ArFSPrivateDrive {
    constructor(appName, appVersion, arFS, contentType, driveId, entityType, name, txId, unixTime, drivePrivacy, rootFolderId, driveAuthMode, cipher, cipherIV, boost, customMetaDataGqlTags, customMetaDataJson) {
        super(appName, appVersion, arFS, contentType, driveId, entityType, name, txId, unixTime, drivePrivacy, rootFolderId, driveAuthMode, cipher, cipherIV, new types_1.EntityKey(Buffer.from([])), boost, customMetaDataGqlTags, customMetaDataJson);
        this.boost = boost;
        delete this.driveKey;
    }
}
exports.ArFSPrivateDriveKeyless = ArFSPrivateDriveKeyless;
// prettier-ignore
class ArFSFileOrFolderEntity extends ArFSEntity {
    constructor(appName, appVersion, arFS, contentType, driveId, entityType, name, size, txId, unixTime, lastModifiedDate, dataTxId, dataContentType, parentFolderId, entityId, boost, customMetaDataGqlTags, customMetaDataJson) {
        super(appName, appVersion, arFS, contentType, driveId, entityType, name, txId, unixTime, boost, customMetaDataGqlTags, customMetaDataJson);
        this.entityType = entityType;
        this.size = size;
        this.lastModifiedDate = lastModifiedDate;
        this.dataTxId = dataTxId;
        this.dataContentType = dataContentType;
        this.parentFolderId = parentFolderId;
        this.entityId = entityId;
        this.boost = boost;
    }
}
exports.ArFSFileOrFolderEntity = ArFSFileOrFolderEntity;
function publicEntityWithPathsFactory(entity, hierarchy) {
    if (entity.entityType === 'folder') {
        return new ArFSPublicFolderWithPaths(entity, hierarchy);
    }
    return new ArFSPublicFileWithPaths(entity, hierarchy);
}
exports.publicEntityWithPathsFactory = publicEntityWithPathsFactory;
function privateEntityWithPathsFactory(entity, hierarchy) {
    if (entity.entityType === 'folder') {
        return new ArFSPrivateFolderWithPaths(entity, hierarchy);
    }
    return new ArFSPrivateFileWithPaths(entity, hierarchy);
}
exports.privateEntityWithPathsFactory = privateEntityWithPathsFactory;
function privateEntityWithPathsKeylessFactory(entity, hierarchy) {
    if (entity.entityType === 'folder') {
        return new ArFSPrivateFolderWithPathsKeyless(entity, hierarchy);
    }
    return new ArFSPrivateFileWithPathsKeyless(entity, hierarchy);
}
exports.privateEntityWithPathsKeylessFactory = privateEntityWithPathsKeylessFactory;
class ArFSPublicFile extends ArFSFileOrFolderEntity {
    constructor(appName, appVersion, arFS, contentType, driveId, name, txId, unixTime, parentFolderId, fileId, size, lastModifiedDate, dataTxId, dataContentType, boost, customMetaDataGqlTags, customMetaDataJson) {
        super(appName, appVersion, arFS, contentType, driveId, 'file', name, size, txId, unixTime, lastModifiedDate, dataTxId, dataContentType, parentFolderId, fileId, boost, customMetaDataGqlTags, customMetaDataJson);
        this.fileId = fileId;
        this.boost = boost;
    }
}
exports.ArFSPublicFile = ArFSPublicFile;
class ArFSPublicFileWithPaths extends ArFSPublicFile {
    constructor(entity, hierarchy) {
        super(entity.appName, entity.appVersion, entity.arFS, entity.contentType, entity.driveId, entity.name, entity.txId, entity.unixTime, entity.parentFolderId, entity.fileId, entity.size, entity.lastModifiedDate, entity.dataTxId, entity.dataContentType, entity.boost, entity.customMetaDataGqlTags, entity.customMetaDataJson);
        this.path = `${hierarchy.pathToFolderId(entity.parentFolderId)}${entity.name}`;
        this.txIdPath = `${hierarchy.txPathToFolderId(entity.parentFolderId)}${entity.txId}`;
        this.entityIdPath = `${hierarchy.entityPathToFolderId(entity.parentFolderId)}${entity.fileId}`;
    }
}
exports.ArFSPublicFileWithPaths = ArFSPublicFileWithPaths;
class ArFSPrivateFile extends ArFSFileOrFolderEntity {
    constructor(appName, appVersion, arFS, contentType, driveId, name, txId, unixTime, parentFolderId, fileId, size, lastModifiedDate, dataTxId, dataContentType, cipher, cipherIV, fileKey, driveKey, boost, customMetaDataGqlTags, customMetaDataJson) {
        super(appName, appVersion, arFS, contentType, driveId, 'file', name, size, txId, unixTime, lastModifiedDate, dataTxId, dataContentType, parentFolderId, fileId, boost, customMetaDataGqlTags, customMetaDataJson);
        this.fileId = fileId;
        this.cipher = cipher;
        this.cipherIV = cipherIV;
        this.fileKey = fileKey;
        this.driveKey = driveKey;
        this.boost = boost;
    }
    get encryptedDataSize() {
        return common_1.encryptedDataSize(this.size);
    }
}
exports.ArFSPrivateFile = ArFSPrivateFile;
class ArFSPrivateFileWithPaths extends ArFSPrivateFile {
    constructor(entity, hierarchy) {
        super(entity.appName, entity.appVersion, entity.arFS, entity.contentType, entity.driveId, entity.name, entity.txId, entity.unixTime, entity.parentFolderId, entity.fileId, entity.size, entity.lastModifiedDate, entity.dataTxId, entity.dataContentType, entity.cipher, entity.cipherIV, entity.fileKey, entity.driveKey, entity.boost, entity.customMetaDataGqlTags, entity.customMetaDataJson);
        this.path = `${hierarchy.pathToFolderId(entity.parentFolderId)}${entity.name}`;
        this.txIdPath = `${hierarchy.txPathToFolderId(entity.parentFolderId)}${entity.txId}`;
        this.entityIdPath = `${hierarchy.entityPathToFolderId(entity.parentFolderId)}${entity.fileId}`;
    }
}
exports.ArFSPrivateFileWithPaths = ArFSPrivateFileWithPaths;
class ArFSPrivateFileWithPathsKeyless extends ArFSPrivateFileWithPaths {
    constructor(entity, hierarchy) {
        super(entity, hierarchy);
        delete this.driveKey;
        delete this.fileKey;
    }
}
exports.ArFSPrivateFileWithPathsKeyless = ArFSPrivateFileWithPathsKeyless;
// Remove me after PE-1027 is applied
class ArFSPrivateFileKeyless extends ArFSPrivateFile {
    constructor(entity) {
        super(entity.appName, entity.appVersion, entity.arFS, entity.contentType, entity.driveId, entity.name, entity.txId, entity.unixTime, entity.parentFolderId, entity.fileId, entity.size, entity.lastModifiedDate, entity.dataTxId, entity.dataContentType, entity.cipher, entity.cipherIV, entity.fileKey, entity.driveKey, entity.boost, entity.customMetaDataGqlTags, entity.customMetaDataJson);
        delete this.driveKey;
        delete this.fileKey;
    }
}
exports.ArFSPrivateFileKeyless = ArFSPrivateFileKeyless;
class ArFSPublicFolder extends ArFSFileOrFolderEntity {
    constructor(appName, appVersion, arFS, contentType, driveId, name, txId, unixTime, parentFolderId, folderId, boost, customMetaDataGqlTags, customMetaDataJson) {
        super(appName, appVersion, arFS, contentType, driveId, 'folder', name, new types_1.ByteCount(0), txId, unixTime, new types_1.UnixTime(0), types_1.stubTransactionID, types_1.JSON_CONTENT_TYPE, parentFolderId, folderId, boost, customMetaDataGqlTags, customMetaDataJson);
        this.folderId = folderId;
        this.boost = boost;
    }
}
exports.ArFSPublicFolder = ArFSPublicFolder;
class ArFSPublicFolderWithPaths extends ArFSPublicFolder {
    constructor(entity, hierarchy) {
        super(entity.appName, entity.appVersion, entity.arFS, entity.contentType, entity.driveId, entity.name, entity.txId, entity.unixTime, entity.parentFolderId, entity.folderId, entity.boost, entity.customMetaDataGqlTags, entity.customMetaDataJson);
        this.path = `${hierarchy.pathToFolderId(entity.parentFolderId)}${entity.name}`;
        this.txIdPath = `${hierarchy.txPathToFolderId(entity.parentFolderId)}${entity.txId}`;
        this.entityIdPath = `${hierarchy.entityPathToFolderId(entity.parentFolderId)}${entity.folderId}`;
    }
}
exports.ArFSPublicFolderWithPaths = ArFSPublicFolderWithPaths;
class ArFSPrivateFolder extends ArFSFileOrFolderEntity {
    constructor(appName, appVersion, arFS, contentType, driveId, name, txId, unixTime, parentFolderId, folderId, cipher, cipherIV, driveKey, boost, customMetaDataGqlTags, customMetaDataJson) {
        super(appName, appVersion, arFS, contentType, driveId, 'folder', name, new types_1.ByteCount(0), txId, unixTime, new types_1.UnixTime(0), types_1.stubTransactionID, types_1.JSON_CONTENT_TYPE, parentFolderId, folderId, boost, customMetaDataGqlTags, customMetaDataJson);
        this.folderId = folderId;
        this.cipher = cipher;
        this.cipherIV = cipherIV;
        this.driveKey = driveKey;
        this.boost = boost;
    }
}
exports.ArFSPrivateFolder = ArFSPrivateFolder;
class ArFSPrivateFolderWithPaths extends ArFSPrivateFolder {
    constructor(entity, hierarchy) {
        super(entity.appName, entity.appVersion, entity.arFS, entity.contentType, entity.driveId, entity.name, entity.txId, entity.unixTime, entity.parentFolderId, entity.folderId, entity.cipher, entity.cipherIV, entity.driveKey, entity.boost, entity.customMetaDataGqlTags, entity.customMetaDataJson);
        this.path = `${hierarchy.pathToFolderId(entity.parentFolderId)}${entity.name}`;
        this.txIdPath = `${hierarchy.txPathToFolderId(entity.parentFolderId)}${entity.txId}`;
        this.entityIdPath = `${hierarchy.entityPathToFolderId(entity.parentFolderId)}${entity.folderId}`;
    }
}
exports.ArFSPrivateFolderWithPaths = ArFSPrivateFolderWithPaths;
class ArFSPrivateFolderWithPathsKeyless extends ArFSPrivateFolderWithPaths {
    constructor(entity, hierarchy) {
        super(entity, hierarchy);
        delete this.driveKey;
    }
}
exports.ArFSPrivateFolderWithPathsKeyless = ArFSPrivateFolderWithPathsKeyless;
// Remove me after PE-1027 is applied
class ArFSPrivateFolderKeyless extends ArFSPrivateFolder {
    constructor(entity) {
        super(entity.appName, entity.appVersion, entity.arFS, entity.contentType, entity.driveId, entity.name, entity.txId, entity.unixTime, entity.parentFolderId, entity.folderId, entity.cipher, entity.cipherIV, entity.driveKey, entity.boost, entity.customMetaDataGqlTags, entity.customMetaDataJson);
        delete this.driveKey;
    }
}
exports.ArFSPrivateFolderKeyless = ArFSPrivateFolderKeyless;

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
exports.ArFSPrivateFileDataTransactionData = exports.ArFSPublicFileDataTransactionData = exports.ArFSFileDataTransactionData = exports.ArFSPrivateFileMetadataTransactionData = exports.ArFSPublicFileMetadataTransactionData = exports.ArFSFileMetadataTransactionData = exports.ArFSPrivateFolderTransactionData = exports.ArFSPublicFolderTransactionData = exports.ArFSFolderTransactionData = exports.ArFSPrivateDriveTransactionData = exports.ArFSPublicDriveTransactionData = exports.ArFSDriveTransactionData = exports.ArFSObjectTransactionData = void 0;
const crypto_1 = require("../../utils/crypto");
const types_1 = require("../../types");
/** Base class of an ArFS MetaData Tx's Data JSON */
class ArFSObjectTransactionData {
    sizeOf() {
        return new types_1.ByteCount(this.asTransactionData().length);
    }
    static parseCustomDataJsonFields(baseDataJson, dataJsonCustomMetaData) {
        types_1.assertCustomMetaDataJsonFields(dataJsonCustomMetaData);
        const fullDataJson = Object.assign({}, baseDataJson);
        for (const [name, jsonSerializable] of Object.entries(dataJsonCustomMetaData)) {
            this.assertProtectedDataJsonField(name);
            const prevValue = fullDataJson[name];
            let newValue = jsonSerializable;
            if (prevValue !== undefined) {
                if (Array.isArray(prevValue)) {
                    newValue = [...prevValue, jsonSerializable];
                }
                else {
                    newValue = [prevValue, jsonSerializable];
                }
            }
            Object.assign(fullDataJson, { [name]: newValue });
        }
        return fullDataJson;
    }
    static assertProtectedDataJsonField(tagName) {
        if (this.protectedDataJsonFields.includes(tagName)) {
            throw Error(`Provided data JSON custom metadata conflicts with an ArFS protected field name: ${tagName}`);
        }
    }
    static get protectedDataJsonFields() {
        return ['name'];
    }
}
exports.ArFSObjectTransactionData = ArFSObjectTransactionData;
class ArFSDriveTransactionData extends ArFSObjectTransactionData {
    static get protectedDataJsonFields() {
        const dataJsonFields = super.protectedDataJsonFields;
        dataJsonFields.push('rootFolderId');
        return dataJsonFields;
    }
}
exports.ArFSDriveTransactionData = ArFSDriveTransactionData;
class ArFSPublicDriveTransactionData extends ArFSDriveTransactionData {
    constructor(name, rootFolderId, dataJsonCustomMetaData = {}) {
        super();
        this.name = name;
        this.rootFolderId = rootFolderId;
        this.dataJsonCustomMetaData = dataJsonCustomMetaData;
        this.baseDataJson = {
            name: this.name,
            rootFolderId: `${this.rootFolderId}`
        };
        this.fullDataJson = ArFSPublicDriveTransactionData.parseCustomDataJsonFields(this.baseDataJson, this.dataJsonCustomMetaData);
    }
    asTransactionData() {
        return JSON.stringify(this.fullDataJson);
    }
}
exports.ArFSPublicDriveTransactionData = ArFSPublicDriveTransactionData;
class ArFSPrivateDriveTransactionData extends ArFSDriveTransactionData {
    constructor(cipher, cipherIV, encryptedDriveData, driveKey, driveAuthMode = 'password') {
        super();
        this.cipher = cipher;
        this.cipherIV = cipherIV;
        this.encryptedDriveData = encryptedDriveData;
        this.driveKey = driveKey;
        this.driveAuthMode = driveAuthMode;
    }
    static from(name, rootFolderId, driveKey, dataJsonCustomMetaData = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const baseDataJson = {
                name: name,
                rootFolderId: `${rootFolderId}`
            };
            const fullDataJson = ArFSPrivateDriveTransactionData.parseCustomDataJsonFields(baseDataJson, dataJsonCustomMetaData);
            const { cipher, cipherIV, data } = yield crypto_1.driveEncrypt(driveKey, Buffer.from(JSON.stringify(fullDataJson)));
            return new ArFSPrivateDriveTransactionData(cipher, cipherIV, data, driveKey, 'password');
        });
    }
    asTransactionData() {
        return this.encryptedDriveData;
    }
}
exports.ArFSPrivateDriveTransactionData = ArFSPrivateDriveTransactionData;
class ArFSFolderTransactionData extends ArFSObjectTransactionData {
}
exports.ArFSFolderTransactionData = ArFSFolderTransactionData;
class ArFSPublicFolderTransactionData extends ArFSFolderTransactionData {
    constructor(name, dataJsonCustomMetaData = {}) {
        super();
        this.name = name;
        this.dataJsonCustomMetaData = dataJsonCustomMetaData;
        this.baseDataJson = {
            name: this.name
        };
        this.fullDataJson = ArFSPublicFolderTransactionData.parseCustomDataJsonFields(this.baseDataJson, this.dataJsonCustomMetaData);
    }
    asTransactionData() {
        return JSON.stringify(this.fullDataJson);
    }
}
exports.ArFSPublicFolderTransactionData = ArFSPublicFolderTransactionData;
class ArFSPrivateFolderTransactionData extends ArFSFolderTransactionData {
    constructor(name, cipher, cipherIV, encryptedFolderData, driveKey) {
        super();
        this.name = name;
        this.cipher = cipher;
        this.cipherIV = cipherIV;
        this.encryptedFolderData = encryptedFolderData;
        this.driveKey = driveKey;
    }
    static from(name, driveKey, dataJsonCustomMetaData = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const baseDataJson = {
                name: name
            };
            const fullDataJson = ArFSPrivateFolderTransactionData.parseCustomDataJsonFields(baseDataJson, dataJsonCustomMetaData);
            const { cipher, cipherIV, data } = yield crypto_1.fileEncrypt(driveKey, Buffer.from(JSON.stringify(fullDataJson)));
            return new ArFSPrivateFolderTransactionData(name, cipher, cipherIV, data, driveKey);
        });
    }
    asTransactionData() {
        return this.encryptedFolderData;
    }
}
exports.ArFSPrivateFolderTransactionData = ArFSPrivateFolderTransactionData;
class ArFSFileMetadataTransactionData extends ArFSObjectTransactionData {
    static get protectedDataJsonFields() {
        const dataJsonFields = super.protectedDataJsonFields;
        dataJsonFields.push('size');
        dataJsonFields.push('lastModifiedDate');
        dataJsonFields.push('dataTxId');
        dataJsonFields.push('dataContentType');
        return dataJsonFields;
    }
}
exports.ArFSFileMetadataTransactionData = ArFSFileMetadataTransactionData;
class ArFSPublicFileMetadataTransactionData extends ArFSFileMetadataTransactionData {
    constructor(name, size, lastModifiedDate, dataTxId, dataContentType, dataJsonCustomMetaData = {}) {
        super();
        this.name = name;
        this.size = size;
        this.lastModifiedDate = lastModifiedDate;
        this.dataTxId = dataTxId;
        this.dataContentType = dataContentType;
        this.dataJsonCustomMetaData = dataJsonCustomMetaData;
        this.baseDataJson = {
            name: this.name,
            size: +this.size,
            lastModifiedDate: +this.lastModifiedDate,
            dataTxId: `${this.dataTxId}`,
            dataContentType: this.dataContentType
        };
        this.fullDataJson = ArFSPublicFileMetadataTransactionData.parseCustomDataJsonFields(this.baseDataJson, this.dataJsonCustomMetaData);
    }
    asTransactionData() {
        return JSON.stringify(this.fullDataJson);
    }
}
exports.ArFSPublicFileMetadataTransactionData = ArFSPublicFileMetadataTransactionData;
class ArFSPrivateFileMetadataTransactionData extends ArFSFileMetadataTransactionData {
    constructor(cipher, cipherIV, encryptedFileMetadata, fileKey, driveAuthMode = 'password') {
        super();
        this.cipher = cipher;
        this.cipherIV = cipherIV;
        this.encryptedFileMetadata = encryptedFileMetadata;
        this.fileKey = fileKey;
        this.driveAuthMode = driveAuthMode;
    }
    static from(name, size, lastModifiedDate, dataTxId, dataContentType, fileId, driveKey, dataJsonCustomMetaData = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const baseDataJson = {
                name: name,
                size: +size,
                lastModifiedDate: +lastModifiedDate,
                dataTxId: `${dataTxId}`,
                dataContentType: dataContentType
            };
            const fullDataJson = ArFSPrivateFileMetadataTransactionData.parseCustomDataJsonFields(baseDataJson, dataJsonCustomMetaData);
            const fileKey = yield crypto_1.deriveFileKey(`${fileId}`, driveKey);
            const { cipher, cipherIV, data } = yield crypto_1.fileEncrypt(fileKey, Buffer.from(JSON.stringify(fullDataJson)));
            return new ArFSPrivateFileMetadataTransactionData(cipher, cipherIV, data, fileKey);
        });
    }
    asTransactionData() {
        return this.encryptedFileMetadata;
    }
}
exports.ArFSPrivateFileMetadataTransactionData = ArFSPrivateFileMetadataTransactionData;
class ArFSFileDataTransactionData extends ArFSObjectTransactionData {
}
exports.ArFSFileDataTransactionData = ArFSFileDataTransactionData;
class ArFSPublicFileDataTransactionData extends ArFSFileDataTransactionData {
    constructor(fileData) {
        super();
        this.fileData = fileData;
    }
    asTransactionData() {
        return this.fileData;
    }
}
exports.ArFSPublicFileDataTransactionData = ArFSPublicFileDataTransactionData;
class ArFSPrivateFileDataTransactionData extends ArFSFileDataTransactionData {
    constructor(cipher, cipherIV, encryptedFileData, driveAuthMode = 'password') {
        super();
        this.cipher = cipher;
        this.cipherIV = cipherIV;
        this.encryptedFileData = encryptedFileData;
        this.driveAuthMode = driveAuthMode;
    }
    static from(fileData, fileId, driveKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileKey = yield crypto_1.deriveFileKey(`${fileId}`, driveKey);
            const { cipher, cipherIV, data } = yield crypto_1.fileEncrypt(fileKey, fileData);
            return new ArFSPrivateFileDataTransactionData(cipher, cipherIV, data);
        });
    }
    asTransactionData() {
        return this.encryptedFileData;
    }
}
exports.ArFSPrivateFileDataTransactionData = ArFSPrivateFileDataTransactionData;

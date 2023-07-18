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
exports.getFolderEstimationInfo = exports.getFileEstimationInfo = exports.getPrivateUploadFileEstimationPrototype = exports.getPublicUploadFileEstimationPrototype = exports.getPrivateCreateDriveEstimationPrototypes = exports.getPublicCreateDriveEstimationPrototypes = exports.getPrivateFolderEstimationPrototype = exports.getPublicFolderEstimationPrototype = exports.getFakeDriveKey = void 0;
const arfs_prototypes_1 = require("../arfs/tx/arfs_prototypes");
const exports_1 = require("../exports");
const types_1 = require("../types");
const constants_1 = require("../utils/constants");
/** Derive a fake drive key from a stub drive key string for estimation and upload planning purposes */
const getFakeDriveKey = () => __awaiter(void 0, void 0, void 0, function* () {
    const fakeDriveKeyString = 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZFAKE/s';
    const fakeDriveKey = Buffer.from(fakeDriveKeyString, 'base64');
    return new types_1.EntityKey(fakeDriveKey);
});
exports.getFakeDriveKey = getFakeDriveKey;
/**
 * Constructs a fake public folder metadata prototype from stubbed entity
 * IDs for estimation and planning purposes
 */
function getPublicFolderEstimationPrototype(folderName, customMetaData) {
    return new exports_1.ArFSPublicFolderMetaDataPrototype(new exports_1.ArFSPublicFolderTransactionData(folderName, customMetaData === null || customMetaData === void 0 ? void 0 : customMetaData.metaDataJson), constants_1.fakeEntityId, constants_1.fakeEntityId, undefined, customMetaData === null || customMetaData === void 0 ? void 0 : customMetaData.metaDataGqlTags);
}
exports.getPublicFolderEstimationPrototype = getPublicFolderEstimationPrototype;
/**
 * Constructs a fake private folder metadata prototype from stubbed entity
 * IDs and a stub drive key for estimation and planning purposes
 */
function getPrivateFolderEstimationPrototype(folderName, customMetaData) {
    return __awaiter(this, void 0, void 0, function* () {
        return new exports_1.ArFSPrivateFolderMetaDataPrototype(constants_1.fakeEntityId, constants_1.fakeEntityId, yield exports_1.ArFSPrivateFolderTransactionData.from(folderName, yield exports.getFakeDriveKey(), customMetaData === null || customMetaData === void 0 ? void 0 : customMetaData.metaDataJson), undefined, customMetaData === null || customMetaData === void 0 ? void 0 : customMetaData.metaDataGqlTags);
    });
}
exports.getPrivateFolderEstimationPrototype = getPrivateFolderEstimationPrototype;
/**
 * Constructs a fake public folder metadata prototype and a fake public
 * drive metadata prototype from stubbed entity IDs for estimation and
 * planning purposes during the createDrive flow
 */
function getPublicCreateDriveEstimationPrototypes({ driveName }) {
    return {
        rootFolderMetaDataPrototype: getPublicFolderEstimationPrototype(driveName),
        driveMetaDataPrototype: new exports_1.ArFSPublicDriveMetaDataPrototype(new exports_1.ArFSPublicDriveTransactionData(driveName, constants_1.fakeEntityId), constants_1.fakeEntityId)
    };
}
exports.getPublicCreateDriveEstimationPrototypes = getPublicCreateDriveEstimationPrototypes;
/**
 * Constructs a fake private folder metadata prototype and a fake private
 * drive metadata prototype from stubbed entity IDs and a stub drive
 * key for estimation and planning purposes during the createDrive flow
 */
function getPrivateCreateDriveEstimationPrototypes({ driveName }) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            rootFolderMetaDataPrototype: yield getPrivateFolderEstimationPrototype(driveName),
            driveMetaDataPrototype: new exports_1.ArFSPrivateDriveMetaDataPrototype(constants_1.fakeEntityId, yield exports_1.ArFSPrivateDriveTransactionData.from(driveName, constants_1.fakeEntityId, yield exports.getFakeDriveKey()))
        };
    });
}
exports.getPrivateCreateDriveEstimationPrototypes = getPrivateCreateDriveEstimationPrototypes;
/**
 * Constructs a fake public file metadata prototype from stubbed
 * entity IDs and stubbed tx IDs for estimation and planning purposes
 */
function getPublicUploadFileEstimationPrototype(wrappedFile) {
    return arfs_prototypes_1.ArFSPublicFileMetaDataPrototype.fromFile({
        wrappedFile,
        dataTxId: constants_1.fakeTxID,
        driveId: constants_1.fakeEntityId,
        fileId: constants_1.fakeEntityId,
        parentFolderId: constants_1.fakeEntityId
    });
}
exports.getPublicUploadFileEstimationPrototype = getPublicUploadFileEstimationPrototype;
/**
 * Constructs a fake private file metadata prototype from stubbed entity IDs,
 * stubbed tx IDs, and a stubbed drive key for estimation and planning purposes
 */
function getPrivateUploadFileEstimationPrototype(wrappedFile) {
    return __awaiter(this, void 0, void 0, function* () {
        return arfs_prototypes_1.ArFSPrivateFileMetaDataPrototype.fromFile({
            dataTxId: constants_1.fakeTxID,
            driveId: constants_1.fakeEntityId,
            fileId: constants_1.fakeEntityId,
            parentFolderId: constants_1.fakeEntityId,
            wrappedFile,
            driveKey: yield exports.getFakeDriveKey()
        });
    });
}
exports.getPrivateUploadFileEstimationPrototype = getPrivateUploadFileEstimationPrototype;
/**
 * Derives the file data size as a byteCount and constructs a fake
 * file metadata prototype from stubbed entity IDs, stubbed tx IDs,
 * and a stubbed drive key for estimation and planning purposes
 *
 * @remarks Uses required isPrivate boolean to determine whether
 * 	the returned prototype is public or private and whether
 * 	to calculate the size as encrypted or not
 */
function getFileEstimationInfo(wrappedFile, isPrivate) {
    return __awaiter(this, void 0, void 0, function* () {
        const fileMetaDataPrototype = isPrivate
            ? yield getPrivateUploadFileEstimationPrototype(wrappedFile)
            : getPublicUploadFileEstimationPrototype(wrappedFile);
        const fileDataByteCount = isPrivate ? exports_1.encryptedDataSize(wrappedFile.size) : wrappedFile.size;
        return { fileMetaDataPrototype, fileDataByteCount };
    });
}
exports.getFileEstimationInfo = getFileEstimationInfo;
/**
 * Constructs a fake folder metadata prototype from stubbed entity IDs
 * and a stubbed drive key for estimation and planning purposes
 *
 * @remarks Uses required isPrivate boolean to determine whether
 * 	the returned prototype is public or private
 */
function getFolderEstimationInfo(wrappedFolder, isPrivate) {
    return __awaiter(this, void 0, void 0, function* () {
        const folderMetaDataPrototype = isPrivate
            ? yield getPrivateFolderEstimationPrototype(wrappedFolder.destinationBaseName, wrappedFolder.customMetaData)
            : getPublicFolderEstimationPrototype(wrappedFolder.destinationBaseName, wrappedFolder.customMetaData);
        return { folderMetaDataPrototype };
    });
}
exports.getFolderEstimationInfo = getFolderEstimationInfo;

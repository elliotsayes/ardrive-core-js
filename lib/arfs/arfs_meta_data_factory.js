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
exports.getPrepFolderFactoryParams = exports.getPrepFileParams = void 0;
const arfs_prototypes_1 = require("./tx/arfs_prototypes");
const arfs_tx_data_types_1 = require("./tx/arfs_tx_data_types");
/** Assembles data and metadata prototype factories to be used in prepareFile */
function getPrepFileParams({ destDriveId, destFolderId, wrappedEntity: wrappedFile, driveKey }) {
    if (driveKey) {
        return {
            // Return factories for private prototypes
            wrappedFile,
            dataPrototypeFactoryFn: (fileData, fileId) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                return new arfs_prototypes_1.ArFSPrivateFileDataPrototype(yield arfs_tx_data_types_1.ArFSPrivateFileDataTransactionData.from(fileData, fileId, driveKey), (_a = wrappedFile.customMetaData) === null || _a === void 0 ? void 0 : _a.dataGqlTags);
            }),
            metadataTxDataFactoryFn: (fileId, dataTxId) => __awaiter(this, void 0, void 0, function* () {
                return arfs_prototypes_1.ArFSPrivateFileMetaDataPrototype.fromFile({
                    dataTxId,
                    driveId: destDriveId,
                    fileId,
                    parentFolderId: destFolderId,
                    wrappedFile,
                    driveKey
                });
            })
        };
    }
    return {
        // Return factories for public prototypes
        wrappedFile,
        dataPrototypeFactoryFn: (fileData) => {
            var _a;
            return Promise.resolve(new arfs_prototypes_1.ArFSPublicFileDataPrototype(new arfs_tx_data_types_1.ArFSPublicFileDataTransactionData(fileData), wrappedFile.contentType, (_a = wrappedFile.customMetaData) === null || _a === void 0 ? void 0 : _a.dataGqlTags));
        },
        metadataTxDataFactoryFn: (fileId, dataTxId) => Promise.resolve(arfs_prototypes_1.ArFSPublicFileMetaDataPrototype.fromFile({
            wrappedFile,
            parentFolderId: destFolderId,
            fileId,
            driveId: destDriveId,
            dataTxId
        }))
    };
}
exports.getPrepFileParams = getPrepFileParams;
/** Assembles folder metadata prototype factory to be used in prepareFolder */
function getPrepFolderFactoryParams({ destDriveId, destFolderId, wrappedEntity: wrappedFolder, driveKey }) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        if (driveKey) {
            // Return factory for private folder prototype
            const folderData = yield arfs_tx_data_types_1.ArFSPrivateFolderTransactionData.from(wrappedFolder.destinationBaseName, driveKey, (_a = wrappedFolder.customMetaData) === null || _a === void 0 ? void 0 : _a.metaDataJson);
            return (folderId) => {
                var _a, _b;
                return new arfs_prototypes_1.ArFSPrivateFolderMetaDataPrototype(destDriveId, (_a = wrappedFolder.existingId) !== null && _a !== void 0 ? _a : folderId, folderData, destFolderId, (_b = wrappedFolder.customMetaData) === null || _b === void 0 ? void 0 : _b.metaDataGqlTags);
            };
        }
        return (folderId) => {
            var _a, _b, _c;
            // Return factory for public folder prototype
            return new arfs_prototypes_1.ArFSPublicFolderMetaDataPrototype(new arfs_tx_data_types_1.ArFSPublicFolderTransactionData(wrappedFolder.destinationBaseName, (_a = wrappedFolder.customMetaData) === null || _a === void 0 ? void 0 : _a.metaDataJson), destDriveId, (_b = wrappedFolder.existingId) !== null && _b !== void 0 ? _b : folderId, destFolderId, (_c = wrappedFolder.customMetaData) === null || _c === void 0 ? void 0 : _c.metaDataGqlTags);
        };
    });
}
exports.getPrepFolderFactoryParams = getPrepFolderFactoryParams;

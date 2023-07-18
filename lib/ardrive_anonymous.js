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
exports.ArDriveAnonymous = exports.ArDriveType = void 0;
const path_1 = require("path");
const arfs_file_wrapper_1 = require("./arfs/arfs_file_wrapper");
const assert_folder_1 = require("./utils/assert_folder");
class ArDriveType {
}
exports.ArDriveType = ArDriveType;
class ArDriveAnonymous extends ArDriveType {
    constructor(arFsDao) {
        super();
        this.arFsDao = arFsDao;
    }
    getOwnerForDriveId(driveId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.arFsDao.getOwnerForDriveId(driveId);
        });
    }
    getPublicDrive({ driveId, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.getOwnerForDriveId(driveId);
            }
            return this.arFsDao.getPublicDrive(driveId, owner);
        });
    }
    getPublicFolder({ folderId, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getDriveOwnerForFolderId(folderId);
            }
            return this.arFsDao.getPublicFolder(folderId, owner);
        });
    }
    getPublicFile({ fileId, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getDriveOwnerForFileId(fileId);
            }
            return this.arFsDao.getPublicFile(fileId, owner);
        });
    }
    getAllDrivesForAddress({ address, privateKeyData }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.arFsDao.getAllDrivesForAddress(address, privateKeyData);
        });
    }
    /**
     * Lists the children of certain public folder
     * @param {FolderID} folderId the folder ID to list children of
     * @returns {ArFSPublicFileOrFolderWithPaths[]} an array representation of the children and parent folder
     */
    listPublicFolder({ folderId, maxDepth = 0, includeRoot = false, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getDriveOwnerForFolderId(folderId);
            }
            const children = yield this.arFsDao.listPublicFolder({ folderId, maxDepth, includeRoot, owner });
            return children;
        });
    }
    downloadPublicFile({ fileId, destFolderPath, defaultFileName }) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_folder_1.assertFolderExists(destFolderPath);
            const publicFile = yield this.getPublicFile({ fileId });
            const outputFileName = defaultFileName !== null && defaultFileName !== void 0 ? defaultFileName : publicFile.name;
            const fullPath = path_1.join(destFolderPath, outputFileName);
            const data = yield this.arFsDao.getPublicDataStream(publicFile.dataTxId);
            const fileToDownload = new arfs_file_wrapper_1.ArFSPublicFileToDownload(publicFile, data, fullPath);
            yield fileToDownload.write();
        });
    }
    downloadPublicFolder({ folderId, destFolderPath, customFolderName, maxDepth, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getDriveOwnerForFolderId(folderId);
            }
            return this.arFsDao.downloadPublicFolder({ folderId, destFolderPath, maxDepth, owner, customFolderName });
        });
    }
    downloadPublicDrive({ driveId, destFolderPath, customFolderName, maxDepth, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getOwnerForDriveId(driveId);
            }
            const drive = yield this.arFsDao.getPublicDrive(driveId, owner);
            const downloadFolderArgs = {
                folderId: drive.rootFolderId,
                destFolderPath,
                customFolderName,
                maxDepth,
                owner
            };
            return this.arFsDao.downloadPublicFolder(downloadFolderArgs);
        });
    }
}
exports.ArDriveAnonymous = ArDriveAnonymous;

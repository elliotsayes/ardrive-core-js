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
exports.ArFSFolderToDownload = exports.ArFSPrivateFileToDownload = exports.ArFSPublicFileToDownload = exports.ArFSFileToDownload = exports.ArFSFolderToUpload = exports.ArFSFileToUpload = exports.ArFSManifestToUpload = exports.ArFSDataToUpload = exports.ArFSBaseEntityToUpload = exports.isFolder = exports.wrapFileOrFolder = exports.resolveEntityPathToLocalSourceUri = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const stream_1 = require("stream");
const util_1 = require("util");
const types_1 = require("../types");
const common_1 = require("../utils/common");
const sort_functions_1 = require("../utils/sort_functions");
const exports_1 = require("../exports");
const constants_1 = require("../utils/constants");
const pipelinePromise = util_1.promisify(stream_1.pipeline);
/**
 *  Fs + Node implementation file size limitations -- tested on MacOS Sep 27, 2021
 *
 *  Public : 2147483647 bytes
 *  Private: 2147483646 bytes
 */
const maxFileSize = new types_1.ByteCount(2147483646);
function resolveEntityPathToLocalSourceUri(entityPath) {
    return `file://${path_1.resolve(entityPath)}`;
}
exports.resolveEntityPathToLocalSourceUri = resolveEntityPathToLocalSourceUri;
/**
 * Reads stats of a file or folder  and constructs a File or Folder wrapper class
 *
 * @remarks import and use `isFolder` type-guard to later determine whether a folder or file
 *
 * @example
 *
 * const fileOrFolder = wrapFileOrFolder(myFilePath);
 *
 * if (isFolder(fileOrFolder)) {
 * 	// Type is: Folder
 * } else {
 * 	// Type is: File
 * }
 *
 */
function wrapFileOrFolder(fileOrFolderPath, customContentType, customMetaData) {
    const entityStats = fs_1.statSync(fileOrFolderPath);
    if (entityStats.isDirectory()) {
        return new ArFSFolderToUpload(fileOrFolderPath, entityStats, customMetaData);
    }
    return new ArFSFileToUpload(fileOrFolderPath, entityStats, customContentType, customMetaData);
}
exports.wrapFileOrFolder = wrapFileOrFolder;
/** Type-guard function to determine if returned class is a File or Folder */
function isFolder(fileOrFolder) {
    return fileOrFolder instanceof ArFSFolderToUpload;
}
exports.isFolder = isFolder;
class ArFSBaseEntityToUpload {
    constructor() {
        if (this.customMetaData !== undefined) {
            exports_1.assertCustomMetaData(this.customMetaData);
        }
    }
    get destinationBaseName() {
        var _a;
        return (_a = this.destName) !== null && _a !== void 0 ? _a : this.getBaseName();
    }
}
exports.ArFSBaseEntityToUpload = ArFSBaseEntityToUpload;
class ArFSDataToUpload extends ArFSBaseEntityToUpload {
    constructor() {
        super(...arguments);
        this.entityType = 'file';
    }
}
exports.ArFSDataToUpload = ArFSDataToUpload;
class ArFSManifestToUpload extends ArFSDataToUpload {
    constructor(folderToGenManifest, destManifestName, customMetaData) {
        super();
        this.folderToGenManifest = folderToGenManifest;
        this.destManifestName = destManifestName;
        this.customMetaData = customMetaData;
        const sortedChildren = folderToGenManifest.sort((a, b) => sort_functions_1.alphabeticalOrder(a.path, b.path));
        const baseFolderPath = sortedChildren[0].path;
        // TODO: Fix base types so deleting un-used values is not necessary; Tickets: PE-525 + PE-556
        const castedChildren = sortedChildren;
        castedChildren.map((fileOrFolderMetaData) => {
            if (fileOrFolderMetaData.entityType === 'folder') {
                delete fileOrFolderMetaData.lastModifiedDate;
                delete fileOrFolderMetaData.size;
                delete fileOrFolderMetaData.dataTxId;
                delete fileOrFolderMetaData.dataContentType;
            }
        });
        // TURN SORTED CHILDREN INTO MANIFEST
        const pathMap = {};
        castedChildren.forEach((child) => {
            if (child.dataTxId && child.path && child.dataContentType !== types_1.MANIFEST_CONTENT_TYPE) {
                const path = child.path
                    // Slice off base folder path and the leading "/" so manifest URLs path correctly
                    .slice(baseFolderPath.length + 1)
                    // Replace spaces with underscores for sharing links
                    .replace(/ /g, '_');
                pathMap[path] = { id: `${child.dataTxId}` };
            }
        });
        if (Object.keys(pathMap).length === 0) {
            throw new Error('Cannot construct a manifest of a folder that has no file entities!');
        }
        // Use index.html in the specified folder if it exists, otherwise show first file found
        const indexPath = Object.keys(pathMap).includes(`index.html`) ? `index.html` : Object.keys(pathMap)[0];
        this.manifest = {
            manifest: 'arweave/paths',
            version: '0.1.0',
            index: {
                path: indexPath
            },
            paths: pathMap
        };
        // Create new current unix, as we just created this manifest
        this.lastModifiedDateMS = new types_1.UnixTime(Math.round(Date.now() / 1000));
    }
    getLinksOutput(dataTxId, gateway = new URL(constants_1.defaultArweaveGatewayPath)) {
        const allPaths = Object.keys(this.manifest.paths);
        const encodedPaths = allPaths.map((path) => path
            // Split each path by `/` to avoid encoding the separation between folders and files
            .split('/')
            // Encode file/folder names for URL safe links
            .map((path) => encodeURIComponent(path))
            // Rejoin the paths
            .join('/'));
        const pathsToFiles = encodedPaths.map((encodedPath) => `${gateway.href}${dataTxId}/${encodedPath}`);
        const pathToManifestTx = `${gateway.href}${dataTxId}`;
        return [pathToManifestTx, ...pathsToFiles];
    }
    gatherFileInfo() {
        return { dataContentType: this.contentType, lastModifiedDateMS: this.lastModifiedDateMS, fileSize: this.size };
    }
    get contentType() {
        var _a;
        return (_a = this.customContentType) !== null && _a !== void 0 ? _a : types_1.MANIFEST_CONTENT_TYPE;
    }
    getBaseName() {
        var _a;
        return (_a = this.destName) !== null && _a !== void 0 ? _a : this.destManifestName;
    }
    getFileDataBuffer() {
        return Buffer.from(JSON.stringify(this.manifest));
    }
    get size() {
        return new types_1.ByteCount(Buffer.byteLength(JSON.stringify(this.manifest)));
    }
    get lastModifiedDate() {
        return this.lastModifiedDateMS;
    }
}
exports.ArFSManifestToUpload = ArFSManifestToUpload;
class ArFSFileToUpload extends ArFSDataToUpload {
    constructor(filePath, fileStats, customContentType, customMetaData) {
        super();
        this.filePath = filePath;
        this.fileStats = fileStats;
        this.customContentType = customContentType;
        this.customMetaData = customMetaData;
        this.sourceUri = resolveEntityPathToLocalSourceUri(this.filePath);
        if (+this.fileStats.size > +maxFileSize) {
            throw new Error(`Files greater than "${maxFileSize}" bytes are not yet supported!`);
        }
    }
    gatherFileInfo() {
        const dataContentType = this.contentType;
        const lastModifiedDateMS = this.lastModifiedDate;
        const fileSize = this.size;
        return { dataContentType, lastModifiedDateMS, fileSize };
    }
    get size() {
        return new types_1.ByteCount(this.fileStats.size);
    }
    get lastModifiedDate() {
        return new types_1.UnixTime(Math.floor(this.fileStats.mtimeMs));
    }
    getFileDataBuffer() {
        return fs_1.readFileSync(this.filePath);
    }
    get contentType() {
        if (this.customContentType) {
            return this.customContentType;
        }
        const mimeType = common_1.extToMime(this.filePath);
        if (mimeType === 'unknown') {
            // If mime type cannot be derived from the file extension, use octet stream content type
            return types_1.PRIVATE_CONTENT_TYPE;
        }
        return mimeType;
    }
    getBaseName() {
        return path_1.basename(this.filePath);
    }
    /** Computes the size of a private file encrypted with AES256-GCM */
    encryptedDataSize() {
        return common_1.encryptedDataSize(this.size);
    }
}
exports.ArFSFileToUpload = ArFSFileToUpload;
class ArFSFolderToUpload extends ArFSBaseEntityToUpload {
    constructor(filePath, fileStats, customMetaData) {
        super();
        this.filePath = filePath;
        this.fileStats = fileStats;
        this.customMetaData = customMetaData;
        this.files = [];
        this.folders = [];
        this.conflictResolution = undefined;
        this.entityType = 'folder';
        this.sourceUri = resolveEntityPathToLocalSourceUri(this.filePath);
        const entitiesInFolder = fs_1.readdirSync(this.filePath);
        for (const entityPath of entitiesInFolder) {
            const absoluteEntityPath = path_1.join(this.filePath, entityPath);
            const entityStats = fs_1.statSync(absoluteEntityPath);
            if (entityStats.isDirectory()) {
                // Child is a folder, build a new folder which will construct it's own children
                const childFolder = new ArFSFolderToUpload(absoluteEntityPath, entityStats, customMetaData);
                this.folders.push(childFolder);
            }
            else {
                // Child is a file, build a new file
                const childFile = new ArFSFileToUpload(absoluteEntityPath, entityStats, undefined, customMetaData);
                if (childFile.getBaseName() !== '.DS_Store') {
                    this.files.push(childFile);
                }
            }
        }
    }
    getBaseName() {
        return path_1.basename(this.filePath);
    }
    getTotalByteCount(encrypted = false) {
        let totalByteCount = 0;
        for (const file of this.files) {
            totalByteCount += encrypted ? +file.encryptedDataSize() : file.fileStats.size;
        }
        for (const folder of this.folders) {
            totalByteCount += +folder.getTotalByteCount(encrypted);
        }
        return new types_1.ByteCount(totalByteCount);
    }
}
exports.ArFSFolderToUpload = ArFSFolderToUpload;
class ArFSFileToDownload {
    constructor(fileEntity, dataStream, localFilePath) {
        this.fileEntity = fileEntity;
        this.dataStream = dataStream;
        this.localFilePath = localFilePath;
        // FIXME: make it compatible with Windows
        this.setLastModifiedDate = () => {
            // update the last-modified-date
            // const remoteFileLastModifiedDate = Math.ceil(+this.fileEntity.lastModifiedDate / 1000);
            // const accessTime = Date.now();
            // utimesSync(this.localFilePath, accessTime, remoteFileLastModifiedDate);
        };
    }
}
exports.ArFSFileToDownload = ArFSFileToDownload;
class ArFSPublicFileToDownload extends ArFSFileToDownload {
    constructor(fileEntity, dataStream, localFilePath) {
        super(fileEntity, dataStream, localFilePath);
    }
    write() {
        return __awaiter(this, void 0, void 0, function* () {
            const writeStream = fs_1.createWriteStream(this.localFilePath); // TODO: wrap 'fs' in a browser-safe class
            const writePromise = pipelinePromise(this.dataStream, writeStream);
            writePromise.finally(this.setLastModifiedDate);
        });
    }
}
exports.ArFSPublicFileToDownload = ArFSPublicFileToDownload;
class ArFSPrivateFileToDownload extends ArFSFileToDownload {
    constructor(fileEntity, dataStream, localFilePath, decryptingStream) {
        super(fileEntity, dataStream, localFilePath);
        this.decryptingStream = decryptingStream;
    }
    write() {
        return __awaiter(this, void 0, void 0, function* () {
            const writeStream = fs_1.createWriteStream(this.localFilePath); // TODO: wrap 'fs' in a browser-safe class
            const writePromise = pipelinePromise(this.dataStream, this.decryptingStream, writeStream);
            return writePromise.finally(this.setLastModifiedDate);
        });
    }
}
exports.ArFSPrivateFileToDownload = ArFSPrivateFileToDownload;
class ArFSFolderToDownload {
    constructor(folderWithPaths, customBaseName) {
        this.folderWithPaths = folderWithPaths;
        this.customBaseName = customBaseName;
    }
    getRelativePathOf(childPath) {
        const treeRootPath = this.folderWithPaths.path;
        const treeRootParentPath = path_1.dirname(treeRootPath);
        if (this.customBaseName) {
            return path_1.join(this.customBaseName, path_1.relative(treeRootPath, childPath));
        }
        else {
            return path_1.relative(treeRootParentPath, childPath);
        }
    }
    ensureFolderExistence(folderPath, recursive = false) {
        try {
            const stat = fs_1.statSync(folderPath);
            if (!stat.isDirectory()) {
                // FIXME: this error will be caught by the try..catch
                throw new Error(`Path is not a directory: "${folderPath}"`);
            }
        }
        catch (_a) {
            fs_1.mkdirSync(folderPath, { recursive });
        }
    }
}
exports.ArFSFolderToDownload = ArFSFolderToDownload;

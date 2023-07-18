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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArFSDAOAnonymous = exports.defaultArFSAnonymousCache = exports.ArFSDAOType = void 0;
const query_1 = require("../utils/query");
const types_1 = require("../types");
const filter_methods_1 = require("../utils/filter_methods");
const folder_hierarchy_1 = require("./folder_hierarchy");
const arfs_drive_builders_1 = require("./arfs_builders/arfs_drive_builders");
const arfs_folder_builders_1 = require("./arfs_builders/arfs_folder_builders");
const arfs_file_builders_1 = require("./arfs_builders/arfs_file_builders");
const constants_1 = require("../utils/constants");
const axios_1 = __importDefault(require("axios"));
const path_1 = require("path");
const arfs_file_wrapper_1 = require("./arfs_file_wrapper");
const arfs_entity_cache_1 = require("./arfs_entity_cache");
const sort_functions_1 = require("../utils/sort_functions");
const exports_1 = require("../exports");
const common_1 = require("../utils/common");
const gateway_api_1 = require("../utils/gateway_api");
class ArFSDAOType {
}
exports.ArFSDAOType = ArFSDAOType;
exports.defaultArFSAnonymousCache = {
    ownerCache: new arfs_entity_cache_1.ArFSEntityCache(10),
    driveIdCache: new arfs_entity_cache_1.ArFSEntityCache(10),
    publicDriveCache: new arfs_entity_cache_1.ArFSEntityCache(10),
    publicFolderCache: new arfs_entity_cache_1.ArFSEntityCache(10),
    publicFileCache: new arfs_entity_cache_1.ArFSEntityCache(10)
};
/**
 * Performs all ArFS spec operations that do NOT require a wallet for signing or decryption
 */
class ArFSDAOAnonymous extends ArFSDAOType {
    constructor(arweave, 
    /** @deprecated App Name is an unused parameter on anonymous ArFSDAO */
    appName = constants_1.DEFAULT_APP_NAME, 
    /** @deprecated App Version is an unused parameter on anonymous ArFSDAO */
    appVersion = constants_1.DEFAULT_APP_VERSION, caches = exports.defaultArFSAnonymousCache, gatewayApi = new gateway_api_1.GatewayAPI({ gatewayUrl: common_1.gatewayUrlForArweave(arweave) })) {
        super();
        this.arweave = arweave;
        this.appName = appName;
        this.appVersion = appVersion;
        this.caches = caches;
        this.gatewayApi = gatewayApi;
    }
    getOwnerForDriveId(driveId) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedOwner = this.caches.ownerCache.get(driveId);
            if (cachedOwner) {
                return cachedOwner;
            }
            return this.caches.ownerCache.put(driveId, (() => __awaiter(this, void 0, void 0, function* () {
                const gqlQuery = query_1.buildQuery({
                    tags: [
                        { name: 'Drive-Id', value: `${driveId}` },
                        { name: 'Entity-Type', value: 'drive' }
                    ],
                    sort: query_1.ASCENDING_ORDER
                });
                const transactions = yield this.gatewayApi.gqlRequest(gqlQuery);
                const edges = transactions.edges;
                if (!edges.length) {
                    throw new Error(`Could not find a transaction with "Drive-Id": ${driveId}`);
                }
                const edgeOfFirstDrive = edges[0];
                const driveOwnerAddress = edgeOfFirstDrive.node.owner.address;
                const driveOwner = types_1.ADDR(driveOwnerAddress);
                return driveOwner;
            }))());
        });
    }
    getDriveIDForEntityId(entityId, gqlTypeTag) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedDriveID = this.caches.driveIdCache.get(entityId);
            if (cachedDriveID) {
                return cachedDriveID;
            }
            return this.caches.driveIdCache.put(entityId, (() => __awaiter(this, void 0, void 0, function* () {
                const gqlQuery = query_1.buildQuery({ tags: [{ name: gqlTypeTag, value: `${entityId}` }] });
                const transactions = yield this.gatewayApi.gqlRequest(gqlQuery);
                const edges = transactions.edges;
                if (!edges.length) {
                    throw new Error(`Entity with ${gqlTypeTag} ${entityId} not found!`);
                }
                const driveIdTag = edges[0].node.tags.find((t) => t.name === 'Drive-Id');
                if (driveIdTag) {
                    return types_1.EID(driveIdTag.value);
                }
                throw new Error(`No Drive-Id tag found for meta data transaction of ${gqlTypeTag}: ${entityId}`);
            }))());
        });
    }
    getDriveOwnerForFolderId(folderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getOwnerForDriveId(yield this.getDriveIdForFolderId(folderId));
        });
    }
    getDriveOwnerForFileId(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getOwnerForDriveId(yield this.getDriveIdForFileId(fileId));
        });
    }
    getDriveIdForFileId(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getDriveIDForEntityId(fileId, 'File-Id');
        });
    }
    getDriveIdForFolderId(folderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getDriveIDForEntityId(folderId, 'Folder-Id');
        });
    }
    // Convenience function for known-public use cases
    getPublicDrive(driveId, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = { driveId, owner };
            const cachedDrive = this.caches.publicDriveCache.get(cacheKey);
            if (cachedDrive) {
                return cachedDrive;
            }
            return this.caches.publicDriveCache.put(cacheKey, new arfs_drive_builders_1.ArFSPublicDriveBuilder({
                entityId: driveId,
                gatewayApi: this.gatewayApi,
                owner
            }).build());
        });
    }
    // Convenience function for known-private use cases
    getPublicFolder(folderId, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = { folderId, owner };
            const cachedFolder = this.caches.publicFolderCache.get(cacheKey);
            if (cachedFolder) {
                return cachedFolder;
            }
            return this.caches.publicFolderCache.put(cacheKey, new arfs_folder_builders_1.ArFSPublicFolderBuilder({
                entityId: folderId,
                gatewayApi: this.gatewayApi,
                owner
            }).build());
        });
    }
    getPublicFile(fileId, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            const cacheKey = { fileId, owner };
            const cachedFile = this.caches.publicFileCache.get(cacheKey);
            if (cachedFile) {
                return cachedFile;
            }
            return this.caches.publicFileCache.put(cacheKey, new arfs_file_builders_1.ArFSPublicFileBuilder({
                entityId: fileId,
                gatewayApi: this.gatewayApi,
                owner
            }).build());
        });
    }
    getAllDrivesForAddress(address, privateKeyData, latestRevisionsOnly = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let cursor = '';
            let hasNextPage = true;
            const allDrives = [];
            while (hasNextPage) {
                const gqlQuery = query_1.buildQuery({ tags: [{ name: 'Entity-Type', value: 'drive' }], cursor, owner: address });
                const transactions = yield this.gatewayApi.gqlRequest(gqlQuery);
                const { edges } = transactions;
                hasNextPage = transactions.pageInfo.hasNextPage;
                const drives = edges.map((edge) => __awaiter(this, void 0, void 0, function* () {
                    const { node } = edge;
                    cursor = edge.cursor;
                    const driveBuilder = arfs_drive_builders_1.SafeArFSDriveBuilder.fromArweaveNode(node, this.gatewayApi, privateKeyData);
                    const drive = yield driveBuilder.build(node);
                    if (drive.drivePrivacy === 'public') {
                        const cacheKey = { driveId: drive.driveId, owner: address };
                        return this.caches.publicDriveCache.put(cacheKey, Promise.resolve(drive));
                    }
                    else {
                        // TODO: No access to private drive cache from here
                        return Promise.resolve(drive);
                    }
                }));
                allDrives.push(...(yield Promise.all(drives)));
            }
            return latestRevisionsOnly ? allDrives.filter(filter_methods_1.latestRevisionFilterForDrives) : allDrives;
        });
    }
    getPublicFilesWithParentFolderIds(folderIDs, owner, latestRevisionsOnly = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let cursor = '';
            let hasNextPage = true;
            const allFiles = [];
            while (hasNextPage) {
                const gqlQuery = query_1.buildQuery({
                    tags: [
                        { name: 'Parent-Folder-Id', value: folderIDs.map((fid) => fid.toString()) },
                        { name: 'Entity-Type', value: 'file' }
                    ],
                    cursor,
                    owner
                });
                const transactions = yield this.gatewayApi.gqlRequest(gqlQuery);
                const { edges } = transactions;
                hasNextPage = transactions.pageInfo.hasNextPage;
                const files = edges.map((edge) => __awaiter(this, void 0, void 0, function* () {
                    const { node } = edge;
                    cursor = edge.cursor;
                    const fileBuilder = arfs_file_builders_1.ArFSPublicFileBuilder.fromArweaveNode(node, this.gatewayApi);
                    const file = yield fileBuilder.build(node);
                    const cacheKey = { fileId: file.fileId, owner };
                    allFiles.push(file);
                    return this.caches.publicFileCache.put(cacheKey, Promise.resolve(file));
                }));
                yield Promise.all(files);
            }
            return latestRevisionsOnly ? allFiles.filter(filter_methods_1.latestRevisionFilter) : allFiles;
        });
    }
    getAllFoldersOfPublicDrive({ driveId, owner, latestRevisionsOnly = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            let cursor = '';
            let hasNextPage = true;
            const allFolders = [];
            while (hasNextPage) {
                const gqlQuery = query_1.buildQuery({
                    tags: [
                        { name: 'Drive-Id', value: `${driveId}` },
                        { name: 'Entity-Type', value: 'folder' }
                    ],
                    cursor,
                    owner
                });
                const transactions = yield this.gatewayApi.gqlRequest(gqlQuery);
                const { edges } = transactions;
                hasNextPage = transactions.pageInfo.hasNextPage;
                const folders = edges.map((edge) => __awaiter(this, void 0, void 0, function* () {
                    const { node } = edge;
                    cursor = edge.cursor;
                    const folderBuilder = arfs_folder_builders_1.ArFSPublicFolderBuilder.fromArweaveNode(node, this.gatewayApi);
                    const folder = yield folderBuilder.build(node);
                    const cacheKey = { folderId: folder.entityId, owner };
                    return this.caches.publicFolderCache.put(cacheKey, Promise.resolve(folder));
                }));
                allFolders.push(...(yield Promise.all(folders)));
            }
            return latestRevisionsOnly ? allFolders.filter(filter_methods_1.latestRevisionFilter) : allFolders;
        });
    }
    /**
     * Lists the children of certain public folder
     * @param {FolderID} folderId the folder ID to list children of
     * @param {number} maxDepth a non-negative integer value indicating the depth of the folder tree to list where 0 = this folder's contents only
     * @param {boolean} includeRoot whether or not folderId's folder data should be included in the listing
     * @returns {ArFSPublicFileOrFolderWithPaths[]} an array representation of the children and parent folder
     */
    listPublicFolder({ folderId, maxDepth, includeRoot, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Number.isInteger(maxDepth) || maxDepth < 0) {
                throw new Error('maxDepth should be a non-negative integer!');
            }
            const folder = yield this.getPublicFolder(folderId, owner);
            // Fetch all of the folder entities within the drive
            const driveIdOfFolder = folder.driveId;
            const allFolderEntitiesOfDrive = yield this.getAllFoldersOfPublicDrive({
                driveId: driveIdOfFolder,
                owner,
                latestRevisionsOnly: true
            });
            // Feed entities to FolderHierarchy
            const hierarchy = folder_hierarchy_1.FolderHierarchy.newFromEntities(allFolderEntitiesOfDrive);
            const searchFolderIDs = hierarchy.folderIdSubtreeFromFolderId(folderId, maxDepth);
            const [, ...subFolderIDs] = hierarchy.folderIdSubtreeFromFolderId(folderId, maxDepth + 1);
            const childrenFolderEntities = allFolderEntitiesOfDrive.filter((folder) => subFolderIDs.some((fid) => fid.equals(folder.entityId)));
            if (includeRoot) {
                childrenFolderEntities.unshift(folder);
            }
            // Fetch all file entities within all Folders of the drive
            const childrenFileEntities = [];
            for (const id of searchFolderIDs) {
                (yield this.getPublicFilesWithParentFolderIds([id], owner, true)).forEach((e) => {
                    childrenFileEntities.push(e);
                });
            }
            const children = [];
            for (const en of childrenFolderEntities) {
                children.push(en);
            }
            for (const en of childrenFileEntities) {
                children.push(en);
            }
            const entitiesWithPath = children.map((entity) => exports_1.publicEntityWithPathsFactory(entity, hierarchy));
            return entitiesWithPath;
        });
    }
    /**
     * Returns the data stream of a public file
     * @param fileTxId - the transaction ID of the data to be download
     * @returns {Promise<Readable>}
     */
    getPublicDataStream(fileTxId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataTxUrl = `${common_1.gatewayUrlForArweave(this.arweave).href}${fileTxId}`;
            const requestConfig = {
                method: 'get',
                url: dataTxUrl,
                responseType: 'stream'
            };
            const response = yield axios_1.default(requestConfig);
            return response.data;
        });
    }
    downloadPublicFolder({ folderId, destFolderPath, customFolderName, maxDepth, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            const publicFolder = yield this.getPublicFolder(folderId, owner);
            // Fetch all of the folder entities within the drive
            const driveIdOfFolder = publicFolder.driveId;
            const allFolderEntitiesOfDrive = yield this.getAllFoldersOfPublicDrive({
                driveId: driveIdOfFolder,
                owner,
                latestRevisionsOnly: true
            });
            // Feed entities to FolderHierarchy
            const hierarchy = folder_hierarchy_1.FolderHierarchy.newFromEntities(allFolderEntitiesOfDrive);
            const searchFolderIDs = hierarchy.folderIdSubtreeFromFolderId(publicFolder.entityId, maxDepth);
            const [, ...subFolderIDs] = hierarchy.folderIdSubtreeFromFolderId(publicFolder.entityId, maxDepth + 1);
            const childrenFolderEntities = allFolderEntitiesOfDrive.filter((folder) => subFolderIDs.some((subFolderID) => subFolderID.equals(folder.entityId)));
            // Fetch all file entities within all Folders of the drive
            const childrenFileEntities = yield this.getPublicFilesWithParentFolderIds(searchFolderIDs, owner, true);
            const folderWrapper = new arfs_file_wrapper_1.ArFSFolderToDownload(exports_1.publicEntityWithPathsFactory(publicFolder, hierarchy), customFolderName);
            const foldersWithPath = [publicFolder, ...childrenFolderEntities]
                .map((folder) => exports_1.publicEntityWithPathsFactory(folder, hierarchy))
                .sort((a, b) => sort_functions_1.alphabeticalOrder(a.path, b.path));
            for (const folder of foldersWithPath) {
                // assert the existence of the folder in disk
                const relativeFolderPath = folderWrapper.getRelativePathOf(folder.path);
                const absoluteLocalFolderPath = path_1.join(destFolderPath, relativeFolderPath);
                folderWrapper.ensureFolderExistence(absoluteLocalFolderPath);
                // download child files into the folder
                const childrenFiles = childrenFileEntities.filter((file) => `${file.parentFolderId}` === `${folder.entityId}` /* FIXME: use the `equals` method */);
                for (const file of childrenFiles) {
                    const relativeFilePath = folderWrapper.getRelativePathOf(exports_1.publicEntityWithPathsFactory(file, hierarchy).path);
                    const absoluteLocalFilePath = path_1.join(destFolderPath, relativeFilePath);
                    /*
                     * FIXME: Downloading all files at once consumes a lot of resources.
                     * TODO: Implement a download manager for downloading in parallel
                     * Doing it sequentially for now
                     */
                    const dataStream = yield this.getPublicDataStream(file.dataTxId);
                    const fileWrapper = new arfs_file_wrapper_1.ArFSPublicFileToDownload(file, dataStream, absoluteLocalFilePath);
                    yield fileWrapper.write();
                }
            }
        });
    }
}
exports.ArFSDAOAnonymous = ArFSDAOAnonymous;

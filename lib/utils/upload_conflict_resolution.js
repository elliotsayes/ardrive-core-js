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
exports.assertAndRemoveConflictingEntities = exports.resolveFolderNameConflicts = exports.resolveFileNameConflicts = exports.assertConflictsWithinFolder = exports.assertLocalNameConflicts = void 0;
const types_1 = require("../types");
const error_message_1 = require("./error_message");
/** Throws an error if the entitiesToUpload contain conflicting file names being sent to the same destination folder */
function assertLocalNameConflicts(entitiesToUpload) {
    var _a;
    const namesWithinUpload = {};
    for (const { destFolderId, wrappedEntity, destName } of entitiesToUpload) {
        const destinationName = destName !== null && destName !== void 0 ? destName : wrappedEntity.destinationBaseName;
        const existingName = (_a = namesWithinUpload[`${destFolderId}`]) === null || _a === void 0 ? void 0 : _a.find((n) => n === destinationName);
        if (existingName) {
            throw new Error('Upload cannot contain multiple destination names to the same destination folder!');
        }
        if (wrappedEntity.entityType === 'folder') {
            assertConflictsWithinFolder(wrappedEntity);
        }
        // Add local upload info to check for name conflicts within the upload itself
        if (!namesWithinUpload[`${destFolderId}`]) {
            namesWithinUpload[`${destFolderId}`] = [];
        }
        namesWithinUpload[`${destFolderId}`].push(destinationName);
    }
}
exports.assertLocalNameConflicts = assertLocalNameConflicts;
/** Recursive function to assert any name conflicts between entities within each folder */
function assertConflictsWithinFolder(wrappedFolder) {
    const namesWithinFolder = [];
    for (const folder of wrappedFolder.folders) {
        if (namesWithinFolder.includes(folder.destinationBaseName)) {
            throw new Error('Folders cannot contain identical destination names!');
        }
        namesWithinFolder.push(folder.destinationBaseName);
        // Recurse into each folder to check for  local conflicts
        assertConflictsWithinFolder(folder);
    }
    for (const file of wrappedFolder.files) {
        if (namesWithinFolder.includes(file.destinationBaseName)) {
            throw new Error('Folders cannot contain identical destination names!');
        }
        namesWithinFolder.push(file.destinationBaseName);
    }
}
exports.assertConflictsWithinFolder = assertConflictsWithinFolder;
function resolveFileNameConflicts({ wrappedFile, conflictResolution, destinationFileName: destFileName, prompts, getConflictInfoFn, destFolderId }) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const nameConflictInfo = yield getConflictInfoFn(destFolderId);
        const existingNameAtDestConflict = checkNameInfoForConflicts(destFileName, nameConflictInfo);
        // Assign and preserve destination name
        wrappedFile.destName = destFileName;
        if (!existingNameAtDestConflict.existingFileConflict && !existingNameAtDestConflict.existingFolderConflict) {
            // There are no conflicts, continue file upload
            return;
        }
        const hasSameLastModifiedDate = ((_a = existingNameAtDestConflict.existingFileConflict) === null || _a === void 0 ? void 0 : _a.lastModifiedDate)
            ? wrappedFile.lastModifiedDate.equals((_b = existingNameAtDestConflict.existingFileConflict) === null || _b === void 0 ? void 0 : _b.lastModifiedDate)
            : false;
        if (conflictResolution !== types_1.askOnConflicts) {
            if (existingNameAtDestConflict.existingFolderConflict) {
                // Skip this file with an error, files CANNOT overwrite folders
                wrappedFile.conflictResolution = types_1.errorOnConflict;
                return;
            }
            if (conflictResolution === types_1.skipOnConflicts) {
                // Skip this file
                wrappedFile.conflictResolution = types_1.skipOnConflicts;
                return;
            }
            if (conflictResolution === types_1.replaceOnConflicts) {
                // Proceed with new revision
                wrappedFile.existingId = existingNameAtDestConflict.existingFileConflict.fileId;
                return;
            }
            // Otherwise, default to upsert behavior
            if (hasSameLastModifiedDate) {
                // Skip this file with upsert, it has a matching last modified date
                wrappedFile.conflictResolution = types_1.upsertOnConflicts;
                return;
            }
            // Proceed with creating a new revision
            wrappedFile.existingId = existingNameAtDestConflict.existingFileConflict.fileId;
            return;
        }
        // Use the ask prompt behavior
        if (!prompts) {
            throw new Error('App must provide file name conflict resolution prompts to use the `ask` conflict resolution!');
        }
        const allExistingNames = [
            ...nameConflictInfo.files.map((f) => f.fileName),
            ...nameConflictInfo.folders.map((f) => f.folderName)
        ];
        const userInput = yield (() => {
            if (existingNameAtDestConflict.existingFolderConflict) {
                return prompts.fileToFolderNameConflict({
                    folderId: existingNameAtDestConflict.existingFolderConflict.folderId,
                    folderName: destFileName,
                    namesWithinDestFolder: allExistingNames
                });
            }
            return prompts.fileToFileNameConflict({
                fileId: existingNameAtDestConflict.existingFileConflict.fileId,
                fileName: destFileName,
                hasSameLastModifiedDate,
                namesWithinDestFolder: allExistingNames
            });
        })();
        switch (userInput.resolution) {
            case types_1.skipOnConflicts:
                // Skip this file
                wrappedFile.conflictResolution = types_1.skipOnConflicts;
                return;
            case types_1.renameOnConflicts:
                // These cases should be handled at the app level, but throw errors here if not
                if (destFileName === userInput.newFileName) {
                    throw new Error('You must provide a different name!');
                }
                if (allExistingNames.includes(userInput.newFileName)) {
                    throw new Error('That name also exists within dest folder!');
                }
                // Use specified new file name
                wrappedFile.destName = userInput.newFileName;
                return;
            case types_1.replaceOnConflicts:
                // Proceed with new revision
                wrappedFile.existingId = (_c = existingNameAtDestConflict.existingFileConflict) === null || _c === void 0 ? void 0 : _c.fileId;
                return;
        }
    });
}
exports.resolveFileNameConflicts = resolveFileNameConflicts;
function resolveFolderNameConflicts({ wrappedFolder, destinationFolderName: destFolderName, prompts, conflictResolution, getConflictInfoFn, destFolderId }) {
    return __awaiter(this, void 0, void 0, function* () {
        const nameConflictInfo = yield getConflictInfoFn(destFolderId);
        const existingNameAtDestConflict = checkNameInfoForConflicts(destFolderName, nameConflictInfo);
        // Assign and preserve destination name
        wrappedFolder.destName = destFolderName;
        if (!existingNameAtDestConflict.existingFileConflict && !existingNameAtDestConflict.existingFolderConflict) {
            // There are no conflicts, continue folder upload
            return;
        }
        if (conflictResolution !== types_1.askOnConflicts) {
            if (existingNameAtDestConflict.existingFileConflict) {
                // Folders cannot overwrite files
                wrappedFolder.conflictResolution = types_1.errorOnConflict;
                return;
            }
            // Re-use this folder, upload its contents within the existing folder
            wrappedFolder.existingId = existingNameAtDestConflict.existingFolderConflict.folderId;
        }
        else {
            // Use the ask prompt behavior
            if (!prompts) {
                throw new Error('App must provide folder and file name conflict resolution prompts to use the `ask` conflict resolution!');
            }
            const allExistingNames = [
                ...nameConflictInfo.files.map((f) => f.fileName),
                ...nameConflictInfo.folders.map((f) => f.folderName)
            ];
            const userInput = yield (() => {
                if (existingNameAtDestConflict.existingFolderConflict) {
                    return prompts.folderToFolderNameConflict({
                        folderId: existingNameAtDestConflict.existingFolderConflict.folderId,
                        folderName: destFolderName,
                        namesWithinDestFolder: allExistingNames
                    });
                }
                return prompts.folderToFileNameConflict({
                    fileId: existingNameAtDestConflict.existingFileConflict.fileId,
                    fileName: destFolderName,
                    namesWithinDestFolder: allExistingNames
                });
            })();
            switch (userInput.resolution) {
                case types_1.skipOnConflicts:
                    // Skip this folder and all its contents
                    wrappedFolder.conflictResolution = types_1.skipOnConflicts;
                    return;
                case types_1.useExistingFolder:
                    // Re-use this folder, upload its contents within the existing folder
                    // useExistingFolder will only ever be returned from a folderToFolder prompt, which
                    // WILL have existingFolderConflict -- this can not be null here
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    wrappedFolder.existingId = existingNameAtDestConflict.existingFolderConflict.folderId;
                    // Break to check conflicts within folder
                    break;
                case types_1.renameOnConflicts:
                    // These cases should be handled at the app level, but throw errors here if not
                    if (destFolderName === userInput.newFolderName) {
                        throw new Error('You must provide a different name!');
                    }
                    if (allExistingNames.includes(userInput.newFolderName)) {
                        throw new Error('That name also exists within dest folder!');
                    }
                    // Use new folder name and upload all contents within new folder
                    wrappedFolder.destName = userInput.newFolderName;
                    // Conflict resolved by rename -- return early, do NOT recurse into this folder
                    return;
            }
        }
        if (wrappedFolder.existingId) {
            // Re-using existing folder id, check for name conflicts inside the folder
            const destinationFolderId = wrappedFolder.existingId;
            for (const file of wrappedFolder.files) {
                // Check each file upload within the folder for name conflicts
                yield resolveFileNameConflicts({
                    wrappedFile: file,
                    conflictResolution,
                    destinationFileName: file.destinationBaseName,
                    prompts,
                    destFolderId: destinationFolderId,
                    getConflictInfoFn
                });
            }
            for (const folder of wrappedFolder.folders) {
                // Recurse into each folder to check for more name conflicts
                yield resolveFolderNameConflicts({
                    wrappedFolder: folder,
                    conflictResolution,
                    getConflictInfoFn,
                    destinationFolderName: folder.destinationBaseName,
                    destFolderId: destinationFolderId,
                    prompts
                });
            }
            assertAndRemoveConflictingEntities(wrappedFolder);
        }
    });
}
exports.resolveFolderNameConflicts = resolveFolderNameConflicts;
/** Uses conflictResolution on each file and folder to recursively remove skipped entities or error on conflicts */
function assertAndRemoveConflictingEntities(folder) {
    let index = folder.files.length;
    while (index--) {
        const childFile = folder.files[index];
        if (childFile.conflictResolution === 'skip' || childFile.conflictResolution === 'upsert') {
            // Remove from intended files if file will be skipped
            folder.files.splice(index, 1);
        }
        else if (childFile.conflictResolution === 'error') {
            throw Error(error_message_1.errorMessage.entityNameExists);
        }
    }
    index = folder.folders.length;
    while (index--) {
        const childFolder = folder.folders[index];
        if (childFolder.conflictResolution === 'skip') {
            // Remove from intended folders if folder will be skipped
            folder.folders.splice(index, 1);
        }
        else if (childFolder.conflictResolution === 'error') {
            throw Error(error_message_1.errorMessage.entityNameExists);
        }
        else {
            // Recurse into folder
            assertAndRemoveConflictingEntities(childFolder);
        }
    }
}
exports.assertAndRemoveConflictingEntities = assertAndRemoveConflictingEntities;
/**
 * Utility function for finding name conflicts within NameConflictInfo
 * Returns a union of objects to be safely used in type narrowing
 */
function checkNameInfoForConflicts(destinationName, nameConflictInfo) {
    const conflictResult = { existingFolderConflict: undefined, existingFileConflict: undefined };
    const existingFolderConflict = nameConflictInfo.folders.find((f) => f.folderName === destinationName);
    if (existingFolderConflict) {
        return Object.assign(Object.assign({}, conflictResult), { existingFolderConflict });
    }
    const existingFileConflict = nameConflictInfo.files.find((f) => f.fileName === destinationName);
    if (existingFileConflict) {
        return Object.assign(Object.assign({}, conflictResult), { existingFileConflict });
    }
    return conflictResult;
}

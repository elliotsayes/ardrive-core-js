"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertArFSCompliantNamesWithinFolder = exports.assertValidArFSEntityNameFactory = exports.assertValidArFSDriveName = exports.assertValidArFSFolderName = exports.assertValidArFSFileName = void 0;
// From ArFS Standards
const MAX_VALID_NAME_BYTE_LENGTH = 255;
exports.assertValidArFSFileName = assertValidArFSEntityNameFactory('file');
exports.assertValidArFSFolderName = assertValidArFSEntityNameFactory('folder');
exports.assertValidArFSDriveName = assertValidArFSEntityNameFactory('drive');
function assertValidArFSEntityNameFactory(entityType) {
    return function (name) {
        // Check for empty names
        if (name.length === 0) {
            throw new Error(`The ${entityType} name cannot be empty`);
        }
        // Check for max byte length
        const nameByteLength = new TextEncoder().encode(name).length;
        if (nameByteLength > MAX_VALID_NAME_BYTE_LENGTH) {
            throw new Error(`The ${entityType} name must not exceed ${MAX_VALID_NAME_BYTE_LENGTH} bytes`);
        }
        // Check for null characters
        if (/\0/.test(name)) {
            throw new Error(`The ${entityType} name cannot contain null characters`);
        }
    };
}
exports.assertValidArFSEntityNameFactory = assertValidArFSEntityNameFactory;
function assertArFSCompliantNamesWithinFolder(rootFolder, rootFolderDestName) {
    exports.assertValidArFSFolderName(rootFolderDestName !== null && rootFolderDestName !== void 0 ? rootFolderDestName : rootFolder.destinationBaseName);
    for (const file of rootFolder.files) {
        exports.assertValidArFSFileName(file.destinationBaseName);
    }
    for (const folder of rootFolder.folders) {
        exports.assertValidArFSFolderName(folder.destinationBaseName);
        assertArFSCompliantNamesWithinFolder(folder);
    }
    return true;
}
exports.assertArFSCompliantNamesWithinFolder = assertArFSCompliantNamesWithinFolder;

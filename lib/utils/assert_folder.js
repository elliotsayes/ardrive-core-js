"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertFolderExists = void 0;
const fs_1 = require("fs");
function assertFolderExists(folderPath) {
    const folderStats = fs_1.statSync(folderPath);
    if (!folderStats.isDirectory()) {
        throw new Error(`Path "${folderPath}" is not a directory!`);
    }
}
exports.assertFolderExists = assertFolderExists;

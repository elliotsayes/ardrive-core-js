"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBundleResult = void 0;
function isBundleResult(arFSResult) {
    return Object.keys(arFSResult).includes('bundleTxId');
}
exports.isBundleResult = isBundleResult;

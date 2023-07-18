"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emptyManifestResult = exports.emptyArFSResult = void 0;
exports.emptyArFSResult = {
    created: [],
    tips: [],
    fees: {}
};
exports.emptyManifestResult = Object.assign(Object.assign({}, exports.emptyArFSResult), { manifest: {}, links: [] });

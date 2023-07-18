"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EntityKey = void 0;
const common_1 = require("../utils/common");
class EntityKey {
    constructor(keyData) {
        this.keyData = keyData;
        if (!Buffer.isBuffer(keyData)) {
            throw new Error(`The argument must be of type Buffer, got ${typeof keyData}`);
        }
    }
    toString() {
        return common_1.urlEncodeHashKey(this.keyData);
    }
    toJSON() {
        return this.toString();
    }
}
exports.EntityKey = EntityKey;

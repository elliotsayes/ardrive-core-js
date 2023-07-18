"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamDecrypt = void 0;
const crypto_1 = require("crypto");
const stream_1 = require("stream");
const constants_1 = require("./constants");
const algo = 'aes-256-gcm'; // crypto library does not accept this in uppercase. So gotta keep using aes-256-gcm
class StreamDecrypt extends stream_1.Transform {
    constructor(cipherIV, fileKey, authTag) {
        super();
        const iv = Buffer.from(cipherIV, 'base64');
        this.decipher = crypto_1.createDecipheriv(algo, fileKey.keyData, iv, { authTagLength: constants_1.authTagLength });
        this.decipher.setAuthTag(authTag);
    }
    _transform(chunk, _encoding, next) {
        const decryptedChunk = this.decipher.update(chunk);
        this.push(decryptedChunk);
        next();
    }
    _flush(next) {
        try {
            const decipherFinalData = this.decipher.final();
            this.push(decipherFinalData);
            next();
        }
        catch (err) {
            next(err);
        }
    }
}
exports.StreamDecrypt = StreamDecrypt;

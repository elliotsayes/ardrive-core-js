/// <reference types="node" />
import { Transform } from 'stream';
import { CipherIV, FileKey } from '../types';
export declare class StreamDecrypt extends Transform {
    private readonly decipher;
    constructor(cipherIV: CipherIV, fileKey: FileKey, authTag: Buffer);
    _transform(chunk: Buffer, _encoding: BufferEncoding, next: (err?: Error, data?: Buffer) => void): void;
    _flush(next: (err?: Error, data?: Buffer) => void): void;
}

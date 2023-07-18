/// <reference types="node" />
import * as crypto from 'crypto';
import { ArFSEncryptedData } from '../types/base_Types';
import { JWK } from 'jwk-to-pem';
import { DriveKey, FileKey } from '../types';
export declare function getArweaveWalletSigningKey(jwk: JWK, data: Uint8Array): Promise<Uint8Array>;
export declare function deriveDriveKey(dataEncryptionKey: crypto.BinaryLike, driveId: string, walletPrivateKey: string): Promise<DriveKey>;
export declare function deriveFileKey(fileId: string, driveKey: DriveKey): Promise<FileKey>;
export declare function driveEncrypt(driveKey: DriveKey, data: Buffer): Promise<ArFSEncryptedData>;
export declare function fileEncrypt(fileKey: FileKey, data: Buffer): Promise<ArFSEncryptedData>;
export declare function getFileAndEncrypt(fileKey: FileKey, filePath: string): Promise<ArFSEncryptedData>;
export declare function driveDecrypt(cipherIV: string, driveKey: DriveKey, data: Buffer): Promise<Buffer>;
export declare function fileDecrypt(cipherIV: string, fileKey: FileKey, data: Buffer): Promise<Buffer>;
export declare function checksumFile(path: string): Promise<string>;
export declare function encryptText(text: crypto.BinaryLike, password: string): Promise<{
    iv: string;
    encryptedText: string;
}>;
export declare function decryptText(text: {
    iv: {
        toString: () => string;
    };
    encryptedText: {
        toString: () => string;
    };
}, password: string): Promise<string>;

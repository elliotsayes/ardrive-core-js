declare const DEFAULT_APP_VERSION: any;
import { ByteCount } from '../types';
import { CipherType } from '../types/type_guards';
export declare const ENCRYPTED_DATA_PLACEHOLDER = "ENCRYPTED";
export declare type ENCRYPTED_DATA_PLACEHOLDER_TYPE = 'ENCRYPTED';
export declare const ArFS_O_11 = "0.11";
export declare const CURRENT_ARFS_VERSION = "0.11";
export declare const DEFAULT_APP_NAME = "ArDrive-Core";
export { DEFAULT_APP_VERSION };
export declare const prodAppUrl = "https://app.ardrive.io";
export declare const stagingAppUrl = "https://staging.ardrive.io";
export declare const defaultGatewayHost = "arweave.net";
export declare const defaultGatewayProtocol = "https";
export declare const defaultGatewayPort = 443;
export declare const defaultArweaveGatewayPath: string;
export declare const gatewayGqlEndpoint = "graphql";
export declare const defaultCipher: CipherType;
export declare const fakeEntityId: import("../types").EntityID;
export declare const fakeTxID: import("../types").TransactionID;
/**
 * Minimum ArDrive community tip from the Community Improvement Proposal Doc:
 * https://arweave.net/Yop13NrLwqlm36P_FDCdMaTBwSlj0sdNGAC4FqfRUgo
 *
 * Voted on by the ArDrive community (vote #82):
 * https://community.xyz/#-8A6RexFkpfWwuyVO98wzSFZh0d6VJuI-buTJvlwOJQ/votes/
 */
export declare const minArDriveCommunityARTip = 0.00001;
/** These limits are being chosen as a precaution due to potential gateway limitations */
export declare const MAX_BUNDLE_SIZE: ByteCount;
export declare const MAX_DATA_ITEM_LIMIT = 500;
export declare const communityTxId = "-8A6RexFkpfWwuyVO98wzSFZh0d6VJuI-buTJvlwOJQ";
export declare const publicJsonContentTypeTag: {
    name: string;
    value: string;
};
export declare const privateOctetContentTypeTag: {
    name: string;
    value: string;
};
export declare const privateCipherTag: {
    name: string;
    value: "AES256-GCM";
};
export declare const fakePrivateCipherIVTag: {
    name: string;
    value: string;
};
export declare const authTagLength = 16;
export declare const defaultMaxConcurrentChunks = 32;
/**
 * Error delay for the first failed request for a transaction header post or chunk upload
 * Subsequent requests will delay longer with an exponential back off strategy
 */
export declare const INITIAL_ERROR_DELAY = 500;
/**
 *  These are errors from the `/chunk` endpoint on an Arweave
 *  node that we should never try to continue on
 */
export declare const FATAL_CHUNK_UPLOAD_ERRORS: string[];
export declare const gqlTagNameRecord: {
    readonly arFS: "ArFS";
    readonly tipType: "Tip-Type";
    readonly contentType: "Content-Type";
    readonly boost: "Boost";
    readonly bundleFormat: "Bundle-Format";
    readonly bundleVersion: "Bundle-Version";
    readonly entityType: "Entity-Type";
    readonly unitTime: "Unix-Time";
    readonly driveId: "Drive-Id";
    readonly folderId: "Folder-Id";
    readonly fileId: "File-Id";
    readonly parentFolderId: "Parent-Folder-Id";
    readonly drivePrivacy: "Drive-Privacy";
    readonly cipher: "Cipher";
    readonly cipherIv: "Cipher-IV";
    readonly driveAuthMode: "Drive-Auth-Mode";
};
export declare const gqlTagNameArray: ("Content-Type" | "Cipher" | "Cipher-IV" | "ArFS" | "Tip-Type" | "Boost" | "Bundle-Format" | "Bundle-Version" | "Entity-Type" | "Unix-Time" | "Drive-Id" | "Folder-Id" | "File-Id" | "Parent-Folder-Id" | "Drive-Privacy" | "Drive-Auth-Mode")[];
export declare type GqlTagName = typeof gqlTagNameArray[number];

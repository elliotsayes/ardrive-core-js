"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gqlTagNameArray = exports.gqlTagNameRecord = exports.FATAL_CHUNK_UPLOAD_ERRORS = exports.INITIAL_ERROR_DELAY = exports.defaultMaxConcurrentChunks = exports.authTagLength = exports.fakePrivateCipherIVTag = exports.privateCipherTag = exports.privateOctetContentTypeTag = exports.publicJsonContentTypeTag = exports.communityTxId = exports.MAX_DATA_ITEM_LIMIT = exports.MAX_BUNDLE_SIZE = exports.minArDriveCommunityARTip = exports.fakeTxID = exports.fakeEntityId = exports.defaultCipher = exports.gatewayGqlEndpoint = exports.defaultArweaveGatewayPath = exports.defaultGatewayPort = exports.defaultGatewayProtocol = exports.defaultGatewayHost = exports.stagingAppUrl = exports.prodAppUrl = exports.DEFAULT_APP_VERSION = exports.DEFAULT_APP_NAME = exports.CURRENT_ARFS_VERSION = exports.ArFS_O_11 = exports.ENCRYPTED_DATA_PLACEHOLDER = void 0;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version: DEFAULT_APP_VERSION } = require('../../package.json');
exports.DEFAULT_APP_VERSION = DEFAULT_APP_VERSION;
const types_1 = require("../types");
exports.ENCRYPTED_DATA_PLACEHOLDER = 'ENCRYPTED';
exports.ArFS_O_11 = '0.11';
exports.CURRENT_ARFS_VERSION = exports.ArFS_O_11;
exports.DEFAULT_APP_NAME = 'ArDrive-Core';
exports.prodAppUrl = 'https://app.ardrive.io';
exports.stagingAppUrl = 'https://staging.ardrive.io';
exports.defaultGatewayHost = 'arweave.net';
exports.defaultGatewayProtocol = 'https';
exports.defaultGatewayPort = 443;
exports.defaultArweaveGatewayPath = `${exports.defaultGatewayProtocol}://${exports.defaultGatewayHost}/`;
exports.gatewayGqlEndpoint = 'graphql';
exports.defaultCipher = 'AES256-GCM';
exports.fakeEntityId = types_1.EID('00000000-0000-0000-0000-000000000000');
exports.fakeTxID = types_1.TxID('0000000000000000000000000000000000000000000');
/**
 * Minimum ArDrive community tip from the Community Improvement Proposal Doc:
 * https://arweave.net/Yop13NrLwqlm36P_FDCdMaTBwSlj0sdNGAC4FqfRUgo
 *
 * Voted on by the ArDrive community (vote #82):
 * https://community.xyz/#-8A6RexFkpfWwuyVO98wzSFZh0d6VJuI-buTJvlwOJQ/votes/
 */
exports.minArDriveCommunityARTip = 0.00001;
/** These limits are being chosen as a precaution due to potential gateway limitations */
exports.MAX_BUNDLE_SIZE = new types_1.ByteCount(524288000); // 500 MiB
exports.MAX_DATA_ITEM_LIMIT = 500; // 500 data items
// ArDrive Profit Sharing Community Smart Contract
exports.communityTxId = '-8A6RexFkpfWwuyVO98wzSFZh0d6VJuI-buTJvlwOJQ';
exports.publicJsonContentTypeTag = { name: 'Content-Type', value: types_1.JSON_CONTENT_TYPE };
exports.privateOctetContentTypeTag = { name: 'Content-Type', value: types_1.PRIVATE_CONTENT_TYPE };
exports.privateCipherTag = { name: 'Cipher', value: exports.defaultCipher };
exports.fakePrivateCipherIVTag = { name: 'Cipher-IV', value: 'qwertyuiopasdfgh' }; // Cipher-IV is always 16 characters
exports.authTagLength = 16;
exports.defaultMaxConcurrentChunks = 32;
/**
 * Error delay for the first failed request for a transaction header post or chunk upload
 * Subsequent requests will delay longer with an exponential back off strategy
 */
exports.INITIAL_ERROR_DELAY = 500; // 500ms
/**
 *  These are errors from the `/chunk` endpoint on an Arweave
 *  node that we should never try to continue on
 */
exports.FATAL_CHUNK_UPLOAD_ERRORS = [
    'invalid_json',
    'chunk_too_big',
    'data_path_too_big',
    'offset_too_big',
    'data_size_too_big',
    'chunk_proof_ratio_not_attractive',
    'invalid_proof'
];
exports.gqlTagNameRecord = {
    arFS: 'ArFS',
    tipType: 'Tip-Type',
    contentType: 'Content-Type',
    boost: 'Boost',
    bundleFormat: 'Bundle-Format',
    bundleVersion: 'Bundle-Version',
    entityType: 'Entity-Type',
    unitTime: 'Unix-Time',
    driveId: 'Drive-Id',
    folderId: 'Folder-Id',
    fileId: 'File-Id',
    parentFolderId: 'Parent-Folder-Id',
    drivePrivacy: 'Drive-Privacy',
    cipher: 'Cipher',
    cipherIv: 'Cipher-IV',
    driveAuthMode: 'Drive-Auth-Mode'
};
exports.gqlTagNameArray = Object.values(exports.gqlTagNameRecord);

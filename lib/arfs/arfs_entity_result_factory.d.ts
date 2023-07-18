import { DriveID, FolderID, FileID, FileKey, DriveKey, TransactionID, Winston, CommunityTipSettings, SourceUri, EntityName, EntityID } from '../types';
export interface ArFSBundleWriteResult {
    bundleTxId: TransactionID;
    bundleTxReward: Winston;
    metaDataTxId: TransactionID;
}
export declare function isBundleResult(arFSResult: ArFSWriteResult | ArFSBundleWriteResult): arFSResult is ArFSBundleWriteResult;
export interface ArFSWriteResult {
    metaDataTxId: TransactionID;
    metaDataTxReward: Winston;
}
export interface ArFSUploadEntitiesResult {
    fileResults: FileResult[];
    folderResults: FolderResult[];
    bundleResults: BundleResult[];
}
export interface BaseArFSUploadResult {
    entityName: EntityName;
    bundledIn?: TransactionID;
    sourceUri?: SourceUri;
    entityId: EntityID;
}
export interface FolderResult extends BaseArFSUploadResult {
    folderTxId: TransactionID;
    folderMetaDataReward?: Winston;
    driveKey?: DriveKey;
}
export interface FileResult extends BaseArFSUploadResult {
    fileDataTxId: TransactionID;
    metaDataTxId: TransactionID;
    fileDataReward?: Winston;
    fileMetaDataReward?: Winston;
    communityTipSettings?: CommunityTipSettings;
    fileKey?: FileKey;
}
export interface BundleResult {
    bundleTxId: TransactionID;
    bundleReward: Winston;
    communityTipSettings?: CommunityTipSettings;
}
export interface ArFSDriveResult {
    rootFolderTxId: TransactionID;
    driveId: DriveID;
    rootFolderId: FolderID;
}
export declare type ArFSCreateBundledDriveResult = ArFSBundleWriteResult & ArFSDriveResult;
export interface ArFSCreateDriveResult extends ArFSWriteResult, ArFSDriveResult {
    rootFolderTxReward: Winston;
}
export interface ArFSV2PublicRetryResult {
    fileDataReward: Winston;
    communityTipSettings: CommunityTipSettings;
    newMetaDataInfo?: NewFileMetaDataCreated;
}
export interface NewFileMetaDataCreated {
    fileId: FileID;
    metaDataTxId: TransactionID;
    fileMetaDataReward: Winston;
}
export interface ArFSFileResult {
    fileId: FileID;
    dataTxId: TransactionID;
}
export interface ArFSUploadFileV2TxResult extends ArFSWriteResult, ArFSFileResult {
    dataTxReward: Winston;
}
export declare type ArFSUploadBundledFileResult = ArFSBundleWriteResult & ArFSFileResult;
export declare type ArFSUploadFileResult = ArFSUploadFileV2TxResult | ArFSUploadBundledFileResult;
export interface ArFSCreateFolderResult extends ArFSWriteResult {
    folderId: FolderID;
}
export declare type ArFSMoveEntityResult = ArFSWriteResult;
export interface ArFSMoveFileResult extends ArFSMoveEntityResult {
    dataTxId: TransactionID;
}
export declare type ArFSRenameEntityResult = ArFSWriteResult;
export interface ArFSRenameFileResult extends ArFSRenameEntityResult {
    entityId: FileID;
}
export interface ArFSRenameFolderResult extends ArFSRenameEntityResult {
    entityId: FolderID;
}
export interface ArFSRenameDriveResult extends ArFSRenameEntityResult {
    entityId: DriveID;
}
export declare type WithDriveKey = {
    driveKey: DriveKey;
};
export declare type WithFileKey = {
    fileKey: FileKey;
};
export declare type ArFSCreatePublicDriveResult = ArFSCreateDriveResult;
export declare type ArFSCreatePrivateDriveResult = ArFSCreateDriveResult & WithDriveKey;
export declare type ArFSCreatePublicBundledDriveResult = ArFSCreateBundledDriveResult;
export declare type ArFSCreatePrivateBundledDriveResult = ArFSCreateBundledDriveResult & WithDriveKey;
export declare type ArFSCreatePublicFolderResult = ArFSCreateFolderResult;
export declare type ArFSCreatePrivateFolderResult = ArFSCreateFolderResult & WithDriveKey;
export declare type ArFSUploadPublicFileResult = ArFSUploadFileResult;
export declare type ArFSUploadPrivateFileResult = ArFSUploadFileResult & WithFileKey;
export declare type ArFSMovePublicFolderResult = ArFSMoveEntityResult;
export declare type ArFSMovePrivateFolderResult = ArFSMoveEntityResult & WithDriveKey;
export declare type ArFSMovePublicFileResult = ArFSMoveFileResult;
export declare type ArFSMovePrivateFileResult = ArFSMoveFileResult & WithFileKey;
export declare type ArFSRenamePublicFileResult = ArFSRenameFileResult;
export declare type ArFSRenamePrivateFileResult = ArFSRenameFileResult & WithFileKey;
export declare type ArFSRenamePublicFolderResult = ArFSRenameFolderResult;
export declare type ArFSRenamePrivateFolderResult = ArFSRenameFolderResult & WithDriveKey;
export declare type ArFSRenamePublicDriveResult = ArFSRenameDriveResult;
export declare type ArFSRenamePrivateDriveResult = ArFSRenameDriveResult & WithDriveKey;
export declare type ArFSMoveEntityResultFactory<R extends ArFSMoveEntityResult> = (result: ArFSMoveEntityResult) => R;

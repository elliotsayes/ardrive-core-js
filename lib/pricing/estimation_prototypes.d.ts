import { ArFSFileMetaDataPrototype, ArFSFolderMetaDataPrototype, ArFSPrivateFileMetaDataPrototype, ArFSPublicFileMetaDataPrototype } from '../arfs/tx/arfs_prototypes';
import { ArFSDataToUpload, ArFSFolderToUpload, ArFSPrivateFolderMetaDataPrototype, ArFSPublicFolderMetaDataPrototype, ByteCount, CreatePrivateDriveParams, CreatePublicDriveParams, CustomMetaData, DriveKey } from '../exports';
import { EstimateCreateDriveParams } from '../types/upload_planner_types';
/** Derive a fake drive key from a stub drive key string for estimation and upload planning purposes */
export declare const getFakeDriveKey: () => Promise<DriveKey>;
/**
 * Constructs a fake public folder metadata prototype from stubbed entity
 * IDs for estimation and planning purposes
 */
export declare function getPublicFolderEstimationPrototype(folderName: string, customMetaData?: CustomMetaData): ArFSPublicFolderMetaDataPrototype;
/**
 * Constructs a fake private folder metadata prototype from stubbed entity
 * IDs and a stub drive key for estimation and planning purposes
 */
export declare function getPrivateFolderEstimationPrototype(folderName: string, customMetaData?: CustomMetaData): Promise<ArFSPrivateFolderMetaDataPrototype>;
/**
 * Constructs a fake public folder metadata prototype and a fake public
 * drive metadata prototype from stubbed entity IDs for estimation and
 * planning purposes during the createDrive flow
 */
export declare function getPublicCreateDriveEstimationPrototypes({ driveName }: CreatePublicDriveParams): EstimateCreateDriveParams;
/**
 * Constructs a fake private folder metadata prototype and a fake private
 * drive metadata prototype from stubbed entity IDs and a stub drive
 * key for estimation and planning purposes during the createDrive flow
 */
export declare function getPrivateCreateDriveEstimationPrototypes({ driveName }: CreatePrivateDriveParams): Promise<EstimateCreateDriveParams>;
/**
 * Constructs a fake public file metadata prototype from stubbed
 * entity IDs and stubbed tx IDs for estimation and planning purposes
 */
export declare function getPublicUploadFileEstimationPrototype(wrappedFile: ArFSDataToUpload): ArFSPublicFileMetaDataPrototype;
/**
 * Constructs a fake private file metadata prototype from stubbed entity IDs,
 * stubbed tx IDs, and a stubbed drive key for estimation and planning purposes
 */
export declare function getPrivateUploadFileEstimationPrototype(wrappedFile: ArFSDataToUpload): Promise<ArFSPrivateFileMetaDataPrototype>;
/**
 * Derives the file data size as a byteCount and constructs a fake
 * file metadata prototype from stubbed entity IDs, stubbed tx IDs,
 * and a stubbed drive key for estimation and planning purposes
 *
 * @remarks Uses required isPrivate boolean to determine whether
 * 	the returned prototype is public or private and whether
 * 	to calculate the size as encrypted or not
 */
export declare function getFileEstimationInfo(wrappedFile: ArFSDataToUpload, isPrivate: boolean): Promise<{
    fileMetaDataPrototype: ArFSFileMetaDataPrototype;
    fileDataByteCount: ByteCount;
}>;
/**
 * Constructs a fake folder metadata prototype from stubbed entity IDs
 * and a stubbed drive key for estimation and planning purposes
 *
 * @remarks Uses required isPrivate boolean to determine whether
 * 	the returned prototype is public or private
 */
export declare function getFolderEstimationInfo(wrappedFolder: ArFSFolderToUpload, isPrivate: boolean): Promise<{
    folderMetaDataPrototype: ArFSFolderMetaDataPrototype;
}>;

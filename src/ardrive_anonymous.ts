import {
	ArFSPublicDrive,
	ArFSPublicFolder,
	ArFSPublicFile,
	ArFSDriveEntity,
	ArFSPublicFileOrFolderWithPaths
} from './arfs/arfs_entities';
import { ArFSDAOType, ArFSDAOAnonymous, ArFSDownloadPublicFolderParams } from './arfs/arfsdao_anonymous';
import { DriveID, ArweaveAddress, DownloadPublicFileParameters, DownloadPublicFolderParameters } from './types';
import {
	GetPublicDriveParams,
	GetPublicFolderParams,
	GetPublicFileParams,
	GetAllDrivesForAddressParams,
	ListPublicFolderParams
} from './types';
import { join as joinPath } from 'path';
import { ArFSPublicFileToDownload } from './arfs/arfs_file_wrapper';
import { assertFolderExists } from './utils/assert_folder';

export abstract class ArDriveType {
	protected abstract readonly arFsDao: ArFSDAOType;
}

export class ArDriveAnonymous extends ArDriveType {
	constructor(protected readonly arFsDao: ArFSDAOAnonymous) {
		super();
	}

	public async getOwnerForDriveId(driveId: DriveID): Promise<ArweaveAddress> {
		return this.arFsDao.getOwnerForDriveId(driveId);
	}

	public async getPublicDrive({ driveId, owner }: GetPublicDriveParams): Promise<ArFSPublicDrive> {
		if (!owner) {
			owner = await this.getOwnerForDriveId(driveId);
		}

		return this.arFsDao.getPublicDrive(driveId, owner);
	}

	public async getPublicFolder({ folderId, owner }: GetPublicFolderParams): Promise<ArFSPublicFolder> {
		if (!owner) {
			owner = await this.arFsDao.getDriveOwnerForFolderId(folderId);
		}

		return this.arFsDao.getPublicFolder(folderId, owner);
	}

	public async getPublicFile({ fileId, owner }: GetPublicFileParams): Promise<ArFSPublicFile> {
		if (!owner) {
			owner = await this.arFsDao.getDriveOwnerForFileId(fileId);
		}

		return this.arFsDao.getPublicFile(fileId, owner);
	}

	public async getAllDrivesForAddress({
		address,
		privateKeyData
	}: GetAllDrivesForAddressParams): Promise<ArFSDriveEntity[]> {
		return this.arFsDao.getAllDrivesForAddress(address, privateKeyData);
	}

	/**
	 * Lists the children of certain public folder
	 * @param {FolderID} folderId the folder ID to list children of
	 * @returns {ArFSPublicFileOrFolderWithPaths[]} an array representation of the children and parent folder
	 */
	public async listPublicFolder({
		folderId,
		maxDepth = 0,
		includeRoot = false,
		owner
	}: ListPublicFolderParams): Promise<ArFSPublicFileOrFolderWithPaths[]> {
		if (!owner) {
			owner = await this.arFsDao.getDriveOwnerForFolderId(folderId);
		}

		const children = await this.arFsDao.listPublicFolder({ folderId, maxDepth, includeRoot, owner });
		return children;
	}

	async downloadPublicFile({ fileId, destFolderPath, defaultFileName }: DownloadPublicFileParameters): Promise<void> {
		assertFolderExists(destFolderPath);
		const publicFile = await this.getPublicFile({ fileId });
		const outputFileName = defaultFileName ?? publicFile.name;
		const fullPath = joinPath(destFolderPath, outputFileName);
		const data = await this.arFsDao.getPublicDataStream(publicFile.dataTxId);
		const fileToDownload = new ArFSPublicFileToDownload(publicFile, data, fullPath);
		await fileToDownload.write();
	}

	async downloadPublicFolder({
		folderId,
		destFolderPath,
		customFolderName,
		maxDepth,
		owner
	}: DownloadPublicFolderParameters): Promise<void> {
		if (!owner) {
			owner = await this.arFsDao.getDriveOwnerForFolderId(folderId);
		}

		return this.arFsDao.downloadPublicFolder({ folderId, destFolderPath, maxDepth, owner, customFolderName });
	}

	async downloadPublicDrive(args: {
		driveId: DriveID;
		destFolderPath: string;
		maxDepth: number;
		owner?: ArweaveAddress;
	}): Promise<void> {
		if (!args.owner) {
			args.owner = await this.arFsDao.getOwnerForDriveId(args.driveId);
		}

		const drive = await this.arFsDao.getPublicDrive(args.driveId, args.owner);
		const downloadFolderArgs: ArFSDownloadPublicFolderParams = {
			folderId: drive.rootFolderId,
			destFolderPath: args.destFolderPath,
			maxDepth: args.maxDepth,
			owner: args.owner
		};

		return this.arFsDao.downloadPublicFolder(downloadFolderArgs);
	}
}

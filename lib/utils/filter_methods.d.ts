import { ArFSDriveEntity, ArFSFileOrFolderEntity, ArFSPrivateFile, ArFSPrivateFolder, ArFSPublicFile, ArFSPublicFolder } from '../arfs/arfs_entities';
/**
 * @name lastRevisionFilter is a standard JS find/filter function intended to
 * filter only the last revision of entities within an array
 *
 * @param {ArFSFileOrFolderEntity} entity the iterated entity
 * @param {number} _index the iterated index
 * @param {ArFSFileOrFolderEntity[]} allEntities the array of all entities
 * @returns {boolean}
 */
export declare function latestRevisionFilter(entity: ArFSFileOrFolderEntity<'file' | 'folder'>, _index: number, allEntities: ArFSFileOrFolderEntity<'file' | 'folder'>[]): boolean;
/**
 * @name latestRevisionFilterForDrives is a standard JS find/filter function intended to
 * filter only the last revision of entities within an array
 *
 * @param {ArFSDriveEntity} entity the iterated entity
 * @param {number} _index the iterated index
 * @param {ArFSDriveEntity[]} allEntities the array of all entities
 * @returns {boolean}
 */
export declare function latestRevisionFilterForDrives(entity: ArFSDriveEntity, _index: number, allEntities: ArFSDriveEntity[]): boolean;
export declare function fileFilter<T extends ArFSPrivateFile | ArFSPublicFile>(entity: ArFSFileOrFolderEntity<'file' | 'folder'>): entity is T;
export declare function folderFilter<T extends ArFSPublicFolder | ArFSPrivateFolder>(entity: ArFSFileOrFolderEntity<'file' | 'folder'>): entity is T;

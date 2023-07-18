import { EntityType } from '../types';
import { ArFSFolderToUpload } from '../arfs/arfs_file_wrapper';
export declare const assertValidArFSFileName: (name: string) => void | Error;
export declare const assertValidArFSFolderName: (name: string) => void | Error;
export declare const assertValidArFSDriveName: (name: string) => void | Error;
export declare function assertValidArFSEntityNameFactory(entityType: EntityType): (name: string) => void | Error;
export declare function assertArFSCompliantNamesWithinFolder(rootFolder: ArFSFolderToUpload, rootFolderDestName?: string): boolean;

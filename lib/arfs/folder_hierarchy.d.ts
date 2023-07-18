import { ArFSFileOrFolderEntity } from './arfs_entities';
import { FolderID } from '../types';
export declare class FolderTreeNode {
    readonly folderId: FolderID;
    readonly parent?: FolderTreeNode;
    children: FolderTreeNode[];
    constructor(folderId: FolderID, parent?: FolderTreeNode, children?: FolderTreeNode[]);
    static fromEntity(folderEntity: ArFSFileOrFolderEntity<'folder'>): FolderTreeNode;
}
export declare class FolderHierarchy {
    private readonly folderIdToEntityMap;
    private readonly folderIdToNodeMap;
    private _rootNode?;
    constructor(folderIdToEntityMap: {
        [k: string]: ArFSFileOrFolderEntity<'folder'>;
    }, folderIdToNodeMap: {
        [k: string]: FolderTreeNode;
    });
    static newFromEntities(entities: ArFSFileOrFolderEntity<'folder'>[]): FolderHierarchy;
    private static setupNodesWithEntity;
    get rootNode(): FolderTreeNode;
    subTreeOf(folderId: FolderID, maxDepth?: number): FolderHierarchy;
    allFolderIDs(): FolderID[];
    nodeAndChildrenOf(node: FolderTreeNode, maxDepth: number): FolderTreeNode[];
    folderIdSubtreeFromFolderId(folderId: FolderID, maxDepth: number): FolderID[];
    pathToFolderId(folderId: FolderID): string;
    entityPathToFolderId(folderId: FolderID): string;
    txPathToFolderId(folderId: FolderID): string;
}

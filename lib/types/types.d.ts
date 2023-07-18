import { EntityID, Winston, FeeMultiple } from '.';
import { EntityKey } from './entity_key';
export declare const JSON_CONTENT_TYPE = "application/json";
export declare const PRIVATE_CONTENT_TYPE = "application/octet-stream";
export declare const MANIFEST_CONTENT_TYPE = "application/x.arweave-manifest+json";
export declare type PublicKey = string;
export declare type NetworkReward = Winston;
export declare type FolderID = EntityID;
export declare type FileID = EntityID;
export declare type DriveID = EntityID;
export declare type AnyEntityID = DriveID | FolderID | FileID;
export declare type EntityIDTypeForEntityType<T extends 'file' | 'folder'> = T extends 'file' ? FileID : FolderID;
export declare type CipherIV = string;
export declare type DriveKey = EntityKey;
export declare type FileKey = EntityKey;
export declare type DataContentType = string;
export declare type SourceUri = string;
export declare type EntityName = string;
export declare type JsonSerializable = string | number | boolean | null | {
    [member: string]: JsonSerializable;
} | JsonSerializable[];
/** Data JSON of a MetaData Transaction */
export declare type EntityMetaDataTransactionData = Record<string, JsonSerializable>;
export interface ArDriveCommunityTip {
    tipPercentage: number;
    minWinstonFee: Winston;
}
export declare type TipType = 'data upload';
export declare type GQLCursor = string;
export declare type RewardSettings = {
    reward?: Winston;
    feeMultiple?: FeeMultiple;
};
declare type Omit<T, K> = Pick<T, Exclude<keyof T, K>>;
export declare type MakeOptional<T, K> = Omit<T, K> & Partial<T>;
export declare type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
export {};

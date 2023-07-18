import { ArweaveAddress, TransactionID, GQLQueryTagInterface } from '../types';
export declare type GQLQuery = {
    query: string;
};
export declare const ASCENDING_ORDER = "HEIGHT_ASC";
export declare const DESCENDING_ORDER = "HEIGHT_DESC";
declare type Sort = typeof ASCENDING_ORDER | typeof DESCENDING_ORDER;
export interface BuildGQLQueryParams {
    tags: GQLQueryTagInterface[];
    cursor?: string;
    owner?: ArweaveAddress;
    sort?: Sort;
    ids?: TransactionID[];
}
/**
 * Builds a GraphQL query which will only return the latest result
 *
 * TODO: Add parameters and support for all possible upcoming GQL queries
 *
 * @example
 * const query = buildQuery([{ name: 'Folder-Id', value: folderId }]);
 */
export declare function buildQuery({ tags, cursor, owner, sort, ids }: BuildGQLQueryParams): GQLQuery;
export {};

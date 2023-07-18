import { EntityMetaDataTransactionData, JsonSerializable } from './types';
export declare const invalidCustomMetaDataGqlTagErrorMessage: string;
export declare const invalidCustomDataGqlTagErrorMessage: string;
export declare const invalidCustomMetaDataJsonErrorMessage: string;
export declare const invalidCustomMetaDataErrorMessage: string;
export declare type CustomMetaDataGqlTags = Record<string, string | string[]>;
export declare type CustomMetaDataJsonFields = EntityMetaDataTransactionData;
export declare type CustomMetaDataTagInterface = CustomMetaDataGqlTags;
export interface CustomMetaData {
    /** Include custom metadata on MetaData Tx Data JSON */
    metaDataJson?: CustomMetaDataJsonFields;
    /** Include custom metadata on MetaData Tx GQL Tags */
    metaDataGqlTags?: CustomMetaDataGqlTags;
    /** Include custom metadata on File Data Tx GQL Tags */
    dataGqlTags?: CustomMetaDataTagInterface;
}
export declare function isCustomMetaDataJsonFields(customDataJson: unknown): customDataJson is CustomMetaDataJsonFields;
/** Type guard that checks if the provided JSON will parse */
export declare function isJsonSerializable(json: unknown): json is JsonSerializable;
/**
 * Type guard that checks for Record<string, string | string[]> shape and
 * asserts that each key and value string has at least one character
 */
export declare function isCustomMetaDataGqlTags(customGqlTags: unknown): customGqlTags is CustomMetaDataGqlTags;
/** Type guard that checks the shape of a CustomMetaData input object */
export declare function isCustomMetaData(tags: unknown): tags is CustomMetaData;
export declare function assertCustomMetaDataGqlTags(tags: unknown): tags is CustomMetaDataGqlTags;
export declare function assertCustomMetaDataJsonFields(tags: unknown): tags is CustomMetaDataJsonFields;
export declare function assertCustomMetaData(tags: unknown): tags is CustomMetaData;

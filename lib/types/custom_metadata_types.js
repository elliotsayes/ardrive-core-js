"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertCustomMetaData = exports.assertCustomMetaDataJsonFields = exports.assertCustomMetaDataGqlTags = exports.isCustomMetaData = exports.isCustomMetaDataGqlTags = exports.isJsonSerializable = exports.isCustomMetaDataJsonFields = exports.invalidCustomMetaDataErrorMessage = exports.invalidCustomMetaDataJsonErrorMessage = exports.invalidCustomDataGqlTagErrorMessage = exports.invalidCustomMetaDataGqlTagErrorMessage = void 0;
const arfs_tag_settings_1 = require("../arfs/arfs_tag_settings");
const invalidSchemaErrorMessage = `Invalid custom metadata schema. Please submit a valid JSON object with an example shape of `;
const customMetaDataGqlTagShapeOne = '{ "TAG_NAME": "TAG_VALUE" }';
const customMetaDataGqlTagShapeTwo = '{ "TAG_NAME": ["VAL 1", "VAL 2" ] }';
const customMetaDataJsonShape = '{ "TAG_NAME": { "Any": [ "Valid", "JSON" ] } }';
const customMetaDataShape = `{ metaDataJson?: ${customMetaDataGqlTagShapeOne}, metaDataGql?: ${customMetaDataGqlTagShapeTwo}, dataGqlTags?: ${customMetaDataGqlTagShapeTwo} }`;
exports.invalidCustomMetaDataGqlTagErrorMessage = `${invalidSchemaErrorMessage}${customMetaDataGqlTagShapeOne} or ${customMetaDataGqlTagShapeTwo}`;
exports.invalidCustomDataGqlTagErrorMessage = `${invalidSchemaErrorMessage}${customMetaDataGqlTagShapeOne} or ${customMetaDataGqlTagShapeTwo}`;
exports.invalidCustomMetaDataJsonErrorMessage = `${invalidSchemaErrorMessage}${customMetaDataJsonShape}`;
exports.invalidCustomMetaDataErrorMessage = `${invalidSchemaErrorMessage}${customMetaDataShape}`;
function isCustomMetaDataJsonFields(customDataJson) {
    return isJsonSerializable(customDataJson);
}
exports.isCustomMetaDataJsonFields = isCustomMetaDataJsonFields;
/** Type guard that checks if the provided JSON will parse */
function isJsonSerializable(json) {
    try {
        JSON.parse(JSON.stringify(json));
    }
    catch (_a) {
        return false;
    }
    return true;
}
exports.isJsonSerializable = isJsonSerializable;
/**
 * Type guard that checks for Record<string, string | string[]> shape and
 * asserts that each key and value string has at least one character
 */
function isCustomMetaDataGqlTags(customGqlTags) {
    if (typeof customGqlTags !== 'object' || customGqlTags === null) {
        return false;
    }
    for (const [name, value] of Object.entries(customGqlTags)) {
        // prettier-ignore
        if (arfs_tag_settings_1.ArFSTagSettings.protectedArFSGqlTagNames.includes(name)) {
            console.error(`Provided custom metadata GQL tag name collides with a protected ArFS protected tag: ${name}`);
            return false;
        }
        if (typeof value === 'string') {
            assertCharacterLength(value);
            continue;
        }
        if (!Array.isArray(value)) {
            return false;
        }
        for (const item of value) {
            if (typeof item !== 'string') {
                return false;
            }
            assertCharacterLength(item);
        }
    }
    return true;
}
exports.isCustomMetaDataGqlTags = isCustomMetaDataGqlTags;
function assertCharacterLength(value) {
    if (value.length === 0) {
        throw Error('Metadata string must be at least one character!');
    }
}
/** Type guard that checks the shape of a CustomMetaData input object */
function isCustomMetaData(tags) {
    if (typeof tags !== 'object' || tags === null) {
        return false;
    }
    for (const [key, metaData] of Object.entries(tags)) {
        switch (key) {
            case 'metaDataJson':
                if (!isCustomMetaDataJsonFields(metaData)) {
                    return false;
                }
                break;
            case 'metaDataGqlTags':
            case 'dataGqlTags':
                if (!isCustomMetaDataGqlTags(metaData)) {
                    return false;
                }
                break;
            default:
                break;
        }
    }
    return true;
}
exports.isCustomMetaData = isCustomMetaData;
function assertCustomMetaDataGqlTags(tags) {
    if (!isCustomMetaDataGqlTags(tags)) {
        throw Error(exports.invalidCustomMetaDataGqlTagErrorMessage);
    }
    return true;
}
exports.assertCustomMetaDataGqlTags = assertCustomMetaDataGqlTags;
function assertCustomMetaDataJsonFields(tags) {
    if (!isCustomMetaDataJsonFields(tags)) {
        throw Error(exports.invalidCustomMetaDataJsonErrorMessage);
    }
    return true;
}
exports.assertCustomMetaDataJsonFields = assertCustomMetaDataJsonFields;
function assertCustomMetaData(tags) {
    if (!isCustomMetaData(tags)) {
        // TODO: throw the error for data ones as well.
        throw Error(exports.invalidCustomMetaDataErrorMessage);
    }
    return true;
}
exports.assertCustomMetaData = assertCustomMetaData;

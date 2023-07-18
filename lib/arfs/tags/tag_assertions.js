"use strict";
// Tag Limits to be in compliance with ANS-104:
Object.defineProperty(exports, "__esModule", { value: true });
const types_1 = require("../../types");
// https://github.com/joshbenaron/arweave-standards/blob/ans104/ans/ANS-104.md#21-verifying-a-dataitem
const MAX_TAG_LIMIT = 128;
const TAG_NAME_BYTE_LIMIT = 1024;
const TAG_VALUE_BYTE_LIMIT = 3072;
const TAG_KEY_LIMIT = 2;
/** Layer 1 transaction total byte limit on gql tags */
const GQL_TAGS_TOTAL_BYTE_LIMIT = 2048;
class TagAssertions {
    assertTagLimits(tags) {
        if (tags.length > MAX_TAG_LIMIT) {
            throw new Error(`Amount of GQL Tags (${tags.length}) exceeds the maximum limit allowed (${MAX_TAG_LIMIT})!`);
        }
        for (const tag of tags) {
            if (Object.keys(tag).length > TAG_KEY_LIMIT) {
                throw new Error('GQL tag has too many keys, tags must only have "name" and "value" fields!');
            }
            if (tag.name.length > TAG_NAME_BYTE_LIMIT) {
                throw new Error(`GQL tag "name" field byte size (${tag.name.length}) has exceeded the maximum byte limit allowed of ${TAG_NAME_BYTE_LIMIT}!`);
            }
            if (tag.value.length > TAG_VALUE_BYTE_LIMIT) {
                throw new Error(`GQL tag "value" field byte size (${tag.value.length}) has exceeded the maximum byte limit allowed of ${TAG_VALUE_BYTE_LIMIT}!`);
            }
            if (tag.name.length < 1 || typeof tag.name !== 'string') {
                throw new Error('GQL tag "name" must be a non-empty string!');
            }
            if (tag.value.length < 1 || typeof tag.value !== 'string') {
                throw new Error('GQL tag "value" must be a non-empty string!');
            }
            this.assertTagByteLimit(tags);
        }
    }
    assertTagByteLimit(tags) {
        let tagsByteCount = new types_1.ByteCount(0);
        for (const tag of tags) {
            const nameLength = tag.name.length;
            const valueLength = tag.value.length;
            const tagLength = new types_1.ByteCount(nameLength + valueLength);
            tagsByteCount = tagsByteCount.plus(tagLength);
        }
        if (+tagsByteCount > GQL_TAGS_TOTAL_BYTE_LIMIT) {
            throw Error(`Transaction has ${tagsByteCount} bytes of GQL tags! This exceeds the tag limit of ${GQL_TAGS_TOTAL_BYTE_LIMIT} bytes.`);
        }
    }
}
function assertTagLimits(tags) {
    new TagAssertions().assertTagLimits(tags);
}
exports.default = assertTagLimits;

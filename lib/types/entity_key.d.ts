/// <reference types="node" />
export declare class EntityKey {
    readonly keyData: Buffer;
    constructor(keyData: Buffer);
    toString(): string;
    toJSON(): string;
}

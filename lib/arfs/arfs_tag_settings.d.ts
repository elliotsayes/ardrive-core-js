import { GQLTagInterface, FeeMultiple, TipType, DataContentType } from '../types';
interface ArFSTagSettingsParams {
    appName?: string;
    appVersion?: string;
    arFSVersion?: string;
}
export declare class ArFSTagSettings {
    private readonly appName;
    private readonly appVersion;
    private readonly arFSVersion;
    static protectedArFSGqlTagNames: ("Content-Type" | "Cipher" | "Cipher-IV" | "ArFS" | "Tip-Type" | "Boost" | "Bundle-Format" | "Bundle-Version" | "Entity-Type" | "Unix-Time" | "Drive-Id" | "Folder-Id" | "File-Id" | "Parent-Folder-Id" | "Drive-Privacy" | "Drive-Auth-Mode")[];
    constructor({ appName, appVersion, arFSVersion }: ArFSTagSettingsParams);
    get baseAppTags(): GQLTagInterface[];
    getBoostTags(feeMultiple: FeeMultiple): GQLTagInterface[];
    getTipTags(tipType?: TipType): GQLTagInterface[];
    get baseArFSTags(): GQLTagInterface[];
    get baseBundleTags(): GQLTagInterface[];
    /** @deprecated Used for the deprecated flow of sending a separate community tip tx */
    getTipTagsWithAppTags(): GQLTagInterface[];
    /**
     * Used for estimating byte count of data items to bypass storing the Buffer from ArFSFileDataPrototype
     *
     * TODO: Don't use the file data Buffer in ArFSFileDataPrototype so it can be used in estimation without memory concerns
     */
    getFileDataItemTags(isPrivate: boolean, dataContentType: DataContentType): GQLTagInterface[];
}
export {};

import { FeeMultiple, GQLTagInterface } from '../../exports';
import { ArFSEntityMetaDataPrototype, ArFSFileDataPrototype, ArFSObjectMetadataPrototype } from '../tx/arfs_prototypes';
import { ArFSTagSettings } from '../arfs_tag_settings';
interface WithPrototype<T extends ArFSObjectMetadataPrototype> {
    arFSPrototype: T;
}
interface WithFeeMultiple {
    feeMultiple?: FeeMultiple;
}
interface WithTipBoolean {
    shouldAddTipTag?: boolean;
}
declare type AssembleBundleTagsParams = WithFeeMultiple & WithTipBoolean;
declare type AssembleFileDataTagsParams = WithPrototype<ArFSFileDataPrototype> & WithFeeMultiple & WithTipBoolean;
declare type AssembleMetaDataTagsParams = WithPrototype<ArFSEntityMetaDataPrototype> & WithFeeMultiple;
export declare class ArFSTagAssembler {
    private readonly arFSTagSettings;
    constructor(arFSTagSettings: ArFSTagSettings);
    assembleBundleTags({ feeMultiple, shouldAddTipTag }: AssembleBundleTagsParams): GQLTagInterface[];
    assembleArFSFileDataTags({ arFSPrototype, feeMultiple, shouldAddTipTag }: AssembleFileDataTagsParams): GQLTagInterface[];
    assembleArFSMetaDataGqlTags({ arFSPrototype, feeMultiple }: AssembleMetaDataTagsParams): GQLTagInterface[];
    private assembleTags;
    private getBoostTags;
    private getTipTags;
}
export {};

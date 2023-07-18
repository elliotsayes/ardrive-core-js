"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxPreparer = void 0;
const arbundles_1 = require("arbundles");
const signing_1 = require("arbundles/src/signing");
const tx_attributes_1 = require("./tx_attributes");
class TxPreparer {
    constructor({ arweave, wallet, arFSTagAssembler }) {
        this.arweave = arweave;
        this.wallet = wallet;
        this.tagAssembler = arFSTagAssembler;
        this.signer = new signing_1.ArweaveSigner(this.wallet.getPrivateKey());
    }
    prepareFileDataDataItem({ objectMetaData }) {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = this.tagAssembler.assembleArFSFileDataTags({ arFSPrototype: objectMetaData });
            return this.prepareAndSignDataItem(objectMetaData.objectData, tags);
        });
    }
    prepareMetaDataDataItem({ objectMetaData }) {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = this.tagAssembler.assembleArFSMetaDataGqlTags({ arFSPrototype: objectMetaData });
            return this.prepareAndSignDataItem(objectMetaData.objectData, tags);
        });
    }
    prepareAndSignDataItem(objectData, tags) {
        return __awaiter(this, void 0, void 0, function* () {
            const signer = this.signer;
            const dataItem = arbundles_1.createData(objectData.asTransactionData(), signer, { tags });
            yield dataItem.sign(signer);
            return dataItem;
        });
    }
    prepareBundleTx({ dataItems, communityTipSettings, rewardSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            const bundle = yield arbundles_1.bundleAndSignData(dataItems, this.signer);
            // Release dataItems from memory
            dataItems = [];
            // Verify the bundle and dataItems
            if (!(yield bundle.verify())) {
                throw new Error('Bundle format could not be verified!');
            }
            const tags = this.tagAssembler.assembleBundleTags({
                feeMultiple: rewardSettings.feeMultiple,
                shouldAddTipTag: !!communityTipSettings
            });
            return this.prepareTx({
                data: bundle.getRaw(),
                rewardSettings,
                communityTipSettings,
                tags
            });
        });
    }
    prepareFileDataTx({ objectMetaData, rewardSettings, communityTipSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = this.tagAssembler.assembleArFSFileDataTags({
                arFSPrototype: objectMetaData,
                feeMultiple: rewardSettings.feeMultiple,
                shouldAddTipTag: !!communityTipSettings
            });
            return this.prepareTx({
                data: objectMetaData.objectData.asTransactionData(),
                rewardSettings,
                communityTipSettings,
                tags
            });
        });
    }
    prepareMetaDataTx({ objectMetaData, rewardSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            const tags = this.tagAssembler.assembleArFSMetaDataGqlTags({
                arFSPrototype: objectMetaData,
                feeMultiple: rewardSettings.feeMultiple
            });
            return this.prepareTx({ data: objectMetaData.objectData.asTransactionData(), tags, rewardSettings });
        });
    }
    prepareTx({ data, tags, rewardSettings, communityTipSettings }) {
        const txAttributes = new tx_attributes_1.TxAttributesToAssemble({
            data
        });
        txAttributes.addRewardSettings(rewardSettings);
        txAttributes.addCommunityTipSettings(communityTipSettings);
        return this.createAndSignTx(txAttributes, tags);
    }
    createAndSignTx(txAttributes, tags) {
        return __awaiter(this, void 0, void 0, function* () {
            const transaction = yield this.arweave.createTransaction(txAttributes.assemble(), this.wallet.getPrivateKey());
            for (const tag of tags) {
                transaction.addTag(tag.name, tag.value);
            }
            yield this.arweave.transactions.sign(transaction, this.wallet.getPrivateKey());
            return transaction;
        });
    }
}
exports.TxPreparer = TxPreparer;

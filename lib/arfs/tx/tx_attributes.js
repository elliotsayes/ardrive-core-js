"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TxAttributesToAssemble = void 0;
class TxAttributesToAssemble {
    constructor(txAttributes = {}) {
        this.txAttributes = {};
        this.txAttributes = txAttributes;
    }
    addRewardSettings({ feeMultiple, reward }) {
        if (reward) {
            if (feeMultiple === null || feeMultiple === void 0 ? void 0 : feeMultiple.wouldBoostReward()) {
                this.txAttributes.reward = `${feeMultiple.boostedWinstonReward(reward)}`;
            }
            else {
                this.txAttributes.reward = reward.toString();
            }
        }
    }
    addCommunityTipSettings(communityTipSettings) {
        if (communityTipSettings) {
            this.txAttributes.target = `${communityTipSettings.communityTipTarget}`;
            this.txAttributes.quantity = `${communityTipSettings.communityWinstonTip}`;
        }
    }
    assemble() {
        // TODO: Use a mock arweave server instead
        if (process.env.NODE_ENV === 'test') {
            this.txAttributes.last_tx = 'STUB';
        }
        return this.txAttributes;
    }
}
exports.TxAttributesToAssemble = TxAttributesToAssemble;

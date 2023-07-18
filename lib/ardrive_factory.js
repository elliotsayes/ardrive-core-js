"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.arDriveAnonymousFactory = exports.arDriveFactory = void 0;
const arweave_1 = __importDefault(require("arweave"));
const ardrive_community_oracle_1 = require("./community/ardrive_community_oracle");
const arfsdao_1 = require("./arfs/arfsdao");
const arfsdao_anonymous_1 = require("./arfs/arfsdao_anonymous");
const constants_1 = require("./utils/constants");
const ardrive_1 = require("./ardrive");
const ardrive_anonymous_1 = require("./ardrive_anonymous");
const types_1 = require("./types");
const wallet_dao_1 = require("./wallet_dao");
const arfs_upload_planner_1 = require("./arfs/arfs_upload_planner");
const arfs_tag_settings_1 = require("./arfs/arfs_tag_settings");
const ar_data_price_network_estimator_1 = require("./pricing/ar_data_price_network_estimator");
const gateway_oracle_1 = require("./pricing/gateway_oracle");
const common_1 = require("./utils/common");
const arfs_cost_calculator_1 = require("./arfs/arfs_cost_calculator");
const defaultArweave = arweave_1.default.init({
    host: constants_1.defaultGatewayHost,
    port: constants_1.defaultGatewayPort,
    protocol: constants_1.defaultGatewayProtocol,
    timeout: 600000
});
function arDriveFactory({ wallet, arweave = defaultArweave, priceEstimator = new ar_data_price_network_estimator_1.ARDataPriceNetworkEstimator(new gateway_oracle_1.GatewayOracle(common_1.gatewayUrlForArweave(arweave))), communityOracle = new ardrive_community_oracle_1.ArDriveCommunityOracle(arweave), dryRun = false, feeMultiple = new types_1.FeeMultiple(1.0), appName = constants_1.DEFAULT_APP_NAME, appVersion = constants_1.DEFAULT_APP_VERSION, walletDao = new wallet_dao_1.WalletDAO(arweave, appName, appVersion), shouldBundle = true, arFSTagSettings = new arfs_tag_settings_1.ArFSTagSettings({ appName, appVersion }), uploadPlanner = new arfs_upload_planner_1.ArFSUploadPlanner({
    shouldBundle,
    arFSTagSettings
}), costCalculator = new arfs_cost_calculator_1.ArFSCostCalculator({ priceEstimator, communityOracle, feeMultiple }), arfsDao = new arfsdao_1.ArFSDAO(wallet, arweave, dryRun, appName, appVersion, arFSTagSettings) }) {
    return new ardrive_1.ArDrive(wallet, walletDao, arfsDao, communityOracle, appName, appVersion, priceEstimator, feeMultiple, dryRun, arFSTagSettings, uploadPlanner, costCalculator);
}
exports.arDriveFactory = arDriveFactory;
function arDriveAnonymousFactory({ arweave = defaultArweave }) {
    return new ardrive_anonymous_1.ArDriveAnonymous(new arfsdao_anonymous_1.ArFSDAOAnonymous(arweave));
}
exports.arDriveAnonymousFactory = arDriveAnonymousFactory;

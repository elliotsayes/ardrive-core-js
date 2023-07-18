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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertDataRootsMatch = exports.rePrepareV2Tx = void 0;
const transaction_1 = __importDefault(require("arweave/node/lib/transaction"));
function rePrepareV2Tx(transaction, fileData) {
    return __awaiter(this, void 0, void 0, function* () {
        transaction = new transaction_1.default(transaction);
        transaction.data = fileData;
        yield transaction.prepareChunks(fileData);
        return transaction;
    });
}
exports.rePrepareV2Tx = rePrepareV2Tx;
function assertDataRootsMatch(transaction, dataRootFromGateway) {
    if (transaction.data_root !== dataRootFromGateway) {
        throw Error(`Provided file's data does not match the "data_root" field on transaction with id: ${transaction.id}!`);
    }
}
exports.assertDataRootsMatch = assertDataRootsMatch;

/// <reference types="node" />
import Transaction from 'arweave/node/lib/transaction';
export declare function rePrepareV2Tx(transaction: Transaction, fileData: Buffer): Promise<Transaction>;
export declare function assertDataRootsMatch(transaction: Transaction, dataRootFromGateway: string): void;

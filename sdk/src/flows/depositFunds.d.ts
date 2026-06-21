import { Transaction } from "@mysten/sui/transactions";
export declare function depositFundsPTB(tx: Transaction, packageId: string, input: {
    vaultId: string;
    amount: number;
}): void;

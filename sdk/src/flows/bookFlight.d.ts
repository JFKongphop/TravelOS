import { Transaction } from "@mysten/sui/transactions";
export declare function bookFlightPTB(tx: Transaction, packageId: string, sender: string, input: {
    vaultId: string;
    planId: string;
    provider: string;
    amount: number;
}): void;

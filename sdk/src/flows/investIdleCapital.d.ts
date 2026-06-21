import { Transaction } from "@mysten/sui/transactions";
export declare function investIdleCapitalPTB(tx: Transaction, packageId: string, input: {
    vaultId: string;
    amount: number;
    protocol: string;
}): void;

import { Transaction } from "@mysten/sui/transactions";
export declare function createTripPTB(tx: Transaction, packageId: string, sender: string, input: {
    destination: string;
    startDate: number;
    endDate: number;
    totalBudget: number;
}): void;

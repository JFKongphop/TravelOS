import { Transaction } from "@mysten/sui/transactions";
import type { TravelOSConfig } from "./types.js";
export declare class TravelOSClient {
    readonly packageId: string;
    readonly network: "mainnet" | "testnet";
    constructor(config: TravelOSConfig);
    buildTx(): Transaction;
    createTrip(sender: string, input: {
        destination: string;
        startDate: number;
        endDate: number;
        totalBudget: number;
    }): Transaction;
    depositFunds(input: {
        vaultId: string;
        amount: number;
    }): Transaction;
    investIdleCapital(input: {
        vaultId: string;
        amount: number;
        protocol: string;
    }): Transaction;
    prepareForDeparture(input: {
        vaultId: string;
        positionId: string;
    }): Transaction;
    bookHotel(sender: string, input: {
        vaultId: string;
        planId: string;
        provider: string;
        amount: number;
    }): Transaction;
    bookFlight(sender: string, input: {
        vaultId: string;
        planId: string;
        provider: string;
        amount: number;
    }): Transaction;
    cancelBooking(input: {
        reservationId: string;
        vaultId: string;
        amount: number;
    }): Transaction;
    completeTrip(input: {
        vaultId: string;
    }): Transaction;
}
export declare function createClient(config: TravelOSConfig): TravelOSClient;

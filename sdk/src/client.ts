import { Transaction } from "@mysten/sui/transactions";
import type { TravelOSConfig } from "./types.js";
import {
  createTripPTB,
  depositFundsPTB,
  investIdleCapitalPTB,
  prepareForDeparturePTB,
  bookHotelPTB,
  bookFlightPTB,
  cancelBookingPTB,
  completeTripPTB,
} from "./flows/index.js";

export class TravelOSClient {
  readonly packageId: string;
  readonly network: "mainnet" | "testnet";

  constructor(config: TravelOSConfig) {
    this.packageId = config.packageId;
    this.network = config.network;
  }

  buildTx(): Transaction {
    return new Transaction();
  }

  createTrip(
    sender: string,
    input: { destination: string; startDate: number; endDate: number; totalBudget: number },
  ) {
    const tx = this.buildTx();
    createTripPTB(tx, this.packageId, sender, input);
    return tx;
  }

  depositFunds(input: { vaultId: string; amount: number }) {
    const tx = this.buildTx();
    depositFundsPTB(tx, this.packageId, input);
    return tx;
  }

  investIdleCapital(input: { vaultId: string; amount: number; protocol: string }) {
    const tx = this.buildTx();
    investIdleCapitalPTB(tx, this.packageId, input);
    return tx;
  }

  prepareForDeparture(input: { vaultId: string; positionId: string }) {
    const tx = this.buildTx();
    prepareForDeparturePTB(tx, this.packageId, input);
    return tx;
  }

  bookHotel(
    sender: string,
    input: { vaultId: string; planId: string; provider: string; amount: number },
  ) {
    const tx = this.buildTx();
    bookHotelPTB(tx, this.packageId, sender, input);
    return tx;
  }

  bookFlight(
    sender: string,
    input: { vaultId: string; planId: string; provider: string; amount: number },
  ) {
    const tx = this.buildTx();
    bookFlightPTB(tx, this.packageId, sender, input);
    return tx;
  }

  cancelBooking(input: { reservationId: string; vaultId: string; amount: number }) {
    const tx = this.buildTx();
    cancelBookingPTB(tx, this.packageId, input);
    return tx;
  }

  completeTrip(input: { vaultId: string }) {
    const tx = this.buildTx();
    completeTripPTB(tx, this.packageId, input);
    return tx;
  }
}

export function createClient(config: TravelOSConfig): TravelOSClient {
  return new TravelOSClient(config);
}

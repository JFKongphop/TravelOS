export interface TravelOSConfig {
    packageId: string;
    network: "mainnet" | "testnet";
}
export interface BudgetItem {
    category: number;
    amount: number;
    label: string;
}
export interface CreateTripInput {
    destination: string;
    startDate: number;
    endDate: number;
    totalBudget: number;
    budgetItems: BudgetItem[];
}
export interface CreateTripOutput {
    planId: string;
    vaultId: string;
}
export interface DepositFundsInput {
    vaultId: string;
    amount: number;
}
export interface InvestIdleCapitalInput {
    vaultId: string;
    amount: number;
    protocol: string;
}
export interface InvestIdleCapitalOutput {
    positionId: string;
}
export interface PrepareForDepartureInput {
    vaultId: string;
}
export interface BookHotelInput {
    vaultId: string;
    provider: string;
    amount: number;
}
export interface BookFlightInput {
    vaultId: string;
    provider: string;
    amount: number;
}
export interface BookingOutput {
    reservationId: string;
    receiptId: string;
}
export interface CancelBookingInput {
    reservationId: string;
    vaultId: string;
}
export interface CancelBookingOutput {
    refunded: boolean;
    reservationStatus: string;
}
export interface CompleteTripInput {
    vaultId: string;
}

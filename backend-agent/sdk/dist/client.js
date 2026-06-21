import { Transaction } from "@mysten/sui/transactions";
import { createTripPTB, depositFundsPTB, investIdleCapitalPTB, prepareForDeparturePTB, bookHotelPTB, bookFlightPTB, cancelBookingPTB, completeTripPTB, } from "./flows/index.js";
export class TravelOSClient {
    constructor(config) {
        this.packageId = config.packageId;
        this.network = config.network;
    }
    buildTx() {
        return new Transaction();
    }
    createTrip(sender, input) {
        const tx = this.buildTx();
        createTripPTB(tx, this.packageId, sender, input);
        return tx;
    }
    depositFunds(input) {
        const tx = this.buildTx();
        depositFundsPTB(tx, this.packageId, input);
        return tx;
    }
    investIdleCapital(sender, input) {
        const tx = this.buildTx();
        investIdleCapitalPTB(tx, this.packageId, sender, input);
        return tx;
    }
    prepareForDeparture(input) {
        const tx = this.buildTx();
        prepareForDeparturePTB(tx, this.packageId, input);
        return tx;
    }
    bookHotel(sender, input) {
        const tx = this.buildTx();
        bookHotelPTB(tx, this.packageId, sender, input);
        return tx;
    }
    bookFlight(sender, input) {
        const tx = this.buildTx();
        bookFlightPTB(tx, this.packageId, sender, input);
        return tx;
    }
    cancelBooking(input) {
        const tx = this.buildTx();
        cancelBookingPTB(tx, this.packageId, input);
        return tx;
    }
    completeTrip(input) {
        const tx = this.buildTx();
        completeTripPTB(tx, this.packageId, input);
        return tx;
    }
}
export function createClient(config) {
    return new TravelOSClient(config);
}
//# sourceMappingURL=client.js.map
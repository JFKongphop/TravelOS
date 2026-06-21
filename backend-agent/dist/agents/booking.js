export class BookingAgent {
    plan(blueprint) {
        const flight = {
            airline: "Mock Airlines",
            price: blueprint.budgetAllocation.flight,
            departure: "2026-07-01",
            arrival: "2026-07-01",
        };
        const hotel = blueprint.hotels[0];
        return {
            flight,
            hotel,
            totalCost: flight.price + (hotel.pricePerNight * blueprint.duration),
        };
    }
}
//# sourceMappingURL=booking.js.map
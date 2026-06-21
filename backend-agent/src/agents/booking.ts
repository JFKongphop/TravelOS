import type { BookingPlan, TravelBlueprint, FlightOption, HotelOption } from "../types.js";

export class BookingAgent {
  plan(blueprint: TravelBlueprint): BookingPlan {
    const flight: FlightOption = {
      airline: "Mock Airlines",
      price: blueprint.budgetAllocation.flight,
      departure: "2026-07-01",
      arrival: "2026-07-01",
    };

    const hotel: HotelOption = blueprint.hotels[0];

    return {
      flight,
      hotel,
      totalCost: flight.price + (hotel.pricePerNight * blueprint.duration),
    };
  }
}

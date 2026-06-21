import type { RiskResult, RiskContext } from "../types.js";

export class RiskAgent {
  assess(context: RiskContext): RiskResult {
    const reasons: string[] = [];
    const { blueprint, treasuryPlan, bookingPlan } = context;

    // Rule 1: Budget check
    if (bookingPlan.totalCost > blueprint.budget) {
      reasons.push(`Booking cost ($${bookingPlan.totalCost}) exceeds budget ($${blueprint.budget})`);
    }

    // Rule 2: Liquidity rule
    const departDays = Math.floor(
      (new Date("2026-07-01").getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (departDays <= 3 && treasuryPlan.investAmount > 0) {
      reasons.push("Cannot invest within 72 hours of departure");
    }

    // Rule 3: Hotel budget check
    if (bookingPlan.hotel) {
      const hotelTotal = bookingPlan.hotel.pricePerNight * blueprint.duration;
      if (hotelTotal > blueprint.budgetAllocation.hotel * 1.2) {
        reasons.push(`Hotel cost ($${hotelTotal}) exceeds hotel allocation ($${blueprint.budgetAllocation.hotel})`);
      }
    }

    return {
      approved: reasons.length === 0,
      reasons,
    };
  }
}

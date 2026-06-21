import { askJSON } from "../ai.js";
import { PlannerAgent } from "./planner.js";
import { TreasuryAgent } from "./treasury.js";
import { BookingAgent } from "./booking.js";
import { RiskAgent } from "./risk.js";
import { getSDK } from "../sdk.js";
export class SupervisorAgent {
    constructor() {
        this.planner = new PlannerAgent();
        this.treasury = new TreasuryAgent();
        this.booking = new BookingAgent();
        this.risk = new RiskAgent();
    }
    async handle(input) {
        const logs = [];
        // Parse user intent via AI
        const parsed = await this.parseMessage(input.message);
        const ctx = {
            userId: "user-1",
            destination: parsed.destination,
            budget: parsed.budget,
            duration: parsed.duration,
        };
        // 1. Planner (AI-powered)
        const blueprint = await this.planner.generateBlueprint({
            destination: ctx.destination,
            budget: ctx.budget,
            duration: ctx.duration,
        });
        ctx.blueprint = blueprint;
        logs.push({ agent: "planner", data: blueprint });
        // 2. Treasury (deterministic)
        const treasuryPlan = this.treasury.decide(blueprint, {
            vaultBalance: ctx.budget,
            departureDate: "2026-07-01",
            budget: ctx.budget,
        });
        ctx.treasuryPlan = treasuryPlan;
        logs.push({ agent: "treasury", data: treasuryPlan });
        // 3. Booking (mock)
        const bookingPlan = this.booking.plan(blueprint);
        ctx.bookingPlan = bookingPlan;
        logs.push({ agent: "booking", data: bookingPlan });
        // 4. Risk (deterministic)
        const riskAssessment = this.risk.assess({
            blueprint,
            treasuryPlan,
            bookingPlan,
        });
        ctx.riskResult = riskAssessment;
        logs.push({ agent: "risk", data: riskAssessment });
        return {
            context: ctx,
            plan: { blueprint, treasuryStrategy: treasuryPlan, bookings: bookingPlan, riskAssessment },
            logs,
        };
    }
    async execute(action, sender, params) {
        const sdk = getSDK();
        switch (action) {
            case "createTrip": return sdk.createTrip(sender, params);
            case "depositFunds": return sdk.depositFunds(params);
            case "investIdleCapital": return sdk.investIdleCapital(params);
            case "prepareForDeparture": return sdk.prepareForDeparture(params);
            case "bookHotel": return sdk.bookHotel(sender, params);
            case "bookFlight": return sdk.bookFlight(sender, params);
            case "cancelBooking": return sdk.cancelBooking(params);
            case "completeTrip": return sdk.completeTrip(params);
            default: throw new Error(`Unknown action: ${action}`);
        }
    }
    async parseMessage(msg) {
        return askJSON(`Extract travel parameters from user messages. Output ONLY valid JSON: { "destination": string, "budget": number, "duration": number }. If unclear, use defaults: Tokyo, 2000, 7.`, msg);
    }
}
//# sourceMappingURL=supervisor.js.map
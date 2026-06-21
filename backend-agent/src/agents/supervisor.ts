import { askJSON } from "../ai.js";
import { PlannerAgent } from "./planner.js";
import { TreasuryAgent } from "./treasury.js";
import { BookingAgent } from "./booking.js";
import { RiskAgent } from "./risk.js";
import { getSDK } from "../sdk.js";
import { uploadToWalrus, walrusUrl } from "../walrus.js";
import type { ExecutionPlan, TravelContext, AgentResponse, ActionStep, FullTripPlan } from "../types.js";

export class SupervisorAgent {
  private planner = new PlannerAgent();
  private treasury = new TreasuryAgent();
  private booking = new BookingAgent();
  private risk = new RiskAgent();

  // Store last assessment for risk-gating execution
  private lastRiskResult: { approved: boolean; reasons: string[] } | null = null;

  getPlanner() { return this.planner; }

  async handle(input: { message: string }): Promise<{
    context: TravelContext; plan: ExecutionPlan; logs: AgentResponse[];
    walrus: { blobId: string | null; url: string }; markdown: string;
  }> {
    const logs: AgentResponse[] = [];

    const parsed = await this.parseMessage(input.message);
    const ctx: TravelContext = {
      userId: "user-1",
      destination: parsed.destination,
      budget: parsed.budget,
      duration: parsed.duration,
    };

    const blueprint = await this.planner.generateBlueprint({
      destination: ctx.destination, budget: ctx.budget, duration: ctx.duration,
    });
    ctx.blueprint = blueprint;
    logs.push({ agent: "planner", data: blueprint });

    const md = this.planner.toMarkdown(blueprint);
    const blobId = await uploadToWalrus(new TextEncoder().encode(md));
    const url = blobId ? walrusUrl(blobId) : "";
    logs.push({ agent: "walrus", data: { blobId, url, stored: !!blobId } });

    const treasuryPlan = this.treasury.decide(blueprint, {
      vaultBalance: ctx.budget, departureDate: "2026-07-01", budget: ctx.budget,
    });
    ctx.treasuryPlan = treasuryPlan;
    logs.push({ agent: "treasury", data: treasuryPlan });

    const bookingPlan = this.booking.plan(blueprint);
    ctx.bookingPlan = bookingPlan;
    logs.push({ agent: "booking", data: bookingPlan });

    const riskAssessment = this.risk.assess({ blueprint, treasuryPlan, bookingPlan });
    ctx.riskResult = riskAssessment;
    this.lastRiskResult = riskAssessment;
    logs.push({ agent: "risk", data: riskAssessment });

    return {
      context: ctx,
      plan: { blueprint, treasuryStrategy: treasuryPlan, bookings: bookingPlan, riskAssessment },
      logs,
      walrus: { blobId, url },
      markdown: md,
    };
  }

  /** Full trip plan — blueprint + executable action steps */
  async fullPlan(sender: string, input: { message: string }): Promise<FullTripPlan> {
    const base = await this.handle(input);
    const bp = base.plan.blueprint;
    const ts = base.plan.treasuryStrategy;
    const bk = base.plan.bookings;

    const actions: ActionStep[] = [];

    // Step 1: Create trip on-chain
    actions.push({
      step: 1,
      name: "Create Travel Treasury",
      description: `Create ${bp.destination} trip plan + vault with $${bp.budget} budget`,
      action: "createTrip",
      params: {
        destination: bp.destination,
        startDate: Math.floor(Date.now() / 1000) + 86400,
        endDate: Math.floor(Date.now() / 1000) + 86400 * (bp.duration + 1),
        totalBudget: bp.budget,
      },
    });

    // Step 2: Deposit funds
    // Fixed demo amounts — vault gets 10000 MIST so it can cover all bookings
    const DEPOSIT_MIST = 10_000;
    const BOOKING_MIST = 100; // per booking — tiny fixed amount for testnet demo
    actions.push({
      step: 2,
      name: "Deposit Travel Funds",
      description: `Deposit $${bp.budget} into travel vault`,
      action: "depositFunds",
      params: {
        vaultId: "<resolved-after-step-1>",
        amount: DEPOSIT_MIST,
      },
    });

    // Step 3: Invest idle capital (if recommended)
    if (ts.investAmount > 0) {
      actions.push({
        step: 3,
        name: "Invest Idle Capital",
        description: `Invest $${ts.investAmount} in ${ts.protocol} (${ts.prepareLiquidityDays} days before departure)`,
        action: "investIdleCapital",
        params: {
          vaultId: "<resolved-after-step-2>",
          amount: BOOKING_MIST,
          protocol: ts.protocol,
        },
      });
    }

    // Step 4: Book hotel
    if (bk.hotel) {
      actions.push({
        step: actions.length + 1,
        name: `Book Hotel: ${bk.hotel.name}`,
        description: `Reserve ${bk.hotel.name} at $${bk.hotel.pricePerNight}/night × ${bp.duration} nights = $${bk.hotel.pricePerNight * bp.duration}`,
        action: "bookHotel",
        params: {
          vaultId: "<resolved-after-step-2>",
          planId: "<resolved-after-step-1>",
          provider: bk.hotel.name,
          amount: BOOKING_MIST,
        },
      });
    }

    // Step 5: Book flight
    if (bk.flight) {
      actions.push({
        step: actions.length + 1,
        name: `Book Flight: ${bk.flight.airline}`,
        description: `${bk.flight.airline} — $${bk.flight.price}`,
        action: "bookFlight",
        params: {
          vaultId: "<resolved-after-step-2>",
          planId: "<resolved-after-step-1>",
          provider: bk.flight.airline,
          amount: BOOKING_MIST,
        },
      });
    }

    // Step N: Complete trip
    actions.push({
      step: actions.length + 1,
      name: "Complete Trip",
      description: "Finalize trip — mark vault as completed",
      action: "completeTrip",
      params: { vaultId: "<resolved-after-prior-step>" },
    });

    const summary = `## ${bp.destination} — ${bp.duration} Days, $${bp.budget}\n\n` +
      `🏨 ${bk.hotel?.name || "TBD"} | ✈️ ${bk.flight?.airline || "TBD"}\n` +
      `💰 Invest: $${ts.investAmount} in ${ts.protocol} | Liquid: $${ts.liquidAmount}\n` +
      `📋 ${actions.length} on-chain steps | ${base.plan.riskAssessment.approved ? "✅ Approved" : "⚠️ " + base.plan.riskAssessment.reasons.join(", ")}`;

    return { ...base, actions, summary };
  }

  async execute(action: string, sender: string, params: any): Promise<any> {
    // Risk gate: block dangerous actions if risk assessment failed
    const gatedActions = ["depositFunds", "investIdleCapital", "bookHotel", "bookFlight"];
    if (gatedActions.includes(action) && this.lastRiskResult && !this.lastRiskResult.approved) {
      throw new Error(
        `Action "${action}" blocked by Risk Agent: ${this.lastRiskResult.reasons.join("; ")}`
      );
    }

    const sdk = getSDK();
    switch (action) {
      case "createTrip": return sdk.createTrip(sender, params);
      case "depositFunds": return sdk.depositFunds(params);
      case "investIdleCapital": return sdk.investIdleCapital(sender, params);
      case "prepareForDeparture": return sdk.prepareForDeparture(params);
      case "bookHotel": return sdk.bookHotel(sender, params);
      case "bookFlight": return sdk.bookFlight(sender, params);
      case "cancelBooking": return sdk.cancelBooking(params);
      case "completeTrip": return sdk.completeTrip(params);
      default: throw new Error(`Unknown action: ${action}`);
    }
  }

  private async parseMessage(msg: string): Promise<{
    destination: string; budget: number; duration: number;
  }> {
    return askJSON(
      `Extract travel parameters from user messages. Output ONLY valid JSON: { "destination": string, "budget": number, "duration": number }. If unclear, use defaults: Tokyo, 2000, 7.`,
      msg,
    );
  }
}

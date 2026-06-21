import type { TreasuryStrategy, TreasuryContext, TravelBlueprint } from "../types.js";
export declare class TreasuryAgent {
    decide(blueprint: TravelBlueprint, context: TreasuryContext): TreasuryStrategy;
}

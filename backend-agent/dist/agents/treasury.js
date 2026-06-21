export class TreasuryAgent {
    decide(blueprint, context) {
        const departureMs = new Date(context.departureDate).getTime();
        const now = Date.now();
        const daysUntilDeparture = Math.floor((departureMs - now) / (1000 * 60 * 60 * 24));
        // Policy: don't invest within 3 days of departure
        const investRatio = daysUntilDeparture > 30 ? 0.7 : daysUntilDeparture > 7 ? 0.4 : 0;
        const investAmount = Math.floor(blueprint.budget * investRatio);
        const liquidAmount = blueprint.budget - investAmount;
        return {
            investAmount,
            liquidAmount,
            protocol: "scallop",
            prepareLiquidityDays: 3,
        };
    }
}
//# sourceMappingURL=treasury.js.map
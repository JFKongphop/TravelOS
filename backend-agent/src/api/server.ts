import "dotenv/config";
import express from "express";
import cors from "cors";
import { SupervisorAgent } from "../agents/supervisor.js";

const app = express();
app.use(cors());
app.use(express.json());

const supervisor = new SupervisorAgent();

// Health
app.get("/", (_req, res) => res.json({ status: "TravelOS Agent Backend" }));

// Chat — generates execution plan + actions
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body ?? {};
    if (!message) return res.status(400).json({ error: "message required" });
    const result = await supervisor.handle({ message });
    const md = supervisor.getPlanner().toMarkdown(result.plan.blueprint);
    res.json({ ...result, markdown: md });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Full Plan — blueprint + executable action steps
// Accepts {message, sender} OR direct {destination, budget, duration, departureDate}
app.post("/api/full-plan", async (req, res) => {
  try {
    let { message, sender, destination, budget, duration } = req.body ?? {};

    // Accept direct params as an alternative to a free-text message
    if (!message && destination) {
      message = `Plan a ${duration || 7} day trip to ${destination} with a budget of $${budget || 2000}`;
    }
    if (!message) return res.status(400).json({ error: "message or destination required" });

    // sender is optional — defaults to zero address for agent-only flows
    sender = sender || "0x0000000000000000000000000000000000000000000000000000000000000000";

    const result = await supervisor.fullPlan(sender, { message });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Execute — returns serialized PTB for wallet signing
app.post("/api/execute", async (req, res) => {
  try {
    const { action, params } = req.body ?? {};
    let { sender } = req.body ?? {};
    if (!action) return res.status(400).json({ error: "action required" });

    // Default sender for PTB construction when not provided
    sender = sender || "0x0000000000000000000000000000000000000000000000000000000000000000";

    // Fixed amounts per action — never trust frontend values for amounts
    const FIXED_AMOUNTS: Record<string, number> = {
      depositFunds:       10_000, // 10,000 MIST so vault can cover all bookings
      investIdleCapital:  100,
      bookHotel:          100,
      bookFlight:         100,
    };
    const DUMMY_ID = "0x0000000000000000000000000000000000000000000000000000000000000001";
    const safeParams = {
      vaultId:     DUMMY_ID,
      planId:      DUMMY_ID,
      positionId:  DUMMY_ID,
      protocol:    "Scallop",
      provider:    "Test Provider",
      destination: "Tokyo",
      startDate:   Math.floor(Date.now() / 1000) + 86400,
      endDate:     Math.floor(Date.now() / 1000) + 86400 * 8,
      totalBudget: 2000,
      ...params,
      // Always override amount with fixed per-action value — ignores stale frontend state
      amount: FIXED_AMOUNTS[action] ?? Math.min(Number(params?.amount ?? 100), 10_000),
    };

    const tx = await supervisor.execute(action, sender, safeParams);
    // serialize() returns a JSON string — base64-encode it for transport
    const txJson: string = (tx as any).serialize();
    const txBytes = Buffer.from(txJson).toString("base64");
    res.json({ action, txBytes });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TravelOS Agent Backend running on http://localhost:${PORT}`);
});

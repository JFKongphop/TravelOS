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
app.post("/api/full-plan", async (req, res) => {
  try {
    const { message, sender } = req.body ?? {};
    if (!message) return res.status(400).json({ error: "message required" });
    if (!sender) return res.status(400).json({ error: "sender address required" });

    const result = await supervisor.fullPlan(sender, { message });
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Execute — returns serialized PTB for wallet signing
app.post("/api/execute", async (req, res) => {
  try {
    const { action, sender, params } = req.body ?? {};
    if (!action) return res.status(400).json({ error: "action required" });

    const tx = await supervisor.execute(action, sender || "", params || {});
    // Serialize the transaction so the frontend can sign + submit via wallet
    const txBytes = (tx as any).serialize?.() ?? new Uint8Array();
    const txBase64 = Buffer.from(txBytes).toString("base64");
    res.json({ action, txBytes: txBase64 });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`TravelOS Agent Backend running on http://localhost:${PORT}`);
});

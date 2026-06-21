## TravelOS — AI-Powered Autonomous Travel Treasury

TravelOS combines multi-agent planning, programmable payments, and DeFi capital management to transform travel savings into an autonomous financial workflow powered by Sui programmable transaction blocks.

---

## The Problem

Most people saving for a trip do this:

1. Put money in a bank account (earning ~0%)
2. Wait weeks or months before the trip
3. Manually book hotel (one site)
4. Manually book flight (another site)
5. Hope the refund works if something cancels
6. Leave unspent travel money sitting idle forever

**What's wrong with this:**

| Problem | Impact |
|---|---|
| Idle savings earn nothing | $2,000 held for 3 months = lost yield opportunity |
| No commitment proof | Nothing on-chain proves your funds are reserved for this trip |
| Refunds go to intermediaries | Cancellation refunds are controlled by Booking.com / Expedia, not you |
| No automation | Every payment action requires human coordination |
| No audit trail | You have no cryptographic proof of what you spent and where |

**TravelOS solves every one of these with programmable on-chain contracts.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│              Next.js 15 · @mysten/dapp-kit · Sui Wallet         │
└─────────────────────────────┬───────────────────────────────────┘
                              │ REST API (JSON)
┌─────────────────────────────▼───────────────────────────────────┐
│                       AI AGENT LAYER                            │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌────────────────┐   │
│   │ Planner  │  │ Treasury │  │ Booking │  │ Risk Assessor  │   │
│   │  Agent   │  │  Agent   │  │  Agent  │  │    Agent       │   │
│   └────┬─────┘  └────┬─────┘  └────┬────┘  └───────┬────────┘   │
│        └─────────────┴─────────────┴────────────────┘           │
│                            │                                    │
│                    ┌───────▼───────┐                            │
│                    │  Supervisor   │  ← orchestrates all agents │
│                    └───────┬───────┘                            │
│                            │ builds PTB                         │
│              Walrus (off-chain blob: travel plan JSON)          │
└────────────────────────────┬────────────────────────────────────┘
                             │ Programmable Transaction Block (PTB)
                             │ ← agent builds it, wallet signs it
┌────────────────────────────▼────────────────────────────────────┐
│                    MOVE SMART CONTRACTS                         │
│                                                                 │
│   travel::plan  ──────────────────────────────► TravelPlan      │
│   travel::vault ──────────────────────────────► TravelVault     │
│   travel::payment ────────────────────────────► PaymentIntent   │
│                                                 PaymentReceipt  │
│   travel::reservation ────────────────────────► ReservationNFT  │
│   travel::yield ──────────────────────────────► YieldPosition   │
│   travel::rules ──────────────────────────────► AutomationRule  │
│                                                                 │
│              Sui Testnet · Package 0x6024...d9f1                │
└─────────────────────────────────────────────────────────────────┘
```

**Core security design:** The AI agent constructs the PTB (what to call and with what args). The user wallet reviews and signs it. **The agent never holds any private key at any point.**

---

## AI Agent Layer

The backend runs a multi-agent system where each agent has a single responsibility:

| Agent | Role | Output |
|---|---|---|
| **Planner** | Generates day-by-day travel blueprint with hotels, flights, budget breakdown | `TravelBlueprint` JSON |
| **Treasury** | Calculates yield strategy — which protocol, how much to invest, when to withdraw | `TreasuryStrategy` JSON |
| **Booking** | Selects specific hotel and flight providers with prices | `BookingPlan` JSON |
| **Risk** | Assesses financial and travel risk — blocks unsafe transactions | `RiskAssessment` JSON |
| **Supervisor** | Orchestrates all agents, applies risk gate, builds ordered action steps | `ActionPlan[]` + `PTB` |

The Supervisor applies a **risk gate** before any DeFi or booking action — if risk score is high, the action is blocked and a warning is returned.

All AI-generated plans are stored as **Walrus blobs** (decentralised storage on Sui) so the plan is permanently retrievable by blob ID even if the backend goes down.

---

## DeFi Track — Deep Dive

### Core Philosophy: Goal-Based Finance

TravelOS does **not** do yield farming for its own sake. It does **goal-based capital efficiency**:

> The user's goal is a trip to Tokyo in 90 days with a $2,000 budget.  
> The system's job is to make that $2,000 work as hard as possible until day 90, then convert it back to spending power at exactly the right moment.

This is fundamentally different from DeFi protocols that maximise APY without a redemption target.

### Vault as Treasury (`travel::vault`)

```move
public struct TravelVault has key, store {
  id: UID,
  owner: address,
  balance: Balance<SUI>,      // actual on-chain SUI custody
  plan_id: ID,                // linked to TravelPlan
  target_amount: u64,         // funding goal
  status: u8,                 // lifecycle state
}
```

**The vault is the single source of custody.** All funds flow in and out through its public functions — no direct balance manipulation is possible from outside the module.

**Lifecycle state machine** (enforced by Move assertions — cannot be bypassed):

```
STATUS_ACTIVE (0)
      │
      │  mark_ready()          ← called at "Prepare for Departure"
      ▼
STATUS_READY_FOR_TRAVEL (1)
      │
      │  mark_traveling()      ← called at "Complete Trip" step 1
      ▼
STATUS_TRAVELING (2)
      │
      │  mark_completed()      ← called at "Complete Trip" step 2
      ▼
STATUS_COMPLETED (3)
```

Each transition is a one-way door. The contract makes it impossible to revert a completed trip or mark a traveling vault as active again.

### Yield on Idle Capital (`travel::yield`)

The key DeFi insight: **travel budgets sit idle for weeks or months before a trip.** TravelOS routes that idle window to yield protocols.

```move
public struct YieldPosition has key, store {
  id: UID,
  vault_id: ID,               // which vault owns this position
  protocol_name: String,      // "Scallop", "Navi", "Aftermath"
  deposited_amount: u64,      // MIST deposited into the protocol
  receipt_token_type: String, // protocol receipt token identifier
  deposited_epoch: u64,
  closed_epoch: u64,
  status: u8,                 // Active | Closed
}
```

**Capital flow:**
```
Vault (idle SUI)
     │  withdraw_coin(amount)
     ▼
DeFi Protocol (Scallop/Navi)
     │  deposit → receive receipt token
     │  ...earning yield...
     │  N days before departure: redeem receipt → SUI + yield
     ▼
Vault (SUI + yield proceeds)
     │
     ▼
Travel spending (payments)
```

The `YieldPosition` is the **metadata anchor** — it records what was deposited, to which protocol, and the receipt token to redeem. When `close_position` is called, the position status changes to `Closed` and funds flow back to the vault before departure.

**Planned integrations:** Scallop lending pools (sSUI), Navi Protocol (nSUI), Aftermath Finance.

### Automation Rules (`travel::rules`)

```move
public struct AutomationRule has key, store {
  id: UID,
  vault_id: ID,
  rule_type: u8,
  params: vector<u8>,   // BCS-encoded rule parameters
  enabled: bool,
}
```

| Rule ID | Name | When It Fires |
|---|---|---|
| 0 | `RULE_STAKE_IDLE_FUNDS` | After deposit → route to yield |
| 1 | `RULE_WITHDRAW_BEFORE_TRIP` | `N` days before `start_date` → close yield position |
| 2 | `RULE_PAY_HOTEL` | On hotel booking confirmation |
| 3 | `RULE_PAY_FLIGHT` | On flight booking confirmation |
| 4 | `RULE_PAY_INSURANCE` | On insurance purchase |
| 5 | `RULE_OFFRAMP_REMAINING` | After trip completion → return balance to owner |

Rules are stored on-chain as owned objects. The AI Supervisor reads them and executes the corresponding PTBs when conditions are met — **no centralised scheduler, no trusted executor**.

---

## Payment Track — Deep Dive

### Two-Phase Commit Pattern (`travel::payment`)

TravelOS implements a **payment intent pattern** inspired by Web2 payment APIs but made trustless on-chain:

```
┌─────────────────────────────────────────────────────────┐
│  PHASE 1: Commitment                                    │
│                                                         │
│  create_intent(vault, vault_id, merchant, amount,       │
│                deadline_epoch)                          │
│  → PaymentIntent {                                      │
│      executed: false,                                   │
│      vault_id,                                          │
│      merchant,     ← destination address                │
│      amount,       ← MIST to pay                        │
│      deadline_epoch ← expires after this epoch          │
│    }                                                    │
│                                                         │
│  At this point: intent is inspectable, money NOT moved  │
└─────────────────────────────────────────────────────────┘
                        │
                        │ execute_payment(intent, vault)
                        ▼
┌─────────────────────────────────────────────────────────┐
│  PHASE 2: Settlement                                    │
│                                                         │
│  Assertions:                                            │
│  ✓ intent.executed == false    (no double-spend)        │
│  ✓ vault.owner == ctx.sender() (only owner can pay)     │
│  ✓ vault.balance >= amount     (sufficient funds)       │
│                                                         │
│  Effect:                                                │
│  vault.balance -= amount                                │
│  coin → transfer::public_transfer(coin, merchant)       │
│                                                         │
│  → PaymentReceipt {                                     │
│      intent_id,                                         │
│      vault_id,                                          │
│      merchant,                                          │
│      amount,                                            │
│      epoch     ← on-chain timestamp proof               │
│    }                                                    │
└─────────────────────────────────────────────────────────┘
```

**Why this pattern matters:**
- **No double-spend** — `executed: bool` prevents replaying the same intent
- **Deadline enforcement** — intents expire; stale authorisations cannot be used later
- **Verifiable audit trail** — every payment produces a `PaymentReceipt` object on-chain
- **Owner-gated** — only the vault owner can execute payments from their vault
- **Non-custodial** — the contract never holds funds; they move directly from vault to merchant in one atomic step

### Reservation NFT as Booking Proof (`travel::reservation`)

```move
public struct ReservationNFT has key, store {
  id: UID,
  plan_id: ID,              // which trip this belongs to
  provider: String,         // "ANA Airlines", "Park Hyatt Tokyo"
  reservation_type: u8,     // HOTEL=0, FLIGHT=1, ACTIVITY=2, INSURANCE=3, TRANSPORT=4
  amount: u64,              // paid amount in MIST
  reservation_epoch: u64,   // epoch of booking
  status: u8,               // CONFIRMED=0, CANCELLED=1, REFUNDED=2
}
```

The NFT model solves a critical problem in travel: **proof of purchase without trusting a centralised database.**

- Your hotel booking lives in **your wallet**, not on Booking.com's servers
- If you cancel, the NFT status updates on-chain — no intermediary needed
- Refund via `refund_to_vault(nft, vault, refund_coin)` returns funds **directly to the TravelVault**, not to a third-party escrow

**Cancellation flow:**
```
cancel(reservation_nft, vault)
  → nft.status = CANCELLED
  → refund_to_vault(nft, vault, refund_coin)
      → vault.balance += refund_coin
      → emit ReservationRefunded event
```

### Atomic PTB Composition

Every booking action is a single **Programmable Transaction Block** — all steps execute atomically:

```
bookHotel PTB (single transaction):
┌─────────────────────────────────────────────────────┐
│ Command 1: payment::create_intent(vault, ...)        │
│   → PaymentIntent                                    │
│                                                      │
│ Command 2: payment::execute_payment(intent, vault)   │
│   → PaymentReceipt                                   │
│   → SUI transferred to hotel merchant               │
│                                                      │
│ Command 3: reservation::mint(plan_id, provider,      │
│             HOTEL, amount, &receipt)                 │
│   → ReservationNFT                                   │
│                                                      │
│ Command 4: transferObjects(                          │
│             [intent, receipt, nft], sender)          │
│   → all 3 objects land in user wallet               │
└─────────────────────────────────────────────────────┘
```

If any command fails, the entire PTB reverts. There is no partial state — no paid-but-not-booked or booked-but-not-paid scenario.

---

## Module Reference

### `travel::plan`
Stores the travel goal — destination, dates, budget targets. Created by the AI planner and transferred to the user as an owned object. Acts as the anchor for all other objects in the trip.

### `travel::vault`
The treasury. All SUI custody happens here. The balance is a `Balance<SUI>` — Move's native type-safe representation of coin value. The vault's lifecycle state machine guarantees trip progression is one-way.

### `travel::payment`
Implements the two-phase payment pattern. `PaymentIntent` is the authorisation; `PaymentReceipt` is the settlement proof. The `executed` flag prevents replay attacks.

### `travel::reservation`
Mints booking NFTs as proof of payment. Each NFT records the provider, type, amount paid, and epoch. Cancellation triggers an on-chain refund directly to the vault.

### `travel::yield`
Tracks DeFi positions. When idle capital is deployed to a lending protocol, a `YieldPosition` records the protocol, amount, and receipt token. Closing the position signals redemption.

### `travel::rules`
Stores automation rules as on-chain objects. The AI supervisor reads these rules and executes the corresponding transactions when conditions are satisfied.

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Vault as single custody point** | All assets flow through one module — simpler audit, fewer attack surfaces |
| **PaymentIntent before execution** | Separates authorisation from settlement; enables deadline enforcement |
| **ReservationNFT in user wallet** | User owns proof of booking — no dependence on centralised database |
| **PTBs for atomic multi-step flows** | Booking, payment, and minting happen in one transaction or not at all |
| **AI builds PTB, user signs** | Agents get AI reasoning; users get cryptographic control |
| **Walrus for off-chain plan storage** | AI-generated JSON too large for on-chain storage; blob ID is stored on-chain as the content anchor |
| **State machine in Move** | Trip lifecycle transitions are enforced by the VM — cannot be bypassed by any party |

---

## Full On-Chain Journey

```
Step 1: createTrip
  PTB: plan::create_plan() + vault::create_vault()
  Result: TravelPlan + TravelVault in user wallet

Step 2: depositFunds
  PTB: vault::deposit(vault, coin)
  Result: vault.balance += amount

Step 3: investIdleCapital
  PTB: yield::create_position(vault, protocol, amount)
  Result: YieldPosition in user wallet, capital tracked for yield

Step 4: bookHotel
  PTB: payment::create_intent + execute_payment + reservation::mint
  Result: PaymentIntent + PaymentReceipt + ReservationNFT in user wallet
  Effect: hotel amount deducted from vault, sent to merchant

Step 5: bookFlight
  PTB: (same pattern as bookHotel, reservation_type = FLIGHT)
  Result: flight ReservationNFT in user wallet

Step 6: prepareForDeparture
  PTB: vault::mark_ready(vault)
  Result: vault.status → ReadyForTravel

Step 7: completeTrip
  PTB: vault::mark_traveling(vault) + vault::mark_completed(vault)
  Result: vault.status → Traveling → Completed
```

**Every object** (TravelPlan, TravelVault, ReservationNFTs, YieldPosition) lives in the user's Sui wallet. Verifiable on any Sui explorer.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Smart Contracts | Sui Move (Edition 2024.beta) | On-chain logic, custody, state machine |
| PTB Builder | `@mysten/sui` TypeScript SDK | Compose multi-step transactions |
| AI Agents | OpenAI GPT-4o-mini | Planner, Treasury, Booking, Risk, Supervisor |
| Off-chain Storage | Walrus | Persistent travel plan blobs |
| Backend | Express 5 + TypeScript ESM + tsx | Agent API server |
| Frontend | Next.js 15 + `@mysten/dapp-kit` | UI, wallet connection, transaction signing |
| Wallet | Sui Wallet browser extension | User signs all transactions |

---

## Repository Structure

```
TravelOS/
├── move/
│   ├── sources/
│   │   ├── plan.move         # TravelPlan object
│   │   ├── vault.move        # TravelVault + state machine
│   │   ├── payment.move      # PaymentIntent + Receipt
│   │   ├── reservation.move  # ReservationNFT
│   │   ├── yield.move        # YieldPosition
│   │   └── rules.move        # AutomationRule
│   └── tests/
│       └── flow_tests.move   # 28 unit + integration tests
├── sdk/
│   └── src/flows/            # TypeScript PTB builders per action
├── backend-agent/
│   └── src/
│       ├── agents/           # Planner, Treasury, Booking, Risk, Supervisor
│       └── api/server.ts     # Express REST API
└── frontend/
    ├── app/page.tsx           # Main UI + wallet integration
    └── components/            # Blueprint, Treasury, Reservations, Lifecycle
```

---

## Running Locally

**Prerequisites:** Node 20+, Sui Wallet browser extension, Sui testnet SUI tokens

**Backend**
```bash
cd backend-agent
npm install
echo "OPENAI_API_KEY=sk-..." > .env
npm run dev        # → http://localhost:3001
```

**Frontend**
```bash
cd frontend
npm install
cat > .env.local << EOF
NEXT_PUBLIC_AGENT_BACKEND=http://localhost:3001
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUI_PACKAGE_ID=0x602448e9585149916ac0f6d716ad4875db80c2e45ff0afe9093edbc8a39dd9f1
EOF
npm run dev        # → http://localhost:3000
```

**Smart Contracts (already deployed)**
```
Package:    0x602448e9585149916ac0f6d716ad4875db80c2e45ff0afe9093edbc8a39dd9f1
Network:    Sui Testnet
Modules:    plan, vault, payment, reservation, yield, rules
Tests:      28/28 passing
```

---

## Future Plan

### Phase 1 — Live DeFi Yield Integration
- Connect `travel::yield` to **Scallop** lending pools — deposit idle SUI, receive sSUI receipt tokens
- Connect to **Navi Protocol** as a second yield option with APY comparison
- Auto-select protocol based on current APY via treasury agent
- Real yield accrual and redemption on position close

### Phase 2 — Autonomous Automation
- Deploy a **keeper network** (Sui-native cron) to execute `AutomationRule` objects without any backend involvement
- Rule: auto-close yield position exactly `N` days before `start_date` from `TravelPlan`
- Rule: auto-return remaining vault balance after `STATUS_COMPLETED`
- Full on-chain automation — no backend needed after trip is configured

### Phase 3 — Real Merchant Integration
- Replace demo merchant address with a **verified merchant registry** smart contract
- Hotels and airlines register on-chain as merchants with verified addresses
- `create_intent` validates merchant against registry before creating intent
- Payment disputes → on-chain arbitration via governance module

### Phase 4 — Multi-Currency & Cross-Chain
- Accept USDC, USDT deposits — auto-swap to SUI via DeepBook for on-chain operations
- Cross-chain travel treasury — bridge from Ethereum/Solana via Wormhole
- Stablecoin-denominated travel plans (no SUI price exposure for the traveller)

### Phase 5 — Social & Insurance Layer
- **Group travel vault** — multiple contributors, shared custody, proportional refund
- **Travel insurance NFT** — on-chain parametric insurance triggered by flight delay oracles
- **Loyalty points** — earn on-chain points redeemable across partner merchants
- **Travel DAO** — community-curated travel rules and merchant whitelist governance


---

## DeFi Track — How It Works

### 1. Goal-Based Treasury (`travel::vault`)

Instead of yield farming for its own sake, TravelOS uses **goal-based finance**:

> The objective is not maximum yield. It is ensuring travel funds are available exactly when needed, while maximising capital efficiency before departure.

```
User deposits SUI → TravelVault
         │
         ├── Idle capital → invest in yield protocol (Scallop/Navi)
         ├── Before departure → auto-withdraw yield → back to vault
         └── At booking → payment intent → merchant settlement
```

The vault has four lifecycle states enforced in Move:

```
Active → ReadyForTravel → Traveling → Completed
```

State transitions are irreversible — the contract guarantees the trip lifecycle cannot go backwards.

### 2. Yield on Idle Capital (`travel::yield`)

Before departure, funds that are not yet allocated to bookings are invested:

```move
create_position(vault, vault_id, protocol_name, deposited_amount, receipt_token_type)
→ YieldPosition { status: Active, protocol_name, deposited_amount, deposited_epoch }
```

- Tracks which DeFi protocol holds the capital
- Records receipt token type for future redemption
- Closes position before departure via `prepareForDeparture`
- Designed to plug into **Scallop** and **Navi** (live integration roadmap)

**Why this matters for DeFi:** Travel budgets are typically allocated weeks or months before a trip. TravelOS captures this idle window and routes it to yield — something no existing travel platform does.

### 3. Automation Rules (`travel::rules`)

On-chain automation rules define *when* capital moves:

| Rule | Trigger |
|---|---|
| `RULE_STAKE_IDLE_FUNDS` | After vault funded → deposit to yield protocol |
| `RULE_WITHDRAW_BEFORE_TRIP` | N days before departure → close yield position |
| `RULE_PAY_HOTEL` | Booking confirmation → execute hotel payment |
| `RULE_PAY_FLIGHT` | Booking confirmation → execute flight payment |
| `RULE_OFFRAMP_REMAINING` | Trip completed → return remaining balance |

These rules are stored as on-chain objects and executed by the supervisor agent — creating **trustless automation** without a centralised scheduler.

---

## Payment Track — How It Works

### Intent → Execute → Receipt Pattern (`travel::payment`)

TravelOS implements a two-phase payment commitment pattern:

```
Phase 1: Create Intent
  create_intent(vault, vault_id, merchant, amount, deadline)
  → PaymentIntent { executed: false, amount, merchant, deadline_epoch }

Phase 2: Execute
  execute_payment(intent, vault)
  → vault.withdraw(amount) → transfer to merchant
  → PaymentReceipt { intent_id, vault_id, amount, epoch }
```

**Why two phases?**
- Intents can be inspected and verified before execution
- Deadline enforcement — intents expire if not executed
- Full audit trail: every payment has a receipt on-chain
- Prevents double-execution (`executed: bool` flag)

### Reservation NFT as Proof of Payment (`travel::reservation`)

Every confirmed booking mints a **ReservationNFT**:

```move
ReservationNFT {
  id: UID,
  plan_id: ID,          // linked to the TravelPlan
  provider: String,     // "ANA Airlines", "Shinjuku Granbell Hotel"
  reservation_type: u8, // HOTEL | FLIGHT | ACTIVITY | INSURANCE | TRANSPORT
  amount: u64,          // amount paid in MIST
  reservation_epoch: u64,
  status: u8,           // CONFIRMED | CANCELLED | REFUNDED
}
```

- The NFT is the receipt — it lives in your wallet
- Cancel → status changes to `CANCELLED` + refund triggers
- Refund calls `refund_to_vault(nft, vault, refund_coin)` — funds return to the vault, not an intermediary

### PTB Composition — Atomic Multi-Step Payments

Each booking is a single **Programmable Transaction Block** that atomically:

```
bookHotel PTB:
  1. create_intent(vault, sender, amount, deadline)
  2. execute_payment(intent, vault)          → PaymentReceipt
  3. mint(plan_id, provider, HOTEL, receipt) → ReservationNFT
  4. transferObjects([intent, receipt, nft], sender)
```

All steps succeed or all revert. There is no partial state.

---

## Module Reference

| Module | Object | Responsibility |
|---|---|---|
| `travel::plan` | `TravelPlan` | Trip metadata, budget targets, travel dates |
| `travel::vault` | `TravelVault` | Custody of all SUI, lifecycle state machine |
| `travel::payment` | `PaymentIntent`, `PaymentReceipt` | Two-phase payment with deadline enforcement |
| `travel::reservation` | `ReservationNFT` | On-chain booking proof, cancel/refund logic |
| `travel::yield` | `YieldPosition` | DeFi yield tracking, protocol receipt metadata |
| `travel::rules` | `AutomationRule` | On-chain automation triggers |

**Package ID:** `0x602448e9585149916ac0f6d716ad4875db80c2e45ff0afe9093edbc8a39dd9f1`  
**Network:** Sui Testnet

---

## Full User Journey (On-Chain)

```
1. Chat with AI agents → travel plan generated
2. Create Trip         → TravelPlan + TravelVault minted (1 PTB)
3. Deposit Funds       → SUI deposited into vault
4. Invest Idle Capital → YieldPosition created → capital routed to Scallop
5. Book Hotel          → PaymentIntent → PaymentReceipt → ReservationNFT (1 PTB)
6. Book Flight         → PaymentIntent → PaymentReceipt → ReservationNFT (1 PTB)
7. Prepare for Departure → yield position closed, vault → ReadyForTravel
8. Complete Trip       → vault → Traveling → Completed
```

Every step is an on-chain transaction. Every object lives in the user's wallet. The agent never touches private keys.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Sui Move (Edition 2024.beta) |
| Transaction Building | PTB via `@mysten/sui` SDK |
| AI Agents | OpenAI GPT-4o-mini (Planner, Treasury, Booking, Risk, Supervisor) |
| Off-chain Storage | Walrus (travel plan blob) |
| Backend | Express 5 + TypeScript ESM |
| Frontend | Next.js 15 + `@mysten/dapp-kit` |
| Wallet | Sui Wallet browser extension |

---

## Repository Structure

```
TravelOS/
├── move/          # 6 Move modules + tests
├── sdk/           # TypeScript SDK (PTB builders for each flow)
├── backend-agent/ # AI agent supervisor + Express API
└── frontend/      # Next.js UI
```

---

## Running Locally

**Backend**
```bash
cd backend-agent && npm install
echo "OPENAI_API_KEY=sk-..." > .env
npm run dev        # → http://localhost:3001
```

**Frontend**
```bash
cd frontend && npm install
# configure frontend/.env.local
npm run dev        # → http://localhost:3000
```

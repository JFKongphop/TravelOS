# TravelOS PTB SDK Architecture

## Purpose

The TravelOS PTB SDK is the orchestration layer between:

* Frontend
* AI Agents
* Sui Move Contracts

The SDK abstracts low-level Move calls and PTB construction into reusable business operations.

Instead of interacting directly with Move modules, applications should use the SDK.

---

# Architecture

```text
Frontend
    │
    ▼
TravelOS SDK
    │
    ▼
PTB Builder
    │
    ▼
TravelOS Move Contracts
```

AI Agents and Frontend applications should never manually construct Move calls.

All interactions should flow through the SDK.

---

# Goals

The SDK should:

* Hide Move complexity
* Build PTBs automatically
* Provide business-level APIs
* Support AI Agent orchestration
* Support future protocol integrations
* Reduce frontend complexity

---

# Directory Structure

```text
src/
├── sdk/
│   ├── index.ts
│   ├── client.ts
│   ├── types.ts
│   ├── constants.ts
│   │
│   ├── plan.ts
│   ├── vault.ts
│   ├── payment.ts
│   ├── reservation.ts
│   ├── rules.ts
│   ├── yield.ts
│   │
│   └── flows/
│       ├── createTrip.ts
│       ├── investIdleCapital.ts
│       ├── prepareForDeparture.ts
│       ├── bookHotel.ts
│       ├── bookFlight.ts
│       └── completeTrip.ts
```

---

# Core SDK Client

Create a single SDK entry point.

```ts
class TravelOSClient {}
```

Responsibilities:

* Store package IDs
* Store network configuration
* Build PTBs
* Execute transactions

---

# Configuration

```ts
interface TravelOSConfig {
  packageId: string;
  network: "mainnet" | "testnet";
}
```

Example:

```ts
const client = new TravelOSClient({
  packageId: PACKAGE_ID,
  network: "testnet",
});
```

---

# Business-Level APIs

The SDK should expose business actions.

Not Move actions.

Good:

```ts
createTrip()
bookHotel()
investIdleCapital()
```

Bad:

```ts
createPlan()
createVault()
createPaymentIntent()
```

The SDK should hide implementation details.

---

# Flow 1: Create Trip

## Purpose

Create a travel plan and treasury.

---

## Public API

```ts
await client.createTrip({
  destination: "Tokyo",
  startDate: 100,
  endDate: 200,
  budgetItems: [...]
});
```

---

## PTB Construction

```text
Create TravelPlan
↓
Create TravelVault
```

Single PTB.

---

## Return

```ts
{
  planId,
  vaultId
}
```

---

# Flow 2: Fund Travel Vault

## Purpose

Deposit funds into a travel treasury.

---

## Public API

```ts
await client.depositFunds({
  vaultId,
  amount
});
```

---

## PTB Construction

```text
Split Coin
↓
Deposit Into Vault
```

Single PTB.

---

# Flow 3: Invest Idle Capital

## Purpose

Allocate unused travel funds into DeFi.

---

## Public API

```ts
await client.investIdleCapital({
  vaultId,
  amount,
  protocol: "scallop"
});
```

---

## PTB Construction

```text
Withdraw Vault Funds
↓
Deposit Into Scallop
↓
Create YieldPosition
```

Single PTB.

---

## Current Status

TravelOS contracts track metadata.

Actual protocol integrations will be implemented later.

---

# Flow 4: Prepare For Departure

## Purpose

Recover liquidity before travel.

---

## Public API

```ts
await client.prepareForDeparture({
  vaultId
});
```

---

## PTB Construction

```text
Withdraw Yield Position
↓
Return Funds To Vault
↓
Mark Vault Ready
```

Single PTB.

---

# Flow 5: Book Hotel

## Purpose

Execute travel payment.

---

## Public API

```ts
await client.bookHotel({
  vaultId,
  provider: "Hilton Tokyo",
  amount: 500
});
```

---

## PTB Construction

```text
Create PaymentIntent
↓
Execute Payment
↓
Mint ReservationNFT
```

Single PTB.

---

## Return

```ts
{
  reservationId,
  receiptId
}
```

---

# Flow 6: Book Flight

## Purpose

Execute flight booking.

---

## Public API

```ts
await client.bookFlight({
  vaultId,
  provider: "Japan Airlines",
  amount: 700
});
```

---

## PTB Construction

```text
Create PaymentIntent
↓
Execute Payment
↓
Mint ReservationNFT
```

Single PTB.

---

# Flow 7: Complete Trip

## Purpose

Finalize travel lifecycle.

---

## Public API

```ts
await client.completeTrip({
  vaultId
});
```

---

## PTB Construction

```text
Handle Remaining Funds
↓
Update Vault Status
↓
Mark Completed
```

Single PTB.

---

# AI Agent Integration

The AI Agent must only interact with the SDK.

Never directly call Move contracts.

---

## Example

User Input:

```text
I want to travel to Tokyo for 7 days with a $2000 budget.
```

AI Output:

```json
{
  "destination": "Tokyo",
  "budget": 2000,
  "hotel": 800,
  "flight": 700,
  "activities": 300,
  "transport": 200
}
```

---

## Agent Execution

```ts
await travelOS.createTrip(...);

await travelOS.investIdleCapital(...);

await travelOS.bookHotel(...);
```

The AI should think in terms of travel actions.

Not Move calls.

---

# Frontend Integration

Frontend must only use SDK functions.

Example:

```ts
await travelOS.bookHotel(...)
```

Never:

```ts
tx.moveCall(...)
```

The SDK owns all PTB logic.

---

# Responsibilities

## Move Contracts

Responsible for:

* Ownership
* Validation
* Asset custody
* State transitions

---

## SDK

Responsible for:

* PTB construction
* Business workflows
* Protocol integrations
* Transaction orchestration

---

## AI Agent

Responsible for:

* Planning
* Budget allocation
* Strategy selection
* User interaction

---

## Frontend

Responsible for:

* Visualization
* User approvals
* Dashboard experience

---

# Success Criteria

The SDK is complete when the following works:

```text
createTrip()

depositFunds()

investIdleCapital()

prepareForDeparture()

bookHotel()

bookFlight()

completeTrip()
```

without any component outside the SDK needing to manually construct Move PTBs.

The SDK becomes the single orchestration layer for TravelOS.

# SDK Revisions & Implementation Notes

## Revision 1: Reservation Cancellation Flow

The Move contracts already support:

```text
cancel_reservation()

refund_to_vault()
```

The SDK must expose these capabilities.

---

### Public API

```ts
await client.cancelBooking({
  reservationId,
  vaultId
});
```

---

### PTB Construction

```text
Cancel Reservation
↓
Refund To Vault
↓
Update Reservation Status
```

Single PTB.

---

### Return

```ts
{
  refunded: true,
  reservationStatus: "REFUNDED"
}
```

---

### Purpose

Users must be able to:

* Cancel hotel bookings
* Cancel flight bookings
* Receive refunds
* Restore travel capital

Reservation cancellation is considered a core user flow.

---

## Revision 2: Coin Management Responsibilities

TravelOS SDK is responsible for handling Sui coin operations.

Frontend applications should never manually split coins.

---

### Example

User requests:

```ts
await client.depositFunds({
  vaultId,
  amount: 1000
});
```

Internally the SDK should perform:

```text
Select Coin
↓
Split Coin
↓
Deposit Into Vault
```

---

### Example PTB

```ts
const coin = tx.splitCoins(
  tx.gas,
  [amount]
);

tx.moveCall(...deposit);
```

---

### Design Principle

Frontend should think in:

```text
Deposit 1000 SUI
```

not

```text
Split Coin
Merge Coin
Manage Coin Objects
```

The SDK owns all coin-management complexity.

---

## Revision 3: Yield Integration Limitation

Current TravelOS contracts support:

```text
create_position()

close_position()

mark_ready()
```

but do not yet perform actual protocol withdrawals.

---

### Current MVP Flow

```text
Close Yield Position
↓
Update Metadata
↓
Mark Vault Ready
```

---

### Future Flow

```text
Redeem Receipt Asset
↓
Withdraw From Scallop
↓
Return Funds To Vault
↓
Close Yield Position
↓
Mark Vault Ready
```

---

### Current SDK Requirement

The SDK should expose:

```ts
await client.prepareForDeparture({
  vaultId
});
```

but clearly document that:

```text
Real protocol withdrawal
is not yet implemented.
```

The current implementation operates as a metadata and workflow simulation.

Actual Scallop integration will replace this behavior in a later phase.

---

# Final SDK Principles

1. SDK owns PTB construction.
2. SDK owns coin splitting and coin management.
3. SDK owns reservation cancellation flows.
4. Frontend never constructs PTBs directly.
5. AI Agent never calls Move contracts directly.
6. Future DeFi integrations replace mocked yield operations.
7. All user actions should map to a single business-level SDK function.


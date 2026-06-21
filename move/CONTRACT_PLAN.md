# TravelOS Smart Contract Architecture

## Overview

TravelOS is an AI-powered autonomous travel finance platform built on Sui.

The objective is to transform travel funds into programmable capital that can be:

* Saved
* Allocated
* Invested
* Reserved
* Spent
* Returned

without requiring users to manually coordinate multiple financial actions.

TravelOS combines:

* AI Agents
* Sui Move
* Programmable Transaction Blocks (PTBs)
* DeFi Yield Strategies
* Travel Payment Workflows

into a unified system.

---

# Core Philosophy

Traditional travel planning and financial management are fragmented.

Users typically:

1. Save money manually
2. Hold idle cash
3. Book flights manually
4. Book hotels manually
5. Manage remaining funds manually

TravelOS automates these processes through programmable financial workflows.

The system focuses on:

> Goal-Based Finance

rather than pure yield farming.

The user's objective is not simply earning yield.

The objective is:

> Ensure travel funds are available when needed while maximizing capital efficiency before departure.

---

# Architecture Overview

The system consists of six Move modules.

```text
travel::plan
travel::vault
travel::payment
travel::reservation
travel::rules
travel::yield
```

Each module has a specific responsibility.

The architecture follows separation of concerns.

```text
Travel Plan
     │
     ▼
Travel Vault
     │
 ┌───┼─────────────┐
 │   │             │
 ▼   ▼             ▼
Yield Payment Reservation
 │
 ▼
Rules
```

TravelVault is the central treasury object.

All other modules interact directly or indirectly with the vault.

---

# Module 1: travel::plan

## Purpose

Represents the travel goal.

Stores all planning-related metadata.

The AI agent generates travel plans off-chain.

Move stores the finalized travel plan on-chain.

---

## Why This Module Exists

Without a plan, the system does not know:

* Destination
* Budget
* Travel dates
* Spending allocation

The plan becomes the source of truth for the trip.

---

## Main Object

```move
TravelPlan
```

Suggested Fields:

```move
id
owner

destination

start_date
end_date

total_budget

hotel_budget
flight_budget
activity_budget
transport_budget
```

---

## Responsibilities

* Store travel metadata
* Store budgeting targets
* Link trip to vault
* Provide auditability

---

## Example

```text
Destination: Tokyo

Duration:
October 10 → October 17

Budget:
$2,000

Hotel:
$800

Flight:
$700

Activities:
$300

Transport:
$200
```

---

# Module 2: travel::vault

## Purpose

Acts as the treasury layer.

All user funds are stored inside TravelVault.

This is the most important module in the system.

---

## Why This Module Exists

Every travel goal requires a dedicated capital container.

The vault provides:

* Ownership
* Accounting
* Fund management
* Status tracking

---

## Main Object

```move
TravelVault
```

Suggested Fields

```move
id

owner

trip_id

target_amount

current_amount

departure_time

status
```

---

## Status

```text
0 Active

1 ReadyForTravel

2 Traveling

3 Completed
```

---

## Responsibilities

* Create vault
* Deposit funds
* Withdraw funds
* Track balances
* Track lifecycle

---

## Example

```text
Travel Vault #1

Target:
$2,000

Current:
$1,650

Status:
Active
```

---

# Module 3: travel::payment

## Purpose

Handles travel-related payment execution.

Represents intent to transfer capital.

---

## Why This Module Exists

Travel payments are not arbitrary transfers.

Each payment has:

* Purpose
* Amount
* Recipient
* Deadline

PaymentIntent provides transparency and auditability.

---

## Main Objects

```move
PaymentIntent

PaymentReceipt
```

---

## PaymentIntent Fields

```move
id

vault_id

merchant

amount

deadline

executed
```

---

## Responsibilities

* Create payment requests
* Execute payments
* Prevent double spending
* Track payment history

---

## Example

```text
Hotel Deposit

Merchant:
Tokyo Hotel

Amount:
$500

Status:
Executed
```

---

# Module 4: travel::reservation

## Purpose

Represents completed travel reservations.

Acts as an on-chain booking receipt.

---

## Why This Module Exists

TravelOS needs proof that a booking occurred.

Instead of storing only transaction history:

Reservation NFTs become verifiable travel records.

---

## Main Object

```move
ReservationNFT
```

---

## Reservation Types

```text
0 Hotel

1 Flight

2 Activity

3 Insurance

4 Transport
```

---

## Suggested Fields

```move
id

trip_id

provider

reservation_type

amount

timestamp
```

---

## Responsibilities

* Store booking information
* Generate booking proof
* Associate reservations with payments

---

## Example

```text
Reservation

Provider:
Hilton Tokyo

Type:
Hotel

Amount:
$500
```

---

# Module 5: travel::rules

## Purpose

Stores automation instructions used by AI agents.

Rules define intended behavior.

Execution occurs off-chain.

Validation occurs on-chain.

---

## Why This Module Exists

The AI needs a transparent and auditable set of actions.

Without rules:

Agent behavior becomes opaque.

Rules make automation visible.

---

## Main Object

```move
AutomationRule
```

---

## Rule Types

```text
0 StakeIdleFunds

1 WithdrawBeforeTrip

2 PayHotel

3 PayFlight

4 PayInsurance

5 OffRampRemainingFunds
```

---

## Suggested Fields

```move
id

vault_id

rule_type

trigger_time

enabled
```

---

## Responsibilities

* Store automation expectations
* Define future actions
* Enable auditing

---

## Example

```text
Rule

WithdrawBeforeTrip

Trigger:
3 Days Before Departure
```

---

# Module 6: travel::yield

## Purpose

Tracks travel capital deployed into DeFi protocols.

TravelOS is not a lending protocol.

TravelOS is an orchestration layer.

---

## Why This Module Exists

Travel funds are idle until departure.

Idle capital should generate yield.

This module tracks where funds are deployed.

---

## Main Object

```move
YieldPosition
```

---

## Suggested Fields

```move
id

vault_id

protocol_name

principal

deposited_at
```

---

## Responsibilities

* Track deployed capital
* Track protocol usage
* Record yield allocations
* Support liquidity preparation

---

## Example

```text
Protocol:
Scallop

Principal:
1000 USDC

Status:
Active
```

---

# AI Agent Responsibilities

The AI agent operates off-chain.

The agent never owns user funds.

The agent is responsible for:

* Planning trips
* Creating budgets
* Selecting yield strategies
* Monitoring departure dates
* Creating payment requests
* Executing approved PTBs

The AI acts as an orchestrator.

Move acts as the enforcement layer.

---

# Programmable Transaction Block (PTB) Flows

The project should demonstrate PTB usage extensively.

This is one of the strongest differentiators of Sui.

---

## PTB Flow 1

Create Travel Treasury

```text
Create TravelPlan
→ Create TravelVault
→ Deposit Funds
```

Atomic execution.

---

## PTB Flow 2

Deploy Idle Capital

```text
Withdraw From Vault
→ Deposit Into Yield Protocol
→ Create YieldPosition
```

Atomic execution.

---

## PTB Flow 3

Prepare For Departure

```text
Withdraw Yield Position
→ Return Funds To Vault
→ Update Vault Status
```

Atomic execution.

---

## PTB Flow 4

Hotel Reservation

```text
Withdraw Vault Funds
→ Execute Payment
→ Mint Reservation NFT
```

Atomic execution.

---

## PTB Flow 5

Flight Booking

```text
Withdraw Vault Funds
→ Execute Flight Payment
→ Mint Reservation NFT
```

Atomic execution.

---

## PTB Flow 6

Trip Completion

```text
Calculate Remaining Funds
→ Off-Ramp Request
→ Mark Vault Completed
```

Atomic execution.

---

# MVP Scope

## Required

* travel::plan
* travel::vault
* travel::payment
* travel::reservation
* travel::rules
* travel::yield

---

## Required Demo Features

* Create travel goal
* Fund travel vault
* Allocate idle capital
* Prepare liquidity before travel
* Execute reservation payment
* Mint reservation NFT
* Complete trip lifecycle

---

# Vision

TravelOS transforms travel funds into programmable money.

Instead of leaving travel capital idle, the system:

* Stores funds safely
* Generates yield
* Automates preparation
* Executes payments
* Records reservations
* Returns unused capital

All coordinated through AI agents and secured by Sui Move ownership guarantees and Programmable Transaction Blocks.

The result is a fully autonomous travel treasury system built on Sui.

# Architecture Revisions

## Revision 1: Flexible Budget Model

The original design used static budget fields:

```text
hotel_budget
flight_budget
activity_budget
transport_budget
```

This approach is too rigid.

Users may have:

* Multiple flights
* Multiple hotels
* Multiple activities
* Custom categories

TravelOS should use a flexible budgeting model.

### BudgetItem

```move
public struct BudgetItem has store, drop {
    category: u8,
    amount: u64,
    label: String
}
```

### Category Examples

```text
0 Hotel
1 Flight
2 Activity
3 Transport
4 Insurance
5 Food
6 Other
```

### TravelPlan

Replace fixed budget fields with:

```move
budget_items: vector<BudgetItem>
```

### Example

```text
Hotel Tokyo
$500

Hotel Kyoto
$300

Flight Bangkok → Tokyo
$700

Disney Ticket
$100
```

This design is future-proof and AI-friendly.

---

# Revision 2: Travel Plan ↔ Vault Relationship

The original architecture did not explicitly define ownership relationships between TravelPlan and TravelVault.

This can create ambiguity.

Every TravelVault must belong to exactly one TravelPlan.

### TravelVault

Add:

```move
plan_id: ID
```

### TravelPlan

Optionally add:

```move
vault_id: ID
```

or maintain a one-way reference from the vault.

### Requirement

A vault cannot exist without a travel plan.

The travel plan becomes the root object for the travel lifecycle.

---

# Revision 3: Yield Asset Ownership Model

The original YieldPosition design did not specify where yield-bearing assets are stored.

Example:

```text
Vault
↓
Deposit USDC
↓
Scallop
↓
Receive sUSDC
```

Where is sUSDC stored?

This must be defined clearly.

---

## Design Decision

TravelVault owns assets.

YieldPosition stores metadata only.

### TravelVault

Responsible for custody of:

```text
USDC
SUI
sUSDC
afSUI
vSUI
other yield-bearing assets
```

### YieldPosition

Tracks:

```move
protocol_name
deposited_amount
receipt_token_type
deposited_at
```

Example:

```move
public struct YieldPosition has key, store {
    id: UID,

    vault_id: ID,

    protocol_name: String,

    deposited_amount: u64,

    receipt_token_type: String,

    deposited_at: u64
}
```

### Important Principle

TravelVault owns assets.

YieldPosition tracks state.

YieldPosition must never become an asset custody layer.

---

# Revision 4: Yield Workflow

The canonical yield flow should be:

```text
TravelVault
↓
Deposit To Protocol
↓
Receive Receipt Asset
↓
Store Receipt Asset In Vault
↓
Create YieldPosition Metadata
```

### Example

```text
TravelVault
↓
Deposit 1000 USDC
↓
Receive 1000 sUSDC
↓
Store sUSDC In Vault
↓
Create YieldPosition
```

---

## Withdrawal Flow

```text
TravelVault
↓
Use Stored sUSDC
↓
Redeem From Protocol
↓
Receive USDC
↓
Update YieldPosition
```

This model keeps asset ownership simple and auditable.

---

# Revision 5: Reservation Refund Support

A dedicated dispute module is not required for MVP.

Instead, reservation functionality should support cancellation and refunds.

### reservation.move

Add:

```move
cancel_reservation()

refund_to_vault()
```

### Flow

```text
Reservation Cancelled
↓
Refund Received
↓
Funds Returned To TravelVault
↓
Reservation Status Updated
```

This covers the majority of real-world travel refund scenarios without introducing additional modules.

---

# Revision 6: Sponsored Transactions

Sponsored transactions are not required for MVP.

For hackathon scope:

```text
AI Agent
↓
Creates PTB
↓
User Reviews
↓
User Signs
↓
Execute Transaction
```

This is the default architecture.

Future roadmap may include:

* Sponsored Transactions
* zkLogin
* Shared Travel Vaults
* Group Travel Treasury
* Autonomous Gas Sponsorship

These features are intentionally out of scope for the initial implementation.

---

# Final Design Principles

1. TravelPlan is the root travel object.
2. TravelVault is the treasury object.
3. TravelVault owns all assets.
4. YieldPosition stores metadata only.
5. Budgets use dynamic BudgetItem structures.
6. AI agents orchestrate workflows.
7. Move contracts enforce ownership and state transitions.
8. PTBs are the primary execution mechanism.
9. Reservation refunds return funds to the vault.
10. TravelOS remains an orchestration layer, not a lending protocol, DEX, bridge, or staking protocol.

# Revision 7: Reservation NFT Display Standard

## Purpose

ReservationNFT is intended to serve as a verifiable on-chain travel receipt.

While the NFT functions correctly without additional metadata standards, implementing the Sui Display Standard significantly improves user experience.

Benefits include:

* Human-readable reservation records
* Better wallet integration
* Better explorer rendering
* Improved demo presentation
* Easier verification of bookings

This feature is not required for protocol security or business logic but is strongly recommended for user-facing applications.

Priority: Nice To Have

---

## Design Principle

ReservationNFT should not appear as a generic blockchain object.

Instead, it should appear as a recognizable travel booking record.

Example:

Instead of:

```text
ReservationNFT
Object ID: 0x123...
```

Users should see:

```text
🏨 Hilton Tokyo

Hotel Reservation Confirmed

Amount:
500 USDC

Check-in:
2026-10-10
```

or

```text
✈️ Bangkok → Tokyo

Flight Reservation Confirmed

Amount:
700 USDC
```

---

## ReservationNFT Metadata Fields

The ReservationNFT object should contain enough metadata to support rich display rendering.

Suggested structure:

```move
public struct ReservationNFT has key, store {
    id: UID,

    trip_id: u64,

    provider: String,

    reservation_type: u8,

    amount: u64,

    reservation_date: u64,

    metadata_url: String
}
```

---

## Reservation Types

```text
0 Hotel

1 Flight

2 Activity

3 Insurance

4 Transport
```

---

## Display Fields

The Display Standard should expose the following fields:

```text
name

description

image_url

provider

reservation_type

amount

reservation_date
```

---

## Example Display Metadata

### Hotel Reservation

```json
{
  "name": "Hilton Tokyo Reservation",
  "description": "Hotel reservation booked through TravelOS",
  "image_url": "https://travelos.xyz/assets/hotel.png",
  "provider": "Hilton Tokyo",
  "reservation_type": "Hotel",
  "amount": "500 USDC"
}
```

### Flight Reservation

```json
{
  "name": "Bangkok → Tokyo Flight",
  "description": "Flight reservation booked through TravelOS",
  "image_url": "https://travelos.xyz/assets/flight.png",
  "provider": "Japan Airlines",
  "reservation_type": "Flight",
  "amount": "700 USDC"
}
```

---

## Responsibilities

The reservation module should:

* Mint ReservationNFT objects
* Maintain reservation metadata
* Support Display Standard integration
* Expose user-friendly booking information

The reservation module should not:

* Store large images on-chain
* Store excessive metadata on-chain
* Act as a booking engine

ReservationNFT serves as a booking receipt and proof of reservation.

---

## Future Enhancements

Potential future upgrades:

* Dynamic NFT updates
* QR-code booking verification
* Airline / hotel integrations
* Travel loyalty rewards
* On-chain boarding passes
* Travel achievement badges

These features are outside MVP scope.

---

## MVP Recommendation

Implement basic Display Standard support for ReservationNFT.

This provides:

* Better wallet visibility
* Better explorer visibility
* More professional demos
* Improved user trust

without significantly increasing implementation complexity.

The ReservationNFT should function as a human-readable travel receipt rather than a generic blockchain object.

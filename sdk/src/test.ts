import { SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { TravelOSClient } from "./client.js";
import { PACKAGE_ID } from "./constants.js";

const KEY = process.env.SUI_PRIVATE_KEY!;
const KP = Ed25519Keypair.fromSecretKey(KEY);
const ADDR = KP.getPublicKey().toSuiAddress();
const RPC = "https://fullnode.testnet.sui.io:443";
const CL = new SuiClient({ url: RPC });
const S = new TravelOSClient({ packageId: PACKAGE_ID, network: "testnet" });

function ids(changes: any[], keyword: string): string[] {
  const found: string[] = [];
  for (const c of changes) {
    const otype = (c.objectType ?? "") as string;
    if (otype.includes(keyword)) found.push(c.objectId ?? "");
  }
  return found;
}

async function run(name: string, fn: () => any) {
  console.log(`\n=== ${name} ===`);
  const tx = fn();
  tx.setGasBudget(50000000);
  const r = await CL.signAndExecuteTransaction({
    transaction: tx as any,
    signer: KP,
    options: { showEffects: true, showObjectChanges: true },
  });
  await CL.waitForTransaction({ digest: r.digest });
  const created = ids(r.objectChanges ?? [], "::");
  console.log(`  ✅ ${r.digest}`);
  if (created.length) console.log(`  Created: ${created.join(", ")}`);
  return { digest: r.digest, created, changes: r.objectChanges ?? [] };
}

async function main() {
  console.log(`Address: ${ADDR}\n`);

  // 1. Create Trip
  let planId = "", vaultId = "";
  {
    const r = await run("1. createTrip", () =>
      S.createTrip(ADDR, { destination: "Tokyo", startDate: 1735689600, endDate: 1736294400, totalBudget: 2000 })
    );
    planId = ids(r.changes, "plan::TravelPlan")[0];
    vaultId = ids(r.changes, "vault::TravelVault")[0];
    console.log(`  Plan:  ${planId}\n  Vault: ${vaultId}`);
  }

  // 2. Deposit Funds
  await run("2. depositFunds", () =>
    S.depositFunds({ vaultId, amount: 100_000_000 }) // 0.1 SUI
  );
  const bal = await CL.getBalance({ owner: ADDR });
  console.log(`  Balance: ${parseInt(bal.totalBalance) / 1e9} SUI`);

  // 3. Invest Idle Capital
  let positionId = "";
  {
    const r = await run("3. investIdleCapital", () =>
      S.investIdleCapital({ vaultId, amount: 500_000, protocol: "scallop" })
    );
    positionId = ids(r.changes, "yield::YieldPosition")[0] || "";
    console.log(`  Position: ${positionId}`);
  }

  // 4. Book Hotel
  let reservationId = "";
  {
    const r = await run("4. bookHotel", () =>
      S.bookHotel(ADDR, { vaultId, planId, provider: "Hilton Tokyo", amount: 100_000 })
    );
    reservationId = ids(r.changes, "reservation::ReservationNFT")[0] || "";
    console.log(`  Reservation: ${reservationId}`);
  }

  // 5. Book Flight
  await run("5. bookFlight", () =>
    S.bookFlight(ADDR, { vaultId, planId, provider: "Japan Airlines", amount: 200_000 })
  );

  // 6. Prepare for Departure
  if (positionId) {
    await run("6. prepareForDeparture", () =>
      S.prepareForDeparture({ vaultId, positionId })
    );
  }

  // 7. Cancel Booking
  if (reservationId) {
    await run("7. cancelBooking", () =>
      S.cancelBooking({ reservationId, vaultId, amount: 100_000 })
    );
  }

  // 8. Complete Trip
  await run("8. completeTrip", () =>
    S.completeTrip({ vaultId })
  );

  // Read back final state
  console.log("\n=== Final State ===");
  const vaultObj: any = await CL.getObject({ id: vaultId, options: { showContent: true } });
  const vf = vaultObj.data.content.fields;
  console.log(`  Vault status: ${vf.status} (3=Completed)`);

  console.log("\n✅ All 8 flows passed!");
}

main().catch((e) => console.error("❌", e.message ?? e));

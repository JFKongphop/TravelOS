import { Transaction } from "@mysten/sui/transactions";
import { planModule, vaultModule } from '../modules.js';

export function createTripPTB(
  tx: Transaction,
  packageId: string,
  sender: string,
  input: { destination: string; startDate: number; endDate: number; totalBudget: number }
) {
  const plan = tx.moveCall({
    target: `${planModule(packageId)}::create_plan`,
    arguments: [
      tx.pure.string(input.destination),
      tx.pure.u64(input.startDate),
      tx.pure.u64(input.endDate),
      tx.pure.u64(input.totalBudget),
    ],
  });

  const vault = tx.moveCall({
    target: `${vaultModule(packageId)}::create_vault`,
    arguments: [plan, tx.pure.u64(input.endDate)],
  });

  tx.transferObjects([plan, vault], sender);
}

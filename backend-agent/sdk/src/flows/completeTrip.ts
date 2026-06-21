import { Transaction } from "@mysten/sui/transactions";
import { vaultModule } from '../modules.js';

export function completeTripPTB(
  tx: Transaction,
  packageId: string,
  input: { vaultId: string }
) {
  const vaultArg = tx.object(input.vaultId);

  // ReadyForTravel → Traveling → Completed
  tx.moveCall({
    target: `${vaultModule(packageId)}::mark_traveling`,
    arguments: [vaultArg],
  });
  tx.moveCall({
    target: `${vaultModule(packageId)}::mark_completed`,
    arguments: [vaultArg],
  });
}

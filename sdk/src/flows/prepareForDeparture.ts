import { Transaction } from "@mysten/sui/transactions";
import { vaultModule } from "../modules.js";

export function prepareForDeparturePTB(
  tx: Transaction,
  packageId: string,
  input: { vaultId: string },
) {
  const vaultArg = tx.object(input.vaultId);

  // Mark vault ready for travel (Active → ReadyForTravel)
  tx.moveCall({
    target: `${vaultModule(packageId)}::mark_ready`,
    arguments: [vaultArg],
  });
}

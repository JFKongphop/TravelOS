import { Transaction } from "@mysten/sui/transactions";
import { vaultModule, yieldModule } from "../modules.js";

export function investIdleCapitalPTB(
  tx: Transaction,
  packageId: string,
  sender: string,
  input: { vaultId: string; amount: number; protocol: string },
) {
  const vaultArg = tx.object(input.vaultId);

  // Create YieldPosition metadata (actual protocol deposit is future integration)
  const position = tx.moveCall({
    target: `${yieldModule(packageId)}::create_position`,
    arguments: [
      vaultArg,
      tx.pure.id(input.vaultId),
      tx.pure.string(input.protocol),
      tx.pure.u64(input.amount),
      tx.pure.string(`receipt_${input.protocol}`),
    ],
  });

  tx.transferObjects([position], sender);
}

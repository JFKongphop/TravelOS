import { Transaction } from "@mysten/sui/transactions";
import { vaultModule, yieldModule } from "../modules.js";

export function investIdleCapitalPTB(
  tx: Transaction,
  packageId: string,
  input: { vaultId: string; amount: number; protocol: string },
) {
  const vaultArg = tx.object(input.vaultId);

  // Withdraw from vault
  const [coin] = tx.moveCall({
    target: `${vaultModule(packageId)}::withdraw_coin`,
    arguments: [vaultArg, tx.pure.u64(input.amount)],
  });

  // NOTE: Actual protocol deposit (e.g. Scallop) is future integration.
  // Currently creates YieldPosition metadata only.
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
}

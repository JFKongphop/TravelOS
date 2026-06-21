import { Transaction } from "@mysten/sui/transactions";
import { vaultModule } from '../modules.js';

export function depositFundsPTB(
  tx: Transaction,
  packageId: string,
  input: { vaultId: string; amount: number }
) {
  const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(input.amount)]);

  tx.moveCall({
    target: `${vaultModule(packageId)}::deposit`,
    arguments: [tx.object(input.vaultId), coin],
  });
}

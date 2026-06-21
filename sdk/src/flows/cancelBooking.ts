import { Transaction } from "@mysten/sui/transactions";
import { vaultModule, reservationModule } from "../modules.js";

export function cancelBookingPTB(
  tx: Transaction,
  packageId: string,
  input: { reservationId: string; vaultId: string; amount: number },
) {
  const nftArg = tx.object(input.reservationId);

  tx.moveCall({
    target: `${reservationModule(packageId)}::cancel`,
    arguments: [nftArg],
  });

  tx.moveCall({
    target: `${reservationModule(packageId)}::refund_to_vault`,
    arguments: [nftArg, tx.object(input.vaultId), tx.pure.u64(input.amount)],
  });
}

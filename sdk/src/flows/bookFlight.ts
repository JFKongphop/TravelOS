import { Transaction } from "@mysten/sui/transactions";
import { vaultModule, paymentModule, reservationModule } from "../modules.js";
import { RESERVATION_TYPES } from "../constants.js";

export function bookFlightPTB(
  tx: Transaction,
  packageId: string,
  sender: string,
  input: { vaultId: string; planId: string; provider: string; amount: number },
) {
  const vaultArg = tx.object(input.vaultId);

  const intent = tx.moveCall({
    target: `${paymentModule(packageId)}::create_intent`,
    arguments: [
      vaultArg,
      tx.pure.id(input.vaultId),
      tx.pure.address(sender),
      tx.pure.u64(input.amount),
      tx.pure.u64(Math.floor(Date.now() / 1000) + 86400 * 30),
    ],
  });

  const receipt = tx.moveCall({
    target: `${paymentModule(packageId)}::execute_payment`,
    arguments: [intent, vaultArg],
  });

  const nft = tx.moveCall({
    target: `${reservationModule(packageId)}::mint`,
    arguments: [
      tx.pure.id(input.planId),
      tx.pure.string(input.provider),
      tx.pure.u8(RESERVATION_TYPES.FLIGHT),
      tx.pure.u64(input.amount),
      receipt,
    ],
  });

  // Transfer all non-drop objects to sender
  tx.transferObjects([intent, receipt, nft], sender);
}

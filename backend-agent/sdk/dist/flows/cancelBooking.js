import { reservationModule } from "../modules.js";
export function cancelBookingPTB(tx, packageId, input) {
    const nftArg = tx.object(input.reservationId);
    const vaultArg = tx.object(input.vaultId);
    tx.moveCall({
        target: `${reservationModule(packageId)}::cancel`,
        arguments: [nftArg],
    });
    // Split a coin from gas to simulate provider refund (MVP)
    const refundCoin = tx.splitCoins(tx.gas, [tx.pure.u64(input.amount)]);
    tx.moveCall({
        target: `${reservationModule(packageId)}::refund_to_vault`,
        arguments: [nftArg, vaultArg, refundCoin],
    });
}
//# sourceMappingURL=cancelBooking.js.map
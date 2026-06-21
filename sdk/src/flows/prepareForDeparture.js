import { vaultModule, yieldModule } from "../modules.js";
export function prepareForDeparturePTB(tx, packageId, input) {
    const vaultArg = tx.object(input.vaultId);
    const positionArg = tx.object(input.positionId);
    // Close yield position (metadata — real protocol withdrawal is future)
    tx.moveCall({
        target: `${yieldModule(packageId)}::close_position`,
        arguments: [positionArg, vaultArg],
    });
    // Mark vault ready
    tx.moveCall({
        target: `${vaultModule(packageId)}::mark_ready`,
        arguments: [vaultArg],
    });
}
//# sourceMappingURL=prepareForDeparture.js.map
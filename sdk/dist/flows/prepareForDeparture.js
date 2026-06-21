import { vaultModule } from "../modules.js";
export function prepareForDeparturePTB(tx, packageId, input) {
    const vaultArg = tx.object(input.vaultId);
    // Mark vault ready for travel (Active → ReadyForTravel)
    tx.moveCall({
        target: `${vaultModule(packageId)}::mark_ready`,
        arguments: [vaultArg],
    });
}
//# sourceMappingURL=prepareForDeparture.js.map
import { vaultModule } from '../modules.js';
export function completeTripPTB(tx, packageId, input) {
    const vaultArg = tx.object(input.vaultId);
    tx.moveCall({ target: `${vaultModule(packageId)}::mark_ready`,
        arguments: [vaultArg],
    });
    tx.moveCall({
        target: `${vaultModule(packageId)}::mark_traveling`,
        arguments: [vaultArg],
    });
    tx.moveCall({ target: `${vaultModule(packageId)}::mark_completed`,
        arguments: [vaultArg],
    });
}
//# sourceMappingURL=completeTrip.js.map
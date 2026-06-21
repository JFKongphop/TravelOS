import { vaultModule } from '../modules.js';
export function depositFundsPTB(tx, packageId, input) {
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(input.amount)]);
    tx.moveCall({
        target: `${vaultModule(packageId)}::deposit`,
        arguments: [tx.object(input.vaultId), coin],
    });
}
//# sourceMappingURL=depositFunds.js.map
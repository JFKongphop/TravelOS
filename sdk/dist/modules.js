import { PACKAGE_ID, MODULES } from './constants.js';
export function planModule(packageId = PACKAGE_ID) {
    return `${packageId}::${MODULES.PLAN}`;
}
export function vaultModule(packageId = PACKAGE_ID) {
    return `${packageId}::${MODULES.VAULT}`;
}
export function paymentModule(packageId = PACKAGE_ID) {
    return `${packageId}::${MODULES.PAYMENT}`;
}
export function reservationModule(packageId = PACKAGE_ID) {
    return `${packageId}::${MODULES.RESERVATION}`;
}
export function rulesModule(packageId = PACKAGE_ID) {
    return `${packageId}::${MODULES.RULES}`;
}
export function yieldModule(packageId = PACKAGE_ID) {
    return `${packageId}::${MODULES.YIELD}`;
}
//# sourceMappingURL=modules.js.map
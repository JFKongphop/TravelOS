import { PACKAGE_ID, MODULES } from './constants.js';

export function planModule(packageId: string = PACKAGE_ID): string {
  return `${packageId}::${MODULES.PLAN}`;
}

export function vaultModule(packageId: string = PACKAGE_ID): string {
  return `${packageId}::${MODULES.VAULT}`;
}

export function paymentModule(packageId: string = PACKAGE_ID): string {
  return `${packageId}::${MODULES.PAYMENT}`;
}

export function reservationModule(packageId: string = PACKAGE_ID): string {
  return `${packageId}::${MODULES.RESERVATION}`;
}

export function rulesModule(packageId: string = PACKAGE_ID): string {
  return `${packageId}::${MODULES.RULES}`;
}

export function yieldModule(packageId: string = PACKAGE_ID): string {
  return `${packageId}::${MODULES.YIELD}`;
}

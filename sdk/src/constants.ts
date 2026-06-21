export const PACKAGE_ID = "0x602448e9585149916ac0f6d716ad4875db80c2e45ff0afe9093edbc8a39dd9f1";

export const MODULES = {
  PLAN: "plan",
  VAULT: "vault",
  PAYMENT: "payment",
  RESERVATION: "reservation",
  RULES: "rules",
  YIELD: "yield",
} as const;

export const RESERVATION_TYPES = {
  HOTEL: 0,
  FLIGHT: 1,
  ACTIVITY: 2,
  INSURANCE: 3,
  TRANSPORT: 4,
} as const;

export const VAULT_STATUS = {
  ACTIVE: 0,
  READY_FOR_TRAVEL: 1,
  TRAVELING: 2,
  COMPLETED: 3,
} as const;

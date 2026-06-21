export const PACKAGE_ID = "0x5644eb839fa9311dd1967e396cd8e8906cfa052575d28ff2b3bab98631d737db";

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

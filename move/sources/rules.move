// Module: travel::rules
// Purpose: On-chain automation instructions — AI agents read rules, execute off-chain

module travel_os::rules {
  use std::string::{Self, String};
  use sui::{object::{Self, UID}, transfer, tx_context::TxContext};
  use travel_os::vault::{Self, TravelVault};

  // ============================================================
  // Errors
  // ============================================================

  const EInvalidRuleType: u64 = 0;
  const ENotVaultOwner: u64 = 1;
  const EAlreadyDisabled: u64 = 2;

  // ============================================================
  // Rule Types
  // ============================================================

  const RULE_STAKE_IDLE_FUNDS: u8 = 0;
  const RULE_WITHDRAW_BEFORE_TRIP: u8 = 1;
  const RULE_PAY_HOTEL: u8 = 2;
  const RULE_PAY_FLIGHT: u8 = 3;
  const RULE_PAY_INSURANCE: u8 = 4;
  const RULE_OFFRAMP_REMAINING: u8 = 5;

  // ============================================================
  // Structs
  // ============================================================

  public struct AutomationRule has key, store {
    id: UID,
    vault_id: u64,
    rule_type: u8,
    trigger_time: u64,
    enabled: bool,
  }

  // ============================================================
  // Public Functions
  // ============================================================

  public fun create_rule(
    vault: &TravelVault,
    vault_id: u64,
    rule_type: u8,
    trigger_time: u64,
    ctx: &mut TxContext,
  ): AutomationRule {
    assert!(vault::is_owner(vault, ctx.sender()), ENotVaultOwner);
    assert!(rule_type <= RULE_OFFRAMP_REMAINING, EInvalidRuleType);

    AutomationRule {
      id: object::new(ctx),
      vault_id,
      rule_type,
      trigger_time,
      enabled: true,
    }
  }

  public fun disable_rule(rule: &mut AutomationRule, vault: &TravelVault, ctx: &TxContext) {
    assert!(vault::is_owner(vault, ctx.sender()), ENotVaultOwner);
    assert!(rule.enabled, EAlreadyDisabled);
    rule.enabled = false;
  }

  public fun enable_rule(rule: &mut AutomationRule, vault: &TravelVault, ctx: &TxContext) {
    assert!(vault::is_owner(vault, ctx.sender()), ENotVaultOwner);
    rule.enabled = true;
  }

  // ============================================================
  // View Functions
  // ============================================================

  public fun is_enabled(rule: &AutomationRule): bool {
    rule.enabled
  }

  public fun rule_type(rule: &AutomationRule): u8 {
    rule.rule_type
  }

  public fun trigger_time(rule: &AutomationRule): u64 {
    rule.trigger_time
  }

  public fun rule_type_str(t: u8): String {
    if (t == RULE_STAKE_IDLE_FUNDS) { string::utf8(b"StakeIdleFunds") } else if (
      t == RULE_WITHDRAW_BEFORE_TRIP
    ) { string::utf8(b"WithdrawBeforeTrip") } else if (t == RULE_PAY_HOTEL) {
      string::utf8(b"PayHotel")
    } else if (t == RULE_PAY_FLIGHT) { string::utf8(b"PayFlight") } else if (
      t == RULE_PAY_INSURANCE
    ) { string::utf8(b"PayInsurance") } else { string::utf8(b"OffRampRemainingFunds") }
  }

  // ============================================================
  // Tests
  // ============================================================

  #[test]
  fun test_create_and_toggle_rule() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let vault = vault::new_test_vault(ctx);

    let mut rule = create_rule(&vault, 1, RULE_STAKE_IDLE_FUNDS, 50, ctx);
    assert!(is_enabled(&rule));
    assert!(rule_type(&rule) == RULE_STAKE_IDLE_FUNDS);

    disable_rule(&mut rule, &vault, ctx);
    assert!(!is_enabled(&rule));

    enable_rule(&mut rule, &vault, ctx);
    assert!(is_enabled(&rule));

    transfer::public_transfer(rule, user);
    transfer::public_transfer(vault, user);
    test_scenario::end(scenario);
  }

  #[test]
  #[expected_failure(abort_code = EAlreadyDisabled)]
  fun test_double_disable_fails() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let vault = vault::new_test_vault(ctx);
    let mut rule = create_rule(&vault, 1, RULE_WITHDRAW_BEFORE_TRIP, 100, ctx);
    disable_rule(&mut rule, &vault, ctx);
    disable_rule(&mut rule, &vault, ctx); // should fail

    transfer::public_transfer(rule, user);
    transfer::public_transfer(vault, user);
    test_scenario::end(scenario);
  }
}

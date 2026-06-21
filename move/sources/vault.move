// Module: travel::vault
// Purpose: Treasury layer — owns all travel assets, central custody object

module travel_os::vault {
  use std::string::{Self, String};
  use sui::{
    balance::{Self, Balance},
    coin::{Self, Coin},
    object::{Self, UID},
    sui::SUI,
    transfer,
    tx_context::TxContext
  };
  use travel_os::plan::{Self, TravelPlan};

  // ============================================================
  // Errors
  // ============================================================

  const EInvalidStatusTransition: u64 = 0;
  const EInsufficientFunds: u64 = 1;
  const ENotVaultOwner: u64 = 2;
  const EZeroAmount: u64 = 3;

  // ============================================================
  // Vault Status
  // ============================================================

  const STATUS_ACTIVE: u8 = 0;
  const STATUS_READY_FOR_TRAVEL: u8 = 1;
  const STATUS_TRAVELING: u8 = 2;
  const STATUS_COMPLETED: u8 = 3;

  // ============================================================
  // Structs
  // ============================================================

  public struct TravelVault has key, store {
    id: UID,
    owner: address,
    plan_id: u64,
    balance: Balance<SUI>,
    target_amount: u64,
    departure_time: u64,
    status: u8,
  }

  // ============================================================
  // Public Functions
  // ============================================================

  public fun create_vault(
    plan: &mut TravelPlan,
    plan_id: u64,
    departure_time: u64,
    ctx: &mut TxContext,
  ): TravelVault {
    plan::link_vault(plan, plan_id);

    TravelVault {
      id: object::new(ctx),
      owner: ctx.sender(),
      plan_id,
      balance: balance::zero(),
      target_amount: plan::total_budget(plan),
      departure_time,
      status: STATUS_ACTIVE,
    }
  }

  public fun deposit(vault: &mut TravelVault, coin: Coin<SUI>) {
    let amount = coin::value(&coin);
    assert!(amount > 0, EZeroAmount);
    coin::put(&mut vault.balance, coin);
  }

  public fun withdraw_balance(vault: &mut TravelVault, amount: u64, ctx: &TxContext): Balance<SUI> {
    assert!(vault.owner == ctx.sender(), ENotVaultOwner);
    assert!(amount > 0, EZeroAmount);
    assert!(balance::value(&vault.balance) >= amount, EInsufficientFunds);
    balance::split(&mut vault.balance, amount)
  }

  public fun withdraw_coin(vault: &mut TravelVault, amount: u64, ctx: &mut TxContext): Coin<SUI> {
    let bal = withdraw_balance(vault, amount, ctx);
    coin::from_balance(bal, ctx)
  }

  public fun deposit_balance(vault: &mut TravelVault, bal: Balance<SUI>) {
    balance::join(&mut vault.balance, bal);
  }

  // ============================================================
  // Status Transitions
  // ============================================================

  public fun mark_ready(vault: &mut TravelVault) {
    assert!(vault.status == STATUS_ACTIVE, EInvalidStatusTransition);
    vault.status = STATUS_READY_FOR_TRAVEL;
  }

  public fun mark_traveling(vault: &mut TravelVault) {
    assert!(vault.status == STATUS_READY_FOR_TRAVEL, EInvalidStatusTransition);
    vault.status = STATUS_TRAVELING;
  }

  public fun mark_completed(vault: &mut TravelVault) {
    assert!(
      vault.status == STATUS_TRAVELING || vault.status == STATUS_READY_FOR_TRAVEL,
      EInvalidStatusTransition,
    );
    vault.status = STATUS_COMPLETED;
  }

  // ============================================================
  // View Functions
  // ============================================================

  public fun balance_amount(vault: &TravelVault): u64 {
    balance::value(&vault.balance)
  }

  public fun status(vault: &TravelVault): u8 {
    vault.status
  }

  public fun is_owner(vault: &TravelVault, addr: address): bool {
    vault.owner == addr
  }

  public fun status_str(st: u8): String {
    if (st == STATUS_ACTIVE) { string::utf8(b"Active") } else if (st == STATUS_READY_FOR_TRAVEL) {
      string::utf8(b"ReadyForTravel")
    } else if (st == STATUS_TRAVELING) { string::utf8(b"Traveling") } else {
      string::utf8(b"Completed")
    }
  }

  // ============================================================
  // Tests
  // ============================================================

  #[test_only]
  public fun new_test_vault(ctx: &mut TxContext): TravelVault {
    TravelVault {
      id: object::new(ctx),
      owner: ctx.sender(),
      plan_id: 1,
      balance: balance::zero(),
      target_amount: 2000,
      departure_time: 200,
      status: STATUS_ACTIVE,
    }
  }

  #[test]
  fun test_deposit_and_withdraw() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let mut vault = new_test_vault(ctx);
    assert!(balance_amount(&vault) == 0);

    let coin = coin::mint_for_testing(1000, ctx);
    deposit(&mut vault, coin);
    assert!(balance_amount(&vault) == 1000);

    let withdrawn = withdraw_coin(&mut vault, 300, ctx);
    assert!(coin::value(&withdrawn) == 300);
    assert!(balance_amount(&vault) == 700);

    coin::burn_for_testing(withdrawn);
    transfer::public_transfer(vault, user);
    test_scenario::end(scenario);
  }

  #[test]
  #[expected_failure(abort_code = EInsufficientFunds)]
  fun test_withdraw_insufficient() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);
    let mut vault = new_test_vault(ctx);
    let coin = withdraw_coin(&mut vault, 100, ctx);
    coin::burn_for_testing(coin);
    transfer::public_transfer(vault, user);
    test_scenario::end(scenario);
  }

  #[test]
  fun test_status_transitions() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let mut vault = new_test_vault(ctx);
    assert!(vault.status == STATUS_ACTIVE);
    mark_ready(&mut vault);
    assert!(vault.status == STATUS_READY_FOR_TRAVEL);
    mark_traveling(&mut vault);
    assert!(vault.status == STATUS_TRAVELING);
    mark_completed(&mut vault);
    assert!(vault.status == STATUS_COMPLETED);

    transfer::public_transfer(vault, user);
    test_scenario::end(scenario);
  }
}

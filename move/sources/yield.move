// Module: travel::yield
// Purpose: Tracks travel capital deployed into DeFi protocols.
//          TravelVault owns the assets; YieldPosition is metadata-only.

module travel_os::yield {
  use std::string::{Self, String};
  use sui::{object::{Self, UID}, transfer, tx_context::TxContext};
  use travel_os::vault::{Self, TravelVault};

  // ============================================================
  // Errors
  // ============================================================

  const ENotVaultOwner: u64 = 0;
  const EAlreadyClosed: u64 = 1;
  const EZeroAmount: u64 = 2;

  // ============================================================
  // Position Status
  // ============================================================

  const STATUS_ACTIVE: u8 = 0;
  const STATUS_CLOSED: u8 = 1;

  // ============================================================
  // Structs
  // ============================================================

  public struct YieldPosition has key, store {
    id: UID,
    vault_id: u64,
    protocol_name: String,
    deposited_amount: u64,
    receipt_token_type: String,
    deposited_at: u64,
    closed_at: u64,
    status: u8,
  }

  // ============================================================
  // Public Functions
  // ============================================================

  public fun create_position(
    vault: &TravelVault,
    vault_id: u64,
    protocol_name: String,
    deposited_amount: u64,
    receipt_token_type: String,
    ctx: &mut TxContext,
  ): YieldPosition {
    assert!(vault::is_owner(vault, ctx.sender()), ENotVaultOwner);
    assert!(deposited_amount > 0, EZeroAmount);

    YieldPosition {
      id: object::new(ctx),
      vault_id,
      protocol_name,
      deposited_amount,
      receipt_token_type,
      deposited_at: ctx.epoch(),
      closed_at: 0,
      status: STATUS_ACTIVE,
    }
  }

  public fun close_position(position: &mut YieldPosition, vault: &TravelVault, ctx: &TxContext) {
    assert!(vault::is_owner(vault, ctx.sender()), ENotVaultOwner);
    assert!(position.status == STATUS_ACTIVE, EAlreadyClosed);

    position.status = STATUS_CLOSED;
    position.closed_at = ctx.epoch();
  }

  // ============================================================
  // View Functions
  // ============================================================

  public fun is_active(position: &YieldPosition): bool {
    position.status == STATUS_ACTIVE
  }

  public fun protocol(position: &YieldPosition): String {
    position.protocol_name
  }

  public fun deposited_amount(position: &YieldPosition): u64 {
    position.deposited_amount
  }

  public fun receipt_token_type(position: &YieldPosition): String {
    position.receipt_token_type
  }

  // ============================================================
  // Tests
  // ============================================================

  #[test]
  fun test_yield_position_lifecycle() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let vault = vault::new_test_vault(ctx);

    let mut position = create_position(
      &vault,
      1,
      string::utf8(b"Scallop"),
      1000,
      string::utf8(b"sUSDC"),
      ctx,
    );
    assert!(is_active(&position));
    assert!(deposited_amount(&position) == 1000);
    assert!(protocol(&position) == string::utf8(b"Scallop"));

    close_position(&mut position, &vault, ctx);
    assert!(!is_active(&position));

    transfer::public_transfer(position, user);
    transfer::public_transfer(vault, user);
    test_scenario::end(scenario);
  }

  #[test]
  #[expected_failure(abort_code = EAlreadyClosed)]
  fun test_double_close_fails() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let vault = vault::new_test_vault(ctx);
    let mut position = create_position(
      &vault,
      1,
      string::utf8(b"Scallop"),
      1000,
      string::utf8(b"sUSDC"),
      ctx,
    );
    close_position(&mut position, &vault, ctx);
    close_position(&mut position, &vault, ctx); // should fail

    transfer::public_transfer(position, user);
    transfer::public_transfer(vault, user);
    test_scenario::end(scenario);
  }
}

// Module: travel::payment
// Purpose: Handles travel payment execution — intent + receipt pattern

module travel_os::payment {
  use sui::{
    coin::{Self, Coin},
    event,
    object::{Self, ID, UID},
    sui::SUI,
    transfer,
    tx_context::TxContext
  };
  use travel_os::vault::{Self, TravelVault};

  // ============================================================
  // Errors
  // ============================================================

  const EAlreadyExecuted: u64 = 0;
  const ENotVaultOwner: u64 = 1;
  const EDeadlinePassed: u64 = 2;
  const EInsufficientVaultBalance: u64 = 3;

  // ============================================================
  // Events
  // ============================================================

  public struct PaymentIntentCreated has copy, drop { intent_id: ID, vault_id: ID, amount: u64 }
  public struct PaymentExecuted has copy, drop { intent_id: ID, receipt_id: ID, amount: u64 }

  // ============================================================
  // Structs
  // ============================================================

  public struct PaymentIntent has key, store {
    id: UID,
    vault_id: ID,
    merchant: address,
    amount: u64,
    deadline_epoch: u64,
    executed: bool,
  }

  public struct PaymentReceipt has key, store {
    id: UID,
    intent_id: ID,
    vault_id: ID,
    merchant: address,
    amount: u64,
    epoch: u64,
  }

  // ============================================================
  // Public Functions
  // ============================================================

  public fun create_intent(
    vault: &TravelVault,
    vault_id: ID,
    merchant: address,
    amount: u64,
    deadline_epoch: u64,
    ctx: &mut TxContext,
  ): PaymentIntent {
    assert!(vault::is_owner(vault, ctx.sender()), ENotVaultOwner);
    assert!(amount > 0, 0);
    assert!(deadline_epoch > ctx.epoch(), EDeadlinePassed);

    let intent = PaymentIntent {
      id: object::new(ctx),
      vault_id,
      merchant,
      amount,
      deadline_epoch,
      executed: false,
    };
    event::emit(PaymentIntentCreated {
      intent_id: object::uid_to_inner(&intent.id),
      vault_id,
      amount,
    });
    intent
  }

  public fun execute_payment(
    intent: &mut PaymentIntent,
    vault: &mut TravelVault,
    ctx: &mut TxContext,
  ): PaymentReceipt {
    assert!(!intent.executed, EAlreadyExecuted);
    assert!(vault::is_owner(vault, ctx.sender()), ENotVaultOwner);
    assert!(vault::balance_amount(vault) >= intent.amount, EInsufficientVaultBalance);

    intent.executed = true;

    let coin = vault::withdraw_coin(vault, intent.amount, ctx);

    // Transfer payment to merchant — real settlement
    transfer::public_transfer(coin, intent.merchant);

    let receipt = PaymentReceipt {
      id: object::new(ctx),
      intent_id: object::uid_to_inner(&intent.id),
      vault_id: intent.vault_id,
      merchant: intent.merchant,
      amount: intent.amount,
      epoch: ctx.epoch(),
    };

    event::emit(PaymentExecuted {
      intent_id: object::uid_to_inner(&intent.id),
      receipt_id: object::uid_to_inner(&receipt.id),
      amount: intent.amount,
    });
    receipt
  }

  // ============================================================
  // Entry Functions — direct wallet/CLI access
  // ============================================================

  entry fun create_intent_entry(
    vault: &TravelVault,
    vault_id: ID,
    merchant: address,
    amount: u64,
    deadline_epoch: u64,
    ctx: &mut TxContext,
  ) {
    let intent = create_intent(vault, vault_id, merchant, amount, deadline_epoch, ctx);
    transfer::public_transfer(intent, ctx.sender());
  }

  entry fun execute_payment_entry(
    intent: &mut PaymentIntent,
    vault: &mut TravelVault,
    ctx: &mut TxContext,
  ) {
    let receipt = execute_payment(intent, vault, ctx);
    transfer::public_transfer(receipt, ctx.sender());
  }

  // ============================================================
  // Test Helpers
  // ============================================================

  #[test_only]
  public fun new_test_receipt(ctx: &mut TxContext): PaymentReceipt {
    PaymentReceipt {
      id: object::new(ctx),
      intent_id: object::id_from_address(@0x1),
      vault_id: object::id_from_address(@0x1),
      merchant: @0xB,
      amount: 500,
      epoch: 100,
    }
  }

  // ============================================================
  // View Functions
  // ============================================================

  public fun is_executed(intent: &PaymentIntent): bool {
    intent.executed
  }

  // ============================================================
  // Tests
  // ============================================================

  #[test]
  fun test_payment_intent_lifecycle() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let merchant = @0xB;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let mut vault = vault::new_test_vault(ctx);
    let coin = coin::mint_for_testing(1000, ctx);
    vault::deposit(&mut vault, coin);

    let mut intent = create_intent(&vault, object::id_from_address(@0x1), merchant, 500, 9999, ctx);
    assert!(!is_executed(&intent));

    let receipt = execute_payment(&mut intent, &mut vault, ctx);
    assert!(is_executed(&intent));
    assert!(receipt.merchant == merchant);
    assert!(vault::balance_amount(&vault) == 500);

    transfer::public_transfer(intent, user);
    transfer::public_transfer(receipt, user);
    transfer::public_transfer(vault, user);
    test_scenario::end(scenario);
  }

  #[test]
  #[expected_failure(abort_code = EAlreadyExecuted)]
  fun test_double_execute_fails() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let merchant = @0xB;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let mut vault = vault::new_test_vault(ctx);
    let coin = coin::mint_for_testing(1000, ctx);
    vault::deposit(&mut vault, coin);

    let mut intent = create_intent(&vault, object::id_from_address(@0x1), merchant, 500, 9999, ctx);
    let r1 = execute_payment(&mut intent, &mut vault, ctx);
    transfer::public_transfer(r1, user);

    let r2 = execute_payment(&mut intent, &mut vault, ctx);
    transfer::public_transfer(r2, user);
    transfer::public_transfer(intent, user);
    transfer::public_transfer(vault, user);

    test_scenario::end(scenario);
  }
}

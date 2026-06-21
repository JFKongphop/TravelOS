// Module: travel::reservation
// Purpose: On-chain booking receipt — ReservationNFT with Display standard support

module travel_os::reservation {
  use std::string::{Self, String};
  use sui::{coin::Coin, display, event, object::{Self, ID, UID}, sui::SUI, transfer, tx_context::TxContext};
  use travel_os::{payment::{Self, PaymentReceipt}, vault::{Self, TravelVault}};

  // ============================================================
  // Errors
  // ============================================================

  const EInvalidReservationType: u64 = 0;
  const EAlreadyCancelled: u64 = 1;
  const ENotCancellable: u64 = 2;
  const EAlreadyRefunded: u64 = 4;

  // ============================================================
  // Events
  // ============================================================

  public struct ReservationMinted has copy, drop {
    reservation_id: ID,
    plan_id: ID,
    reservation_type: u8,
  }
  public struct ReservationCancelled has copy, drop { reservation_id: ID }
  public struct ReservationRefunded has copy, drop { reservation_id: ID }

  // ============================================================
  // Reservation Types
  // ============================================================

  const TYPE_HOTEL: u8 = 0;
  const TYPE_FLIGHT: u8 = 1;
  const TYPE_ACTIVITY: u8 = 2;
  const TYPE_INSURANCE: u8 = 3;
  const TYPE_TRANSPORT: u8 = 4;

  // ============================================================
  // Reservation Status
  // ============================================================

  const STATUS_CONFIRMED: u8 = 0;
  const STATUS_CANCELLED: u8 = 1;
  const STATUS_REFUNDED: u8 = 2;

  // ============================================================
  // Structs
  // ============================================================

  public struct ReservationNFT has key, store {
    id: UID,
    plan_id: ID,
    provider: String,
    reservation_type: u8,
    amount: u64,
    reservation_epoch: u64,
    status: u8,
  }

  // One-Time Witness for Display initialization
  public struct RESERVATION_NFT has drop {}

  // ============================================================
  // Display Initialization
  // ============================================================

  public fun init_display(
    _otw: RESERVATION_NFT,
    ctx: &mut TxContext,
  ): (sui::package::Publisher, display::Display<ReservationNFT>) {
    let publisher = sui::package::claim(_otw, ctx);
    let mut display = display::new<ReservationNFT>(&publisher, ctx);

    display::add(&mut display, string::utf8(b"name"), string::utf8(b"TravelOS Reservation"));
    display::add(
      &mut display,
      string::utf8(b"description"),
      string::utf8(b"Travel booking receipt from TravelOS"),
    );

    display::update_version(&mut display);

    (publisher, display)
  }

  // ============================================================
  // Public Functions
  // ============================================================

  public fun mint(
    plan_id: ID,
    provider: String,
    reservation_type: u8,
    amount: u64,
    _receipt: &PaymentReceipt,
    ctx: &mut TxContext,
  ): ReservationNFT {
    assert!(reservation_type <= TYPE_TRANSPORT, EInvalidReservationType);

    let nft = ReservationNFT {
      id: object::new(ctx),
      plan_id,
      provider,
      reservation_type,
      amount,
      reservation_epoch: ctx.epoch(),
      status: STATUS_CONFIRMED,
    };
    event::emit(ReservationMinted {
      reservation_id: object::uid_to_inner(&nft.id),
      plan_id,
      reservation_type,
    });
    nft
  }

  public fun cancel(nft: &mut ReservationNFT) {
    assert!(nft.status == STATUS_CONFIRMED, EAlreadyCancelled);
    nft.status = STATUS_CANCELLED;
    event::emit(ReservationCancelled { reservation_id: object::uid_to_inner(&nft.id) });
  }

  // Provider returns funds → deposited into vault → NFT marked refunded
  public fun refund_to_vault(
    nft: &mut ReservationNFT,
    vault: &mut TravelVault,
    refund_coin: Coin<SUI>,
    _ctx: &TxContext,
  ) {
    assert!(nft.status == STATUS_CANCELLED, ENotCancellable);
    assert!(nft.status != STATUS_REFUNDED, EAlreadyRefunded);
    nft.status = STATUS_REFUNDED;
    // Deposit the refund back into the travel vault
    vault::deposit(vault, refund_coin);
    event::emit(ReservationRefunded { reservation_id: object::uid_to_inner(&nft.id) });
  }

  // ============================================================
  // Entry Functions — direct wallet/CLI access
  // ============================================================

  entry fun mint_entry(
    plan_id: ID,
    provider: String,
    reservation_type: u8,
    amount: u64,
    receipt: &PaymentReceipt,
    ctx: &mut TxContext,
  ) {
    let nft = mint(plan_id, provider, reservation_type, amount, receipt, ctx);
    transfer::public_transfer(nft, ctx.sender());
  }

  entry fun cancel_entry(nft: &mut ReservationNFT) {
    cancel(nft);
  }

  entry fun refund_entry(
    nft: &mut ReservationNFT,
    vault: &mut TravelVault,
    refund_coin: Coin<SUI>,
    ctx: &mut TxContext,
  ) {
    refund_to_vault(nft, vault, refund_coin, ctx);
  }

  // ============================================================
  // View Functions
  // ============================================================

  public fun reservation_type_str(t: u8): String {
    if (t == TYPE_HOTEL) { string::utf8(b"Hotel") } else if (t == TYPE_FLIGHT) {
      string::utf8(b"Flight")
    } else if (t == TYPE_ACTIVITY) { string::utf8(b"Activity") } else if (t == TYPE_INSURANCE) {
      string::utf8(b"Insurance")
    } else { string::utf8(b"Transport") }
  }

  public fun status_str(s: u8): String {
    if (s == STATUS_CONFIRMED) { string::utf8(b"Confirmed") } else if (s == STATUS_CANCELLED) {
      string::utf8(b"Cancelled")
    } else { string::utf8(b"Refunded") }
  }

  public fun is_confirmed(nft: &ReservationNFT): bool {
    nft.status == STATUS_CONFIRMED
  }

  public fun reservation_type(nft: &ReservationNFT): u8 {
    nft.reservation_type
  }

  public fun is_cancelled(nft: &ReservationNFT): bool {
    nft.status == STATUS_CANCELLED
  }

  // ============================================================
  // Tests
  // ============================================================

  #[test]
  fun test_mint_and_cancel_reservation() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let receipt = payment::new_test_receipt(ctx);

    let plan_id = object::id_from_address(@0x1);
    let mut nft = mint(plan_id, string::utf8(b"Hilton Tokyo"), TYPE_HOTEL, 500, &receipt, ctx);
    assert!(is_confirmed(&nft));
    assert!(nft.reservation_type == TYPE_HOTEL);

    cancel(&mut nft);
    assert!(is_cancelled(&nft));
    assert!(!is_confirmed(&nft));

    transfer::public_transfer(nft, user);
    transfer::public_transfer(receipt, user);
    test_scenario::end(scenario);
  }

  #[test]
  #[expected_failure(abort_code = EAlreadyCancelled)]
  fun test_double_cancel_fails() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let receipt = payment::new_test_receipt(ctx);

    let plan_id = object::id_from_address(@0x1);
    let mut nft = mint(plan_id, string::utf8(b"Hilton Tokyo"), TYPE_HOTEL, 500, &receipt, ctx);
    cancel(&mut nft);
    cancel(&mut nft); // should fail

    transfer::public_transfer(nft, user);
    transfer::public_transfer(receipt, user);
    test_scenario::end(scenario);
  }
}

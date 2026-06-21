// Module: travel::reservation
// Purpose: On-chain booking receipt — ReservationNFT with Display standard support

module travel_os::reservation {
  use std::string::{Self, String};
  use sui::{display, object::{Self, UID}, transfer, tx_context::TxContext};
  use travel_os::{payment::{Self, PaymentReceipt}, vault::{Self, TravelVault}};

  // ============================================================
  // Errors
  // ============================================================

  const EInvalidReservationType: u64 = 0;
  const EAlreadyCancelled: u64 = 1;
  const ENotCancellable: u64 = 2;
  const EAlreadyRefunded: u64 = 4;

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
    trip_id: u64,
    provider: String,
    reservation_type: u8,
    amount: u64,
    reservation_date: u64,
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
    trip_id: u64,
    provider: String,
    reservation_type: u8,
    amount: u64,
    _receipt: &PaymentReceipt,
    ctx: &mut TxContext,
  ): ReservationNFT {
    assert!(reservation_type <= TYPE_TRANSPORT, EInvalidReservationType);

    ReservationNFT {
      id: object::new(ctx),
      trip_id,
      provider,
      reservation_type,
      amount,
      reservation_date: ctx.epoch(),
      status: STATUS_CONFIRMED,
    }
  }

  public fun cancel(nft: &mut ReservationNFT) {
    assert!(nft.status == STATUS_CONFIRMED, EAlreadyCancelled);
    nft.status = STATUS_CANCELLED;
  }

  public fun refund_to_vault(
    nft: &mut ReservationNFT,
    _vault: &mut TravelVault,
    _refund_amount: u64,
    _ctx: &TxContext,
  ) {
    assert!(nft.status == STATUS_CANCELLED, ENotCancellable);
    assert!(nft.status != STATUS_REFUNDED, EAlreadyRefunded);
    nft.status = STATUS_REFUNDED;
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

    let mut nft = mint(1, string::utf8(b"Hilton Tokyo"), TYPE_HOTEL, 500, &receipt, ctx);
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

    let mut nft = mint(1, string::utf8(b"Hilton Tokyo"), TYPE_HOTEL, 500, &receipt, ctx);
    cancel(&mut nft);
    cancel(&mut nft); // should fail

    transfer::public_transfer(nft, user);
    transfer::public_transfer(receipt, user);
    test_scenario::end(scenario);
  }
}

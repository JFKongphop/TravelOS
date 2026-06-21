// Module: travel::flow_tests
// Purpose: Cross-module business flow tests and PTB simulation tests

module travel_os::flow_tests {
  use sui::{coin::{Self, Coin}, sui::SUI, transfer};
  use travel_os::{payment, plan, reservation, vault, yield};

  // ============================================================
  // Test Helpers
  // ============================================================

  #[test_only]
  fun setup_plan_and_vault(
    ctx: &mut sui::tx_context::TxContext,
  ): (plan::TravelPlan, vault::TravelVault) {
    let mut p = plan::create_plan(std::string::utf8(b"Tokyo"), 100, 200, 2000, ctx);
    let v = vault::create_vault(&mut p, 200, ctx);
    (p, v)
  }

  #[test_only]
  fun fund_vault(v: &mut vault::TravelVault, amount: u64, ctx: &mut sui::tx_context::TxContext) {
    let coin = coin::mint_for_testing(amount, ctx);
    vault::deposit(v, coin);
  }

  #[test_only]
  fun vault_obj_id(v: &vault::TravelVault): sui::object::ID {
    sui::object::id(v)
  }

  // ============================================================
  // --- Flow A: Create Travel Treasury ---
  // ============================================================

  #[test]
  fun flow_create_travel_treasury() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let (p, mut v) = setup_plan_and_vault(ctx);
    fund_vault(&mut v, 2000, ctx);

    assert!(plan::total_budget(&p) == 2000);
    assert!(vault::balance_amount(&v) == 2000);

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    test_scenario::end(scenario);
  }

  // ============================================================
  // --- Flow B: Yield Allocation ---
  // ============================================================

  #[test]
  fun flow_yield_allocation() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let (p, raw_v) = setup_plan_and_vault(ctx);
    let mut v = raw_v;
    fund_vault(&mut v, 1000, ctx);
    let vid = vault_obj_id(&v);

    let pos = yield::create_position(&v, vid, std::string::utf8(b"Scallop"), 500, std::string::utf8(b"sUSDC"), ctx);

    assert!(yield::is_active(&pos));
    assert!(yield::deposited_amount(&pos) == 500);

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    transfer::public_transfer(pos, user);
    test_scenario::end(scenario);
  }

  // ============================================================
  // --- Flow C: Hotel Booking ---
  // ============================================================

  #[test]
  fun flow_hotel_booking() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let merchant = @0xB;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let (p, mut v) = setup_plan_and_vault(ctx);
    fund_vault(&mut v, 2000, ctx);
    let vid = vault_obj_id(&v);
    let bal_before = vault::balance_amount(&v);

    let mut intent = payment::create_intent(&v, vid, merchant, 500, 9999, ctx);
    let (pcoin, receipt) = payment::execute_payment(&mut intent, &mut v, ctx);

    let pid = sui::object::id(&p);
    let nft = reservation::mint(pid, std::string::utf8(b"Hilton Tokyo"), 0, 500, &receipt, ctx);

    assert!(payment::is_executed(&intent));
    assert!(vault::balance_amount(&v) == bal_before - 500);
    assert!(reservation::is_confirmed(&nft));

    coin::burn_for_testing(pcoin);
    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    transfer::public_transfer(intent, user);
    transfer::public_transfer(receipt, user);
    transfer::public_transfer(nft, user);
    test_scenario::end(scenario);
  }

  // ============================================================
  // --- Flow D: Reservation Refund ---
  // ============================================================

  #[test]
  fun flow_reservation_refund() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let merchant = @0xB;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let (p, mut v) = setup_plan_and_vault(ctx);
    fund_vault(&mut v, 2000, ctx);
    let vid = vault_obj_id(&v);

    let mut intent = payment::create_intent(&v, vid, merchant, 500, 9999, ctx);
    let (pcoin, receipt) = payment::execute_payment(&mut intent, &mut v, ctx);
    coin::burn_for_testing(pcoin);

    let pid = sui::object::id(&p);
    let mut nft = reservation::mint(pid, std::string::utf8(b"Hilton Tokyo"), 0, 500, &receipt, ctx);

    reservation::cancel(&mut nft);
    assert!(reservation::is_cancelled(&nft));

    reservation::refund_to_vault(&mut nft, &mut v, 500, ctx);
    assert!(!reservation::is_confirmed(&nft));

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    transfer::public_transfer(intent, user);
    transfer::public_transfer(receipt, user);
    transfer::public_transfer(nft, user);
    test_scenario::end(scenario);
  }

  // ============================================================
  // --- Flow E: Complete Travel Lifecycle ---
  // ============================================================

  #[test]
  fun flow_complete_travel_lifecycle() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let merchant = @0xB;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let (p, mut v) = setup_plan_and_vault(ctx);
    fund_vault(&mut v, 2000, ctx);
    assert!(vault::balance_amount(&v) == 2000);
    let vid = vault_obj_id(&v);

    let mut pos = yield::create_position(&v, vid, std::string::utf8(b"Scallop"), 1000, std::string::utf8(b"sUSDC"), ctx);
    assert!(yield::is_active(&pos));

    yield::close_position(&mut pos, &v, ctx);
    assert!(!yield::is_active(&pos));

    let mut intent = payment::create_intent(&v, vid, merchant, 500, 9999, ctx);
    let (pcoin, receipt) = payment::execute_payment(&mut intent, &mut v, ctx);
    coin::burn_for_testing(pcoin);

    let pid = sui::object::id(&p);
    let nft = reservation::mint(pid, std::string::utf8(b"Hilton Tokyo"), 0, 500, &receipt, ctx);
    assert!(reservation::is_confirmed(&nft));
    assert!(payment::is_executed(&intent));

    vault::mark_ready(&mut v);
    vault::mark_traveling(&mut v);
    vault::mark_completed(&mut v);
    assert!(vault::status(&v) == 3);

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    transfer::public_transfer(intent, user);
    transfer::public_transfer(receipt, user);
    transfer::public_transfer(nft, user);
    transfer::public_transfer(pos, user);
    test_scenario::end(scenario);
  }

  // ============================================================
  // --- PTB Flow 1: Create Travel Treasury ---
  // ============================================================

  #[test]
  fun ptb_create_travel_treasury() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let (p, mut v) = setup_plan_and_vault(ctx);
    fund_vault(&mut v, 1000, ctx);

    assert!(plan::total_budget(&p) == 2000);
    assert!(vault::balance_amount(&v) == 1000);

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    test_scenario::end(scenario);
  }

  // ============================================================
  // --- PTB Flow 2: Invest Idle Capital ---
  // ============================================================

  #[test]
  fun ptb_invest_idle_capital() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let (p, raw_v) = setup_plan_and_vault(ctx);
    let mut v = raw_v;
    fund_vault(&mut v, 2000, ctx);
    let vid = vault_obj_id(&v);

    let pos = yield::create_position(&v, vid, std::string::utf8(b"Scallop"), 1000, std::string::utf8(b"sUSDC"), ctx);

    assert!(yield::is_active(&pos));
    assert!(yield::deposited_amount(&pos) == 1000);

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    transfer::public_transfer(pos, user);
    test_scenario::end(scenario);
  }

  // ============================================================
  // --- PTB Flow 3: Prepare For Departure ---
  // ============================================================

  #[test]
  fun ptb_prepare_for_departure() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let (p, raw_v) = setup_plan_and_vault(ctx);
    let mut v = raw_v;
    fund_vault(&mut v, 2000, ctx);
    let vid = vault_obj_id(&v);

    let mut pos = yield::create_position(&v, vid, std::string::utf8(b"Scallop"), 1000, std::string::utf8(b"sUSDC"), ctx);

    yield::close_position(&mut pos, &v, ctx);
    vault::mark_ready(&mut v);

    assert!(!yield::is_active(&pos));
    assert!(vault::status(&v) == 1);

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    transfer::public_transfer(pos, user);
    test_scenario::end(scenario);
  }

  // ============================================================
  // --- PTB Flow 4: Hotel Reservation ---
  // ============================================================

  #[test]
  fun ptb_hotel_reservation() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let merchant = @0xB;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let (p, mut v) = setup_plan_and_vault(ctx);
    fund_vault(&mut v, 2000, ctx);
    let vid = vault_obj_id(&v);

    let mut intent = payment::create_intent(&v, vid, merchant, 500, 9999, ctx);
    let (pcoin, receipt) = payment::execute_payment(&mut intent, &mut v, ctx);
    coin::burn_for_testing(pcoin);

    let pid = sui::object::id(&p);
    let nft = reservation::mint(pid, std::string::utf8(b"Hilton Tokyo"), 0, 500, &receipt, ctx);

    assert!(reservation::is_confirmed(&nft));
    assert!(payment::is_executed(&intent));

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    transfer::public_transfer(intent, user);
    transfer::public_transfer(receipt, user);
    transfer::public_transfer(nft, user);
    test_scenario::end(scenario);
  }

  // ============================================================
  // --- PTB Flow 5: Flight Booking ---
  // ============================================================

  #[test]
  fun ptb_flight_booking() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let merchant = @0xC;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let (p, mut v) = setup_plan_and_vault(ctx);
    fund_vault(&mut v, 2000, ctx);
    let vid = vault_obj_id(&v);

    let mut intent = payment::create_intent(&v, vid, merchant, 700, 9999, ctx);
    let (pcoin, receipt) = payment::execute_payment(&mut intent, &mut v, ctx);
    coin::burn_for_testing(pcoin);

    let pid = sui::object::id(&p);
    let nft = reservation::mint(pid, std::string::utf8(b"Japan Airlines"), 1, 700, &receipt, ctx);

    assert!(reservation::is_confirmed(&nft));
    assert!(vault::balance_amount(&v) == 1300);

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    transfer::public_transfer(intent, user);
    transfer::public_transfer(receipt, user);
    transfer::public_transfer(nft, user);
    test_scenario::end(scenario);
  }

  // ============================================================
  // --- PTB Flow 6: Trip Completion ---
  // ============================================================

  #[test]
  fun ptb_trip_completion() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let merchant = @0xB;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let (p, mut v) = setup_plan_and_vault(ctx);
    fund_vault(&mut v, 2000, ctx);
    let vid = vault_obj_id(&v);

    let mut intent = payment::create_intent(&v, vid, merchant, 500, 9999, ctx);
    let (pcoin, receipt) = payment::execute_payment(&mut intent, &mut v, ctx);
    coin::burn_for_testing(pcoin);

    assert!(vault::balance_amount(&v) == 1500);

    vault::mark_ready(&mut v);
    vault::mark_traveling(&mut v);
    vault::mark_completed(&mut v);
    assert!(vault::status(&v) == 3);

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    transfer::public_transfer(intent, user);
    transfer::public_transfer(receipt, user);
    test_scenario::end(scenario);
  }
}

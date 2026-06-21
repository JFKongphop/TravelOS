// Module: travel::flow_tests
// Purpose: Cross-module business flow tests and PTB simulation tests

module travel_os::flow_tests {
  use sui::{coin::{Self, Coin}, sui::SUI, transfer};
  use travel_os::{payment, plan, reservation, rules, vault, yield};

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
    let receipt = payment::execute_payment(&mut intent, &mut v, ctx);

    let pid = sui::object::id(&p);
    let nft = reservation::mint(pid, std::string::utf8(b"Hilton Tokyo"), 0, 500, &receipt, ctx);

    assert!(payment::is_executed(&intent));
    assert!(vault::balance_amount(&v) == bal_before - 500);
    assert!(reservation::is_confirmed(&nft));

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
    let receipt = payment::execute_payment(&mut intent, &mut v, ctx);

    let pid = sui::object::id(&p);
    let mut nft = reservation::mint(pid, std::string::utf8(b"Hilton Tokyo"), 0, 500, &receipt, ctx);

    reservation::cancel(&mut nft);
    assert!(reservation::is_cancelled(&nft));

    let refund_coin = coin::mint_for_testing<SUI>(500, ctx);
    reservation::refund_to_vault(&mut nft, &mut v, refund_coin, ctx);
    assert!(!reservation::is_confirmed(&nft));

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    transfer::public_transfer(intent, user);
    transfer::public_transfer(receipt, user);
    transfer::public_transfer(nft, user);
    test_scenario::end(scenario);
  }

  // ============================================================
  // --- Flow E: Complete Travel Lifecycle (canonical — all 12 flows / 14 assertions) ---
  // ============================================================

  #[test]
  fun flow_complete_travel_lifecycle() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let hotel_merchant = @0xB;
    let flight_merchant = @0xC;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    // --- Flow 1: Create Travel Plan with 4 budget items ---
    let mut p = plan::create_plan(std::string::utf8(b"Tokyo"), 100, 200, 2000, ctx);
    plan::add_budget_item(&mut p, 0, 800, std::string::utf8(b"Hotel"));
    plan::add_budget_item(&mut p, 1, 700, std::string::utf8(b"Flight"));
    plan::add_budget_item(&mut p, 2, 300, std::string::utf8(b"Activities"));
    plan::add_budget_item(&mut p, 3, 200, std::string::utf8(b"Transport"));
    assert!(plan::total_budget(&p) == 2000);
    assert!(plan::total_allocated(&p) == 2000);

    // --- Flow 2: Create Travel Vault linked to Plan ---
    let mut v = vault::create_vault(&mut p, 200, ctx);
    assert!(vault::status(&v) == 0); // STATUS_ACTIVE
    assert!(vault::balance_amount(&v) == 0);

    // --- Flow 3: Deposit Funds ---
    let deposit = coin::mint_for_testing<SUI>(2000, ctx);
    vault::deposit(&mut v, deposit);
    assert!(vault::balance_amount(&v) == 2000);
    let vid = vault_obj_id(&v);

    // --- Flow 4: Create Automation Rules ---
    let rule_stake    = rules::create_rule(&v, vid, 0, 9999, ctx); // STAKE_IDLE_FUNDS
    let rule_withdraw = rules::create_rule(&v, vid, 1, 9998, ctx); // WITHDRAW_BEFORE_TRIP
    assert!(rules::is_enabled(&rule_stake));
    assert!(rules::is_enabled(&rule_withdraw));

    // --- Flow 5: Create Yield Position ---
    let mut pos = yield::create_position(&v, vid, std::string::utf8(b"Scallop"), 1000, std::string::utf8(b"sUSDC"), ctx);
    assert!(yield::is_active(&pos));
    assert!(yield::deposited_amount(&pos) == 1000);

    // --- Flow 6-7: Hotel Payment Intent + Reservation NFT ---
    let mut hotel_intent = payment::create_intent(&v, vid, hotel_merchant, 500, 9999, ctx);
    let hotel_receipt   = payment::execute_payment(&mut hotel_intent, &mut v, ctx);
    let pid             = sui::object::id(&p);
    let hotel_nft       = reservation::mint(pid, std::string::utf8(b"Hilton Tokyo"), 0, 500, &hotel_receipt, ctx);
    assert!(payment::is_executed(&hotel_intent));
    assert!(reservation::is_confirmed(&hotel_nft));

    // --- Flow 8-9: Flight Payment Intent + Reservation NFT ---
    let mut flight_intent = payment::create_intent(&v, vid, flight_merchant, 700, 9999, ctx);
    let flight_receipt    = payment::execute_payment(&mut flight_intent, &mut v, ctx);
    let flight_nft        = reservation::mint(pid, std::string::utf8(b"Japan Airlines"), 1, 700, &flight_receipt, ctx);
    assert!(payment::is_executed(&flight_intent));
    assert!(reservation::is_confirmed(&flight_nft));
    assert!(vault::balance_amount(&v) == 800); // 2000 - 500 hotel - 700 flight

    // --- Flow 10: Prepare For Departure (close yield → mark ready) ---
    yield::close_position(&mut pos, &v, ctx);
    assert!(!yield::is_active(&pos));
    vault::mark_ready(&mut v);
    assert!(vault::status(&v) == 1); // STATUS_READY_FOR_TRAVEL

    // --- Flow 11: Start Trip ---
    vault::mark_traveling(&mut v);
    assert!(vault::status(&v) == 2); // STATUS_TRAVELING

    // --- Flow 12: Complete Trip ---
    vault::mark_completed(&mut v);
    assert!(vault::status(&v) == 3); // STATUS_COMPLETED

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    transfer::public_transfer(hotel_intent, user);
    transfer::public_transfer(hotel_receipt, user);
    transfer::public_transfer(hotel_nft, user);
    transfer::public_transfer(flight_intent, user);
    transfer::public_transfer(flight_receipt, user);
    transfer::public_transfer(flight_nft, user);
    transfer::public_transfer(pos, user);
    transfer::public_transfer(rule_stake, user);
    transfer::public_transfer(rule_withdraw, user);
    test_scenario::end(scenario);
  }

  // ============================================================
  // --- Flow F: Automation Rules (FLOW_TEST.md Flow 4) ---
  // ============================================================

  #[test]
  fun flow_create_automation_rules() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);

    let (p, mut v) = setup_plan_and_vault(ctx);
    fund_vault(&mut v, 1000, ctx);
    let vid = vault_obj_id(&v);

    // Create stake-idle-funds rule
    let mut rule_stake = rules::create_rule(&v, vid, 0, 9999, ctx);
    // Create withdraw-before-trip rule
    let mut rule_withdraw = rules::create_rule(&v, vid, 1, 9998, ctx);

    assert!(rules::is_enabled(&rule_stake));
    assert!(rules::is_enabled(&rule_withdraw));

    rules::disable_rule(&mut rule_stake, &v, ctx);
    assert!(!rules::is_enabled(&rule_stake));

    rules::enable_rule(&mut rule_stake, &v, ctx);
    assert!(rules::is_enabled(&rule_stake));

    transfer::public_transfer(p, user);
    transfer::public_transfer(v, user);
    transfer::public_transfer(rule_stake, user);
    transfer::public_transfer(rule_withdraw, user);
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
    let receipt = payment::execute_payment(&mut intent, &mut v, ctx);

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
    let receipt = payment::execute_payment(&mut intent, &mut v, ctx);

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
    let receipt = payment::execute_payment(&mut intent, &mut v, ctx);

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

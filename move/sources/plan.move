// Module: travel::plan
// Purpose: Represents the travel goal — source of truth for the trip

module travel_os::plan {
  use std::string::{Self, String};
  use sui::{event, object::{Self, ID, UID}, transfer, tx_context::TxContext};

  // ============================================================
  // Errors
  // ============================================================

  const EInvalidBudgetCategory: u64 = 0;
  const EZeroAmount: u64 = 1;
  const EExceedsTotalBudget: u64 = 2;
  const EInvalidDates: u64 = 3;

  // ============================================================
  // Events
  // ============================================================

  public struct PlanCreated has copy, drop { plan_id: ID, destination: String, total_budget: u64 }

  // ============================================================
  // Budget Categories
  // ============================================================

  const CATEGORY_HOTEL: u8 = 0;
  const CATEGORY_FLIGHT: u8 = 1;
  const CATEGORY_ACTIVITY: u8 = 2;
  const CATEGORY_TRANSPORT: u8 = 3;
  const CATEGORY_INSURANCE: u8 = 4;
  const CATEGORY_FOOD: u8 = 5;
  const CATEGORY_OTHER: u8 = 6;

  // ============================================================
  // Structs
  // ============================================================

  public struct BudgetItem has drop, store {
    category: u8,
    amount: u64,
    label: String,
  }

  public struct TravelPlan has key, store {
    id: UID,
    owner: address,
    destination: String,
    start_date: u64,
    end_date: u64,
    total_budget: u64,
    budget_items: vector<BudgetItem>,
    vault_id: ID,
  }

  // ============================================================
  // Public Functions
  // ============================================================

  public fun create_plan(
    destination: String,
    start_date: u64,
    end_date: u64,
    total_budget: u64,
    ctx: &mut TxContext,
  ): TravelPlan {
    assert!(start_date < end_date, EInvalidDates);
    assert!(total_budget > 0, EZeroAmount);

    let plan = TravelPlan {
      id: object::new(ctx),
      owner: ctx.sender(),
      destination,
      start_date,
      end_date,
      total_budget,
      budget_items: vector[],
      vault_id: object::id_from_address(@0x0),
    };
    event::emit(PlanCreated {
      plan_id: object::uid_to_inner(&plan.id),
      destination: plan.destination,
      total_budget,
    });
    plan
  }

  public fun add_budget_item(plan: &mut TravelPlan, category: u8, amount: u64, label: String) {
    assert!(category <= CATEGORY_OTHER, EInvalidBudgetCategory);
    assert!(amount > 0, EZeroAmount);

    let current_total = total_allocated(plan);
    assert!(current_total + amount <= plan.total_budget, EExceedsTotalBudget);

    vector::push_back(&mut plan.budget_items, BudgetItem { category, amount, label });
  }

  public fun link_vault(plan: &mut TravelPlan, vault_id: ID) {
    plan.vault_id = vault_id;
  }

  // ============================================================
  // View / Accessor Functions
  // ============================================================

  public fun total_budget(plan: &TravelPlan): u64 {
    plan.total_budget
  }

  public fun total_allocated(plan: &TravelPlan): u64 {
    let mut total: u64 = 0;
    let mut i: u64 = 0;
    let len = vector::length(&plan.budget_items);
    while (i < len) {
      let item = vector::borrow(&plan.budget_items, i);
      total = total + item.amount;
      i = i + 1;
    };
    total
  }

  public fun vault_id(plan: &TravelPlan): ID {
    plan.vault_id
  }

  public fun remaining_budget(plan: &TravelPlan): u64 {
    plan.total_budget - total_allocated(plan)
  }

  public fun category_str(category: u8): String {
    if (category == CATEGORY_HOTEL) { string::utf8(b"Hotel") } else if (
      category == CATEGORY_FLIGHT
    ) { string::utf8(b"Flight") } else if (category == CATEGORY_ACTIVITY) {
      string::utf8(b"Activity")
    } else if (category == CATEGORY_TRANSPORT) { string::utf8(b"Transport") } else if (
      category == CATEGORY_INSURANCE
    ) { string::utf8(b"Insurance") } else if (category == CATEGORY_FOOD) { string::utf8(b"Food") }
    else { string::utf8(b"Other") }
  }

  // ============================================================
  // Tests
  // ============================================================

  #[test_only]
  public fun new_test_plan(ctx: &mut TxContext): TravelPlan {
    create_plan(string::utf8(b"Tokyo"), 100, 200, 2000, ctx)
  }

  #[test]
  fun test_create_plan() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);
    let plan = create_plan(string::utf8(b"Tokyo"), 100, 200, 2000, ctx);
    assert!(plan.total_budget == 2000);
    assert!(plan.start_date == 100);
    assert!(plan.end_date == 200);
    assert!(total_allocated(&plan) == 0);
    transfer::public_transfer(plan, user);
    test_scenario::end(scenario);
  }

  #[test]
  fun test_add_budget_item() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);
    let mut plan = create_plan(string::utf8(b"Tokyo"), 100, 200, 2000, ctx);
    add_budget_item(&mut plan, CATEGORY_HOTEL, 800, string::utf8(b"Tokyo Hotel"));
    add_budget_item(&mut plan, CATEGORY_FLIGHT, 700, string::utf8(b"Flight BKK-TYO"));
    assert!(total_allocated(&plan) == 1500);
    assert!(remaining_budget(&plan) == 500);
    transfer::public_transfer(plan, user);
    test_scenario::end(scenario);
  }

  #[test]
  #[expected_failure(abort_code = EExceedsTotalBudget)]
  fun test_budget_exceeded() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);
    let mut plan = create_plan(string::utf8(b"Tokyo"), 100, 200, 1000, ctx);
    add_budget_item(&mut plan, CATEGORY_HOTEL, 1200, string::utf8(b"Too Expensive"));
    transfer::public_transfer(plan, user);
    test_scenario::end(scenario);
  }

  #[test]
  fun test_link_vault() {
    use sui::test_scenario::Self;
    let user = @0xA;
    let mut scenario = test_scenario::begin(user);
    let ctx = test_scenario::ctx(&mut scenario);
    let mut plan = new_test_plan(ctx);
    let vault_id = object::id_from_address(@0xB);
    link_vault(&mut plan, vault_id);
    assert!(vault_id(&plan) == vault_id);
    transfer::public_transfer(plan, user);
    test_scenario::end(scenario);
  }
}

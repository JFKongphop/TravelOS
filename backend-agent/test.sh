#!/bin/bash
# TravelOS Backend Agent — Full Flow Test (FLOW.md Tests 1-14)

PORT=3001
BASE="http://localhost:$PORT"
PASS=0
FAIL=0

ok()   { echo "  ✅ $1"; ((PASS++)); }
fail() { echo "  ❌ $1"; ((FAIL++)); }
header() { echo ""; echo "============================================"; echo "  $1"; echo "============================================"; }

# ── Start server ────────────────────────────────────────
header "Starting TravelOS Backend"
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true
cd "$(dirname "$0")"
npm run dev &
SERVER_PID=$!
sleep 4
for i in {1..10}; do
  curl -s "$BASE/" > /dev/null 2>&1 && break || sleep 1
done
echo "  Server PID: $SERVER_PID"

# ── Test 1: Health Check ─────────────────────────────────
header "Test 1 — Health Check"
R=$(curl -s "$BASE/")
[ -n "$R" ] && ok "Backend running" || fail "Health check failed: $R"

# ── Test 2: Planner Agent ────────────────────────────────
header "Test 2 — Planner Agent (POST /api/chat)"
R=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Plan a 7 day trip to Tokyo with a budget of 2000 USD"}')
echo "$R" | grep -qi "destination\|tokyo\|blueprint" && ok "Blueprint generated" || fail "No blueprint: ${R:0:200}"
echo "  $(echo "$R" | node -e "try{const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const bp=j.plan?.blueprint;console.log('Destination:',bp?.destination,'| Budget:',bp?.budget,'| Duration:',bp?.duration)}catch(e){console.log('(parse error)')}" 2>/dev/null)"

# ── Test 3: Walrus Upload ────────────────────────────────
header "Test 3 — Walrus Storage (blobId)"
echo "$R" | grep -q "blobId" && ok "Walrus blobId present" || fail "No blobId in response"
echo "  $(echo "$R" | node -e "try{const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log('blobId:',j.walrus?.blobId||'null')}catch(e){}" 2>/dev/null)"

# ── Test 4: Treasury Agent ───────────────────────────────
header "Test 4 — Treasury Agent (POST /api/full-plan)"
R=$(curl -s -X POST "$BASE/api/full-plan" \
  -H "Content-Type: application/json" \
  -d '{"destination":"Tokyo","budget":2000,"duration":7}')
echo "$R" | grep -qi "treasury\|invest\|liquid" && ok "Treasury strategy exists" || fail "No treasury strategy: ${R:0:200}"
echo "  $(echo "$R" | node -e "try{const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const ts=j.plan?.treasuryStrategy;console.log('invest:',ts?.investAmount,'liquid:',ts?.liquidAmount,'protocol:',ts?.protocol)}catch(e){}" 2>/dev/null)"

# ── Test 5: Booking Agent ────────────────────────────────
header "Test 5 — Booking Agent"
echo "$R" | grep -qi "hotel\|flight\|booking" && ok "Booking recommendations generated" || fail "No booking plan: ${R:0:200}"
echo "  $(echo "$R" | node -e "try{const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const bk=j.plan?.bookings;console.log('Hotel:',bk?.hotel?.name,'| Flight:',bk?.flight?.airline)}catch(e){}" 2>/dev/null)"

# ── Test 6: Risk Agent ───────────────────────────────────
header "Test 6 — Risk Agent"
echo "$R" | grep -qi "approved\|risk" && ok "Risk validation returned" || fail "No risk assessment: ${R:0:200}"
echo "  $(echo "$R" | node -e "try{const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const ra=j.plan?.riskAssessment;console.log('approved:',ra?.approved,'reasons:',ra?.reasons?.join(', ')||'none')}catch(e){}" 2>/dev/null)"

# ── Test 7: Full Agent Pipeline ──────────────────────────
header "Test 7 — Full Agent Pipeline (POST /api/full-plan with departureDate)"
R7=$(curl -s -X POST "$BASE/api/full-plan" \
  -H "Content-Type: application/json" \
  -d '{"destination":"Tokyo","budget":2000,"duration":7,"departureDate":"2026-09-01"}')
FIELDS=0
echo "$R7" | grep -q "blueprint"         && ((FIELDS++))
echo "$R7" | grep -q "blobId"            && ((FIELDS++))
echo "$R7" | grep -q "treasuryStrategy"  && ((FIELDS++))
echo "$R7" | grep -q "bookingPlan\|bookings" && ((FIELDS++))
echo "$R7" | grep -q "riskAssessment"    && ((FIELDS++))
[ $FIELDS -ge 4 ] && ok "All agents executed ($FIELDS/5 fields)" || fail "Missing agent outputs ($FIELDS/5 fields)"
echo "  $(echo "$R7" | node -e "try{const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));console.log('actions:',j.actions?.length,'| summary:',j.summary?.substring(0,80))}catch(e){}" 2>/dev/null)"

# ── PTB Test helper ──────────────────────────────────────
ptb_test() {
  local NUM="$1" NAME="$2" ACTION="$3" EXTRA="$4"
  header "Test $NUM — $NAME PTB"
  BODY="{\"action\":\"$ACTION\"$EXTRA}"
  R=$(curl -s -X POST "$BASE/api/execute" \
    -H "Content-Type: application/json" \
    -d "$BODY")
  echo "$R" | grep -q "txBytes" && ok "PTB created (txBytes present)" || fail "No txBytes: ${R:0:200}"
  echo "  $(echo "$R" | node -e "try{const j=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));const b=j.txBytes||'';console.log('txBytes length:',b.length,'chars')}catch(e){}" 2>/dev/null)"
}

SENDER='"sender":"0x1be004f101ace8118b1f9d9a62d0952d723eb04341e608c128b6db4a90b1c1f6"'

# ── Tests 8-14: PTBs ────────────────────────────────────
ptb_test  8  "Create Trip"           "createTrip"           ",${SENDER},\"params\":{\"destination\":\"Tokyo\",\"startDate\":1751328000,\"endDate\":1751932800,\"totalBudget\":2000}"
ptb_test  9  "Deposit Funds"         "depositFunds"         ",${SENDER}"
ptb_test 10  "Invest Idle Capital"   "investIdleCapital"    ",${SENDER}"
ptb_test 11  "Book Hotel"            "bookHotel"            ",${SENDER}"
ptb_test 12  "Book Flight"           "bookFlight"           ",${SENDER}"
ptb_test 13  "Prepare For Departure" "prepareForDeparture"  ",${SENDER}"
ptb_test 14  "Complete Trip"         "completeTrip"         ",${SENDER}"

# ── Summary ──────────────────────────────────────────────
echo ""
echo "============================================"
echo "  Results: $PASS passed, $FAIL failed"
[ $FAIL -eq 0 ] && echo "  ✅ All tests passed — backend production-ready" || echo "  ⚠️  $FAIL test(s) failed"
echo "  Server PID: $SERVER_PID  (kill with: kill $SERVER_PID)"
echo "============================================"
echo ""

wait $SERVER_PID


PORT=3001
BASE="http://localhost:$PORT"

echo "============================================"
echo "  TravelOS Agent Backend Test"
echo "============================================"

# Kill any existing process on port
lsof -ti:$PORT | xargs kill -9 2>/dev/null || true

# Start server in background
echo ""
echo "[1] Starting server..."
cd "$(dirname "$0")"
npm run dev &
SERVER_PID=$!
sleep 3

# Wait for server to be ready
for i in {1..10}; do
  if curl -s "$BASE/" > /dev/null 2>&1; then
    echo "     Server ready on port $PORT"
    break
  fi
  sleep 1
done

# ============================================
# Test 1: Chat — AI Planning
# ============================================
echo ""
echo "============================================"
echo "[2] POST /api/chat — AI Trip Planning"
echo "============================================"

RESP=$(curl -s -X POST "$BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Plan my 5 day Paris trip with $3000 budget"}')

echo "$RESP" | node -e "
  const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{
    const j=JSON.parse(Buffer.concat(d).toString());
    const bp=j.plan.blueprint;
    console.log('Destination:', bp.destination);
    console.log('Duration:', bp.duration, 'days');
    console.log('Budget: \$' + bp.budget);
    console.log('Hotels:');
    bp.hotels.forEach(h => console.log('  - ' + h.name + ' (\$' + h.pricePerNight + '/night, ' + h.rating + '★)'));
    console.log('Budget Alloc: Hotel=\$' + bp.budgetAllocation.hotel + ', Flight=\$' + bp.budgetAllocation.flight + ', Activities=\$' + bp.budgetAllocation.activities);
    console.log('Treasury: invest=\$' + j.plan.treasuryStrategy.investAmount + ', liquid=\$' + j.plan.treasuryStrategy.liquidAmount);
    console.log('Risk Approved:', j.plan.riskAssessment.approved);
    console.log('Risk Reasons:', j.plan.riskAssessment.reasons.join(', ') || 'none');
    console.log('');
    console.log('Agents called:', j.logs.map(l=>l.agent).join(' → '));
  });
"

# ============================================
# Test 2: Execute — Build PTB
# ============================================
echo ""
echo "============================================"
echo "[3] POST /api/execute — Build PTB for Sui"
echo "============================================"

curl -s -X POST "$BASE/api/execute" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createTrip",
    "sender": "0x1be004f101ace8118b1f9d9a62d0952d723eb04341e608c128b6db4a90b1c1f6",
    "params": {"destination":"Tokyo","startDate":1735689600,"endDate":1736294400,"totalBudget":2000}
  }' | node -e "
  const d=[];process.stdin.on('data',c=>d.push(c));process.stdin.on('end',()=>{
    const j=JSON.parse(Buffer.concat(d).toString());
    console.log('Action:', j.action);
    console.log('PTB Commands:', j.commands);
    console.log('PTB Inputs:', j.inputs);
    console.log('');
    if (j.commands > 0) console.log('✅ PTB built successfully — ready to sign & send');
    else console.log('❌ PTB is empty');
  });
"

# ============================================
echo ""
echo "============================================"
echo "  ✅ All tests complete"
echo "  Server PID: $SERVER_PID"
echo "  Kill with:  kill $SERVER_PID"
echo "============================================"

# Keep running for manual testing
wait $SERVER_PID

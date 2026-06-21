#!/bin/bash
set -e

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

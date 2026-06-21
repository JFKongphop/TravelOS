'use client';

import { useState, useCallback } from 'react';
import { Nav } from '@/components/Nav';
import { HeroSection } from '@/components/HeroSection';
import { ChatSection } from '@/components/ChatSection';
import { AgentActivity } from '@/components/AgentActivity';
import { TravelBlueprint } from '@/components/TravelBlueprint';
import { TreasuryDashboard } from '@/components/TreasuryDashboard';
import { YieldPosition } from '@/components/YieldPosition';
import { Reservations } from '@/components/Reservations';
import { ExecutionCenter } from '@/components/ExecutionCenter';
import { TravelLifecycle } from '@/components/TravelLifecycle';
import { apiChat, apiFullPlan, apiExecute, explorerUrl, SUI_PACKAGE_ID, type ActionStep } from '@/lib/contracts';
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';

interface ActivityStep {
  agent: string;
  action: string;
  done: boolean;
}

export default function Home() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  // State
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Data from backend
  const [blueprint, setBlueprint] = useState<any>(null);
  const [bpMarkdown, setBpMarkdown] = useState<string | null>(null);
  const [treasuryStrategy, setTreasuryStrategy] = useState<any>(null);
  const [bookings, setBookings] = useState<any>(null);
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [walrus, setWalrus] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);

  // Chat / Plan
  const [activitySteps, setActivitySteps] = useState<ActivityStep[]>([]);

  // Execution state
  const [txDigest, setTxDigest] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Stored action plan from fullPlan — used to auto-fill params (provider, amount, etc.)
  const [actionPlan, setActionPlan] = useState<ActionStep[]>([]);

  // Vault state
  const [vaultBalance, setVaultBalance] = useState<number | null>(null);
  const [vaultStatus, setVaultStatus] = useState<string | null>(null);

  // On-chain object IDs — populated after successful transactions
  const [vaultObjectId, setVaultObjectId] = useState<string | null>(null);
  const [planObjectId, setPlanObjectId] = useState<string | null>(null);
  const [yieldObjectIds, setYieldObjectIds] = useState<string[]>([]);
  const [reservationIds, setReservationIds] = useState<string[]>([]);

  const handleChat = useCallback(async (message: string) => {
    setLoading(true);
    setError(null);

    // Animate agent activity
    const steps: ActivityStep[] = [
      { agent: 'Supervisor Agent', action: 'Analyzing request...', done: false },
      { agent: 'Planner Agent', action: 'Generating blueprint...', done: false },
      { agent: 'Treasury Agent', action: 'Creating strategy...', done: false },
      { agent: 'Booking Agent', action: 'Selecting reservations...', done: false },
      { agent: 'Risk Agent', action: 'Approving actions...', done: false },
    ];
    setActivitySteps([...steps]);

    try {
      // Sequential animation
      for (let i = 0; i < steps.length; i++) {
        await new Promise((r) => setTimeout(r, 400));
        steps[i] = { ...steps[i], done: true };
        setActivitySteps([...steps]);
      }

      const result = await apiChat(message);

      // Backend nests data under result.plan
      if (result.plan?.blueprint) setBlueprint(result.plan.blueprint);
      if (result.markdown) setBpMarkdown(result.markdown);
      if (result.plan?.treasuryStrategy) setTreasuryStrategy(result.plan.treasuryStrategy);
      if (result.plan?.bookings) setBookings(result.plan.bookings);
      if (result.plan?.riskAssessment) setRiskAssessment(result.plan.riskAssessment);
      if (result.walrus?.blobId) setWalrus(result.walrus);
      if (result.plan) setPlan(result.plan);

      // Also fetch the full plan (with executable steps) if wallet is connected
      if (account?.address) {
        try {
          const fullPlan = await apiFullPlan(message, account.address);
          if (fullPlan.plan) {
            if (fullPlan.plan.blueprint) setBlueprint(fullPlan.plan.blueprint);
            if (fullPlan.plan.treasuryStrategy) setTreasuryStrategy(fullPlan.plan.treasuryStrategy);
            if (fullPlan.plan.bookings) setBookings(fullPlan.plan.bookings);
            if (fullPlan.plan.riskAssessment) setRiskAssessment(fullPlan.plan.riskAssessment);
          }
          if (fullPlan.walrus?.blobId) setWalrus(fullPlan.walrus);
          // Store executable action plan — used to pre-fill params in handleExecute
          if (fullPlan.actions?.length) {
            setActionPlan(fullPlan.actions);
            setPlan((prev: any) => ({ ...prev, actions: fullPlan.actions, summary: fullPlan.summary }));
          }
        } catch {
          // full-plan failure is non-critical
        }
      }

      // Update final agent step
      steps[4] = { agent: 'Supervisor Agent', action: 'Execution plan finalized', done: true };
      setActivitySteps([...steps]);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Read on-chain Move object by ID
  const readOnChainObject = useCallback(async (objectId: string) => {
    try {
      const obj = await suiClient.getObject({
        id: objectId,
        options: { showContent: true },
      });
      const fields = (obj.data?.content as any)?.fields;
      return fields ?? null;
    } catch {
      return null;
    }
  }, [suiClient]);

  // After a tx executes, query owned objects by struct type — reliable regardless of indexing lag
  const processTxEffects = useCallback(async (_txResponse: any, action: string) => {
    const owner = account?.address;
    if (!owner) return;
    try {
      // Wait for RPC indexing before querying owned objects
      await new Promise((r) => setTimeout(r, 2000));

      // Helper: get owned objects of a given struct type
      const getOwned = async (structType: string) => {
        const res = await suiClient.getOwnedObjects({
          owner,
          filter: { StructType: structType },
          options: { showContent: true },
        });
        return res.data ?? [];
      };

      if (action === 'createTrip') {
        // Fetch TravelPlan and TravelVault owned by user
        const [plans, vaults] = await Promise.all([
          getOwned(`${SUI_PACKAGE_ID}::plan::TravelPlan`),
          getOwned(`${SUI_PACKAGE_ID}::vault::TravelVault`),
        ]);
        const latestPlan = plans[plans.length - 1];
        const latestVault = vaults[vaults.length - 1];
        if (latestPlan?.data?.objectId) {
          setPlanObjectId(latestPlan.data.objectId);
          console.log('[on-chain] Plan:', latestPlan.data.objectId);
        }
        if (latestVault?.data?.objectId) {
          setVaultObjectId(latestVault.data.objectId);
          const fields = (latestVault.data.content as any)?.fields;
          const rawBalance = fields?.balance?.fields?.value ?? fields?.balance ?? 0;
          setVaultBalance(Number(rawBalance));
          console.log('[on-chain] Vault:', latestVault.data.objectId);
        }
      } else if (action === 'depositFunds' || action === 'prepareForDeparture' || action === 'completeTrip') {
        // Vault was mutated — re-read balance and status
        if (vaultObjectId) {
          const fields = await readOnChainObject(vaultObjectId);
          if (fields) {
            const rawBalance = fields.balance?.fields?.value ?? fields.balance ?? 0;
            setVaultBalance(Number(rawBalance));
            if (fields.status !== undefined) {
              const statusMap = ['Active', 'ReadyForTravel', 'Traveling', 'Completed'];
              setVaultStatus(statusMap[Number(fields.status)] ?? 'Active');
            }
          }
        }
      } else if (action === 'investIdleCapital') {
        const positions = await getOwned(`${SUI_PACKAGE_ID}::yield::YieldPosition`);
        for (const p of positions) {
          if (p.data?.objectId) {
            setYieldObjectIds((prev) =>
              prev.includes(p.data!.objectId) ? prev : [...prev, p.data!.objectId]
            );
          }
        }
        console.log('[on-chain] YieldPositions:', positions.length);
      } else if (action === 'bookHotel' || action === 'bookFlight') {
        const reservations = await getOwned(`${SUI_PACKAGE_ID}::reservation::ReservationNFT`);
        for (const r of reservations) {
          if (r.data?.objectId) {
            setReservationIds((prev) =>
              prev.includes(r.data!.objectId) ? prev : [...prev, r.data!.objectId]
            );
          }
        }
        console.log('[on-chain] Reservations:', reservations.length);
      }
    } catch (e) {
      console.warn('[on-chain] Failed to read effects:', e);
    }
  }, [account?.address, suiClient, vaultObjectId, readOnChainObject]);

  const handleExecute = useCallback(async (action: string, params?: any) => {
    setExecuting(action);
    setError(null);
    setTxDigest(null);

    const sender = account?.address;
    if (!sender) {
      setError('Please connect your Sui wallet first');
      setExecuting(null);
      return;
    }

    // Resolve dynamic params with known object IDs
    let resolvedParams: any = { ...params };

    // If no params given (e.g. button clicked with no context), pull from stored action plan
    if (!params || Object.keys(params).length === 0) {
      const stored = actionPlan.find((a) => a.action === action);
      if (stored?.params) resolvedParams = { ...stored.params };
    }

    // Inject real on-chain IDs whenever the param is missing OR is a placeholder string
    if (vaultObjectId && (!resolvedParams.vaultId || typeof resolvedParams.vaultId === 'string' && resolvedParams.vaultId.startsWith('<'))) {
      resolvedParams.vaultId = vaultObjectId;
    }
    if (planObjectId && (!resolvedParams.planId || typeof resolvedParams.planId === 'string' && resolvedParams.planId.startsWith('<'))) {
      resolvedParams.planId = planObjectId;
    }
    if (yieldObjectIds.length > 0 && (!resolvedParams.positionId || typeof resolvedParams.positionId === 'string' && resolvedParams.positionId.startsWith('<'))) {
      resolvedParams.positionId = yieldObjectIds[0];
    }
    if (reservationIds.length > 0 && (!resolvedParams.reservationId || typeof resolvedParams.reservationId === 'string' && resolvedParams.reservationId.startsWith('<'))) {
      resolvedParams.reservationId = reservationIds[0];
    }

    try {
      // 1. Get serialized PTB from backend
      const result = await apiExecute(action, sender, resolvedParams);
      if (!result.txBytes) {
        throw new Error('Backend did not return transaction bytes');
      }

      // 2. Decode base64 → JSON string, pass directly to dapp-kit
      //    dapp-kit accepts string and calls Transaction.from() internally
      const txJson = Buffer.from(result.txBytes, 'base64').toString('utf8');

      // 3. Sign + execute via wallet
      signAndExecute(
        { transaction: txJson as any },
        {
          onSuccess: async (data) => {
            setTxDigest(data.digest);
            setLastAction(action);
            setExecuting(null);

            // Pass full response — objectChanges is already included
            await processTxEffects(data, action);
          },
          onError: (err) => {
            console.error('Tx failed:', err);
            setError(err.message);
            setExecuting(null);
          },
        },
      );
    } catch (err: any) {
      setError(err.message);
      setExecuting(null);
    }
  }, [account?.address, signAndExecute, vaultObjectId, planObjectId, yieldObjectIds, reservationIds, processTxEffects, actionPlan]);

  const hasData = !!(blueprint || treasuryStrategy || bookings);

  return (
    <>
      <Nav />
      <HeroSection />

      {error && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div
            className="glass-card"
            style={{
              padding: '16px 20px',
              border: '1px solid rgba(255,68,102,0.3)',
              background: 'rgba(255,68,102,0.05)',
              color: 'var(--red)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
            }}
          >
            Error: {error}
            <button
              onClick={() => setError(null)}
              style={{
                marginLeft: 12,
                background: 'none',
                border: 'none',
                color: 'var(--red)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              ✕
            </button>
          </div>
          <div className="divider" style={{ marginTop: 24 }} />
        </div>
      )}

      {txDigest && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div
            className="glass-card"
            style={{
              padding: '16px 20px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.03)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <span>
              <span style={{ color: 'var(--cyan)' }}>✓</span>{' '}
              {lastAction ? `${lastAction} executed` : 'Transaction confirmed'}
              {' — '}
              <code style={{ color: 'var(--text-muted)' }}>
                {txDigest.slice(0, 10)}...{txDigest.slice(-6)}
              </code>
            </span>
            <a
              href={explorerUrl(txDigest)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ fontSize: 12, padding: '6px 14px' }}
            >
              View on Explorer ↗
            </a>
          </div>
          <div className="divider" style={{ marginTop: 24 }} />
        </div>
      )}

      <div className="divider" />
      <ChatSection onChat={handleChat} loading={loading} />

      <div className="divider" />
      <AgentActivity steps={activitySteps} />

      <div className="divider" />
      <TravelBlueprint
        blueprint={blueprint}
        markdown={bpMarkdown ?? undefined}
        walrus={walrus}
      />

      <div className="divider" />
      <TreasuryDashboard
        treasuryStrategy={treasuryStrategy}
        vaultBalance={vaultBalance ?? undefined}
        targetAmount={blueprint?.budget}
        status={vaultStatus ?? undefined}
      />

      <div className="divider" />
      <YieldPosition
        treasuryStrategy={treasuryStrategy}
        onExecute={handleExecute}
        executing={executing}
      />

      <div className="divider" />
      <Reservations bookings={bookings} />

      <div className="divider" />
      <ExecutionCenter
        onExecute={handleExecute}
        executing={executing}
        hasBlueprint={!!blueprint}
        hasVault={!!vaultObjectId}
        hasDeposit={(vaultBalance ?? 0) > 0}
        hasYield={yieldObjectIds.length > 0}
        hasHotel={reservationIds.length >= 1}
      />

      <div className="divider" />
      <TravelLifecycle
        steps={[]}
        data={{
          blueprint,
          treasuryStrategy,
          bookings,
          plan,
          vaultStatus,
          vaultBalance,
          // On-chain object IDs — lifecycle detects which steps are done
          vaultObjectId,
          planObjectId,
          yieldObjectIds,
          reservationIds,
        }}
      />

      <footer
        style={{
          textAlign: 'center',
          padding: '40px 24px',
          color: 'var(--text-dim)',
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          borderTop: '1px solid var(--border)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span style={{ color: 'var(--cyan)' }}>TravelOS</span> — Multi-Agent Autonomous Travel Treasury
        {' · '}Built on{' '}
        <span style={{ color: 'var(--cyan)' }}>Sui Testnet</span>
      </footer>
    </>
  );
}

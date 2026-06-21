'use client';

interface LifecycleStep {
  label: string;
  done: boolean;
}

interface TravelLifecycleProps {
  steps: LifecycleStep[];
  data: any;
}

const DEFAULT_STEPS: LifecycleStep[] = [
  { label: 'Blueprint Created', done: false },
  { label: 'Vault Created', done: false },
  { label: 'Funds Deposited', done: false },
  { label: 'Yield Position', done: false },
  { label: 'Hotel Reserved', done: false },
  { label: 'Flight Reserved', done: false },
  { label: 'Trip Completed', done: false },
];

export function TravelLifecycle({ steps: customSteps, data }: TravelLifecycleProps) {
  let steps = DEFAULT_STEPS;

  // Derive lifecycle state from data — prioritizing on-chain object IDs
  if (data) {
    steps = DEFAULT_STEPS.map((step) => {
      switch (step.label) {
        case 'Blueprint Created':
          // Blueprint exists from chat OR plan object exists on-chain
          return { ...step, done: !!data.blueprint || !!data.planObjectId };
        case 'Vault Created':
          // Vault object exists on-chain
          return { ...step, done: !!data.vaultObjectId };
        case 'Funds Deposited':
          // Vault balance > 0 on-chain
          return { ...step, done: (data.vaultBalance ?? 0) > 0 };
        case 'Yield Position':
          // Yield position objects exist on-chain
          return { ...step, done: (data.yieldObjectIds?.length ?? 0) > 0 };
        case 'Hotel Reserved':
          // Reservation NFTs exist on-chain (we can't distinguish hotel vs flight from IDs alone,
          // but if bookings data says hotel OR multiple reservations exist, mark done)
          return { ...step, done: !!data.bookings?.hotel || (data.reservationIds?.length ?? 0) >= 1 };
        case 'Flight Reserved':
          return { ...step, done: !!data.bookings?.flight || (data.reservationIds?.length ?? 0) >= 2 };
        case 'Trip Completed':
          // Vault status is 'Completed'
          return { ...step, done: data.vaultStatus === 'Completed' };
        default:
          return step;
      }
    });
  }

  if (customSteps?.length) {
    steps = customSteps;
  }

  return (
    <section id="lifecycle" className="section">
      <div className="section-inner">
        <div className="section-label">Travel Lifecycle</div>
        <h2 className="section-title">Journey Progress</h2>
        <p className="section-desc" style={{ marginBottom: 28 }}>
          Track every milestone from planning to completion.
        </p>

        <div className="glass-card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {steps.map((step, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'stretch' }}>
                {/* Timeline track */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: 32,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: step.done ? 'var(--cyan)' : 'var(--text-dim)',
                      flexShrink: 0,
                      marginTop: 16,
                      transition: 'background 0.4s ease',
                      boxShadow: step.done ? '0 0 12px var(--glow-cyan)' : 'none',
                    }}
                  />
                  {i < steps.length - 1 && (
                    <div
                      style={{
                        width: 1,
                        flex: 1,
                        background: step.done ? 'var(--cyan)' : 'var(--border)',
                        transition: 'background 0.4s ease',
                        marginTop: 8,
                        marginBottom: 0,
                      }}
                    />
                  )}
                </div>

                {/* Step content */}
                <div style={{ padding: '16px 0', flex: 1 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: step.done ? 700 : 500,
                      color: step.done ? 'var(--text)' : 'var(--text-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    {step.label}
                    {step.done && (
                      <span style={{ color: 'var(--cyan)', fontSize: 16 }}>✓</span>
                    )}
                    {!step.done && (
                      <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>○</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

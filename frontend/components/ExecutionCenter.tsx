'use client';

interface ExecutionCenterProps {
  onExecute: (action: string, params?: any) => Promise<void>;
  executing: string | null;
  // State gates — controls which buttons are enabled
  hasBlueprint?: boolean;    // chat done
  hasVault?: boolean;        // createTrip done
  hasDeposit?: boolean;      // depositFunds done
  hasYield?: boolean;        // investIdleCapital done
  hasHotel?: boolean;        // bookHotel done
}

interface ActionDef {
  action: string;
  label: string;
  icon: string;
  step: number;
  requires: string | null; // gate key
}

const ACTIONS: ActionDef[] = [
  { action: 'createTrip',          label: 'Create Trip',           icon: '🗺️',  step: 1, requires: 'hasBlueprint' },
  { action: 'depositFunds',        label: 'Deposit Funds',         icon: '💰',  step: 2, requires: 'hasVault'     },
  { action: 'investIdleCapital',   label: 'Invest Idle Capital',   icon: '📈',  step: 3, requires: 'hasDeposit'   },
  { action: 'bookHotel',           label: 'Book Hotel',            icon: '🏨',  step: 4, requires: 'hasDeposit'   },
  { action: 'bookFlight',          label: 'Book Flight',           icon: '✈️',  step: 5, requires: 'hasHotel'     },
  { action: 'prepareForDeparture', label: 'Prepare For Departure', icon: '🚀',  step: 6, requires: 'hasVault'     },
  { action: 'cancelBooking',       label: 'Cancel Booking',        icon: '↩️',  step: 0, requires: 'hasHotel'     },
  { action: 'completeTrip',        label: 'Complete Trip',         icon: '✅',  step: 7, requires: 'hasVault'     },
];

export function ExecutionCenter({
  onExecute,
  executing,
  hasBlueprint = false,
  hasVault = false,
  hasDeposit = false,
  hasYield = false,
  hasHotel = false,
}: ExecutionCenterProps) {
  const gates: Record<string, boolean> = {
    hasBlueprint,
    hasVault,
    hasDeposit,
    hasYield,
    hasHotel,
  };

  if (!hasBlueprint) {
    return (
      <section id="execution" className="section">
        <div className="section-inner">
          <div className="section-label">Execution Center</div>
          <h2 className="section-title">Execute PTBs</h2>
          <div
            className="glass-card"
            style={{ padding: 28, textAlign: 'center', border: '1px dashed var(--border)' }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              Start with Agent Chat
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              Describe your trip above to generate a plan, then execute each step here.
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="execution" className="section">
      <div className="section-inner">
        <div className="section-label">Execution Center</div>
        <h2 className="section-title">Execute PTBs</h2>
        <p className="section-desc" style={{ marginBottom: 28 }}>
          Execute each step in order. Your wallet signs — agents never hold keys.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 12,
          }}
        >
          {ACTIONS.map(({ action, label, icon, step, requires }) => {
            const ready = requires ? gates[requires] : true;
            const isExecuting = executing === action;
            return (
              <button
                key={action}
                className={`btn ${ready ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => ready && onExecute(action)}
                disabled={isExecuting || !ready}
                title={!ready ? 'Complete prior steps first' : label}
                style={{
                  justifyContent: 'flex-start',
                  padding: '16px 18px',
                  fontSize: 14,
                  width: '100%',
                  opacity: ready ? 1 : 0.4,
                  cursor: ready ? 'pointer' : 'not-allowed',
                  position: 'relative',
                }}
              >
                <span style={{ fontSize: 18, minWidth: 24 }}>{icon}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>
                  {step > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: 'var(--text-dim)',
                        fontFamily: 'var(--font-mono)',
                        display: 'block',
                        marginBottom: 2,
                      }}
                    >
                      Step {step}
                    </span>
                  )}
                  {label}
                </span>
                {isExecuting ? (
                  <span className="spinner" style={{ width: 14, height: 14 }} />
                ) : ready ? (
                  <span style={{ fontSize: 10, color: 'var(--cyan)' }}>▶</span>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>🔒</span>
                )}
              </button>
            );
          })}
        </div>

        <div
          className="glass-card"
          style={{ marginTop: 16, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}
        >
          <span style={{ fontSize: 18 }}>🔐</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Wallet Signing Required</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              Frontend → Backend → SDK → PTB → Wallet → Sui Testnet
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


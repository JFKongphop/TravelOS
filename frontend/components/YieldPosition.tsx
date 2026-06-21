'use client';

interface YieldPositionProps {
  treasuryStrategy: any;
  onExecute: (action: string, params?: any) => Promise<void>;
  executing: string | null;
}

export function YieldPosition({ treasuryStrategy, onExecute, executing }: YieldPositionProps) {
  if (!treasuryStrategy) {
    return (
      <section id="yield" className="section">
        <div className="section-inner">
          <div className="section-label">Yield Position</div>
          <h2 className="section-title">Programmable Money</h2>
          <p className="section-desc">
            Earn yield on idle travel capital. Yield positions appear after treasury planning.
          </p>
        </div>
      </section>
    );
  }

  const investAmount = treasuryStrategy.investAmount || 0;
  const protocol = treasuryStrategy.protocol || 'TravelOS Yield';
  const createdAt = treasuryStrategy.createdAt || new Date().toISOString().split('T')[0];

  return (
    <section id="yield" className="section">
      <div className="section-inner">
        <div className="section-label">Yield Position</div>
        <h2 className="section-title">Programmable Money</h2>
        <p className="section-desc" style={{ marginBottom: 28 }}>
          Your idle capital works while you wait for departure.
        </p>

        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>
              Protocol
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{protocol}</div>
          </div>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>
              Amount
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{investAmount.toLocaleString()} SUI</div>
          </div>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>
              Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="status-dot active" />
              <span style={{ fontSize: 16, fontWeight: 600 }}>Active</span>
            </div>
          </div>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>
              Created Date
            </div>
            <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              {createdAt}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => onExecute('investIdleCapital')}
            disabled={executing === 'investIdleCapital'}
          >
            {executing === 'investIdleCapital' ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14 }} />
                Investing...
              </>
            ) : (
              'Invest Idle Capital'
            )}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onExecute('prepareForDeparture')}
            disabled={executing === 'prepareForDeparture'}
          >
            {executing === 'prepareForDeparture' ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14 }} />
                Preparing...
              </>
            ) : (
              'Prepare For Departure'
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

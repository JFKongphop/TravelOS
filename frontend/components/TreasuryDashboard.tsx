'use client';

interface TreasuryDashboardProps {
  treasuryStrategy: any;
  vaultBalance?: number;
  targetAmount?: number;
  status?: string;
}

export function TreasuryDashboard({
  treasuryStrategy,
  vaultBalance,
  targetAmount,
  status,
}: TreasuryDashboardProps) {
  if (!treasuryStrategy) {
    return (
      <section id="treasury" className="section">
        <div className="section-inner">
          <div className="section-label">Treasury Dashboard</div>
          <h2 className="section-title">Travel Finance State</h2>
          <p className="section-desc">
            View your vault balance, funding status, and treasury strategy after planning begins.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="treasury" className="section">
      <div className="section-inner">
        <div className="section-label">Treasury Dashboard</div>
        <h2 className="section-title">Travel Finance State</h2>
        <p className="section-desc" style={{ marginBottom: 28 }}>
          Real-time overview of your travel treasury and financial strategy.
        </p>

        {/* Vault Stats */}
        <div className="stats-grid" style={{ marginBottom: 24 }}>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>
              Vault Balance
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {vaultBalance != null ? `${vaultBalance.toLocaleString()} SUI` : `${(treasuryStrategy.liquidAmount || 0).toLocaleString()} SUI`}
            </div>
          </div>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>
              Target Amount
            </div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {targetAmount != null ? `${targetAmount.toLocaleString()} SUI` : `${((treasuryStrategy.investAmount || 0) + (treasuryStrategy.liquidAmount || 0)).toLocaleString()} SUI`}
            </div>
          </div>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>
              Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className={`status-dot ${status === 'active' || status === 'Active' ? 'active' : 'pending'}`} />
              <span style={{ fontSize: 18, fontWeight: 700 }}>
                {status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Strategy */}
        <div className="glass-card" style={{ padding: 28 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--cyan)' }}>
            Treasury Strategy
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: 'var(--cyan)' }}>📊</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  Invest {treasuryStrategy.investAmount != null ? Math.round((treasuryStrategy.investAmount / ((treasuryStrategy.investAmount || 1) + (treasuryStrategy.liquidAmount || 0))) * 100) : 70}%
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {treasuryStrategy.investAmount != null ? `${treasuryStrategy.investAmount.toLocaleString()} SUI` : '—'} into {treasuryStrategy.protocol || 'TravelOS Yield'}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: 'var(--cyan)' }}>💧</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>
                  Keep {treasuryStrategy.liquidAmount != null ? Math.round((treasuryStrategy.liquidAmount / ((treasuryStrategy.investAmount || 1) + (treasuryStrategy.liquidAmount || 0))) * 100) : 30}% Liquid
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {treasuryStrategy.liquidAmount != null ? `${treasuryStrategy.liquidAmount.toLocaleString()} SUI` : '—'} available for bookings
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color: 'var(--cyan)' }}>⏰</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Prepare Liquidity</div>
                <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                  {treasuryStrategy.prepareLiquidityDays || 3} Days Before Departure
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

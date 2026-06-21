'use client';

interface ActivityStep {
  agent: string;
  action: string;
  done: boolean;
}

interface AgentActivityProps {
  steps: ActivityStep[];
}

export function AgentActivity({ steps }: AgentActivityProps) {
  if (steps.length === 0) {
    return (
      <section id="activity" className="section">
        <div className="section-inner">
          <div className="section-label">Agent Activity</div>
          <h2 className="section-title">Multi-Agent Execution</h2>
          <p className="section-desc">
            Watch the agent swarm collaborate to plan your trip. Send a message above to begin.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="activity" className="section">
      <div className="section-inner">
        <div className="section-label">Agent Activity</div>
        <h2 className="section-title">Multi-Agent Execution</h2>
        <p className="section-desc" style={{ marginBottom: 28 }}>
          Each agent contributes specialized intelligence to your travel plan.
        </p>

        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {steps.map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-sm)',
                  background: step.done ? 'rgba(255,255,255,0.02)' : 'transparent',
                  border: '1px solid var(--border)',
                  animation: step.done ? 'slideIn 0.4s ease forwards' : 'none',
                  opacity: step.done ? 1 : 0.4,
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  {step.done ? (
                    <span
                      style={{
                        color: 'var(--cyan)',
                        fontSize: 18,
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </span>
                  ) : (
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                  )}
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--cyan)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {step.agent}
                  </span>
                  <span style={{ margin: '0 8px', color: 'var(--text-dim)' }}>—</span>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{step.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

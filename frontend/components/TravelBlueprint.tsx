'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TravelBlueprintProps {
  blueprint: any;
  markdown?: string;
  walrus?: {
    blobId: string | null;
    url?: string;
  };
}

export function TravelBlueprint({ blueprint, markdown, walrus }: TravelBlueprintProps) {
  if (!blueprint && !markdown) {
    return (
      <section id="blueprint" className="section">
        <div className="section-inner">
          <div className="section-label">Travel Blueprint</div>
          <h2 className="section-title">Your Travel Plan</h2>
          <p className="section-desc">
            Chat with the agents to generate a personalized travel blueprint.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="blueprint" className="section">
      <div className="section-inner">
        <div className="section-label">Travel Blueprint</div>
        <h2 className="section-title">Your Travel Plan</h2>
        <p className="section-desc" style={{ marginBottom: 28 }}>
          AI-generated itinerary with budget allocation and recommendations.
        </p>

        {/* Quick Stats */}
        {blueprint && (
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            {blueprint.destination && (
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Destination
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{blueprint.destination}</div>
              </div>
            )}
            {blueprint.budget && (
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Budget
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>${blueprint.budget?.toLocaleString?.() || blueprint.budget}</div>
              </div>
            )}
            {blueprint.duration && (
              <div className="glass-card" style={{ padding: 20 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Duration
                </div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{blueprint.duration} Days</div>
              </div>
            )}
          </div>
        )}

        {/* Markdown Blueprint */}
        <div className="glass-card" style={{ padding: 28 }}>
          {markdown ? (
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                lineHeight: 1.8,
                color: 'var(--text)',
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => (
                    <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 20, marginBottom: 8, color: 'var(--cyan)' }}>
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginTop: 14, marginBottom: 6, color: 'var(--text)' }}>
                      {children}
                    </h3>
                  ),
                  li: ({ children }) => (
                    <li style={{ marginLeft: 20, marginBottom: 4, color: 'var(--text-muted)' }}>{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ color: 'var(--cyan)' }}>{children}</strong>
                  ),
                  code: ({ children }) => (
                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4 }}>
                      {children}
                    </code>
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="code-block">
              {JSON.stringify(blueprint, null, 2)}
            </div>
          )}
        </div>

        {/* Walrus Metadata */}
        {walrus?.blobId && (
          <div style={{ marginTop: 16 }}>
            <div className="glass-card" style={{ padding: 16, display: 'inline-flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                  Stored On Walrus
                </span>
              </div>
              <div>
                <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                  Blob ID: {walrus.blobId.slice(0, 20)}...
                </span>
              </div>
              {walrus.url && (
                <a
                  href={walrus.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 12, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}
                >
                  View ↗
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

'use client';

export function HeroSection() {
  return (
    <section
      className="section"
      style={{
        paddingTop: 160,
        paddingBottom: 100,
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 900,
          height: 500,
          background:
            'radial-gradient(ellipse, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.03) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div className="section-inner" style={{ position: 'relative', zIndex: 1 }}>
        {/* Pill label */}
        <div style={{ display: 'inline-block', marginBottom: 28 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.16em',
              color: 'var(--cyan)',
              textTransform: 'uppercase',
              border: '1px solid rgba(255,255,255,0.20)',
              borderRadius: 100,
              padding: '5px 18px',
              background: 'rgba(255,255,255,0.04)',
              display: 'inline-block',
            }}
          >
            Multi-Agent Autonomous Travel Treasury — On Sui
          </span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(56px, 10vw, 96px)',
            fontWeight: 900,
            lineHeight: 0.92,
            letterSpacing: '-0.045em',
            marginBottom: 32,
          }}
        >
          TravelOS
        </h1>

        <p
          style={{
            fontSize: 'clamp(17px, 2.2vw, 22px)',
            color: 'var(--text-muted)',
            maxWidth: 800,
            margin: '0 auto 14px',
            lineHeight: 1.55,
          }}
        >
          Multi-Agent Autonomous Travel Treasury
          <br />
          Plan trips, manage treasury, earn yield, and book on-chain — all powered by AI agents on Sui.
        </p>

        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            color: 'white',
            letterSpacing: '0.06em',
            marginBottom: 48,
          }}
        >
          AI Agents · Sui · Walrus · Move · PTB
        </p>

        <div
          style={{
            display: 'flex',
            gap: 12,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <a href="#chat" className="btn btn-primary" style={{ fontSize: 15, padding: '13px 30px' }}>
            Start Planning ↓
          </a>
          <a href="#blueprint" className="btn btn-secondary" style={{ fontSize: 15, padding: '13px 30px' }}>
            View Blueprint
          </a>
          <a
            href="https://github.com/JFKongphop/TravelOS"
            className="btn btn-ghost"
            style={{ fontSize: 15, padding: '13px 30px' }}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub ↗
          </a>
        </div>
      </div>
    </section>
  );
}

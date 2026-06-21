'use client';

import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';

export function Nav() {
  const account = useCurrentAccount();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const shortAddress = account?.address
    ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
    : null;

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.92)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--cyan)',
            animation: 'pulseGlow 2.5s infinite',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            fontSize: 15,
            letterSpacing: '0.06em',
          }}
        >
          TravelOS
        </span>
        <span className="badge badge-info" style={{ padding: '2px 8px', fontSize: 10 }}>
          MVP
        </span>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {[
          { id: 'chat', label: 'Chat' },
          { id: 'blueprint', label: 'Blueprint' },
          { id: 'treasury', label: 'Treasury' },
          { id: 'yield', label: 'Yield' },
          { id: 'reservations', label: 'Reservations' },
          { id: 'lifecycle', label: 'Lifecycle' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '6px 14px' }}
          >
            {item.label}
          </button>
        ))}

        <div style={{ marginLeft: 12 }}>
          <ConnectButton
            connectText="Connect Wallet"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 600,
              padding: '7px 18px',
              borderRadius: 'var(--radius-md)',
              background: '#ffffff',
              color: '#000',
              border: 'none',
              cursor: 'pointer',
            }}
          />
        </div>
      </div>
    </nav>
  );
}

'use client';

import { useState } from 'react';

interface ChatSectionProps {
  onChat: (message: string) => Promise<void>;
  loading: boolean;
}

export function ChatSection({ onChat, loading }: ChatSectionProps) {
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    await onChat(input.trim());
  };

  return (
    <section id="chat" className="section">
      <div className="section-inner">
        <div className="section-label">Agent Chat</div>
        <h2 className="section-title">Talk to Your Travel Agents</h2>
        <p className="section-desc" style={{ marginBottom: 32 }}>
          Describe your trip and let the multi-agent system plan everything — from treasury to reservations.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                type="text"
                className="input"
                placeholder="Plan my Tokyo trip for 7 days with a budget of $2000..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !input.trim()}
                style={{ padding: '11px 28px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 14, height: 14 }} />
                    Thinking...
                  </>
                ) : (
                  'Send'
                )}
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                Try: &quot;Plan my Tokyo trip for 7 days with a budget of $2000&quot;
              </p>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

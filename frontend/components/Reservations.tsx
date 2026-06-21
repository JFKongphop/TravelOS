'use client';

interface Reservation {
  type: 'hotel' | 'flight';
  provider: string;
  amount: number;
  status: string;
  reservationId?: string;
}

interface ReservationsProps {
  bookings: any;
}

export function Reservations({ bookings }: ReservationsProps) {
  const reservations: Reservation[] = [];

  if (bookings) {
    if (bookings.flight) {
      reservations.push({
        type: 'flight',
        provider: bookings.flight.airline || 'Flight',
        amount: bookings.flight.price || 0,
        status: 'Confirmed',
      });
    }
    if (bookings.hotel) {
      reservations.push({
        type: 'hotel',
        provider: bookings.hotel.name || 'Hotel',
        amount: bookings.hotel.pricePerNight || 0,
        status: 'Confirmed',
      });
    }
  }

  if (reservations.length === 0) {
    return (
      <section id="reservations" className="section">
        <div className="section-inner">
          <div className="section-label">Reservations</div>
          <h2 className="section-title">Travel Purchases</h2>
          <p className="section-desc">
            Confirmed flights, hotels, and reservation details appear here after booking.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section id="reservations" className="section">
      <div className="section-inner">
        <div className="section-label">Reservations</div>
        <h2 className="section-title">Travel Purchases</h2>
        <p className="section-desc" style={{ marginBottom: 28 }}>
          Your confirmed bookings — secured on-chain.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reservations.map((res, i) => (
            <div key={i} className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <span style={{ fontSize: 28 }}>
                    {res.type === 'hotel' ? '🏨' : '✈️'}
                  </span>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{res.provider}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                      {res.type === 'hotel' ? 'Hotel' : 'Flight'}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    ${res.amount.toLocaleString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span className="badge badge-success">{res.status}</span>
                    <span className="badge badge-info">Reservation NFT</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

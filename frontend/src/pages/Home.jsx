import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page">
      <h1 style={{ fontSize: '2.1rem' }}>Carry it. Together.</h1>
      <p style={{ color: 'var(--color-muted)', maxWidth: 520, marginBottom: 28 }}>
        CarryMate connects NIT Durgapur students travelling home with students who need
        something carried. Post a trip, post a request, and matches appear automatically —
        no waiting, no stale lists.
      </p>

      {user ? (
        <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <Link to="/trips" className="btn btn-primary">My Trips</Link>
          <Link to="/requests" className="btn btn-primary">My Requests</Link>
          <Link to="/matches" className="btn btn-amber">View Matches</Link>
          <Link to="/deliveries" className="btn btn-outline">My Deliveries</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/register" className="btn btn-primary">Get started</Link>
          <Link to="/login" className="btn btn-outline">Log in</Link>
        </div>
      )}

      <div className="helper-text" style={{ marginTop: 40 }}>
        Every trip or request must involve NIT Durgapur, e.g. "Mumbai → NIT Durgapur" or
        "NIT Durgapur → Patna". Registration requires a verified @nitdgp.ac.in email.
      </div>
    </div>
  );
}

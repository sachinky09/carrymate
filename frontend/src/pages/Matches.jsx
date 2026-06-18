import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import TicketCard from '../components/TicketCard.jsx';

const FILE = 'src/pages/Matches.jsx';

export default function Matches() {
  const [groups, setGroups] = useState([]);
  const [fees, setFees] = useState({});
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function loadMatches() {
    try {
      const res = await api.get('/matches');
      setGroups(res.data);
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not load matches');
    }
  }

  useEffect(() => { loadMatches(); }, []);

  async function handleAccept(tripId, requestId) {
    setBusyId(requestId);
    setError('');
    try {
      const fee = fees[requestId] || 0;
      await api.post('/deliveries/accept', { trip_id: tripId, request_id: requestId, delivery_fee: fee });
      await loadMatches();
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not accept request');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(tripId, requestId) {
    setBusyId(requestId);
    setError('');
    try {
      await api.post('/deliveries/reject', { trip_id: tripId, request_id: requestId });
      await loadMatches();
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not reject request');
    } finally {
      setBusyId(null);
    }
  }

  const hasAnyMatches = groups.some((g) => g.matchingRequests.length > 0);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Matches</h2>
          <p>Calculated fresh every time — nothing here is stored.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {groups.length === 0 && <div className="empty-state">Post an active trip to see matches.</div>}

      {groups.length > 0 && !hasAnyMatches && (
        <div className="empty-state">No matching requests yet for your active trips.</div>
      )}

      {groups.map(({ trip, matchingRequests }) => (
        matchingRequests.length > 0 && (
          <div className="trip-group" key={trip.id}>
            <div className="trip-group-heading">
              <strong>{trip.source} → {trip.destination}</strong>
              <span className="field-note">travelling {trip.travel_date}</span>
            </div>
            {matchingRequests.map((r) => (
              <TicketCard
                key={r.id}
                source={r.source}
                destination={r.destination}
                status={r.status}
                fields={[
                  { label: 'ITEM', value: r.item_name },
                  { label: 'WEIGHT', value: `${r.weight} kg` },
                  { label: 'NEEDED BY', value: r.needed_by }
                ]}
              >
                <input
                  type="number"
                  min="0"
                  placeholder="Fee ₹"
                  value={fees[r.id] || ''}
                  onChange={(e) => setFees({ ...fees, [r.id]: e.target.value })}
                  style={{ marginBottom: 6 }}
                />
                <button className="btn btn-amber btn-sm" disabled={busyId === r.id} onClick={() => handleAccept(trip.id, r.id)}>Accept</button>
                <button className="btn btn-outline btn-sm" disabled={busyId === r.id} onClick={() => handleReject(trip.id, r.id)}>Reject</button>
              </TicketCard>
            ))}
          </div>
        )
      ))}
    </div>
  );
}

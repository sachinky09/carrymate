import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import TicketCard from '../components/TicketCard.jsx';

const FILE = 'src/pages/MyTrips.jsx';

export default function MyTrips() {
  const [trips, setTrips] = useState([]);
  const [form, setForm] = useState({ source: '', destination: '', travel_date: '', available_weight: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadTrips() {
    try {
      const res = await api.get('/trips/mine');
      setTrips(res.data);
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not load trips');
    }
  }

  useEffect(() => { loadTrips(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/trips', form);
      setForm({ source: '', destination: '', travel_date: '', available_weight: '' });
      await loadTrips();
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not create trip');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/trips/${id}`);
      setTrips(trips.filter((t) => t.id !== id));
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not delete trip');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>My Trips</h2>
          <p>Post a trip and matching requests will appear automatically.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form className="form-card" onSubmit={handleCreate} style={{ marginBottom: 32 }}>
        <div className="form-grid">
          <div className="form-row">
            <label>Source</label>
            <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g. Mumbai" required />
          </div>
          <div className="form-row">
            <label>Destination</label>
            <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="e.g. NIT Durgapur" required />
          </div>
          <div className="form-row">
            <label>Travel date</label>
            <input type="date" value={form.travel_date} onChange={(e) => setForm({ ...form, travel_date: e.target.value })} required />
          </div>
          <div className="form-row">
            <label>Available weight (kg)</label>
            <input type="number" min="0.1" step="0.1" value={form.available_weight} onChange={(e) => setForm({ ...form, available_weight: e.target.value })} required />
          </div>
        </div>
        <p className="field-note" style={{ marginBottom: 14 }}>One of source/destination must be exactly "NIT Durgapur".</p>
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Posting…' : 'Post trip'}</button>
      </form>

      {trips.length === 0 ? (
        <div className="empty-state">No trips yet. Post your first trip above.</div>
      ) : (
        trips.map((trip) => (
          <TicketCard
            key={trip.id}
            source={trip.source}
            destination={trip.destination}
            status={trip.status}
            fields={[
              { label: 'TRAVEL DATE', value: trip.travel_date },
              { label: 'WEIGHT', value: `${trip.available_weight} kg` }
            ]}
          >
            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(trip.id)}>Delete</button>
          </TicketCard>
        ))
      )}
    </div>
  );
}

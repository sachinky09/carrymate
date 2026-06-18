import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import TicketCard from '../components/TicketCard.jsx';

const FILE = 'src/pages/MyRequests.jsx';

const emptyForm = {
  source: '',
  destination: '',
  item_name: '',
  item_description: '',
  weight: '',
  needed_by: ''
};

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function loadRequests() {
    try {
      const res = await api.get('/requests/mine');
      setRequests(res.data);
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not load requests');
    }
  }

  useEffect(() => { loadRequests(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(form).forEach(([key, value]) => data.append(key, value));
      if (image) data.append('image', image);

      await api.post('/requests', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(emptyForm);
      setImage(null);
      await loadRequests();
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not create request');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    try {
      await api.patch(`/requests/${id}/cancel`);
      await loadRequests();
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not cancel request');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>My Requests</h2>
          <p>Ask a traveller to carry something for you.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      <form className="form-card" onSubmit={handleCreate} style={{ marginBottom: 32 }}>
        <div className="form-grid">
          <div className="form-row">
            <label>Source</label>
            <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="e.g. NIT Durgapur" required />
          </div>
          <div className="form-row">
            <label>Destination</label>
            <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} placeholder="e.g. Kolkata" required />
          </div>
          <div className="form-row">
            <label>Item name</label>
            <input value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} required />
          </div>
          <div className="form-row">
            <label>Weight (kg)</label>
            <input type="number" min="0.1" step="0.1" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} required />
          </div>
          <div className="form-row">
            <label>Needed by</label>
            <input type="date" value={form.needed_by} onChange={(e) => setForm({ ...form, needed_by: e.target.value })} required />
          </div>
          <div className="form-row">
            <label>Item image (optional)</label>
            <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files[0])} />
          </div>
        </div>
        <div className="form-row">
          <label>Description (optional)</label>
          <textarea rows={2} value={form.item_description} onChange={(e) => setForm({ ...form, item_description: e.target.value })} />
        </div>
        <p className="field-note" style={{ marginBottom: 14 }}>One of source/destination must be exactly "NIT Durgapur".</p>
        <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Posting…' : 'Post request'}</button>
      </form>

      {requests.length === 0 ? (
        <div className="empty-state">No requests yet. Post your first request above.</div>
      ) : (
        requests.map((r) => (
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
            {r.image_signed_url && (
              <img src={r.image_signed_url} alt={r.item_name} style={{ width: '100%', borderRadius: 6, marginBottom: 8 }} />
            )}
            {r.status === 'pending' && (
              <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r.id)}>Cancel</button>
            )}
          </TicketCard>
        ))
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import api from '../api/axios.js';
import StatusBadge from '../components/StatusBadge.jsx';

const FILE = 'src/pages/Deliveries.jsx';

export default function Deliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function loadDeliveries() {
    try {
      const res = await api.get('/deliveries/mine');
      setDeliveries(res.data);
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not load deliveries');
    }
  }

  useEffect(() => { loadDeliveries(); }, []);

  async function handleDeliver(id) {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/deliveries/${id}/deliver`);
      await loadDeliveries();
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not mark delivered');
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(id) {
    setBusyId(id);
    setError('');
    try {
      await api.patch(`/deliveries/${id}/cancel`);
      await loadDeliveries();
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not cancel delivery');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>My Deliveries</h2>
          <p>Accepted delivery relationships — the only matches that are ever stored.</p>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {deliveries.length === 0 ? (
        <div className="empty-state">No accepted deliveries yet.</div>
      ) : (
        deliveries.map((d) => (
          <div className="ticket" key={d.id} style={{ flexDirection: 'column' }}>
            <div className="ticket-main">
              <div className="ticket-route">
                <div className="ticket-stop">
                  <span className="ticket-code">{d.request.source}</span>
                  <span className="ticket-label">FROM</span>
                </div>
                <div className="ticket-divider"><span className="ticket-dash" /></div>
                <div className="ticket-stop ticket-stop-end">
                  <span className="ticket-code">{d.request.destination}</span>
                  <span className="ticket-label">TO</span>
                </div>
              </div>
              <div className="ticket-fields" style={{ marginBottom: 12 }}>
                <div className="ticket-field">
                  <span className="ticket-field-label">ITEM</span>
                  <span className="ticket-field-value">{d.request.item_name}</span>
                </div>
                <div className="ticket-field">
                  <span className="ticket-field-label">FEE</span>
                  <span className="ticket-field-value">₹{d.delivery_fee}</span>
                </div>
                <div className="ticket-field">
                  <span className="ticket-field-label">ROLE</span>
                  <span className="ticket-field-value">{d.role}</span>
                </div>
              </div>
              <StatusBadge status={d.status} />

              {d.otherParty && (
                <div className="contact-box" style={{ marginTop: 12 }}>
                  <strong>{d.role === 'traveller' ? 'Sender' : 'Traveller'} contact:</strong> {d.otherParty.name} · {d.otherParty.phone}
                  {d.otherParty.upi_id ? ` · UPI: ${d.otherParty.upi_id}` : ''}
                </div>
              )}

              {d.status === 'accepted' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  {d.role === 'traveller' && (
                    <button className="btn btn-amber btn-sm" disabled={busyId === d.id} onClick={() => handleDeliver(d.id)}>Mark delivered</button>
                  )}
                  <button className="btn btn-danger btn-sm" disabled={busyId === d.id} onClick={() => handleCancel(d.id)}>Cancel</button>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

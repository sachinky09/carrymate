import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const FILE = 'src/pages/Login.jsx';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential
    });
    window.google.accounts.id.renderButton(document.getElementById('google-btn'), {
      theme: 'outline',
      size: 'large',
      width: 360
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleCredential(response) {
    setError('');
    try {
      const res = await api.post('/auth/google', { idToken: response.credential });
      login(res.data.token, res.data.user);
      navigate('/trips');
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Google login failed');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.token, res.data.user);
      navigate('/trips');
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <h2>Log in</h2>
      {error && <div className="form-error">{error}</div>}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-row">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="form-row">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Logging in…' : 'Log in'}
        </button>

        <div style={{ margin: '18px 0', textAlign: 'center', color: 'var(--color-muted)', fontSize: '0.85rem' }}>or</div>

        {GOOGLE_CLIENT_ID ? (
          <div id="google-btn" style={{ display: 'flex', justifyContent: 'center' }} />
        ) : (
          <p className="field-note" style={{ textAlign: 'center' }}>Google login is not configured.</p>
        )}
      </form>

      <p style={{ marginTop: 18 }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}

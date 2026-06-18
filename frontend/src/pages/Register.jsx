import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';
import { useAuth } from '../context/AuthContext.jsx';

const FILE = 'src/pages/Register.jsx';

export default function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState('details'); // details -> otp -> done
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState({ emailOtp: '', phoneOtp: '' });
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  function updateForm(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleStart(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register/start', form);
      setInfo('OTP sent to your email and phone.');
      setStep('otp');
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Could not start registration');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmail(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register/verify-email', { email: form.email, otp: otp.emailOtp });
      setEmailVerified(true);
      if (res.data.token) {
        login(res.data.token, res.data.user);
        navigate('/trips');
      } else {
        setInfo(res.data.message);
      }
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Invalid email OTP');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyPhone(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register/verify-phone', { email: form.email, otp: otp.phoneOtp });
      setPhoneVerified(true);
      if (res.data.token) {
        login(res.data.token, res.data.user);
        navigate('/trips');
      } else {
        setInfo(res.data.message);
      }
    } catch (err) {
      console.error(`[ERROR] file=${FILE} message=${err.response?.data?.error || err.message}`);
      setError(err.response?.data?.error || 'Invalid phone OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <h2>Create your account</h2>
      <p className="field-note" style={{ marginBottom: 20 }}>Only @nitdgp.ac.in emails can register.</p>

      {error && <div className="form-error">{error}</div>}
      {info && !error && <div className="form-success">{info}</div>}

      {step === 'details' && (
        <form className="form-card" onSubmit={handleStart}>
          <div className="form-row">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" value={form.name} onChange={updateForm} required />
          </div>
          <div className="form-row">
            <label htmlFor="email">NIT Durgapur email</label>
            <input id="email" name="email" type="email" placeholder="you@nitdgp.ac.in" value={form.email} onChange={updateForm} required />
          </div>
          <div className="form-row">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" name="phone" placeholder="+91XXXXXXXXXX" value={form.phone} onChange={updateForm} required />
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={form.password} onChange={updateForm} required minLength={6} />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Sending OTPs…' : 'Send OTPs'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <div className="form-card otp-step">
          <form onSubmit={handleVerifyEmail} className="otp-step">
            <div className="form-row">
              <label htmlFor="emailOtp">Email OTP {emailVerified && '✓ verified'}</label>
              <input
                id="emailOtp"
                value={otp.emailOtp}
                onChange={(e) => setOtp({ ...otp, emailOtp: e.target.value })}
                disabled={emailVerified}
                required
              />
            </div>
            {!emailVerified && (
              <button className="btn btn-outline" type="submit" disabled={loading}>Verify email OTP</button>
            )}
          </form>

          <form onSubmit={handleVerifyPhone} className="otp-step">
            <div className="form-row">
              <label htmlFor="phoneOtp">Phone OTP {phoneVerified && '✓ verified'}</label>
              <input
                id="phoneOtp"
                value={otp.phoneOtp}
                onChange={(e) => setOtp({ ...otp, phoneOtp: e.target.value })}
                disabled={phoneVerified}
                required
              />
            </div>
            {!phoneVerified && (
              <button className="btn btn-outline" type="submit" disabled={loading}>Verify phone OTP</button>
            )}
          </form>

          <p className="field-note">Your account is created only after both OTPs are verified.</p>
        </div>
      )}

      <p style={{ marginTop: 18 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}

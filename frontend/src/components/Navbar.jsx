import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-mark">CM</span>
        CarryMate
      </Link>
      {user ? (
        <nav className="navbar-links">
          <Link to="/trips">Trips</Link>
          <Link to="/requests">Requests</Link>
          <Link to="/matches">Matches</Link>
          <Link to="/deliveries">Deliveries</Link>
          <span className="navbar-trust">Trust {user.trust_score ?? 50}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
        </nav>
      ) : (
        <nav className="navbar-links">
          <Link to="/login">Log in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
        </nav>
      )}
    </header>
  );
}

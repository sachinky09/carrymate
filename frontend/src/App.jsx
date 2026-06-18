import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Home from './pages/Home.jsx';
import Register from './pages/Register.jsx';
import Login from './pages/Login.jsx';
import MyTrips from './pages/MyTrips.jsx';
import MyRequests from './pages/MyRequests.jsx';
import Matches from './pages/Matches.jsx';
import Deliveries from './pages/Deliveries.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/trips" element={<ProtectedRoute><MyTrips /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><MyRequests /></ProtectedRoute>} />
        <Route path="/matches" element={<ProtectedRoute><Matches /></ProtectedRoute>} />
        <Route path="/deliveries" element={<ProtectedRoute><Deliveries /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

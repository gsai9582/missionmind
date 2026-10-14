import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import { Rocket } from 'lucide-react';

function App() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="app-container">
      {token && (
        <header className="header animate-fade-in">
          <h1><Rocket size={32} color="#818cf8" /> MissionMind</h1>
          <button className="btn btn-secondary" onClick={handleLogout}>Logout</button>
        </header>
      )}
      
      <main>
        <Routes>
          <Route path="/login" element={!token ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={token ? <Dashboard /> : <Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;

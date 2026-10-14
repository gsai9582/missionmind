import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Rocket } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call the backend auth endpoint
      const res = await api.post('/auth/register', {
        email,
        password,
        name: 'Scientist'
      }).catch(async (err) => {
        if (err.response && err.response.status === 400) {
           return await api.post('/auth/login', { email, password });
        }
        throw err;
      });

      localStorage.setItem('token', res.data.token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ maxWidth: '400px', margin: '10vh auto', padding: '2.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <Rocket size={48} color="#818cf8" style={{ marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Welcome to MissionMind</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Login to access MEDA data</p>
      </div>

      <form onSubmit={handleLogin}>
        {error && <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>}
        
        <input 
          type="email" 
          placeholder="Email Address" 
          className="input-field"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input 
          type="password" 
          placeholder="Password" 
          className="input-field"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}

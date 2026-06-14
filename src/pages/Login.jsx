import React, { useState } from 'react';
import { useStore } from '../store';

const Login = () => {
  const { db, login } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (pin === db.settings.adminPin) {
      login('admin', { username: 'admin' });
    } else {
      setError('Invalid Admin PIN');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="header-om">ॐ</h1>
        <h2 style={{ color: 'var(--primary)' }}>શ્રી ઉમિયા બચત મંડળ</h2>
        <p className="text-muted">Ahmedabad</p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="flex" style={{ borderBottom: '1px solid var(--border)', marginBottom: '1.5rem', justifyContent: 'center' }}>
          <h3 style={{ color: 'var(--primary)', padding: '0.5rem', margin: 0 }}>Admin Login</h3>
        </div>

        {error && <div className="mb-4 text-center" style={{ color: 'var(--danger)', padding: '0.5rem', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleLogin} className="flex-col gap-4">
          <div>
            <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>
              Admin PIN
            </label>
            <input 
              type="password" 
              placeholder="Enter PIN" 
              value={pin} 
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
              required 
            />
          </div>

          <button type="submit" className="mt-4 w-full" style={{ width: '100%' }}>Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;

import React, { useState } from 'react';
import { useStore } from '../store';

const Login = () => {
  const { db, updateDb, login } = useStore();
  const [mode, setMode] = useState('member'); // 'admin' or 'member'
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'admin') {
      if (pin === db.settings.adminPin) {
        login('admin', { username: 'admin' });
      } else {
        setError('Invalid Admin PIN');
      }
    } else {
      if (phone.length !== 10) {
        setError('Please enter a valid 10-digit phone number');
        return;
      }
      
      // Find member by phone
      const member = db.members.find(m => m.phone === phone);
      if (!member) {
        setError('Phone number not registered. Please contact Admin.');
        return;
      }

      // Check member access
      let access = db.memberAccess.find(ma => ma.memberId === member.id);
      
      if (!access) {
        // First time login - set PIN
        if (pin.length !== 4) {
          setError('Please enter a 4-digit PIN to register.');
          return;
        }
        access = {
          memberId: member.id,
          phone: member.phone,
          pin: pin,
          fcmToken: '',
          lastLogin: new Date().toISOString()
        };
        updateDb({ memberAccess: [...db.memberAccess, access] });
        login('member', member);
      } else {
        // Existing member login
        if (access.pin === pin) {
          // Update last login
          const updatedAccess = db.memberAccess.map(ma => 
            ma.memberId === member.id ? { ...ma, lastLogin: new Date().toISOString() } : ma
          );
          updateDb({ memberAccess: updatedAccess });
          login('member', member);
        } else {
          setError('Invalid PIN');
        }
      }
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
        <div className="flex" style={{ borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <button 
            type="button"
            style={{ 
              flex: 1, 
              background: 'none', 
              color: mode === 'admin' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: mode === 'admin' ? '2px solid var(--primary)' : 'none',
              borderRadius: 0
            }}
            onClick={() => { setMode('admin'); setError(''); setPin(''); setPhone(''); }}
          >
            Admin Login
          </button>
          <button 
            type="button"
            style={{ 
              flex: 1, 
              background: 'none', 
              color: mode === 'member' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: mode === 'member' ? '2px solid var(--primary)' : 'none',
              borderRadius: 0
            }}
            onClick={() => { setMode('member'); setError(''); setPin(''); setPhone(''); }}
          >
            Member Login
          </button>
        </div>

        {error && <div className="mb-4 text-center" style={{ color: 'var(--danger)', padding: '0.5rem', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleLogin} className="flex-col gap-4">
          {mode === 'member' && (
            <div>
              <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>Phone Number</label>
              <input 
                type="tel" 
                placeholder="10 digits" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} 
                required 
              />
            </div>
          )}
          
          <div>
            <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>
              {mode === 'member' && 'PIN (4 digits)'}
              {mode === 'admin' && 'Admin PIN'}
            </label>
            <input 
              type="password" 
              placeholder="Enter PIN" 
              value={pin} 
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
              required 
            />
            {mode === 'member' && (
              <p className="text-sm text-muted mt-2">
                If this is your first time logging in, the PIN you enter will be saved as your password.
              </p>
            )}
          </div>

          <button type="submit" className="mt-4 w-full" style={{ width: '100%' }}>Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;

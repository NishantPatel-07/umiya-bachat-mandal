import React, { useState } from 'react';
import { useStore } from '../store';
import { adminSignIn, memberSignIn } from '../lib/auth';

const Login = () => {
  const { login } = useStore();
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'member'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [memberNum, setMemberNum] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await adminSignIn(email, password);
      if (authError) throw authError;
      
      if (data?.user) {
        login('admin', data.user);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const num = parseInt(memberNum, 10);
      if (isNaN(num)) {
        throw new Error('Please enter a valid member number.');
      }
      if (pin.length !== 4) {
        throw new Error('PIN must be exactly 4 digits.');
      }

      const { data, error: authError } = await memberSignIn(num, pin);
      if (authError) throw authError;

      // The store.jsx onAuthStateChange or getSession will handle setting the currentUser.
      // But we can also set the loading/success state if we want.
    } catch (err) {
      setError(err.message || 'Login failed. Please check your member number and PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '1.5rem' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', animation: 'fadeInDown 0.8s ease-out' }}>
        <div style={{
          fontSize: '3.5rem',
          color: 'var(--primary)',
          textShadow: '0 4px 10px rgba(180, 83, 9, 0.15)',
          marginBottom: '0.2rem',
          display: 'inline-block'
        }}>ॐ</div>
        <h2 style={{ color: 'var(--primary)', fontWeight: '800', letterSpacing: '-0.025em', margin: '0.2rem 0' }}>શ્રી ઉમિયા બચત મંડળ</h2>
        <p className="text-muted" style={{ fontWeight: '500', fontSize: '0.95rem' }}>Ahmedabad · Savings & Loans Platform</p>
      </div>

      <div className="card" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        padding: '2rem', 
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        background: '#ffffff'
      }}>
        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-main)',
          padding: '4px',
          borderRadius: '10px',
          marginBottom: '1.75rem',
          border: '1px solid var(--border)'
        }}>
          <button 
            type="button"
            onClick={() => { setActiveTab('admin'); setError(''); }}
            style={{
              flex: 1,
              background: activeTab === 'admin' ? '#ffffff' : 'transparent',
              color: activeTab === 'admin' ? 'var(--primary)' : 'var(--text-muted)',
              border: 'none',
              boxShadow: activeTab === 'admin' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              fontWeight: '600',
              borderRadius: '8px',
              padding: '0.5rem',
              fontSize: '0.9rem',
              minHeight: '38px',
              transition: 'all 0.2s'
            }}
          >
            Admin Login
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('member'); setError(''); }}
            style={{
              flex: 1,
              background: activeTab === 'member' ? '#ffffff' : 'transparent',
              color: activeTab === 'member' ? 'var(--primary)' : 'var(--text-muted)',
              border: 'none',
              boxShadow: activeTab === 'member' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
              fontWeight: '600',
              borderRadius: '8px',
              padding: '0.5rem',
              fontSize: '0.9rem',
              minHeight: '38px',
              transition: 'all 0.2s'
            }}
          >
            Member Login
          </button>
        </div>

        {error && (
          <div style={{ 
            color: 'var(--danger)', 
            padding: '0.75rem 1rem', 
            background: '#fee2e2', 
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: '500',
            border: '1px solid #fecaca',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {activeTab === 'admin' ? (
          <form onSubmit={handleAdminSubmit} className="flex-col gap-4">
            <div>
              <label className="text-sm font-bold mb-2" style={{ display: 'block', color: 'var(--text-main)' }}>
                Admin Email
              </label>
              <input 
                type="email" 
                placeholder="admin@umiyamandal.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                style={{ transition: 'all 0.2s' }}
              />
            </div>

            <div>
              <label className="text-sm font-bold mb-2" style={{ display: 'block', color: 'var(--text-main)' }}>
                Password
              </label>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                style={{ transition: 'all 0.2s' }}
              />
            </div>

            <button 
              type="submit" 
              className="mt-2" 
              disabled={loading}
              style={{ 
                width: '100%',
                fontWeight: '600',
                boxShadow: '0 4px 6px -1px rgba(180, 83, 9, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleMemberSubmit} className="flex-col gap-4">
            <div>
              <label className="text-sm font-bold mb-2" style={{ display: 'block', color: 'var(--text-main)' }}>
                Member Number (1 - 50)
              </label>
              <input 
                type="number" 
                placeholder="Enter member number" 
                value={memberNum} 
                onChange={(e) => setMemberNum(e.target.value)} 
                required 
                min="1"
                max="50"
                style={{ transition: 'all 0.2s' }}
              />
            </div>

            <div>
              <label className="text-sm font-bold mb-2" style={{ display: 'block', color: 'var(--text-main)' }}>
                4-Digit PIN
              </label>
              <input 
                type="password" 
                placeholder="••••" 
                value={pin} 
                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))} 
                required 
                maxLength={4}
                style={{ transition: 'all 0.2s' }}
              />
            </div>

            <button 
              type="submit" 
              className="mt-2" 
              disabled={loading}
              style={{ 
                width: '100%',
                fontWeight: '600',
                boxShadow: '0 4px 6px -1px rgba(180, 83, 9, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? 'Verifying PIN...' : 'Login as Member'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;

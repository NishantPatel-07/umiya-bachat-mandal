import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { LogOut, Bell } from 'lucide-react';

const MemberDashboard = () => {
  const { db, currentUser, logout, triggerLocalSync } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  
  const member = currentUser.data;
  
  // Refresh data dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      triggerLocalSync();
    }, 10000);
    return () => clearInterval(interval);
  }, [triggerLocalSync]);

  const currentMonth = new Date().toISOString().slice(0, 7);
  const amountDue = member.shares * db.settings.monthly;
  const hasPaid = db.payments.some(p => p.memberId === member.id && p.month === currentMonth);
  
  const memberNotifications = db.notifications.filter(n => n.memberId === member.id).sort((a,b) => new Date(b.date) - new Date(a.date));
  const unreadCount = memberNotifications.filter(n => !n.read).length;

  const activeLoans = db.loans.filter(l => l.memberId === member.id && l.status === 'Active');

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <header className="app-header">
        <div className="flex items-center gap-2">
          <div className="avatar">{member.name.charAt(0)}</div>
          <div className="text-left">
            <h1 style={{ fontSize: '1rem', margin: 0 }}>Namaste, {member.name.split(' ')[0]}</h1>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>Member #{member.num}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            style={{ background: 'transparent', padding: 0, position: 'relative' }} 
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={24} />
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'var(--danger)', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {unreadCount}
              </span>
            )}
          </button>
          <button style={{ background: 'transparent', padding: 0 }} onClick={logout}>
            <LogOut size={24} />
          </button>
        </div>
      </header>

      <main className="container mt-4">
        {showNotifications && (
          <div className="card mb-4">
            <div className="flex justify-between items-center mb-2">
              <h3>Notifications</h3>
              <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', minHeight: 'auto' }} onClick={() => setShowNotifications(false)}>Close</button>
            </div>
            {memberNotifications.length === 0 ? <p className="text-muted text-sm">No notifications</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {memberNotifications.map(n => (
                  <li key={n.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div className="font-bold text-sm">{n.message}</div>
                    <div className="text-xs text-muted mt-1">{new Date(n.date).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="card">
          <h3 className="mb-4">📅 This Month ({new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})</h3>
          <div className="flex justify-between items-center mb-2">
            <span>Status:</span>
            {hasPaid ? 
              <span className="badge badge-success">✅ Paid</span> : 
              <span className="badge badge-warning">⏳ Pending</span>
            }
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Due Amount:</span>
            <span className="font-bold">₹{amountDue}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Due Date:</span>
            <span className="font-bold">{db.settings.day}th</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="card text-center" style={{ marginBottom: 0 }}>
            <h3>{member.shares}</h3>
            <p className="text-sm text-muted">My Shares</p>
          </div>
          <div className="card text-center" style={{ marginBottom: 0 }}>
            <h3 className="text-primary">₹{(member.shares * db.settings.shareVal).toLocaleString('en-IN')}</h3>
            <p className="text-sm text-muted">Total Value</p>
          </div>
        </div>

        {activeLoans.length > 0 && (
          <div className="card">
            <h3 className="mb-4" style={{ color: 'var(--warning)' }}>🏦 Active Loans</h3>
            {activeLoans.map(loan => {
              const isFlat = loan.type === 'FLAT_EMI';
              const balance = loan.amount - loan.principalPaid;
              const progressPct = Math.min(100, (loan.principalPaid / loan.amount) * 100);
              return (
                <div key={loan.id} className="mb-4 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                  {/* Loan Type Badge */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm">Loan #{loan.id.toString().slice(-4)}</span>
                    <span className={`badge ${isFlat ? 'badge-primary' : 'badge-warning'}`}>
                      {isFlat ? 'Flat Rate EMI' : 'Interest-Only'}
                    </span>
                  </div>

                  {/* Key Numbers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <div className="text-muted text-sm">Principal</div>
                      <div className="font-bold">₹{loan.amount.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-muted text-sm">{isFlat ? 'Monthly EMI' : 'Monthly Interest'}</div>
                      <div className="font-bold text-primary">₹{loan.emi.toLocaleString('en-IN')}/mo</div>
                    </div>
                    <div>
                      <div className="text-muted text-sm">Balance</div>
                      <div className="font-bold" style={{ color: 'var(--danger)' }}>₹{balance.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-muted text-sm">Rate</div>
                      <div className="font-bold">{loan.rate}%/mo</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted">Repaid</span>
                      <span>₹{loan.principalPaid.toLocaleString('en-IN')} of ₹{loan.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ background: 'var(--border)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                      <div style={{
                        background: 'var(--success)',
                        width: `${progressPct}%`,
                        height: '100%',
                        borderRadius: '999px'
                      }} />
                    </div>
                  </div>

                  {/* Interest-Only: Bullet Payment Note */}
                  {!isFlat && (
                    <div style={{
                      marginTop: '0.75rem', padding: '0.5rem 0.75rem',
                      background: '#fef9c3', borderRadius: '8px',
                      fontSize: '0.8rem', color: '#854d0e'
                    }}>
                      ⚠️ Final month: Bullet payment of ₹{(loan.amount + loan.emi).toLocaleString('en-IN')}
                      &nbsp;(₹{loan.amount.toLocaleString('en-IN')} principal + ₹{loan.emi.toLocaleString('en-IN')} interest)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="card">
          <h3 className="mb-4">📊 Share Payment History</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
            {[...Array(12)].map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const mStr = d.toISOString().slice(0, 7);
              const paid = db.payments.some(p => p.memberId === member.id && p.month === mStr);
              return (
                <div key={i} className="text-center p-2" style={{ border: '1px solid var(--border)', borderRadius: '8px', background: paid ? '#dcfce7' : 'transparent' }}>
                  <div className="text-xs text-muted mb-1">{d.toLocaleString('default', { month: 'short' })}</div>
                  <div style={{ fontSize: '0.8rem' }}>{paid ? '✅' : '—'}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Loan EMI History */}
        {activeLoans.length > 0 && (
          <div className="card">
            <h3 className="mb-4">🏦 Loan EMI History</h3>
            {activeLoans.map(loan => {
              const isFlat = loan.type === 'FLAT_EMI';
              return (
                <div key={loan.id} style={{ marginBottom: '1rem' }}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold">
                      Loan #{loan.id.toString().slice(-4)}
                    </span>
                    <span className={`badge ${isFlat ? 'badge-primary' : 'badge-warning'}`} style={{ fontSize: '0.7rem' }}>
                      {isFlat ? 'Flat EMI' : 'Interest-Only'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
                    {[...Array(loan.duration)].map((_, i) => {
                      const loanStart = new Date(loan.date);
                      const emiDate = new Date(loanStart.getFullYear(), loanStart.getMonth() + i, 1);
                      const mStr = emiDate.toISOString().slice(0, 7);
                      const paid = db.repayments.some(r => r.loanId === loan.id && r.month === mStr);
                      const isFinal = !isFlat && i === loan.duration - 1;
                      return (
                        <div key={i} className="text-center p-2" style={{
                          border: `1px solid ${isFinal ? 'var(--warning)' : 'var(--border)'}`,
                          borderRadius: '8px',
                          background: paid ? '#dcfce7' : isFinal ? '#fef9c3' : 'transparent'
                        }}>
                          <div className="text-xs text-muted mb-1">
                            {emiDate.toLocaleString('default', { month: 'short' })}
                          </div>
                          <div style={{ fontSize: '0.75rem' }}>
                            {paid ? '✅' : isFinal ? '💰' : '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted mt-1" style={{ textAlign: 'right' }}>
                    {isFlat ? `₹${loan.emi.toLocaleString('en-IN')}/mo` : `₹${loan.emi.toLocaleString('en-IN')}/mo interest · Final Bullet: ₹${(loan.amount + loan.emi).toLocaleString('en-IN')}`}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default MemberDashboard;

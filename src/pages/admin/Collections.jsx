import React, { useState } from 'react';
import { useStore } from '../../store';

const Collections = () => {
  const { db, updateDb, addActivity } = useStore();
  const [activeTab, setActiveTab] = useState('shares');
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  // Undo is now calculated dynamically from the database, allowing persistent undo.

  // ─── Share Collection ──────────────────────────────────────────────────────

  const handleMarkSharePaid = (member) => {
    const amount = member.shares * db.settings.monthly;
    const paymentId = Date.now();
    const payment = {
      id: paymentId,
      memberId: member.id,
      month: selectedMonth,
      amount,
      date: new Date().toISOString()
    };
    const notification = {
      id: Date.now() + 1,
      memberId: member.id,
      type: 'payment',
      message: `✅ Share Payment Recorded - ₹${amount} for ${selectedMonth}`,
      date: new Date().toISOString(),
      read: false
    };
    updateDb({
      payments: [...db.payments, payment],
      notifications: [...db.notifications, notification]
    });
    addActivity(`Share payment ₹${amount} recorded for ${member.name} (${selectedMonth})`);
  };

  const handleUndoSharePaid = (member) => {
    const payment = db.payments.find(p => p.memberId === member.id && p.month === selectedMonth);
    if (!payment) return;
    if (window.confirm(`Are you sure you want to undo/delete the share payment of ₹${payment.amount} for ${member.name} for ${selectedMonth}?`)) {
      updateDb({ payments: db.payments.filter(p => p.id !== payment.id) });
      addActivity(`Undid share payment for ${member.name} (${selectedMonth})`);
    }
  };

  // ─── Loan EMI Collection ───────────────────────────────────────────────────

  const isLoanEmiPaidForMonth = (loanId, month) =>
    db.repayments.some(r => r.loanId === loanId && r.month === month);

  const handleMarkLoanEmiPaid = (loan) => {
    const member = db.members.find(m => m.id === loan.memberId);
    const isFlat = loan.type === 'FLAT_EMI';
    let principal = 0, interest = 0, total = 0;
    if (isFlat) {
      const totalInterest = loan.amount * (loan.rate / 100) * loan.duration;
      interest = Math.round(totalInterest / loan.duration);
      principal = loan.emi - interest;
      total = loan.emi;
    } else {
      interest = loan.emi;
      principal = 0;
      total = loan.emi;
    }
    const remainingPrincipal = loan.amount - loan.principalPaid;
    if (remainingPrincipal <= 0) { alert('This loan is already fully repaid.'); return; }

    const repaymentId = Date.now();
    const newRepayment = {
      id: repaymentId, loanId: loan.id, month: selectedMonth,
      date: new Date().toISOString(), amount: total, principal, interest
    };
    const newPrincipalPaid = loan.principalPaid + principal;
    const newInterestPaid = loan.interestPaid + interest;
    const isFullyRepaid = newPrincipalPaid >= loan.amount;
    const originalLoans = db.loans;
    const updatedLoans = db.loans.map(l =>
      l.id === loan.id
        ? { ...l, principalPaid: newPrincipalPaid, interestPaid: newInterestPaid, status: isFullyRepaid ? 'Repaid' : 'Active' }
        : l
    );
    const notification = {
      id: Date.now() + 1, memberId: member.id, type: 'loan',
      message: `✅ Loan EMI Recorded - ₹${total.toLocaleString('en-IN')} for ${selectedMonth}`,
      date: new Date().toISOString(), read: false
    };
    updateDb({ loans: updatedLoans, repayments: [...db.repayments, newRepayment], notifications: [...db.notifications, notification] });
    addActivity(`Loan EMI ₹${total.toLocaleString('en-IN')} recorded for ${member?.name} (${selectedMonth})`);
  };

  const handleUndoLoanEmiPaid = (loan) => {
    const repayment = db.repayments.find(r => r.loanId === loan.id && r.month === selectedMonth);
    if (!repayment) return;
    if (window.confirm(`Are you sure you want to undo/delete the EMI repayment of ₹${repayment.amount} for this loan?`)) {
      const updatedLoans = db.loans.map(l => {
        if (l.id === loan.id) {
          const newPrincipalPaid = Math.max(0, l.principalPaid - repayment.principal);
          const newInterestPaid = Math.max(0, l.interestPaid - repayment.interest);
          return {
            ...l,
            principalPaid: newPrincipalPaid,
            interestPaid: newInterestPaid,
            status: 'Active'
          };
        }
        return l;
      });
      updateDb({
        repayments: db.repayments.filter(r => r.id !== repayment.id),
        loans: updatedLoans
      });
      const member = db.members.find(m => m.id === loan.memberId);
      addActivity(`Undid loan EMI payment for ${member?.name} (${selectedMonth})`);
    }
  };

  const activeLoans = db.loans.filter(l => l.status === 'Active');

  const sharePendingCount = db.members.filter(
    m => !db.payments.some(p => p.memberId === m.id && p.month === selectedMonth)
  ).length;
  const loanEmiPendingCount = activeLoans.filter(
    l => !isLoanEmiPaidForMonth(l.id, selectedMonth)
  ).length;

  return (
    <div>
      <h2 className="mb-4">Collections</h2>

      {/* Month Selector */}
      <div className="card flex justify-between items-center mb-4" style={{ flexWrap: 'wrap', gap: '0.75rem', padding: '1rem 1.25rem' }}>
        <label className="font-bold" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}>
          <span>📅</span> Month:
        </label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => { setSelectedMonth(e.target.value); }}
          style={{ width: 'auto', flexGrow: 1, maxWidth: '200px', minHeight: '38px', padding: '0.5rem 0.75rem' }}
        />
      </div>

      {/* Tabs */}
      <div className="flex" style={{ borderBottom: '2px solid var(--border)', marginBottom: '1.25rem', gap: '0.5rem' }}>
        <button type="button" onClick={() => setActiveTab('shares')} style={{
          flex: 1, background: 'none', borderRadius: 0,
          color: activeTab === 'shares' ? 'var(--primary)' : 'var(--text-muted)',
          borderBottom: activeTab === 'shares' ? '3px solid var(--primary)' : 'none',
          marginBottom: '-2px', padding: '0.75rem 0.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          fontSize: '0.95rem', fontWeight: activeTab === 'shares' ? 'bold' : 'normal'
        }}>
          <span>💰 Shares</span>
          {sharePendingCount > 0 && (
            <span style={{ background: 'var(--danger)', color: 'white', borderRadius: '9999px', padding: '0.1rem 0.45rem', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block', lineHeight: 1.2 }}>
              {sharePendingCount}
            </span>
          )}
        </button>
        <button type="button" onClick={() => setActiveTab('loans')} style={{
          flex: 1, background: 'none', borderRadius: 0,
          color: activeTab === 'loans' ? 'var(--primary)' : 'var(--text-muted)',
          borderBottom: activeTab === 'loans' ? '3px solid var(--primary)' : 'none',
          marginBottom: '-2px', padding: '0.75rem 0.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          fontSize: '0.95rem', fontWeight: activeTab === 'loans' ? 'bold' : 'normal'
        }}>
          <span>🏦 Loan EMI</span>
          {loanEmiPendingCount > 0 && (
            <span style={{ background: 'var(--danger)', color: 'white', borderRadius: '9999px', padding: '0.1rem 0.45rem', fontSize: '0.75rem', fontWeight: 'bold', display: 'inline-block', lineHeight: 1.2 }}>
              {loanEmiPendingCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Share Collections Tab ── */}
      {activeTab === 'shares' && (
        <div>
          {db.members.length === 0 ? (
            <div className="card text-center text-muted py-8">No members found. Add members first.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {db.members.map(member => {
                const amountDue = member.shares * db.settings.monthly;
                const hasPaid = db.payments.some(p => p.memberId === member.id && p.month === selectedMonth);

                return (
                  <div key={member.id} className="card" style={{ margin: 0, padding: '1rem' }}>
                    <div className="flex justify-between items-center" style={{ gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="font-bold" style={{ fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member.name}
                        </div>
                        <div className="text-sm text-muted" style={{ marginTop: '0.25rem' }}>
                          No: {member.num} · {member.shares} shares
                        </div>
                        <div className="flex items-center gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                          <span className="font-bold text-primary" style={{ fontSize: '1.1rem' }}>
                            ₹{amountDue.toLocaleString('en-IN')}
                          </span>
                          {hasPaid
                            ? <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>Paid ✅</span>
                            : <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem' }}>Pending ⏳</span>
                          }
                        </div>
                      </div>
                      <div style={{ flexShrink: 0 }}>
                        {!hasPaid ? (
                          <button
                            className="btn-success"
                            style={{ padding: '0.5rem 1rem', minHeight: 'auto', fontSize: '0.9rem', fontWeight: '600', borderRadius: '8px', boxShadow: '0 2px 4px rgba(22,163,74,0.15)' }}
                            onClick={() => handleMarkSharePaid(member)}
                          >
                            Mark Paid
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUndoSharePaid(member)}
                            style={{
                              padding: '0.5rem 1rem', minHeight: 'auto', fontSize: '0.9rem',
                              fontWeight: '600', borderRadius: '8px', cursor: 'pointer', border: 'none',
                              background: '#f59e0b', color: 'white',
                              boxShadow: '0 2px 4px rgba(245,158,11,0.3)'
                            }}
                          >
                            ↩ Undo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Loan EMI Collections Tab ── */}
      {activeTab === 'loans' && (
        <div>
          {activeLoans.length === 0 ? (
            <div className="card text-center text-muted py-8">No active loans found.</div>
          ) : (
            activeLoans.map(loan => {
              const member = db.members.find(m => m.id === loan.memberId);
              const isFlat = loan.type === 'FLAT_EMI';
              const isPaid = isLoanEmiPaidForMonth(loan.id, selectedMonth);
              const remainingBalance = loan.amount - loan.principalPaid;

              let previewInterest = 0, previewPrincipal = 0;
              if (isFlat) {
                const totalInterest = loan.amount * (loan.rate / 100) * loan.duration;
                previewInterest = Math.round(totalInterest / loan.duration);
                previewPrincipal = loan.emi - previewInterest;
              } else {
                previewInterest = loan.emi;
                previewPrincipal = 0;
              }

              return (
                <div key={loan.id} className="card mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="font-bold">{member?.name}</div>
                      <div className="text-sm text-muted">Member #{member?.num}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                      <span className={`badge ${isFlat ? 'badge-primary' : 'badge-warning'}`}>
                        {isFlat ? 'Flat Rate EMI' : 'Interest-Only'}
                      </span>
                      {isPaid
                        ? <span className="badge badge-success">Paid ✅</span>
                        : <span className="badge badge-danger">Pending ⏳</span>
                      }
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                    <div className="text-center">
                      <div className="text-muted text-sm">{isFlat ? 'Monthly EMI' : 'Monthly Interest'}</div>
                      <div className="font-bold text-primary">₹{loan.emi.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted text-sm">Principal Part</div>
                      <div className="font-bold">₹{previewPrincipal.toLocaleString('en-IN')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-muted text-sm">Interest Part</div>
                      <div className="font-bold">₹{previewInterest.toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm mb-3">
                    <span className="text-muted">Remaining Principal Balance:</span>
                    <span className="font-bold" style={{ color: 'var(--danger)' }}>₹{remainingBalance.toLocaleString('en-IN')}</span>
                  </div>

                  {!isFlat && (
                    <div style={{ padding: '0.5rem 0.75rem', background: '#fef9c3', borderRadius: '8px', fontSize: '0.8rem', color: '#854d0e', marginBottom: '1rem' }}>
                      ⚠️ This records the monthly interest only. For the final bullet payment (₹{(loan.amount + loan.emi).toLocaleString('en-IN')}), use the Loans tab.
                    </div>
                  )}

                  {/* Action Button — toggles between Mark Paid and Undo */}
                  {!isPaid ? (
                    <button
                      className="btn-success"
                      style={{ width: '100%' }}
                      onClick={() => {
                        if (window.confirm(
                          `Record ${isFlat ? 'EMI' : 'Interest'} of ₹${loan.emi.toLocaleString('en-IN')} for ${member?.name} for ${selectedMonth}?\n\nPrincipal: ₹${previewPrincipal.toLocaleString('en-IN')}\nInterest: ₹${previewInterest.toLocaleString('en-IN')}`
                        )) {
                          handleMarkLoanEmiPaid(loan);
                        }
                      }}
                    >
                      ✓ Mark EMI Paid — ₹{loan.emi.toLocaleString('en-IN')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUndoLoanEmiPaid(loan)}
                      style={{
                        width: '100%', padding: '0.65rem', fontSize: '0.95rem',
                        fontWeight: '600', borderRadius: '8px', cursor: 'pointer',
                        border: 'none', background: '#f59e0b', color: 'white',
                        boxShadow: '0 2px 4px rgba(245,158,11,0.3)'
                      }}
                    >
                      ↩ Undo EMI — ₹{loan.emi.toLocaleString('en-IN')}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Collections;

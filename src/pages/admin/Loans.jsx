import React, { useState } from 'react';
import { useStore } from '../../store';

// ─── Calculation Helpers ───────────────────────────────────────────────────────

/**
 * TYPE 1: FLAT RATE EMI
 * Total Interest = Principal × Rate × Duration
 * Monthly Installment = (Principal + Total Interest) ÷ Duration
 */
const calcFlatEMI = (principal, rate, duration) => {
  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) / 100;
  const n = parseInt(duration) || 1;
  const totalInterest = p * r * n;
  const totalRepayment = p + totalInterest;
  const emi = Math.round(totalRepayment / n);
  return { emi, totalInterest: Math.round(totalInterest), totalRepayment: Math.round(totalRepayment) };
};

/**
 * TYPE 2: INTEREST-ONLY (Bullet Payment)
 * Monthly Interest = Principal × Rate
 * Months 1 to (n-1): pay only interest
 * Final Month: pay Principal + interest
 */
const calcInterestOnly = (principal, rate, duration) => {
  const p = parseFloat(principal) || 0;
  const r = parseFloat(rate) / 100;
  const n = parseInt(duration) || 1;
  const monthlyInterest = Math.round(p * r);
  const totalInterest = monthlyInterest * n;
  const finalPayment = p + monthlyInterest;
  return { monthlyInterest, totalInterest, finalPayment };
};

// ─── Repayment Schedule Modal ─────────────────────────────────────────────────

const ScheduleModal = ({ loan, onClose }) => {
  const rows = [];
  if (loan.type === 'FLAT_EMI') {
    for (let i = 1; i <= loan.duration; i++) {
      rows.push({ month: i, amount: loan.emi, note: 'Equal Installment' });
    }
  } else {
    const monthly = Math.round(loan.amount * (loan.rate / 100));
    for (let i = 1; i <= loan.duration; i++) {
      if (i < loan.duration) {
        rows.push({ month: i, amount: monthly, note: 'Interest Only' });
      } else {
        rows.push({ month: i, amount: loan.amount + monthly, note: 'Principal + Interest (Bullet)' });
      }
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', overflow: 'auto', margin: 0 }}>
        <div className="flex justify-between items-center mb-4">
          <h3>Repayment Schedule</h3>
          <button className="btn-secondary" style={{ minHeight: 'auto', padding: '0.25rem 0.75rem' }} onClick={onClose}>✕ Close</button>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.5rem', padding: '0.75rem',
          background: 'var(--primary-light)', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem'
        }}>
          <div><span className="text-muted">Principal</span><br /><strong>₹{loan.amount.toLocaleString('en-IN')}</strong></div>
          <div><span className="text-muted">Rate</span><br /><strong>{loan.rate}%/mo</strong></div>
          <div><span className="text-muted">Type</span><br />
            <strong>{loan.type === 'FLAT_EMI' ? 'Flat Rate EMI' : 'Interest-Only'}</strong>
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount (₹)</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.month} style={{ background: r.month === loan.duration && loan.type === 'INTEREST_ONLY' ? '#fef9c3' : '' }}>
                  <td>{r.month}</td>
                  <td><strong>₹{r.amount.toLocaleString('en-IN')}</strong></td>
                  <td className="text-sm text-muted">{r.note}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--bg-main)', fontWeight: 700 }}>
                <td>Total</td>
                <td>₹{rows.reduce((s, r) => s + r.amount, 0).toLocaleString('en-IN')}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── Record Repayment Modal ───────────────────────────────────────────────────

const RepayModal = ({ loan, onClose, onSave }) => {
  const isInterestOnly = loan.type === 'INTEREST_ONLY';
  const monthlyInterest = isInterestOnly ? Math.round(loan.amount * (loan.rate / 100)) : 0;
  const remainingPrincipal = loan.amount - loan.principalPaid;
  const isFinalPayment = isInterestOnly && remainingPrincipal > 0;

  const [repayType, setRepayType] = useState(isInterestOnly ? 'interest' : 'full');
  const [customAmount, setCustomAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const getAmountBreakdown = () => {
    if (loan.type === 'FLAT_EMI') {
      const interest = Math.round((loan.amount * (loan.rate / 100) * loan.duration) / loan.duration);
      const principal = loan.emi - interest;
      return { principal, interest, total: loan.emi };
    }
    if (repayType === 'interest') {
      return { principal: 0, interest: monthlyInterest, total: monthlyInterest };
    }
    // bullet (final payment)
    return { principal: remainingPrincipal, interest: monthlyInterest, total: remainingPrincipal + monthlyInterest };
  };

  const breakdown = getAmountBreakdown();

  const handleSave = () => {
    onSave({ loanId: loan.id, date, ...breakdown });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px', margin: 0 }}>
        <div className="flex justify-between items-center mb-4">
          <h3>Record Repayment</h3>
          <button className="btn-secondary" style={{ minHeight: 'auto', padding: '0.25rem 0.75rem' }} onClick={onClose}>✕</button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>Repayment Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {isInterestOnly && (
          <div style={{ marginBottom: '1rem' }}>
            <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>Repayment Type</label>
            <div className="flex gap-4">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="repayType" value="interest" checked={repayType === 'interest'} onChange={() => setRepayType('interest')} />
                Interest Only (₹{monthlyInterest.toLocaleString('en-IN')})
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="repayType" value="bullet" checked={repayType === 'bullet'} onChange={() => setRepayType('bullet')} />
                Final Bullet (₹{(remainingPrincipal + monthlyInterest).toLocaleString('en-IN')})
              </label>
            </div>
          </div>
        )}

        <div style={{
          background: 'var(--bg-main)', borderRadius: '8px', padding: '1rem', marginBottom: '1rem'
        }}>
          <div className="flex justify-between mb-2">
            <span className="text-muted">Principal Component:</span>
            <strong>₹{breakdown.principal.toLocaleString('en-IN')}</strong>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-muted">Interest Component:</span>
            <strong>₹{breakdown.interest.toLocaleString('en-IN')}</strong>
          </div>
          <div className="flex justify-between" style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
            <span className="font-bold">Total Payment:</span>
            <strong className="text-primary">₹{breakdown.total.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <button className="btn-success" style={{ width: '100%' }} onClick={handleSave}>
          ✓ Save Repayment
        </button>
      </div>
    </div>
  );
};

// ─── Main Loans Component ─────────────────────────────────────────────────────

const Loans = () => {
  const { db, updateDb, addActivity } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [scheduleFor, setScheduleFor] = useState(null);
  const [repayFor, setRepayFor] = useState(null);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'repaid'

  // Form State
  const [memberId, setMemberId] = useState('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState(db.settings.interest);
  const [duration, setDuration] = useState('12');
  const [loanType, setLoanType] = useState('FLAT_EMI');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));

  // Live Preview Calculation
  const preview = amount && rate && duration
    ? loanType === 'FLAT_EMI'
      ? calcFlatEMI(amount, rate, duration)
      : calcInterestOnly(amount, rate, duration)
    : null;

  const resetForm = () => {
    setMemberId(''); setAmount(''); setRate(db.settings.interest);
    setDuration('12'); setLoanType('FLAT_EMI');
    setStartDate(new Date().toISOString().slice(0, 10));
  };

  const handleAddLoan = (e) => {
    e.preventDefault();
    if (!memberId) return;

    const principal = parseFloat(amount);
    const months = parseInt(duration);
    const r = parseFloat(rate);

    let emi;
    if (loanType === 'FLAT_EMI') {
      emi = calcFlatEMI(principal, r, months).emi;
    } else {
      emi = calcInterestOnly(principal, r, months).monthlyInterest; // monthly interest installment
    }

    const newLoan = {
      id: Date.now(),
      memberId: memberId,
      amount: principal,
      rate: r,
      duration: months,
      type: loanType,
      status: 'Active',
      emi,       // For FLAT_EMI: equal monthly installment; For INTEREST_ONLY: monthly interest amount
      principalPaid: 0,
      interestPaid: 0,
      date: startDate
    };

    updateDb({ loans: [...db.loans, newLoan] });
    const member = db.members.find(m => m.id === memberId);
    addActivity(`New ${loanType === 'FLAT_EMI' ? 'Flat EMI' : 'Interest-Only'} loan of ₹${principal.toLocaleString('en-IN')} issued to ${member?.name}`);
    resetForm();
    setShowForm(false);
  };

  const handleSaveRepayment = ({ loanId, date, principal, interest, total }) => {
    const loan = db.loans.find(l => l.id === loanId);
    if (!loan) return;

    const newRepayment = {
      id: Date.now(),
      loanId,
      date,
      month: date ? date.slice(0, 7) : new Date().toISOString().slice(0, 7),
      amount: total,
      principal,
      interest
    };

    const newPrincipalPaid = loan.principalPaid + principal;
    const newInterestPaid = loan.interestPaid + interest;
    const isRepaid = newPrincipalPaid >= loan.amount;

    const updatedLoans = db.loans.map(l => l.id === loanId
      ? { ...l, principalPaid: newPrincipalPaid, interestPaid: newInterestPaid, status: isRepaid ? 'Repaid' : 'Active' }
      : l
    );

    const member = db.members.find(m => m.id === loan.memberId);
    updateDb({ loans: updatedLoans, repayments: [...db.repayments, newRepayment] });
    addActivity(`Repayment of ₹${total.toLocaleString('en-IN')} recorded for ${member?.name}'s loan`);
  };

  const activeLoans = db.loans.filter(l => l.status === 'Active');
  const repaidLoans = db.loans.filter(l => l.status === 'Repaid');
  const displayLoans = activeTab === 'active' ? activeLoans : repaidLoans;

  return (
    <div>
      {scheduleFor && <ScheduleModal loan={scheduleFor} onClose={() => setScheduleFor(null)} />}
      {repayFor && <RepayModal loan={repayFor} onClose={() => setRepayFor(null)} onSave={handleSaveRepayment} />}

      <div className="flex justify-between items-center mb-4">
        <h2>Loan Management</h2>
        <button onClick={() => { setShowForm(!showForm); resetForm(); }}>
          {showForm ? 'Cancel' : '+ New Loan'}
        </button>
      </div>

      {/* ── New Loan Form ── */}
      {showForm && (
        <div className="card mb-4">
          <h3 className="mb-4">Issue New Loan</h3>
          <form onSubmit={handleAddLoan}>
            {/* Loan Type Selection */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>Loan Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                  padding: '0.75rem', border: `2px solid ${loanType === 'FLAT_EMI' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '8px', cursor: 'pointer',
                  background: loanType === 'FLAT_EMI' ? 'var(--primary-light)' : 'white'
                }}>
                  <input type="radio" name="loanType" value="FLAT_EMI" checked={loanType === 'FLAT_EMI'} onChange={() => setLoanType('FLAT_EMI')} style={{ marginTop: '2px' }} />
                  <div>
                    <div className="font-bold text-sm">Flat Rate EMI</div>
                    <div className="text-sm text-muted">Equal monthly installments throughout tenure</div>
                  </div>
                </label>
                <label style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
                  padding: '0.75rem', border: `2px solid ${loanType === 'INTEREST_ONLY' ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '8px', cursor: 'pointer',
                  background: loanType === 'INTEREST_ONLY' ? 'var(--primary-light)' : 'white'
                }}>
                  <input type="radio" name="loanType" value="INTEREST_ONLY" checked={loanType === 'INTEREST_ONLY'} onChange={() => setLoanType('INTEREST_ONLY')} style={{ marginTop: '2px' }} />
                  <div>
                    <div className="font-bold text-sm">Interest-Only</div>
                    <div className="text-sm text-muted">Interest monthly, full principal at end (Bullet)</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Member & Loan Details */}
            <div style={{ marginBottom: '1rem' }}>
              <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>Select Member</label>
              <select required value={memberId} onChange={e => setMemberId(e.target.value)}>
                <option value="">-- Choose Member --</option>
                {db.members.map(m => <option key={m.id} value={m.id}>{m.name} (No: {m.num})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '1rem' }}>
              <div>
                <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>Principal Amount (₹)</label>
                <input type="number" required min="1000" placeholder="e.g. 100000" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>Interest Rate (%/month)</label>
                <input type="number" step="0.1" required placeholder="e.g. 2" value={rate} onChange={e => setRate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>Duration (Months)</label>
                <input type="number" required min="1" placeholder="e.g. 10" value={duration} onChange={e => setDuration(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
            </div>

            {/* Live Calculation Preview */}
            {preview && (
              <div style={{
                background: 'var(--bg-main)', borderRadius: '10px', padding: '1rem',
                marginBottom: '1rem', border: '1px solid var(--border)'
              }}>
                <div className="font-bold text-sm mb-3" style={{ color: 'var(--primary)' }}>
                  📊 Calculation Preview
                </div>
                {loanType === 'FLAT_EMI' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                    <div>
                      <div className="text-muted text-sm">Total Interest</div>
                      <div className="font-bold">₹{preview.totalInterest.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-muted text-sm">Total Repayment</div>
                      <div className="font-bold">₹{preview.totalRepayment.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ background: 'var(--primary-light)', borderRadius: '8px', padding: '0.25rem' }}>
                      <div className="text-muted text-sm">Monthly EMI</div>
                      <div className="font-bold text-primary">₹{preview.emi.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', textAlign: 'center' }}>
                    <div style={{ background: 'var(--primary-light)', borderRadius: '8px', padding: '0.25rem' }}>
                      <div className="text-muted text-sm">Monthly Interest</div>
                      <div className="font-bold text-primary">₹{preview.monthlyInterest.toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-muted text-sm">Total Interest</div>
                      <div className="font-bold">₹{preview.totalInterest.toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ background: '#fef9c3', borderRadius: '8px', padding: '0.25rem' }}>
                      <div className="text-muted text-sm">Final Bullet</div>
                      <div className="font-bold" style={{ color: 'var(--warning)' }}>₹{preview.finalPayment.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button type="submit" style={{ width: '100%' }}>Issue Loan</button>
          </form>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="flex" style={{ borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
        {['active', 'repaid'].map(tab => (
          <button key={tab} type="button" onClick={() => setActiveTab(tab)} style={{
            flex: 1, background: 'none', borderRadius: 0,
            color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === tab ? '2px solid var(--primary)' : 'none',
            textTransform: 'capitalize'
          }}>
            {tab === 'active' ? `Active (${activeLoans.length})` : `Repaid (${repaidLoans.length})`}
          </button>
        ))}
      </div>

      {/* ── Loan Cards ── */}
      {displayLoans.length === 0 ? (
        <div className="card text-center text-muted py-8">No {activeTab} loans found.</div>
      ) : (
        displayLoans.map(loan => {
          const member = db.members.find(m => m.id === loan.memberId);
          const balance = loan.amount - loan.principalPaid;
          const isFlat = loan.type === 'FLAT_EMI';
          const typeLabel = isFlat ? 'Flat Rate EMI' : 'Interest-Only';
          const typeBadge = isFlat ? 'badge-primary' : 'badge-warning';
          const monthlyInstallment = loan.emi;
          const loanRepayments = db.repayments.filter(r => r.loanId === loan.id);

          return (
            <div key={loan.id} className="card mb-4">
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="font-bold">{member?.name}</div>
                  <div className="text-sm text-muted">Member #{member?.num} · Issued: {new Date(loan.date).toLocaleDateString('en-IN')}</div>
                </div>
                <span className={`badge ${typeBadge}`}>{typeLabel}</span>
              </div>

              {/* Loan Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem', background: 'var(--bg-main)', padding: '0.75rem', borderRadius: '8px' }}>
                <div className="text-center">
                  <div className="text-muted text-sm">Principal</div>
                  <div className="font-bold">₹{loan.amount.toLocaleString('en-IN')}</div>
                </div>
                <div className="text-center">
                  <div className="text-muted text-sm">Rate</div>
                  <div className="font-bold">{loan.rate}%/mo</div>
                </div>
                <div className="text-center">
                  <div className="text-muted text-sm">Duration</div>
                  <div className="font-bold">{loan.duration} mo</div>
                </div>
                <div className="text-center">
                  <div className="text-muted text-sm">{isFlat ? 'Monthly EMI' : 'Monthly Interest'}</div>
                  <div className="font-bold text-primary">₹{monthlyInstallment.toLocaleString('en-IN')}</div>
                </div>
                {!isFlat && (
                  <div className="text-center">
                    <div className="text-muted text-sm">Final Bullet</div>
                    <div className="font-bold" style={{ color: 'var(--warning)' }}>₹{(loan.amount + loan.emi).toLocaleString('en-IN')}</div>
                  </div>
                )}
                <div className="text-center">
                  <div className="text-muted text-sm">Balance</div>
                  <div className="font-bold" style={{ color: balance > 0 ? 'var(--danger)' : 'var(--success)' }}>₹{balance.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Repayment Progress */}
              <div style={{ marginBottom: '1rem' }}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">Principal Repaid</span>
                  <span className="font-bold">₹{loan.principalPaid.toLocaleString('en-IN')} / ₹{loan.amount.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ background: 'var(--border)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                  <div style={{
                    background: 'var(--success)',
                    width: `${Math.min(100, (loan.principalPaid / loan.amount) * 100)}%`,
                    height: '100%', borderRadius: '999px',
                    transition: 'width 0.4s ease'
                  }} />
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted">Interest Paid: ₹{loan.interestPaid.toLocaleString('en-IN')}</span>
                  <span className="text-muted">{loanRepayments.length} payment{loanRepayments.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {loan.status === 'Active' && (
                <div className="flex gap-4">
                  <button className="btn-success" style={{ flex: 1 }} onClick={() => setRepayFor(loan)}>
                    Record Repayment
                  </button>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setScheduleFor(loan)}>
                    View Schedule
                  </button>
                </div>
              )}
              {loan.status === 'Repaid' && (
                <div className="flex gap-4">
                  <span className="badge badge-success" style={{ margin: '0 auto' }}>✅ Fully Repaid</span>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setScheduleFor(loan)}>
                    View Schedule
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Loans;

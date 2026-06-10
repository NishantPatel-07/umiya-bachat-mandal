import React, { useState } from 'react';
import { useStore } from '../../store';

const Dividends = () => {
  const { db, updateDb, addActivity } = useStore();
  
  // Calculate total interest pool
  const totalInterestEarned = db.repayments.reduce((sum, r) => sum + r.interest, 0) || 0; // fallback if no repayments yet
  const totalDistributed = db.dividends.reduce((sum, d) => sum + d.totalAmount, 0);
  const availablePool = totalInterestEarned - totalDistributed;
  
  const totalShares = db.members.reduce((sum, m) => sum + m.shares, 0);
  
  const [distributeAmount, setDistributeAmount] = useState(availablePool);
  
  const handleDistribute = () => {
    if (distributeAmount <= 0 || totalShares === 0) return;
    
    if (window.confirm(`Distribute ₹${distributeAmount} among ${totalShares} shares?`)) {
      const perShare = distributeAmount / totalShares;
      
      const newDividend = {
        id: Date.now(),
        year: new Date().getFullYear(),
        date: new Date().toISOString(),
        totalAmount: parseFloat(distributeAmount),
        perShare,
        totalShares,
        members: db.members.map(m => ({
          memberId: m.id,
          shares: m.shares,
          amount: m.shares * perShare
        }))
      };
      
      updateDb({ dividends: [...db.dividends, newDividend] });
      addActivity(`Distributed ₹${distributeAmount} as yearly dividend`);
      setDistributeAmount(0);
    }
  };

  return (
    <div>
      <h2>Dividend Distribution</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card text-center">
          <h3>₹{totalInterestEarned.toLocaleString('en-IN')}</h3>
          <p className="text-sm text-muted">Total Interest Earned</p>
        </div>
        <div className="card text-center">
          <h3 className="text-primary">₹{availablePool.toLocaleString('en-IN')}</h3>
          <p className="text-sm text-muted">Available Pool</p>
        </div>
      </div>
      
      <div className="card mb-4">
        <h3>Distribute Dividend</h3>
        <p className="text-sm text-muted mb-4">Interest collected from loans is distributed back to members based on their shares.</p>
        
        <div className="flex-col gap-4">
          <div>
            <label className="text-sm font-bold mb-2">Amount to Distribute (₹)</label>
            <input 
              type="number" 
              max={availablePool} 
              value={distributeAmount} 
              onChange={e => setDistributeAmount(e.target.value)} 
            />
          </div>
          <div className="flex justify-between items-center bg-main" style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
            <span>Est. Per Share:</span>
            <span className="font-bold">₹{(totalShares > 0 ? distributeAmount / totalShares : 0).toFixed(2)}</span>
          </div>
          <button className="w-full mt-4" onClick={handleDistribute} disabled={availablePool <= 0 || distributeAmount <= 0}>
            Distribute Now
          </button>
        </div>
      </div>

      <h3>History</h3>
      <div className="card">
        {db.dividends.map(div => (
          <div key={div.id} className="mb-4" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <div className="flex justify-between mb-2">
              <span className="font-bold">{div.year} Dividend</span>
              <span className="text-sm text-muted">{new Date(div.date).toLocaleDateString()}</span>
            </div>
            <div className="text-sm">
              Total: ₹{div.totalAmount} | Per Share: ₹{div.perShare.toFixed(2)}
            </div>
          </div>
        ))}
        {db.dividends.length === 0 && <p className="text-muted text-center py-2">No past distributions</p>}
      </div>
    </div>
  );
};

export default Dividends;

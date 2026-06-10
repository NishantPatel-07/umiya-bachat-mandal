import React from 'react';
import { useStore } from '../../store';
import { Users, Landmark, IndianRupee } from 'lucide-react';

const Dashboard = () => {
  const { db } = useStore();

  const totalMembers = db.members.length;
  const totalShares = db.members.reduce((sum, m) => sum + Number(m.shares), 0);
  const totalCorpus = totalShares * Number(db.settings.shareVal);
  const activeLoans = db.loans.filter(l => l.status === 'Active').length;

  return (
    <div>
      <h2 className="mb-4">Dashboard</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <Users size={32} className="text-primary mx-auto mb-2" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
          <h3>{totalMembers}</h3>
          <p className="text-sm text-muted">Total Members</p>
        </div>
        <div className="card text-center">
          <Landmark size={32} className="text-primary mx-auto mb-2" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
          <h3>₹{totalCorpus.toLocaleString('en-IN')}</h3>
          <p className="text-sm text-muted">Total Corpus</p>
        </div>
        <div className="card text-center">
          <IndianRupee size={32} className="text-primary mx-auto mb-2" style={{ display: 'block', margin: '0 auto 0.5rem auto' }} />
          <h3>{totalShares}</h3>
          <p className="text-sm text-muted">Total Shares</p>
        </div>
        <div className="card text-center">
          <h3 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>{activeLoans}</h3>
          <p className="text-sm text-muted">Active Loans</p>
        </div>
      </div>

      <h3 className="mt-8 mb-4">Recent Activity</h3>
      <div className="card">
        {db.activity.length === 0 ? (
          <p className="text-muted text-center py-4">No recent activity</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {db.activity.slice(0, 5).map(act => (
              <li key={act.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <p>{act.msg}</p>
                <span className="text-sm text-muted">{new Date(act.date).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

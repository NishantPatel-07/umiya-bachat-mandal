import React from 'react';
import { useStore } from '../../store';
import { Users, Landmark, IndianRupee, Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const { db } = useStore();

  const totalMembers = db.members.length;
  const totalShares = db.members.reduce((sum, m) => sum + Number(m.shares), 0);
  const totalCorpus = totalShares * Number(db.settings.shareVal);
  const activeLoansCount = db.loans.filter(l => l.status === 'Active').length;
  const repaidLoansCount = db.loans.filter(l => l.status === 'Repaid').length;

  // 1. Gather Collections Data (payments) for the last 6 months
  const getLast6Months = () => {
    const result = [];
    const d = new Date();
    for (let i = 5; i >= 0; i--) {
      const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const monthStr = m.toISOString().slice(0, 7); // "YYYY-MM"
      result.push(monthStr);
    }
    return result;
  };

  const monthsList = getLast6Months();
  const collectionsData = monthsList.map(m => {
    const amount = (db.payments || [])
      .filter(p => p.month === m)
      .reduce((sum, p) => sum + Number(p.amount), 0);
    
    const [year, month] = m.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    const name = dateObj.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return { name, Amount: amount };
  });

  // 2. Loan Status Data for Pie Chart
  const loanData = [
    { name: 'Active Loans', value: activeLoansCount, color: '#b45309' }, // primary amber
    { name: 'Repaid Loans', value: repaidLoansCount, color: '#16a34a' } // success green
  ];

  const hasLoanData = activeLoansCount > 0 || repaidLoansCount > 0;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <h2 className="mb-4">Dashboard Overview</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card text-center" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={28} className="text-primary mb-2" style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0.25rem 0' }}>{totalMembers}</h3>
          <p className="text-sm text-muted" style={{ fontWeight: '500' }}>Total Members</p>
        </div>
        
        <div className="card text-center" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Landmark size={28} className="text-primary mb-2" style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0.25rem 0' }}>₹{totalCorpus.toLocaleString('en-IN')}</h3>
          <p className="text-sm text-muted" style={{ fontWeight: '500' }}>Total Corpus</p>
        </div>
        
        <div className="card text-center" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <IndianRupee size={28} className="text-primary mb-2" style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: '800', margin: '0.25rem 0' }}>{totalShares}</h3>
          <p className="text-sm text-muted" style={{ fontWeight: '500' }}>Total Shares</p>
        </div>
        
        <div className="card text-center" style={{ margin: 0, padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Landmark size={28} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
          <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)', margin: '0.25rem 0' }}>{activeLoansCount}</h3>
          <p className="text-sm text-muted" style={{ fontWeight: '500' }}>Active Loans</p>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        
        {/* Hato Collections Chart */}
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            📈 Monthly Hato Collections (₹)
          </h3>
          <div style={{ width: '100%', height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={collectionsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} 
                  contentStyle={{ background: '#fff', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}
                />
                <Bar dataKey="Amount" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loan Distribution Chart */}
        <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            📊 Loans Status Distribution
          </h3>
          <div style={{ width: '100%', height: '260px', position: 'relative', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {hasLoanData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={loanData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {loanData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Count']} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted text-center">No loans issued yet</p>
            )}
          </div>
        </div>
        
      </div>

      {/* Recent Activity Log */}
      <h3 className="mb-4" style={{ fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity size={20} className="text-primary" /> Recent Activity Log
      </h3>
      <div className="card" style={{ padding: '0.5rem 1.5rem' }}>
        {(!db.activity || db.activity.length === 0) ? (
          <p className="text-muted text-center py-6">No recent activity</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {db.activity.slice(0, 5).map(act => (
              <li key={act.id} style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)' }}>
                <p style={{ fontWeight: '500', marginBottom: '0.25rem', fontSize: '0.95rem' }}>{act.msg}</p>
                <span className="text-sm text-muted">{new Date(act.date).toLocaleString('en-IN')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

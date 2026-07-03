import React from 'react';
import { useStore } from '../store';
import { LayoutDashboard, Users, IndianRupee, Landmark, Coins, FileSpreadsheet, Settings, LogOut, Key } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { logout, isOnline, isSyncing, pendingCount } = useStore();
  const currentHash = window.location.hash || '#/dashboard';

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'members', icon: Users, label: 'Members' },
    { id: 'collections', icon: IndianRupee, label: 'Collect' },
    { id: 'loans', icon: Landmark, label: 'Loans' },
    { id: 'dividends', icon: Coins, label: 'Dividend' },
    { id: 'access', icon: Key, label: 'Access' },
    { id: 'reports', icon: FileSpreadsheet, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div style={{ paddingBottom: '70px' }}>
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1>Admin Panel</h1>
          
          {/* Sync Status Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '600',
            background: isSyncing 
              ? '#fef9c3' 
              : !isOnline 
                ? '#fee2e2' 
                : '#dcfce7',
            color: isSyncing 
              ? '#854d0e' 
              : !isOnline 
                ? '#991b1b' 
                : '#166534',
            border: `1px solid ${
              isSyncing 
                ? '#fde047' 
                : !isOnline 
                  ? '#fecaca' 
                  : '#bbf7d0'
            }`,
            transition: 'all 0.3s ease'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isSyncing 
                ? '#f59e0b' 
                : !isOnline 
                  ? '#dc2626' 
                  : '#16a34a',
              display: 'inline-block'
            }}></span>
            <span>
              {isSyncing ? 'Syncing...' : !isOnline ? `Offline · ${pendingCount} pending` : 'Synced'}
            </span>
          </div>
        </div>
        <button className="btn-secondary" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '36px', padding: '0.4rem 0.8rem' }}>
          <LogOut size={16} /> Logout
        </button>
      </header>

      <main className="container">
        {children}
      </main>

      <nav className="bottom-nav">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentHash.includes(item.id);
          return (
            <a 
              key={item.id} 
              href={`#/${item.id}`} 
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminLayout;

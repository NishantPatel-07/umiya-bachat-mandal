import React from 'react';
import { useStore } from '../store';
import { LayoutDashboard, Users, IndianRupee, Landmark, Coins, FileSpreadsheet, Settings, LogOut } from 'lucide-react';

const AdminLayout = ({ children }) => {
  const { logout } = useStore();
  const currentHash = window.location.hash || '#/dashboard';

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Home' },
    { id: 'members', icon: Users, label: 'Members' },
    { id: 'collections', icon: IndianRupee, label: 'Collect' },
    { id: 'loans', icon: Landmark, label: 'Loans' },
    { id: 'dividends', icon: Coins, label: 'Dividend' },
    { id: 'reports', icon: FileSpreadsheet, label: 'Reports' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div style={{ paddingBottom: '70px' }}>
      <header className="app-header">
        <h1>Admin Panel</h1>
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

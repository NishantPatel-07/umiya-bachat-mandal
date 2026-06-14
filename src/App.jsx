import React from 'react';
import { useStore } from './store';
import Login from './pages/Login';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Members from './pages/admin/Members';
import Collections from './pages/admin/Collections';
import Loans from './pages/admin/Loans';
import Dividends from './pages/admin/Dividends';
import Reports from './pages/admin/Reports';
import Settings from './pages/admin/Settings';

function App() {
  const { currentUser } = useStore();

  if (!currentUser) {
    return <Login />;
  }

  if (currentUser.mode === 'admin') {
    return (
      <AdminLayout>
        {/* Simple custom router based on hash since it's a PWA and HashRouter is safer for offline file:// protocols or static hosting */}
        <HashRouterComponent />
      </AdminLayout>
    );
  }

  return null;
}

// Simple Hash Router for offline compatibility
const HashRouterComponent = () => {
  const [hash, setHash] = React.useState(window.location.hash || '#/dashboard');

  React.useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  switch (hash) {
    case '#/members': return <Members />;
    case '#/collections': return <Collections />;
    case '#/loans': return <Loans />;
    case '#/dividends': return <Dividends />;
    case '#/reports': return <Reports />;
    case '#/settings': return <Settings />;
    case '#/dashboard':
    default:
      return <Dashboard />;
  }
};

export default App;

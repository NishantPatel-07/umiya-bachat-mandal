import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    // Clear all caches and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    // Unregister service workers
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
      });
    }
    // Clear IndexedDB stores
    try {
      indexedDB.deleteDatabase('keyval-store');
    } catch (e) { /* ignore */ }
    
    // Clear session storage
    sessionStorage.clear();
    
    // Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          background: '#f9fafb',
          color: '#1f2937'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Something went wrong</h2>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              The app encountered an unexpected error. This is usually caused by corrupted cached data.
            </p>
            
            <div style={{
              background: '#fee2e2',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              fontSize: '0.8rem',
              color: '#991b1b',
              textAlign: 'left',
              maxHeight: '120px',
              overflow: 'auto',
              wordBreak: 'break-word'
            }}>
              {this.state.error?.message || 'Unknown error'}
            </div>

            <button
              onClick={this.handleReset}
              style={{
                background: '#b45309',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

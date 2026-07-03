import React, { useState } from 'react';
import { useStore } from '../../store';
import { del } from 'idb-keyval';
import { supabase } from '../../lib/supabase';
import { saveAndShareFile } from '../../utils/fileDownloader';

const ChangePasswordForm = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters!");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      setMsg("Password changed successfully!");
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-col gap-4">
      {msg && <div style={{ color: 'var(--success)', background: '#dcfce7', border: '1px solid #bbf7d0', padding: '0.5rem 1rem', borderRadius: '8px' }}>{msg}</div>}
      {error && <div style={{ color: 'var(--danger)', background: '#fee2e2', border: '1px solid #fecaca', padding: '0.5rem 1rem', borderRadius: '8px' }}>{error}</div>}
      <div>
        <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>New Password</label>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
      </div>
      <div>
        <label className="text-sm font-bold mb-2" style={{ display: 'block' }}>Confirm New Password</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
      </div>
      <button type="submit" disabled={loading} style={{ width: '100%' }}>
        {loading ? "Updating..." : "Update Password"}
      </button>
    </form>
  );
};

const Settings = () => {
  const { db, updateDb, addActivity } = useStore();
  const [settings, setSettings] = useState(db.settings);

  const handleSave = (e) => {
    e.preventDefault();
    updateDb({ settings });
    addActivity('Updated society settings');
    alert('Settings saved successfully!');
  };

  const handleExport = async () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' });
    await saveAndShareFile(blob, 'umiya_backup.json');
  };

  return (
    <div>
      <h2>Settings</h2>
      
      <div className="card mb-4">
        <form onSubmit={handleSave} className="flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold mb-2">Share Value (₹)</label>
              <input type="number" value={settings.shareVal} onChange={e => setSettings({...settings, shareVal: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-bold mb-2">Monthly Fee/Share (₹)</label>
              <input type="number" value={settings.monthly} onChange={e => setSettings({...settings, monthly: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-bold mb-2">Joining Fee/Share (₹)</label>
              <input type="number" value={settings.joining} onChange={e => setSettings({...settings, joining: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-bold mb-2">Default Interest (%)</label>
              <input type="number" step="0.1" value={settings.interest} onChange={e => setSettings({...settings, interest: e.target.value})} />
            </div>
            <div>
              <label className="text-sm font-bold mb-2">Collection Day</label>
              <input type="number" min="1" max="28" value={settings.day} onChange={e => setSettings({...settings, day: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="w-full mt-4">Save Settings</button>
        </form>
      </div>

      <div className="card mb-4">
        <h3 className="mb-4">Change Admin Password</h3>
        <ChangePasswordForm />
      </div>

      <div className="card">
        <h3 className="mb-4">Data Management</h3>
        <div className="flex flex-col gap-4">
          <button className="btn-secondary" onClick={handleExport}>
            Export Backup (JSON)
          </button>
          <button className="btn-danger" onClick={async () => {
            if(window.confirm('Are you sure you want to clear ALL data? This cannot be undone!')) {
               await del('umiya_db');
               window.location.reload();
            }
          }}>
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;

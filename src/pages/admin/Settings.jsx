import React, { useState } from 'react';
import { useStore } from '../../store';
import { del } from 'idb-keyval';

const Settings = () => {
  const { db, updateDb, addActivity } = useStore();
  const [settings, setSettings] = useState(db.settings);

  const handleSave = (e) => {
    e.preventDefault();
    updateDb({ settings });
    addActivity('Updated society settings');
    alert('Settings saved successfully!');
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "umiya_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
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
            <div>
              <label className="text-sm font-bold mb-2">Admin PIN</label>
              <input type="text" value={settings.adminPin} onChange={e => setSettings({...settings, adminPin: e.target.value})} />
            </div>
          </div>
          <button type="submit" className="w-full mt-4">Save Settings</button>
        </form>
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

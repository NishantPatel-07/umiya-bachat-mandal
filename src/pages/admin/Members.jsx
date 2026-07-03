import React, { useState } from 'react';
import { useStore } from '../../store';
import { Edit2, Trash2 } from 'lucide-react'; // Using lucide-react which is in dependencies

const Members = () => {
  const { db, updateDb, addActivity } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [num, setNum] = useState('');
  const [phone, setPhone] = useState('');
  const [shares, setShares] = useState('');
  const [address, setAddress] = useState('');
  
  const resetForm = () => {
    setName(''); setNum(''); setPhone(''); setShares(''); setAddress('');
    setEditId(null);
    setShowAddForm(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    if (editId) {
      const updatedMembers = db.members.map(m => 
        m.id === editId 
          ? { ...m, name, num: parseInt(num), phone, shares: parseInt(shares), address }
          : m
      );
      updateDb({ members: updatedMembers });
      addActivity(`Updated member: ${name} (${num})`);
    } else {
      const newMember = {
        id: Date.now(),
        name,
        num: parseInt(num),
        phone,
        shares: parseInt(shares),
        address,
        date: new Date().toISOString(),
        joiningPaid: true // Default to paid upon creation for simplicity
      };
      updateDb({ members: [...db.members, newMember] });
      addActivity(`Added new member: ${name} (${num})`);
    }
    
    resetForm();
  };

  const handleEditClick = (m) => {
    setEditId(m.id);
    setName(m.name);
    setNum(m.num);
    setPhone(m.phone);
    setShares(m.shares);
    setAddress(m.address || '');
    setShowAddForm(true);
  };

  const handleRemove = (id, name) => {
    if (window.confirm(`Are you sure you want to remove ${name}? Ensure they have no active loans or pending collections before removing.`)) {
      updateDb({ members: db.members.filter(m => m.id !== id) });
      addActivity(`Removed member: ${name}`);
    }
  };

  const sortedMembers = [...db.members].sort((a, b) => a.num - b.num);
  const filteredMembers = sortedMembers.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.num.toString().includes(searchQuery) ||
    (m.phone && m.phone.includes(searchQuery))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Members</h2>
        <button onClick={() => {
          if (showAddForm) resetForm();
          else setShowAddForm(true);
        }}>
          {showAddForm ? 'Cancel' : '+ Add Member'}
        </button>
      </div>

      {showAddForm && (
        <div className="card mb-4">
          <h3 className="mb-4">{editId ? 'Edit Member' : 'New Member'}</h3>
          <form onSubmit={handleSave} className="flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold mb-2">Member Name</label>
                <input required value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-bold mb-2">Member Number</label>
                <input type="number" required value={num} onChange={e => setNum(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-bold mb-2">Phone (10 digits)</label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} />
              </div>
              <div>
                <label className="text-sm font-bold mb-2">Shares</label>
                <input type="number" required min="1" value={shares} onChange={e => setShares(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold mb-2">Address</label>
              <textarea value={address} onChange={e => setAddress(e.target.value)}></textarea>
            </div>
            <button type="submit" className="w-full">{editId ? 'Update Member' : 'Save Member'}</button>
          </form>
        </div>
      )}

      {/* Search & Filter */}
      <div className="card mb-4" style={{ padding: '1rem' }}>
        <input
          type="text"
          placeholder="Search members by name, number, or phone..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ width: '100%', margin: 0 }}
        />
      </div>

      <div className="table-container card">
        <table>
          <thead>
            <tr>
              <th>No.</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Shares</th>
              <th>Value</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map(m => (
              <tr key={m.id}>
                <td>{m.num}</td>
                <td className="font-bold">{m.name}</td>
                <td>{m.phone}</td>
                <td>{m.shares}</td>
                <td>₹{(m.shares * db.settings.shareVal).toLocaleString('en-IN')}</td>
                <td>
                  <div className="flex justify-end gap-2">
                    <button 
                      className="btn-secondary flex items-center justify-center p-2" 
                      onClick={() => handleEditClick(m)}
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-danger flex items-center justify-center p-2" 
                      onClick={() => handleRemove(m.id, m.name)}
                      title="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 && (
              <tr><td colSpan="6" className="text-center">No members found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Members;

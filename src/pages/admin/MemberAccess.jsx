import React, { useState } from 'react';
import { useStore } from '../../store';
import { supabase } from '../../lib/supabase';
import { createClient } from '@supabase/supabase-js';

const MemberAccess = () => {
  const { db, updateDb, addActivity } = useStore();
  const [loadingMemberId, setLoadingMemberId] = useState(null);
  const [pins, setPins] = useState({}); // { memberId: '1234' }
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handlePinChange = (memberId, val) => {
    setPins(prev => ({
      ...prev,
      [memberId]: val.replace(/\D/g, '').slice(0, 4)
    }));
  };

  const setupAccess = async (member) => {
    const pin = pins[member.id] || '';
    if (pin.length !== 4) {
      setErrorMsg(`Please enter a 4-digit PIN for ${member.name}`);
      return;
    }

    setLoadingMemberId(member.id);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Create a temporary client that doesn't persist session to avoid logging out the Admin
      const tempClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        }
      );

      const email = `umiyamember${member.num}@gmail.com`;

      // 2. Sign up the user
      const { data: signUpData, error: signUpError } = await tempClient.auth.signUp({
        email,
        password: pin + '_umiya',
        options: {
          data: {
            role: 'member',
            memberId: member.id,
            memberNum: member.num
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!signUpData.user) {
        throw new Error("Failed to create auth user.");
      }

      // 3. Create the member_access entry via our main authenticated client
      const newAccess = {
        id: `ma_${member.id}`,
        memberId: member.id,
        supabaseUid: signUpData.user.id,
        memberNum: member.num,
        lastLogin: null
      };

      const updatedMemberAccess = [...(db.memberAccess || []), newAccess];
      
      // Update local and push to Supabase
      await updateDb({ memberAccess: updatedMemberAccess });
      addActivity(`Created login access for Member #${member.num} (${member.name})`);

      setSuccessMsg(`Login access set up successfully for ${member.name}!`);
      setPins(prev => ({ ...prev, [member.id]: '' }));
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to setup access.');
    } finally {
      setLoadingMemberId(null);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2>Member Portal Access</h2>
      </div>

      <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
        Configure credentials so members can log in on their own devices to view their savings, active loans, and payment history.
      </p>

      {successMsg && (
        <div style={{ color: 'var(--success)', background: '#dcfce7', border: '1px solid #bbf7d0', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '500' }}>
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ color: 'var(--danger)', background: '#fee2e2', border: '1px solid #fecaca', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: '500' }}>
          {errorMsg}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>No.</th>
                <th>Member Name</th>
                <th>Status</th>
                <th style={{ width: '280px' }}>Action / PIN Configuration</th>
              </tr>
            </thead>
            <tbody>
              {db.members.map(member => {
                const hasAccess = (db.memberAccess || []).some(ma => ma.memberId === member.id);
                return (
                  <tr key={member.id}>
                    <td className="font-bold">#{member.num}</td>
                    <td>
                      <div>{member.name}</div>
                      <div className="text-muted text-sm">{member.phone || 'No phone number'}</div>
                    </td>
                    <td>
                      {hasAccess ? (
                        <span className="badge badge-success">Login Active</span>
                      ) : (
                        <span className="badge badge-warning">No Access</span>
                      )}
                    </td>
                    <td>
                      {hasAccess ? (
                        <div className="text-muted text-sm font-bold">
                          Email: umiyamember{member.num}@gmail.com
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center">
                          <input
                            type="password"
                            placeholder="Set 4-digit PIN"
                            value={pins[member.id] || ''}
                            onChange={(e) => handlePinChange(member.id, e.target.value)}
                            disabled={loadingMemberId === member.id}
                            style={{
                              maxWidth: '130px',
                              minHeight: '36px',
                              padding: '0.4rem',
                              fontSize: '0.85rem'
                            }}
                          />
                          <button
                            onClick={() => setupAccess(member)}
                            disabled={loadingMemberId !== null}
                            style={{
                              fontSize: '0.85rem',
                              padding: '0.4rem 0.8rem',
                              minHeight: '36px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {loadingMemberId === member.id ? 'Creating...' : 'Grant Access'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MemberAccess;

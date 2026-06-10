import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { initialMembers } from './data/initialMembers';

const StoreContext = createContext();

const defaultState = {
  members: [], // {id, name, num, phone, shares, date, joiningPaid}
  memberAccess: [], // {memberId, phone, pin, fcmToken, lastLogin}
  loans: [], // {id, memberId, amount, rate, duration, type: 'FLAT_EMI'|'INTEREST_ONLY', status, guarantors[], emi, principalPaid, interestPaid}
  payments: [], // {id, memberId, month, amount, date}
  repayments: [], // {id, loanId, month (YYYY-MM), date, amount, principal, interest}
  dividends: [], // {id, year, date, totalAmount, perShare, totalShares, members[]}
  notifications: [], // {id, memberId, type, message, date, read}
  settings: {
    shareVal: 500,
    joining: 100,
    monthly: 500,
    interest: 1.5,
    day: 15,
    adminPin: '1234'
  },
  preferences: {
    downloadLocationHandle: null,
    autoSaveReports: false
  },
  activity: [] // {id, msg, date}
};

export const StoreProvider = ({ children }) => {
  const [db, setDb] = useState(defaultState);
  const [currentUser, setCurrentUser] = useState(null); // { mode: 'admin'|'member', data: {} }

  // Load from Preferences (IndexedDB)
  useEffect(() => {
    const loadDb = async () => {
      const value = await get('umiya_db');
      if (value) {
        try {
          const parsed = JSON.parse(value);
          // Seed members if array is empty
          if (!parsed.members || parsed.members.length === 0) {
            parsed.members = initialMembers;
            set('umiya_db', JSON.stringify({ ...defaultState, ...parsed }));
          }
          // Clean up corrupt loans (e.g. memberId is null or NaN)
          if (parsed.loans) {
            parsed.loans = parsed.loans.filter(l => l.memberId && !Number.isNaN(l.memberId));
          }
          setDb({ ...defaultState, ...parsed });
        } catch (e) {
          console.error("Failed to parse preferences", e);
        }
      } else {
        // Initialize fresh DB with members
        const initDb = { ...defaultState, members: initialMembers };
        setDb(initDb);
        set('umiya_db', JSON.stringify(initDb));
      }
    };
    loadDb();
    
    const session = sessionStorage.getItem('umiya_session');
    if (session) {
      setCurrentUser(JSON.parse(session));
    }
  }, []);

  // Save to Preferences whenever DB changes
  useEffect(() => {
    set('umiya_db', JSON.stringify(db));
  }, [db]);

  const updateDb = (partialDb) => {
    setDb(prev => {
      const newDb = { ...prev, ...partialDb };
      return newDb;
    });
  };

  const addActivity = (msg) => {
    const newActivity = { id: Date.now(), msg, date: new Date().toISOString() };
    setDb(prev => ({
      ...prev,
      activity: [newActivity, ...prev.activity].slice(0, 50) // Keep last 50
    }));
  };

  const login = (mode, data) => {
    const session = { mode, data };
    setCurrentUser(session);
    sessionStorage.setItem('umiya_session', JSON.stringify(session));
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('umiya_session');
  };

  // Broadcast Channel for Notifications (Same Device)
  useEffect(() => {
    const channel = new BroadcastChannel('umiya_notifications');
    channel.onmessage = async (event) => {
      if (event.data.type === 'REFRESH_DB') {
        const value = await get('umiya_db');
        if (value) {
          setDb({ ...defaultState, ...JSON.parse(value) });
        }
      }
    };
    return () => channel.close();
  }, []);

  const triggerLocalSync = () => {
    const channel = new BroadcastChannel('umiya_notifications');
    channel.postMessage({ type: 'REFRESH_DB' });
    channel.close();
  };

  return (
    <StoreContext.Provider value={{ db, updateDb, addActivity, currentUser, login, logout, triggerLocalSync }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);

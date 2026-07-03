import React, { createContext, useContext, useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';
import { initialMembers } from './data/initialMembers';
import { supabase } from './lib/supabase';
import { pullAllFromCloud, pushRecordToCloud, deleteRecordFromCloud } from './lib/cloudSync';
import { enqueue, processQueue, getQueueLength } from './lib/offlineQueue';

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
    day: 15
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Update offline write queue length
  const updatePendingCount = async () => {
    const len = await getQueueLength();
    setPendingCount(len);
  };

  // Load from Preferences (IndexedDB) and then Sync with Supabase
  useEffect(() => {
    const loadDb = async () => {
      // 1. Read IndexedDB -> Set state immediately so the app is instantly usable
      const value = await get('umiya_db');
      let localDb = defaultState;
      if (value) {
        try {
          localDb = JSON.parse(value);
          // Seed members locally if empty
          if (!localDb.members || localDb.members.length === 0) {
            localDb.members = initialMembers;
            set('umiya_db', JSON.stringify({ ...defaultState, ...localDb }));
          }
          if (localDb.loans) {
            localDb.loans = localDb.loans.filter(l => l.memberId && !Number.isNaN(l.memberId));
          }
          setDb({ ...defaultState, ...localDb });
        } catch (e) {
          console.error("Failed to parse preferences", e);
        }
      } else {
        const initDb = { ...defaultState, members: initialMembers };
        localDb = initDb;
        setDb(initDb);
        set('umiya_db', JSON.stringify(initDb));
      }

      await updatePendingCount();

      // 2. Check Supabase auth session (wrapped in try-catch to prevent crash if Supabase is unreachable)
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn("Supabase session error (app will work offline):", sessionError.message);
        } else if (session) {
          const role = session.user.user_metadata?.role || 'admin'; // default to admin
          if (role === 'admin') {
            login('admin', session.user);
          } else if (role === 'member') {
            const memberId = session.user.user_metadata?.memberId;
            const member = localDb.members.find(m => m.id === memberId);
            login('member', member || { id: memberId });
          }

          // 3. If authenticated + online, pull all from cloud and sync
          if (navigator.onLine) {
            try {
              setIsSyncing(true);
              const cloudDb = await pullAllFromCloud();
              // Merge settings, activity and all arrays
              setDb(prev => {
                const merged = { ...prev, ...cloudDb };
                set('umiya_db', JSON.stringify(merged));
                return merged;
              });
            } catch (e) {
              console.error("Failed to sync from cloud on initial load:", e);
            } finally {
              setIsSyncing(false);
            }
          }
        }
      } catch (e) {
        console.error("Supabase auth check failed (app will work offline):", e);
      }
    };

    loadDb();

    // Setup auth session change listener (wrapped in try-catch to prevent crash)
    let subscription = null;
    try {
      const result = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          const role = session.user.user_metadata?.role || 'admin';
          if (role === 'admin') {
            login('admin', session.user);
          } else if (role === 'member') {
            // Try to fetch latest members to find matching member
            const value = await get('umiya_db');
            const localDb = value ? JSON.parse(value) : defaultState;
            const memberId = session.user.user_metadata?.memberId;
            const member = localDb.members?.find(m => m.id === memberId);
            login('member', member || { id: memberId });
          }
        } else {
          // DO NOT call logout() here — it calls supabase.auth.signOut() which
          // triggers _removeSession → _notifyAllSubscribers → onAuthStateChange
          // again with session=null, creating an infinite loop that times out.
          // Instead, just clear local state directly.
          setCurrentUser(null);
          sessionStorage.removeItem('umiya_session');
        }
      });
      subscription = result?.data?.subscription;
    } catch (e) {
      console.error("Failed to set up auth listener:", e);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  // Save to Preferences whenever DB changes locally
  useEffect(() => {
    set('umiya_db', JSON.stringify(db));
  }, [db]);

  // Online / Offline Listeners
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      
      // Process offline queue first
      await processQueue();
      await updatePendingCount();

      // Pull latest from cloud
      try {
        const cloudDb = await pullAllFromCloud();
        updateDb(cloudDb, { sync: false });
      } catch (e) {
        console.error("Failed to pull from cloud on reconnect", e);
      }
      
      setIsSyncing(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [db]);

  const updateDb = async (partialDb, { sync = true } = {}) => {
    let prevDb = db;
    setDb(prev => {
      prevDb = prev;
      return { ...prev, ...partialDb };
    });

    if (!sync) return;

    // Diff and push changes to cloud
    const tablesToSync = ['members', 'loans', 'payments', 'repayments', 'dividends', 'settings', 'activity'];
    
    for (const table of tablesToSync) {
      if (partialDb[table] !== undefined) {
        const prevArray = prevDb[table];
        const newArray = partialDb[table];

        // settings is a single object, not an array
        if (table === 'settings') {
          if (isOnline) {
            try {
              await pushRecordToCloud('settings', newArray);
            } catch (e) {
              await enqueue('settings', newArray, 'upsert');
            }
          } else {
            await enqueue('settings', newArray, 'upsert');
          }
          continue;
        }

        // Find added/updated records
        const addedOrUpdated = (newArray || []).filter(newRecord => {
          const prevRecord = (prevArray || []).find(r => r.id === newRecord.id);
          if (!prevRecord) return true; // Added
          return JSON.stringify(prevRecord) !== JSON.stringify(newRecord); // Updated
        });

        // Find deleted records
        const deleted = (prevArray || []).filter(prevRecord => {
          return !(newArray || []).some(r => r.id === prevRecord.id);
        });

        // Push / Enqueue upserts
        for (const record of addedOrUpdated) {
          if (isOnline) {
            try {
              await pushRecordToCloud(table, record);
            } catch (e) {
              await enqueue(table, record, 'upsert');
            }
          } else {
            await enqueue(table, record, 'upsert');
          }
        }

        // Push / Enqueue deletes
        for (const record of deleted) {
          if (isOnline) {
            try {
              await deleteRecordFromCloud(table, record.id);
            } catch (e) {
              await enqueue(table, record, 'delete');
            }
          } else {
            await enqueue(table, record, 'delete');
          }
        }
      }
    }

    await updatePendingCount();
  };

  const addActivity = (msg) => {
    const newActivity = { id: `act_${Date.now()}`, msg, date: new Date().toISOString() };
    updateDb({
      activity: [newActivity, ...(db.activity || [])].slice(0, 50) // Keep last 50
    });
  };

  const login = (mode, data) => {
    const session = { mode, data };
    setCurrentUser(session);
    sessionStorage.setItem('umiya_session', JSON.stringify(session));
  };

  const logout = async () => {
    setCurrentUser(null);
    sessionStorage.removeItem('umiya_session');
    await supabase.auth.signOut();
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
    <StoreContext.Provider value={{ 
      db, 
      updateDb, 
      addActivity, 
      currentUser, 
      login, 
      logout, 
      triggerLocalSync,
      isOnline,
      isSyncing,
      pendingCount
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);

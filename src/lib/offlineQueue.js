import { get, set } from 'idb-keyval';
import { pushRecordToCloud } from './cloudSync';

export const getQueue = async () => {
  const queue = await get('sync_queue');
  return queue ? JSON.parse(queue) : [];
};

export const saveQueue = async (queue) => {
  await set('sync_queue', JSON.stringify(queue));
};

export const enqueue = async (table, record, operation = 'upsert') => {
  const queue = await getQueue();
  // Deduplication: If the same record (table, record.id) is enqueued, remove the old one first.
  const filtered = queue.filter(item => !(item.table === table && item.record.id === record.id));
  const newEntry = {
    id: `${table}_${record.id}_${Date.now()}`,
    table,
    record,
    operation,
    enqueuedAt: new Date().toISOString()
  };
  filtered.push(newEntry);
  await saveQueue(filtered);
};

export const removeFromQueue = async (id) => {
  const queue = await getQueue();
  const filtered = queue.filter(item => item.id !== id);
  await saveQueue(filtered);
};

export const processQueue = async () => {
  const queue = await getQueue();
  for (const entry of queue) {
    try {
      await pushRecordToCloud(entry.table, entry.record);
      await removeFromQueue(entry.id);
    } catch (e) {
      console.error("Failed to sync queue entry", entry, e);
      break; // Stop on first failure, retry next time
    }
  }
};

export const getQueueLength = async () => {
  const queue = await getQueue();
  return queue.length;
};

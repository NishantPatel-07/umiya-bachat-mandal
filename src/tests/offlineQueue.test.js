import { describe, it, expect, vi, beforeEach } from 'vitest'
import { enqueue, getQueue, processQueue } from '../lib/offlineQueue'
import { get, set } from 'idb-keyval'
import { pushRecordToCloud } from '../lib/cloudSync'

// Mock idb-keyval
vi.mock('idb-keyval', () => {
  let store = {}
  return {
    get: vi.fn(async (key) => store[key] || null),
    set: vi.fn(async (key, value) => { store[key] = value })
  }
})

// Mock cloudSync
vi.mock('../lib/cloudSync', () => {
  return {
    pushRecordToCloud: vi.fn(async () => {})
  }
})

describe('offlineQueue deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deduplicates multiple offline edits of the same record', async () => {
    // Enqueue first edit
    await enqueue('members', { id: 'm1', name: 'Original Name' })
    // Enqueue second edit for same record
    await enqueue('members', { id: 'm1', name: 'Updated Name' })

    const queue = await getQueue()
    expect(queue.length).toBe(1)
    expect(queue[0].record.name).toBe('Updated Name')
  })

  it('processes the queue in order and pushes to cloudSync', async () => {
    await enqueue('members', { id: 'm1', name: 'Member 1' })
    await enqueue('loans', { id: 'l1', amount: 50000 })

    await processQueue()

    expect(pushRecordToCloud).toHaveBeenCalledTimes(2)
    const queue = await getQueue()
    expect(queue.length).toBe(0) // successfully emptied
  })
})

import { supabase } from './supabase'

const camelToSnakeMaps = {
  members: {
    id: 'id',
    num: 'num',
    name: 'name',
    phone: 'phone',
    shares: 'shares',
    address: 'address',
    joiningPaid: 'joining_paid',
    date: 'joined_date',
    updatedAt: 'updated_at'
  },
  loans: {
    id: 'id',
    memberId: 'member_id',
    amount: 'amount',
    rate: 'rate',
    duration: 'duration',
    type: 'type',
    status: 'status',
    emi: 'emi',
    principalPaid: 'principal_paid',
    interestPaid: 'interest_paid',
    guarantors: 'guarantors',
    updatedAt: 'updated_at'
  },
  payments: {
    id: 'id',
    memberId: 'member_id',
    month: 'month',
    amount: 'amount',
    date: 'paid_date',
    updatedAt: 'updated_at'
  },
  repayments: {
    id: 'id',
    loanId: 'loan_id',
    month: 'month',
    date: 'paid_date',
    amount: 'amount',
    principal: 'principal',
    interest: 'interest',
    updatedAt: 'updated_at'
  },
  dividends: {
    id: 'id',
    year: 'year',
    date: 'declared_date',
    totalAmount: 'total_amount',
    perShare: 'per_share',
    totalShares: 'total_shares',
    members: 'members_snapshot',
    updatedAt: 'updated_at'
  },
  settings: {
    id: 'id',
    shareVal: 'share_val',
    joining: 'joining_fee',
    monthly: 'monthly_fee',
    interest: 'interest_rate',
    day: 'collection_day',
    updatedAt: 'updated_at'
  },
  activity: {
    id: 'id',
    msg: 'msg',
    date: 'created_at'
  }
}

// Helper to create reverse maps
const snakeToCamelMaps = {}
for (const [table, map] of Object.entries(camelToSnakeMaps)) {
  snakeToCamelMaps[table] = {}
  for (const [camel, snake] of Object.entries(map)) {
    snakeToCamelMaps[table][snake] = camel
  }
}

export const toSnake = (table, record) => {
  const map = camelToSnakeMaps[table]
  if (!map) return record
  const result = {}
  for (const [key, value] of Object.entries(record)) {
    const dbKey = map[key] || key
    result[dbKey] = value
  }
  return result
}

export const toCamel = (table, record) => {
  const map = snakeToCamelMaps[table]
  if (!map) return record
  const result = {}
  for (const [key, value] of Object.entries(record)) {
    const appKey = map[key] || key
    result[appKey] = value
  }
  return result
}

export const pullAllFromCloud = async () => {
  const tables = ['members', 'loans', 'payments', 'repayments', 'dividends', 'settings', 'activity']
  const results = {}

  for (const table of tables) {
    const dbTable = table === 'activity' ? 'activity_log' : table
    const { data, error } = await supabase.from(dbTable).select('*')
    if (error) {
      console.error(`Error pulling from ${dbTable}:`, error)
      throw error
    }

    if (table === 'settings') {
      results[table] = data && data.length > 0 ? toCamel('settings', data[0]) : null
    } else {
      results[table] = (data || []).map(row => toCamel(table, row))
    }
  }
  return results
}

export const pushRecordToCloud = async (table, record) => {
  const dbTable = table === 'activity' ? 'activity_log' : table
  const dbRecord = toSnake(table, record)

  // Settings is unique, always 1 row
  if (table === 'settings') {
    dbRecord.id = 1
  }

  const { error } = await supabase.from(dbTable).upsert(dbRecord)
  if (error) {
    console.error(`Error upserting to ${dbTable}:`, error)
    throw error
  }
}

export const pushBulkToCloud = async (table, records) => {
  const dbTable = table === 'activity' ? 'activity_log' : table
  const dbRecords = records.map(r => toSnake(table, r))

  const { error } = await supabase.from(dbTable).upsert(dbRecords)
  if (error) {
    console.error(`Error bulk upserting to ${dbTable}:`, error)
    throw error
  }
}

export const deleteRecordFromCloud = async (table, id) => {
  const dbTable = table === 'activity' ? 'activity_log' : table
  const { error } = await supabase.from(dbTable).delete().eq('id', id)
  if (error) {
    console.error(`Error deleting from ${dbTable}:`, error)
    throw error
  }
}


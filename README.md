# શ્રી ઉમિયા બચત મંડળ — Umiya Bachat Mandal

A local-first, offline-capable financial ledger and management platform for a community savings society (Bachat Mandal). 

Built with **React**, **Capacitor (Android Wrapper)**, and **Supabase (PostgreSQL)**.

---

## 📖 Problem Statement
Traditional community savings societies (Bachat Mandals) rely heavily on manual paper registers, excel spreadsheets, or local-only apps that risk data loss, synchronization discrepancies, and lack accessibility for members. 
This application provides a **local-first, fully synchronized web and mobile solution** that enables administrators to manage members, collections, and loans seamlessly—even in areas with spotty network coverage.

---

## 🏛️ System Architecture

```
                 +-----------------------------------+
                 |           React App UI            |
                 |      (Capacitor Web View)         |
                 +-----------------------------------+
                                   │
                                   ▼
                 +-----------------------------------+
                 |            store.jsx              |
                 |  (Single state source of truth)   |
                 +-----------------------------------+
                                  / \
                                 /   \
                                /     \
                               ▼       ▼
             +--------------------+ +-------------------------------+
             |     IndexedDB      | |           Supabase            |
             |   (idb-keyval)     | |         (PostgreSQL)          |
             |                    | |                               |
             |  - cached database | |  - Users (Auth)               |
             |  - sync write queue| |  - Normalized tables & RLS    |
             +--------------------+ +-------------------------------+
```

### Sync Pipeline & Write Flow:
1. **Instant Write**: UI updates and saves changes to IndexedDB immediately. The user gets instant feedback with zero loading spinners.
2. **Background Sync**: If the device is online, the change is pushed to Supabase in the background.
3. **Offline Queueing**: If the device is offline, changes are enqueued in IndexedDB's `sync_queue`. The queue automatically deduplicates multiple rapid edits to the same record (only the last state is kept).
4. **Automatic Reconnection Drain**: As soon as the browser triggers an `online` event, the queue is drained sequentially and updates are pushed to Supabase.

---

## 🗄️ Database Design (ERD)

The database schema is fully normalized into relational tables, protected by **Row-Level Security (RLS)**:

```
members (1) ──────────< (N) loans (1) ──────────< (N) repayments
members (1) ──────────< (N) payments
members (1) ──────────o (1) member_access
```

* **`members`**: Unique member records (num, name, shares, etc.).
* **`loans`**: Active and repaid loan transactions. Supported types: `FLAT_EMI` and `INTEREST_ONLY` (with check constraints).
* **`payments`**: Monthly member savings contributions (Hato).
* **`repayments`**: Repayments tracked against specific loans.
* **`member_access`**: Links Supabase authenticated users (`auth.users`) to member profiles for secure personal dashboard access.
* **`settings`**: Unified system variables (fees, default interest rate).
* **`activity_log`**: Audit trail of administrative actions.

---

## ✨ Features & Highlights

* **🧮 Interactive Standalone Loan Calculator**: Compare Flat Rate EMI vs Interest-Only schedules side-by-side, complete with full amortization schedules.
* **📈 Visual Analytics Dashboard**: View corpus, shares, active loans, and dynamic bar/pie charts representing collections and loan statuses.
* **🔍 Live Member Directory Search**: Fast, filterable list of members sorted by number.
* **📅 Historical Month Picker & Export**: Select any past period and export complete financial ledgers in Gujarati format to Excel or PDF.
* **🔒 Dual Role Authentication**:
  * **Admins**: Secure login to access the full administrative panel, record repayments, and configure system properties.
  * **Members**: Dedicated, read-only personal dashboard to monitor savings, check outstanding loans, and review repayment histories.

---

## 🛠️ Setup Instructions

### Prerequisites
* Node.js (v18+)
* Supabase Account

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd "umiya bachat mandal"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Run the database migrations:
   * Copy the contents of `supabase/schema.sql` and run it in the **Supabase SQL Editor**.
   * Copy the contents of `supabase/seed.sql` and run it in the **Supabase SQL Editor** to populate seed members.
5. Create an Admin User in your Supabase **Authentication** panel, then run the metadata script to assign their role:
   ```sql
   update auth.users
   set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
   where email = 'your-admin-email@example.com';
   ```
6. Start the local development server:
   ```bash
   npm run dev
   ```
7. To execute unit tests:
   ```bash
   npm run test
   ```

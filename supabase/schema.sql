-- MEMBERS
create table members (
  id text primary key,
  num integer unique not null,
  name text not null,
  phone text,
  shares integer not null default 1,
  address text,
  joining_paid boolean default true,
  joined_date timestamptz default now(),
  updated_at timestamptz default now()
);

-- LOANS
create table loans (
  id text primary key,
  member_id text references members(id) on delete restrict,
  amount numeric not null,
  rate numeric not null,
  duration integer,
  type text check (type in ('FLAT_EMI','INTEREST_ONLY')),
  status text default 'Active',
  emi numeric,
  principal_paid numeric default 0,
  interest_paid numeric default 0,
  guarantors jsonb default '[]',
  updated_at timestamptz default now()
);

-- PAYMENTS (monthly share collections)
create table payments (
  id text primary key,
  member_id text references members(id) on delete restrict,
  month text not null,
  amount numeric not null,
  paid_date timestamptz default now(),
  updated_at timestamptz default now()
);

-- REPAYMENTS (loan EMI collections)
create table repayments (
  id text primary key,
  loan_id text references loans(id) on delete restrict,
  month text not null,
  paid_date timestamptz default now(),
  amount numeric,
  principal numeric,
  interest numeric,
  updated_at timestamptz default now()
);

-- DIVIDENDS
create table dividends (
  id text primary key,
  year integer,
  declared_date timestamptz,
  total_amount numeric,
  per_share numeric,
  total_shares integer,
  members_snapshot jsonb default '[]',
  updated_at timestamptz default now()
);

-- SETTINGS (always 1 row, id=1)
create table settings (
  id integer primary key default 1,
  share_val numeric default 500,
  joining_fee numeric default 100,
  monthly_fee numeric default 500,
  interest_rate numeric default 1.5,
  collection_day integer default 15,
  updated_at timestamptz default now()
);

-- ACTIVITY LOG
create table activity_log (
  id text primary key,
  msg text,
  created_at timestamptz default now()
);

-- MEMBER ACCESS (links Supabase Auth users to app members)
create table member_access (
  id text primary key,
  member_id text references members(id) unique,
  supabase_uid uuid,       -- links to auth.users
  member_num integer,
  fcm_token text,          -- for push notifications (Phase 3)
  last_login timestamptz,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY (authenticated users only)
alter table members enable row level security;
alter table loans enable row level security;
alter table payments enable row level security;
alter table repayments enable row level security;
alter table dividends enable row level security;
alter table settings enable row level security;
alter table activity_log enable row level security;
alter table member_access enable row level security;

create policy "auth_only" on members for all using (auth.role() = 'authenticated');
create policy "auth_only" on loans for all using (auth.role() = 'authenticated');
create policy "auth_only" on payments for all using (auth.role() = 'authenticated');
create policy "auth_only" on repayments for all using (auth.role() = 'authenticated');
create policy "auth_only" on dividends for all using (auth.role() = 'authenticated');
create policy "auth_only" on settings for all using (auth.role() = 'authenticated');
create policy "auth_only" on activity_log for all using (auth.role() = 'authenticated');
create policy "auth_only" on member_access for all using (auth.role() = 'authenticated');

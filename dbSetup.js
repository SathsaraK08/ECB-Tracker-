const { Client } = require('pg');

const connectionString = 'postgresql://postgres:qrY4Q7Q8;30m@db.erzytvyabehmhafsmymz.supabase.co:5432/postgres';

const ddl = `
-- 1. Create Entries Table
create table if not exists public.entries (
  id bigint primary key,
  date text not null,
  time text not null,
  unit numeric not null,
  note text,
  appliances text[] default '{}',
  "imgName" text,
  "imgUrl" text,
  "imgData" text,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Payments Table
create table if not exists public.payments (
  id bigint primary key,
  month text not null,
  "lastUnits" numeric,
  "billAmount" numeric,
  "paidAmount" numeric,
  paid boolean default false,
  bank text,
  "payeeName" text,
  "payeeAccount" text,
  note text,
  user_id uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (month, user_id)
);

-- 3. Create Settings Table
create table if not exists public.settings (
  id integer not null,
  "accountNumber" text,
  "ownerName" text,
  "lkrPerUnit" numeric default 30,
  user_id uuid references auth.users not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (id, user_id)
);

-- 4. Enable Row Level Security (RLS)
alter table public.entries enable row level security;
alter table public.payments enable row level security;
alter table public.settings enable row level security;

-- 5. Create secure RLS policies matching the authenticated user's ID
-- Entries
drop policy if exists "Users can only view their own entries" on public.entries;
create policy "Users can only view their own entries" on public.entries for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own entries" on public.entries;
create policy "Users can insert their own entries" on public.entries for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own entries" on public.entries;
create policy "Users can update their own entries" on public.entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own entries" on public.entries;
create policy "Users can delete their own entries" on public.entries for delete using (auth.uid() = user_id);

-- Payments
drop policy if exists "Users can only view their own payments" on public.payments;
create policy "Users can only view their own payments" on public.payments for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own payments" on public.payments;
create policy "Users can insert their own payments" on public.payments for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own payments" on public.payments;
create policy "Users can update their own payments" on public.payments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own payments" on public.payments;
create policy "Users can delete their own payments" on public.payments for delete using (auth.uid() = user_id);

-- Settings
drop policy if exists "Users can only view their own settings" on public.settings;
create policy "Users can only view their own settings" on public.settings for select using (auth.uid() = user_id);
drop policy if exists "Users can insert their own settings" on public.settings;
create policy "Users can insert their own settings" on public.settings for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update their own settings" on public.settings;
create policy "Users can update their own settings" on public.settings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete their own settings" on public.settings;
create policy "Users can delete their own settings" on public.settings for delete using (auth.uid() = user_id);
`;

async function run() {
  const client = new Client({ connectionString });
  try {
    console.log("Connecting to Supabase...");
    await client.connect();
    console.log("Connected! Applying schema and policies...");
    await client.query(ddl);
    console.log("Database successfully migrated!");
  } catch (err) {
    console.error("Error running migration:", err);
  } finally {
    await client.end();
  }
}

run();

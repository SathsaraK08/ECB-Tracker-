const { Client } = require('pg');

const connectionString = 'postgresql://postgres:qrY4Q7Q8;30m@db.erzytvyabehmhafsmymz.supabase.co:5432/postgres';

const ddl = `
-- 1. Create Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text not null,
  username text,
  mobile text,
  account_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- 3. Create secure RLS policies matching the authenticated user's ID
drop policy if exists "Users can only view their own profile" on public.profiles;
create policy "Users can only view their own profile" on public.profiles for select using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
`;

async function run() {
  const client = new Client({ connectionString });
  try {
    console.log("Connecting to Supabase...");
    await client.connect();
    console.log("Connected! Applying profile schema and policies...");
    await client.query(ddl);
    console.log("Database successfully migrated for Profiles!");
  } catch (err) {
    console.error("Error running migration:", err);
  } finally {
    await client.end();
  }
}

run();

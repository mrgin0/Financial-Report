-- ═══════════════════════════════════════════════════════════════
-- Tabel tambahan yang dibutuhkan aplikasi Lap. Keuangan Pribadi
-- Jalankan di Supabase SQL Editor. Aman dijalankan ulang (IF NOT EXISTS).
-- ═══════════════════════════════════════════════════════════════

-- PEMASUKAN
create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  source text, category text, description text,
  method text, amount numeric default 0, note text,
  created_at timestamptz default now()
);

-- PENGELUARAN
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  category text, description text,
  method text, amount numeric default 0, note text,
  created_at timestamptz default now()
);

-- HUTANG
create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text, purpose text,
  amount numeric default 0, paid numeric default 0,
  due_date date, status text, payment_via text,
  fund_to text,   -- Current Asset tujuan dana masuk saat hutang dibuat
  note text,
  created_at timestamptz default now()
);

-- RIWAYAT PEMBAYARAN HUTANG
create table if not exists debt_payments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid references debts(id) on delete cascade,
  amount numeric, paid_date date, via text,
  paid_total numeric, sisa numeric,
  created_at timestamptz default now()
);

-- KOLOM NOTE TAMBAHAN DI TABEL MASTER DATA (sudah ada tabelnya, tinggal tambah kolom)
alter table current_assets add column if not exists note text;
alter table accounts_receivable add column if not exists note text;
alter table inventory add column if not exists note text;
alter table property_plant_equipment add column if not exists note text;
alter table intangible_assets add column if not exists note text;
alter table investments add column if not exists note text;

-- ROW LEVEL SECURITY — samakan dengan tabel lain yang sudah jalan (akses anon key)
alter table income enable row level security;
alter table expenses enable row level security;
alter table debts enable row level security;
alter table debt_payments enable row level security;

create policy if not exists "anon all" on income for all using (true) with check (true);
create policy if not exists "anon all" on expenses for all using (true) with check (true);
create policy if not exists "anon all" on debts for all using (true) with check (true);
create policy if not exists "anon all" on debt_payments for all using (true) with check (true);

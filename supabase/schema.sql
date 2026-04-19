-- ============================================================
-- TURNFLOW - Schema completo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Habilitar extensión UUID
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLA: profiles (extiende auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'advisor' check (role in ('superadmin', 'brand_admin', 'advisor')),
  brand_id uuid,
  establishment_id uuid,
  created_at timestamptz default now() not null
);

-- ============================================================
-- TABLA: brands
-- ============================================================
create table public.brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  logo_url text,
  active boolean default true not null,
  created_at timestamptz default now() not null
);

-- FK profile → brand
alter table public.profiles
  add constraint profiles_brand_id_fkey
  foreign key (brand_id) references public.brands(id) on delete set null;

-- ============================================================
-- TABLA: establishments
-- ============================================================
create table public.establishments (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  slug text not null unique,
  address text,
  active boolean default true not null,
  created_at timestamptz default now() not null
);

-- FK profile → establishment
alter table public.profiles
  add constraint profiles_establishment_id_fkey
  foreign key (establishment_id) references public.establishments(id) on delete set null;

-- ============================================================
-- TABLA: visit_reasons
-- ============================================================
create table public.visit_reasons (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid not null references public.brands(id) on delete cascade,
  name text not null,
  description text,
  sort_order int default 0 not null,
  active boolean default true not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- TABLA: promotions
-- ============================================================
create table public.promotions (
  id uuid default gen_random_uuid() primary key,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  title text not null,
  description text,
  image_url text,
  active boolean default true not null,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz default now() not null
);

-- ============================================================
-- TABLA: advisor_fields (campos personalizados para el asesor)
-- ============================================================
create table public.advisor_fields (
  id uuid default gen_random_uuid() primary key,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  label text not null,
  field_type text not null default 'text' check (field_type in ('text', 'number', 'select', 'date', 'textarea')),
  options jsonb,
  required boolean default false not null,
  sort_order int default 0 not null,
  active boolean default true not null,
  created_at timestamptz default now() not null
);

-- ============================================================
-- TABLA: tickets (la cola de clientes)
-- ============================================================
create table public.tickets (
  id uuid default gen_random_uuid() primary key,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  visit_reason_id uuid references public.visit_reasons(id) on delete set null,
  queue_number text not null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  marketing_opt_in boolean default false not null,
  push_subscription jsonb,
  status text not null default 'waiting' check (status in ('waiting', 'in_progress', 'done', 'cancelled')),
  advisor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null,
  attended_at timestamptz,
  completed_at timestamptz
);

-- Índices para performance
create index tickets_establishment_status_idx on public.tickets(establishment_id, status);
create index tickets_created_at_idx on public.tickets(created_at);

-- ============================================================
-- TABLA: attentions (registro de atenciones completadas)
-- ============================================================
create table public.attentions (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  advisor_id uuid not null references public.profiles(id) on delete restrict,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  fields_data jsonb default '{}'::jsonb not null,
  notes text,
  created_at timestamptz default now() not null,
  completed_at timestamptz
);

-- ============================================================
-- FUNCIÓN: auto-crear profile al registrar usuario
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'advisor')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FUNCIÓN: obtener número de turno del día
-- ============================================================
create or replace function public.get_next_queue_number(p_establishment_id uuid)
returns text as $$
declare
  v_count int;
begin
  select count(*) + 1
  into v_count
  from public.tickets
  where establishment_id = p_establishment_id
    and created_at::date = current_date;
  return lpad(v_count::text, 3, '0');
end;
$$ language plpgsql security definer;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.establishments enable row level security;
alter table public.visit_reasons enable row level security;
alter table public.promotions enable row level security;
alter table public.advisor_fields enable row level security;
alter table public.tickets enable row level security;
alter table public.attentions enable row level security;

-- HELPER: obtener role del usuario actual
create or replace function public.get_my_role()
returns text as $$
  select role from public.profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function public.get_my_brand_id()
returns uuid as $$
  select brand_id from public.profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function public.get_my_establishment_id()
returns uuid as $$
  select establishment_id from public.profiles where id = auth.uid();
$$ language sql security definer stable;

-- ---- profiles ----
create policy "profiles: own" on public.profiles
  for select using (id = auth.uid() or get_my_role() = 'superadmin');

create policy "profiles: superadmin manage" on public.profiles
  for all using (get_my_role() = 'superadmin');

create policy "profiles: brand_admin view own brand" on public.profiles
  for select using (
    get_my_role() = 'brand_admin' and brand_id = get_my_brand_id()
  );

-- ---- brands ----
create policy "brands: superadmin all" on public.brands
  for all using (get_my_role() = 'superadmin');

create policy "brands: brand_admin read own" on public.brands
  for select using (
    get_my_role() in ('brand_admin', 'advisor') and id = get_my_brand_id()
  );

-- ---- establishments ----
create policy "establishments: public read active" on public.establishments
  for select using (active = true);

create policy "establishments: superadmin all" on public.establishments
  for all using (get_my_role() = 'superadmin');

create policy "establishments: brand_admin manage own" on public.establishments
  for all using (
    get_my_role() = 'brand_admin' and brand_id = get_my_brand_id()
  );

create policy "establishments: advisor read own" on public.establishments
  for select using (
    get_my_role() = 'advisor' and id = get_my_establishment_id()
  );

-- ---- visit_reasons ----
create policy "visit_reasons: public read active" on public.visit_reasons
  for select using (active = true);

create policy "visit_reasons: admin manage" on public.visit_reasons
  for all using (
    get_my_role() in ('superadmin', 'brand_admin')
  );

-- ---- promotions ----
create policy "promotions: public read active" on public.promotions
  for select using (
    active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

create policy "promotions: admin manage" on public.promotions
  for all using (get_my_role() in ('superadmin', 'brand_admin'));

-- ---- advisor_fields ----
create policy "advisor_fields: authenticated read" on public.advisor_fields
  for select using (auth.uid() is not null and active = true);

create policy "advisor_fields: admin manage" on public.advisor_fields
  for all using (get_my_role() in ('superadmin', 'brand_admin'));

-- ---- tickets ----
-- Clientes pueden insertar (sin auth)
create policy "tickets: public insert" on public.tickets
  for insert with check (true);

-- Clientes pueden leer su propio ticket por ID (para la pantalla de confirmación)
create policy "tickets: public read own" on public.tickets
  for select using (true);

-- Asesores pueden ver y actualizar tickets de su establecimiento
create policy "tickets: advisor manage own establishment" on public.tickets
  for all using (
    auth.uid() is not null
    and establishment_id = get_my_establishment_id()
  );

create policy "tickets: brand_admin manage own brand" on public.tickets
  for all using (
    get_my_role() = 'brand_admin'
    and establishment_id in (
      select id from public.establishments where brand_id = get_my_brand_id()
    )
  );

create policy "tickets: superadmin all" on public.tickets
  for all using (get_my_role() = 'superadmin');

-- ---- attentions ----
create policy "attentions: advisor manage own" on public.attentions
  for all using (
    auth.uid() is not null
    and establishment_id = get_my_establishment_id()
  );

create policy "attentions: brand_admin read" on public.attentions
  for select using (
    get_my_role() = 'brand_admin'
    and establishment_id in (
      select id from public.establishments where brand_id = get_my_brand_id()
    )
  );

create policy "attentions: superadmin all" on public.attentions
  for all using (get_my_role() = 'superadmin');

-- ============================================================
-- DATOS INICIALES: superadmin
-- (Crear el usuario primero en Auth, luego ejecutar esto)
-- Reemplazar el UUID con el ID real del usuario superadmin
-- ============================================================
-- UPDATE public.profiles SET role = 'superadmin' WHERE email = 'tu@email.com';

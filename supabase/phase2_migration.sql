-- DATA CONSENTS (GDPR/authorization records)
create table if not exists public.data_consents (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.tickets(id) on delete set null,
  establishment_id uuid references public.establishments(id) on delete cascade,
  brand_id uuid references public.brands(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  marketing_opt_in boolean default false not null,
  data_processing_consent boolean default true not null,
  consent_text text not null,
  ip_address text,
  consented_at timestamptz default now() not null
);
alter table public.data_consents enable row level security;
create policy "data_consents: admin read" on public.data_consents
  for select using (get_my_role() in ('superadmin', 'brand_admin', 'manager'));
create policy "data_consents: public insert" on public.data_consents
  for insert with check (true);

-- SURVEY TEMPLATES
create table if not exists public.survey_templates (
  id uuid default gen_random_uuid() primary key,
  brand_id uuid references public.brands(id) on delete cascade,
  name text not null,
  questions jsonb not null default '[]',
  active boolean default true not null,
  created_at timestamptz default now() not null
);
alter table public.survey_templates enable row level security;
create policy "survey_templates: admin all" on public.survey_templates
  for all using (get_my_role() in ('superadmin', 'brand_admin', 'manager'));
create policy "survey_templates: public read active" on public.survey_templates
  for select using (active = true);

-- SURVEY RESPONSES
create table if not exists public.survey_responses (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references public.tickets(id) on delete set null,
  template_id uuid references public.survey_templates(id) on delete set null,
  establishment_id uuid references public.establishments(id) on delete cascade,
  responses jsonb not null default '{}',
  created_at timestamptz default now() not null
);
alter table public.survey_responses enable row level security;
create policy "survey_responses: admin read" on public.survey_responses
  for select using (get_my_role() in ('superadmin', 'brand_admin', 'manager', 'reporting'));
create policy "survey_responses: public insert" on public.survey_responses
  for insert with check (true);

-- DISPLAY CONFIGS (TV screen per establishment)
create table if not exists public.display_configs (
  id uuid default gen_random_uuid() primary key,
  establishment_id uuid references public.establishments(id) on delete cascade unique,
  bg_color text default '#1e1b4b',
  accent_color text default '#6366f1',
  show_waiting_list boolean default true,
  show_promotions boolean default true,
  show_clock boolean default true,
  custom_message text,
  updated_at timestamptz default now() not null
);
alter table public.display_configs enable row level security;
create policy "display_configs: admin all" on public.display_configs
  for all using (get_my_role() in ('superadmin', 'brand_admin', 'manager'));
create policy "display_configs: public read" on public.display_configs
  for select using (true);

-- APPOINTMENTS
create table if not exists public.appointments (
  id uuid default gen_random_uuid() primary key,
  establishment_id uuid references public.establishments(id) on delete cascade,
  visit_reason_id uuid references public.visit_reasons(id) on delete set null,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  scheduled_at timestamptz not null,
  duration_minutes int default 30 not null,
  status text default 'pending' check (status in ('pending','confirmed','attended','cancelled','no_show')),
  notes text,
  advisor_id uuid references public.profiles(id) on delete set null,
  ticket_id uuid references public.tickets(id) on delete set null,
  created_at timestamptz default now() not null
);
alter table public.appointments enable row level security;
create policy "appointments: admin all" on public.appointments
  for all using (get_my_role() in ('superadmin', 'brand_admin', 'manager', 'advisor'));
create policy "appointments: public insert" on public.appointments
  for insert with check (true);
create policy "appointments: public read own" on public.appointments
  for select using (true);

-- AVAILABILITY SLOTS
create table if not exists public.availability_slots (
  id uuid default gen_random_uuid() primary key,
  establishment_id uuid references public.establishments(id) on delete cascade,
  day_of_week int check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_duration_minutes int default 30,
  max_concurrent int default 1,
  active boolean default true
);
alter table public.availability_slots enable row level security;
create policy "availability_slots: admin all" on public.availability_slots
  for all using (get_my_role() in ('superadmin', 'brand_admin', 'manager'));
create policy "availability_slots: public read" on public.availability_slots
  for select using (active = true);

-- MENUS
create table if not exists public.menus (
  id uuid default gen_random_uuid() primary key,
  establishment_id uuid references public.establishments(id) on delete cascade,
  name text not null,
  active boolean default true,
  created_at timestamptz default now()
);
create table if not exists public.menu_categories (
  id uuid default gen_random_uuid() primary key,
  menu_id uuid references public.menus(id) on delete cascade,
  name text not null,
  sort_order int default 0
);
create table if not exists public.menu_items (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references public.menu_categories(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2),
  image_url text,
  available boolean default true,
  sort_order int default 0
);
create table if not exists public.pre_orders (
  id uuid default gen_random_uuid() primary key,
  establishment_id uuid references public.establishments(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  ticket_id uuid references public.tickets(id) on delete set null,
  items jsonb not null default '[]',
  total numeric(10,2),
  notes text,
  status text default 'pending' check (status in ('pending','received','preparing','ready','delivered')),
  created_at timestamptz default now()
);
alter table public.menus enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.pre_orders enable row level security;
create policy "menus: admin all" on public.menus for all using (get_my_role() in ('superadmin','brand_admin','manager'));
create policy "menus: public read" on public.menus for select using (active = true);
create policy "menu_categories: admin all" on public.menu_categories for all using (get_my_role() in ('superadmin','brand_admin','manager'));
create policy "menu_categories: public read" on public.menu_categories for select using (true);
create policy "menu_items: admin all" on public.menu_items for all using (get_my_role() in ('superadmin','brand_admin','manager'));
create policy "menu_items: public read" on public.menu_items for select using (available = true);
create policy "pre_orders: admin all" on public.pre_orders for all using (get_my_role() in ('superadmin','brand_admin','manager','advisor'));
create policy "pre_orders: public insert" on public.pre_orders for insert with check (true);

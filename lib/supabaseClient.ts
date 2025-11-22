
import { createClient } from '@supabase/supabase-js';

// Helper para obtener variables de entorno de manera segura (Soporte para Vite y standard process.env)
const getEnv = (key: string, viteKey: string) => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    // @ts-ignore
    return import.meta.env[viteKey];
  }
  return '';
};

const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
const supabaseKey = getEnv('SUPABASE_KEY', 'VITE_SUPABASE_KEY');

if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase URL o Key no encontradas. Asegúrate de configurar las variables de entorno (SUPABASE_URL, SUPABASE_KEY o VITE_SUPABASE_URL, VITE_SUPABASE_KEY).');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder-project.supabase.co', 
    supabaseKey || 'placeholder-key'
);

// Instrucciones para el usuario:
// 1. Crea un proyecto en Supabase.
// 2. Ve al editor SQL y ejecuta el siguiente script para crear las tablas necesarias:
/*
-- Tablas Principales
create table users (
  id text primary key,
  name text,
  email text,
  password text,
  role text
);

create table projects (
  id text primary key,
  name text,
  pin text,
  owner_id text references users(id)
);

-- Tablas de Datos del Proyecto
create table materials (
  id text primary key,
  project_id text references projects(id) on delete cascade,
  name text,
  description text,
  quantity numeric,
  unit text,
  unit_cost numeric,
  critical_stock_level numeric,
  location text
);

create table material_orders (
  id text primary key,
  project_id text references projects(id) on delete cascade,
  material_id text, 
  quantity numeric,
  order_date text,
  status text
);

create table workers (
  id text primary key,
  project_id text references projects(id) on delete cascade,
  name text,
  role text,
  hourly_rate numeric
);

create table tasks (
  id text primary key,
  project_id text references projects(id) on delete cascade,
  name text,
  description text,
  assigned_worker_id text,
  start_date text,
  end_date text,
  status text,
  completion_date text,
  total_volume numeric,
  completed_volume numeric,
  volume_unit text,
  photo_ids text[],
  depends_on text[],
  total_value numeric
);

create table time_logs (
  id text primary key,
  project_id text references projects(id) on delete cascade,
  task_id text,
  worker_id text,
  hours numeric,
  date text
);

create table budget_categories (
  id text primary key,
  project_id text references projects(id) on delete cascade,
  name text,
  allocated numeric
);

create table expenses (
  id text primary key,
  project_id text references projects(id) on delete cascade,
  description text,
  amount numeric,
  category_id text,
  date text
);

create table photos (
  id text primary key,
  project_id text references projects(id) on delete cascade,
  url text,
  description text,
  tags text[],
  upload_date text
);

create table clients (
  id text primary key,
  project_id text references projects(id) on delete cascade,
  name text,
  type text,
  status text,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  address text,
  notes text
);

create table interactions (
  id text primary key,
  project_id text references projects(id) on delete cascade,
  client_id text,
  date text,
  type text,
  summary text,
  follow_up_date text
);
*/

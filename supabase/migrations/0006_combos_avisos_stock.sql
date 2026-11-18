-- Combos y promos, stock mínimo por producto y avisos al celular del personal.

-- Un combo es un producto (familia "Combos y promos", por unidad) que lista sus componentes:
-- [{"codigo":"QCR","cantidad":0.5}, {"codigo":"C20","cantidad":2}]  (kg para quesos, unidades para el resto)
-- Su stock sale de los componentes y al venderlo se descuentan ellos.
alter table public.productos add column if not exists componentes jsonb;
-- Debajo de este stock aparece el aviso de stock bajo (vacío = 10 kg o 12 unidades).
alter table public.productos add column if not exists stock_minimo numeric(12,2);

-- Celulares y computadoras del personal que activaron los avisos.
create table if not exists public.avisos_push (
  endpoint text primary key,
  usuario uuid not null references public.profiles(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  creado timestamptz not null default now()
);
alter table public.avisos_push enable row level security;

-- Datos internos del servidor (claves de los avisos). Nadie los lee desde el navegador.
create table if not exists public.ajustes_servidor (
  clave text primary key,
  valor text not null,
  creado timestamptz not null default now()
);
alter table public.ajustes_servidor enable row level security;

revoke all on public.avisos_push, public.ajustes_servidor from anon, authenticated;
grant all on public.avisos_push, public.ajustes_servidor to service_role;

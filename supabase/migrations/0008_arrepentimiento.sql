-- Botón de arrepentimiento (Res. 424/2020): pedidos de cancelación que hacen los clientes desde la web.
create table if not exists public.arrepentimientos (
  id bigint generated always as identity primary key,
  tramite text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  pedido bigint references public.pedidos(id) on delete set null,
  nombre text not null,
  contacto text not null,
  motivo text,
  estado text not null default 'Pendiente' check (estado in ('Pendiente', 'Resuelto')),
  creado timestamptz not null default now()
);
alter table public.arrepentimientos enable row level security;
create policy "arrepentimientos personal" on public.arrepentimientos for select using ((select privado.es_staff()));
create policy "arrepentimientos personal resuelve" on public.arrepentimientos for update using ((select privado.es_staff()));
-- Se cargan solo desde el servidor (api/arrepentimiento), con la clave de servicio.
revoke all on public.arrepentimientos from anon, authenticated;
grant select, update on public.arrepentimientos to authenticated;
grant all on public.arrepentimientos to service_role;

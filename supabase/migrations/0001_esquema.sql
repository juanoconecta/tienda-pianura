-- Tienda Pianura · esquema inicial (fase 1)
-- Productos, perfiles y roles, pedidos, configuración, cupones, zonas de envío,
-- días sin entrega y solicitudes mayoristas. Todo con RLS.

create extension if not exists pgcrypto;

-- ---------- Perfiles y roles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  nombre text,
  telefono text,
  direccion text,
  localidad text,
  cuit text,
  razon_social text,
  -- cliente: minorista · mayorista: ve la lista mayorista · el resto es personal de Pianura
  rol text not null default 'cliente' check (rol in ('cliente','mayorista','dueno','admin','ventas','expedicion')),
  limite_credito numeric(14,2) not null default 0,
  saldo numeric(14,2) not null default 0,
  puntos integer not null default 0,
  creado timestamptz not null default now()
);

create or replace function public.mi_rol() returns text
language sql stable security definer set search_path = public as $$
  select rol from public.profiles where id = auth.uid()
$$;

create or replace function public.es_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() in ('dueno','admin','ventas','expedicion'), false)
$$;

create or replace function public.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.mi_rol() in ('dueno','admin'), false)
$$;

-- ---------- Configuración (una sola fila) ----------
create table public.config (
  id int primary key default 1 check (id = 1),
  -- mails que al entrar por primera vez quedan como dueño
  mails_dueno text[] not null default '{}',
  banco_alias text not null default '',
  banco_cbu text not null default '',
  banco_titular text not null default '',
  banco_cuit text not null default '',
  banco_nombre text not null default '',
  whatsapp text not null default '',
  minimo_mayorista numeric(14,2) not null default 250000,
  descuento_volumen_kg numeric(10,2) not null default 50,
  descuento_volumen_pct numeric(5,2) not null default 5,
  envio_gratis_desde numeric(14,2) not null default 40000,
  cierre_dia int not null default 4,          -- 4 = jueves
  cierre_hora text not null default '10:30',
  entrega_dia int not null default 5,         -- 5 = viernes
  lista_nombre text not null default 'Lista de precios · Octubre 2026',
  actualizado timestamptz not null default now()
);
insert into public.config (id) values (1);

-- Al registrarse alguien, se crea su perfil. Si su mail está en config.mails_dueno queda como dueño;
-- si tiene una solicitud mayorista aprobada, como mayorista.
create or replace function public.nuevo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
declare r text := 'cliente';
begin
  if exists (select 1 from public.config where lower(new.email) = any (select lower(unnest(mails_dueno)))) then
    r := 'dueno';
  elsif exists (select 1 from public.solicitudes_mayoristas s where lower(s.email) = lower(new.email) and s.estado = 'Aprobada') then
    r := 'mayorista';
  end if;
  insert into public.profiles (id, email, rol) values (new.id, new.email, r)
  on conflict (id) do nothing;
  return new;
end $$;

-- Nadie puede cambiarse el rol, el crédito o el saldo a sí mismo: solo dueño o admin.
create or replace function public.proteger_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.es_admin() and auth.uid() is not null then
    new.rol := old.rol;
    new.limite_credito := old.limite_credito;
    new.saldo := old.saldo;
    new.puntos := old.puntos;
    new.email := old.email;
  end if;
  return new;
end $$;
create trigger proteger_perfil before update on public.profiles
  for each row execute function public.proteger_perfil();

-- ---------- Productos ----------
create table public.productos (
  codigo text primary key,
  nombre text not null,
  familia text not null,
  unidad text not null check (unidad in ('kg','u')),
  orden int not null default 0,
  color text not null default '#FF8200',
  imagen text not null default '',
  descripcion text not null default '',
  -- Mayorista: precio neto (sin IVA) por kg o unidad; se vende de a "paso" (kg de la horma o unidades de la caja)
  precio_mayorista numeric(14,2) not null default 0,
  paso_mayorista numeric(10,2) not null default 1,
  envase_mayorista text not null default '',
  -- Minorista: precios finales con IVA
  precio_kg numeric(14,2),
  precio_medio numeric(14,2),
  precio_cuarto numeric(14,2),
  precio_horma numeric(14,2),
  kg_horma numeric(10,2),
  etiqueta_horma text not null default 'Horma entera',
  precio_unidad numeric(14,2),
  stock numeric(12,2) not null default 0,
  publicado boolean not null default true,
  actualizado timestamptz not null default now()
);

-- ---------- Zonas de envío y días sin entrega ----------
create table public.zonas_envio (
  id bigint generated always as identity primary key,
  localidad text not null unique,
  costo numeric(14,2) not null default 0,
  activa boolean not null default true
);

create table public.dias_sin_entrega (
  fecha date primary key,
  motivo text not null default 'Feriado',
  fecha_alternativa date
);

-- ---------- Cupones ----------
create table public.cupones (
  codigo text primary key,
  porcentaje numeric(5,2),             -- 10 = 10 %
  envio_gratis boolean not null default false,
  solo text check (solo in ('min','may')),
  tope_usos int not null default 0,     -- 0 = sin tope
  usos int not null default 0,
  vence date,
  activo boolean not null default true
);

-- ---------- Solicitudes mayoristas ----------
create table public.solicitudes_mayoristas (
  id bigint generated always as identity primary key,
  razon_social text not null,
  cuit text not null,
  rubro text,
  localidad text,
  contacto text,
  whatsapp text,
  email text not null,
  compra_estimada text,
  pide_cuenta_corriente boolean not null default false,
  estado text not null default 'Pendiente' check (estado in ('Pendiente','Aprobada','Rechazada')),
  creado timestamptz not null default now()
);

-- Al aprobar una solicitud, si la persona ya tiene usuario, pasa a mayorista.
create or replace function public.aprobar_mayorista() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.estado = 'Aprobada' and old.estado is distinct from 'Aprobada' then
    update public.profiles set rol = 'mayorista', razon_social = new.razon_social, cuit = new.cuit
      where lower(email) = lower(new.email) and rol = 'cliente';
  end if;
  return new;
end $$;
create trigger aprobar_mayorista after update on public.solicitudes_mayoristas
  for each row execute function public.aprobar_mayorista();

-- El trigger de nuevo usuario se crea después de solicitudes_mayoristas porque la consulta la usa.
create trigger nuevo_usuario after insert on auth.users
  for each row execute function public.nuevo_usuario();

-- ---------- Pedidos ----------
create table public.pedidos (
  id bigint generated always as identity (start with 5001) primary key,
  codigo uuid not null unique default gen_random_uuid(),   -- para ver el pedido sin iniciar sesión
  usuario uuid references auth.users(id) on delete set null,
  modo text not null check (modo in ('min','may')),
  canal text not null default 'Web',
  cliente jsonb not null default '{}',       -- nombre, telefono, email, direccion, localidad
  items jsonb not null default '[]',         -- [{clave, codigo, nombre, detalle, cantidad, precio, kg, subtotal}]
  subtotal numeric(14,2) not null,
  descuento numeric(14,2) not null default 0,
  cupon text,
  iva numeric(14,2) not null default 0,
  envio numeric(14,2) not null default 0,
  total numeric(14,2) not null,
  entrega text not null check (entrega in ('retiro','envio','reparto')),
  fecha_entrega date,
  medio_pago text not null check (medio_pago in ('mp','transferencia','cuenta')),
  estado_pago text not null default 'pendiente' check (estado_pago in ('pendiente','pagado')),
  estado text not null default 'Nuevo' check (estado in ('Nuevo','Confirmado','Armando','En camino','Entregado','Cancelado')),
  comprobante text,
  mp_preferencia text,
  mp_pago text,
  notas text,
  creado timestamptz not null default now(),
  actualizado timestamptz not null default now()
);
create index pedidos_creado on public.pedidos (creado desc);
create index pedidos_usuario on public.pedidos (usuario);

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.config enable row level security;
alter table public.productos enable row level security;
alter table public.zonas_envio enable row level security;
alter table public.dias_sin_entrega enable row level security;
alter table public.cupones enable row level security;
alter table public.solicitudes_mayoristas enable row level security;
alter table public.pedidos enable row level security;

create policy "perfil propio o personal" on public.profiles for select
  using (id = auth.uid() or public.es_staff());
create policy "editar perfil propio o admin" on public.profiles for update
  using (id = auth.uid() or public.es_admin());

create policy "config visible" on public.config for select using (true);
create policy "config admin" on public.config for update using (public.es_admin());

create policy "productos publicados" on public.productos for select
  using (publicado or public.es_staff());
create policy "productos admin alta" on public.productos for insert with check (public.es_admin());
create policy "productos admin cambios" on public.productos for update using (public.es_admin());
create policy "productos admin baja" on public.productos for delete using (public.es_admin());

create policy "zonas visibles" on public.zonas_envio for select using (true);
create policy "zonas admin" on public.zonas_envio for all using (public.es_admin()) with check (public.es_admin());

create policy "dias visibles" on public.dias_sin_entrega for select using (true);
create policy "dias admin" on public.dias_sin_entrega for all using (public.es_admin()) with check (public.es_admin());

-- Los cupones los valida el servidor; el público no los puede listar.
create policy "cupones admin" on public.cupones for all using (public.es_admin()) with check (public.es_admin());

create policy "pedir cuenta mayorista" on public.solicitudes_mayoristas for insert with check (estado = 'Pendiente');
create policy "solicitudes personal" on public.solicitudes_mayoristas for select using (public.es_staff());
create policy "solicitudes admin" on public.solicitudes_mayoristas for update using (public.es_admin());

-- Los pedidos se crean desde el servidor (que recalcula los precios), nunca directo desde el navegador.
create policy "mis pedidos o personal" on public.pedidos for select
  using (usuario = auth.uid() or public.es_staff());
create policy "personal actualiza pedidos" on public.pedidos for update using (public.es_staff());

-- ---------- Tiempo real para el panel ----------
alter publication supabase_realtime add table public.pedidos;
alter publication supabase_realtime add table public.solicitudes_mayoristas;

-- ---------- Comprobantes de transferencia (privados) ----------
insert into storage.buckets (id, name, public) values ('comprobantes', 'comprobantes', false)
  on conflict (id) do nothing;
create policy "personal ve comprobantes" on storage.objects for select
  using (bucket_id = 'comprobantes' and public.es_staff());

-- ---------- Funciones que usa el servidor al confirmar un pedido ----------
-- Solo las puede llamar el servidor (service_role), no el navegador.
create or replace function public.descontar_stock(p_codigo text, p_cantidad numeric) returns void
language sql set search_path = public as $$
  update public.productos set stock = greatest(0, stock - p_cantidad), actualizado = now() where codigo = p_codigo
$$;
create or replace function public.usar_cupon(p_codigo text) returns void
language sql set search_path = public as $$
  update public.cupones set usos = usos + 1 where codigo = p_codigo
$$;
create or replace function public.cargar_cuenta(p_usuario uuid, p_monto numeric) returns void
language sql set search_path = public as $$
  update public.profiles set saldo = saldo + p_monto where id = p_usuario
$$;
revoke execute on function public.descontar_stock(text, numeric), public.usar_cupon(text), public.cargar_cuenta(uuid, numeric) from public, anon, authenticated;
grant execute on function public.descontar_stock(text, numeric), public.usar_cupon(text), public.cargar_cuenta(uuid, numeric) to service_role;

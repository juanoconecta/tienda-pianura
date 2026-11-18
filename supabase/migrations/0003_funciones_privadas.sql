-- Las funciones de permisos y de triggers no tienen que poder llamarse desde la API (/rest/v1/rpc).
-- Se mueven a un esquema "privado" que la API no expone. Las políticas siguen funcionando igual.
create schema if not exists privado;
grant usage on schema privado to anon, authenticated, service_role;

alter function public.mi_rol() set schema privado;
alter function public.es_staff() set schema privado;
alter function public.es_admin() set schema privado;
alter function public.nuevo_usuario() set schema privado;
alter function public.proteger_perfil() set schema privado;
alter function public.aprobar_mayorista() set schema privado;

create or replace function privado.es_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(privado.mi_rol() in ('dueno','admin','ventas','expedicion'), false)
$$;
create or replace function privado.es_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(privado.mi_rol() in ('dueno','admin'), false)
$$;
create or replace function privado.proteger_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not privado.es_admin() and auth.uid() is not null then
    new.rol := old.rol;
    new.limite_credito := old.limite_credito;
    new.saldo := old.saldo;
    new.puntos := old.puntos;
    new.email := old.email;
  end if;
  return new;
end $$;

-- Las de permisos las usan las políticas: las puede ejecutar quien navega, pero no por la API.
revoke execute on function privado.nuevo_usuario(), privado.proteger_perfil(), privado.aprobar_mayorista() from public, anon, authenticated;
grant execute on function privado.mi_rol(), privado.es_staff(), privado.es_admin() to anon, authenticated, service_role;

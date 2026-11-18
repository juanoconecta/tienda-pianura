-- Permisos de tabla para la API de Supabase. Este proyecto no da permisos automáticos a las tablas nuevas,
-- así que se otorgan acá. Las políticas RLS siguen decidiendo qué filas ve y cambia cada usuario.
grant usage on schema public to anon, authenticated, service_role;

-- Config: todos leen las reglas y los datos bancarios, pero no los mails de dueño.
grant select (id, banco_alias, banco_cbu, banco_titular, banco_cuit, banco_nombre, whatsapp, minimo_mayorista,
  descuento_volumen_kg, descuento_volumen_pct, envio_gratis_desde, cierre_dia, cierre_hora, entrega_dia, lista_nombre, actualizado)
  on public.config to anon, authenticated;
grant update on public.config to authenticated;

grant select on public.productos, public.zonas_envio, public.dias_sin_entrega to anon, authenticated;
grant insert, update, delete on public.productos, public.zonas_envio, public.dias_sin_entrega to authenticated;

grant insert on public.solicitudes_mayoristas to anon, authenticated;
grant select, update on public.solicitudes_mayoristas to authenticated;

grant select, update on public.profiles to authenticated;
grant select, update on public.pedidos to authenticated;
grant select, insert, update, delete on public.cupones to authenticated;

-- El servidor (clave secreta) puede todo.
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

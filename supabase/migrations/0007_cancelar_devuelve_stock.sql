-- Al cancelar un pedido se devuelve el stock, se libera el uso del cupón y se descuenta
-- de la cuenta corriente. Si se lo vuelve a activar, se descuenta todo de nuevo.

-- Lo que el pedido sacó del stock por producto real: {"QCR": 0.75, "C20": 2}.
-- Se guarda al crear el pedido para que cambiar un combo después no altere la devolución.
alter table public.pedidos add column if not exists stock_usado jsonb;

-- Para pedidos viejos sin stock_usado: se calcula desde los items (combos con sus componentes actuales).
create or replace function privado.consumo_pedido(p public.pedidos) returns jsonb
language sql stable set search_path = public as $$
  select coalesce(p.stock_usado, (
    select coalesce(jsonb_object_agg(codigo, cant), '{}'::jsonb) from (
      select x.codigo, sum(x.cant) as cant from (
        select coalesce(c->>'codigo', i->>'codigo') as codigo,
               case when c is not null then (c->>'cantidad')::numeric * (i->>'cantidad')::numeric
                    else coalesce(nullif((i->>'kg')::numeric, 0), (i->>'cantidad')::numeric) end as cant
        from jsonb_array_elements(p.items) i
        left join public.productos pr on pr.codigo = i->>'codigo'
        left join lateral jsonb_array_elements(case when jsonb_typeof(pr.componentes) = 'array' and jsonb_array_length(pr.componentes) > 0 then pr.componentes else null end) c on true
      ) x group by x.codigo
    ) t
  ))
$$;

create or replace function privado.pedido_cancelado() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  signo numeric;
  r record;
begin
  if new.estado = 'Cancelado' and old.estado <> 'Cancelado' then signo := 1;      -- devolver
  elsif old.estado = 'Cancelado' and new.estado <> 'Cancelado' then signo := -1;  -- volver a descontar
  else return new;
  end if;

  for r in select key as codigo, value::numeric as cant from jsonb_each_text(privado.consumo_pedido(new)) loop
    update public.productos set stock = greatest(0, stock + signo * r.cant), actualizado = now() where codigo = r.codigo;
  end loop;

  if new.cupon is not null then
    update public.cupones set usos = greatest(0, usos - signo::int) where codigo = new.cupon;
  end if;

  if new.medio_pago = 'cuenta' and new.usuario is not null then
    perform set_config('pianura.sistema', '1', true);  -- que proteger_perfil deje tocar el saldo
    update public.profiles set saldo = saldo - signo * new.total where id = new.usuario;
    perform set_config('pianura.sistema', '', true);
  end if;
  return new;
end $$;

-- proteger_perfil respeta los cambios de saldo que hace el propio sistema.
create or replace function privado.proteger_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not privado.es_admin() and auth.uid() is not null and coalesce(current_setting('pianura.sistema', true), '') <> '1' then
    new.rol := old.rol;
    new.limite_credito := old.limite_credito;
    new.saldo := old.saldo;
    new.puntos := old.puntos;
    new.email := old.email;
  end if;
  return new;
end $$;

drop trigger if exists pedido_cancelado on public.pedidos;
create trigger pedido_cancelado after update of estado on public.pedidos
  for each row execute function privado.pedido_cancelado();

revoke execute on function privado.consumo_pedido(public.pedidos), privado.pedido_cancelado() from public, anon, authenticated;

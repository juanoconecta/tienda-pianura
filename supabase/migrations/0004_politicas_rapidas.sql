-- Políticas más eficientes: auth.uid() se evalúa una vez por consulta y no hay dos políticas de lectura por tabla.
drop policy "perfil propio o personal" on public.profiles;
create policy "perfil propio o personal" on public.profiles for select using (id = (select auth.uid()) or (select privado.es_staff()));
drop policy "editar perfil propio o admin" on public.profiles;
create policy "editar perfil propio o admin" on public.profiles for update using (id = (select auth.uid()) or (select privado.es_admin()));
drop policy "mis pedidos o personal" on public.pedidos;
create policy "mis pedidos o personal" on public.pedidos for select using (usuario = (select auth.uid()) or (select privado.es_staff()));

drop policy "zonas admin" on public.zonas_envio;
create policy "zonas admin alta" on public.zonas_envio for insert with check ((select privado.es_admin()));
create policy "zonas admin cambios" on public.zonas_envio for update using ((select privado.es_admin()));
create policy "zonas admin baja" on public.zonas_envio for delete using ((select privado.es_admin()));

drop policy "dias admin" on public.dias_sin_entrega;
create policy "dias admin alta" on public.dias_sin_entrega for insert with check ((select privado.es_admin()));
create policy "dias admin cambios" on public.dias_sin_entrega for update using ((select privado.es_admin()));
create policy "dias admin baja" on public.dias_sin_entrega for delete using ((select privado.es_admin()));

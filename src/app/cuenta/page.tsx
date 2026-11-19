import { perfilActual, STAFF } from '@/lib/datos';
import { supabaseServidor } from '@/lib/supabase/server';
import { fmt, ESTADOS } from '@/lib/tienda';
import { Entrar } from '@/components/Entrar';
import { MisDatos } from '@/components/MisDatos';
import { Repetir } from '@/components/Repetir';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Mi cuenta · Pianura' };

const ROL: Record<string, string> = { cliente: 'Cliente', mayorista: 'Mayorista', dueno: 'Dueño', admin: 'Administración', ventas: 'Ventas', expedicion: 'Expedición' };

export default async function Cuenta({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  const perfil = await perfilActual();
  if (!perfil) return <Entrar errorLink={sp.error === 'link'} />;
  const sb = await supabaseServidor();
  const { data: pedidos } = await sb.from('pedidos').select('id,codigo,total,estado,estado_pago,creado,fecha_entrega,items,modo').eq('usuario', perfil.id).order('creado', { ascending: false }).limit(30);
  const disp = Math.max(0, Number(perfil.limite_credito) - Number(perfil.saldo));

  return (
    <main className="wrap" style={{ paddingBlock: '24px 64px' }}>
      <div className="h1"><div><div className="eyebrow">{ROL[perfil.rol] || perfil.rol}</div><h1>Hola{perfil.nombre ? `, ${perfil.nombre.split(' ')[0]}` : ''}</h1></div>
        <form action="/auth/salir" method="post"><button className="btn" type="submit">Salir</button></form>
      </div>
      <div className="acc">
        <section className="box">
          <h3>Mis pedidos</h3>
          {!pedidos?.length ? <div className="empty"><b>Todavía no hiciste pedidos</b><a className="btn btn-p" href="/">Ir a la tienda</a></div> : pedidos.map((p) => {
            const paso = ESTADOS.indexOf(p.estado as (typeof ESTADOS)[number]);
            return (
              <div className="ord" key={p.id}><a href={`/pedido/${p.codigo}`} style={{ color: 'inherit', textDecoration: 'none', display: 'block' }}>
                <div className="ord-h"><b>#{p.id}</b><span className="meta">{new Date(p.creado).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</span><b className="ord-t">{fmt(p.total)}</b></div>
                <div className="ord-s">
                  <div className="mini-steps" aria-hidden>{ESTADOS.map((e, i) => <i key={e} className={i <= paso ? 'on' : ''} />)}</div>
                  <span className="pill">{p.estado}</span>
                  <span className={'pill ' + (p.estado_pago === 'pagado' ? 'g' : 'w')}>{p.estado_pago === 'pagado' ? 'Pagado' : 'Pago pendiente'}</span>
                </div>
              </a><Repetir items={p.items ?? []} modo={p.modo} chico /></div>
            );
          })}
        </section>
        <div className="acc-side">
          <section className="box">
            <h3>Mis datos</h3>
            <p className="meta" style={{ marginTop: 0 }}>{perfil.email}</p>
            <MisDatos id={perfil.id} inicial={{ nombre: perfil.nombre || '', telefono: perfil.telefono || '', direccion: perfil.direccion || '', localidad: perfil.localidad || '' }} />
          </section>
          {perfil.rol === 'mayorista' && (
            <section className="box">
              <h3>Cuenta corriente</h3>
              <div className="cc-big"><span>Saldo</span><b>{fmt(Number(perfil.saldo))}</b></div>
              <div className="row" style={{ marginTop: 8 }}><span>Crédito disponible</span><span>{fmt(disp)}</span></div>
            </section>
          )}
          {perfil.rol === 'cliente' && <section className="box"><h3>¿Tenés un comercio?</h3><p className="meta">Pedí la cuenta mayorista y comprá con la lista de precios por mayor.</p><a className="btn" href="/mayoristas">Pedir cuenta mayorista</a></section>}
          {STAFF.includes(perfil.rol) && <section className="box"><h3>Personal de Pianura</h3><a className="btn btn-p" href="/panel">Ir al panel</a></section>}
        </div>
      </div>
    </main>
  );
}

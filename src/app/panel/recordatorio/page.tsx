import { exigirPersonal } from '@/lib/panel';
import { supabaseServidor } from '@/lib/supabase/server';
import { proximaEntrega, waNumero, type Config, type DiaSinEntrega } from '@/lib/tienda';
import { Copiar } from '@/components/Copiar';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Recordatorio de cierre · Pianura' };

type Fila = { nombre: string; tel: string; modo: string; ultimo: string; yaPidio: boolean };
const corta = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

export default async function Recordatorio() {
  await exigirPersonal();
  const sb = await supabaseServidor();
  const desde = new Date(Date.now() - 180 * 864e5).toISOString();
  const [{ data: cfg }, { data: dias }, { data: peds }] = await Promise.all([
    sb.from('config').select('cierre_dia,cierre_hora,entrega_dia').eq('id', 1).single(),
    sb.from('dias_sin_entrega').select('*'),
    sb.from('pedidos').select('cliente,modo,creado,fecha_entrega,estado').gte('creado', desde).neq('estado', 'Cancelado').order('creado', { ascending: false }),
  ]);
  const c = (cfg ?? { cierre_dia: 4, cierre_hora: '10:30', entrega_dia: 5 }) as Pick<Config, 'cierre_dia' | 'cierre_hora' | 'entrega_dia'>;
  const e = proximaEntrega(c, (dias ?? []) as DiaSinEntrega[]);
  const sitio = (process.env.NEXT_PUBLIC_SITE_URL || 'https://tiendapianura.com.ar').replace(/\/$/, '');
  const msg = `¡Hola! Te recuerdo que esta semana tomamos pedidos de Pianura hasta el ${e.cierre.replace(/ h$/, '')} h. Lo que pidas te llega el ${e.dia} ${e.fecha}.\n\nHacé tu pedido acá: ${sitio}`;

  // Clientes con celular, sin repetir, del más reciente al más viejo.
  const vistos = new Map<string, Fila>();
  for (const p of peds ?? []) {
    const cl = (p.cliente ?? {}) as { nombre?: string; telefono?: string };
    const tel = waNumero(cl.telefono || '');
    if (tel.length < 10) continue;
    const f = vistos.get(tel);
    const ya = p.fecha_entrega === e.iso;
    if (f) { f.yaPidio ||= ya; continue; }
    vistos.set(tel, { nombre: cl.nombre || 'Sin nombre', tel, modo: p.modo, ultimo: String(p.creado).slice(0, 10), yaPidio: ya });
  }
  const filas = [...vistos.values()].sort((a, b) => Number(a.yaPidio) - Number(b.yaPidio));
  const faltan = filas.filter((f) => !f.yaPidio).length;

  return (
    <div>
      <div className="h1"><div><div className="eyebrow">Recordatorio de cierre</div><h1>Cierre: {e.cierre}</h1></div></div>
      <p className="hint">Mandalo el día antes del cierre. Entrega del {e.dia} {e.fecha}. Los que ya pidieron para esa entrega quedan al final.</p>
      <section className="box">
        <h3>Mensaje <small><Copiar texto={msg} /></small></h3>
        <p style={{ whiteSpace: 'pre-line', margin: '6px 0 14px' }}>{msg}</p>
        <a className="btn btn-wa" href={`https://wa.me/?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener">Compartir en WhatsApp (estado o lista de difusión)</a>
      </section>
      <section className="box" style={{ marginTop: 16 }}>
        <h3>Clientes <small>{faltan} sin pedido para el {e.dia} · {filas.length} en total</small></h3>
        {!filas.length && <p className="meta">Todavía no hay clientes con celular cargado.</p>}
        <div className="tbl-wrap">
          <table>
            <tbody>
              {filas.map((f) => (
                <tr key={f.tel} className={f.yaPidio ? 'off' : ''}>
                  <td><b>{f.nombre}</b><div className="meta">{f.modo === 'may' ? 'Mayorista · ' : ''}último pedido {corta(f.ultimo)}</div></td>
                  <td className="num">{f.yaPidio ? <span className="pill g">Ya pidió</span> : <a className="btn btn-wa" href={`https://wa.me/${f.tel}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener">Enviar</a>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

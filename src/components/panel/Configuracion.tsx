'use client';
import { useState } from 'react';
import { supabaseNavegador } from '@/lib/supabase/client';
import { fmt, num, type Config } from '@/lib/tienda';

export type ConfigFull = Config & { mails_dueno: string[] };
export type ZonaFull = { id: number; localidad: string; costo: number; activa: boolean };
export type Dia = { fecha: string; motivo: string; fecha_alternativa: string | null };
export type CuponFull = { codigo: string; porcentaje: number | null; envio_gratis: boolean; solo: string | null; tope_usos: number; usos: number; vence: string | null; activo: boolean };

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function Configuracion(props: { config: ConfigFull; zonas: ZonaFull[]; dias: Dia[]; cupones: CuponFull[] }) {
  const sb = supabaseNavegador();
  const [c, setC] = useState(props.config);
  const [mails, setMails] = useState(props.config.mails_dueno.join(', '));
  const [zonas, setZonas] = useState(props.zonas);
  const [dias, setDias] = useState(props.dias);
  const [cupones, setCupones] = useState(props.cupones);
  const [msg, setMsg] = useState('');
  const ok = (error: unknown, texto = 'Guardado.') => setMsg(error ? 'No se pudo guardar. Revisá los datos.' : texto);

  async function guardarConfig(e: React.FormEvent) {
    e.preventDefault();
    const { mails_dueno: _m, ...resto } = c;
    void _m;
    const { error } = await sb.from('config').update({ ...resto, mails_dueno: mails.split(/[,\s]+/).map((x) => x.trim().toLowerCase()).filter(Boolean), actualizado: new Date().toISOString() }).eq('id', 1);
    ok(error, 'Configuración guardada.');
  }
  const campo = (k: keyof Config, l: string, extra: Record<string, unknown> = {}) => (
    <div className="field"><label htmlFor={'cf-' + k}>{l}</label><input id={'cf-' + k} value={String(c[k] ?? '')} onChange={(e) => setC({ ...c, [k]: typeof c[k] === 'number' ? Number(e.target.value) : e.target.value })} {...extra} /></div>
  );

  // Zonas
  const [nz, setNz] = useState({ localidad: '', costo: '' });
  async function agregarZona(e: React.FormEvent) {
    e.preventDefault();
    const { data, error } = await sb.from('zonas_envio').insert({ localidad: nz.localidad.trim(), costo: Number(nz.costo) || 0 }).select().single();
    ok(error); if (data) { setZonas([...zonas, data as ZonaFull]); setNz({ localidad: '', costo: '' }); }
  }
  async function cambiarZona(z: ZonaFull, cambios: Partial<ZonaFull>) {
    setZonas(zonas.map((x) => (x.id === z.id ? { ...x, ...cambios } : x)));
    const { error } = await sb.from('zonas_envio').update(cambios).eq('id', z.id); ok(error);
  }
  // Días sin entrega
  const [nd, setNd] = useState({ fecha: '', motivo: 'Feriado', fecha_alternativa: '' });
  async function agregarDia(e: React.FormEvent) {
    e.preventDefault();
    const fila = { fecha: nd.fecha, motivo: nd.motivo || 'Feriado', fecha_alternativa: nd.fecha_alternativa || null };
    const { error } = await sb.from('dias_sin_entrega').upsert(fila); ok(error);
    if (!error) { setDias([...dias.filter((d) => d.fecha !== fila.fecha), fila].sort((a, b) => a.fecha.localeCompare(b.fecha))); setNd({ fecha: '', motivo: 'Feriado', fecha_alternativa: '' }); }
  }
  async function borrarDia(f: string) {
    const { error } = await sb.from('dias_sin_entrega').delete().eq('fecha', f); ok(error, 'Día quitado.');
    if (!error) setDias(dias.filter((d) => d.fecha !== f));
  }
  // Cupones
  const [nc, setNc] = useState({ codigo: '', porcentaje: '', envio_gratis: false, solo: '', tope_usos: '', vence: '' });
  async function agregarCupon(e: React.FormEvent) {
    e.preventDefault();
    const fila = { codigo: nc.codigo.trim().toUpperCase(), porcentaje: nc.porcentaje ? Number(nc.porcentaje) : null, envio_gratis: nc.envio_gratis, solo: nc.solo || null, tope_usos: Number(nc.tope_usos) || 0, vence: nc.vence || null, activo: true };
    const { error } = await sb.from('cupones').insert(fila); ok(error, 'Cupón creado.');
    if (!error) { setCupones([...cupones, { ...fila, usos: 0 }]); setNc({ codigo: '', porcentaje: '', envio_gratis: false, solo: '', tope_usos: '', vence: '' }); }
  }
  async function activarCupon(k: CuponFull) {
    setCupones(cupones.map((x) => (x.codigo === k.codigo ? { ...x, activo: !x.activo } : x)));
    const { error } = await sb.from('cupones').update({ activo: !k.activo }).eq('codigo', k.codigo); ok(error);
  }
  const ddmm = (f: string) => `${f.slice(8)}/${f.slice(5, 7)}/${f.slice(0, 4)}`;

  return (
    <>
      {msg && <p className="note" role="status">{msg}</p>}
      <div className="cols">
        <form className="box" onSubmit={guardarConfig}>
          <h3>Datos y reglas de la tienda</h3>
          <div className="form-grid">
            {campo('banco_alias', 'Alias')}
            {campo('banco_cbu', 'CBU', { inputMode: 'numeric' })}
            {campo('banco_titular', 'Titular')}
            {campo('banco_cuit', 'CUIT del titular')}
            {campo('banco_nombre', 'Banco')}
            {campo('whatsapp', 'WhatsApp de la tienda', { inputMode: 'tel', placeholder: '549349...' })}
            {campo('minimo_mayorista', 'Pedido mínimo mayorista ($)', { inputMode: 'numeric' })}
            {campo('envio_gratis_desde', 'Envío gratis minorista desde ($)', { inputMode: 'numeric' })}
            {campo('descuento_volumen_kg', 'Descuento por volumen desde (kg)', { inputMode: 'numeric' })}
            {campo('descuento_volumen_pct', 'Descuento por volumen (%)', { inputMode: 'decimal' })}
            <div className="field"><label htmlFor="cf-cd">Cierre de pedidos</label><select id="cf-cd" value={c.cierre_dia} onChange={(e) => setC({ ...c, cierre_dia: Number(e.target.value) })}>{DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
            {campo('cierre_hora', 'Hora de cierre', { type: 'time' })}
            <div className="field"><label htmlFor="cf-ed">Día de entrega</label><select id="cf-ed" value={c.entrega_dia} onChange={(e) => setC({ ...c, entrega_dia: Number(e.target.value) })}>{DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select></div>
            {campo('lista_nombre', 'Nombre de la lista vigente')}
            <div className="field full"><label htmlFor="cf-m">Mails con acceso de dueño (separados por coma)</label><input id="cf-m" value={mails} onChange={(e) => setMails(e.target.value)} /></div>
          </div>
          <button className="btn btn-p" type="submit" style={{ marginTop: 14 }}>Guardar</button>
        </form>
        <div className="cfg-side">
          <div className="box">
            <h3>Zonas de envío minorista</h3>
            <div className="tbl-wrap"><table className="edit"><tbody>
              {zonas.map((z) => (
                <tr key={z.id} className={z.activa ? '' : 'off'}>
                  <td>{z.localidad}</td>
                  <td className="num"><input className="ni sm" inputMode="numeric" defaultValue={num(z.costo)} aria-label={`Costo ${z.localidad}`} onBlur={(e) => { const v = Number(e.target.value) || 0; if (v !== num(z.costo)) cambiarZona(z, { costo: v }); }} /></td>
                  <td><label className="sw"><input type="checkbox" checked={z.activa} onChange={(e) => cambiarZona(z, { activa: e.target.checked })} />Activa</label></td>
                </tr>
              ))}
            </tbody></table></div>
            <form className="inline-form" onSubmit={agregarZona} style={{ marginTop: 10 }}>
              <div className="field"><label htmlFor="nz-l">Localidad</label><input id="nz-l" required value={nz.localidad} onChange={(e) => setNz({ ...nz, localidad: e.target.value })} /></div>
              <div className="field"><label htmlFor="nz-c">Costo</label><input id="nz-c" inputMode="numeric" value={nz.costo} onChange={(e) => setNz({ ...nz, costo: e.target.value })} /></div>
              <button className="btn" type="submit">Agregar</button>
            </form>
          </div>
          <div className="box">
            <h3>Días sin entrega</h3>
            {!dias.length ? <div className="meta">No hay días cargados.</div> : dias.map((d) => (
              <div className="row" key={d.fecha}><span>{ddmm(d.fecha)} · {d.motivo}{d.fecha_alternativa ? ` → se entrega el ${ddmm(d.fecha_alternativa)}` : ' → pasa a la semana siguiente'}</span><button className="linkb" type="button" onClick={() => borrarDia(d.fecha)}>Quitar</button></div>
            ))}
            <form className="inline-form" onSubmit={agregarDia} style={{ marginTop: 10 }}>
              <div className="field"><label htmlFor="nd-f">Fecha</label><input id="nd-f" type="date" required value={nd.fecha} onChange={(e) => setNd({ ...nd, fecha: e.target.value })} /></div>
              <div className="field"><label htmlFor="nd-m">Motivo</label><input id="nd-m" value={nd.motivo} onChange={(e) => setNd({ ...nd, motivo: e.target.value })} /></div>
              <div className="field"><label htmlFor="nd-a">Entregar el (opcional)</label><input id="nd-a" type="date" value={nd.fecha_alternativa} onChange={(e) => setNd({ ...nd, fecha_alternativa: e.target.value })} /></div>
              <button className="btn" type="submit">Agregar</button>
            </form>
          </div>
        </div>
      </div>
      <div className="box">
        <h3>Cupones</h3>
        <div className="tbl-wrap"><table>
          <thead><tr><th>Código</th><th>Beneficio</th><th>Para</th><th className="num">Usos</th><th>Vence</th><th>Activo</th></tr></thead>
          <tbody>{cupones.map((k) => (
            <tr key={k.codigo} className={k.activo ? '' : 'off'}>
              <td><b className="mono">{k.codigo}</b></td>
              <td>{[k.porcentaje ? `${num(k.porcentaje)} %` : '', k.envio_gratis ? 'envío gratis' : ''].filter(Boolean).join(' + ')}</td>
              <td>{k.solo === 'min' ? 'Minoristas' : k.solo === 'may' ? 'Mayoristas' : 'Todos'}</td>
              <td className="num">{k.usos}{k.tope_usos ? ` / ${k.tope_usos}` : ''}</td>
              <td>{k.vence ? ddmm(k.vence) : 'Sin vencimiento'}</td>
              <td><label className="sw"><input type="checkbox" checked={k.activo} onChange={() => activarCupon(k)} />{k.activo ? 'Sí' : 'No'}</label></td>
            </tr>
          ))}</tbody>
        </table></div>
        <form className="inline-form" onSubmit={agregarCupon} style={{ marginTop: 12 }}>
          <div className="field"><label htmlFor="nc-c">Código</label><input id="nc-c" required value={nc.codigo} onChange={(e) => setNc({ ...nc, codigo: e.target.value.toUpperCase() })} /></div>
          <div className="field"><label htmlFor="nc-p">Descuento %</label><input id="nc-p" inputMode="decimal" value={nc.porcentaje} onChange={(e) => setNc({ ...nc, porcentaje: e.target.value })} /></div>
          <div className="field"><label htmlFor="nc-s">Para</label><select id="nc-s" value={nc.solo} onChange={(e) => setNc({ ...nc, solo: e.target.value })}><option value="">Todos</option><option value="min">Minoristas</option><option value="may">Mayoristas</option></select></div>
          <div className="field"><label htmlFor="nc-t">Tope de usos</label><input id="nc-t" inputMode="numeric" placeholder="Sin tope" value={nc.tope_usos} onChange={(e) => setNc({ ...nc, tope_usos: e.target.value })} /></div>
          <div className="field"><label htmlFor="nc-v">Vence</label><input id="nc-v" type="date" value={nc.vence} onChange={(e) => setNc({ ...nc, vence: e.target.value })} /></div>
          <label className="chk"><input type="checkbox" checked={nc.envio_gratis} onChange={(e) => setNc({ ...nc, envio_gratis: e.target.checked })} />Envío gratis</label>
          <button className="btn" type="submit">Crear cupón</button>
        </form>
        <p className="hint" style={{ marginTop: 10 }}>El pedido mínimo mayorista actual es de {fmt(num(c.minimo_mayorista))}.</p>
      </div>
    </>
  );
}

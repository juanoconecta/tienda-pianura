'use client';
import { useState } from 'react';
import { supabaseNavegador } from '@/lib/supabase/client';
import { esCombo, minimoDe, num, type Producto } from '@/lib/tienda';

type Campo = 'precio_mayorista' | 'precio_kg' | 'precio_medio' | 'precio_cuarto' | 'precio_horma' | 'precio_unidad' | 'stock' | 'stock_minimo';
const PRECIOS: Campo[] = ['precio_mayorista', 'precio_kg', 'precio_medio', 'precio_cuarto', 'precio_horma', 'precio_unidad'];
const r100 = (n: number) => Math.round(n / 100) * 100;

export function EditorProductos({ inicial }: { inicial: Producto[] }) {
  const [ps, setPs] = useState(() => inicial.filter((p) => !esCombo(p)));
  const [sucio, setSucio] = useState<Record<string, Partial<Producto>>>({});
  const [pct, setPct] = useState('');
  const [lista, setLista] = useState<'min' | 'may' | 'ambas'>('ambas');
  const [msg, setMsg] = useState('');
  const [guardando, setGuardando] = useState(false);

  function set(codigo: string, campo: keyof Producto, valor: unknown) {
    setPs((l) => l.map((p) => (p.codigo === codigo ? { ...p, [campo]: valor } : p)));
    setSucio((s) => ({ ...s, [codigo]: { ...s[codigo], [campo]: valor } }));
  }
  function aumentar() {
    const f = 1 + Number(pct) / 100;
    if (!Number(pct)) return;
    const campos = PRECIOS.filter((c) => lista === 'ambas' || (lista === 'may' ? c === 'precio_mayorista' : c !== 'precio_mayorista'));
    const nuevo: Record<string, Partial<Producto>> = { ...sucio };
    setPs((l) => l.map((p) => {
      const c: Partial<Producto> = {};
      campos.forEach((k) => { if (p[k]) (c as Record<string, number>)[k] = k === 'precio_mayorista' ? Math.round(num(p[k]) * f) : r100(num(p[k]) * f); });
      nuevo[p.codigo] = { ...nuevo[p.codigo], ...c };
      return { ...p, ...c };
    }));
    setSucio(nuevo);
    setMsg(`Aumento de ${pct} % aplicado en pantalla. Revisá y tocá Guardar.`);
  }
  async function guardar() {
    setGuardando(true); setMsg('');
    const sb = supabaseNavegador();
    const errores: string[] = [];
    for (const [codigo, c] of Object.entries(sucio)) {
      const { error } = await sb.from('productos').update({ ...c, actualizado: new Date().toISOString() }).eq('codigo', codigo);
      if (error) errores.push(codigo);
    }
    setGuardando(false);
    if (errores.length) setMsg('No se pudieron guardar: ' + errores.join(', '));
    else { setSucio({}); setMsg('Cambios guardados. La tienda ya muestra los precios nuevos.'); }
  }
  const celda = (p: Producto, k: Campo, sm = false) => (
    <td className="num"><input className={'ni' + (sm ? ' sm' : '')} inputMode="decimal" aria-label={`${k} de ${p.nombre}`} value={p[k] ?? ''} onChange={(e) => set(p.codigo, k, e.target.value === '' ? null : Number(e.target.value.replace(',', '.')))} /></td>
  );
  const pend = Object.keys(sucio).length;
  return (
    <>
      <div className="box" style={{ marginBottom: 16 }}>
        <h3>Aumento general</h3>
        <div className="inline-form">
          <div className="field"><label htmlFor="pct">Porcentaje</label><input id="pct" inputMode="decimal" value={pct} onChange={(e) => setPct(e.target.value)} placeholder="Ej.: 8" /></div>
          <div className="field"><label htmlFor="lista">Lista</label><select id="lista" value={lista} onChange={(e) => setLista(e.target.value as typeof lista)}><option value="ambas">Las dos listas</option><option value="min">Solo minorista</option><option value="may">Solo mayorista</option></select></div>
          <button className="btn" type="button" onClick={aumentar}>Aplicar</button>
        </div>
        <p className="hint" style={{ margin: '10px 0 0' }}>Los precios minoristas se redondean a $ 100. Nada se guarda hasta que tocás Guardar.</p>
      </div>
      <div className="tools">
        <button className="btn btn-p" type="button" disabled={!pend || guardando} onClick={guardar}>{guardando ? 'Guardando…' : pend ? `Guardar ${pend} cambios` : 'Sin cambios'}</button>
        {msg && <span className="meta">{msg}</span>}
      </div>
      <div className="box tbl-wrap">
        <table className="edit">
          <thead><tr><th>Producto</th><th className="num">Stock</th><th className="num">Avisar debajo de</th><th className="num">Mayorista</th><th className="num">1 kg / unidad</th><th className="num">½ kg</th><th className="num">¼ kg</th><th className="num">Horma</th><th>Publicado</th></tr></thead>
          <tbody>
            {ps.map((p) => (
              <tr key={p.codigo} className={p.publicado ? '' : 'off'}>
                <td><div className="pcell"><span className="dot sm" style={{ background: p.color }}>{p.codigo}</span><div><b>{p.nombre}</b><div className="meta">{p.familia}</div></div></div></td>
                <td className="num"><input className={'ni sm' + (num(p.stock) <= minimoDe(p) ? ' low' : '')} inputMode="decimal" aria-label={`stock de ${p.nombre}`} value={p.stock ?? ''} onChange={(e) => set(p.codigo, 'stock', e.target.value === '' ? 0 : Number(e.target.value.replace(',', '.')))} /></td>
                <td className="num"><input className="ni sm" inputMode="decimal" aria-label={`stock mínimo de ${p.nombre}`} placeholder={String(p.unidad === 'kg' ? 10 : 12)} value={p.stock_minimo ?? ''} onChange={(e) => set(p.codigo, 'stock_minimo', e.target.value === '' ? null : Number(e.target.value.replace(',', '.')))} /></td>
                {celda(p, 'precio_mayorista')}
                {celda(p, p.unidad === 'u' ? 'precio_unidad' : 'precio_kg')}
                {p.unidad === 'kg' ? celda(p, 'precio_medio') : <td />}
                {p.unidad === 'kg' ? celda(p, 'precio_cuarto') : <td />}
                {p.unidad === 'kg' ? celda(p, 'precio_horma') : <td />}
                <td><label className="sw"><input type="checkbox" checked={p.publicado} onChange={(e) => set(p.codigo, 'publicado', e.target.checked)} />{p.publicado ? 'Sí' : 'No'}</label></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

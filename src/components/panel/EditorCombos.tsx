'use client';
import { useMemo, useState } from 'react';
import { supabaseNavegador } from '@/lib/supabase/client';
import { COMBOS, detalleCombo, esCombo, fmt, num, precioSuelto, stockCombo, type Componente, type Producto } from '@/lib/tienda';

const IMAGENES = ['/img/quesosProd.jpg', '/img/blandos.jpg', '/img/semiduros.jpg', '/img/duros.jpg', '/img/ricota.jpg', '/img/cremas.jpg', '/img/cremaHome.jpg', '/img/dulces.jpg', '/img/ddlHome.jpg', '/img/hero.jpg'];
const CANT_KG = [0.25, 0.5, 1, 1.5, 2];

type Form = { codigo: string | null; nombre: string; descripcion: string; precio: string; imagen: string; publicado: boolean; componentes: Componente[] };
const vacio: Form = { codigo: null, nombre: '', descripcion: '', precio: '', imagen: IMAGENES[0], publicado: true, componentes: [] };

export function EditorCombos({ inicial }: { inicial: Producto[] }) {
  const [ps, setPs] = useState(inicial);
  const [f, setF] = useState<Form | null>(null);
  const [msg, setMsg] = useState('');
  const [guardando, setGuardando] = useState(false);
  const idx = useMemo(() => Object.fromEntries(ps.map((p) => [p.codigo, p])), [ps]);
  const combos = ps.filter(esCombo);
  const base = ps.filter((p) => !esCombo(p));

  function editar(p: Producto) {
    setF({ codigo: p.codigo, nombre: p.nombre, descripcion: p.descripcion, precio: String(num(p.precio_unidad) || ''), imagen: p.imagen || IMAGENES[0], publicado: p.publicado, componentes: [...(p.componentes ?? [])] });
    setMsg('');
  }
  function setComp(i: number, c: Partial<Componente>) {
    if (!f) return;
    const l = f.componentes.map((x, j) => (j === i ? { ...x, ...c } : x));
    setF({ ...f, componentes: l });
  }
  function agregarComp() {
    if (!f) return;
    const p = base[0];
    setF({ ...f, componentes: [...f.componentes, { codigo: p.codigo, cantidad: p.unidad === 'kg' ? 0.5 : 1 }] });
  }
  const borrador: Producto | null = f ? ({ ...(f.codigo ? idx[f.codigo] : {}), componentes: f.componentes } as Producto) : null;
  const suelto = borrador ? precioSuelto(borrador, idx) : 0;
  const precio = Number(String(f?.precio || '').replace(/\./g, '').replace(',', '.')) || 0;

  async function guardar() {
    if (!f) return;
    if (!f.nombre.trim() || precio <= 0 || !f.componentes.length) { setMsg('Completá el nombre, el precio y al menos un producto.'); return; }
    setGuardando(true); setMsg('');
    const sb = supabaseNavegador();
    const datos = {
      nombre: f.nombre.trim(), descripcion: f.descripcion.trim() || detalleCombo(borrador!, idx), precio_unidad: precio, imagen: f.imagen, publicado: f.publicado,
      componentes: f.componentes.filter((c) => c.cantidad > 0), actualizado: new Date().toISOString(),
    };
    let codigo = f.codigo;
    let error;
    if (codigo) {
      ({ error } = await sb.from('productos').update(datos).eq('codigo', codigo));
    } else {
      const usados = new Set(ps.map((p) => p.codigo));
      let n = 1; while (usados.has('K' + String(n).padStart(2, '0'))) n++;
      codigo = 'K' + String(n).padStart(2, '0');
      ({ error } = await sb.from('productos').insert({ ...datos, codigo, familia: COMBOS, unidad: 'u', orden: 5 + n, color: '#FF8200', precio_mayorista: 0, paso_mayorista: 1, stock: 0 }));
    }
    setGuardando(false);
    if (error) { setMsg('No se pudo guardar el combo.'); return; }
    const nuevo = { ...(idx[codigo] ?? { familia: COMBOS, unidad: 'u', color: '#FF8200', precio_mayorista: 0, stock: 0, orden: 5 }), ...datos, codigo } as Producto;
    setPs((l) => (l.some((p) => p.codigo === codigo) ? l.map((p) => (p.codigo === codigo ? nuevo : p)) : [...l, nuevo]));
    setF(null);
    setMsg('Combo guardado. Ya aparece en la tienda' + (datos.publicado ? '.' : ' cuando lo publiques.'));
  }
  async function borrar(p: Producto) {
    if (!confirm(`¿Borrar el combo "${p.nombre}"?`)) return;
    const { error } = await supabaseNavegador().from('productos').delete().eq('codigo', p.codigo);
    if (error) { setMsg('No se pudo borrar.'); return; }
    setPs((l) => l.filter((x) => x.codigo !== p.codigo));
    if (f?.codigo === p.codigo) setF(null);
  }

  return (
    <>
      <div className="tools">
        {!f && <button className="btn btn-p" type="button" onClick={() => { setF({ ...vacio }); setMsg(''); }}>Nuevo combo</button>}
        {msg && <span className="meta" role="status">{msg}</span>}
      </div>
      {f && (
        <div className="box combo-form">
          <h3>{f.codigo ? 'Editar combo' : 'Nuevo combo'}</h3>
          <div className="grid2">
            <div className="field"><label htmlFor="cn">Nombre</label><input id="cn" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Ej.: Picada para 4" /></div>
            <div className="field"><label htmlFor="cp">Precio del combo (final, con IVA)</label><input id="cp" inputMode="numeric" value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} placeholder="Ej.: 15000" /></div>
          </div>
          <div className="field"><label htmlFor="cd">Descripción (opcional)</label><input id="cd" value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} placeholder="Si la dejás vacía, se arma con lo que incluye" /></div>
          <div className="field"><span className="lbl">Incluye</span>
            {f.componentes.map((c, i) => {
              const p = idx[c.codigo];
              return (
                <div className="comp" key={i}>
                  <select aria-label="Producto" value={c.codigo} onChange={(e) => { const x = idx[e.target.value]; setComp(i, { codigo: e.target.value, cantidad: x.unidad === 'kg' ? 0.5 : 1 }); }}>
                    {base.map((x) => <option key={x.codigo} value={x.codigo}>{x.nombre}</option>)}
                  </select>
                  {p?.unidad === 'kg'
                    ? <select aria-label="Cantidad" value={c.cantidad} onChange={(e) => setComp(i, { cantidad: Number(e.target.value) })}>{CANT_KG.map((k) => <option key={k} value={k}>{k === 0.25 ? '¼ kg' : k === 0.5 ? '½ kg' : `${String(k).replace('.', ',')} kg`}</option>)}</select>
                    : <input aria-label="Unidades" className="ni sm" inputMode="numeric" value={c.cantidad} onChange={(e) => setComp(i, { cantidad: Math.max(1, Math.floor(Number(e.target.value) || 1)) })} />}
                  <button className="adv" type="button" onClick={() => setF({ ...f, componentes: f.componentes.filter((_, j) => j !== i) })}>Quitar</button>
                </div>
              );
            })}
            <button className="btn" type="button" onClick={agregarComp}>+ Agregar producto</button>
          </div>
          <div className="field"><span className="lbl">Foto</span>
            <div className="fotos">{IMAGENES.map((im) => <button key={im} type="button" className="foto" aria-pressed={f.imagen === im} aria-label={im} style={{ backgroundImage: `url(${im})` }} onClick={() => setF({ ...f, imagen: im })} />)}</div>
          </div>
          <label className="sw"><input type="checkbox" checked={f.publicado} onChange={(e) => setF({ ...f, publicado: e.target.checked })} />Publicado en la tienda</label>
          {f.componentes.length > 0 && (
            <p className="meta">Por separado sale {fmt(suelto)}.{precio > 0 && suelto > precio ? ` El cliente ahorra ${fmt(suelto - precio)} (${Math.round((1 - precio / suelto) * 100)} %).` : ''} Se pueden armar {stockCombo(borrador!, idx)} con el stock de hoy.</p>
          )}
          <div className="tools">
            <button className="btn btn-p" type="button" disabled={guardando} onClick={guardar}>{guardando ? 'Guardando…' : 'Guardar combo'}</button>
            <button className="btn" type="button" onClick={() => setF(null)}>Cancelar</button>
          </div>
        </div>
      )}
      {!combos.length && !f && <div className="box"><b>Todavía no hay combos.</b><p className="meta">Ideas: “Picada para 4” (cremoso, tybo y sardo), “Desayuno” (ricotta y dulce de leche) o un 2x1 en crema.</p></div>}
      {combos.length > 0 && (
        <div className="box tbl-wrap">
          <table className="edit">
            <thead><tr><th>Combo</th><th>Incluye</th><th className="num">Precio</th><th className="num">Por separado</th><th className="num">Se pueden armar</th><th>Publicado</th><th /></tr></thead>
            <tbody>
              {combos.map((p) => (
                <tr key={p.codigo} className={p.publicado ? '' : 'off'}>
                  <td><b>{p.nombre}</b><div className="meta">{p.codigo}</div></td>
                  <td className="meta">{detalleCombo(p, idx)}</td>
                  <td className="num">{fmt(num(p.precio_unidad))}</td>
                  <td className="num">{fmt(precioSuelto(p, idx))}</td>
                  <td className="num">{stockCombo(p, idx)}</td>
                  <td>{p.publicado ? 'Sí' : 'No'}</td>
                  <td><button className="adv" type="button" onClick={() => editar(p)}>Editar</button> <button className="adv" type="button" onClick={() => borrar(p)}>Borrar</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

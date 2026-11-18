'use client';
import { useState } from 'react';
import { supabaseNavegador } from '@/lib/supabase/client';
import { fmt, num } from '@/lib/tienda';

export type Solicitud = { id: number; razon_social: string; cuit: string; rubro: string | null; localidad: string | null; contacto: string | null; whatsapp: string | null; email: string; compra_estimada: string | null; pide_cuenta_corriente: boolean; estado: string; creado: string };
export type Usuario = { id: string; email: string | null; nombre: string | null; razon_social: string | null; telefono: string | null; localidad: string | null; rol: string; limite_credito: number; saldo: number; creado: string };

const ROLES: [string, string][] = [['cliente', 'Cliente'], ['mayorista', 'Mayorista'], ['ventas', 'Ventas'], ['expedicion', 'Expedición'], ['admin', 'Administración'], ['dueno', 'Dueño']];

export function Clientes({ solicitudes, usuarios, admin }: { solicitudes: Solicitud[]; usuarios: Usuario[]; admin: boolean }) {
  const [sol, setSol] = useState(solicitudes);
  const [us, setUs] = useState(usuarios);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const sb = supabaseNavegador();

  async function resolver(s: Solicitud, estado: 'Aprobada' | 'Rechazada') {
    const { error } = await sb.from('solicitudes_mayoristas').update({ estado }).eq('id', s.id);
    if (error) return setMsg('No se pudo actualizar la solicitud.');
    setSol((l) => l.map((x) => (x.id === s.id ? { ...x, estado } : x)));
    if (estado === 'Aprobada') setUs((l) => l.map((u) => (u.email?.toLowerCase() === s.email.toLowerCase() && u.rol === 'cliente' ? { ...u, rol: 'mayorista', razon_social: s.razon_social } : u)));
    setMsg(estado === 'Aprobada' ? `${s.razon_social} aprobado. Si todavía no tiene usuario, queda mayorista al entrar con ${s.email}.` : 'Solicitud rechazada.');
  }
  async function guardarUsuario(u: Usuario, cambios: Partial<Usuario>) {
    const prev = us;
    setUs((l) => l.map((x) => (x.id === u.id ? { ...x, ...cambios } : x)));
    const { error } = await sb.from('profiles').update(cambios).eq('id', u.id);
    if (error) { setUs(prev); setMsg('No se pudo guardar.'); } else setMsg('Guardado.');
  }

  const pend = sol.filter((s) => s.estado === 'Pendiente');
  const f = q.trim().toLowerCase();
  const lista = us.filter((u) => !f || [u.email, u.nombre, u.razon_social, u.localidad, u.telefono].some((v) => v?.toLowerCase().includes(f)));
  return (
    <>
      {msg && <p className="note" role="status">{msg}</p>}
      <div className="box" style={{ marginBottom: 16 }}>
        <h3>Solicitudes mayoristas <small>{pend.length} pendientes</small></h3>
        {!pend.length ? <div className="meta">No hay solicitudes pendientes.</div> : pend.map((s) => (
          <div className="ord" key={s.id}>
            <div className="ord-h"><b>{s.razon_social}</b><span className="meta">CUIT {s.cuit}{s.rubro ? ` · ${s.rubro}` : ''}{s.localidad ? ` · ${s.localidad}` : ''}</span></div>
            <div className="meta">{s.contacto || ''} · {s.email}{s.whatsapp ? <> · <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener">{s.whatsapp}</a></> : null}{s.compra_estimada ? ` · ${s.compra_estimada}/semana` : ''}{s.pide_cuenta_corriente ? ' · pide cuenta corriente' : ''}</div>
            {admin && <div className="ord-a"><button className="btn btn-p sm" type="button" onClick={() => resolver(s, 'Aprobada')}>Aprobar</button><button className="btn sm" type="button" onClick={() => resolver(s, 'Rechazada')}>Rechazar</button></div>}
          </div>
        ))}
      </div>
      <div className="box">
        <h3>Usuarios <small>{us.length}</small></h3>
        <div className="tools"><input type="search" placeholder="Buscar por nombre, mail o localidad" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar usuarios" style={{ flex: '1 1 240px' }} /></div>
        <div className="tbl-wrap">
          <table className="edit">
            <thead><tr><th>Usuario</th><th>Localidad</th><th>Rol</th><th className="num">Límite de crédito</th><th className="num">Saldo</th></tr></thead>
            <tbody>
              {lista.map((u) => (
                <tr key={u.id}>
                  <td><b>{u.razon_social || u.nombre || '(sin nombre)'}</b><div className="meta">{u.email}{u.telefono ? ` · ${u.telefono}` : ''}</div></td>
                  <td>{u.localidad || ''}</td>
                  <td>{admin ? <select aria-label={`Rol de ${u.email}`} value={u.rol} onChange={(e) => guardarUsuario(u, { rol: e.target.value })}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select> : ROLES.find((r) => r[0] === u.rol)?.[1]}</td>
                  <td className="num">{admin && u.rol === 'mayorista' ? <input className="ni" inputMode="numeric" defaultValue={num(u.limite_credito)} aria-label={`Crédito de ${u.email}`} onBlur={(e) => { const v = Number(e.target.value) || 0; if (v !== num(u.limite_credito)) guardarUsuario(u, { limite_credito: v }); }} /> : fmt(num(u.limite_credito))}</td>
                  <td className="num">{admin && u.rol === 'mayorista' ? <input className="ni" inputMode="numeric" defaultValue={num(u.saldo)} aria-label={`Saldo de ${u.email}`} onBlur={(e) => { const v = Number(e.target.value) || 0; if (v !== num(u.saldo)) guardarUsuario(u, { saldo: v }); }} /> : fmt(num(u.saldo))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {admin && <p className="hint" style={{ marginTop: 12 }}>Para registrar un pago de cuenta corriente, bajá el saldo del mayorista.</p>}
      </div>
    </>
  );
}

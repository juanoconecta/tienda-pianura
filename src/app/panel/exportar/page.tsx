import { exigirPersonal } from '@/lib/panel';

export const metadata = { title: 'Exportar ventas · Pianura' };

export default async function Exportar() {
  await exigirPersonal();
  const ar = (ms: number) => new Date(ms - 3 * 3600e3).toISOString().slice(0, 10);
  const hoy = ar(Date.now());
  const ahora = new Date(hoy + 'T12:00:00Z');
  const inicioMes = hoy.slice(0, 8) + '01';
  const mesPasadoIni = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
  const mesPasadoFin = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), 0)).toISOString().slice(0, 10);
  const lunes = ar(Date.now() - ((ahora.getUTCDay() + 6) % 7) * 864e5);
  const atajos = [
    { l: 'Esta semana', d: lunes, h: hoy },
    { l: 'Este mes', d: inicioMes, h: hoy },
    { l: 'Mes pasado', d: mesPasadoIni, h: mesPasadoFin },
  ];
  const link = (d: string, h: string, tipo: string) => `/api/panel/ventas?desde=${d}&hasta=${h}&tipo=${tipo}`;
  return (
    <>
      <div className="h1"><div><div className="eyebrow">Exportar ventas</div><h1>Ventas para Excel</h1></div></div>
      <p className="hint">Se descarga un archivo que abre directo en Excel o Google Sheets. “Por pedido” trae una fila por pedido con sus totales. “Por producto” trae una fila por cada producto vendido. Los pedidos cancelados no se incluyen.</p>
      <div className="box">
        <h3>Atajos</h3>
        <div className="atajos">{atajos.map((a) => (
          <div key={a.l} className="atajo"><b>{a.l}</b><span className="meta">{a.d.slice(8)}/{a.d.slice(5, 7)} al {a.h.slice(8)}/{a.h.slice(5, 7)}</span>
            <div><a className="btn btn-p" href={link(a.d, a.h, 'pedidos')}>Por pedido</a> <a className="btn" href={link(a.d, a.h, 'productos')}>Por producto</a></div>
          </div>
        ))}</div>
      </div>
      <form className="box" method="get" action="/api/panel/ventas">
        <h3>Otro período</h3>
        <div className="inline-form">
          <div className="field"><label htmlFor="desde">Desde</label><input id="desde" name="desde" type="date" defaultValue={inicioMes} required /></div>
          <div className="field"><label htmlFor="hasta">Hasta</label><input id="hasta" name="hasta" type="date" defaultValue={hoy} required /></div>
          <div className="field"><label htmlFor="tipo">Detalle</label><select id="tipo" name="tipo" defaultValue="pedidos"><option value="pedidos">Por pedido</option><option value="productos">Por producto</option></select></div>
          <button className="btn btn-p" type="submit">Descargar</button>
        </div>
      </form>
    </>
  );
}

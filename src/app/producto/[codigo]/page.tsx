import { notFound } from 'next/navigation';
import { cargarTienda, modoDe, perfilActual } from '@/lib/datos';
import { Comprar } from '@/components/Comprar';
import { BarraCarrito } from '@/components/BarraCarrito';
import { tinta } from '@/components/Tienda';
import { fmt, num, precioMinorista, visibleEn } from '@/lib/tienda';

export const dynamic = 'force-dynamic';

const RECETAS: Record<string, [string, string][]> = {
  'Quesos blandos': [['Picada', 'En cubos, con aceitunas y pan de campo.'], ['Para fundir', 'En milanesas a la napolitana y sándwiches calientes.'], ['Acompañá con', 'Un blanco joven o una cerveza rubia.']],
  'Pasta hilada': [['Pizza casera', 'Rallado grueso y al final, con el horno bien caliente.'], ['Caprese', 'Con tomate, albahaca y un hilo de aceite de oliva.'], ['Acompañá con', 'Un tinto liviano.']],
  'Quesos semiduros': [['Tabla', 'En bastones, con frutos secos y dulce de membrillo.'], ['Sándwich', 'Con jamón cocido en pan francés.'], ['Acompañá con', 'Un Malbec joven.']],
  'Quesos duros': [['Rallado', 'Sobre pastas, sopas y gratinados.'], ['En láminas', 'Con rúcula, peras y un poco de miel.'], ['Acompañá con', 'Un tinto con cuerpo.']],
  'Ricotta y crema': [['Sorrentinos', 'Ricotta con nuez y queso rallado para el relleno.'], ['Salsa', 'Crema con queso azul para unos ñoquis.'], ['Postre', 'Ricotta con miel y nueces.']],
  'Dulce de leche': [['Panqueques', 'El clásico de los domingos.'], ['Alfajores de maicena', 'Bien rellenos y con coco rallado.'], ['Merienda', 'Con tostadas o en el mate cocido.']],
};

export default async function Ficha({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const [datos, perfil] = await Promise.all([cargarTienda(), perfilActual()]);
  const modo = modoDe(perfil);
  const p = datos.productos.find((x) => x.codigo === codigo.toUpperCase());
  if (!p || !visibleEn(p, modo)) notFound();
  const may = modo === 'may';
  const rel = datos.productos.filter((x) => x.familia === p.familia && x.codigo !== p.codigo && visibleEn(x, modo)).slice(0, 3);
  const pres = may ? (p.unidad === 'kg' ? `Horma de ${String(num(p.paso_mayorista)).replace('.', ',')} kg aprox. Se vende por horma.` : `Se vende por ${p.envase_mayorista || 'unidad'}.`)
    : p.unidad === 'kg' ? (p.precio_horma ? `¼ kg, ½ kg, 1 kg o ${p.etiqueta_horma.toLowerCase()}. ${p.etiqueta_horma === 'Horma entera' ? 'Horma entera 8 % menos y ½ horma 5 % menos. ' : ''}Las hormas se cobran por peso real.` : '¼ kg, ½ kg o 1 kg.') : 'Por unidad. Precio final con IVA.';
  return (
    <main className="store wrap">
      <a className="back" href="/">← Volver al catálogo</a>
      <section className="pdp">
        <div className="pdp-img" role="img" aria-label={p.nombre} style={{ backgroundImage: `url(${p.imagen})` }}><span className="code" style={{ background: p.color, color: tinta(p.color) }}>{p.codigo}</span></div>
        <div className="pdp-b">
          <div className="eyebrow">{p.familia}</div><h1>{p.nombre}</h1>
          <div className="price big">{fmt(may ? num(p.precio_mayorista) : precioMinorista(p))}<small>{p.unidad === 'kg' ? '/kg' : '/u'}{may ? ' + IVA' : ' · IVA incluido'}</small></div>
          <p>{p.descripcion}</p>
          <dl className="specs">
            <div><dt>Presentación</dt><dd>{pres}</dd></div>
            <div><dt>Disponible</dt><dd>{num(p.stock) <= 0 ? <span className="stock-out">Agotado</span> : `${num(p.stock).toLocaleString('es-AR')} ${p.unidad === 'kg' ? 'kg' : 'u'}`}</dd></div>
            <div><dt>Conservación</dt><dd>{p.familia === 'Dulce de leche' ? 'Lugar fresco y seco. Una vez abierto, en heladera.' : 'Mantener refrigerado.'}</dd></div>
            {!may && <div><dt>¿Sos comercio?</dt><dd><a className="linkb" href="/mayoristas">Pedí tu cuenta mayorista</a></dd></div>}
          </dl>
          <Comprar p={p} grande />
        </div>
      </section>
      {RECETAS[p.familia] && <section className="box" style={{ marginTop: 16 }}><h3>Ideas para disfrutarlo</h3><div className="rec">{RECETAS[p.familia].map(([t, x]) => <div key={t}><b>{t}</b>{x}</div>)}</div></section>}
      {rel.length > 0 && <><div className="cat-title">Más {p.familia.toLowerCase()}</div><div className="grid">{rel.map((x) => <a key={x.codigo} className="card" href={`/producto/${x.codigo}`} style={{ textDecoration: 'none' }}><div className="swatch" style={{ backgroundImage: `url(${x.imagen})` }}><span className="code" style={{ background: x.color, color: tinta(x.color) }}>{x.codigo}</span></div><div className="card-b"><h4>{x.nombre}</h4><div className="price">{fmt(may ? num(x.precio_mayorista) : precioMinorista(x))}<small>{x.unidad === 'kg' ? '/kg' : '/u'}</small></div></div></a>)}</div></>}
      <BarraCarrito productos={datos.productos} config={datos.config} />
    </main>
  );
}

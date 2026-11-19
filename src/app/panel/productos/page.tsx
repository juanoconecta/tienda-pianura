import { exigirPersonal } from '@/lib/panel';
import { supabaseServidor } from '@/lib/supabase/server';
import { EditorProductos } from '@/components/panel/EditorProductos';
import type { Producto } from '@/lib/tienda';

export default async function Productos() {
  await exigirPersonal(true);
  const sb = await supabaseServidor();
  const { data } = await sb.from('productos').select('*').order('orden');
  return (
    <>
      <div className="h1"><div><div className="eyebrow">Productos</div><h1>Lista de precios</h1></div></div>
      <p className="hint">Mayorista: precio neto sin IVA por kg o unidad. Minorista: precios finales con IVA. La venta es por encargo: no hay límite de stock. Para dejar de vender un producto, destildá Publicado. Los combos se arman en <a className="plink" href="/panel/combos">Combos y promos</a>.</p>
      <EditorProductos inicial={(data ?? []) as Producto[]} />
    </>
  );
}

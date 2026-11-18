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
      <div className="h1"><div><div className="eyebrow">Productos y stock</div><h1>Lista de precios</h1></div></div>
      <p className="hint">Mayorista: precio neto sin IVA por kg o unidad. Minorista: precios finales con IVA. El stock se descuenta solo con cada pedido.</p>
      <EditorProductos inicial={(data ?? []) as Producto[]} />
    </>
  );
}

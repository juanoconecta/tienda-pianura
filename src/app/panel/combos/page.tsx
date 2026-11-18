import { exigirPersonal } from '@/lib/panel';
import { supabaseServidor } from '@/lib/supabase/server';
import { EditorCombos } from '@/components/panel/EditorCombos';
import type { Producto } from '@/lib/tienda';

export default async function Combos() {
  await exigirPersonal(true);
  const sb = await supabaseServidor();
  const { data } = await sb.from('productos').select('*').order('orden');
  return (
    <>
      <div className="h1"><div><div className="eyebrow">Combos y promos</div><h1>Armá combos con tus productos</h1></div></div>
      <p className="hint">Un combo junta varios productos a un precio especial, solo para la venta minorista. Su stock sale de los productos que incluye y al venderlo se descuentan ellos. Para un 2x1, armá un combo con 2 unidades del mismo producto al precio de una.</p>
      <EditorCombos inicial={(data ?? []) as Producto[]} />
    </>
  );
}

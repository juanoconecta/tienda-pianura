import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { CREMA, NARANJA, OG_TAMANO, TEXTO, fuentesOg, imagenPublica } from '@/lib/og';
import { fmt, precioMinorista, type Producto } from '@/lib/tienda';

export const alt = 'Producto de Tienda Pianura';
export const size = OG_TAMANO;
export const contentType = 'image/png';
export const revalidate = 3600;

export default async function Imagen({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data } = await sb.from('productos').select('*').eq('codigo', codigo.toUpperCase()).eq('publicado', true).maybeSingle();
  const p = data as Producto | null;
  const [fuentes, logo, foto] = await Promise.all([fuentesOg(), imagenPublica('/img/logo.png'), imagenPublica(p?.imagen || '/img/hero.jpg')]);
  const precio = p ? precioMinorista(p) : 0;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', fontFamily: 'Montserrat', background: CREMA, color: TEXTO }}>
        {foto && <img src={foto} width={560} height={630} alt="" style={{ objectFit: 'cover' }} />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px' }}>
          {logo && <img src={logo} width={222} height={79} alt="" style={{ borderRadius: 10 }} />}
          <div style={{ fontSize: 24, fontWeight: 600, color: NARANJA, marginTop: 44, textTransform: 'uppercase', letterSpacing: 2 }}>{p?.familia || 'Tienda Pianura'}</div>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.05, marginTop: 10 }}>{p?.nombre || 'Quesos, cremas y dulce de leche'}</div>
          {precio > 0 && (
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 26 }}>
              <span style={{ fontSize: 54, fontWeight: 800, color: NARANJA }}>{fmt(precio)}</span>
              <span style={{ fontSize: 26, fontWeight: 600, marginLeft: 10, opacity: 0.7 }}>{p?.unidad === 'kg' ? '/kg' : '/u'}</span>
            </div>
          )}
          <div style={{ fontSize: 24, fontWeight: 600, marginTop: 30, opacity: 0.75 }}>Comprá online en Tienda Pianura</div>
        </div>
      </div>
    ),
    { ...size, fonts: await fuentes },
  );
}

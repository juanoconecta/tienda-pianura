import { ImageResponse } from 'next/og';
import { CREMA, NARANJA, OG_TAMANO, fuentesOg, imagenPublica } from '@/lib/og';

export const alt = 'Tienda Pianura: quesos, cremas y dulce de leche de Vila, Santa Fe';
export const size = OG_TAMANO;
export const contentType = 'image/png';

export default async function Imagen() {
  const [fuentes, logo, foto] = await Promise.all([fuentesOg(), imagenPublica('/img/logo.png'), imagenPublica('/img/hero.jpg')]);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', fontFamily: 'Montserrat', background: NARANJA }}>
        <div style={{ width: 600, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 56px', color: CREMA }}>
          {logo && <img src={logo} width={370} height={131} alt="" style={{ marginLeft: -12 }} />}
          <div style={{ fontSize: 26, fontWeight: 600, marginTop: 8, opacity: 0.92 }}>Así de simple. Así de bueno.</div>
          <div style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.08, marginTop: 40, color: '#FFFFFF' }}>Quesos, cremas y dulce de leche</div>
          <div style={{ display: 'flex', marginTop: 28, fontSize: 24, fontWeight: 600 }}>
            <span style={{ background: CREMA, color: NARANJA, padding: '10px 20px', borderRadius: 999 }}>Comprá online · menor y mayor</span>
          </div>
        </div>
        {foto && <img src={foto} width={600} height={630} alt="" style={{ objectFit: 'cover' }} />}
      </div>
    ),
    { ...size, fonts: await fuentes },
  );
}

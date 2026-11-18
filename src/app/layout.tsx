import type { Metadata, Viewport } from 'next';
import './globals.css';
import { perfilActual, modoDe, STAFF } from '@/lib/datos';
import { CarritoProvider, BotonCarrito } from '@/components/Carrito';
import { NavLinks } from '@/components/NavLinks';

export const metadata: Metadata = {
  title: 'Pianura Lácteos · Tienda',
  description: 'Quesos, cremas y dulce de leche de Pianura. Comprá por menor o por mayor.',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/img/icono-192.png', apple: '/img/icono-180.png' },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#FF8200' };

// Intro del logo: una vez por visita (sesión del navegador), antes de pintar la página.
const INTRO = "try{if(!sessionStorage.getItem('pianura-intro')&&!location.pathname.startsWith('/panel')){document.documentElement.setAttribute('data-intro','');sessionStorage.setItem('pianura-intro','1')}}catch(e){}";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let perfil = null;
  try { perfil = await perfilActual(); } catch { perfil = null; }
  const staff = !!perfil && STAFF.includes(perfil.rol);
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" />
        <script dangerouslySetInnerHTML={{ __html: INTRO }} />
      </head>
      <body>
        <div className="intro" aria-hidden="true">
          <div className="intro-in">
            <img src="/img/logo.png" alt="" width={222} height={79} />
            <span className="intro-bar" />
            <span className="intro-tag">Así de simple. Así de bueno.</span>
          </div>
        </div>
        <CarritoProvider modo={modoDe(perfil)}>
          <header className="top wrap">
            <div className="top-in">
              <a className="logo" href="/" aria-label="Pianura Lácteos, ir a la tienda"><img src="/img/logo.png" alt="PIANURA Lácteos" width={118} height={42} /></a>
              <span className="tag">Así de simple. Así de bueno.</span>
              <span className="spacer" />
              <NavLinks staff={staff} logueado={!!perfil} />
              <BotonCarrito />
            </div>
          </header>
          {children}
          <footer className="foot wrap"><div className="foot-in"><span>PIANURA Lácteos · Vila, Santa Fe · Así de simple. Así de bueno.</span><span>Una creación y desarrollo de <b>JuanoConecta</b></span></div></footer>
        </CarritoProvider>
      </body>
    </html>
  );
}

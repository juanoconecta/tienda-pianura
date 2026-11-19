import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Renueva la sesión de Supabase en cada pedido de página.
export async function proxy(request: NextRequest) {
  // La dirección vieja (*.vercel.app) manda a la oficial; las API siguen respondiendo en las dos.
  const oficial = process.env.NEXT_PUBLIC_SITE_URL;
  const host = request.headers.get('host') || '';
  if (oficial && host === 'pianura-tienda.vercel.app' && !request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.redirect(new URL(request.nextUrl.pathname + request.nextUrl.search, oficial), 308);
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (lista) => {
        lista.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        lista.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|img/|favicon.ico|sw.js|manifest.webmanifest|api/mp/webhook).*)'],
};

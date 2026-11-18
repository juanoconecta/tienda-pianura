import { NextResponse } from 'next/server';
import { supabaseServidor } from '@/lib/supabase/server';

// El link del mail vuelve acá: se cambia el código por la sesión.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const sig = url.searchParams.get('next');
  const destino = sig && sig.startsWith('/') && !sig.startsWith('//') ? sig : '/cuenta';
  if (code) {
    const sb = await supabaseServidor();
    const { error } = await sb.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(destino, url.origin));
  }
  return NextResponse.redirect(new URL('/cuenta?error=link', url.origin));
}

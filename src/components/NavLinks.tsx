'use client';
import { usePathname } from 'next/navigation';

export function NavLinks({ staff, logueado }: { staff: boolean; logueado: boolean }) {
  const path = usePathname();
  const cur = (p: string) => (p === '/' ? path === '/' : path.startsWith(p)) ? 'page' : undefined;
  return (
    <nav className="nav-links" aria-label="Principal">
      <a href="/" aria-current={cur('/')}>Tienda</a>
      <a href="/cuenta" aria-current={cur('/cuenta')}>{logueado ? 'Mi cuenta' : 'Entrar'}</a>
      {staff && <a href="/panel" aria-current={cur('/panel')}>Panel</a>}
    </nav>
  );
}

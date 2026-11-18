'use client';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/panel', l: 'Tablero' },
  { href: '/panel/pedidos', l: 'Pedidos' },
  { href: '/panel/productos', l: 'Productos y stock', admin: true },
  { href: '/panel/clientes', l: 'Clientes' },
  { href: '/panel/config', l: 'Configuración', admin: true },
];

export function PanelNav({ admin, modo }: { admin: boolean; modo: 'side' | 'tabs' }) {
  const path = usePathname();
  const ls = LINKS.filter((x) => admin || !x.admin);
  const cur = (h: string) => (h === '/panel' ? path === h : path.startsWith(h)) ? 'page' : undefined;
  if (modo === 'tabs') return <nav className="ptabs" aria-label="Panel">{ls.map((x) => <a key={x.href} href={x.href} aria-current={cur(x.href)}>{x.l}</a>)}</nav>;
  return (
    <nav className="side" aria-label="Panel">
      <div className="grp">Panel</div>
      {ls.map((x) => <a className="nav" key={x.href} href={x.href} aria-current={cur(x.href)}>{x.l}</a>)}
      <div className="grp">Tienda</div>
      <a className="nav" href="/">Ver la tienda</a>
      <a className="nav" href="/?modo=may">Ver como mayorista</a>
    </nav>
  );
}

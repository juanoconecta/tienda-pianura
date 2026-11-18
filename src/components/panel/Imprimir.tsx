'use client';
export function Imprimir({ texto = 'Imprimir o guardar PDF' }: { texto?: string }) {
  return <button className="btn btn-p" type="button" onClick={() => window.print()}>{texto}</button>;
}

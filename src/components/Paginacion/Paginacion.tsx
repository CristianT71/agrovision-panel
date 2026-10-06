// RNF-03.1 — pie de las listas paginadas en el servidor
type Props = {
  total: number
  pagina: number
  limite: number
  // Mientras llega la página pedida se muestra la anterior y se bloquean los botones
  cargando?: boolean
  onCambiar: (pagina: number) => void
}

export default function Paginacion({ total, pagina, limite, cargando = false, onCambiar }: Props) {
  const paginas = Math.max(1, Math.ceil(total / limite))

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500">
      <span>
        {total.toLocaleString('es-CO')} {total === 1 ? 'resultado' : 'resultados'} · Página {pagina} de {paginas}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onCambiar(pagina - 1)}
          disabled={pagina <= 1 || cargando}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition enabled:hover:border-agro-green enabled:hover:text-agro-green disabled:opacity-40"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => onCambiar(pagina + 1)}
          disabled={pagina >= paginas || cargando}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 transition enabled:hover:border-agro-green enabled:hover:text-agro-green disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

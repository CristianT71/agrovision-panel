import { useMemo, useState } from 'react'
import { FICHAS, type Categoria, type Ficha } from './mockFichas'
import NewPestDrawer from './NewPestDrawer'

type Filtro = 'Todas' | Categoria

const FILTROS: Filtro[] = ['Todas', 'Enfermedad', 'Plaga', 'Deficiencia', 'Sano', 'Otro']

const COLOR_CATEGORIA: Record<Categoria, string> = {
  Enfermedad: 'bg-red-50 text-red-600',
  Plaga: 'bg-amber-50 text-amber-700',
  Deficiencia: 'bg-purple-50 text-purple-700',
  Sano: 'bg-green-50 text-green-700',
  Otro: 'bg-gray-100 text-gray-600',
}

// Quita tildes y pasa a minúsculas para que "oxido" encuentre "óxido"
const normalizar = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export default function PestCatalog() {
  const [fichas, setFichas] = useState<Ficha[]>(FICHAS)
  const [filtro, setFiltro] = useState<Filtro>('Todas')
  const [busqueda, setBusqueda] = useState('')
  const [drawerAbierto, setDrawerAbierto] = useState(false)

 
  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return fichas.filter((f) => {
      if (filtro !== 'Todas' && f.categoria !== filtro) return false
      if (!q) return true
      return [f.nombreComun, f.nombreCientifico, ...f.sinonimos].some((t) =>
        normalizar(t).includes(q),
      )
    })
  }, [fichas, filtro, busqueda])

  const crearFicha = (nueva: Ficha) => {
    setFichas((prev) => [nueva, ...prev])
    setDrawerAbierto(false)
  }

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo de plagas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fichas fitosanitarias validadas para café colombiano
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDrawerAbierto(true)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-agro-green px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#194b32]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          Nueva ficha
        </button>
      </div>

      {/* Búsqueda  */}
      <div className="relative mt-6">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre común, científico o sinónimo..."
          className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none"
        />
      </div>

      {/* Filtros por categoría  */}
      <div className="mt-4 inline-flex flex-wrap gap-1 rounded-xl bg-[#eef4f0] p-1">
        {FILTROS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`rounded-lg px-4 py-1.5 text-sm transition ${
              filtro === f
                ? 'bg-white font-medium text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Tarjetas */}
      {visibles.length === 0 ? (
        <p className="mt-5 rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">
          No hay fichas que coincidan con la búsqueda.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((f) => (
            <article
              key={f.id}
              className="cursor-pointer overflow-hidden rounded-2xl bg-white transition hover:shadow-md"
            >
              {f.imagen ? (
                <img src={f.imagen} alt={f.nombreComun} className="h-48 w-full object-cover" />
              ) : (
                <div className="flex h-48 w-full items-center justify-center bg-[#eef4f0] text-[#9dc7ae]">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
                    <path d="M20 4c0 9-6 13-12 13 0-7 5-11 12-13Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 20c1-4 4-7 8-9" strokeLinecap="round" />
                  </svg>
                </div>
              )}

              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{f.nombreComun}</h3>
                <p className="text-sm italic text-gray-500">{f.nombreCientifico}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-medium ${COLOR_CATEGORIA[f.categoria]}`}
                  >
                    {f.categoria}
                  </span>

               
                  {f.conAval ? (
                    <span className="flex items-center gap-1 rounded-md bg-[#e8f7ee] px-2 py-0.5 text-xs font-medium text-agro-green">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
                        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Con aval
                    </span>
                  ) : (
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Sin aval
                    </span>
                  )}
                </div>

               
                {f.sinonimos.length > 0 && (
                  <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-3 w-3 shrink-0">
                      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" strokeLinejoin="round" />
                      <circle cx="7.5" cy="7.5" r="1.3" />
                    </svg>
                    <span className="line-clamp-1">{f.sinonimos.join(', ')}</span>
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Panel lateral: se monta solo cuando está abierto, así el formulario se reinicia al cerrar */}
      {drawerAbierto && (
        <NewPestDrawer onClose={() => setDrawerAbierto(false)} onCreate={crearFicha} />
      )}
    </div>
  )
}
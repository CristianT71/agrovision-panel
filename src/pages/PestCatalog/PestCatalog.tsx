import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clavesPlagas, plagasService, TIPOS_PLAGA, type Plaga, type TipoPlaga } from '../../api/plagas/plagas.service'
import { mensajeDeError, urlArchivo } from '../../api/axios'
import PestDrawer from './PestDrawer'

type Filtro = 'todas' | TipoPlaga

const COLOR_TIPO: Record<TipoPlaga, string> = {
  enfermedad: 'bg-red-50 text-red-600',
  plaga: 'bg-amber-50 text-amber-700',
  deficiencia: 'bg-purple-50 text-purple-700',
  sano: 'bg-green-50 text-green-700',
}

const ETIQUETA_TIPO = Object.fromEntries(TIPOS_PLAGA.map((t) => [t.valor, t.etiqueta])) as Record<TipoPlaga, string>

// El panel lateral se abre sin ficha (crear) o con una existente (ver/editar).
// "apertura" identifica cada apertura: guardar no remonta el panel ni borra sus mensajes.
type Drawer = { ficha?: Plaga; apertura: number } | null

export default function PestCatalog() {
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [busqueda, setBusqueda] = useState('')
  const [busquedaAplicada, setBusquedaAplicada] = useState('')
  const [drawer, setDrawer] = useState<Drawer>(null)

  // Espera a que el usuario deje de escribir para no consultar la API en cada tecla
  useEffect(() => {
    const espera = setTimeout(() => setBusquedaAplicada(busqueda.trim()), 300)
    return () => clearTimeout(espera)
  }, [busqueda])

  // RF-05.1 / RF-05.2 — la API filtra por tipo y busca en nombres y sinónimos
  const filtros = {
    tipo: filtro === 'todas' ? undefined : filtro,
    busqueda: busquedaAplicada || undefined,
  }
  const consulta = useQuery({
    queryKey: clavesPlagas.lista(filtros),
    queryFn: () => plagasService.listar(filtros),
    placeholderData: (anterior) => anterior,
  })

  const fichas = consulta.data ?? []

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
          onClick={() => setDrawer({ apertura: Date.now() })}
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

      {/* Filtros por tipo  */}
      <div className="mt-4 inline-flex flex-wrap gap-1 rounded-xl bg-[#eef4f0] p-1">
        {[{ valor: 'todas' as const, etiqueta: 'Todas' }, ...TIPOS_PLAGA].map((t) => (
          <button
            key={t.valor}
            type="button"
            onClick={() => setFiltro(t.valor)}
            className={`rounded-lg px-4 py-1.5 text-sm transition ${
              filtro === t.valor
                ? 'bg-white font-medium text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.etiqueta}
          </button>
        ))}
      </div>

      {/* Tarjetas */}
      {consulta.isPending ? (
        <p className="mt-5 rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">Cargando fichas...</p>
      ) : consulta.isError ? (
        <p className="mt-5 rounded-xl bg-red-50 px-5 py-10 text-center text-sm text-red-600">
          {mensajeDeError(consulta.error, 'No se pudo cargar el catálogo.')}
        </p>
      ) : fichas.length === 0 ? (
        <p className="mt-5 rounded-xl bg-white px-5 py-10 text-center text-sm text-gray-400">
          {busquedaAplicada || filtro !== 'todas'
            ? 'No hay fichas que coincidan con la búsqueda.'
            : 'Aún no hay fichas en el catálogo. Crea la primera con "Nueva ficha".'}
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {fichas.map((f) => (
            <TarjetaFicha key={f.id} ficha={f} onAbrir={() => setDrawer({ ficha: f, apertura: Date.now() })} />
          ))}
        </div>
      )}

      {/* Panel lateral: se monta solo cuando está abierto, así el formulario se reinicia al cerrar */}
      {/* Cada guardado devuelve la ficha actualizada; al crearla, el panel pasa a modo edición */}
      {drawer && (
        <PestDrawer
          key={drawer.apertura}
          ficha={drawer.ficha}
          onGuardada={(ficha) => setDrawer((actual) => actual && { ...actual, ficha })}
          onClose={() => setDrawer(null)}
        />
      )}
    </div>
  )
}

function TarjetaFicha({ ficha, onAbrir }: { ficha: Plaga; onAbrir: () => void }) {
  const conAval = ficha.avales.length > 0

  return (
    <article
      onClick={onAbrir}
      className="cursor-pointer overflow-hidden rounded-2xl bg-white transition hover:shadow-md"
    >
      {ficha.fotoUrl ? (
        <img src={urlArchivo(ficha.fotoUrl)} alt={ficha.nombreComun} className="h-48 w-full object-cover" />
      ) : (
        <div className="flex h-48 w-full items-center justify-center bg-[#eef4f0] text-[#9dc7ae]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10">
            <path d="M20 4c0 9-6 13-12 13 0-7 5-11 12-13Z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 20c1-4 4-7 8-9" strokeLinecap="round" />
          </svg>
        </div>
      )}

      <div className="p-4">
        <h3 className="font-semibold text-gray-900">{ficha.nombreComun}</h3>
        <p className="text-sm italic text-gray-500">{ficha.nombreCientifico ?? 'Sin nombre científico'}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${COLOR_TIPO[ficha.tipo]}`}>
            {ETIQUETA_TIPO[ficha.tipo]}
          </span>

          {/* RF-05.7 — el aval libera el protocolo químico */}
          {conAval ? (
            <span className="flex items-center gap-1 rounded-md bg-[#e8f7ee] px-2 py-0.5 text-xs font-medium text-agro-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Con aval
            </span>
          ) : (
            <span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">Sin aval</span>
          )}
        </div>

        {ficha.sinonimos.length > 0 && (
          <p className="mt-3 flex items-start gap-1.5 text-xs text-gray-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 h-3 w-3 shrink-0">
              <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" strokeLinejoin="round" />
              <circle cx="7.5" cy="7.5" r="1.3" />
            </svg>
            <span className="line-clamp-1">{ficha.sinonimos.join(', ')}</span>
          </p>
        )}
      </div>
    </article>
  )
}

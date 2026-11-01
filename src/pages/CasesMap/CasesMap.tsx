import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ESTADOS_SOLICITUD, solicitudesService, type EstadoSolicitud, type Solicitud } from '../../api/solicitudes/solicitudes.service'
import {
  clavesUbicacion,
  desdeDelDia,
  hastaDelDia,
  ubicacionService,
  type FiltrosMapa,
} from '../../api/ubicacion/ubicacion.service'
import {
  CATEGORIAS,
  ETIQUETAS_CATEGORIA,
  LIMITE_MAPA_DETECCIONES,
  clavesDetecciones,
  deteccionesService,
  type ParametrosDetecciones,
} from '../../api/detecciones/detecciones.service'
import { mensajeDeError } from '../../api/axios'
import MapaUbicacion from '../../components/MapaUbicacion/MapaUbicacion'
import { COLOR_CATEGORIA_MAPA } from '../../components/MapaUbicacion/config'
import { useValorRetrasado } from '../../utils/useValorRetrasado'
import CaseChatDrawer from '../CasesInbox/CaseChatDrawer'

const CAMPO =
  'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-agro-green focus:outline-none'

// RF-02.3 — mapa satelital de los casos (solo administrador)
export default function CasesMap() {
  const [estado, setEstado] = useState<EstadoSolicitud | ''>('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [municipio, setMunicipio] = useState('')
  // Capa aparte: las capturas de la app con ubicación, sobre el mismo mapa
  const [verDetecciones, setVerDetecciones] = useState(false)
  const [precision, setPrecision] = useState('')
  const [caso, setCaso] = useState<Solicitud | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)
  const [exportando, setExportando] = useState(false)
  // El KML no avisa si el API lo recortó: con el listado recortado se pide confirmar antes de exportar
  const [confirmandoExportar, setConfirmandoExportar] = useState(false)

  // Municipio con debounce: no se consulta la API en cada tecla
  const municipioRetrasado = useValorRetrasado(municipio.trim(), 400)

  const rangoInvalido = Boolean(desde && hasta && desde > hasta)
  const filtros: FiltrosMapa = {
    estado: estado || undefined,
    desde: desdeDelDia(desde),
    hasta: hastaDelDia(hasta),
    municipio: municipioRetrasado || undefined,
  }

  const mapa = useQuery({
    queryKey: clavesUbicacion.mapa(filtros),
    queryFn: () => ubicacionService.listarMapa(filtros),
    enabled: !rangoInvalido,
    placeholderData: keepPreviousData,
  })

  // Comparte fechas y municipio con los casos; el estado solo aplica a los casos
  const precisionRetrasada = useValorRetrasado(precision.trim(), 400)
  const precisionMax = Number(precisionRetrasada)
  const parametrosDetecciones: ParametrosDetecciones = {
    limite: LIMITE_MAPA_DETECCIONES,
    ...(desde && { desde: desdeDelDia(desde) }),
    ...(hasta && { hasta: hastaDelDia(hasta) }),
    ...(municipioRetrasado && { municipio: municipioRetrasado }),
    ...(precisionRetrasada !== '' && Number.isFinite(precisionMax) && precisionMax >= 0 && { precisionMaxMetros: precisionMax }),
  }
  const capaDetecciones = useQuery({
    queryKey: clavesDetecciones.mapa(parametrosDetecciones),
    queryFn: () => deteccionesService.listarMapa(parametrosDetecciones),
    enabled: verDetecciones && !rangoInvalido,
    placeholderData: keepPreviousData,
  })
  const detecciones = verDetecciones ? (capaDetecciones.data ?? []) : []
  const deteccionesRecortadas = detecciones.length >= LIMITE_MAPA_DETECCIONES

  const puntos = mapa.data?.puntos ?? []
  const recortado = mapa.data?.truncado ?? false
  const hayFiltros = Boolean(estado || desde || hasta || municipio || precision)

  const limpiar = () => {
    setEstado('')
    setDesde('')
    setHasta('')
    setMunicipio('')
    setPrecision('')
  }

  const exportar = async () => {
    setErrorAccion(null)
    setConfirmandoExportar(false)
    setExportando(true)
    try {
      await ubicacionService.descargarKmlMapa(filtros)
    } catch (e) {
      setErrorAccion(mensajeDeError(e, 'No se pudo exportar el KML.'))
    } finally {
      setExportando(false)
    }
  }

  // El administrador no tiene la página de detalle del profesional: el caso se abre en su panel lateral
  const verCaso = async (id: string) => {
    setErrorAccion(null)
    try {
      setCaso(await solicitudesService.obtener(id))
    } catch (e) {
      setErrorAccion(mensajeDeError(e, 'No se pudo abrir el caso.'))
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mapa de casos</h1>
          <p className="mt-1 text-sm text-gray-500">Dónde se tomó la foto de cada solicitud, sobre imagen satelital</p>
        </div>
        <button
          type="button"
          onClick={() => (recortado ? setConfirmandoExportar(true) : exportar())}
          disabled={exportando || rangoInvalido || puntos.length === 0}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-agro-green hover:text-agro-green disabled:cursor-not-allowed disabled:opacity-50"
        >
          {exportando ? 'Exportando...' : 'Exportar KML'}
        </button>
      </div>

      {/* Filtros */}
      <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-gray-500">
          Estado
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoSolicitud | '')}
            className={`${CAMPO} mt-1`}
          >
            <option value="">Todos</option>
            {ESTADOS_SOLICITUD.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-gray-500">
          Desde
          <input type="date" value={desde} max={hasta || undefined} onChange={(e) => setDesde(e.target.value)} className={`${CAMPO} mt-1`} />
        </label>
        <label className="text-xs font-medium text-gray-500">
          Hasta
          <input type="date" value={hasta} min={desde || undefined} onChange={(e) => setHasta(e.target.value)} className={`${CAMPO} mt-1`} />
        </label>
        <label className="text-xs font-medium text-gray-500">
          Municipio
          <input
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            placeholder="Ej. Pitalito"
            className={`${CAMPO} mt-1`}
          />
        </label>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-2 sm:col-span-2 lg:col-span-4">
          <label className="flex items-center gap-2 pb-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={verDetecciones}
              onChange={(e) => setVerDetecciones(e.target.checked)}
              className="h-4 w-4 accent-agro-green"
            />
            Mostrar detecciones de la app
          </label>
          {verDetecciones && (
            <label className="text-xs font-medium text-gray-500">
              Precisión GPS máx. (m)
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={precision}
                onChange={(e) => setPrecision(e.target.value)}
                placeholder="Ej: 50"
                title="Solo aplica a las detecciones. Las capturas sin precisión informada también se ocultan."
                className={`${CAMPO} mt-1 w-40`}
              />
            </label>
          )}
        </div>
        {hayFiltros && (
          <div className="flex items-end">
            <button type="button" onClick={limpiar} className="pb-2 text-xs text-gray-500 hover:text-agro-green hover:underline">
              Limpiar
            </button>
          </div>
        )}
      </div>

      {rangoInvalido && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700">
          La fecha inicial no puede ser posterior a la final.
        </p>
      )}
      {recortado && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Hay más casos de los que caben en el mapa: se muestran solo los primeros {mapa.data?.limite}. Afina los filtros
          para ver el resto.
        </p>
      )}
      {confirmandoExportar && (
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700">
          <span>
            El KML se recorta igual que el mapa (primeros {mapa.data?.limite} casos) y no incluye el resto. ¿Exportar de
            todos modos?
          </span>
          <button type="button" onClick={exportar} className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-medium">
            Exportar de todos modos
          </button>
          <button type="button" onClick={() => setConfirmandoExportar(false)} className="text-xs underline">
            Cancelar
          </button>
        </div>
      )}
      {verDetecciones && capaDetecciones.isError && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
          {mensajeDeError(capaDetecciones.error, 'No se pudieron cargar las detecciones.')}
        </p>
      )}
      {verDetecciones && deteccionesRecortadas && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-700">
          Hay más detecciones de las que caben en el mapa: se muestran las {LIMITE_MAPA_DETECCIONES} más recientes. Afina
          los filtros para ver el resto.
        </p>
      )}
      {errorAccion && <p className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{errorAccion}</p>}

      {/* Mapa y estados */}
      <div className="mt-4 rounded-2xl bg-white p-3">
        {mapa.isPending && !rangoInvalido ? (
          <div className="flex h-[32rem] items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400">
            Cargando mapa...
          </div>
        ) : mapa.isError ? (
          <div className="flex h-[32rem] flex-col items-center justify-center rounded-xl bg-red-50 text-sm text-red-600">
            <p>{mensajeDeError(mapa.error, 'No se pudo cargar el mapa.')}</p>
            <button
              type="button"
              onClick={() => mapa.refetch()}
              className="mt-3 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="relative isolate">
            <MapaUbicacion puntos={puntos} detecciones={detecciones} className="h-[32rem] w-full" onVerCaso={verCaso} />
            {!rangoInvalido && puntos.length === 0 && detecciones.length === 0 && (
              <p className="pointer-events-none absolute inset-x-0 top-4 z-[500] mx-auto w-fit rounded-xl bg-white/95 px-4 py-2 text-sm text-gray-600 shadow">
                No hay casos ni detecciones con ubicación para estos filtros
              </p>
            )}
          </div>
        )}
      </div>

      <Leyenda mostrarDetecciones={verDetecciones} />

      {caso && (
        <CaseChatDrawer solicitud={caso} nombreAgronomo={null} onClose={() => setCaso(null)} />
      )}
    </div>
  )
}

const COLOR_LEYENDA: Record<EstadoSolicitud, string> = {
  Pendiente: 'bg-gray-500',
  Enviada: 'bg-blue-700',
  Asignada: 'bg-amber-700',
  Resuelta: 'bg-green-700',
  Descartada: 'bg-red-600',
}

function Leyenda({ mostrarDetecciones }: { mostrarDetecciones: boolean }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
      {ESTADOS_SOLICITUD.map((e) => (
        <li key={e} className="flex items-center gap-1.5">
          <span className={`h-3 w-3 rounded-full ${COLOR_LEYENDA[e]}`} />
          {e}
        </li>
      ))}
      {mostrarDetecciones &&
        CATEGORIAS.map((c) => (
          <li key={c} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rotate-45" style={{ background: COLOR_CATEGORIA_MAPA[c] }} />
            Detección · {ETIQUETAS_CATEGORIA[c]}
          </li>
        ))}
    </ul>
  )
}

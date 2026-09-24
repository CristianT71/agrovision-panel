import { useMemo, useState } from 'react'
import {
  AGRONOMOS_CUENTA,
  PRODUCTORES,
  type AgronomoCuenta,
  type EstadoAgronomo,
  type EstadoProductor,
  type Productor,
} from './mockCuentas'

type Pestana = 'productores' | 'agronomos'

const COLOR_PRODUCTOR: Record<EstadoProductor, string> = {
  Validado: 'bg-[#e8f7ee] text-agro-green',
  Registrado: 'bg-amber-50 text-amber-700',
  Suspendido: 'bg-red-50 text-red-600',
}

const COLOR_AGRONOMO: Record<EstadoAgronomo, string> = {
  Activo: 'bg-[#e8f7ee] text-agro-green',
  'Validación pendiente': 'bg-amber-50 text-amber-700',
  Inactivo: 'bg-gray-100 text-gray-600',
}

const normalizar = (t: string) =>
  t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const iconoValidar = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-3.5 w-3.5">
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" strokeLinecap="round" />
    <path d="M17 8.5l1.8 1.8 3.2-3.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function Accounts() {
  const [pestana, setPestana] = useState<Pestana>('productores')
  const [busqueda, setBusqueda] = useState('')
  const [productores, setProductores] = useState<Productor[]>(PRODUCTORES)
  const [agronomos, setAgronomos] = useState<AgronomoCuenta[]>(AGRONOMOS_CUENTA)
  const [revocando, setRevocando] = useState<Productor | null>(null)
  const [validandoProductor, setValidandoProductor] = useState<Productor | null>(null)
  const [validandoAgronomo, setValidandoAgronomo] = useState<AgronomoCuenta | null>(null)

  const productoresVisibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    if (!q) return productores
    return productores.filter((p) =>
      [p.nombre, p.finca, p.municipio, p.vereda].some((t) => normalizar(t).includes(q)),
    )
  }, [productores, busqueda])

  const agronomosVisibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    if (!q) return agronomos
    return agronomos.filter((a) =>
      [a.nombre, a.especialidad, a.tarjeta].some((t) => normalizar(t).includes(q)),
    )
  }, [agronomos, busqueda])

  // RF-10.3 — revocación con validación explícita
  const revocar = () => {
    if (!revocando) return
    setProductores((prev) =>
      prev.map((p) => (p.id === revocando.id ? { ...p, consentimiento: false } : p)),
    )
    setRevocando(null)
  }

  const otorgar = (id: string) =>
    setProductores((prev) => prev.map((p) => (p.id === id ? { ...p, consentimiento: true } : p)))

  // Validación humana de la cuenta del productor
  const validarProductor = () => {
    if (!validandoProductor) return
    setProductores((prev) =>
      prev.map((p) =>
        p.id === validandoProductor.id ? { ...p, estado: 'Validado' as EstadoProductor } : p,
      ),
    )
    setValidandoProductor(null)
  }

  // RF-10.5 — validación humana del recurso operativo
  const validarAgronomo = () => {
    if (!validandoAgronomo) return
    setAgronomos((prev) =>
      prev.map((a) =>
        a.id === validandoAgronomo.id ? { ...a, estado: 'Activo' as EstadoAgronomo } : a,
      ),
    )
    setValidandoAgronomo(null)
  }

  const pendientes = agronomos.filter((a) => a.estado === 'Validación pendiente').length

  return (
    <div>
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de cuentas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Productores registrados y agrónomos del sistema
          </p>
        </div>
        {pendientes > 0 && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" strokeLinecap="round" />
            </svg>
            {pendientes} por validar
          </span>
        )}
      </div>

      {/* Búsqueda */}
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
          placeholder={
            pestana === 'productores'
              ? 'Buscar por nombre, finca o municipio...'
              : 'Buscar por nombre, especialidad o tarjeta...'
          }
          className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-11 pr-4 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none"
        />
      </div>

      {/* RF-10.1 — módulos diferenciados */}
      <div className="mt-4 inline-flex gap-1 rounded-xl bg-[#eef4f0] p-1">
        {(
          [
            { id: 'productores' as Pestana, label: 'Productores', total: productores.length },
            { id: 'agronomos' as Pestana, label: 'Agrónomos', total: agronomos.length },
          ]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPestana(t.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm transition ${
              pestana === t.id
                ? 'bg-white font-medium text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
            <span className="rounded-md bg-gray-100 px-1.5 text-xs text-gray-600">{t.total}</span>
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-white">
        <div className="overflow-x-auto">
          {pestana === 'productores' ? (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-4 font-medium">Productor / Finca</th>
                  <th className="px-5 py-4 font-medium">Ubicación</th>
                  <th className="px-5 py-4 font-medium">Teléfono</th>
                  <th className="px-5 py-4 font-medium">Estado</th>
                  <th className="px-5 py-4 font-medium">Consentimiento</th>
                  <th className="px-5 py-4 font-medium">Registro</th>
                  <th className="px-5 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productoresVisibles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                      No hay productores que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}

                {productoresVisibles.map((p) => (
                  <tr
                    key={p.id}
                    className="group border-b border-gray-50 last:border-0 hover:bg-[#fafbfa]"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{p.nombre}</p>
                      <p className="text-xs text-gray-500">{p.finca}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      <p>{p.vereda}</p>
                      <p className="text-xs text-gray-400">{p.municipio}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{p.telefono}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${COLOR_PRODUCTOR[p.estado]}`}
                      >
                        {p.estado}
                      </span>
                    </td>
                    {/* RF-10.2 — estatus de políticas de privacidad */}
                    <td className="px-5 py-4">
                      {p.consentimiento ? (
                        <span className="flex items-center gap-1.5 text-agro-green">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-3.5 w-3.5">
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Sí
                        </span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-500">{p.registro}</td>

                    {/* Acciones: aparecen al pasar el mouse por la fila */}
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2 opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
                        {p.estado === 'Registrado' && (
                          <button
                            type="button"
                            onClick={() => setValidandoProductor(p)}
                            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-agro-green px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#194b32]"
                          >
                            {iconoValidar}
                            Validar
                          </button>
                        )}

                        {p.consentimiento ? (
                          <button
                            type="button"
                            onClick={() => setRevocando(p)}
                            className="whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-red-300 hover:text-red-600"
                          >
                            Revocar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => otorgar(p.id)}
                            className="whitespace-nowrap rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-agro-green hover:text-agro-green"
                          >
                            Otorgar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-4 font-medium">Agrónomo</th>
                  <th className="px-5 py-4 font-medium">Tarjeta</th>
                  <th className="px-5 py-4 font-medium">Teléfono</th>
                  <th className="px-5 py-4 font-medium">Estado</th>
                  <th className="px-5 py-4 font-medium">Acreditación</th>
                  <th className="px-5 py-4 font-medium">Resueltos</th>
                  <th className="px-5 py-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {agronomosVisibles.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-sm text-gray-400">
                      No hay agrónomos que coincidan con la búsqueda.
                    </td>
                  </tr>
                )}

                {agronomosVisibles.map((a) => (
                  <tr
                    key={a.id}
                    className="group border-b border-gray-50 last:border-0 hover:bg-[#fafbfa]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-agro-green text-xs font-semibold text-white">
                          {a.iniciales}
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">{a.nombre}</p>
                          <p className="text-xs text-gray-500">{a.especialidad}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-gray-600">{a.tarjeta}</td>
                    <td className="px-5 py-4 text-gray-600">{a.telefono}</td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${COLOR_AGRONOMO[a.estado]}`}
                      >
                        {a.estado}
                      </span>
                    </td>
                    {/* RF-10.4 — binarios de acreditación */}
                    <td className="px-5 py-4">
                      {a.acreditacion ? (
                        <button
                          type="button"
                          className="flex items-center gap-1.5 text-xs text-agro-green hover:underline"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-3.5 w-3.5">
                            <path d="M14 3v5h5" strokeLinejoin="round" />
                            <path d="M19 8v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5Z" strokeLinejoin="round" />
                          </svg>
                          Ver documento
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">Sin cargar</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600">{a.casosResueltos}</td>

                    {/* RF-10.5 — validación humana */}
                    <td className="px-5 py-4">
                      {a.estado === 'Validación pendiente' ? (
                        <div className="flex justify-end opacity-0 transition focus-within:opacity-100 group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => setValidandoAgronomo(a)}
                            className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-agro-green px-3 py-1.5 text-xs font-medium text-white transition hover:bg-[#194b32]"
                          >
                            {iconoValidar}
                            Validar
                          </button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RF-10.3 — confirmación explícita de revocación */}
      {revocando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setRevocando(null)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="px-6 pt-6">
              <h2 className="text-xl font-bold text-gray-900">Revocar consentimiento</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Al revocar el consentimiento de{' '}
                <strong className="text-gray-700">{revocando.nombre}</strong>, el sistema dejará de
                tratar sus datos fotográficos. Las imágenes ya enviadas no podrán usarse para
                reentrenamiento.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 px-6 pb-5 pt-5">
              <button
                type="button"
                onClick={() => setRevocando(null)}
                className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={revocar}
                className="rounded-lg bg-red-500 py-2.5 text-sm font-medium text-white transition hover:bg-red-600"
              >
                Revocar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de validación de cuenta de productor */}
      {validandoProductor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setValidandoProductor(null)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="px-6 pt-6">
              <h2 className="text-xl font-bold text-gray-900">Validar cuenta de productor</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Confirmas que la cuenta de{' '}
                <strong className="text-gray-700">{validandoProductor.nombre}</strong> ha completado
                el proceso de verificación y puede usar el sistema.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 px-6 pb-5 pt-5">
              <button
                type="button"
                onClick={() => setValidandoProductor(null)}
                className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={validarProductor}
                className="flex items-center justify-center gap-2 rounded-lg bg-agro-green py-2.5 text-sm font-medium text-white transition hover:bg-[#194b32]"
              >
                {iconoValidar}
                Validar cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de validación de cuenta de agrónomo */}
      {validandoAgronomo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setValidandoAgronomo(null)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="px-6 pt-6">
              <h2 className="text-xl font-bold text-gray-900">Validar cuenta de agrónomo</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Confirmas que revisaste la acreditación de{' '}
                <strong className="text-gray-700">{validandoAgronomo.nombre}</strong> (tarjeta{' '}
                {validandoAgronomo.tarjeta}) y que puede recibir casos asignados.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 px-6 pb-5 pt-5">
              <button
                type="button"
                onClick={() => setValidandoAgronomo(null)}
                className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={validarAgronomo}
                className="flex items-center justify-center gap-2 rounded-lg bg-agro-green py-2.5 text-sm font-medium text-white transition hover:bg-[#194b32]"
              >
                {iconoValidar}
                Validar cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
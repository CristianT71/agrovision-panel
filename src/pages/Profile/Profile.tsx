import { useState } from 'react'
import { PERFIL, ACCESO, type Perfil } from './mockPerfil'
import { obtenerSesion, calcularIniciales } from '../../auth/session'

/* Iconos de cada fila */
const ICONOS: Record<string, React.ReactNode> = {
  user: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" strokeLinecap="round" />
    </>
  ),
  phone: (
    <path
      d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"
      strokeLinejoin="round"
    />
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3.5 6.5l8.5 6 8.5-6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M7 15h4" strokeLinecap="round" />
    </>
  ),
  shield: (
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
  ),
}

/* Campos editables de la ficha, en el orden en que se muestran */
const CAMPOS: { clave: keyof Perfil; etiqueta: string; icono: keyof typeof ICONOS }[] = [
  { clave: 'nombre', etiqueta: 'Nombre completo', icono: 'user' },
  { clave: 'telefono', etiqueta: 'Teléfono', icono: 'phone' },
  { clave: 'correo', etiqueta: 'Correo electrónico', icono: 'mail' },
  { clave: 'tarjetaProfesional', etiqueta: 'N° tarjeta profesional', icono: 'card' },
  { clave: 'especialidad', etiqueta: 'Especialidad', icono: 'shield' },
]

export default function Profile() {
  const sesion = obtenerSesion()
  const esAdmin = sesion?.rol === 'administrador'

  const [perfil, setPerfil] = useState<Perfil>(PERFIL)
  const [borrador, setBorrador] = useState<Perfil>(PERFIL)
  const [editando, setEditando] = useState(false)

  const iniciales = calcularIniciales(perfil.nombre)

  const abrirEdicion = () => {
    setBorrador(perfil)
    setEditando(true)
  }

  const cancelar = () => {
    setBorrador(perfil)
    setEditando(false)
  }

  // TODO: reemplazar por PATCH /perfil cuando el backend exponga el endpoint
  const guardar = () => {
    setPerfil(borrador)
    setEditando(false)
  }

  const cambiar = (clave: keyof Perfil, valor: string) =>
    setBorrador((prev) => ({ ...prev, [clave]: valor }))

  return (
    <div className="mx-auto max-w-3xl">
      {/* Encabezado */}
      <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
      <p className="mt-1 text-sm text-gray-500">Tu información en el sistema AgroVisión</p>

      {/* ---------- Información personal ---------- */}
      <section className="mt-6 rounded-2xl bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-gray-900">Información personal</h2>
            <p className="mt-0.5 text-sm text-gray-500">Edita tus datos visibles en el sistema</p>
          </div>

          {editando ? (
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={cancelar}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardar}
                className="rounded-xl bg-agro-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#194b32]"
              >
                Guardar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={abrirEdicion}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-agro-green hover:text-agro-green"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
                <path d="M4 20h4l10-10-4-4L4 16v4Z" strokeLinejoin="round" />
                <path d="M14 6l4 4" strokeLinecap="round" />
              </svg>
              Editar
            </button>
          )}
        </div>

        {/* Avatar y rol */}
        <div className="mt-6 flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-agro-green text-2xl font-bold text-white">
            {iniciales}
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-gray-900">{perfil.nombre}</p>
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-[#e8f7ee] px-2.5 py-1 text-xs font-semibold text-agro-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
              </svg>
              {esAdmin ? 'Administrador' : 'Agrónomo profesional'}
            </span>
          </div>
        </div>

        {/* Campos */}
        <dl className="mt-6">
          {CAMPOS.map(({ clave, etiqueta, icono }) => (
            <div key={clave} className="flex gap-3 border-t border-gray-100 py-4">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
              >
                {ICONOS[icono]}
              </svg>
              <div className="min-w-0 flex-1">
                <dt className="text-xs text-gray-400">{etiqueta}</dt>
                <dd className="mt-0.5">
                  {editando ? (
                    <input
                      value={borrador[clave]}
                      onChange={(e) => cambiar(clave, e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:border-agro-green focus:outline-none"
                    />
                  ) : (
                    <span className="font-medium text-gray-900">{perfil[clave]}</span>
                  )}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      {/* ---------- Seguridad de la cuenta ---------- */}
      <section className="mt-5 rounded-2xl bg-white p-6">
        <h2 className="font-semibold text-gray-900">Seguridad de la cuenta</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          El acceso se gestiona mediante OTP al número de celular registrado
        </p>

        {/* RF-01.1 — el ingreso se hace por código OTP */}
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-100 py-4">
          <div className="min-w-0">
            <p className="font-medium text-gray-900">Autenticación por OTP</p>
            <p className="mt-0.5 text-sm text-gray-500">Código enviado a {perfil.telefono}</p>
          </div>
          {ACCESO.otpActiva && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#e8f7ee] px-2.5 py-1 text-xs font-semibold text-agro-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3 w-3">
                <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Activa
            </span>
          )}
        </div>

        <div className="border-t border-gray-100 py-4">
          <p className="font-medium text-gray-900">Último acceso</p>
          <p className="mt-0.5 text-sm text-gray-500">
            {ACCESO.ultimoAcceso} · {ACCESO.ubicacion}
          </p>
        </div>
      </section>
    </div>
  )
}
import { useQuery } from '@tanstack/react-query'
import { obtenerSesion, calcularIniciales } from '../../api/auth/session'
import { agronomosService, clavesAgronomos, type PerfilAgronomo } from '../../api/agronomos/agronomos.service'
import { mensajeDeError } from '../../api/axios'

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
  shield: <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" strokeLinecap="round" />
    </>
  ),
  inbox: (
    <>
      <path d="M3 12h4l2 3h6l2-3h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 5h14l2 7v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5l2-7Z" strokeLinejoin="round" />
    </>
  ),
}

/* Datos del agrónomo, en el orden en que se muestran */
const CAMPOS: { etiqueta: string; icono: keyof typeof ICONOS; valor: (p: PerfilAgronomo) => string }[] = [
  { etiqueta: 'Nombre completo', icono: 'user', valor: (p) => p.nombre },
  { etiqueta: 'Teléfono', icono: 'phone', valor: (p) => p.telefono },
  { etiqueta: 'Correo electrónico', icono: 'mail', valor: (p) => p.correo },
  { etiqueta: 'N° tarjeta profesional', icono: 'card', valor: (p) => p.tarjetaProfesional },
  { etiqueta: 'Especialidad', icono: 'shield', valor: (p) => p.especialidad },
  { etiqueta: 'Fecha de alta', icono: 'calendar', valor: (p) => new Date(p.fechaAlta).toLocaleDateString('es-CO') },
  { etiqueta: 'Casos activos asignados', icono: 'inbox', valor: (p) => String(p.casosActivos) },
]

export default function Profile() {
  const sesion = obtenerSesion()
  const esAdmin = sesion?.rol === 'administrador'

  // La cuenta de administrador no tiene ficha de agrónomo: solo se muestra su sesión
  const perfil = useQuery({
    queryKey: clavesAgronomos.miPerfil,
    queryFn: () => agronomosService.miPerfil(),
    enabled: !esAdmin,
  })

  const nombre = perfil.data?.nombre ?? sesion?.nombre ?? 'Usuario'
  const telefono = perfil.data?.telefono ?? sesion?.telefono ?? ''

  return (
    <div className="mx-auto max-w-3xl">
      {/* Encabezado */}
      <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>
      <p className="mt-1 text-sm text-gray-500">Tu información en el sistema AgroVisión</p>

      {/* ---------- Información personal ---------- */}
      <section className="mt-6 rounded-2xl bg-white p-6">
        <div>
          <h2 className="font-semibold text-gray-900">Información personal</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {esAdmin
              ? 'Cuenta de coordinación del sistema'
              : 'Registrada en tu solicitud de acceso. Para corregirla, contacta al administrador.'}
          </p>
        </div>

        {/* Avatar y rol */}
        <div className="mt-6 flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-agro-green text-2xl font-bold text-white">
            {calcularIniciales(nombre)}
          </div>
          <div className="min-w-0">
            <p className="text-xl font-bold text-gray-900">{nombre}</p>
            <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-[#e8f7ee] px-2.5 py-1 text-xs font-semibold text-agro-green">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" strokeLinejoin="round" />
              </svg>
              {esAdmin ? 'Administrador' : 'Agrónomo profesional'}
            </span>
          </div>
        </div>

        {/* Campos */}
        {esAdmin ? (
          <dl className="mt-6">
            <Fila etiqueta="Teléfono" icono="phone" valor={telefono} />
          </dl>
        ) : perfil.isPending ? (
          <p className="mt-6 text-sm text-gray-400">Cargando perfil...</p>
        ) : perfil.isError ? (
          <p className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {mensajeDeError(perfil.error, 'No se pudo cargar tu perfil.')}
          </p>
        ) : (
          <dl className="mt-6">
            {CAMPOS.map(({ etiqueta, icono, valor }) => (
              <Fila key={etiqueta} etiqueta={etiqueta} icono={icono} valor={valor(perfil.data)} />
            ))}
          </dl>
        )}
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
            <p className="mt-0.5 text-sm text-gray-500">Código enviado a {telefono}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-[#e8f7ee] px-2.5 py-1 text-xs font-semibold text-agro-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-3 w-3">
              <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Activa
          </span>
        </div>

        {/* RNF-02.2 */}
        <div className="border-t border-gray-100 py-4">
          <p className="font-medium text-gray-900">Duración de la sesión</p>
          <p className="mt-0.5 text-sm text-gray-500">
            Por seguridad, la sesión se cierra automáticamente a los 30 minutos
          </p>
        </div>
      </section>
    </div>
  )
}

function Fila({ etiqueta, icono, valor }: { etiqueta: string; icono: keyof typeof ICONOS; valor: string }) {
  return (
    <div className="flex gap-3 border-t border-gray-100 py-4">
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
        <dd className="mt-0.5 font-medium text-gray-900">{valor}</dd>
      </div>
    </div>
  )
}

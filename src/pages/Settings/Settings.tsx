import { useState, useRef } from 'react'
import Toggle from '../../components/Toggle/Toggle'

import {
  AJUSTES,
  IDIOMAS,
  ZONAS_HORARIAS,
  RETENCIONES,
  RETENCION_AUDITORIA,
  SISTEMA,
  type Ajustes,
} from './mockAjustes'

/* Iconos de los subgrupos */
const ICONOS = {
  globo: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 9h17M3.5 15h17" strokeLinecap="round" />
      <path d="M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" strokeLinejoin="round" />
    </>
  ),
  reloj: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  campana: (
    <>
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" strokeLinecap="round" />
    </>
  ),
  base: (
    <>
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" strokeLinecap="round" />
      <path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" strokeLinecap="round" />
    </>
  ),
  documento: (
    <>
      <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M14 3v4h4M8.5 13h7M8.5 17h4" strokeLinecap="round" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 8h.01" strokeLinecap="round" />
    </>
  ),
}

export default function Settings() {
  const [ajustes, setAjustes] = useState<Ajustes>(AJUSTES)
  const [guardado, setGuardado] = useState(false)
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined)

  // TODO: reemplazar por PATCH /ajustes cuando el backend exponga el endpoint
  const cambiar = <C extends keyof Ajustes>(clave: C, valor: Ajustes[C]) => {
    setAjustes((prev) => ({ ...prev, [clave]: valor }))

    // Muestra el aviso y lo oculta 2.5 s después del último cambio
    setGuardado(true)
    clearTimeout(temporizador.current)
    temporizador.current = setTimeout(() => setGuardado(false), 2500)
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Encabezado */}
      <h1 className="text-2xl font-bold text-gray-900">Ajustes del sistema</h1>
      <p className="mt-1 text-sm text-gray-500">Configuración global de la plataforma AgroVisión</p>

      {/* Aviso de guardado */}
      {guardado && (
        <div
          role="status"
          className="mt-5 flex items-center gap-2.5 rounded-xl bg-[#dcf4e4] px-4 py-3 text-sm font-semibold text-agro-green"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4 shrink-0">
            <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Configuración guardada
        </div>
      )}

      {/* ---------- Idioma y región ---------- */}
      <Tarjeta
        titulo="Idioma y región"
        descripcion="Localización de fechas, números y textos del sistema"
      >
        <Subgrupo icono="globo" titulo="Localización" />
        <Fila etiqueta="Idioma de la interfaz">
          <Selector
            valor={ajustes.idioma}
            opciones={IDIOMAS}
            onChange={(v) => cambiar('idioma', v)}
          />
        </Fila>

        <Subgrupo icono="reloj" titulo="Zona horaria" />
        <Fila etiqueta="Zona horaria del servidor">
          <Selector
            valor={ajustes.zonaHoraria}
            opciones={ZONAS_HORARIAS}
            onChange={(v) => cambiar('zonaHoraria', v)}
          />
        </Fila>
      </Tarjeta>

      {/* ---------- Notificaciones — RF-02.5 ---------- */}
      <Tarjeta
        titulo="Notificaciones del sistema"
        descripcion="Canales y eventos para los que recibes alertas"
      >
        <Subgrupo icono="campana" titulo="Canales" />
        <Fila etiqueta="Notificaciones push (navegador)">
          <Toggle
            activo={ajustes.pushNavegador}
            onChange={(v) => cambiar('pushNavegador', v)}
            etiqueta="Notificaciones push"
          />
        </Fila>
        <Fila etiqueta="Notificaciones por correo">
          <Toggle
            activo={ajustes.correo}
            onChange={(v) => cambiar('correo', v)}
            etiqueta="Notificaciones por correo"
          />
        </Fila>

        <p className="pt-5 text-sm text-gray-700">Eventos</p>
        <Fila etiqueta="Nuevas solicitudes asignadas" nota="Al recibir un caso para revisar">
          <Toggle
            activo={ajustes.nuevasSolicitudes}
            onChange={(v) => cambiar('nuevasSolicitudes', v)}
            etiqueta="Nuevas solicitudes asignadas"
          />
        </Fila>
      </Tarjeta>

      {/* ---------- Retención de datos ---------- */}
      <Tarjeta
        titulo="Retención de datos"
        descripcion="Por cuánto tiempo se almacenan las solicitudes y logs de actividad"
      >
        <Subgrupo icono="base" titulo="Políticas de almacenamiento" />
        <Fila etiqueta="Retención de solicitudes">
          <Selector
            valor={ajustes.retencionSolicitudes}
            opciones={RETENCIONES}
            onChange={(v) => cambiar('retencionSolicitudes', v)}
          />
        </Fila>
        {/* RNF-01.2 — retención mínima de 2 años, no editable */}
        <Fila etiqueta="Retención de logs de auditoría">
          <span className="text-sm text-gray-500">{RETENCION_AUDITORIA}</span>
        </Fila>
      </Tarjeta>

      {/* ---------- Auditoría ---------- */}
      <Tarjeta titulo="Auditoría y cumplimiento">
        <button
          type="button"
          className="group mt-2 flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition hover:bg-[#f5faf7]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-4 w-4 shrink-0 text-gray-400"
          >
            {ICONOS.documento}
          </svg>
          <span className="min-w-0 flex-1">
            <span className="block font-medium text-gray-900">Log de auditoría</span>
            <span className="block text-sm text-gray-500">
              Historial completo de acciones en el sistema
            </span>
          </span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4 shrink-0 text-gray-300 transition group-hover:text-agro-green"
          >
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </Tarjeta>

      {/* ---------- Información del sistema ---------- */}
      <section className="mt-5 rounded-2xl bg-white p-6">
        <h2 className="flex items-center gap-2 font-semibold text-gray-900">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-4 w-4 text-gray-400"
          >
            {ICONOS.info}
          </svg>
          Información del sistema
        </h2>

        <dl className="mt-4">
          {SISTEMA.map(({ etiqueta, valor }) => (
            <div
              key={etiqueta}
              className="flex items-center justify-between gap-4 border-t border-gray-100 py-3"
            >
              <dt className="text-sm text-gray-600">{etiqueta}</dt>
              <dd className="text-sm font-medium text-gray-900">{valor}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

/* ---------- Piezas de la pantalla ---------- */

function Tarjeta({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-5 rounded-2xl bg-white p-6">
      <h2 className="font-semibold text-gray-900">{titulo}</h2>
      {descripcion && <p className="mt-0.5 text-sm text-gray-500">{descripcion}</p>}
      {children}
    </section>
  )
}

function Subgrupo({ icono, titulo }: { icono: keyof typeof ICONOS; titulo: string }) {
  return (
    <div className="flex items-center gap-2.5 pt-5">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-4 w-4 shrink-0 text-gray-400"
      >
        {ICONOS[icono]}
      </svg>
      <p className="text-sm text-gray-700">{titulo}</p>
    </div>
  )
}

function Fila({
  etiqueta,
  nota,
  children,
}: {
  etiqueta: string
  nota?: string
  children: React.ReactNode
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-4 border-t border-gray-100 pt-4">
      <div className="min-w-0">
        <p className="text-sm text-gray-800">{etiqueta}</p>
        {nota && <p className="mt-0.5 text-xs text-gray-500">{nota}</p>}
      </div>
      {children}
    </div>
  )
}

function Selector({
  valor,
  opciones,
  onChange,
}: {
  valor: string
  opciones: string[]
  onChange: (valor: string) => void
}) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="shrink-0 rounded-lg border border-transparent bg-transparent py-1 pl-2 pr-1 text-sm font-medium text-agro-green transition hover:border-gray-200 focus:border-agro-green focus:outline-none"
    >
      {opciones.map((o) => (
        <option key={o} value={o} className="text-gray-800">
          {o}
        </option>
      ))}
    </select>
  )
}
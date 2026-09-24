import type { ReactNode } from 'react'
import { ICONOS, type NombreIcono } from './iconosAjustes'

export function Tarjeta({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion?: string
  children: ReactNode
}) {
  return (
    <section className="mt-5 rounded-2xl bg-white p-6">
      <h2 className="font-semibold text-gray-900">{titulo}</h2>
      {descripcion && <p className="mt-0.5 text-sm text-gray-500">{descripcion}</p>}
      {children}
    </section>
  )
}

export function Subgrupo({ icono, titulo }: { icono: NombreIcono; titulo: string }) {
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

export function Fila({
  etiqueta,
  nota,
  children,
}: {
  etiqueta: string
  nota?: string
  children: ReactNode
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

export function Selector({
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

export function AvisoGuardado() {
  return (
    <div
      role="status"
      className="mt-5 flex items-center gap-2.5 rounded-xl bg-[#dcf4e4] px-4 py-3 text-sm font-semibold text-agro-green"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4 shrink-0">
        <path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Configuración guardada
    </div>
  )
}

export function InfoSistema({ datos }: { datos: { etiqueta: string; valor: string }[] }) {
  return (
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
        {datos.map(({ etiqueta, valor }) => (
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
  )
}

export function LogAuditoria({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
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
  )
}
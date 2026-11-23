import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Fila, Tarjeta } from './SettingsUI'
import { POLITICA_INTRO, POLITICA_SECCIONES, VERSION_POLITICA_DATOS } from './politicaDatos'

// Habeas data — el administrador ve el mismo texto que acepta el productor en la app
export default function PoliticaDatosTarjeta() {
  const [abierta, setAbierta] = useState(false)

  return (
    <Tarjeta
      titulo="Política de tratamiento de datos"
      descripcion="Lo que el productor autoriza al crear su cuenta en la app (Ley 1581 de 2012)"
    >
      <Fila etiqueta="Versión vigente" nota="Si cambia el texto se sube la versión y la app vuelve a pedir la aceptación">
        <span className="rounded-md bg-[#e8f7ee] px-2 py-0.5 text-xs font-medium text-agro-green">
          v{VERSION_POLITICA_DATOS}
        </span>
      </Fila>
      <Fila etiqueta="Responsable del tratamiento">
        <span className="text-sm text-gray-500">SENA</span>
      </Fila>
      <Fila etiqueta="Quién la aceptó" nota="Cuentas › Productores, columna «Política de datos»">
        <Link to="/cuentas" className="text-sm text-agro-green hover:underline">
          Ver cuentas
        </Link>
      </Fila>

      <div className="mt-4 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          aria-expanded={abierta}
          className="flex w-full items-center justify-between text-sm font-medium text-gray-800"
        >
          {abierta ? 'Ocultar el texto completo' : 'Leer el texto completo'}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`h-4 w-4 text-gray-400 transition ${abierta ? 'rotate-180' : ''}`}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {abierta && (
          <div className="mt-4 space-y-5 text-sm leading-relaxed text-gray-600">
            <p>{POLITICA_INTRO}</p>
            {POLITICA_SECCIONES.map((s) => (
              <section key={s.titulo}>
                <h3 className="font-medium text-gray-900">{s.titulo}</h3>
                {s.lineas.length > 1 ? (
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {s.lineas.map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1">{s.lineas[0]}</p>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </Tarjeta>
  )
}

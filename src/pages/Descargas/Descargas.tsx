import { useEffect, useState, type ReactNode } from 'react'

// Página pública de descarga de la app (agrovision.sbs/descargas). No está enlazada desde ningún menú
// del panel: solo la conoce quien recibe el enlace. El APK y su version.json los publica el servidor en
// /descargas/archivos/, así una versión nueva no obliga a recompilar el panel.
const RUTA_APK = '/descargas/archivos/CoffeeCheck.apk'
const RUTA_VERSION = '/descargas/archivos/version.json'

type InfoVersion = {
  version: string
  fecha: string
  tamanoMb: number
  notas?: string
}

function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  // '2026-11-22' llega como medianoche UTC: sin fijar la zona horaria, en Colombia saldría un día antes
  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

function IconoDescarga() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  )
}

function Caracteristica({ icono, titulo, texto }: { icono: ReactNode; titulo: string; texto: string }) {
  return (
    <li className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#8fd14f]/15 text-[#a6e06a]">
        {icono}
      </span>
      <div>
        <h3 className="font-semibold text-white">{titulo}</h3>
        <p className="mt-1 text-sm leading-relaxed text-white/70">{texto}</p>
      </div>
    </li>
  )
}

function Paso({ numero, titulo, texto }: { numero: number; titulo: string; texto: string }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-agro-green text-sm font-bold text-white">
        {numero}
      </span>
      <div>
        <p className="font-medium text-gray-900">{titulo}</p>
        <p className="mt-0.5 text-sm text-gray-600">{texto}</p>
      </div>
    </li>
  )
}

const iconoProps = {
  viewBox: '0 0 24 24',
  className: 'h-5 w-5',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export default function Descargas() {
  const [info, setInfo] = useState<InfoVersion | null>(null)
  const [sinArchivo, setSinArchivo] = useState(false)
  // Sin navegador (pruebas) se asume Android para no mostrar el aviso
  const [esAndroid] = useState(() => typeof navigator === 'undefined' || /Android/i.test(navigator.userAgent))

  useEffect(() => {
    document.title = 'Descargar CoffeeCheck para Android'
    // Que los buscadores no la listen: es un enlace para compartir, no una página del sitio
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => {
      document.head.removeChild(meta)
    }
  }, [])

  useEffect(() => {
    const controlador = new AbortController()
    fetch(RUTA_VERSION, { signal: controlador.signal, cache: 'no-cache' })
      .then((respuesta) => (respuesta.ok ? (respuesta.json() as Promise<InfoVersion>) : Promise.reject(new Error())))
      .then(setInfo)
      .catch((error: unknown) => {
        if ((error as { name?: string }).name !== 'AbortError') setSinArchivo(true)
      })
    return () => controlador.abort()
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#10301f] text-white">
      {/* Fondo: degradado verde con halos suaves, en la línea del panel */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#10301f] via-[#1b4d35] to-[#2f7a4d]" />
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#8fd14f]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-10 sm:px-8 lg:py-16">
        {/* Encabezado */}
        <header className="flex items-center gap-4">
          <img
            src="/logo-coffecheck.png"
            alt="CoffeeCheck"
            width={64}
            height={64}
            className="h-16 w-16 rounded-2xl shadow-lg shadow-black/30 ring-1 ring-white/15"
          />
          <div>
            <p className="text-2xl font-bold leading-tight tracking-tight">CoffeeCheck</p>
            <p className="text-sm text-white/65">La app del caficultor · Android</p>
          </div>
        </header>

        {/* Presentación y descarga */}
        <main className="mt-12 grid flex-1 items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <section>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Diagnostica tu cafetal
              <span className="block text-[#a6e06a]">con una foto.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
              Toma una foto de la hoja de café y CoffeeCheck te dice qué tiene, aunque no haya internet. Si no está
              segura, un agrónomo la revisa y te responde.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              {sinArchivo ? (
                <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-5 py-3 text-sm text-amber-100">
                  Todavía no hay una versión disponible para descargar. Vuelve a intentarlo más tarde.
                </p>
              ) : (
                <a
                  href={RUTA_APK}
                  download
                  className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#a6e06a] px-7 py-4 text-base font-bold text-[#10301f] shadow-lg shadow-black/25 transition hover:bg-[#b9ee82] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#a6e06a]/40"
                >
                  <IconoDescarga />
                  Descargar para Android
                </a>
              )}
            </div>

            {/* Datos de la versión */}
            <ul className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-white/80">
              <li className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Android 5.1 o superior</li>
              {info && (
                <>
                  <li className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Versión {info.version}</li>
                  <li className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">{info.tamanoMb} MB</li>
                  <li className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">
                    {formatearFecha(info.fecha)}
                  </li>
                </>
              )}
            </ul>

            {!esAndroid && (
              <p className="mt-5 max-w-xl rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/80">
                Para instalarla, abre esta misma dirección desde tu celular Android.
              </p>
            )}
            {info?.notas && <p className="mt-5 max-w-xl text-sm text-white/65">{info.notas}</p>}
          </section>

          {/* Cómo instalarla */}
          <aside className="rounded-3xl bg-white p-7 text-gray-900 shadow-2xl shadow-black/30 sm:p-8">
            <h2 className="text-lg font-bold text-agro-green">Cómo instalarla</h2>
            <ol className="mt-5 space-y-5">
              <Paso numero={1} titulo="Descarga el archivo" texto="Toca el botón desde tu celular. Se guarda como CoffeeCheck.apk." />
              <Paso
                numero={2}
                titulo="Ábrelo"
                texto="Si Android pregunta, permite instalar aplicaciones desde este navegador."
              />
              <Paso numero={3} titulo="Instala y abre CoffeeCheck" texto="Pulsa Instalar y, al terminar, Abrir." />
            </ol>
            <p className="mt-6 rounded-xl bg-gray-50 p-4 text-xs leading-relaxed text-gray-500">
              Es una versión de pruebas fuera de Google Play, por eso Android muestra un aviso antes de instalarla. El
              modelo de inteligencia artificial se actualiza solo la primera vez que abres la app con internet.
            </p>
          </aside>
        </main>

        {/* Qué hace */}
        <section className="mt-14" aria-label="Qué hace CoffeeCheck">
          <ul className="grid gap-4 md:grid-cols-3">
            <Caracteristica
              icono={
                <svg {...iconoProps}>
                  <path d="M5 12.5a10 10 0 0 1 14 0" />
                  <path d="M8.5 16a5 5 0 0 1 7 0" />
                  <path d="M12 19.5h.01" />
                  <path d="m3 3 18 18" />
                </svg>
              }
              titulo="Funciona sin internet"
              texto="El diagnóstico corre en tu celular, en plena finca. Los casos pendientes se envían cuando vuelve la señal."
            />
            <Caracteristica
              icono={
                <svg {...iconoProps}>
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
              }
              titulo="Un agrónomo revisa lo que no se reconoce"
              texto="Si la app duda, no inventa: envía tus fotos y la ubicación (solo si lo autorizas) a un profesional."
            />
            <Caracteristica
              icono={
                <svg {...iconoProps}>
                  <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
                  <path d="M8 8h8M8 12h8M8 16h5" />
                </svg>
              }
              titulo="Catálogo de plagas y enfermedades"
              texto="Fichas con síntomas, partes de la planta afectadas y recomendaciones avaladas por agrónomos."
            />
          </ul>
        </section>

        {/* Pie */}
        <footer className="mt-14 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/55">
          <p>
            CoffeeCheck hace parte del proyecto AgroVisión · SENA, Centro de Gestión y Desarrollo Sostenible
            Surcolombiano, Pitalito (Huila). Es una ayuda para el caficultor y no reemplaza el concepto de un
            agrónomo.
          </p>
        </footer>
      </div>
    </div>
  )
}

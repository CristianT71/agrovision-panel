import { useEffect, useState, type ReactNode } from 'react'

// Página pública de descarga de la app (agrovision.sbs/descargas). No está enlazada desde ningún menú
// del panel: solo la conoce quien recibe el enlace. El APK y su version.json los publica el servidor en
// /descargas/archivos/, así una versión nueva no obliga a recompilar el panel.
// Mismo lenguaje visual del panel: fondo #f7faf8, tarjetas blancas redondeadas y el verde solo como acento.
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

const iconoProps = {
  viewBox: '0 0 24 24',
  className: 'h-5 w-5',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-gray-400">{etiqueta}</dt>
      <dd className="mt-1 text-sm font-medium text-gray-900">{valor}</dd>
    </div>
  )
}

function Caracteristica({ icono, titulo, texto }: { icono: ReactNode; titulo: string; texto: string }) {
  return (
    <li className="rounded-2xl bg-white p-6">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4f0] text-agro-green">
        {icono}
      </span>
      <h3 className="mt-4 font-semibold text-gray-900">{titulo}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{texto}</p>
    </li>
  )
}

function Paso({ numero, titulo, texto }: { numero: number; titulo: string; texto: string }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef4f0] text-sm font-semibold text-agro-green">
        {numero}
      </span>
      <div>
        <p className="font-medium text-gray-900">{titulo}</p>
        <p className="mt-0.5 text-sm text-gray-500">{texto}</p>
      </div>
    </li>
  )
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
    <div className="min-h-screen bg-[#f7faf8] text-gray-900">
      {/* Barra superior, como la del panel */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-4 sm:px-8">
          <img src="/logo-coffecheck.png" alt="CoffeeCheck" width={40} height={40} className="h-10 w-10 rounded-xl" />
          <div className="leading-tight">
            <p className="font-bold text-gray-900">CoffeeCheck</p>
            <p className="text-xs text-gray-500">La app del caficultor</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Presentación y descarga */}
        <main className="rounded-2xl bg-white p-6 sm:p-10">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_auto] md:gap-12">
            <div>
              <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
                Diagnostica tu cafetal con una foto
              </h1>
              <p className="mt-4 max-w-xl leading-relaxed text-gray-500">
                Toma una foto de la hoja de café y CoffeeCheck te dice qué tiene, aunque no haya internet. Si no está
                segura, un agrónomo la revisa y te responde.
              </p>

              <div className="mt-7">
                {sinArchivo ? (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    Todavía no hay una versión disponible para descargar. Vuelve a intentarlo más tarde.
                  </p>
                ) : (
                  <a
                    href={RUTA_APK}
                    download
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f5f3f] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#194b32] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1f5f3f]/40 sm:w-auto"
                  >
                    <svg {...iconoProps}>
                      <path d="M12 4v11" />
                      <path d="m7.5 11 4.5 4.5 4.5-4.5" />
                      <path d="M5 20h14" />
                    </svg>
                    Descargar para Android
                  </a>
                )}
              </div>

              {!esAndroid && (
                <p className="mt-4 text-sm text-gray-500">
                  Para instalarla, abre esta misma dirección desde tu celular Android.
                </p>
              )}
              {info?.notas && <p className="mt-4 text-sm text-gray-500">{info.notas}</p>}
            </div>

            <img
              src="/logo-coffecheck.png"
              alt=""
              width={160}
              height={160}
              className="hidden h-40 w-40 rounded-3xl shadow-sm ring-1 ring-gray-100 md:block"
            />
          </div>

          {/* Datos de la versión */}
          <dl className="mt-8 grid grid-cols-2 gap-5 border-t border-gray-100 pt-6 sm:grid-cols-4">
            <Dato etiqueta="Versión" valor={info?.version ?? '—'} />
            <Dato etiqueta="Tamaño" valor={info ? `${info.tamanoMb} MB` : '—'} />
            <Dato etiqueta="Actualizada" valor={info ? formatearFecha(info.fecha) : '—'} />
            <Dato etiqueta="Requiere" valor="Android 5.1 o superior" />
          </dl>
        </main>

        {/* Qué hace */}
        <section className="mt-5" aria-label="Qué hace CoffeeCheck">
          <ul className="grid gap-5 md:grid-cols-3">
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

        {/* Cómo instalarla */}
        <section className="mt-5 rounded-2xl bg-white p-6 sm:p-8" aria-label="Cómo instalarla">
          <h2 className="font-semibold text-gray-900">Cómo instalarla</h2>
          <p className="mt-1 text-sm text-gray-500">Tres pasos desde tu celular.</p>
          <ol className="mt-6 grid gap-6 md:grid-cols-3">
            <Paso numero={1} titulo="Descarga el archivo" texto="Toca el botón de arriba. Se guarda como CoffeeCheck.apk." />
            <Paso
              numero={2}
              titulo="Ábrelo"
              texto="Si Android pregunta, permite instalar aplicaciones desde este navegador."
            />
            <Paso numero={3} titulo="Instala y abre la app" texto="Pulsa Instalar y, al terminar, Abrir." />
          </ol>
          <p className="mt-6 rounded-xl bg-[#f7faf8] px-4 py-3 text-xs leading-relaxed text-gray-500">
            Es una versión de pruebas fuera de Google Play, por eso Android muestra un aviso antes de instalarla. El
            modelo de inteligencia artificial se actualiza solo la primera vez que abres la app con internet.
          </p>
        </section>

        {/* Pie */}
        <footer className="mt-8 text-center text-xs leading-relaxed text-gray-400">
          CoffeeCheck hace parte del proyecto AgroVisión · SENA, Centro de Gestión y Desarrollo Sostenible
          Surcolombiano, Pitalito (Huila). Es una ayuda para el caficultor y no reemplaza el concepto de un agrónomo.
        </footer>
      </div>
    </div>
  )
}

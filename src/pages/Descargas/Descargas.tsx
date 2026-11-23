import { useEffect, useState } from 'react'

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
  return fecha.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Descargas() {
  const [info, setInfo] = useState<InfoVersion | null>(null)
  const [sinArchivo, setSinArchivo] = useState(false)

  useEffect(() => {
    document.title = 'Descargar CoffeeCheck'
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
    <div className="min-h-screen bg-gradient-to-br from-[#1b4d35] to-[#3d8a57] px-4 py-10 text-gray-900">
      <main className="mx-auto w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <img src="/logo-agrovision.png" alt="AgroVisión" className="h-14 w-14 object-contain" />
          <div>
            <h1 className="text-2xl font-bold leading-tight text-agro-green">CoffeeCheck</h1>
            <p className="text-sm text-gray-500">La app del caficultor · Android</p>
          </div>
        </div>

        <p className="mt-6 text-gray-700">
          Toma una foto de la hoja de café y la app te dice qué tiene, aunque no haya internet. Si no está segura, un
          agrónomo la revisa y te responde.
        </p>

        {info && (
          <p className="mt-5 text-sm text-gray-500">
            Versión {info.version} · {formatearFecha(info.fecha)} · {info.tamanoMb} MB
          </p>
        )}

        {sinArchivo ? (
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            Todavía no hay una versión disponible para descargar. Vuelve a intentarlo más tarde.
          </p>
        ) : (
          <a
            href={RUTA_APK}
            download
            className="mt-4 flex w-full items-center justify-center rounded-lg bg-agro-green px-4 py-3 font-semibold text-white transition hover:bg-[#184d33]"
          >
            Descargar para Android
          </a>
        )}

        {info?.notas && <p className="mt-4 text-sm text-gray-600">{info.notas}</p>}

        <section className="mt-8">
          <h2 className="text-base font-semibold text-gray-900">Cómo instalarla</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-gray-700">
            <li>Descarga el archivo desde este celular.</li>
            <li>Ábrelo. Si Android pregunta, permite instalar aplicaciones desde este navegador.</li>
            <li>Pulsa Instalar y abre CoffeeCheck.</li>
          </ol>
          <p className="mt-3 text-xs text-gray-500">Funciona en Android 5.1 o superior.</p>
        </section>

        <p className="mt-8 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
          Versión de pruebas del proyecto AgroVisión (SENA, Pitalito). Es una ayuda para el caficultor y no reemplaza
          el concepto de un agrónomo.
        </p>
      </main>
    </div>
  )
}

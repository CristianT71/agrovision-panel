import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  clavesSolicitudes,
  solicitudesService,
  type AnexoResolucion,
} from '../../api/solicitudes/solicitudes.service'
import { mensajeDeError } from '../../api/axios'
import { tamanoLegible } from '../../utils/archivos'

/* RF-04.6 — anexos de una resolución ya confirmada */
export default function AnexosLectura({ solicitudId }: { solicitudId: string }) {
  const anexos = useQuery({
    queryKey: clavesSolicitudes.anexos(solicitudId),
    queryFn: () => solicitudesService.listarAnexos(solicitudId),
  })
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null)

  if (!anexos.data || anexos.data.length === 0) return null

  const descargar = async (anexo: AnexoResolucion) => {
    setErrorDescarga(null)
    try {
      await solicitudesService.descargarAnexo(solicitudId, anexo)
    } catch (error) {
      setErrorDescarga(mensajeDeError(error, 'No se pudo descargar el anexo.'))
    }
  }

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-[#2f6b4a]">Anexos</p>
      <ul className="mt-1.5 space-y-1.5">
        {anexos.data.map((a) => (
          <li key={a.id}>
            <button
              type="button"
              onClick={() => descargar(a)}
              className="flex items-center gap-2 text-xs text-agro-green hover:underline"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
                <path d="M12 4v11M7 10l5 5 5-5M5 20h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {a.nombreOriginal}
              <span className="text-[#4a8563]">· {tamanoLegible(a.tamanoBytes)}</span>
            </button>
          </li>
        ))}
      </ul>
      {errorDescarga && <p className="mt-1 text-xs text-red-600">{errorDescarga}</p>}
    </div>
  )
}

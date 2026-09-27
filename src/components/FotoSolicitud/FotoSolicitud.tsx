import { useQuery } from '@tanstack/react-query'
import { clavesSolicitudes, solicitudesService } from '../../api/solicitudes/solicitudes.service'
import { blobADataUrl } from '../../api/descargas'

type Props = {
  solicitudId: string
  fotoId: string
  alt: string
  className?: string
}

// Las fotos de las solicitudes son privadas: un <img src="..."> no puede enviar el token, así que
// se descargan con axios (que sí lo envía) y se convierten en una data URL que la imagen sí puede mostrar.
export default function FotoSolicitud({ solicitudId, fotoId, alt, className = '' }: Props) {
  const imagen = useQuery({
    queryKey: clavesSolicitudes.foto(solicitudId, fotoId),
    queryFn: async () => blobADataUrl(await solicitudesService.descargarFoto(solicitudId, fotoId)),
    // Una foto subida no cambia: no hace falta volver a descargarla mientras siga en caché
    staleTime: Infinity,
  })

  if (imagen.isError) {
    return <Marcador className={className} texto="No se pudo cargar" />
  }

  if (!imagen.data) {
    return <div className={`animate-pulse bg-gray-100 ${className}`} aria-label="Cargando foto" />
  }

  return <img src={imagen.data} alt={alt} className={`object-cover ${className}`} />
}

export function Marcador({ className = '', texto }: { className?: string; texto?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-1 bg-gray-100 text-gray-300 ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-8 w-8">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.8" />
        <path d="M21 16l-5-5-8 8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {texto && <span className="px-2 text-center text-[11px] text-gray-400">{texto}</span>}
    </div>
  )
}

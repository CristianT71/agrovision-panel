import { useQuery } from '@tanstack/react-query'
import { clavesSolicitudes, solicitudesService } from '../../api/solicitudes/solicitudes.service'
import FotoSolicitud, { Marcador } from './FotoSolicitud'

// RF-03.6 — imagen de evidencia en las bandejas: la primera foto que la app ya terminó de subir
export default function MiniaturaSolicitud({ solicitudId }: { solicitudId: string }) {
  const fotos = useQuery({
    queryKey: clavesSolicitudes.fotos(solicitudId),
    queryFn: () => solicitudesService.listarFotos(solicitudId),
  })

  const clase = 'h-16 w-16 shrink-0 rounded-lg'
  const primera = fotos.data?.find((f) => f.subida)

  if (fotos.isPending) {
    return <div className={`animate-pulse bg-gray-100 ${clase}`} />
  }

  if (!primera) {
    return <Marcador className={clase} />
  }

  return <FotoSolicitud solicitudId={solicitudId} fotoId={primera.id} alt="Evidencia" className={clase} />
}

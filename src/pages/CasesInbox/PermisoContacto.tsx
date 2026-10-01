import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { clavesPermisosContacto, permisosContactoService } from '../../api/permisos-contacto/permisos-contacto.service'
import type { Solicitud } from '../../api/solicitudes/solicitudes.service'
import { mensajeDeError } from '../../api/axios'
import Toggle from '../../components/Toggle/Toggle'
import { formatearFechaHora } from '../../utils/fechas'

// RF-08.8 — el administrador otorga o extingue el contacto directo productor-evaluador del caso
export default function PermisoContacto({ solicitud }: { solicitud: Solicitud }) {
  const queryClient = useQueryClient()

  const consulta = useQuery({
    queryKey: clavesPermisosContacto.permiso(solicitud.id),
    queryFn: () => permisosContactoService.obtener(solicitud.id),
  })

  const cambiar = useMutation({
    mutationFn: (habilitar: boolean) =>
      habilitar ? permisosContactoService.otorgar(solicitud.id) : permisosContactoService.revocar(solicitud.id),
    onSuccess: (permiso) => queryClient.setQueryData(clavesPermisosContacto.permiso(solicitud.id), permiso),
  })

  const permiso = consulta.data
  const habilitado = permiso?.habilitado ?? false
  const cerrada = solicitud.estado === 'Resuelta' || solicitud.estado === 'Descartada'

  // Revocar siempre se puede (protege al productor); otorgar exige un caso abierto con agrónomo
  const puedeOtorgar = !!solicitud.agronomoId && !cerrada
  const deshabilitado = consulta.isPending || cambiar.isPending || (!habilitado && !puedeOtorgar)

  return (
    <div className="border-b border-gray-100 px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-800">Contacto directo con productor</p>
          <p className="text-xs text-gray-500">{descripcion(solicitud, habilitado, puedeOtorgar, permiso?.fechaOtorgado)}</p>
        </div>
        <Toggle
          activo={habilitado}
          onChange={(valor) => cambiar.mutate(valor)}
          etiqueta={habilitado ? 'Retirar contacto directo' : 'Habilitar contacto directo'}
          disabled={deshabilitado}
        />
      </div>

      {(consulta.isError || cambiar.isError) && (
        <p className="mt-2 text-xs text-red-600">
          {mensajeDeError(consulta.error ?? cambiar.error, 'No se pudo actualizar el permiso de contacto.')}
        </p>
      )}
    </div>
  )
}

function descripcion(
  solicitud: Solicitud,
  habilitado: boolean,
  puedeOtorgar: boolean,
  fechaOtorgado: string | null | undefined,
): string {
  if (habilitado) {
    return fechaOtorgado
      ? `El agrónomo ve el teléfono del productor desde el ${formatearFechaHora(fechaOtorgado)}`
      : 'El agrónomo ve el teléfono del productor'
  }
  if (!solicitud.agronomoId) return 'Asigna un agrónomo para poder habilitarlo'
  if (!puedeOtorgar) return 'El caso está cerrado'
  // Un permiso de un evaluador anterior no pasa al nuevo: el administrador debe otorgarlo otra vez
  return 'El agrónomo no ve el teléfono del productor'
}

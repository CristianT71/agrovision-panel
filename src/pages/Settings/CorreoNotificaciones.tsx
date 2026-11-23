import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Toggle from '../../components/Toggle/Toggle'
import { mensajeDeError } from '../../api/axios'
import { notificacionesService } from '../../api/notificaciones/notificaciones.service'
import { Fila } from './SettingsUI'

const CLAVE = ['notificaciones', 'correo'] as const
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// "Notificaciones por correo": lo que llega a la campana también sale a esta dirección
export default function CorreoNotificaciones() {
  const queryClient = useQueryClient()
  const preferencia = useQuery({ queryKey: CLAVE, queryFn: notificacionesService.obtenerCorreo })
  // Lo que la persona va escribiendo; mientras no escriba nada se muestra el guardado
  const [borrador, setBorrador] = useState<string | null>(null)
  const correo = borrador ?? preferencia.data?.correo ?? ''

  const guardar = useMutation({
    mutationFn: (datos: { activo: boolean; correo: string }) => notificacionesService.guardarCorreo(datos),
    onSuccess: (guardado) => {
      queryClient.setQueryData(CLAVE, guardado)
      setBorrador(null)
    },
  })

  const activo = preferencia.data?.activo ?? false
  const correoValido = FORMATO_CORREO.test(correo.trim())
  const cambioPendiente = correo.trim().toLowerCase() !== (preferencia.data?.correo ?? '')

  return (
    <>
      <Fila etiqueta="Notificaciones por correo" nota="Recibe en tu correo lo mismo que ves en la campana">
        <Toggle
          activo={activo}
          onChange={(v) => guardar.mutate({ activo: v, correo })}
          // Sin una dirección válida no hay a dónde enviar
          disabled={preferencia.isPending || guardar.isPending || (!activo && !correoValido)}
          etiqueta="Notificaciones por correo"
        />
      </Fila>

      <div className="flex flex-wrap items-center gap-2 pb-3">
        <input
          type="email"
          value={correo}
          onChange={(e) => setBorrador(e.target.value)}
          placeholder="tucorreo@gmail.com"
          className="w-full max-w-xs rounded-xl border border-gray-200 px-4 py-2 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none"
        />
        <button
          type="button"
          disabled={!correoValido || !cambioPendiente || guardar.isPending}
          onClick={() => guardar.mutate({ activo, correo })}
          className="rounded-lg bg-agro-green px-4 py-2 text-sm font-medium text-white transition enabled:hover:bg-[#194b32] disabled:bg-[#9dc7ae]"
        >
          {guardar.isPending ? 'Guardando...' : 'Guardar correo'}
        </button>
        {!activo && !correoValido && (
          <span className="text-xs text-gray-400">Escribe tu correo para poder activarlo.</span>
        )}
      </div>

      {guardar.isError && (
        <p className="pb-3 text-xs text-red-600">
          {mensajeDeError(guardar.error, 'No se pudo guardar el correo.')}
        </p>
      )}
    </>
  )
}

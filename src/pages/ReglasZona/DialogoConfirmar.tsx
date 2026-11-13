import type { ReactNode } from 'react'
import type { ErrorRegla } from './logica'
import { BOTON, Dialogo, MensajeError, PELIGRO, PRIMARIO } from './ui'

type Props = {
  titulo: string
  children: ReactNode
  textoConfirmar: string
  peligro?: boolean
  pendiente: boolean
  error: ErrorRegla | null
  confirmar: () => void
  cerrar: () => void
}

export default function DialogoConfirmar({ titulo, children, textoConfirmar, peligro = false, pendiente, error, confirmar, cerrar }: Props) {
  const salir = () => { if (!pendiente) cerrar() }
  return (
    <Dialogo titulo={titulo} cerrar={salir}>
      <div className="space-y-4 text-sm text-gray-700">
        {children}
        {error && <MensajeError error={error} />}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button type="button" className={BOTON} onClick={salir} disabled={pendiente}>Cancelar</button>
          <button type="button" className={peligro ? PELIGRO : PRIMARIO} onClick={confirmar} disabled={pendiente}>
            {pendiente ? 'Procesando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </Dialogo>
  )
}

import { useState, type FormEvent } from 'react'
import type { ReglaZona } from '../../api/reglas-zona/reglas-zona.service'
import EditorFilas from './EditorFilas'
import { aFilas, FILA_INICIAL, MAX_NOTAS, mensajeErrorRegla, validarFilas, validarTipo, type FilaEditable } from './logica'
import { useCrearRegla } from './useReglasZona'
import { BOTON, CAMPO, Dialogo, MensajeError, PRIMARIO } from './ui'

type Props = { cerrar: () => void; creada: (regla: ReglaZona) => void }

// El tipo de enfermedad solo se elige al crear: PATCH no lo acepta
export default function DialogoNuevaRegla({ cerrar, creada }: Props) {
  const [tipo, setTipo] = useState('')
  const [notas, setNotas] = useState('')
  const [filas, setFilas] = useState<FilaEditable[]>([{ ...FILA_INICIAL }])
  const crear = useCrearRegla()

  const errorTipo = tipo === '' ? null : validarTipo(tipo)
  const errores = validarFilas(aFilas(filas))
  const valida = tipo !== '' && !errorTipo && errores.length === 0
  const salir = () => { if (!crear.isPending) cerrar() }

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!valida || crear.isPending) return
    crear.mutate(
      { tipoEnfermedad: tipo.trim(), notas: notas.trim() === '' ? null : notas, filas: aFilas(filas) },
      { onSuccess: (regla) => regla && creada(regla) },
    )
  }

  return (
    <Dialogo titulo="Nueva regla de zona (borrador)" cerrar={salir} ancho="max-w-3xl">
      <form onSubmit={enviar} className="space-y-4">
        <label className="block text-sm text-gray-600">
          Tipo de enfermedad
          <input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="roya" className={`${CAMPO} mt-1`} disabled={crear.isPending} />
          {errorTipo && <span role="alert" className="mt-1 block text-red-700">{errorTipo}</span>}
        </label>
        <p className="text-xs text-gray-500">Si ya existen versiones de este tipo, el borrador se crea como la siguiente versión.</p>
        <EditorFilas filas={filas} cambiar={setFilas} deshabilitado={crear.isPending} />
        {errores.length > 0 && (
          <ul role="alert" className="list-disc rounded-xl bg-red-50 py-3 pl-8 pr-4 text-sm text-red-700">{errores.map((e) => <li key={e}>{e}</li>)}</ul>
        )}
        <label className="block text-sm text-gray-600">
          Notas
          <textarea value={notas} rows={3} maxLength={MAX_NOTAS} onChange={(e) => setNotas(e.target.value)} className={`${CAMPO} mt-1`} disabled={crear.isPending} />
        </label>
        {crear.isError && <MensajeError error={mensajeErrorRegla(crear.error, 'No se pudo crear la regla.')} />}
        <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
          <button type="button" className={BOTON} onClick={salir} disabled={crear.isPending}>Cancelar</button>
          <button type="submit" className={PRIMARIO} disabled={!valida || crear.isPending}>{crear.isPending ? 'Creando…' : 'Crear borrador'}</button>
        </div>
      </form>
    </Dialogo>
  )
}

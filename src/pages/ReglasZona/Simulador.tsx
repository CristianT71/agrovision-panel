import { useState, type FormEvent } from 'react'
import type { ReglaZona } from '../../api/reglas-zona/reglas-zona.service'
import {
  claveSimulacion,
  cuerpoSimulacion,
  mensajeErrorRegla,
  resultadoVigente,
  validarSimulacion,
  type ClaveSimulacion,
  type EntradaSimulacion,
} from './logica'
import { useSimularRegla } from './useReglasZona'
import { AvisoSinCalibrar, BOTON, CAMPO, MensajeError } from './ui'

const numero = (n: number) => n.toLocaleString('es-CO')

// Llama a POST /reglas-zona/:id/simular: el cálculo lo hace el API con la tabla guardada, no el panel.
// sinGuardar: el editor tiene cambios; simular usaría una tabla distinta de la visible.
export default function Simulador({ regla, sinGuardar = false }: { regla: ReglaZona; sinGuardar?: boolean }) {
  const [entrada, setEntrada] = useState<EntradaSimulacion>({ severidad: '', incidencia: '', plantas: '' })
  const [intentado, setIntentado] = useState(false)
  const [usada, setUsada] = useState<ClaveSimulacion | null>(null)
  const simular = useSimularRegla(regla.id)
  const errores = validarSimulacion(entrada)
  const r = simular.data
  const actual = claveSimulacion(entrada, regla.filas)
  const vigente = resultadoVigente(usada, actual, sinGuardar)

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setIntentado(true)
    if (errores.length > 0 || sinGuardar) return
    setUsada(actual)
    simular.mutate(cuerpoSimulacion(entrada))
  }
  const campo = (clave: keyof EntradaSimulacion, etiqueta: string) => (
    <label className="text-sm text-gray-600">
      {etiqueta}
      <input type="number" step="any" inputMode="decimal" value={entrada[clave]} onChange={(e) => setEntrada({ ...entrada, [clave]: e.target.value })} className={`${CAMPO} mt-1 w-36`} />
    </label>
  )

  return (
    <section className="space-y-3 rounded-2xl bg-white p-5">
      <h3 className="font-semibold text-gray-900">Simulador</h3>
      <form onSubmit={enviar} className="flex flex-wrap items-end gap-3">
        {campo('severidad', 'Severidad (%)')}
        {campo('incidencia', 'Incidencia (%)')}
        {campo('plantas', 'Plantas por hectárea')}
        <button className={BOTON} disabled={simular.isPending || sinGuardar}>{simular.isPending ? 'Simulando…' : 'Simular'}</button>
      </form>
      {sinGuardar && <p className="text-sm text-gray-500">Guarda los cambios de la tabla antes de simular: el simulador usa la tabla guardada.</p>}
      {intentado && errores.length > 0 && (
        <ul role="alert" className="list-disc pl-5 text-sm text-red-700">{errores.map((e) => <li key={e}>{e}</li>)}</ul>
      )}
      {simular.isError && <MensajeError error={mensajeErrorRegla(simular.error, 'No se pudo simular la regla.')} />}
      {r && (
        <div className="space-y-2">
          {!vigente && (
            <p role="status" className="text-sm font-medium text-amber-700">
              Resultado desactualizado: cambiaron las entradas o la tabla. Vuelve a simular.
            </p>
          )}
          {!r.calibrada && <AvisoSinCalibrar />}
          <dl className={`grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-3 ${vigente ? '' : 'opacity-50'}`}>
            <div><dt className="text-xs text-gray-400">Fila aplicada (v{r.reglaVersion})</dt><dd className="text-lg font-semibold text-gray-900">{r.filaAplicada}</dd></div>
            <div><dt className="text-xs text-gray-400">Radio</dt><dd className="text-lg font-semibold text-gray-900">{numero(r.radioMinM)}–{numero(r.radioMaxM)} m</dd></div>
            <div><dt className="text-xs text-gray-400">Plantas en el radio</dt><dd className="text-lg font-semibold text-gray-900">{numero(r.plantasMin)}–{numero(r.plantasMax)}</dd></div>
          </dl>
        </div>
      )}
    </section>
  )
}

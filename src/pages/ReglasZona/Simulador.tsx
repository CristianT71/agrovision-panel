import { useState, type FormEvent } from 'react'
import type { ReglaZona } from '../../api/reglas-zona/reglas-zona.service'
import { cuerpoSimulacion, mensajeErrorRegla, validarSimulacion, type EntradaSimulacion } from './logica'
import { useSimularRegla } from './useReglasZona'
import { AvisoSinCalibrar, BOTON, CAMPO, MensajeError } from './ui'

const numero = (n: number) => n.toLocaleString('es-CO')

// Llama a POST /reglas-zona/:id/simular: el cálculo lo hace el API, no el panel
export default function Simulador({ regla }: { regla: ReglaZona }) {
  const [entrada, setEntrada] = useState<EntradaSimulacion>({ severidad: '', incidencia: '', plantas: '' })
  const [intentado, setIntentado] = useState(false)
  const simular = useSimularRegla(regla.id)
  const errores = validarSimulacion(entrada)
  const r = simular.data

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    setIntentado(true)
    if (errores.length === 0) simular.mutate(cuerpoSimulacion(entrada))
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
        <button className={BOTON} disabled={simular.isPending}>{simular.isPending ? 'Simulando…' : 'Simular'}</button>
      </form>
      {intentado && errores.length > 0 && (
        <ul role="alert" className="list-disc pl-5 text-sm text-red-700">{errores.map((e) => <li key={e}>{e}</li>)}</ul>
      )}
      {simular.isError && <MensajeError error={mensajeErrorRegla(simular.error, 'No se pudo simular la regla.')} />}
      {r && (
        <div className="space-y-2">
          {!r.calibrada && <AvisoSinCalibrar />}
          <dl className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-gray-400">Fila aplicada (v{r.reglaVersion})</dt><dd className="text-lg font-semibold text-gray-900">{r.filaAplicada}</dd></div>
            <div><dt className="text-xs text-gray-400">Radio</dt><dd className="text-lg font-semibold text-gray-900">{numero(r.radioMinM)}–{numero(r.radioMaxM)} m</dd></div>
            <div><dt className="text-xs text-gray-400">Plantas en el radio</dt><dd className="text-lg font-semibold text-gray-900">{numero(r.plantasMin)}–{numero(r.plantasMax)}</dd></div>
          </dl>
        </div>
      )}
    </section>
  )
}

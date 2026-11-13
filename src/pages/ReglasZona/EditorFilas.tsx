import { agregarFila, CAMPOS_FILA, MAX_FILAS, quitarFila, type FilaEditable } from './logica'
import { BOTON } from './ui'

const ENCABEZADOS: Record<(typeof CAMPOS_FILA)[number], string> = {
  sevMax: 'Severidad máx. (%)',
  incMax: 'Incidencia máx. (%)',
  radioMinM: 'Radio mín. (m)',
  radioMaxM: 'Radio máx. (m)',
}

type Props = {
  filas: FilaEditable[]
  // Sin cambiar: tabla de solo lectura (reglas que ya no están en borrador)
  cambiar?: (filas: FilaEditable[]) => void
  deshabilitado?: boolean
}

export default function EditorFilas({ filas, cambiar, deshabilitado = false }: Props) {
  const editable = Boolean(cambiar) && !deshabilitado
  const actualizar = (indice: number, campo: keyof FilaEditable, valor: string) =>
    cambiar?.(filas.map((f, i) => (i === indice ? { ...f, [campo]: valor } : f)))

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-gray-100">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
              <th className="px-3 py-3 font-medium">Fila</th>
              {CAMPOS_FILA.map((c) => <th key={c} className="px-3 py-3 font-medium">{ENCABEZADOS[c]}</th>)}
              {cambiar && <th className="px-3 py-3" aria-label="Acciones" />}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={i} className="border-b border-gray-50 last:border-0">
                <td className="px-3 py-2 font-medium text-gray-500">{i + 1}</td>
                {CAMPOS_FILA.map((campo) => (
                  <td key={campo} className="px-3 py-2">
                    {cambiar ? (
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        aria-label={`Fila ${i + 1}: ${ENCABEZADOS[campo]}`}
                        value={fila[campo]}
                        disabled={!editable}
                        onChange={(e) => actualizar(i, campo, e.target.value)}
                        className="w-24 rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:border-agro-green focus:outline-none disabled:bg-gray-50"
                      />
                    ) : (
                      <span className="text-gray-800">{fila[campo]}</span>
                    )}
                  </td>
                ))}
                {cambiar && (
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      disabled={!editable || filas.length <= 1}
                      onClick={() => cambiar(quitarFila(filas, i))}
                      className="rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      Quitar
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cambiar && (
        <button type="button" className={BOTON} disabled={!editable || filas.length >= MAX_FILAS} onClick={() => cambiar(agregarFila(filas))}>
          Agregar fila
        </button>
      )}
    </div>
  )
}

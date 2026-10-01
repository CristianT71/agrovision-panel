import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clavesModelos, modelosService, porcentaje, type Modelo } from '../../api/modelos/modelos.service'
import { mensajeDeError } from '../../api/axios'

// En pantalla se escriben porcentajes (99.24); la API los guarda de 0 a 1
type Fila = { clase: string; precision: string; recall: string; f1: string }

const INPUT =
  'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-agro-green focus:outline-none'

const aTexto = (valor: number | undefined) => (valor === undefined ? '' : porcentaje(valor))
const valido = (texto: string) => texto.trim() !== '' && Number(texto) >= 0 && Number(texto) <= 100
const aFraccion = (texto: string) => Number(texto) / 100

type Props = {
  modelo: Modelo
  onClose: () => void
}

// RF-09.2 — precisión, recall y F1 de la compilación, global y por clase
export default function MetricasModal({ modelo, onClose }: Props) {
  const queryClient = useQueryClient()
  const global = modelo.metricas.find((m) => m.clase === null)

  const [general, setGeneral] = useState<Omit<Fila, 'clase'>>({
    precision: aTexto(global?.precision),
    recall: aTexto(global?.recall),
    f1: aTexto(global?.f1),
  })
  const [clases, setClases] = useState<Fila[]>(
    modelo.metricas
      .filter((m) => m.clase !== null)
      .map((m) => ({ clase: m.clase!, precision: aTexto(m.precision), recall: aTexto(m.recall), f1: aTexto(m.f1) })),
  )

  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [onClose])

  const guardar = useMutation({
    mutationFn: () =>
      modelosService.registrarMetricas(modelo.id, {
        global: {
          precision: aFraccion(general.precision),
          recall: aFraccion(general.recall),
          f1: aFraccion(general.f1),
        },
        porClase: clases.map((c) => ({
          clase: c.clase.trim(),
          precision: aFraccion(c.precision),
          recall: aFraccion(c.recall),
          f1: aFraccion(c.f1),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clavesModelos.todos })
      onClose()
    },
  })

  const nombres = clases.map((c) => c.clase.trim().toLowerCase())
  const puedeGuardar =
    valido(general.precision) &&
    valido(general.recall) &&
    valido(general.f1) &&
    clases.every((c) => c.clase.trim() && valido(c.precision) && valido(c.recall) && valido(c.f1)) &&
    new Set(nombres).size === nombres.length

  const editarClase = (indice: number, campo: keyof Fila, valor: string) =>
    setClases((actual) => actual.map((c, i) => (i === indice ? { ...c, [campo]: valor } : c)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pt-6">
          <h2 className="text-xl font-bold text-gray-900">Métricas de v{modelo.version}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Valores en porcentaje (0 a 100) sobre el conjunto de prueba. Reemplazan las anteriores y no se pueden
            cambiar después de publicar.
          </p>
        </div>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <p className="text-sm font-medium text-gray-700">Global (macro)</p>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {(['precision', 'recall', 'f1'] as const).map((campo) => (
                <input
                  key={campo}
                  type="number"
                  step="0.01"
                  min={0}
                  max={100}
                  placeholder={campo === 'precision' ? 'Precisión' : campo === 'recall' ? 'Recall' : 'F1'}
                  value={general[campo]}
                  onChange={(e) => setGeneral((g) => ({ ...g, [campo]: e.target.value }))}
                  className={INPUT}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Por clase (opcional)</p>
              <button
                type="button"
                onClick={() => setClases((c) => [...c, { clase: '', precision: '', recall: '', f1: '' }])}
                className="text-sm font-medium text-agro-green hover:underline"
              >
                + Agregar clase
              </button>
            </div>

            {clases.map((c, i) => (
              <div key={i} className="mt-2 grid grid-cols-[1.4fr_1fr_1fr_1fr_auto] gap-2">
                <input
                  placeholder="Enfermedad_Roya"
                  value={c.clase}
                  onChange={(e) => editarClase(i, 'clase', e.target.value)}
                  className={INPUT}
                />
                {(['precision', 'recall', 'f1'] as const).map((campo) => (
                  <input
                    key={campo}
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    placeholder={campo === 'precision' ? 'Prec.' : campo === 'recall' ? 'Recall' : 'F1'}
                    value={c[campo]}
                    onChange={(e) => editarClase(i, campo, e.target.value)}
                    className={INPUT}
                  />
                ))}
                <button
                  type="button"
                  title="Quitar clase"
                  onClick={() => setClases((actual) => actual.filter((_, j) => j !== i))}
                  className="px-2 text-gray-400 hover:text-red-600"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {guardar.isError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {mensajeDeError(guardar.error, 'No se pudieron guardar las métricas.')}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!puedeGuardar || guardar.isPending}
            onClick={() => guardar.mutate()}
            className="rounded-lg bg-agro-green py-2.5 text-sm font-medium text-white transition enabled:hover:bg-[#194b32] disabled:bg-[#9dc7ae]"
          >
            {guardar.isPending ? 'Guardando...' : 'Guardar métricas'}
          </button>
        </div>
      </div>
    </div>
  )
}

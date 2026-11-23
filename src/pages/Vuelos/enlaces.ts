const MARGEN_RENOVACION_MS = 30_000

export function tiempoParaRenovar(expiraEn: string | undefined, ahora = Date.now()): number {
  const vencimiento = expiraEn ? Date.parse(expiraEn) : NaN
  return Number.isFinite(vencimiento) ? Math.max(0, vencimiento - ahora - MARGEN_RENOVACION_MS) : 0
}

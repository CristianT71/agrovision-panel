// 0.8734 -> "87.3"
export function porcentajeConfianza(confianza: number): string {
  return (confianza * 100).toFixed(1)
}

// Parte de un total como porcentaje con un decimal; "0.0" si no hay total
export function porcentajeDeTotal(parte: number, total: number): string {
  return total > 0 ? ((parte / total) * 100).toFixed(1) : '0.0'
}

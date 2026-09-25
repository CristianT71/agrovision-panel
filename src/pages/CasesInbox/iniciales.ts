// "Claudia Ríos Salcedo" → "CR"
export function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .filter((p) => p && !p.endsWith('.'))
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

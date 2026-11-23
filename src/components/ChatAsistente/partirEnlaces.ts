export type Segmento = { tipo: 'texto'; valor: string } | { tipo: 'enlace'; valor: string }

const ENLACE = /https?:\/\/[^\s<>"']+/g
// Puntuación que suele pegarse al final de una URL dentro de una frase y no forma parte de ella
const PUNTUACION_FINAL = /[.,;:!?)\]]+$/

function esUrlValida(valor: string): boolean {
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** Parte un texto en tramos de texto plano y de enlaces (solo http y https). No genera HTML: quien lo use
 *  debe pintar cada tramo como nodo de React, que escapa el contenido. */
export function partirEnlaces(texto: string): Segmento[] {
  const segmentos: Segmento[] = []
  let desde = 0

  for (const coincidencia of texto.matchAll(ENLACE)) {
    const inicio = coincidencia.index ?? 0
    const url = coincidencia[0].replace(PUNTUACION_FINAL, '')
    if (!esUrlValida(url)) continue

    if (inicio > desde) segmentos.push({ tipo: 'texto', valor: texto.slice(desde, inicio) })
    segmentos.push({ tipo: 'enlace', valor: url })
    desde = inicio + url.length
  }

  if (desde < texto.length) segmentos.push({ tipo: 'texto', valor: texto.slice(desde) })
  return segmentos
}

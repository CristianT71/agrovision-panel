import { describe, expect, it } from 'vitest'
import { partirEnlaces } from './partirEnlaces'

describe('partirEnlaces', () => {
  it('devuelve un solo tramo de texto si no hay enlaces', () => {
    expect(partirEnlaces('Hola, ¿qué tal?')).toEqual([{ tipo: 'texto', valor: 'Hola, ¿qué tal?' }])
  })

  it('separa un enlace que va en su propia línea', () => {
    const url = 'https://n8n.agrovision.sbs/webhook/informe?t=1794767400-abc'
    expect(partirEnlaces(`Tu informe:\n${url}\nVence en 24 horas.`)).toEqual([
      { tipo: 'texto', valor: 'Tu informe:\n' },
      { tipo: 'enlace', valor: url },
      { tipo: 'texto', valor: '\nVence en 24 horas.' },
    ])
  })

  it('no incluye la puntuación final en el enlace', () => {
    expect(partirEnlaces('Mira https://agrovision.sbs/vuelos.')).toEqual([
      { tipo: 'texto', valor: 'Mira ' },
      { tipo: 'enlace', valor: 'https://agrovision.sbs/vuelos' },
      { tipo: 'texto', valor: '.' },
    ])
    expect(partirEnlaces('(ver https://agrovision.sbs/a)')).toEqual([
      { tipo: 'texto', valor: '(ver ' },
      { tipo: 'enlace', valor: 'https://agrovision.sbs/a' },
      { tipo: 'texto', valor: ')' },
    ])
  })

  it('reconoce varios enlaces', () => {
    const r = partirEnlaces('http://a.co/x y https://b.co/y')
    expect(r.filter((s) => s.tipo === 'enlace').map((s) => s.valor)).toEqual(['http://a.co/x', 'https://b.co/y'])
  })

  it('no convierte en enlaces otros protocolos', () => {
    expect(partirEnlaces('javascript:alert(1) y ftp://x.co/a')).toEqual([{ tipo: 'texto', valor: 'javascript:alert(1) y ftp://x.co/a' }])
  })

  it('deja como texto algo que empieza como URL pero no lo es', () => {
    expect(partirEnlaces('http:// roto')).toEqual([{ tipo: 'texto', valor: 'http:// roto' }])
  })

  it('conserva el HTML como texto, sin interpretarlo', () => {
    expect(partirEnlaces('<img src=x onerror=alert(1)>')).toEqual([{ tipo: 'texto', valor: '<img src=x onerror=alert(1)>' }])
  })
})

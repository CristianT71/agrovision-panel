import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import Docs from './Docs'
import { ENDPOINTS, URL_BASE } from './endpoints'

// SSR sin DOM, igual que el resto de pruebas del panel.
describe('Docs', () => {
  const html = renderToStaticMarkup(<Docs />)

  it('muestra la URL base y que no necesita autenticación', () => {
    expect(html).toContain(URL_BASE)
    expect(html).toContain('Ninguna')
  })

  it('documenta todos los endpoints públicos', () => {
    for (const e of ENDPOINTS) {
      expect(html).toContain(e.resumen)
      expect(html.replace(/&quot;/g, '"')).toContain(e.ruta.replace('{id}', '{id}'))
    }
    expect(ENDPOINTS.map((e) => e.ruta)).toEqual(['/catalog', '/catalog/{id}', '/zone-rules'])
  })

  it('explica el límite de peticiones y los errores', () => {
    expect(html).toContain('300 peticiones por minuto')
    expect(html).toContain('Errores')
  })

  it('solo documenta peticiones de lectura', () => {
    expect(ENDPOINTS.every((e) => e.metodo === 'GET')).toBe(true)
  })

  it('no enlaza al panel privado', () => {
    expect(html).not.toContain('/dashboard')
    expect(html).not.toContain('/login')
  })
})

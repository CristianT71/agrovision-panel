import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import Descargas from './Descargas'

// SSR sin DOM, igual que el resto de pruebas del panel: se ve lo que la página muestra al abrirse,
// antes de saber la versión.
describe('Descargas', () => {
  const html = renderToStaticMarkup(<Descargas />)

  it('ofrece el APK de CoffeeCheck para descargar', () => {
    expect(html).toContain('CoffeeCheck')
    expect(html).toContain('href="/descargas/archivos/CoffeeCheck.apk"')
    expect(html).toContain('Descargar para Android')
  })

  it('explica cómo instalarla', () => {
    expect(html).toContain('Cómo instalarla')
  })

  it('no necesita sesión ni muestra el menú del panel', () => {
    expect(html).not.toContain('Cerrar sesión')
    expect(html).not.toContain('/dashboard')
  })
})

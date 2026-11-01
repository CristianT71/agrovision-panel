import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode; pantallaCompleta?: boolean }
type Estado = { fallo: boolean }

// Evita la pantalla en blanco: una excepción de render o un chunk que no carga tras un despliegue
// muestran un aviso con botón de recarga en lugar de desmontar toda la aplicación.
export default class ErrorBoundary extends Component<Props, Estado> {
  state: Estado = { fallo: false }

  static getDerivedStateFromError(): Estado {
    return { fallo: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Sin servicio de reporte todavía: queda en la consola del navegador para diagnóstico
    console.error('Error de la interfaz', error, info.componentStack)
  }

  render() {
    if (!this.state.fallo) return this.props.children

    return (
      <div
        role="alert"
        className={`flex flex-col items-center justify-center gap-3 text-center ${this.props.pantallaCompleta ? 'h-screen' : 'py-20'}`}
      >
        <h2 className="text-lg font-semibold text-gray-900">Algo salió mal</h2>
        <p className="max-w-sm text-sm text-gray-500">
          Esta pantalla no pudo cargarse. Puede deberse a una versión nueva del panel: recarga la página para continuar.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-agro-green px-4 py-2 text-sm font-semibold text-white"
        >
          Recargar
        </button>
      </div>
    )
  }
}

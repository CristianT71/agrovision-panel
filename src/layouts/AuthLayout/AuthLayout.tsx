import type { ReactNode } from 'react'

type AuthLayoutProps = {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Panel izquierdo */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1b4d35] to-[#3d8a57] p-10 text-white">
        {/* Círculos decorativos */}
        <div className="pointer-events-none absolute -top-24 right-0 h-80 w-80 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -left-28 top-40 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute bottom-[-6rem] right-10 h-72 w-72 rounded-full bg-white/5" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 4c0 9-6 13-12 13 0-7 5-11 12-13Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 20c1-4 4-7 8-9" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-xl font-bold leading-tight">AgroVisión</p>
            <p className="text-sm text-white/70">Panel administrativo</p>
          </div>
        </div>

        {/* Mensaje central */}
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">
            Inteligencia artificial al servicio del caficultor
          </h1>
          <p className="mt-4 text-white/75">
            Diagnóstica plagas y enfermedades del café con validación de agrónomos certificados.
          </p>
        </div>

        {/* Footer */}
        <div className="relative flex items-center gap-2 text-sm text-white/60">
          <span className="h-4 w-4 rounded bg-white/20" />
          Cenicafé · FNC Colombia
        </div>
      </aside>

      {/* Panel derecho (contenido variable) */}
      <main className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
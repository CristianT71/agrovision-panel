import { Fragment, useEffect, useState, type ReactNode } from 'react'
import {
  CAMPOS_FICHA,
  ENDPOINTS,
  EJEMPLO_ERROR,
  URL_BASE,
  ejemplosCodigo,
  type Endpoint,
  type Parametro,
} from './endpoints'

// Referencia pública de la API (agrovision.sbs/docs). Sin sesión y sin enlace desde los menús del panel.
// Mismo lenguaje visual del panel: fondo #f7faf8, tarjetas blancas y el verde solo como acento.

const SECCIONES = [
  { id: 'introduccion', titulo: 'Introducción' },
  { id: 'limites', titulo: 'Límites y caché' },
  { id: 'catalogo', titulo: 'Catálogo' },
  { id: 'reglas-zona', titulo: 'Reglas de zona' },
  { id: 'ficha', titulo: 'Objeto Ficha' },
  { id: 'errores', titulo: 'Errores' },
]

const ENLACES_ENDPOINT: Record<string, string> = {
  'listar-fichas': 'catalogo',
  'obtener-ficha': 'catalogo',
  'regla-zona': 'reglas-zona',
}

// ---------- Piezas ----------

const TOKENS = /("(?:\\.|[^"\\])*"\s*:?|\/\/.*|-?\b\d+(?:\.\d+)?\b|\btrue\b|\bfalse\b|\bnull\b)/g

function ColorearJson({ texto }: { texto: string }) {
  const partes = texto.split(TOKENS)
  return (
    <>
      {partes.map((parte, i) => {
        if (i % 2 === 0) return <Fragment key={i}>{parte}</Fragment>
        let clase = 'text-amber-300'
        if (parte.startsWith('"')) clase = parte.trimEnd().endsWith(':') ? 'text-sky-300' : 'text-emerald-300'
        else if (parte.startsWith('//')) clase = 'text-gray-500'
        else if (/^(true|false|null)$/.test(parte)) clase = 'text-violet-300'
        return (
          <span key={i} className={clase}>
            {parte}
          </span>
        )
      })}
    </>
  )
}

function BotonCopiar({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false)
  const copiar = () => {
    navigator.clipboard
      .writeText(texto)
      .then(() => {
        setCopiado(true)
        window.setTimeout(() => setCopiado(false), 1500)
      })
      .catch(() => {})
  }
  return (
    <button
      type="button"
      onClick={copiar}
      className="rounded-md border border-white/10 px-2.5 py-1 text-xs text-gray-300 transition hover:bg-white/10"
    >
      {copiado ? 'Copiado' : 'Copiar'}
    </button>
  )
}

function Codigo({ texto, json = false, etiqueta }: { texto: string; json?: boolean; etiqueta?: string }) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#101828]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
        <span className="text-xs text-gray-400">{etiqueta ?? ''}</span>
        <BotonCopiar texto={texto} />
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed text-gray-100">
        <code>{json ? <ColorearJson texto={texto} /> : texto}</code>
      </pre>
    </div>
  )
}

function EjemplosCodigo({ ruta }: { ruta: string }) {
  const ejemplos = ejemplosCodigo(ruta)
  const [activo, setActivo] = useState(0)
  return (
    <div>
      <div className="mb-2 flex gap-1">
        {ejemplos.map((e, i) => (
          <button
            key={e.lenguaje}
            type="button"
            onClick={() => setActivo(i)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              i === activo ? 'bg-[#1f5f3f] text-white' : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            {e.lenguaje}
          </button>
        ))}
      </div>
      <Codigo texto={ejemplos[activo].codigo} etiqueta="Petición" />
    </div>
  )
}

function InsigniaMetodo({ metodo }: { metodo: string }) {
  return (
    <span className="rounded-md bg-[#eef4f0] px-2 py-0.5 font-mono text-xs font-bold text-agro-green">{metodo}</span>
  )
}

function InsigniaCodigo({ codigo }: { codigo: string }) {
  const ok = codigo.startsWith('2') || codigo.startsWith('3')
  return (
    <span
      className={`inline-block min-w-[2.5rem] rounded-md px-2 py-0.5 text-center font-mono text-xs font-semibold ${
        ok ? 'bg-[#eef4f0] text-agro-green' : 'bg-red-50 text-red-700'
      }`}
    >
      {codigo}
    </span>
  )
}

function Tabla({ cabeceras, children }: { cabeceras: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
            {cabeceras.map((c) => (
              <th key={c} className="pb-3 pr-4 font-medium">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

// ---------- Probar la petición ----------

function Probar({ endpoint }: { endpoint: Endpoint }) {
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(endpoint.parametros.map((p) => [p.nombre, p.ejemplo ?? ''])),
  )
  const [resultado, setResultado] = useState<{ codigo: number; ms: number; cuerpo: string } | null>(null)
  const [enCurso, setEnCurso] = useState(false)

  const armarUrl = () => {
    let ruta = endpoint.ruta
    const consulta = new URLSearchParams()
    for (const p of endpoint.parametros) {
      const valor = (valores[p.nombre] ?? '').trim()
      if (p.en === 'path') ruta = ruta.replace(`{${p.nombre}}`, encodeURIComponent(valor))
      else if (valor !== '') consulta.set(p.nombre, valor)
    }
    const texto = consulta.toString()
    return `${URL_BASE}${ruta}${texto ? `?${texto}` : ''}`
  }

  const enviar = async () => {
    setEnCurso(true)
    const inicio = performance.now()
    try {
      const respuesta = await fetch(armarUrl())
      const texto = await respuesta.text()
      let cuerpo = texto
      try {
        cuerpo = JSON.stringify(JSON.parse(texto), null, 2)
      } catch {
        // no era JSON (por ejemplo un 204 sin contenido): se muestra tal cual
      }
      if (cuerpo === '') cuerpo = '(sin contenido)'
      setResultado({
        codigo: respuesta.status,
        ms: Math.round(performance.now() - inicio),
        cuerpo: cuerpo.length > 6000 ? `${cuerpo.slice(0, 6000)}\n…` : cuerpo,
      })
    } catch {
      setResultado({ codigo: 0, ms: Math.round(performance.now() - inicio), cuerpo: 'No se pudo conectar con la API.' })
    } finally {
      setEnCurso(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-[#f7faf8] p-4">
      <p className="text-sm font-medium text-gray-900">Probar en vivo</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {endpoint.parametros.map((p) => (
          <label key={p.nombre} className="text-xs text-gray-500">
            <span className="font-mono text-gray-700">{p.nombre}</span>
            {p.requerido && <span className="ml-1 text-red-500">*</span>}
            {p.opciones ? (
              <select
                value={valores[p.nombre] ?? ''}
                onChange={(e) => setValores({ ...valores, [p.nombre]: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#1f5f3f] focus:outline-none"
              >
                <option value="">(sin filtro)</option>
                {p.opciones.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={valores[p.nombre] ?? ''}
                onChange={(e) => setValores({ ...valores, [p.nombre]: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#1f5f3f] focus:outline-none"
              />
            )}
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void enviar()}
          disabled={enCurso}
          className="rounded-lg bg-[#1f5f3f] px-4 py-2 text-sm font-medium text-white transition enabled:hover:bg-[#194b32] disabled:bg-[#9dc7ae]"
        >
          {enCurso ? 'Enviando…' : 'Enviar petición'}
        </button>
        <code className="break-all text-xs text-gray-500">GET {armarUrl()}</code>
      </div>
      {resultado && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
            <InsigniaCodigo codigo={String(resultado.codigo)} />
            <span>{resultado.ms} ms</span>
          </div>
          <Codigo texto={resultado.cuerpo} json etiqueta="Respuesta" />
        </div>
      )}
    </div>
  )
}

// ---------- Endpoint ----------

function TablaParametros({ parametros }: { parametros: Parametro[] }) {
  return (
    <Tabla cabeceras={['Parámetro', 'Tipo', 'Descripción']}>
      {parametros.map((p) => (
        <tr key={p.nombre} className="border-b border-gray-50 align-top last:border-0">
          <td className="py-3 pr-4">
            <code className="font-mono text-xs text-gray-900">{p.nombre}</code>
            <p className="mt-0.5 text-xs text-gray-400">
              {p.en === 'path' ? 'ruta' : 'consulta'} · {p.requerido ? 'obligatorio' : 'opcional'}
            </p>
          </td>
          <td className="py-3 pr-4 font-mono text-xs text-gray-500">{p.tipo}</td>
          <td className="py-3 text-gray-600">
            {p.descripcion}
            {p.opciones && (
              <span className="mt-1 block text-xs text-gray-400">
                Valores: {p.opciones.map((o) => `"${o}"`).join(', ')}
              </span>
            )}
          </td>
        </tr>
      ))}
    </Tabla>
  )
}

function TarjetaEndpoint({ endpoint }: { endpoint: Endpoint }) {
  return (
    <article id={endpoint.id} className="scroll-mt-24 rounded-2xl bg-white p-6 sm:p-8">
      <div className="flex flex-wrap items-center gap-3">
        <InsigniaMetodo metodo={endpoint.metodo} />
        <code className="break-all font-mono text-sm font-semibold text-gray-900">{endpoint.ruta}</code>
      </div>
      <h3 className="mt-3 text-lg font-semibold text-gray-900">{endpoint.resumen}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{endpoint.descripcion}</p>

      <h4 className="mt-6 text-sm font-semibold text-gray-900">Parámetros</h4>
      <div className="mt-2">
        <TablaParametros parametros={endpoint.parametros} />
      </div>

      <h4 className="mt-6 text-sm font-semibold text-gray-900">Respuestas</h4>
      <ul className="mt-2 space-y-2">
        {endpoint.respuestas.map((r) => (
          <li key={r.codigo} className="flex items-start gap-3 text-sm text-gray-600">
            <InsigniaCodigo codigo={r.codigo} />
            <span>{r.descripcion}</span>
          </li>
        ))}
      </ul>

      <h4 className="mt-6 text-sm font-semibold text-gray-900">Ejemplo</h4>
      <div className="mt-2 space-y-4">
        <EjemplosCodigo ruta={endpoint.ejemploRuta} />
        <Codigo texto={endpoint.ejemploRespuesta} json etiqueta="Respuesta 200" />
        <Probar endpoint={endpoint} />
      </div>
    </article>
  )
}

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-bold text-gray-900">{titulo}</h2>
      <div className="mt-4 space-y-5">{children}</div>
    </section>
  )
}

// ---------- Página ----------

export default function Docs() {
  useEffect(() => {
    document.title = 'Referencia de la API · AgroVisión'
  }, [])

  const endpointsDe = (seccion: string) => ENDPOINTS.filter((e) => ENLACES_ENDPOINT[e.id] === seccion)

  return (
    <div className="min-h-screen scroll-smooth bg-[#f7faf8] text-gray-900">
      <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-agro-green">
              <img src="/logo-agrovision-blanco.png" alt="AgroVisión" className="h-6 w-6 object-contain" />
            </div>
            <div className="leading-tight">
              <p className="font-bold text-gray-900">AgroVisión API</p>
              <p className="text-xs text-gray-500">Referencia pública</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[#eef4f0] px-3 py-1 text-xs font-semibold text-agro-green">v1</span>
            <a
              href="/openapi.json"
              className="hidden rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-gray-300 sm:inline-block"
            >
              OpenAPI (JSON)
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Secciones" className="lg:sticky lg:top-24 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
            {SECCIONES.map((s) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  className="block rounded-lg px-3 py-2 text-sm text-gray-600 transition hover:bg-white hover:text-gray-900"
                >
                  {s.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0 space-y-12 pb-16">
          <Seccion id="introduccion" titulo="Introducción">
            <div className="rounded-2xl bg-white p-6 sm:p-8">
              <p className="leading-relaxed text-gray-600">
                La API pública de AgroVisión entrega el catálogo de enfermedades, plagas y deficiencias del café que
                reconoce el proyecto, y las reglas de zona de vigilancia activas. Es de solo lectura, no necesita
                cuenta ni llave y devuelve JSON.
              </p>
              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wider text-gray-400">URL base</dt>
                  <dd className="mt-1.5">
                    <Codigo texto={URL_BASE} />
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-gray-400">Autenticación</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">Ninguna</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-gray-400">Formato</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">JSON · UTF-8</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-gray-400">Métodos</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">Solo GET</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wider text-gray-400">CORS</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">Abierto: se puede llamar desde el navegador</dd>
                </div>
              </dl>
              <p className="mt-6 rounded-xl bg-[#f7faf8] px-4 py-3 text-sm leading-relaxed text-gray-500">
                Una ficha con <code className="font-mono text-gray-700">avalada: false</code> no fue revisada por un
                agrónomo: muéstrala con esa advertencia y no como recomendación técnica. Las medidas de contención y el
                protocolo químico solo se entregan en fichas avaladas.
              </p>
            </div>
          </Seccion>

          <Seccion id="limites" titulo="Límites y caché">
            <div className="rounded-2xl bg-white p-6 sm:p-8">
              <Tabla cabeceras={['Concepto', 'Detalle']}>
                <tr className="border-b border-gray-50 align-top">
                  <td className="py-3 pr-4 font-medium text-gray-900">Límite</td>
                  <td className="py-3 text-gray-600">60 peticiones por minuto por dirección IP. Al superarlo responde 429.</td>
                </tr>
                <tr className="border-b border-gray-50 align-top">
                  <td className="py-3 pr-4 font-medium text-gray-900">Encabezados</td>
                  <td className="py-3 text-gray-600">
                    <code className="font-mono text-xs">X-Ratelimit-Limit-Publico</code>,{' '}
                    <code className="font-mono text-xs">X-Ratelimit-Remaining-Publico</code> y{' '}
                    <code className="font-mono text-xs">X-Ratelimit-Reset-Publico</code> indican tu cupo.
                  </td>
                </tr>
                <tr className="align-top">
                  <td className="py-3 pr-4 font-medium text-gray-900">Caché</td>
                  <td className="py-3 text-gray-600">
                    El catálogo trae <code className="font-mono text-xs">Cache-Control: public, max-age=60</code>.
                    Guarda la respuesta en tu proyecto en vez de pedirla en cada visita.
                  </td>
                </tr>
              </Tabla>
            </div>
          </Seccion>

          <Seccion id="catalogo" titulo="Catálogo">
            {endpointsDe('catalogo').map((e) => (
              <TarjetaEndpoint key={e.id} endpoint={e} />
            ))}
          </Seccion>

          <Seccion id="reglas-zona" titulo="Reglas de zona">
            {endpointsDe('reglas-zona').map((e) => (
              <TarjetaEndpoint key={e.id} endpoint={e} />
            ))}
          </Seccion>

          <Seccion id="ficha" titulo="Objeto Ficha">
            <div className="rounded-2xl bg-white p-6 sm:p-8">
              <Tabla cabeceras={['Campo', 'Tipo', 'Descripción']}>
                {CAMPOS_FICHA.map((c) => (
                  <tr key={c.campo} className="border-b border-gray-50 align-top last:border-0">
                    <td className="py-3 pr-4">
                      <code className="font-mono text-xs text-gray-900">{c.campo}</code>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-500">{c.tipo}</td>
                    <td className="py-3 text-gray-600">{c.descripcion}</td>
                  </tr>
                ))}
              </Tabla>
            </div>
          </Seccion>

          <Seccion id="errores" titulo="Errores">
            <div className="rounded-2xl bg-white p-6 sm:p-8">
              <p className="text-sm leading-relaxed text-gray-500">
                Los errores usan el código HTTP y un cuerpo JSON con la ruta y el motivo. El campo{' '}
                <code className="font-mono text-gray-700">mensaje</code> es un texto o una lista de textos.
              </p>
              <div className="mt-4">
                <Codigo texto={EJEMPLO_ERROR} json etiqueta="Respuesta 404" />
              </div>
              <div className="mt-5">
                <Tabla cabeceras={['Código', 'Significado']}>
                  {[
                    ['400', 'Un parámetro falta o no es válido.'],
                    ['404', 'No existe lo que pides.'],
                    ['429', 'Superaste el límite de peticiones. Espera a que se reinicie el minuto.'],
                    ['5xx', 'Falla del servidor. Intenta de nuevo más tarde.'],
                  ].map(([codigo, texto]) => (
                    <tr key={codigo} className="border-b border-gray-50 align-top last:border-0">
                      <td className="py-3 pr-4">
                        <InsigniaCodigo codigo={codigo} />
                      </td>
                      <td className="py-3 text-gray-600">{texto}</td>
                    </tr>
                  ))}
                </Tabla>
              </div>
            </div>
          </Seccion>

          <footer className="border-t border-gray-100 pt-6 text-xs leading-relaxed text-gray-400">
            AgroVisión · SENA, Centro de Gestión y Desarrollo Sostenible Surcolombiano, Pitalito (Huila). Esta API no
            expone solicitudes, productores, ubicaciones, fotos de los productores, mensajes ni datos de agrónomos.
          </footer>
        </main>
      </div>
    </div>
  )
}

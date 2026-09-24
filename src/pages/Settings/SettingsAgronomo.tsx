import { useState } from 'react'
import Toggle from '../../components/Toggle/Toggle'
import {
  AJUSTES,
  IDIOMAS,
  SISTEMA,
  ZONAS_HORARIAS,
  type Ajustes,
} from './mockAjustes'
import {
  AvisoGuardado,
  Fila,
  InfoSistema,
  Selector,
  Subgrupo,
  Tarjeta,
} from './SettingsUI'
import { useGuardado } from './useGuardado'

export default function SettingsAgronomo() {
  const [ajustes, setAjustes] = useState<Ajustes>(AJUSTES)
  const { guardado, avisar } = useGuardado()

  // TODO: reemplazar por PATCH /ajustes cuando el backend exponga el endpoint
  const cambiar = <C extends keyof Ajustes>(clave: C, valor: Ajustes[C]) => {
    setAjustes((prev) => ({ ...prev, [clave]: valor }))
    avisar()
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Encabezado */}
      <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
      <p className="mt-1 text-sm text-gray-500">Preferencias de tu cuenta en AgroVisión</p>

      {guardado && <AvisoGuardado />}

      {/* ---------- Idioma y región ---------- */}
      <Tarjeta
        titulo="Idioma y región"
        descripcion="Localización de fechas, números y textos del panel"
      >
        <Subgrupo icono="globo" titulo="Localización" />
        <Fila etiqueta="Idioma de la interfaz">
          <Selector
            valor={ajustes.idioma}
            opciones={IDIOMAS}
            onChange={(v) => cambiar('idioma', v)}
          />
        </Fila>

        <Subgrupo icono="reloj" titulo="Zona horaria" />
        <Fila etiqueta="Zona horaria">
          <Selector
            valor={ajustes.zonaHoraria}
            opciones={ZONAS_HORARIAS}
            onChange={(v) => cambiar('zonaHoraria', v)}
          />
        </Fila>
      </Tarjeta>

      {/* ---------- Notificaciones — RF-02.5 ---------- */}
      <Tarjeta
        titulo="Notificaciones"
        descripcion="Canales y eventos para los que recibes alertas"
      >
        <Subgrupo icono="campana" titulo="Canales" />
        <Fila etiqueta="Notificaciones push (navegador)">
          <Toggle
            activo={ajustes.pushNavegador}
            onChange={(v) => cambiar('pushNavegador', v)}
            etiqueta="Notificaciones push"
          />
        </Fila>
        <Fila etiqueta="Notificaciones por correo">
          <Toggle
            activo={ajustes.correo}
            onChange={(v) => cambiar('correo', v)}
            etiqueta="Notificaciones por correo"
          />
        </Fila>

        <p className="pt-5 text-sm text-gray-700">Eventos</p>
        <Fila etiqueta="Nuevas solicitudes asignadas" nota="Al recibir un caso para revisar">
          <Toggle
            activo={ajustes.nuevasSolicitudes}
            onChange={(v) => cambiar('nuevasSolicitudes', v)}
            etiqueta="Nuevas solicitudes asignadas"
          />
        </Fila>
      </Tarjeta>

      <InfoSistema datos={SISTEMA} />
    </div>
  )
}

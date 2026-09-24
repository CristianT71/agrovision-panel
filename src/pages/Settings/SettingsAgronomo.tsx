import { useState } from 'react'
import Toggle from '../../components/Toggle/Toggle'
import {
  AJUSTES,
  IDIOMAS,
  ZONAS_HORARIAS,
  RETENCIONES,
  RETENCION_AUDITORIA,
  SISTEMA,
  type Ajustes,
} from './mockAjustes'
import {
  AvisoGuardado,
  Fila,
  InfoSistema,
  LogAuditoria,
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
      <h1 className="text-2xl font-bold text-gray-900">Ajustes del sistema</h1>
      <p className="mt-1 text-sm text-gray-500">Configuración global de la plataforma AgroVisión</p>

      {guardado && <AvisoGuardado />}

      {/* ---------- Idioma y región ---------- */}
      <Tarjeta
        titulo="Idioma y región"
        descripcion="Localización de fechas, números y textos del sistema"
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
        <Fila etiqueta="Zona horaria del servidor">
          <Selector
            valor={ajustes.zonaHoraria}
            opciones={ZONAS_HORARIAS}
            onChange={(v) => cambiar('zonaHoraria', v)}
          />
        </Fila>
      </Tarjeta>

      {/* ---------- Notificaciones — RF-02.5 ---------- */}
      <Tarjeta
        titulo="Notificaciones del sistema"
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

      {/* ---------- Retención de datos ---------- */}
      <Tarjeta
        titulo="Retención de datos"
        descripcion="Por cuánto tiempo se almacenan las solicitudes y logs de actividad"
      >
        <Subgrupo icono="base" titulo="Políticas de almacenamiento" />
        <Fila etiqueta="Retención de solicitudes">
          <Selector
            valor={ajustes.retencionSolicitudes}
            opciones={RETENCIONES}
            onChange={(v) => cambiar('retencionSolicitudes', v)}
          />
        </Fila>
        {/* RNF-01.2 — retención mínima de 2 años, no editable */}
        <Fila etiqueta="Retención de logs de auditoría">
          <span className="text-sm text-gray-500">{RETENCION_AUDITORIA}</span>
        </Fila>
      </Tarjeta>

      {/* ---------- Auditoría ---------- */}
      <Tarjeta titulo="Auditoría y cumplimiento">
        <LogAuditoria />
      </Tarjeta>

      <InfoSistema datos={SISTEMA} />
    </div>
  )
}
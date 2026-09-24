import { useState } from 'react'
import Toggle from '../../components/Toggle/Toggle'
import {
  AJUSTES_ADMIN,
  CANALES_DESPLIEGUE,
  CARGAS_MAXIMAS,
  EXPIRACIONES,
  IDIOMAS,
  RETENCIONES,
  RETENCION_AUDITORIA,
  SISTEMA,
  UMBRALES_PLAGA,
  ZONAS_HORARIAS,
  type AjustesAdmin,
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

export default function SettingsAdmin() {
  const [a, setA] = useState<AjustesAdmin>(AJUSTES_ADMIN)
  const { guardado, avisar } = useGuardado()

  // TODO: reemplazar por PATCH /ajustes/admin cuando el backend exponga el endpoint
  const cambiar = <C extends keyof AjustesAdmin>(clave: C, valor: AjustesAdmin[C]) => {
    setA((prev) => ({ ...prev, [clave]: valor }))
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
          <Selector valor={a.idioma} opciones={IDIOMAS} onChange={(v) => cambiar('idioma', v)} />
        </Fila>

        <Subgrupo icono="reloj" titulo="Zona horaria" />
        <Fila etiqueta="Zona horaria del servidor">
          <Selector
            valor={a.zonaHoraria}
            opciones={ZONAS_HORARIAS}
            onChange={(v) => cambiar('zonaHoraria', v)}
          />
        </Fila>
      </Tarjeta>

      {/* ---------- Operación de casos — RF-08 ---------- */}
      <Tarjeta
        titulo="Operación de casos"
        descripcion="Reglas de asignación y carga de trabajo de los agrónomos"
      >
        <Subgrupo icono="usuarios" titulo="Distribución de trabajo" />

        <Fila
          etiqueta="Asignación automática"
          nota="Reparte los casos nuevos al agrónomo con menor carga"
        >
          <Toggle
            activo={a.asignacionAutomatica}
            onChange={(v) => cambiar('asignacionAutomatica', v)}
            etiqueta="Asignación automática"
          />
        </Fila>

        {/* RF-08.4 — carga en curso de cada especialista */}
        <Fila
          etiqueta="Carga máxima por agrónomo"
          nota="Advierte al asignar si el especialista supera este número"
        >
          <Selector
            valor={a.cargaMaximaAgronomo}
            opciones={CARGAS_MAXIMAS}
            onChange={(v) => cambiar('cargaMaximaAgronomo', v)}
          />
        </Fila>

        {/* RF-06.7 — umbral de alerta preventiva */}
        <Fila
          etiqueta="Umbral de alerta por plaga nueva"
          nota="Detona la alerta de reentrenamiento al superarse"
        >
          <Selector
            valor={a.umbralPlagaNueva}
            opciones={UMBRALES_PLAGA}
            onChange={(v) => cambiar('umbralPlagaNueva', v)}
          />
        </Fila>
      </Tarjeta>

      {/* ---------- Modelos IA — RF-09 ---------- */}
      <Tarjeta
        titulo="Modelos IA"
        descripcion="Reglas de publicación, desactivación y exportación de datasets"
      >
        <Subgrupo icono="chip" titulo="Despliegue" />

        {/* RF-09.5 — pipeline de liberación */}
        <Fila
          etiqueta="Canal por defecto al publicar"
          nota="Canal preseleccionado en el formulario de nueva versión"
        >
          <Selector
            valor={a.canalPorDefecto}
            opciones={CANALES_DESPLIEGUE}
            onChange={(v) => cambiar('canalPorDefecto', v)}
          />
        </Fila>

        {/* RF-09.3 — justificación documental del kill-switch */}
        <Fila
          etiqueta="Exigir justificación en kill-switch"
          nota="Bloquea la desactivación si no se documenta el motivo"
        >
          <Toggle
            activo={a.requiereJustificacionKillSwitch}
            onChange={(v) => cambiar('requiereJustificacionKillSwitch', v)}
            etiqueta="Exigir justificación en kill-switch"
          />
        </Fila>

        {/* RNF-01.3 — purga de GPS y EXIF */}
        <Fila
          etiqueta="Anonimizar exportaciones"
          nota="Elimina GPS y metadatos EXIF al empaquetar datasets"
        >
          <Toggle
            activo={a.anonimizarExportaciones}
            onChange={(v) => cambiar('anonimizarExportaciones', v)}
            etiqueta="Anonimizar exportaciones"
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
            activo={a.pushNavegador}
            onChange={(v) => cambiar('pushNavegador', v)}
            etiqueta="Notificaciones push"
          />
        </Fila>
        <Fila etiqueta="Notificaciones por correo">
          <Toggle
            activo={a.correo}
            onChange={(v) => cambiar('correo', v)}
            etiqueta="Notificaciones por correo"
          />
        </Fila>

        <p className="pt-5 text-sm text-gray-700">Eventos</p>

        {/* RF-08.2 — casos en orfandad */}
        <Fila etiqueta="Casos sin asignar" nota="Al quedar una solicitud sin agrónomo vinculado">
          <Toggle
            activo={a.casosSinAsignar}
            onChange={(v) => cambiar('casosSinAsignar', v)}
            etiqueta="Casos sin asignar"
          />
        </Fila>

        <Fila etiqueta="Alerta de plaga nueva" nota="Al superarse el umbral configurado arriba">
          <Toggle
            activo={a.alertaPlagaNueva}
            onChange={(v) => cambiar('alertaPlagaNueva', v)}
            etiqueta="Alerta de plaga nueva"
          />
        </Fila>

        <Fila etiqueta="Despliegues de modelo" nota="Al publicarse o desactivarse una versión">
          <Toggle
            activo={a.despliegues}
            onChange={(v) => cambiar('despliegues', v)}
            etiqueta="Despliegues de modelo"
          />
        </Fila>

        {/* RF-06.4 — sincronización OTA */}
        <Fila
          etiqueta="Fallos de sincronización OTA"
          nota="Al fallar la actualización en dispositivos"
        >
          <Toggle
            activo={a.fallosOTA}
            onChange={(v) => cambiar('fallosOTA', v)}
            etiqueta="Fallos de sincronización OTA"
          />
        </Fila>
      </Tarjeta>

      {/* ---------- Seguridad — RNF-02 ---------- */}
      <Tarjeta
        titulo="Seguridad y acceso"
        descripcion="Políticas de sesión aplicadas a todos los usuarios del panel"
      >
        <Subgrupo icono="escudo" titulo="Sesiones" />

        {/* RNF-02.2 — cierre por inactividad */}
        <Fila
          etiqueta="Cierre de sesión por inactividad"
          nota="Invalida el token JWT tras este tiempo sin actividad"
        >
          <Selector
            valor={a.expiracionSesion}
            opciones={EXPIRACIONES}
            onChange={(v) => cambiar('expiracionSesion', v)}
          />
        </Fila>

        {/* RF-01.1 — autenticación por OTP */}
        <Fila etiqueta="Método de autenticación" nota="No configurable en esta versión">
          <span className="text-sm text-gray-500">OTP de 6 dígitos</span>
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
            valor={a.retencionSolicitudes}
            opciones={RETENCIONES}
            onChange={(v) => cambiar('retencionSolicitudes', v)}
          />
        </Fila>
        {/* RNF-01.2 — retención mínima de 2 años, no editable */}
        <Fila etiqueta="Retención de logs de auditoría">
          <span className="text-sm text-gray-500">{RETENCION_AUDITORIA}</span>
        </Fila>
      </Tarjeta>

      {/* ---------- Auditoría — RF-09.4 ---------- */}
      <Tarjeta titulo="Auditoría y cumplimiento">
        <LogAuditoria />
      </Tarjeta>

      <InfoSistema datos={SISTEMA} />
    </div>
  )
}
import type { AjustesPersonalesAdmin } from '../../api/ajustes/ajustes.service'
import { useAjustesPersonales, useAjustesSistema } from './useAjustes'
import Toggle from '../../components/Toggle/Toggle'
import CorreoNotificaciones from './CorreoNotificaciones'
import PoliticaDatosTarjeta from './PoliticaDatosTarjeta'
import {
  CARGAS_MAXIMAS,
  EXPIRACIONES,
  IDIOMAS,
  RETENCION_AUDITORIA,
  SISTEMA,
  UMBRALES_PLAGA,
  ZONAS_HORARIAS,
} from './opcionesAjustes'
import {
  EstadoAjustes,
  Fila,
  InfoSistema,
  LogAuditoria,
  Selector,
  Subgrupo,
  Tarjeta,
} from './SettingsUI'

export default function SettingsAdmin() {
  const personales = useAjustesPersonales<AjustesPersonalesAdmin>()
  const sistema = useAjustesSistema()
  const p = personales.datos
  const sis = sistema.datos

  // Hasta que lleguen los ajustes (o si fallan) solo se muestra el estado, sin controles con valores inventados
  if (!p || !sis) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes del sistema</h1>
        <p className="mt-1 text-sm text-gray-500">Configuración global de la plataforma AgroVisión</p>
        <EstadoAjustes
          cargando={personales.cargando || sistema.cargando}
          errorCarga={personales.errorCarga ?? sistema.errorCarga}
          errorGuardado={personales.errorGuardado ?? sistema.errorGuardado}
          onReintentar={() => {
            personales.reintentar()
            sistema.reintentar()
          }}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Encabezado */}
      <h1 className="text-2xl font-bold text-gray-900">Ajustes del sistema</h1>
      <p className="mt-1 text-sm text-gray-500">Configuración global de la plataforma AgroVisión</p>

      <EstadoAjustes
        cargando={personales.cargando || sistema.cargando}
        errorCarga={personales.errorCarga ?? sistema.errorCarga}
        errorGuardado={personales.errorGuardado ?? sistema.errorGuardado}
        onReintentar={() => {
          personales.reintentar()
          sistema.reintentar()
        }}
      />

      {/* ---------- Idioma y región ---------- */}
      <Tarjeta
        titulo="Idioma y región"
        descripcion="Localización de fechas, números y textos del sistema"
      >
        <Subgrupo icono="globo" titulo="Localización" />
        <Fila etiqueta="Idioma de la interfaz">
          <Selector valor={p.idioma} opciones={IDIOMAS} onChange={(v) => personales.cambiar('idioma', v)} />
        </Fila>

        <Subgrupo icono="reloj" titulo="Zona horaria" />
        <Fila etiqueta="Zona horaria">
          <Selector
            valor={p.zonaHoraria}
            opciones={ZONAS_HORARIAS}
            onChange={(v) => personales.cambiar('zonaHoraria', v)}
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
          nota="Asigna cada solicitud enviada al agrónomo activo con menor carga; no cambia las que ya están sin asignar"
        >
          <Toggle
            activo={sis.asignacionAutomatica}
            onChange={(v) => sistema.cambiar('asignacionAutomatica', v)}
            etiqueta="Asignación automática"
          />
        </Fila>

        {/* RF-08.4 — carga en curso de cada especialista */}
        <Fila
          etiqueta="Carga máxima por agrónomo"
          nota="Pide confirmar al asignar a mano; la asignación automática no lo supera"
        >
          <Selector
            valor={sis.cargaMaximaAgronomo}
            opciones={CARGAS_MAXIMAS}
            onChange={(v) => sistema.cambiar('cargaMaximaAgronomo', v)}
          />
        </Fila>

        {/* RF-06.7 — umbral de alerta preventiva */}
        <Fila
          etiqueta="Umbral de alerta por plaga nueva"
          nota="Detona la alerta de reentrenamiento al superarse"
        >
          <Selector
            valor={sis.umbralPlagaNueva}
            opciones={UMBRALES_PLAGA}
            onChange={(v) => sistema.cambiar('umbralPlagaNueva', v)}
          />
        </Fila>
      </Tarjeta>

      {/* ---------- Modelos IA — RF-09 ---------- */}
      <Tarjeta
        titulo="Modelos IA"
        descripcion="Reglas de publicación, desactivación y exportación de datasets"
      >
        <Subgrupo icono="chip" titulo="Despliegue" />

        {/* RF-09.3 — justificación documental del kill-switch */}
        <Fila
          etiqueta="Exigir justificación en kill-switch"
          nota="Bloquea la desactivación si no se documenta el motivo"
        >
          <span className="text-sm text-gray-500">Siempre activo</span>
        </Fila>

        {/* RNF-01.3 — purga de GPS y EXIF */}
        <Fila
          etiqueta="Anonimizar exportaciones"
          nota="Elimina GPS y metadatos EXIF al empaquetar datasets"
        >
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            Próximamente
          </span>
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
            activo={p.pushNavegador}
            onChange={(v) => personales.cambiar('pushNavegador', v)}
            etiqueta="Notificaciones push"
          />
        </Fila>
        <CorreoNotificaciones />

        <p className="pt-5 text-sm text-gray-700">Eventos</p>

        {/* RF-08.2 — casos en orfandad */}
        <Fila etiqueta="Casos sin asignar" nota="Al quedar una solicitud sin agrónomo vinculado">
          <Toggle
            activo={p.casosSinAsignar}
            onChange={(v) => personales.cambiar('casosSinAsignar', v)}
            etiqueta="Casos sin asignar"
          />
        </Fila>

        <Fila etiqueta="Alerta de plaga nueva" nota="Al superarse el umbral configurado arriba">
          <Toggle
            activo={p.alertaPlagaNueva}
            onChange={(v) => personales.cambiar('alertaPlagaNueva', v)}
            etiqueta="Alerta de plaga nueva"
          />
        </Fila>

        <Fila etiqueta="Despliegues de modelo" nota="Al publicarse o desactivarse una versión">
          <Toggle
            activo={p.despliegues}
            onChange={(v) => personales.cambiar('despliegues', v)}
            etiqueta="Despliegues de modelo"
          />
        </Fila>

        {/* RF-06.4 — sincronización OTA */}
        <Fila
          etiqueta="Fallos de sincronización OTA"
          nota="Al fallar la actualización en dispositivos"
        >
          <Toggle
            activo={p.fallosOTA}
            onChange={(v) => personales.cambiar('fallosOTA', v)}
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
          nota="Cierra la sesión de administradores y agrónomos tras este tiempo sin actividad; se aplica en menos de un minuto"
        >
          <Selector
            valor={sis.expiracionSesion}
            opciones={EXPIRACIONES}
            onChange={(v) => sistema.cambiar('expiracionSesion', v)}
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
        <Fila
          etiqueta="Retención de solicitudes"
          nota="Por ahora las solicitudes se conservan sin borrarse automáticamente"
        >
          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            Próximamente
          </span>
        </Fila>
        {/* RNF-01.2 — retención mínima de 2 años, no editable */}
        <Fila etiqueta="Retención de logs de auditoría">
          <span className="text-sm text-gray-500">{RETENCION_AUDITORIA}</span>
        </Fila>
      </Tarjeta>

      {/* ---------- Habeas data (Ley 1581 de 2012) ---------- */}
      <PoliticaDatosTarjeta />

      {/* ---------- Auditoría — RF-09.4 ---------- */}
      <Tarjeta titulo="Auditoría y cumplimiento">
        <LogAuditoria />
      </Tarjeta>

      <InfoSistema datos={SISTEMA} />
    </div>
  )
}
import type { AjustesPersonalesAgronomo } from '../../api/ajustes/ajustes.service'
import { useAjustesPersonales } from './useAjustes'
import Toggle from '../../components/Toggle/Toggle'
import CorreoNotificaciones from './CorreoNotificaciones'
import {
  IDIOMAS,
  SISTEMA,
  ZONAS_HORARIAS,
} from './opcionesAjustes'
import {
  EstadoAjustes,
  Fila,
  InfoSistema,
  Selector,
  Subgrupo,
  Tarjeta,
} from './SettingsUI'

export default function SettingsAgronomo() {
  const { datos: ajustes, cargando, errorCarga, errorGuardado, cambiar, reintentar } =
    useAjustesPersonales<AjustesPersonalesAgronomo>()

  // Hasta que lleguen los ajustes (o si fallan) solo se muestra el estado, sin controles con valores inventados
  if (!ajustes) {
    return (
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
        <p className="mt-1 text-sm text-gray-500">Preferencias de tu cuenta en AgroVisión</p>
        <EstadoAjustes
          cargando={cargando}
          errorCarga={errorCarga}
          errorGuardado={errorGuardado}
          onReintentar={reintentar}
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Encabezado */}
      <h1 className="text-2xl font-bold text-gray-900">Ajustes</h1>
      <p className="mt-1 text-sm text-gray-500">Preferencias de tu cuenta en AgroVisión</p>

      <EstadoAjustes
        cargando={cargando}
        errorCarga={errorCarga}
        errorGuardado={errorGuardado}
        onReintentar={reintentar}
      />

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
        <CorreoNotificaciones />

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

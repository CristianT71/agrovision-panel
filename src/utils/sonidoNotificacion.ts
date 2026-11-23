// Aviso sonoro de una notificación nueva. Se genera con Web Audio (sin archivo de audio) y los navegadores
// solo lo permiten después de que la persona haya interactuado con la página: antes de eso falla en silencio.
const CLAVE_SONIDO = 'agrovision.notificaciones.sonido'

let contexto: AudioContext | null = null

function obtenerContexto(): AudioContext | null {
  try {
    const Clase =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Clase) return null
    contexto ??= new Clase()
    return contexto
  } catch {
    return null
  }
}

// Despierta el audio con el primer clic o tecla, que es cuando el navegador lo autoriza
export function prepararSonido(): () => void {
  const despertar = () => {
    void obtenerContexto()?.resume()
  }
  window.addEventListener('pointerdown', despertar, { once: true })
  window.addEventListener('keydown', despertar, { once: true })
  return () => {
    window.removeEventListener('pointerdown', despertar)
    window.removeEventListener('keydown', despertar)
  }
}

export function sonidoActivo(): boolean {
  try {
    return localStorage.getItem(CLAVE_SONIDO) !== 'no'
  } catch {
    return true
  }
}

export function guardarSonidoActivo(activo: boolean): void {
  try {
    localStorage.setItem(CLAVE_SONIDO, activo ? 'si' : 'no')
  } catch {
    // Sin almacenamiento la preferencia solo dura la sesión
  }
}

// Dos notas cortas, la segunda más aguda: se distingue de otros sonidos de la pantalla
export function sonarNotificacion(): void {
  const audio = obtenerContexto()
  if (!audio || audio.state !== 'running') return

  const inicio = audio.currentTime
  const notas = [
    { frecuencia: 784, desde: 0 },
    { frecuencia: 1175, desde: 0.16 },
  ]

  for (const { frecuencia, desde } of notas) {
    const oscilador = audio.createOscillator()
    const volumen = audio.createGain()
    oscilador.type = 'sine'
    oscilador.frequency.value = frecuencia
    volumen.gain.setValueAtTime(0.0001, inicio + desde)
    volumen.gain.exponentialRampToValueAtTime(0.25, inicio + desde + 0.02)
    volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + desde + 0.4)
    oscilador.connect(volumen).connect(audio.destination)
    oscilador.start(inicio + desde)
    oscilador.stop(inicio + desde + 0.45)
  }
}

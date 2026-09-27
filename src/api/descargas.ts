// Los archivos privados llegan como blob (necesitan el token); se descargan con un enlace temporal
export function descargarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  // Se libera después: algunos navegadores cancelan la descarga si se revoca en el mismo tick
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Convierte un archivo privado en una "data URL" (la imagen codificada como texto) para usarla en <img src>.
// A diferencia de URL.createObjectURL, no hay que liberarla después: se puede guardar en la caché de datos.
export function blobADataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader()
    lector.onload = () => resolve(lector.result as string)
    lector.onerror = () => reject(lector.error)
    lector.readAsDataURL(blob)
  })
}

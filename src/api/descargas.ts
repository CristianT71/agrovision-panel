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

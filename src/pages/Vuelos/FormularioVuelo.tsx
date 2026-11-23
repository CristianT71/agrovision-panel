import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { clavesVuelos, vuelosService, type Vuelo } from '../../api/vuelos/vuelos.service'
import { CAMPO, ErrorVuelo, ModalVuelo, PRIMARIO } from './ui'

export default function FormularioVuelo({ vuelo, cerrar, guardado }: { vuelo?: Vuelo; cerrar: () => void; guardado: (vuelo: Vuelo) => void }) {
  const cliente = useQueryClient()
  const [nombre, setNombre] = useState(vuelo?.nombre ?? '')
  const [lote, setLote] = useState(vuelo?.lote ?? '')
  const [notas, setNotas] = useState(vuelo?.notas ?? '')
  const guardar = useMutation({
    mutationFn: () => {
      const datos = { nombre: nombre.trim(), lote: lote.trim(), notas: notas.trim() }
      return vuelo ? vuelosService.editar(vuelo.id, datos) : vuelosService.crear(datos)
    },
    onSuccess: resultado => {
      void cliente.invalidateQueries({ queryKey: clavesVuelos.todas })
      guardado(resultado)
    },
  })
  const enviar = (e: FormEvent) => { e.preventDefault(); if (nombre.trim() && !guardar.isPending) guardar.mutate() }
  return <ModalVuelo titulo={vuelo ? 'Editar vuelo' : 'Nuevo vuelo'} cerrar={cerrar}>
    <form onSubmit={enviar} className="space-y-4">
      <label className="block text-sm">Nombre obligatorio<input autoFocus required className={`${CAMPO} mt-1`} value={nombre} onChange={e => setNombre(e.target.value)} /></label>
      <label className="block text-sm">Lote (opcional)<input className={`${CAMPO} mt-1`} value={lote} onChange={e => setLote(e.target.value)} /></label>
      <label className="block text-sm">Notas (opcional)<textarea rows={4} className={`${CAMPO} mt-1`} value={notas} onChange={e => setNotas(e.target.value)} /></label>
      {!vuelo && <p className="text-sm text-gray-500">Al guardar podrás subir fotos, bandas, videos y archivos SRT.</p>}
      {guardar.isError && <ErrorVuelo error={guardar.error} />}
      <button className={PRIMARIO} disabled={!nombre.trim() || guardar.isPending}>{guardar.isPending ? 'Guardando…' : 'Guardar vuelo'}</button>
    </form>
  </ModalVuelo>
}

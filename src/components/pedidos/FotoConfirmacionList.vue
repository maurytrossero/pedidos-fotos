<template>
  <div class="contenedor-pedidos">
    <h2 class="titulo-pedidos">Pedidos de Fotos de Confirmaciones 03/10/2025</h2>

    <!-- Mensaje masivo -->
    <div v-if="isAuthenticated" class="bloque-mensaje">
      <label for="mensaje" class="label-mensaje">Mensaje para enviar a todos:</label>
      <textarea
        id="mensaje"
        v-model="mensajeMasivo"
        class="textarea-mensaje"
        rows="4"
        placeholder="Escribí el mensaje que querés enviar a todos por WhatsApp..."
      ></textarea>
      <button @click="enviarMensajesMasivos" class="boton-masivo" type="button">
        Enviar mensaje a todos 📢
      </button>
    </div>

    <!-- Buscador -->
    <div class="buscador">
      <label for="busqueda" class="label-busqueda">Buscar pedido por nombre:</label>
      <input
        id="busqueda"
        v-model="busqueda"
        type="text"
        placeholder="Ingresá el nombre..."
        class="input-busqueda"
      />
    </div>

    <!-- Filtro estado -->
    <div v-if="isAuthenticated && pedidos.length > 0" class="filtro-pedidos">
      <label>Filtrar por estado:</label>
      <select v-model="filtro" class="select-filtro">
        <option value="todos">Todos</option>
        <option value="pendiente">Pendientes</option>
        <option value="aprobado">Pagados</option>
      </select>
    </div>

    <div v-if="loading" class="mensaje-cargando">Cargando pedidos...</div>
    <div v-else-if="pedidosFiltrados.length === 0" class="mensaje-vacio">
      No hay pedidos registrados.
    </div>

    <!-- Listado -->
    <div v-else class="lista-pedidos">
      <div v-for="pedido in pedidosFiltrados" :key="pedido.id" class="tarjeta-pedido">
        <div class="info-pedido">
          <p><strong>Nombre:</strong> {{ pedido.nombre }}</p>

          <template v-if="isAuthenticated">
            <p>
              <strong>WhatsApp:</strong> {{ pedido.whatsapp }}
              <button
                class="link-whatsapp"
                @click="enviarMensajeIndividual(pedido)"
                title="Enviar mensaje por WhatsApp"
              >
                📲 Enviar WhatsApp
              </button>
            </p>
          </template>

          <p><strong>Paquete:</strong> {{ pedido.paquete }} foto(s) oficiales + {{ pedido.fotosExtra }} extra(s)</p>
          <p><strong>Total:</strong> ${{ pedido.total }}</p>

          <!-- Comprobantes -->
          <div class="comprobantes-section" v-if="isAuthenticated">
            <p><strong>Comprobantes:</strong></p>
            <div v-if="pedido.comprobantes?.length > 0">
              <ul class="comprobantes-lista">
                <li v-for="c in pedido.comprobantes" :key="c.nombreArchivo">
                  <a :href="c.url" target="_blank">{{ c.nombreArchivo }}</a>
                  <img :src="c.url" alt="Comprobante" class="comprobante-img" />
                </li>
              </ul>
            </div>
            <p v-else>No cargados</p>
          </div>

          <p><strong>Estado:</strong> <span :class="estadoColor(pedido.estado)">{{ pedido.estado || 'pendiente' }}</span></p>
          <p class="fecha-pedido">Fecha: {{ pedido.createdAt?.toDate?.().toLocaleString() || 'sin fecha' }}</p>
        </div>

        <div class="acciones">
          <button v-if="pedido.estado === 'pendiente' && isAuthenticated" @click="aprobarPedido(pedido.id)" class="boton-aprobar">Aprobar</button>
          <button v-if="isAuthenticated" @click="eliminarPedidoConfirmado(pedido.id, pedido.nombre)" class="boton-eliminar">Eliminar</button>
        </div>
      </div>
    </div>

    <div v-if="pedidosFiltrados.length > 0 && isAuthenticated" class="total-recaudado">
      💰 <strong>Total recaudado:</strong> ${{ totalRecaudado }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { escucharPedidos, aprobarEstadoPedido, actualizarPedido, eliminarPedido } from '@/services/fotoConfirmacionService'

const PRECIO_FOTO = 4000
const mensajeMasivo = ref('Hola, te confirmamos que recibimos tu pedido de fotos de confirmación. Muchas gracias 🙌')
const pedidos = ref<any[]>([])
const loading = ref(true)
const filtro = ref<'todos' | 'pendiente' | 'aprobado'>('todos')
const busqueda = ref('')

const isAuthenticated = computed(() => !!localStorage.getItem('token'))

function estadoColor(estado: string) {
  return estado === 'aprobado' ? 'estado-aprobado' : 'estado-pendiente'
}

// ✅ Función base para generar link de WhatsApp con mensaje
function crearLinkWhatsApp(whatsapp: string, mensaje: string) {
  const tel = (whatsapp || '').replace(/\D/g, '')
  if (!tel) return null
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`
}

// ✅ Enviar mensaje individual
function enviarMensajeIndividual(pedido: any) {
  const texto = mensajeMasivo.value.trim()
    ? mensajeMasivo.value
    : `Hola, te confirmamos que recibimos tu pedido de fotos para ${pedido.nombre}. Muchas gracias 🙌`

  const url = crearLinkWhatsApp(pedido.whatsapp, texto)
  if (url) window.open(url, '_blank')
}

// ✅ Enviar mensajes masivos (uno por uno para evitar bloqueos)
function enviarMensajesMasivos() {
  if (!mensajeMasivo.value.trim()) {
    alert('Por favor, escribí un mensaje antes de enviarlo.')
    return
  }
  if (!confirm(`¿Seguro que querés enviar este mensaje a ${pedidosFiltrados.value.length} personas?`)) return

  const lista = pedidosFiltrados.value.filter(p => !!p.whatsapp)
  lista.forEach((p, i) => {
    setTimeout(() => {
      const url = crearLinkWhatsApp(p.whatsapp, mensajeMasivo.value)
      if (url) window.open(url, '_blank')
    }, i * 1500)
  })
}

// ✅ Aprobar pedido
async function aprobarPedido(id: string) {
  try {
    await aprobarEstadoPedido(id)
  } catch (err) {
    console.error(err)
    alert('Error al aprobar el pedido')
  }
}

// ✅ Eliminar pedido
async function eliminarPedidoConfirmado(id: string, nombre: string) {
  if (!confirm(`¿Seguro que querés eliminar el pedido de "${nombre}"?`)) return
  try {
    await eliminarPedido(id)
    pedidos.value = pedidos.value.filter(p => p.id !== id)
  } catch (err) {
    console.error(err)
    alert('No se pudo eliminar el pedido')
  }
}

// ✅ Filtrado + búsqueda
const pedidosFiltrados = computed(() => {
  let lista = pedidos.value
  if (isAuthenticated.value && filtro.value !== 'todos') lista = lista.filter(p => p.estado === filtro.value)
  if (busqueda.value.trim()) {
    const txt = busqueda.value.toLowerCase()
    lista = lista.filter(p => p.nombre?.toLowerCase().includes(txt))
  }
  return lista
})

// ✅ Total recaudado
const totalRecaudado = computed(() =>
  pedidosFiltrados.value.reduce((acc, p) => {
    const paquete = Number(p.paquete || 0)
    const extras = Number(p.fotosExtra || 0)
    const totalEsperado = (paquete + extras) * PRECIO_FOTO
    const totalFinal = p.total > 0 ? Number(p.total) : totalEsperado
    if (totalFinal !== p.total) actualizarPedido(p.id, { total: totalFinal })
    return acc + totalFinal
  }, 0)
)

// ✅ Escuchar pedidos en tiempo real
let unsubscribe: (() => void) | null = null
onMounted(() => {
  unsubscribe = escucharPedidos((data) => {
    pedidos.value = data.map(d => ({
      ...d,
      paquete: Number(d.paquete || 0),
      fotosExtra: Number(d.fotosExtra || 0),
      total: Number(d.total || 0)
    }))
    loading.value = false
  })
})
onUnmounted(() => { if (unsubscribe) unsubscribe() })
</script>


<style scoped>
.contenedor-pedidos {
  max-width: 700px;
  margin: 2rem auto;
  padding: 1.5rem 2rem;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: #1f2937;
}

.titulo-pedidos {
  font-size: 2rem;
  font-weight: 700;
  color: #2563eb;
  text-align: center;
  margin-bottom: 2rem;
  letter-spacing: 0.03em;
}

.mensaje-cargando,
.mensaje-vacio {
  font-size: 1.25rem;
  font-weight: 500;
  color: #6b7280;
  text-align: center;
  padding: 2rem 0;
}

.lista-pedidos {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tarjeta-pedido {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem 1.75rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: box-shadow 0.3s ease;
}

.tarjeta-pedido:hover {
  box-shadow: 0 6px 18px rgba(37, 99, 235, 0.25);
}

@media (min-width: 640px) {
  .tarjeta-pedido {
    flex-direction: row;
    align-items: center;
  }
}

.info-pedido {
  flex: 1;
  line-height: 1.5;
}

.info-pedido p {
  margin: 0.3rem 0;
  font-size: 1rem;
}

.link-comprobante {
  color: #2563eb;
  text-decoration: none;
  font-weight: 600;
}

.link-comprobante:hover {
  text-decoration: underline;
}

.estado-aprobado {
  color: #16a34a; /* verde */
  font-weight: 700;
  text-transform: capitalize;
}

.estado-pendiente {
  color: #ca8a04; /* amarillo */
  font-weight: 700;
  text-transform: capitalize;
}

.fecha-pedido {
  font-size: 0.85rem;
  color: #6b7280;
  margin-top: 0.6rem;
  font-style: italic;
}

.acciones {
  margin-top: 1rem;
  display: flex;
  justify-content: flex-start;
}

@media (min-width: 640px) {
  .acciones {
    margin-top: 0;
    margin-left: 1.5rem;
  }
}

.boton-aprobar {
  background-color: #2563eb;
  color: white;
  padding: 0.55rem 1.2rem;
  font-size: 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.3);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.boton-aprobar:hover {
  background-color: #1d4ed8;
  box-shadow: 0 6px 14px rgba(29, 78, 216, 0.6);
}
.link-whatsapp {
  margin-left: 0.5rem;
  font-size: 0.9rem;
  color: #25d366; /* verde WhatsApp */
  text-decoration: none;
  font-weight: 600;
  vertical-align: middle;
  transition: color 0.2s ease;
}

.link-whatsapp:hover {
  color: #128c7e;
  text-decoration: underline;
}
.bloque-mensaje {
  margin: 1rem auto 1rem;
  max-width: 700px;
  display: flex;
  flex-direction: column;
}

.label-mensaje {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.textarea-mensaje {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  background-color: #f9fafb;
  color: #111827;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: border-color 0.2s ease;
}

.textarea-mensaje:focus {
  outline: none;
  border-color: #2563eb;
  background-color: #fff;
}

.boton-masivo {
  background-color: #10b981; /* verde */
  color: white;
  padding: 0.6rem 1.4rem;
  font-size: 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
  margin: 1rem auto 2rem;
  display: block;
}

.boton-masivo:hover {
  background-color: #059669;
  box-shadow: 0 6px 14px rgba(5, 150, 105, 0.5);
}

.comprobantes-section {
  margin-top: 0.5rem;
}

.comprobantes-lista {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
}

.comprobantes-lista li {
  margin-bottom: 0.8rem;
}

.comprobante-preview {
  margin-top: 5px;
}

.comprobante-img {
  max-width: 180px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.total-recaudado {
  font-size: 1.3rem;
  font-weight: 700;
  color: #16a34a;
  text-align: center;
  margin: 1rem 0 2rem;
}
.boton-eliminar {
  background-color: #dc2626; /* rojo */
  color: white;
  padding: 0.55rem 1.2rem;
  font-size: 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  margin-left: 0.8rem;
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.boton-eliminar:hover {
  background-color: #b91c1c;
  box-shadow: 0 6px 14px rgba(185, 28, 28, 0.6);
}
.filtro-pedidos {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0 2rem;
}

.select-filtro {
  padding: 0.4rem 0.8rem;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  font-size: 1rem;
  cursor: pointer;
}

/* 🆕 Estilos buscador */
.buscador {
  margin: 1.5rem 0;
  text-align: center;
}

.label-busqueda {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.input-busqueda {
  width: 100%;
  max-width: 400px;
  padding: 0.6rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 1rem;
  font-family: inherit;
  background-color: #f9fafb;
  color: #111827;
  transition: border-color 0.2s ease;
}

.input-busqueda:focus {
  outline: none;
  border-color: #2563eb;
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(37, 99, 235, 0.2);
}
</style>
<template>
  <div class="contenedor-pedidos">
    <h2 class="titulo-pedidos">Listado de Pedidos con Fotos Seleccionadas</h2>

    <!-- 🔎 Buscador -->
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

    <!-- 🔒 Filtro solo si está logueado -->
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

    <!-- 🧾 Listado -->
    <div v-else class="lista-pedidos">
      <div v-for="pedido in pedidosFiltrados" :key="pedido.id" class="tarjeta-pedido">
        <div class="info-pedido">
          <p><strong>Nombre:</strong> {{ pedido.nombre }}</p>

          <template v-if="isAuthenticated">
            <p>
              <strong>WhatsApp:</strong> {{ pedido.whatsapp }}
              <a
                :href="whatsappLink(pedido.whatsapp, pedido.nombre)"
                target="_blank"
                rel="noopener"
                class="link-whatsapp"
                title="Enviar mensaje por WhatsApp"
              >
                📲 Enviar WhatsApp
              </a>
            </p>
          </template>

          <p>
            <strong>Paquete:</strong>
            {{ pedido.paquete }} + {{ pedido.fotosExtra }} extra(s)
          </p>

          <p><strong>Estado:</strong>
            <span :class="estadoColor(pedido.estado)">
              {{ pedido.estado || 'pendiente' }}
            </span>
          </p>

          <p class="fecha-pedido">
            Fecha: {{ pedido.createdAt?.toDate().toLocaleString() || 'sin fecha' }}
          </p>

          <!-- 🖼️ Fotos seleccionadas -->
          <div v-if="pedido.seleccionadas?.length" class="fotos-seleccionadas">
            <h4>Fotos Seleccionadas ({{ pedido.seleccionadas.length }})</h4>
            <div class="grid-fotos">
              <div
                v-for="(url, i) in pedido.seleccionadas"
                :key="i"
                class="foto-wrapper"
              >
                <img :src="url" alt="Foto seleccionada" class="foto-mini" @click="verAmpliada(url)" />
              </div>
            </div>
          </div>
          <p v-else class="sin-fotos">No hay fotos seleccionadas.</p>
        </div>

        <!-- 🔒 Acciones -->
        <div class="acciones" v-if="isAuthenticated">
          <button
            v-if="pedido.estado === 'pendiente'"
            @click="aprobarPedido(pedido.id)"
            class="boton-aprobar"
          >
            Aprobar
          </button>
          <button
            @click="eliminarPedidoConfirmado(pedido.id, pedido.nombre)"
            class="boton-eliminar"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>

    <!-- 🧮 Total -->
    <div v-if="isAuthenticated && pedidosFiltrados.length" class="total-recaudado">
      💰 <strong>Total recaudado:</strong> ${{ totalRecaudado }}
    </div>

    <!-- 🔍 Modal Foto Ampliada -->
    <transition name="fade-zoom">
      <div v-if="fotoAmpliada" class="modal" @click.self="fotoAmpliada = null">
        <button class="cerrar" @click="fotoAmpliada = null">✕</button>
        <img :src="fotoAmpliada" alt="Foto ampliada" class="foto-grande" />
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { escucharPedidos, aprobarEstadoPedido, eliminarPedido } from '@/services/fotoConfirmacionService'

const pedidos = ref<any[]>([])
const filtro = ref<'todos' | 'pendiente' | 'aprobado'>('todos')
const busqueda = ref('')
const loading = ref(true)
const fotoAmpliada = ref<string | null>(null)

const isAuthenticated = computed(() => localStorage.getItem('token') !== null)

const pedidosFiltrados = computed(() => {
  let lista = pedidos.value
  if (isAuthenticated.value && filtro.value !== 'todos') {
    lista = lista.filter(p => p.estado === filtro.value)
  }
  if (busqueda.value.trim()) {
    const texto = busqueda.value.toLowerCase()
    lista = lista.filter(p => p.nombre?.toLowerCase().includes(texto))
  }
  return lista
})

const totalRecaudado = computed(() =>
  pedidosFiltrados.value.reduce((acc, p) => acc + (p.total || 0), 0)
)

function estadoColor(estado: string) {
  return estado === 'aprobado' ? 'estado-aprobado' : 'estado-pendiente'
}

async function aprobarPedido(id: string) {
  await aprobarEstadoPedido(id)
}

async function eliminarPedidoConfirmado(id: string, nombre: string) {
  if (!confirm(`¿Eliminar el pedido de "${nombre}"?`)) return
  try {
    await eliminarPedido(id)
    pedidos.value = pedidos.value.filter(p => p.id !== id)
    alert(`Pedido de "${nombre}" eliminado ✅`)
  } catch {
    alert('❌ Error eliminando pedido')
  }
}

function whatsappLink(whatsapp: string | undefined, nombre: string) {
  const telefono = (whatsapp || '').replace(/[^0-9]/g, '')
  const mensaje = `Hola ${nombre}, te confirmamos que recibimos tu pedido de fotos. 🙌`
  return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
}

function verAmpliada(url: string) {
  fotoAmpliada.value = url
}

let unsubscribe: (() => void) | null = null
onMounted(() => {
  unsubscribe = escucharPedidos(data => {
    pedidos.value = data
    loading.value = false
  })
})
onUnmounted(() => {
  if (unsubscribe) unsubscribe()
})
</script>

<style scoped>
.contenedor-pedidos {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  font-family: 'Inter', sans-serif;
}

.titulo-pedidos {
  text-align: center;
  font-size: 2rem;
  color: #2563eb;
  margin-bottom: 1.5rem;
}

.lista-pedidos {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.tarjeta-pedido {
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
}

.info-pedido p { margin: 0.4rem 0; }

.fotos-seleccionadas {
  margin-top: 1rem;
}

.grid-fotos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 0.6rem;
}

.foto-mini {
  width: 100%;
  aspect-ratio: 1/1;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}
.foto-mini:hover { transform: scale(1.05); }

.sin-fotos {
  font-size: 0.9rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.estado-aprobado { color: #16a34a; font-weight: 600; }
.estado-pendiente { color: #ca8a04; font-weight: 600; }

.total-recaudado {
  margin-top: 2rem;
  text-align: center;
  font-size: 1.2rem;
  color: #16a34a;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}
.foto-grande {
  max-width: 90%;
  max-height: 85%;
  border-radius: 10px;
}
.cerrar {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 22px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
}
/* 🔎 Buscador */
.buscador {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.label-busqueda {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.3rem;
}

.input-busqueda {
  width: 100%;
  max-width: 400px;
  padding: 0.6rem 1rem;
  border: 2px solid #2563eb;
  border-radius: 8px;
  outline: none;
  transition: 0.2s;
}

.input-busqueda:focus {
  border-color: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.2);
}

/* 🎯 Filtro */
.filtro-pedidos {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.select-filtro {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  border: 2px solid #2563eb;
  background: #fff;
  color: #1f2937;
  cursor: pointer;
  transition: all 0.2s;
}

.select-filtro:hover {
  border-color: #1d4ed8;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
}

/* 🔘 Botones */
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-top: 1rem;
}

.boton-aprobar,
.boton-eliminar {
  padding: 0.5rem 1.2rem;
  border: none;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
}

.boton-aprobar {
  background-color: #16a34a;
}
.boton-aprobar:hover {
  background-color: #15803d;
  transform: scale(1.05);
}

.boton-eliminar {
  background-color: #dc2626;
}
.boton-eliminar:hover {
  background-color: #b91c1c;
  transform: scale(1.05);
}

/* 📲 Enlace WhatsApp */
.link-whatsapp {
  margin-left: 0.5rem;
  text-decoration: none;
  color: #22c55e;
  font-weight: 600;
}
.link-whatsapp:hover {
  text-decoration: underline;
}

/* 🌀 Transición modal */
.fade-zoom-enter-active,
.fade-zoom-leave-active {
  transition: all 0.3s ease;
}
.fade-zoom-enter-from,
.fade-zoom-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

</style>

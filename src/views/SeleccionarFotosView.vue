<template>
  <div class="editar-pedido-container">
    <h2 class="titulo">Seleccionar Fotos</h2>

    <!-- Mensaje de notificación -->
    <div v-if="mensaje" :class="['mensaje', tipoMensaje]">{{ mensaje }}</div>

    <!-- Buscar pedido -->
    <div class="form-group">
      <input
        v-model="whatsapp"
        placeholder="Ingresá tu número de WhatsApp registrado"
        class="input"
      />
      <button @click="buscarPedido" class="boton">Buscar</button>
    </div>

    <!-- Pedido encontrado -->
    <div v-if="pedido" class="pedido-card">
      <p><strong>Nombre:</strong> {{ pedido.nombre }}</p>
      <p><strong>Estado:</strong> {{ pedido.estado ?? 'pendiente' }}</p>
      <p><strong>Fotos permitidas:</strong> {{ maxFotos }}</p>
      <p><strong>Seleccionadas:</strong> {{ seleccionadas.length }} / {{ maxFotos }}</p>

      <div v-if="pedido.estado !== 'aprobado'" class="mensaje info">
        Tu pedido está pendiente de pago 💳.
        Primero debés abonarlo para poder seleccionar tus fotos.
      </div>

      <template v-else>
        <!-- Fotos seleccionadas -->
        <div v-if="seleccionadas.length" class="seleccionadas">
          <h3>Fotos Seleccionadas</h3>
          <div class="separador"></div>
          <div class="seleccionadas-grid">
            <div
              v-for="url in seleccionadas"
              :key="url"
              class="foto-item-fija"
            >
              <img :src="url" class="foto-mini" />
              <button class="btn-ampliar-peq" @click.stop="abrirAmpliadaPorUrl(url)" title="Ver en grande">🔍</button>
              <button class="boton eliminar" @click="eliminarSeleccion(url)" title="Quitar selección">✕</button>
            </div>
          </div>
        </div>

        <!-- Galería completa -->
        <div class="galeria-container">
          <h3>Elegí tus fotos de la galería para revelar</h3>
          <div class="separador"></div>
          <div class="galeria">
            <div
              v-for="(foto, index) in fotosDisponibles"
              :key="foto.url"
              class="foto-wrapper"
            >
              <img
                :src="foto.url"
                :alt="foto.nombre"
                class="foto-mini"
                @click="toggleSeleccion(foto.url)"
                :class="{ activa: seleccionadas.includes(foto.url) }"
              />
              <button class="btn-ampliar" @click.stop="abrirAmpliada(index)" title="Ver en grande">🔍</button>
            </div>
          </div>
        </div>

        <button
          @click="guardarSeleccion"
          class="boton secundario"
          :disabled="seleccionadas.length === 0"
        >
          Guardar Selección
        </button>
      </template>
    </div>

    <!-- Modal ampliado con navegación -->
    <transition name="fade-zoom">
      <div
        v-if="fotoAmpliadaIndex !== null"
        class="modal"
        @click.self="cerrarAmpliada"
      >
        <button class="cerrar" @click="cerrarAmpliada">✕</button>

        <button class="nav izquierda" @click.stop="anteriorFoto" :disabled="fotosDisponibles.length <= 1">⬅</button>

        <img
          v-if="tieneFotos && fotoAmpliadaIndex !== null"
          :src="fotosDisponibles[fotoAmpliadaIndex].url"
          :alt="fotosDisponibles[fotoAmpliadaIndex].nombre"
          class="foto-grande"
        />

        <button class="nav derecha" @click.stop="siguienteFoto" :disabled="fotosDisponibles.length <= 1">➡</button>

        <button class="boton seleccionar" @click="toggleSeleccion(fotoActualUrl)">
          {{ fotoActualUrl && seleccionadas.includes(fotoActualUrl) ? 'Quitar de selección' : 'Seleccionar esta foto' }}
        </button>

        <div class="contador">
          {{ fotoAmpliadaIndex + 1 }} / {{ fotosDisponibles.length }}
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getPedidoPorWhatsapp, actualizarPedido } from '@/services/fotoConfirmacionService'
import { getFotosDisponibles } from '@/services/fotoService'

interface Pedido {
  id: string
  nombre: string
  paquete: number
  fotosExtra: number
  seleccionadas?: string[]
  estado?: string
}

const whatsapp = ref('')
const pedido = ref<Pedido | null>(null)
const seleccionadas = ref<string[]>([])
const fotosDisponibles = ref<{ url: string; nombre: string }[]>([])
const mensaje = ref('')
const tipoMensaje = ref<'exito' | 'error' | 'info'>('exito')

// Modal y navegación
const fotoAmpliadaIndex = ref<number | null>(null)

const maxFotos = computed(() => (pedido.value ? (pedido.value.paquete ?? 0) + (pedido.value.fotosExtra ?? 0) : 0))
const tieneFotos = computed(() => fotosDisponibles.value.length > 0)
const fotoActualUrl = computed(() => (fotoAmpliadaIndex.value !== null ? fotosDisponibles.value[fotoAmpliadaIndex.value]?.url ?? null : null))

const mostrarMensaje = (texto: string, tipo: 'exito' | 'error' | 'info' = 'exito') => {
  mensaje.value = texto
  tipoMensaje.value = tipo
  setTimeout(() => (mensaje.value = ''), 4000)
}

const buscarPedido = async () => {
  const resultado = await getPedidoPorWhatsapp(whatsapp.value.trim())
  if (!resultado) {
    mostrarMensaje('Pedido no encontrado ❌', 'error')
    pedido.value = null
    fotosDisponibles.value = []
    seleccionadas.value = []
    return
  }

  pedido.value = resultado
  seleccionadas.value = resultado.seleccionadas ?? []
  fotosDisponibles.value = []

  if (resultado.estado === 'aprobado') {
    const fotos = await getFotosDisponibles()
    fotosDisponibles.value = fotos.map(f => ({ url: f.url, nombre: f.nombre }))
  }
}

const toggleSeleccion = (url: string | null) => {
  if (!url) return
  if (seleccionadas.value.includes(url)) seleccionadas.value = seleccionadas.value.filter(f => f !== url)
  else if (seleccionadas.value.length < maxFotos.value) seleccionadas.value.push(url)
  else mostrarMensaje(`Solo podés elegir ${maxFotos.value} fotos`, 'error')
}

const eliminarSeleccion = (url: string) => {
  seleccionadas.value = seleccionadas.value.filter(f => f !== url)
}

const guardarSeleccion = async () => {
  if (!pedido.value) return
  await actualizarPedido(pedido.value.id, { seleccionadas: seleccionadas.value })
  mostrarMensaje('Selección guardada ✅', 'exito')
}

// Modal
const abrirAmpliada = (index: number) => {
  if (index < 0 || index >= fotosDisponibles.value.length) return
  fotoAmpliadaIndex.value = index
}
const abrirAmpliadaPorUrl = (url: string) => {
  const idx = fotosDisponibles.value.findIndex(f => f.url === url)
  if (idx >= 0) fotoAmpliadaIndex.value = idx
}
const cerrarAmpliada = () => (fotoAmpliadaIndex.value = null)
const siguienteFoto = () => { if (fotoAmpliadaIndex.value !== null) fotoAmpliadaIndex.value = (fotoAmpliadaIndex.value + 1) % fotosDisponibles.value.length }
const anteriorFoto = () => { if (fotoAmpliadaIndex.value !== null) fotoAmpliadaIndex.value = (fotoAmpliadaIndex.value - 1 + fotosDisponibles.value.length) % fotosDisponibles.value.length }

// teclado
const manejarTeclado = (e: KeyboardEvent) => {
  if (fotoAmpliadaIndex.value === null) return
  if (e.key === 'Escape') cerrarAmpliada()
  if (e.key === 'ArrowRight') siguienteFoto()
  if (e.key === 'ArrowLeft') anteriorFoto()
}

onMounted(() => window.addEventListener('keydown', manejarTeclado))
onUnmounted(() => window.removeEventListener('keydown', manejarTeclado))
</script>

<style scoped>
.editar-pedido-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  font-family: 'Inter', sans-serif;
}

.titulo { text-align:center; font-size:2rem; margin-bottom:1.5rem; }

.form-group { display:flex; gap:0.8rem; margin-bottom:1rem; }
.input { flex:1; padding:0.7rem; border-radius:0.5rem; border:1px solid #d1d5db; }
.boton { background:#4a90e2; color:white; padding:0.7rem 1.2rem; border:none; border-radius:0.5rem; cursor:pointer; }
.boton.secundario { background:#10b981; }

.galeria { display:grid; grid-template-columns:repeat(auto-fill,minmax(120px,1fr)); gap:0.9rem; margin-top:1rem; }
.foto-item { position:relative; }
.foto-mini { width:100%; height:100%; object-fit:cover; border-radius:8px; cursor:pointer; }
.foto-mini.activa { outline:3px solid #4a90e2; }
.btn-ampliar, .btn-ampliar-peq { position:absolute; bottom:6px; background:rgba(0,0,0,0.6); border:none; color:white; padding:4px 6px; border-radius:6px; cursor:pointer; font-size:12px; }
.btn-ampliar { right:6px; } .btn-ampliar-peq { left:6px; }

.seleccionadas-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(100px,1fr)); gap:0.6rem; }
.foto-item-fija { position:relative; width:100%; padding-top:100%; }
.foto-item-fija img { position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; border-radius:8px; }
.boton.eliminar { position:absolute; top:6px; right:6px; background:#ef4444; color:white; border-radius:50%; font-size:0.8rem; padding:0.2rem 0.4rem; border:none; cursor:pointer; }

.mensaje { text-align:center; margin-bottom:1rem; padding:0.7rem; border-radius:0.5rem; font-weight:600; }
.mensaje.exito { background:#10b981; color:white; }
.mensaje.error { background:#ef4444; color:white; }
.mensaje.info { background:#f59e0b; color:white; }

.modal {
  position:fixed; inset:0; display:flex; justify-content:center; align-items:center;
  background:rgba(0,0,0,0.75); z-index:1000;
}
.foto-grande { max-width:90%; max-height:85%; border-radius:10px; }
.cerrar { position:absolute; top:10px; right:10px; font-size:20px; background:none; border:none; color:white; cursor:pointer; }

/* Mantener estilos previos y agregar los de modal con navegación */
.modal { position: fixed; inset:0; display:flex; justify-content:center; align-items:center; background: rgba(0,0,0,0.85); flex-direction: column; z-index:1000; }
.foto-grande { max-width:90%; max-height:80%; border-radius:10px; margin-bottom:0.8rem; }
.cerrar { position:absolute; top:12px; right:12px; font-size:22px; background:none; border:none; color:white; cursor:pointer; }
.nav { position:absolute; top:50%; transform:translateY(-50%); font-size:28px; background: rgba(0,0,0,0.4); border:none; color:white; padding:6px 10px; border-radius:6px; cursor:pointer; }
.nav.izquierda { left:12px; } .nav.derecha { right:12px; }
.boton.seleccionar { margin-top:6px; background:#4a90e2; color:white; padding:0.5rem 1rem; border-radius:8px; border:none; }
.contador { color:white; margin-top:4px; }
</style>

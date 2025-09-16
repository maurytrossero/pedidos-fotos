<template>
  <div class="editar-pedido-container">
    <h2 class="titulo">Seleccionar Fotos</h2>

    <!-- Mensaje de notificación -->
    <div v-if="mensaje" :class="['mensaje', tipoMensaje]">{{ mensaje }}</div>

    <!-- Buscar pedido -->
    <div class="form-group">
      <input v-model="whatsapp" placeholder="Ingresá tu número de WhatsApp registrado" class="input" />
      <button @click="buscarPedido" class="boton">Buscar</button>
    </div>

    <!-- Pedido encontrado -->
    <div v-if="pedido" class="pedido-card">
      <p><strong>Nombre:</strong> {{ pedido.nombre }}</p>
      <p><strong>Fotos permitidas:</strong> {{ maxFotos }}</p>
      <p><strong>Seleccionadas:</strong> {{ seleccionadas.length }} / {{ maxFotos }}</p>

      <!-- Fotos seleccionadas -->
      <div v-if="seleccionadas.length" class="seleccionadas">
        <h3>Fotos Seleccionadas</h3>
        <div class="separador"></div>
        <div class="seleccionadas-grid">
          <div v-for="url in seleccionadas" :key="url" class="foto-item-fija">
            <img :src="url" class="foto-mini" />
            <button class="boton eliminar" @click="eliminarSeleccion(url)">✕</button>
          </div>
        </div>
      </div>

      <!-- Galería completa -->
      <div class="galeria-container">
        <h3>Elegí tus fotos de la galería para revelar</h3>
        <div class="separador"></div>
        <div class="galeria">
          <div
            v-for="foto in fotosDisponibles"
            :key="foto.url"
            class="foto-item"
          >
            <img
              :src="foto.pixelada"
              :alt="foto.nombre"
              class="foto-mini"
              @click="toggleSeleccion(foto.url)"
              :class="{ activa: seleccionadas.includes(foto.url) }"
            />
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { getPedidoPorWhatsapp, actualizarPedido } from '@/services/fotoConfirmacionService';
import { getPixelatedUrl } from '@/services/cloudinaryService';
import { getFotosDisponibles } from '@/services/fotoService';

interface Pedido {
  id: string;
  nombre: string;
  paquete: number;
  fotosExtra: number;
  seleccionadas?: string[];
}

const whatsapp = ref('');
const pedido = ref<Pedido|null>(null);
const seleccionadas = ref<string[]>([]);
const fotosDisponibles = ref<{url: string; pixelada: string; nombre: string}[]>([]);

const mensaje = ref('');
const tipoMensaje = ref<'exito' | 'error'>('exito');

const maxFotos = computed(() => {
  if (!pedido.value) return 0;
  return (pedido.value.paquete ?? 0) + (pedido.value.fotosExtra ?? 0);
});

const mostrarMensaje = (texto: string, tipo: 'exito'|'error'='exito') => {
  mensaje.value = texto;
  tipoMensaje.value = tipo;
  setTimeout(() => mensaje.value = '', 3000);
};

const buscarPedido = async () => {
  const resultado = await getPedidoPorWhatsapp(whatsapp.value.trim());
  if (!resultado) {
    mostrarMensaje('Pedido no encontrado ❌', 'error');
    pedido.value = null;
    return;
  }
  pedido.value = resultado;

  // Traemos las fotos desde Firestore
const fotos = await getFotosDisponibles();
  fotosDisponibles.value = fotos.map(f => ({
    url: f.url,
    pixelada: getPixelatedUrl(f.url, 20), // pixelado moderado, cambiar valor si querés menos/más
    nombre: f.nombre
  }));

  seleccionadas.value = resultado.seleccionadas ?? [];
};

const toggleSeleccion = (url: string) => {
  if (seleccionadas.value.includes(url)) {
    seleccionadas.value = seleccionadas.value.filter(f => f !== url);
  } else {
    if (seleccionadas.value.length < maxFotos.value) {
      seleccionadas.value.push(url);
    } else {
      mostrarMensaje(`Solo podés elegir ${maxFotos.value} fotos`, 'error');
    }
  }
};

const eliminarSeleccion = (url: string) => {
  seleccionadas.value = seleccionadas.value.filter(f => f !== url);
};

const guardarSeleccion = async () => {
  if (!pedido.value) return;
  await actualizarPedido(pedido.value.id, {
    seleccionadas: seleccionadas.value
  });
  mostrarMensaje('Selección guardada ✅');
};
</script>

<style scoped>
* {
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
}

.editar-pedido-container {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
}

.titulo {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1.5rem;
}

.input {
  padding: 0.7rem;
  border-radius: 0.5rem;
  border: 1px solid #d1d5db;
  font-size: 1rem;
  background-color: #f9fafb;
  color: #111827;
  transition: border 0.2s, box-shadow 0.2s;
}

.input:focus {
  outline: none;
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.boton {
  background-color: #4a90e2;
  color: white;
  padding: 0.7rem 1.2rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease;
}

.boton:hover {
  background-color: #3b7bd5;
}

.boton.secundario {
  background-color: #10b981;
}

.boton.secundario:hover {
  background-color: #059669;
}

.boton.eliminar {
  background-color: #ef4444;
  padding: 0.2rem 0.4rem;
  font-size: 0.8rem;
  position: absolute;
  top: 4px;
  right: 4px;
  border-radius: 50%;
  color: white;
  cursor: pointer;
}

.boton.eliminar:hover {
  background-color: #dc2626;
}

.pedido-card {
  background-color: #f9fafb;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  margin-top: 1rem;
  color: #111827;
}

.galeria-container h3 {
  margin-bottom: 0.5rem;
  color: #1f2937;
}

.separador {
  height: 1px;
  background-color: #d1d5db;
  margin: 0.5rem 0 0.8rem 0;
}

.galeria {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.foto-item {
  cursor: pointer;
}

.foto-mini {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  transition: transform 0.2s, border 0.2s;
}

.foto-mini:hover {
  transform: scale(1.05);
}

.foto-mini.activa {
  border: 3px solid #4a90e2;
}

/* Fotos seleccionadas */
.seleccionadas {
  margin-bottom: 1.5rem;
}

.seleccionadas h3 {
  margin-bottom: 0.5rem;
}

.seleccionadas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
}

.foto-item-fija {
  position: relative;
  width: 100%;
  padding-top: 100%;
}

.foto-item-fija img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

/* Mensajes */
.mensaje {
  text-align: center;
  margin-bottom: 1rem;
  padding: 0.7rem;
  border-radius: 0.5rem;
  font-weight: 600;
}

.mensaje.exito {
  background-color: #10b981;
  color: white;
}

.mensaje.error {
  background-color: #ef4444;
  color: white;
}

@media (max-width: 600px) {
  .editar-pedido-container {
    padding: 1rem;
  }
  .titulo {
    font-size: 1.6rem;
  }
  .seleccionadas-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.4rem;
  }
}
</style>

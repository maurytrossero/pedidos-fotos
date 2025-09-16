<template>
  <div class="editar-pedido-container">
    <h2 class="titulo">Subir fotos de prueba</h2>

    <!-- Mensaje de notificación -->
    <div v-if="mensaje" :class="['mensaje', tipoMensaje]">{{ mensaje }}</div>

    <!-- Input de archivos -->
    <div class="form-group">
      <input
        type="file"
        multiple
        @change="seleccionarArchivos"
        accept="image/*"
        class="input"
      />
    </div>

    <!-- Botón subir -->
    <button
      @click="subirFotos"
      :disabled="archivos.length === 0"
      class="boton"
    >
      Subir todas
    </button>

    <!-- Galería de fotos subidas -->
    <div class="galeria">
      <div
        v-for="foto in fotosSubidas"
        :key="foto.url"
        class="foto-item"
      >
        <img
          :src="foto.pixelada"
          :alt="foto.nombre"
          class="foto-mini"
        />
        <p class="foto-nombre">{{ foto.nombre }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { uploadToCloudinary, getPixelatedUrl } from '@/services/cloudinaryService'
import { guardarFoto } from '@/services/fotoService'

// estado reactivo
const mensaje = ref<string | null>(null)
const tipoMensaje = ref<'exito' | 'error' | ''>('')
const archivos = ref<File[]>([])
const fotosSubidas = ref<{ url: string; pixelada: string; nombre: string }[]>([])

// funciones auxiliares
const mostrarMensaje = (msg: string, tipo: 'exito' | 'error') => {
  mensaje.value = msg
  tipoMensaje.value = tipo
  setTimeout(() => {
    mensaje.value = null
    tipoMensaje.value = ''
  }, 3000)
}

const seleccionarArchivos = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    archivos.value = Array.from(target.files)
  }
}

const subirFotos = async () => {
  if (archivos.value.length === 0) return
  for (const file of archivos.value) {
    try {
      const { url, publicId } = await uploadToCloudinary(file)

      // Guardar en Firestore en la colección fotosSubidas
      await guardarFoto({
        url,
        publicId,
        nombre: file.name,
        eventoId: 'evento123' // opcional
      })

      fotosSubidas.value.push({
        url,
        pixelada: getPixelatedUrl(url, 20),
        nombre: file.name
      })

      mostrarMensaje(`Foto "${file.name}" subida ✅`, 'exito')
    } catch (err) {
      console.error('Error subiendo', file.name, err)
      mostrarMensaje(`Error subiendo "${file.name}" ❌`, 'error')
    }
  }
  archivos.value = []
}
</script>

<style scoped>
/* Contenedor general */
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
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}

/* Título */
.titulo {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

/* Form group */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

/* Input */
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
  box-shadow: 0 0 0 2px rgba(74,144,226,0.2);
}

/* Botones */
.boton {
  background-color: #4a90e2;
  color: white;
  padding: 0.7rem 1.2rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.2s ease;
  margin-top: 0.5rem;
}

.boton:hover {
  background-color: #3b7bd5;
}

.boton:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

/* Galería */
.galeria {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1.5rem;
}

.foto-item {
  text-align: center;
}

.foto-mini {
  width: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}

.foto-mini:hover {
  transform: scale(1.05);
}

.foto-nombre {
  font-size: 0.9rem;
  margin-top: 0.3rem;
  color: #1f2937;
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

/* Responsive */
@media (max-width: 600px) {
  .editar-pedido-container {
    padding: 1rem;
  }
  .titulo {
    font-size: 1.6rem;
  }
}
</style>

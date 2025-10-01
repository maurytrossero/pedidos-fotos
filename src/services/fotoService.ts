// src/services/fotoService.ts
import { db } from '@/services/firebase'
import { collection, addDoc, getDocs, serverTimestamp, orderBy, query, doc, deleteDoc } from 'firebase/firestore'
import { eliminarDeCloudinary } from './cloudinaryService'

export interface FotoData {
  url: string
  publicId: string
  nombre: string
  fecha?: any
}

export interface FotoSubida {
  id: string
  url: string
  publicId: string
  nombre: string
}

export async function guardarFoto(data: FotoData) {
  try {
    const docRef = await addDoc(collection(db, 'fotosSubidas'), {
      ...data,
      fecha: serverTimestamp(),
    })
    return docRef.id
  } catch (error) {
    console.error('Error guardando foto en Firestore:', error)
    throw error
  }
}

export async function getFotosDisponibles(): Promise<FotoSubida[]> {
  try {
    const fotosRef = collection(db, 'fotosSubidas')
    const q = query(fotosRef, orderBy('nombre', 'asc'))
    const snapshot = await getDocs(q)

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as FotoSubida[]
  } catch (error) {
    console.error('Error obteniendo fotos:', error)
    throw error
  }
}

// 🔹 Eliminar foto en Cloudinary + Firestore
export async function eliminarFoto(fotoId: string, publicId?: string) {
  try {
    if (publicId) {
      await eliminarDeCloudinary(publicId)
    }
    await deleteDoc(doc(db, 'fotosSubidas', fotoId))
  } catch (error) {
    console.error('Error eliminando foto:', error)
    throw error
  }
}

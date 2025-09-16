// src/services/fotoService.ts
import { db } from '@/services/firebase';
import { collection, addDoc, getDocs, serverTimestamp, orderBy, query, where } from 'firebase/firestore';

export interface FotoData {
  url: string;
  publicId: string;
  nombre: string;
  eventoId: string; // obligatorio para separar eventos
  fecha?: any;
}

export interface FotoSubida {
  id: string;
  url: string;
  publicId: string;
  nombre: string;
  eventoId: string;
}

/**
 * Guarda una foto en Firestore, asociada a un evento.
 */
export async function guardarFoto(data: FotoData) {
  try {
    const docRef = await addDoc(collection(db, 'fotosSubidas'), {
      ...data,
      fecha: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error guardando foto en Firestore:', error);
    throw error;
  }
}

/**
 * Obtiene las fotos disponibles para un evento específico.
 */
export async function getFotosDisponibles(): Promise<FotoSubida[]> {
  const fotosRef = collection(db, 'fotosSubidas');
  const snapshot = await getDocs(fotosRef);

  const fotos = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as FotoSubida[];

  // Ordenar por nombre en memoria
  fotos.sort((a, b) => (a.nombre > b.nombre ? 1 : -1));

  return fotos;
}


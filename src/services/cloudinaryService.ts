// src/services/cloudinaryService.ts
import imageCompression from 'browser-image-compression';

const CLOUD_NAME = process.env.VUE_APP_CLOUDINARY_CLOUD_NAME as string;
const UPLOAD_PRESET = process.env.VUE_APP_CLOUDINARY_UPLOAD_PRESET as string;


/**
 * Sube un archivo a Cloudinary y devuelve la URL y el publicId. la cuenta es mtproducciones2021@gmail.com
 */
export async function uploadToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
  // Comprimir imagen antes de subir
  const compressedFile = await imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  });

  const formData = new FormData();
  formData.append("file", compressedFile);
  formData.append("upload_preset", UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) throw new Error("Error al subir archivo a Cloudinary");

  const data = await res.json();
  return { url: data.secure_url, publicId: data.public_id };
}

/**
 * Devuelve una versión pixelada de la URL de la imagen.
 */
export function getPixelatedUrl(url: string, nivel = 30): string {
  return url.replace('/upload/', `/upload/e_pixelate:${nivel}/`);
}

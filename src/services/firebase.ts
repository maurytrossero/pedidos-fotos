// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚠️ OJO: el storageBucket debe terminar en ".appspot.com"
// Firebase nunca usa ".firebasestorage.app" para el bucket
// Si no lo corregís, no va a funcionar el Storage
const firebaseConfig = {
   apiKey: "AIzaSyCDUycEHIanb2Inu-__9NSVGQpoxgfa2rM",
  authDomain: "pedidosfotosconfirmaciones.firebaseapp.com",
  projectId: "pedidosfotosconfirmaciones",
  storageBucket: "pedidosfotosconfirmaciones.firebasestorage.app",
  messagingSenderId: "1052191065263",
  appId: "1:1052191065263:web:a6022f4e4d8d2143e6805a",
  measurementId: "G-W7GKT4P0LJ"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Firestore y Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

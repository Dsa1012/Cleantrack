// ─────────────────────────────────────────────────────────────────────────────
// Pega aquí tu configuración de Firebase
// Firebase Console → Tu proyecto → Configuración ⚙️ → Tus apps → Config
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "PEGA-TU-apiKey-AQUI",
  authDomain: "PEGA-TU-authDomain-AQUI",
  projectId: "PEGA-TU-projectId-AQUI",
  storageBucket: "PEGA-TU-storageBucket-AQUI",
  messagingSenderId: "PEGA-TU-messagingSenderId-AQUI",
  appId: "PEGA-TU-appId-AQUI",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Caixa Certo — configuração do Firebase
// Projeto: luis-multicoisas-financeiro

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjaeKM_XGoFldhSH6hchAZsqjLqs_H_RM",
  authDomain: "luis-multicoisas-financeiro.firebaseapp.com",
  projectId: "luis-multicoisas-financeiro",
  storageBucket: "luis-multicoisas-financeiro.firebasestorage.app",
  messagingSenderId: "613096720330",
  appId: "1:613096720330:web:f56624ade0a6a444f17133",
  measurementId: "G-ZK460K7N86"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

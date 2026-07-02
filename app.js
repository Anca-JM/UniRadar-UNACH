// app.js
// Importamos Firebase modular vía CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ REEMPLAZA ESTO CON LA CONFIGURACIÓN DE TU PROYECTO FIREBASE
// Estas llaves son públicas por diseño en Firebase, la seguridad reside en firestore.rules
const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "uniradar-unach.firebaseapp.com",
  projectId: "uniradar-unach",
  storageBucket: "uniradar-unach.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Función para renderizar GastroRadar
async function loadGastroData() {
    const container = document.getElementById('gastro-container');
    try {
        const q = query(collection(db, "gastronomia"), orderBy("precio", "asc"));
        const querySnapshot = await getDocs(q);
        
        container.innerHTML = ''; // Limpiar estado de carga
        
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-slate-500">El radar no detecta opciones gastronómicas por ahora.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const card = `
                <div class="bg-card rounded-xl p-6 border border-slate-700 hover:border-neon transition-all hover:glow-neon group">
                    <div class="flex justify-between items-start mb-4">
                        <h4 class="text-xl font-bold text-white group-hover:text-neon transition-colors">${data.nombre}</h4>
                        <span class="bg-neon/10 text-neon px-3 py-1 rounded-full text-sm font-mono">$${data.precio}</span>
                    </div>
                    <p class="text-slate-400 text-sm mb-4">${data.descripcion}</p>
                    <div class="flex items-center text-xs text-slate-500">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        ${data.ubicacion}
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });
    } catch (error) {
        console.error("Error escaneando GastroRadar:", error);
        container.innerHTML = '<p class="text-red-400">Interferencia en el radar. No se pudieron cargar los datos.</p>';
    }
}

// Función para renderizar AcaRadar
async function loadAcaData() {
    const container = document.getElementById('aca-container');
    try {
        const q = query(collection(db, "eventos"), orderBy("fecha", "asc"));
        const querySnapshot = await getDocs(q);
        
        container.innerHTML = '';
        
        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-slate-500">El radar no detecta eventos académicos próximos.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const card = `
                <div class="bg-card rounded-xl p-6 border border-slate-700 hover:border-electric transition-all hover:glow-electric group">
                    <h4 class="text-xl font-bold text-white mb-2 group-hover:text-electric transition-colors">${data.titulo}</h4>
                    <p class="text-slate-400 text-sm mb-4">${data.ponente}</p>
                    <div class="flex justify-between items-center text-xs">
                        <span class="text-slate-500 bg-slate-900 px-2 py-1 rounded">${data.fecha} | ${data.hora}</span>
                        <span class="text-electric border border-electric/30 px-2 py-1 rounded">${data.lugar}</span>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });
    } catch (error) {
        console.error("Error escaneando AcaRadar:", error);
        container.innerHTML = '<p class="text-red-400">Interferencia en el radar. No se pudieron cargar los datos.</p>';
    }
}

// Iniciar escaneo de radares al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    loadGastroData();
    loadAcaData();
});

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import {
  getFirestore, collection, addDoc, onSnapshot, serverTimestamp, query, orderBy
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import {
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';

// 1) Pega aquí tu configuración Firebase Web App.
// OJO: esta config NO es la llave privada del servidor, pero igual se protege con reglas Firestore.
const firebaseConfig = {
  apiKey: 'PEGAR_FIREBASE_API_KEY',
  authDomain: 'PEGAR_AUTH_DOMAIN',
  projectId: 'PEGAR_PROJECT_ID',
  storageBucket: 'PEGAR_STORAGE_BUCKET',
  messagingSenderId: 'PEGAR_MESSAGING_SENDER_ID',
  appId: 'PEGAR_APP_ID'
};

// 2) Cambia esto cuando tengas backend en Render.
const BACKEND_URL = 'https://TU-BACKEND.onrender.com';

const demoGastro = [
  { name: 'Almuerzo Casero', vendor: 'Doña Mary', location: 'Campus Norte', price: 2.50, category: 'Almuerzo', available: true },
  { name: 'Empanadas + café', vendor: 'Kiosko Central', location: 'Entrada principal', price: 1.25, category: 'Snack', available: true },
  { name: 'Sanduche mixto', vendor: 'FoodPoint UNACH', location: 'Bloque B', price: 1.75, category: 'Rápido', available: true }
];

const demoEvents = [
  { title: 'Charla de IA aplicada', organizer: 'Carrera CDIA', location: 'Auditorio', date: '2026-07-10', time: '18:00', description: 'Evento académico sobre IA y ciencia de datos.' },
  { title: 'Taller de Firestore', organizer: 'Fundamentos de BD', location: 'Lab 2', date: '2026-07-12', time: '16:00', description: 'Práctica de base de datos NoSQL.' },
  { title: 'Casa abierta digital', organizer: 'Cultura Digital', location: 'Patio central', date: '2026-07-15', time: '10:00', description: 'Exposición de proyectos estudiantiles.' }
];

let app, db, auth, user = null, firebaseReady = false;

const $ = (selector) => document.querySelector(selector);
const authBox = $('#authBox');
const gastroForm = $('#gastroForm');
const eventForm = $('#eventForm');

function escapeHtml(text) {
  return String(text).replace(/[&<>'"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' }[c]));
}

function isFirebaseConfigured() {
  return firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('PEGAR_');
}

function renderAuth() {
  if (!firebaseReady) {
    authBox.innerHTML = `<p class="text-sm text-amber-300">Modo demo activo. Configura Firebase para registrar datos reales.</p>`;
    return;
  }

  if (user) {
    authBox.innerHTML = `
      <div class="flex flex-col md:flex-row gap-2 items-center">
        <span class="text-sm text-[#39ff14]">Admin: ${escapeHtml(user.email)}</span>
        <button id="logoutBtn" class="px-3 py-2 rounded-xl bg-red-500/20 border border-red-400 text-red-200">Salir</button>
      </div>`;
    $('#logoutBtn').onclick = () => signOut(auth);
    gastroForm.classList.remove('hidden');
    eventForm.classList.remove('hidden');
  } else {
    authBox.innerHTML = `
      <form id="loginForm" class="grid md:grid-cols-3 gap-2">
        <input name="email" type="email" placeholder="admin@email.com" class="p-2 rounded-xl bg-slate-950 border border-cyan-900" required>
        <input name="password" type="password" placeholder="clave" class="p-2 rounded-xl bg-slate-950 border border-cyan-900" required>
        <div class="flex gap-2"><button class="px-3 py-2 rounded-xl bg-[#39ff14] text-black font-bold">Entrar</button><button type="button" id="registerBtn" class="px-3 py-2 rounded-xl border border-[#00ffff]">Crear</button></div>
      </form>
      <p class="text-xs text-slate-400 mt-1">Solo usuarios autenticados pueden escribir.</p>`;

    $('#loginForm').onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try { await signInWithEmailAndPassword(auth, fd.get('email'), fd.get('password')); }
      catch { alert('No se pudo iniciar sesión. Revisa usuario/clave.'); }
    };
    $('#registerBtn').onclick = async () => {
      const form = $('#loginForm');
      const fd = new FormData(form);
      try { await createUserWithEmailAndPassword(auth, fd.get('email'), fd.get('password')); }
      catch { alert('No se pudo crear usuario. Revisa contraseña mínima de 6 caracteres.'); }
    };
    gastroForm.classList.add('hidden');
    eventForm.classList.add('hidden');
  }
}

function renderGastro(items) {
  $('#gastroList').innerHTML = items.map(item => `
    <article class="glass rounded-3xl p-5 hover:scale-[1.02] transition">
      <div class="flex justify-between gap-3"><h3 class="text-xl font-black text-[#39ff14]">${escapeHtml(item.name)}</h3><span class="text-2xl font-black">$${Number(item.price).toFixed(2)}</span></div>
      <p class="text-slate-300">${escapeHtml(item.vendor)} · ${escapeHtml(item.location)}</p>
      <span class="inline-block mt-3 px-3 py-1 rounded-full border border-[#00ffff] text-[#00ffff] text-sm">${escapeHtml(item.category)}</span>
      <p class="mt-3 ${item.available ? 'text-[#39ff14]' : 'text-red-300'}">${item.available ? 'Disponible ahora' : 'No disponible'}</p>
    </article>`).join('');
}

function renderEvents(items) {
  $('#eventList').innerHTML = items.map(item => `
    <article class="glass rounded-3xl p-5 hover:scale-[1.02] transition">
      <h3 class="text-xl font-black text-[#00ffff]">${escapeHtml(item.title)}</h3>
      <p class="text-slate-300">${escapeHtml(item.organizer)} · ${escapeHtml(item.location)}</p>
      <p class="mt-2 text-[#39ff14] font-bold">${escapeHtml(item.date)} · ${escapeHtml(item.time)}</p>
      <p class="mt-3 text-slate-300">${escapeHtml(item.description)}</p>
    </article>`).join('');
}

function initTabs() {
  document.querySelectorAll('.tabBtn').forEach(btn => {
    btn.onclick = () => {
      const tab = btn.dataset.tab;
      $('#gastroPanel').classList.toggle('hidden', tab !== 'gastro');
      $('#acaPanel').classList.toggle('hidden', tab !== 'aca');
      document.querySelectorAll('.tabBtn').forEach(b => b.className = 'tabBtn px-5 py-3 rounded-2xl glass font-black');
      btn.className = `tabBtn px-5 py-3 rounded-2xl ${tab === 'gastro' ? 'bg-[#39ff14]' : 'bg-[#00ffff]'} text-black font-black`;
    };
  });
}

async function initFirebase() {
  if (!isFirebaseConfigured()) {
    renderAuth(); renderGastro(demoGastro); renderEvents(demoEvents); return;
  }
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  firebaseReady = true;

  onAuthStateChanged(auth, current => { user = current; renderAuth(); });

  onSnapshot(query(collection(db, 'gastro_items'), orderBy('updatedAt', 'desc')), snap => {
    renderGastro(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, () => renderGastro(demoGastro));

  onSnapshot(query(collection(db, 'aca_events'), orderBy('updatedAt', 'desc')), snap => {
    renderEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, () => renderEvents(demoEvents));
}

gastroForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!firebaseReady || !user) return alert('Inicia sesión y configura Firebase.');
  const fd = new FormData(e.target);
  await addDoc(collection(db, 'gastro_items'), {
    name: fd.get('name').trim(), vendor: fd.get('vendor').trim(), location: fd.get('location').trim(),
    price: Number(fd.get('price')), category: fd.get('category').trim(), available: true, updatedAt: serverTimestamp()
  });
  e.target.reset();
};

eventForm.onsubmit = async (e) => {
  e.preventDefault();
  if (!firebaseReady || !user) return alert('Inicia sesión y configura Firebase.');
  const fd = new FormData(e.target);
  await addDoc(collection(db, 'aca_events'), {
    title: fd.get('title').trim(), organizer: fd.get('organizer').trim(), location: fd.get('location').trim(),
    date: fd.get('date'), time: fd.get('time'), description: fd.get('description').trim(), updatedAt: serverTimestamp()
  });
  e.target.reset();
};

$('#notifyForm').onsubmit = async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  $('#notifyResult').textContent = 'Validando alerta segura...';
  try {
    const response = await fetch(`${BACKEND_URL}/api/notify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: fd.get('phone'), message: fd.get('message') })
    });
    const data = await response.json();
    $('#notifyResult').textContent = data.ok ? (data.demo ? data.message : 'Alerta enviada correctamente.') : data.error;
  } catch {
    $('#notifyResult').textContent = 'Backend no conectado todavía. En Render coloca la URL real en app.js.';
  }
};

initTabs();
initFirebase();

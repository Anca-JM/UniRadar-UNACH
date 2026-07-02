# UniRadar UNACH

Ecosistema digital dark/cyber para estudiantes UNACH: GastroRadar + AcaRadar.

## Stack Free Tier
- Frontend: HTML5 + Tailwind CDN + Vanilla JS. Deploy: Netlify.
- Backend: Node.js + Express. Deploy: Render.
- DB: Firebase Firestore Spark.
- Notificaciones: Clickatell desde backend solamente.

## Estructura
```txt
UniRadar_UNACH/
├─ frontend/
│  ├─ index.html
│  ├─ app.js
│  └─ netlify.toml
├─ backend/
│  ├─ server.js
│  ├─ package.json
│  ├─ .env.example
│  └─ .gitignore
├─ firestore.rules
└─ README.md
```

## Modo demo sin Firebase
Abre `frontend/index.html` en el navegador. Si no configuras Firebase, carga datos de prueba.

## Frontend en Netlify
1. Sube este repo a GitHub.
2. En Netlify: Add new site > Import from Git.
3. Base directory: `frontend`
4. Publish directory: `frontend`
5. Build command: dejar vacío.

## Backend en Render
1. New > Web Service.
2. Root Directory: `backend`
3. Build command: `npm install`
4. Start command: `npm start`
5. Variables de entorno:
```env
PORT=10000
NODE_ENV=production
FRONTEND_ORIGIN=https://TU-SITIO.netlify.app
CLICKATELL_API_KEY=tu_api_key_real
CLICKATELL_BASE_URL=https://platform.clickatell.com/messages/http/send
CLICKATELL_ENABLED=false
```

## Firebase
1. Crea proyecto en Firebase.
2. Activa Firestore.
3. Activa Authentication > Email/Password.
4. Copia tu configuración web en `frontend/app.js`, objeto `firebaseConfig`.
5. Publica `firestore.rules` en Firestore Rules.

## Colecciones sugeridas
### gastro_items
```json
{
  "name": "Almuerzo Casero",
  "vendor": "Doña Mary",
  "location": "Campus Norte",
  "price": 2.5,
  "category": "Almuerzo",
  "available": true,
  "updatedAt": "serverTimestamp"
}
```

### aca_events
```json
{
  "title": "Charla de IA",
  "organizer": "Carrera CDIA",
  "location": "Auditorio UNACH",
  "date": "2026-07-10",
  "time": "18:00",
  "description": "Evento académico para estudiantes.",
  "updatedAt": "serverTimestamp"
}
```

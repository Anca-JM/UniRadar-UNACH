// firestore.rules
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reglas para la colección GastroRadar
    match /gastronomia/{document=**} {
      // Cualquier usuario (incluso sin login) puede leer el radar
      allow read: if true;
      // SOLO usuarios autenticados (administradores) pueden crear/editar/borrar
      allow write: if request.auth != null;
    }

    // Reglas para la colección AcaRadar
    match /eventos/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}

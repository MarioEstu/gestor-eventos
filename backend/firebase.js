// Carga .env siempre desde aquí (a prueba de orden de imports)
import 'dotenv/config';
import admin from 'firebase-admin';

const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
if (!FIREBASE_PROJECT_ID || typeof FIREBASE_PROJECT_ID !== 'string') {
  throw new Error('FIREBASE_PROJECT_ID faltante o inválido (debe ser string). Revisa tu backend/.env');
}
if (!FIREBASE_CLIENT_EMAIL || typeof FIREBASE_CLIENT_EMAIL !== 'string') {
  throw new Error('FIREBASE_CLIENT_EMAIL faltante o inválido (debe ser string). Revisa tu backend/.env');
}
if (!FIREBASE_PRIVATE_KEY || typeof FIREBASE_PRIVATE_KEY !== 'string') {
  throw new Error('FIREBASE_PRIVATE_KEY faltante o inválido (debe ser string con \\n escapados). Revisa tu backend/.env');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID.trim(),
      clientEmail: FIREBASE_CLIENT_EMAIL.trim(),
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
  });
}
export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;

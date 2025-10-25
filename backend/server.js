import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import { db, FieldValue } from './firebase.js';
import { sendConfirmationEmail } from './email.js';


const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';


app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());


// Health
app.get('/health', (_, res) => res.json({ ok: true }));


// Colecciones
const EVENTS = 'events';
const PARTICIPANTS = 'participants';


// Crear evento
app.post('/events', async (req, res) => {
try {
const id = uuid();
const now = new Date().toISOString();
const data = { id, createdAt: now, updatedAt: now, ...req.body };
await db.collection(EVENTS).doc(id).set(data);
res.status(201).json(data);
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Error creando evento' });
}
});

// Listar eventos
app.get('/events', async (req, res) => {
try {
const snap = await db.collection(EVENTS).orderBy('date', 'asc').get();
const items = snap.docs.map(d => d.data());
res.json(items);
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Error listando eventos' });
}
});


// Obtener evento
app.get('/events/:id', async (req, res) => {
const doc = await db.collection(EVENTS).doc(req.params.id).get();
if (!doc.exists) return res.status(404).json({ error: 'No existe' });
res.json(doc.data());
});


// Actualizar evento
app.put('/events/:id', async (req, res) => {
try {
const ref = db.collection(EVENTS).doc(req.params.id);
await ref.update({ ...req.body, updatedAt: new Date().toISOString() });
const doc = await ref.get();
res.json(doc.data());
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Error actualizando' });
}
});


// Eliminar evento
app.delete('/events/:id', async (req, res) => {
try {
await db.collection(EVENTS).doc(req.params.id).delete();
res.json({ ok: true });
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Error eliminando' });
}
});


// Registrar participante
app.post('/events/:id/register', async (req, res) => {
try {
const eventDoc = await db.collection(EVENTS).doc(req.params.id).get();
if (!eventDoc.exists) return res.status(404).json({ error: 'Evento no existe' });


const event = eventDoc.data();
const { name, email } = req.body;
const pid = uuid();
const data = { id: pid, eventId: event.id, name, email, createdAt: new Date().toISOString() };


await db.collection(PARTICIPANTS).doc(pid).set(data);
await db.collection(EVENTS).doc(event.id).update({
registrationsCount: FieldValue.increment(1)
});


// Enviar correo (si está configurado)
await sendConfirmationEmail({ to: email, event, participant: { name } }).catch(console.warn);


res.status(201).json({ ok: true, participant: data });
} catch (e) {
console.error(e);
res.status(500).json({ error: 'Error registrando' });
}
});


app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
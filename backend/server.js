import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { v4 as uuid } from 'uuid';
import { db, FieldValue } from './firebase.js';
import { sendConfirmationEmail } from './email.js';

const app = express();
const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || CORS_ORIGIN.includes('*') || CORS_ORIGIN.includes(origin)) return cb(null, true);
    return cb(new Error('CORS bloqueado: ' + origin));
  }
}));
app.use(express.json());

app.get('/health', (_, res) => res.json({ ok: true }));

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
app.get('/events', async (_, res) => {
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
  if (!doc.exists) return res.status(404).json({ error: 'Evento no existe' });
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
    res.status(500).json({ error: 'Error actualizando evento' });
  }
});

// Eliminar evento
app.delete('/events/:id', async (req, res) => {
  try {
    await db.collection(EVENTS).doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error eliminando evento' });
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

    await sendConfirmationEmail({ to: email, event, participant: { name } }).catch(console.warn);

    res.status(201).json({ ok: true, participant: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error registrando participante' });
  }
});

// Test de correo opcional
app.post('/test-email', async (req, res) => {
  const { to } = req.body;
  try {
    await sendConfirmationEmail({
      to,
      event: { title: 'Evento de Prueba', date: '2025-11-01', time: '10:00', location: 'Online' },
      participant: { name: 'Tester' }
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => console.log(`✅ API lista en http://localhost:${PORT}`));

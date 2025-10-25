import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';


const {
SENDGRID_API_KEY,
SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
SENDER_EMAIL
} = process.env;


let mode = 'none';
if (SENDGRID_API_KEY) {
mode = 'sendgrid';
sgMail.setApiKey(SENDGRID_API_KEY);
} else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
mode = 'smtp';
}


export async function sendConfirmationEmail({ to, event, participant }) {
const subject = `Confirmación de registro: ${event.title}`;
const html = `
<h2>¡Registro confirmado!</h2>
<p>Hola ${participant.name}, te has registrado al evento <strong>${event.title}</strong>.</p>
<ul>
<li><strong>Fecha:</strong> ${event.date} ${event.time}</li>
<li><strong>Lugar:</strong> ${event.location}</li>
</ul>
<p>Nos vemos pronto. ¡Gracias!</p>
`;


if (mode === 'sendgrid') {
await sgMail.send({ to, from: SENDER_EMAIL, subject, html });
return;
}


if (mode === 'smtp') {
const transporter = nodemailer.createTransport({
host: SMTP_HOST,
port: Number(SMTP_PORT || 587),
secure: String(SMTP_SECURE || 'false') === 'true',
auth: { user: SMTP_USER, pass: SMTP_PASS }
});
await transporter.sendMail({ from: SENDER_EMAIL, to, subject, html });
return;
}


console.warn('Email deshabilitado (configura SENDGRID o SMTP)');
}
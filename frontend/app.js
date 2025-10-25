const $ = (q, el=document)=> el.querySelector(q);
const $$ = (q, el=document)=> Array.from(el.querySelectorAll(q));
const API = window.__API_BASE__;

let useLocal = false;

const ls = {
get: () => JSON.parse(localStorage.getItem('events')||'[]'),
set: (items) => localStorage.setItem('events', JSON.stringify(items))
};

async function api(method, path, body){
try{
const res = await fetch(`${API}${path}`,{
method,
headers:{'Content-Type':'application/json'},
body: body? JSON.stringify(body): undefined
});
if(!res.ok) throw new Error('HTTP '+res.status);
return await res.json();
}catch(e){
console.warn('API caída, usando localStorage', e);
useLocal = true; return null;
}
}
// Estado
let editingId = null;

async function loadEvents(){
const data = await api('GET','/events');
let items = data;
if(!data){ items = ls.get().sort((a,b)=> (a.date+a.time).localeCompare(b.date+b.time)); }
renderList(items);
}

function renderList(items){
const list = $('#events-list');
list.innerHTML = '';
const tpl = $('#event-item');
items.forEach(ev => {
const li = tpl.content.firstElementChild.cloneNode(true);
li.dataset.id = ev.id || '';
$('.title', li).textContent = ev.title;
$('.meta', li).textContent = `${ev.date} · ${ev.time} · ${ev.location}`;
$('.desc', li).textContent = ev.description||'';


// Editar
$('.edit', li).onclick = () => fillForm(ev);


// Eliminar
$('.delete', li).onclick = async () => {
if(!confirm('¿Eliminar evento?')) return;
if(useLocal){
const next = ls.get().filter(x => x.id !== ev.id);
ls.set(next); loadEvents(); return;
}
await api('DELETE', `/events/${ev.id}`);
loadEvents();
};


// Compartir
$('.share', li).onclick = () => shareEvent(ev);


// Registro
const rform = $('.register-form', li);
rform.onsubmit = async (e) => {
e.preventDefault();
const name = $('.name', rform).value.trim();
const email = $('.email', rform).value.trim();
if(!name || !email) return;
if(useLocal){
alert('Registro guardado localmente (backend no disponible).');
rform.reset();
return;
}
const out = await api('POST', `/events/${ev.id}/register`, { name, email });
if(out?.ok){ alert('¡Registro confirmado! Revisa tu correo.'); rform.reset(); }
else alert('No se pudo registrar.');
};


$('#events-list').appendChild(li);
});
}

function fillForm(ev){
editingId = ev.id || null;
$('#event-id').value = editingId||'';
$('#title').value = ev.title||'';
$('#date').value = ev.date||'';
$('#time').value = ev.time||'';
$('#location').value = ev.location||'';
$('#description').value = ev.description||'';
window.scrollTo({ top:0, behavior:'smooth' });
}


$('#event-form').onsubmit = async (e) => {
e.preventDefault();
const data = {
title: $('#title').value.trim(),
date: $('#date').value,
time: $('#time').value,
location: $('#location').value.trim(),
description: $('#description').value.trim()
};


if(useLocal){
let items = ls.get();
if(editingId){
items = items.map(x => x.id===editingId? { ...x, ...data }: x);
} else {
data.id = crypto.randomUUID();
data.createdAt = new Date().toISOString();
items.push(data);
}
ls.set(items);
editingId=null; e.target.reset(); loadEvents();
return;
}


if(editingId){
await api('PUT', `/events/${editingId}`, data);
} else {
await api('POST', '/events', data);
}
editingId=null; e.target.reset(); loadEvents();
};


$('#reset-form').onclick = () => { editingId=null; $('#event-form').reset(); };
$('#sync-btn').onclick = () => loadEvents();


function shareEvent(ev){
const url = location.href + '#evento-' + (ev.id||'');
const text = `Evento: ${ev.title} – ${ev.date} ${ev.time} – ${ev.location}`;
if(navigator.share){ navigator.share({ title: ev.title, text, url }).catch(()=>{}); return; }


const params = encodeURIComponent(text + ' ' + url);
const links = [
`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
`https://twitter.com/intent/tweet?text=${params}`,
`https://api.whatsapp.com/send?text=${params}`
];
const win = window.open(links[0], '_blank');
if(!win) alert('Copia y comparte:\n' + text + '\n' + url);
}


// Init
loadEvents();
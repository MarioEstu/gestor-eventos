const $ = (q, el=document)=> el.querySelector(q);
const $$ = (q, el=document)=> Array.from(el.querySelectorAll(q));
const API = window.__API_BASE__;
let useLocal = false;

const ls = {
  get: () => JSON.parse(localStorage.getItem('events')||'[]'),
  set: (x) => localStorage.setItem('events', JSON.stringify(x))
};

async function api(method, path, body){
  try{
    const r = await fetch(`${API}${path}`,{
      method, headers:{'Content-Type':'application/json'},
      body: body? JSON.stringify(body):undefined
    });
    if(!r.ok) throw new Error('HTTP '+r.status);
    return await r.json();
  }catch(e){
    console.warn('API caída, usando localStorage', e);
    useLocal = true; return null;
  }
}

let editingId = null;

async function loadEvents(){
  const data = await api('GET','/events');
  let items = data || ls.get();
  items.sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  renderList(items);
}

function renderList(items){
  const list = $('#events-list');
  list.innerHTML='';
  const tpl = $('#event-item');
  items.forEach(ev=>{
    const li = tpl.content.firstElementChild.cloneNode(true);
    li.dataset.id=ev.id||'';
    $('.title',li).textContent=ev.title;
    $('.meta',li).textContent=`${ev.date} · ${ev.time} · ${ev.location}`;
    $('.desc',li).textContent=ev.description||'';

    $('.edit',li).onclick=()=>fillForm(ev);
    $('.delete',li).onclick=async()=>{
      if(!confirm('¿Eliminar evento?'))return;
      if(useLocal){
        const next=ls.get().filter(x=>x.id!==ev.id);
        ls.set(next); loadEvents(); return;
      }
      await api('DELETE',`/events/${ev.id}`); loadEvents();
    };
    $('.share',li).onclick=()=>shareEvent(ev);

    const f=$('.register-form',li);
    f.onsubmit=async e=>{
      e.preventDefault();
      const name=$('.name',f).value.trim();
      const email=$('.email',f).value.trim();
      if(!name||!email)return;
      if(useLocal){ alert('Registro local.'); f.reset(); return; }
      const out=await api('POST',`/events/${ev.id}/register`,{name,email});
      if(out?.ok){ alert('¡Registro confirmado!'); f.reset(); }
      else alert('Error registrando.');
    };

    list.appendChild(li);
  });
}

function fillForm(ev){
  editingId=ev.id||null;
  $('#event-id').value=editingId||'';
  $('#title').value=ev.title||'';
  $('#date').value=ev.date||'';
  $('#time').value=ev.time||'';
  $('#location').value=ev.location||'';
  $('#description').value=ev.description||'';
  window.scrollTo({top:0,behavior:'smooth'});
}

$('#event-form').onsubmit=async e=>{
  e.preventDefault();
  const data={
    title:$('#title').value.trim(),
    date:$('#date').value,
    time:$('#time').value,
    location:$('#location').value.trim(),
    description:$('#description').value.trim()
  };

  if(useLocal){
    let items=ls.get();
    if(editingId) items=items.map(x=>x.id===editingId?{...x,...data}:x);
    else { data.id=crypto.randomUUID(); items.push(data); }
    ls.set(items); e.target.reset(); editingId=null; loadEvents(); return;
  }

  if(editingId) await api('PUT',`/events/${editingId}`,data);
  else await api('POST','/events',data);
  e.target.reset(); editingId=null; loadEvents();
};

$('#reset-form').onclick=()=>{editingId=null;$('#event-form').reset();};
$('#sync-btn').onclick=()=>loadEvents();

function shareEvent(ev){
  const url=location.href+'#evento-'+(ev.id||'');
  const text=`Evento: ${ev.title} – ${ev.date} ${ev.time} – ${ev.location}`;
  if(navigator.share){navigator.share({title:ev.title,text,url}).catch(()=>{});return;}
  const params=encodeURIComponent(text+' '+url);
  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,'_blank');
}

loadEvents();

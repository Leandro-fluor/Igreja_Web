// app.js - central JS for storage and UI interactions
const APP_KEY = 'portal_igreja_v1';

// default data
const defaults = {
  users: [{username:'admin', password:'senha123'}],
  revistas: [],
  eventos: [],
  aniversariantes: [],
  doacoes: []
};

// storage helpers
function loadState(){
  const raw = localStorage.getItem(APP_KEY);
  if(!raw){
    localStorage.setItem(APP_KEY, JSON.stringify(defaults));
    return JSON.parse(JSON.stringify(defaults));
  }
  try{
    return JSON.parse(raw);
  }catch(e){
    localStorage.setItem(APP_KEY, JSON.stringify(defaults));
    return JSON.parse(JSON.stringify(defaults));
  }
}
function saveState(state){ localStorage.setItem(APP_KEY, JSON.stringify(state)); }

// auth
function app_login(username, password){
  const st = loadState();
  const u = st.users.find(x => x.username === username && x.password === password);
  if(u){
    sessionStorage.setItem('portal_user', username);
    return true;
  }
  return false;
}
function app_isLoggedIn(){
  return !!sessionStorage.getItem('portal_user');
}
function app_logout(){
  sessionStorage.removeItem('portal_user');
}

// utilities
function money(v){ return Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}); }
function formatDateISO(d){ if(!d) return ''; return new Date(d).toISOString().slice(0,10); }

// ----- Page specific behavior ----- //
document.addEventListener('DOMContentLoaded', () => {
  // detect which page
  const path = location.pathname.split('/').pop();

  if(path === '' || path === 'index.html'){
    renderHome();
  } else if(path === 'revistas.html'){
    setupRevistas();
  } else if(path === 'eventos.html'){
    setupEventos();
  } else if(path === 'aniversariantes.html'){
    setupAnivers();
  } else if(path === 'arrecadacao.html'){
    setupDoacoes();
  }
});

function renderHome(){
  const st = loadState();
  document.getElementById('count-revistas').innerText = 'Revistas cadastradas: ' + st.revistas.length;
  document.getElementById('count-eventos').innerText = 'Próximos eventos: ' + st.eventos.length;
  // aniversariantes: those in same month as today
  const hoje = new Date();
  const month = hoje.getMonth()+1;
  const aniversThisMonth = st.aniversariantes.filter(a => {
    const m = new Date(a.data).getMonth()+1;
    return m === month;
  }).length;
  document.getElementById('count-aniversariantes').innerText = 'Aniversariantes do mês: ' + aniversThisMonth;
  const soma = st.doacoes.reduce((s,d)=>s+Number(d.valor||0),0);
  document.getElementById('count-arrecadacao').innerText = 'Total arrecadado: R$ ' + money(soma);
}

// Revistas
function setupRevistas(){
  const form = document.getElementById('revistaForm');
  const tbody = document.querySelector('#revistas-table tbody');

  function render(){
    const st = loadState();
    tbody.innerHTML = '';
    st.revistas.forEach((r,idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.titulo}</td><td>${r.autor||''}</td><td>${r.tipo}</td><td>${r.quant}</td>
        <td>
          <button data-action="edit" data-idx="${idx}">Editar</button>
          <button data-action="del" data-idx="${idx}">Excluir</button>
        </td>`;
      tbody.appendChild(tr);
    });
    // update home counts if present
    const count = document.getElementById('count-revistas');
    if(count) count.innerText = 'Revistas cadastradas: ' + st.revistas.length;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const titulo = document.getElementById('revista-titulo').value.trim();
    const autor = document.getElementById('revista-autor').value.trim();
    const quant = Number(document.getElementById('revista-quant').value);
    const tipo = document.getElementById('revista-tipo').value;
    if(!titulo) return alert('Título obrigatório');
    const st = loadState();
    // if exists title, update; else add
    const existing = st.revistas.findIndex(r => r.titulo.toLowerCase() === titulo.toLowerCase());
    if(existing >= 0){
      st.revistas[existing].autor = autor;
      st.revistas[existing].quant = quant;
      st.revistas[existing].tipo = tipo;
    } else {
      st.revistas.push({titulo, autor, quant, tipo});
    }
    saveState(st);
    form.reset();
    render();
  });

  tbody.addEventListener('click', function(e){
    const btn = e.target.closest('button');
    if(!btn) return;
    const idx = Number(btn.dataset.idx);
    const action = btn.dataset.action;
    const st = loadState();
    if(action === 'del'){
      if(confirm('Excluir este item?')){
        st.revistas.splice(idx,1);
        saveState(st);
        render();
      }
    } else if(action === 'edit'){
      const r = st.revistas[idx];
      document.getElementById('revista-titulo').value = r.titulo;
      document.getElementById('revista-autor').value = r.autor;
      document.getElementById('revista-quant').value = r.quant;
      document.getElementById('revista-tipo').value = r.tipo;
    }
  });

  render();
}

// Eventos
function setupEventos(){
  const form = document.getElementById('eventoForm');
  const list = document.getElementById('eventos-list');

  function render(){
    const st = loadState();
    list.innerHTML = '';
    st.eventos.sort((a,b)=> new Date(a.data) - new Date(b.data)).forEach((ev, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${ev.titulo}</strong> — ${formatDateISO(ev.data)} ${ev.local?(' — '+ev.local):''}
        <button data-idx="${idx}" class="del">Excluir</button>`;
      list.appendChild(li);
    });
    const count = document.getElementById('count-eventos');
    if(count) count.innerText = 'Próximos eventos: ' + st.eventos.length;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const titulo = document.getElementById('evento-titulo').value.trim();
    const data = document.getElementById('evento-data').value;
    const local = document.getElementById('evento-local').value.trim();
    if(!titulo || !data) return alert('Preencha título e data');
    const st = loadState();
    st.eventos.push({titulo, data, local});
    saveState(st);
    form.reset();
    render();
  });

  list.addEventListener('click', function(e){
    const btn = e.target.closest('button');
    if(!btn) return;
    const idx = Number(btn.dataset.idx);
    const st = loadState();
    if(confirm('Excluir evento?')){
      st.eventos.splice(idx,1);
      saveState(st);
      render();
    }
  });

  render();
}

// Aniversariantes
function setupAnivers(){
  const form = document.getElementById('aniversForm');
  const list = document.getElementById('anivers-list');

  function render(){
    const st = loadState();
    list.innerHTML = '';
    st.aniversariantes.sort((a,b)=> new Date(a.data) - new Date(b.data)).forEach((p,idx) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${p.nome}</strong> — ${formatDateISO(p.data)} <button data-idx="${idx}" class="del">Excluir</button>`;
      list.appendChild(li);
    });
    const hoje = new Date();
    const month = hoje.getMonth()+1;
    const aniversThisMonth = st.aniversariantes.filter(a => {
      const m = new Date(a.data).getMonth()+1;
      return m === month;
    }).length;
    const count = document.getElementById('count-aniversariantes');
    if(count) count.innerText = 'Aniversariantes do mês: ' + aniversThisMonth;
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const nome = document.getElementById('anivers-nome').value.trim();
    const data = document.getElementById('anivers-data').value;
    if(!nome || !data) return alert('Preencha nome e data');
    const st = loadState();
    st.aniversariantes.push({nome, data});
    saveState(st);
    form.reset();
    render();
  });

  list.addEventListener('click', function(e){
    const btn = e.target.closest('button');
    if(!btn) return;
    const idx = Number(btn.dataset.idx);
    const st = loadState();
    if(confirm('Excluir?')){
      st.aniversariantes.splice(idx,1);
      saveState(st);
      render();
    }
  });

  render();
}

// Doações
function setupDoacoes(){
  const form = document.getElementById('doacaoForm');
  const tbody = document.querySelector('#doacoes-table tbody');

  function render(){
    const st = loadState();
    tbody.innerHTML = '';
    st.doacoes.forEach((d,idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${d.nome||''}</td><td>R$ ${money(d.valor)}</td><td>${formatDateISO(d.data)}</td>
        <td><button data-idx="${idx}" data-action="del">Excluir</button></td>`;
      tbody.appendChild(tr);
    });
    const soma = st.doacoes.reduce((s,d)=>s+Number(d.valor||0),0);
    const count = document.getElementById('count-arrecadacao');
    if(count) count.innerText = 'Total arrecadado: R$ ' + money(soma);
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    const nome = document.getElementById('doador-nome').value.trim();
    const valor = Number(document.getElementById('doacao-valor').value);
    const data = document.getElementById('doacao-data').value;
    if(!valor || !data) return alert('Preencha valor e data');
    const st = loadState();
    st.doacoes.push({nome, valor, data});
    saveState(st);
    form.reset();
    render();
  });

  tbody.addEventListener('click', function(e){
    const btn = e.target.closest('button');
    if(!btn) return;
    const idx = Number(btn.dataset.idx);
    const st = loadState();
    if(confirm('Excluir doação?')){
      st.doacoes.splice(idx,1);
      saveState(st);
      render();
    }
  });

  render();
}

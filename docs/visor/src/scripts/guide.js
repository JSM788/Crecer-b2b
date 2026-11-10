// Presentation metadata describes navigation and geometry. Business text comes from Markdown.
const views = {
  general: {
    title: 'El mapa de la operación', subtitle: 'Tres procesos conectados, de la empresa al resultado en campo.', label: 'Visión general', width: 800, height: 720,
    lanes: [['HABILITAR EL SERVICIO', 'web', 20, 160], ['PREPARAR LA OPERACIÓN', 'web', 215, 170], ['EJECUTAR Y CONSULTAR', 'shared', 420, 270]],
    nodes: [
      { id: 'access', title: 'Empresas y usuarios', sub: 'Habilitar empresas, roles y acceso', x: 285, y: 65, target: 'F01', number: '01', source: 'F01' },
      { id: 'customers', title: 'Clientes y responsables', sub: 'Preparar cartera y asignaciones', x: 65, y: 265, target: 'F02', number: '02', source: 'F02' },
      { id: 'team', title: 'Consultar equipo', sub: 'Usuarios y roles de la empresa', x: 505, y: 265, source: 'F01', keyword: 'Equipo:', number: '↗' },
      { id: 'plan', title: 'Planificar visitas', sub: 'Gerencia organiza desde la web', x: 65, y: 470, target: 'F03', source: 'F03', number: '03' },
      { id: 'execute', title: 'Ejecutar en móvil', sub: 'Comercial y Mercaderista', x: 505, y: 470, target: 'F03', source: 'F03', heading: 'Ejecutar desde móvil', tone: 'mobile', number: '04' },
      { id: 'results', title: 'Consultar resultados', sub: 'Agenda, jornadas y registros', x: 285, y: 600, target: 'F03', source: 'F03', heading: 'Consultar desde web', number: '05' },
    ],
    edges: [['access','customers'],['access','team'],['customers','plan'],['plan','execute'],['execute','results']],
  },
  F01: {
    title: 'Empresas, usuarios y acceso', subtitle: 'El propietario habilita el servicio. Cada empresa conserva su propio equipo.', label: 'Proceso 01', width: 800, height: 630,
    lanes: [['PROPIETARIO GLOBAL · WEB', 'web', 20, 345], ['GERENCIA · WEB', 'shared', 410, 180]],
    nodes: [
      { id:'company', title:'Crear empresa', sub:'Nombre, subdominio y Lima', x:65,y:75,step:1,number:'1' },
      { id:'routing', title:'Configurar acceso', sub:'Dominio reconocido por el servicio', x:505,y:75,step:2,number:'2' },
      { id:'users', title:'Crear usuario', sub:'Elegir empresa y rol en el formulario', x:65,y:245,step:3,number:'3' },
      { id:'status', title:'Gestionar acceso', sub:'Activar, desactivar o suspender', x:505,y:245,keyword:'Desde Empresas',number:'4' },
      { id:'team', title:'Consultar equipo', sub:'Solo usuarios de su empresa', x:285,y:465,keyword:'Equipo:',number:'5' },
    ], edges:[['company','routing'],['company','users'],['users','status'],['users','team']],
  },
  F02: {
    title:'Clientes y responsables', subtitle:'La cartera conecta al cliente con las personas que lo visitan.', label:'Proceso 02',width:800,height:620,
    lanes:[['GERENCIA · WEB', 'web',20,350],['CONTINUIDAD DEL PROCESO','shared',410,170]],
    nodes:[
      {id:'portfolio',title:'Consultar cartera',sub:'Buscar y filtrar clientes',x:65,y:75,step:0,number:'1'},
      {id:'create',title:'Registrar cliente',sub:'Datos del negocio y Comercial opcional',x:505,y:75,step:1,number:'2'},
      {id:'assign',title:'Asignar responsables',sub:'Asignación individual o por grupo',x:285,y:245,step:3,number:'3'},
      {id:'schedule',title:'Planificar visitas',sub:'Usar los clientes del responsable',x:285,y:465,step:4,number:'4',target:'F03'},
    ],edges:[['portfolio','create'],['create','assign'],['assign','schedule']],
  },
  F03: {
    title:'De la planificación al resultado',subtitle:'Un recorrido compartido con requisitos propios para cada rol.',label:'Proceso 03',width:900,height:850,
    lanes:[['GERENCIA · WEB','web',15,155],['COMERCIAL / MERCADERISTA · MÓVIL','mobile',200,450],['GERENCIA · WEB','web',680,150]],
    nodes:[
      {id:'plan',title:'Programar visita',sub:'Responsable, cliente, fecha y hora',x:340,y:60,heading:'Preparar desde web',step:2,number:'1'},
      {id:'workday',title:'Iniciar jornada',sub:'Un inicio explícito del trabajador',x:45,y:250,heading:'Ejecutar desde móvil',step:1,number:'2',tone:'mobile'},
      {id:'agenda',title:'Consultar agenda',sub:'Abrir una visita pendiente',x:340,y:250,heading:'Ejecutar desde móvil',step:2,number:'3',tone:'mobile'},
      {id:'arrival',title:'Registrar llegada',sub:'La visita pasa a estar activa',x:635,y:250,heading:'Ejecutar desde móvil',step:3,number:'4',tone:'mobile'},
      {id:'commercial',title:'Comercial · Registrar',sub:'Resultado y fotografía opcional',x:190,y:400,tableRow:1,number:'5A',tone:'mobile'},
      {id:'merchandiser',title:'Mercaderista · Auditar',sub:'Atendida: auditoría y fotografía',x:490,y:400,tableRow:1,number:'5B',tone:'mobile'},
      {id:'close',title:'Cerrar visita',sub:'Esperar confirmación del servidor',x:340,y:530,heading:'Ejecutar desde móvil',step:5,number:'6',tone:'mobile'},
      {id:'end',title:'Cerrar jornada',sub:'Sin visitas que bloqueen el cierre',x:45,y:530,heading:'Estados y cierre',number:'7',tone:'mobile'},
      {id:'results',title:'Consultar resultados',sub:'Registros, auditoría y evidencia',x:635,y:725,heading:'Consultar desde web',number:'8'},
    ],edges:[['plan','agenda'],['workday','agenda'],['agenda','arrival'],['arrival','commercial'],['arrival','merchandiser'],['commercial','close'],['merchandiser','close'],['close','end'],['close','results']],
  },
  negocio:{title:'Entender el negocio',subtitle:'Actores, conceptos y reglas que conectan el producto.',label:'Negocio y roles',document:'business'},
  agentes:{title:'Investigar con contexto',subtitle:'Dónde buscar, qué revisar y cómo evaluar una modificación.',label:'Guía para agentes',document:'agents'},
};

const $ = (id) => document.getElementById(id);
const clone = (element) => element.cloneNode(true);
const source = (name) => document.querySelector(`[data-source="${name}"]`);
function section(root, match, level = 'H2') {
  const heading = [...root.querySelectorAll(level.toLowerCase())].find((h) => h.textContent.startsWith(match));
  if (!heading) throw new Error(`Missing documentation section: ${match}`);
  const container = document.createElement('div');
  let current = heading.nextElementSibling;
  while (current && !(current.tagName.match(/^H[1-6]$/) && Number(current.tagName[1]) <= Number(level[1]))) {
    container.append(clone(current)); current = current.nextElementSibling;
  }
  return container;
}
const documents = Object.fromEntries(['F01','F02','F03'].map((id) => [id, section(source('flows'), id)]));
let currentView = 'general';
let selectedNode = null;
let detailMode = 'explanation';
let zoom = 1;
let documentMode = false;

function nodeDocument(node) { return documents[node.source || currentView]; }
function excerpt(node) {
  const root = nodeDocument(node);
  if (!root) return source('business');
  const content = node.heading ? section(root, node.heading, 'H3') : root;
  if (node.keyword) {
    const paragraph = [...content.querySelectorAll('p')].find((p) => p.textContent.startsWith(node.keyword));
    if (!paragraph) throw new Error(`Missing documentation paragraph: ${node.keyword}`);
    return paragraph;
  }
  if (node.tableRow) {
    const fragment = document.createElement('div');
    const table = content.querySelector('table');
    if (table) { fragment.append(clone(table)); if(table.nextElementSibling)fragment.append(clone(table.nextElementSibling)); }
    return table ? fragment : content;
  }
  if (node.step !== undefined) {
    const step = content.querySelectorAll('ol > li')[node.step];
    if (!step) throw new Error(`Missing documentation step: ${node.id}`);
    const p = document.createElement('p'); p.innerHTML = step.innerHTML; return p;
  }
  return content;
}
function paragraph(text, className) {
  const p = document.createElement('p'); p.textContent = text;
  if (className) p.className = className;
  return p;
}
function setTags(tags) {
  $('detail-tags').replaceChildren(...tags.map((text) => { const el = document.createElement('span'); el.textContent = text; return el; }));
}
function renderDetail() {
  const node = selectedNode;
  const view = views[currentView];
  $('detail-title').textContent = node?.title || (currentView === 'general' ? 'Une las partes del producto' : view.title);
  $('detail-eyebrow').textContent = node ? `PASO ${node.number}` : view.label.toUpperCase();
  setTags(view.document ? ['Documentación', 'Lectura'] : currentView === 'general' ? ['Mapa general', 'Procesos conectados'] : [node?.source || currentView, node?.tone === 'mobile' ? 'Móvil' : 'Web']);
  const body = $('detail-body'); body.replaceChildren();
  const doc = node ? nodeDocument(node) : documents[currentView];
  if (detailMode === 'references') {
    body.append(paragraph('Puntos de entrada para investigar este proceso. Contrastá siempre los documentos con la implementación activa.'));
    const table = source('agents').querySelector('table');
    const list = document.createElement('ul');
    [...table.querySelectorAll('tbody tr')].filter((row) => currentView === 'general' || row.cells[0].textContent.includes(node?.source || currentView)).forEach((row) => {
      const li = document.createElement('li'); li.innerHTML = `<strong>${row.cells[0].textContent}</strong><br>${row.cells[1].innerHTML}`; list.append(li);
    });
    body.append(list);
  } else if (detailMode === 'impact') {
    if (doc) {
      const impact = [...doc.querySelectorAll('p')].find((p) => p.textContent.startsWith('Impacto de modificar'));
      if (impact) { const card = clone(impact); card.classList.add('callout'); body.append(card); }
    } else {
      body.append(paragraph('Las empresas y usuarios habilitan el acceso; las asignaciones conectan cartera y planificación; la ejecución alimenta los resultados. Revisá los procesos relacionados antes de cambiar un punto compartido.', 'callout'));
    }
    body.append(clone(section(source('agents'), 'Antes de modificar')));
  } else if (node) {
    const step = document.createElement('div'); step.className = 'section-step';
    const label = document.createElement('div'); label.className = 'step-label'; label.textContent = 'Qué sucede en este paso';
    step.append(label, clone(excerpt(node))); body.append(step);
    if (doc) {
      const first = doc.querySelector('p'); if (first) body.append(clone(first));
      if (currentView === 'F03') body.append(clone(section(doc, 'Estados y cierre', 'H3')));
      else [...doc.children].filter((el) => el.tagName === 'P' && !el.textContent.startsWith('Impacto') && el !== first).forEach((el) => body.append(clone(el)));
    }
  } else {
    body.append(paragraph(view.document ? 'Esta sección presenta el documento central. Usá la búsqueda para localizar un concepto o elegí un proceso de la navegación para volver al mapa.' : 'Elegí un bloque del mapa para ver qué hace, sus reglas y las referencias del proyecto.'));
    if (currentView === 'general') body.append(clone(section(source('business'), 'Reglas compartidas')));
    else if (doc) body.append(clone(doc));
  }
  const actions = $('detail-actions'); actions.replaceChildren();
  if (node?.target) {
    const button = document.createElement('button'); button.textContent = `Explorar ${views[node.target].title.toLowerCase()} →`;
    button.addEventListener('click', () => { location.hash = node.target; }); actions.append(button);
  }
  document.querySelectorAll('[data-detail]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.detail === detailMode)));
}

function renderMap() {
  const view = views[currentView]; const stage = $('canvas-stage');
  stage.style.width = `${view.width}px`; stage.style.height = `${view.height}px`;
  const nodes = $('nodes'); nodes.replaceChildren();
  view.lanes.forEach(([label,tone,y,height]) => {
    const lane = document.createElement('div'); lane.className = `lane ${tone}`;
    Object.assign(lane.style,{left:'20px',top:`${y}px`,width:`${view.width-40}px`,height:`${height}px`});
    const strong = document.createElement('strong'); strong.textContent = label; lane.append(strong); nodes.append(lane);
  });
  view.nodes.forEach((node) => {
    const button = document.createElement('button'); button.className = `node ${node.tone || ''}`; button.dataset.node = node.id;
    button.style.left = `${node.x}px`; button.style.top = `${node.y}px`;
    button.setAttribute('aria-pressed', String(selectedNode?.id === node.id));
    const number = document.createElement('span'); number.className = 'node-number'; number.textContent = node.number;
    const text = document.createElement('span');
    const title = document.createElement('strong'); title.textContent = node.title;
    const sub = document.createElement('small'); sub.textContent = node.sub;
    text.append(title,sub); button.append(number,text);
    button.addEventListener('click', () => { location.hash = `${currentView}/${node.id}`; }); nodes.append(button);
  });
  const svg = $('connections');
  svg.setAttribute('viewBox',`0 0 ${view.width} ${view.height}`);
  svg.innerHTML = '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="#a7adc7" stroke-width="1.3"/></marker></defs>';
  view.edges.forEach(([from,to]) => {
    const a = view.nodes.find((n) => n.id === from), b = view.nodes.find((n) => n.id === to);
    const horizontal = Math.abs(a.y-b.y) < 35;
    const forward = b.x > a.x;
    const x1 = horizontal ? a.x+(forward?214:0) : a.x+107, y1 = horizontal ? a.y+51 : a.y+110;
    const x2 = horizontal ? b.x+(forward?-6:220) : b.x+107, y2 = horizontal ? b.y+51 : b.y-8;
    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    const d = horizontal ? `M${x1} ${y1} H${x2}` : `M${x1} ${y1} V${(y1+y2)/2} H${x2} V${y2}`;
    path.setAttribute('d',d); path.setAttribute('fill','none'); path.setAttribute('stroke','#a7adc7'); path.setAttribute('stroke-width','1.5'); path.setAttribute('marker-end','url(#arrow)'); svg.append(path);
  });
  $('flow-count').textContent = currentView === 'general' ? '3 procesos · 2 canales' : `${view.nodes.length} bloques · ${view.label}`;
  highlight();
}
function highlight() {
  document.querySelectorAll('[data-node]').forEach((button) => {
    const active = button.dataset.node === selectedNode?.id;
    button.classList.toggle('selected',active); button.setAttribute('aria-pressed',String(active));
  });
}
function setZoom(next) {
  zoom = Math.max(.35,Math.min(1.6,next));
  // CSS zoom changes the scrollable layout box as well as the visual scale.
  $('canvas-stage').style.zoom = String(zoom);
  $('zoom-value').textContent = `${Math.round(zoom*100)} %`;
}
function fit() {
  const view = views[currentView];
  if (!view.nodes || $('map-area').hidden) return;
  setZoom(Math.min(1,($('canvas-viewport').clientWidth-24)/view.width));
}
function renderDocument() {
  const doc = views[currentView].document ? source(views[currentView].document) : currentView === 'general' ? source('business') : documents[currentView];
  $('document-view').replaceChildren(...[...doc.children].filter((el) => !el.querySelector('code.language-mermaid')).map(clone));
  // Links within canonical Markdown are routed to the corresponding viewer section.
  $('document-view').querySelectorAll('a').forEach((a) => {
    const href = a.getAttribute('href');
    if (href?.endsWith('recorridos.md')) a.href = '#F01';
    if (href?.endsWith('accesos.md')) a.href = '/accesos/';
    else if (href?.endsWith('mapa-producto.md')) a.href = '#general';
    else if (href?.endsWith('agentes.md')) a.href = '#agentes';
    else if (href?.endsWith('.md')) {
      const span = document.createElement('span'); span.textContent = `${a.textContent} (archivo del repositorio: ${href})`; a.replaceWith(span);
    }
  });
}
function showMode() {
  const docOnly = Boolean(views[currentView].document);
  $('map-area').hidden = documentMode || docOnly;
  $('document-view').hidden = !(documentMode || docOnly);
  $('map-mode').hidden = docOnly;
  $('map-mode').setAttribute('aria-pressed',String(!documentMode && !docOnly));
  $('doc-mode').setAttribute('aria-pressed',String(documentMode || docOnly));
  if (documentMode || docOnly) renderDocument(); else requestAnimationFrame(fit);
}
function navigate() {
  const [key, nodeId] = location.hash.slice(1).split('/');
  const next = views[key] ? key : 'general'; const changed = next !== currentView;
  currentView = next; selectedNode = views[next].nodes?.find((n) => n.id === nodeId) || null;
  $('page-title').textContent = views[next].title; $('page-subtitle').textContent = views[next].subtitle;
  $('breadcrumb-current').textContent = views[next].label;
  document.title = `${views[next].title} · Salinas`;
  document.querySelectorAll('[data-view]').forEach((link) => { const active = link.dataset.view === next; link.classList.toggle('active',active); if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current'); });
  if (views[next].nodes) { if(changed || !$('nodes').children.length)renderMap();else highlight(); }
  if (changed) { detailMode = 'explanation'; documentMode = false; }
  renderDetail();showMode();
  $('navigation').classList.remove('open'); $('menu-toggle').setAttribute('aria-expanded','false');
}
document.querySelectorAll('[data-detail]').forEach((button) => button.addEventListener('click', () => { detailMode=button.dataset.detail;renderDetail(); }));
$('map-mode').addEventListener('click', () => { documentMode=false;showMode(); });
$('doc-mode').addEventListener('click', () => { documentMode=true;showMode(); });
$('zoom-in').addEventListener('click', () => setZoom(zoom+.1));
$('zoom-out').addEventListener('click', () => setZoom(zoom-.1));
$('fit').addEventListener('click',fit);
$('panel-toggle').addEventListener('click', () => {
  const hidden = document.querySelector('.app-shell').classList.toggle('panel-hidden');
  $('panel-toggle').textContent=hidden?'Mostrar detalle ⇤':'Ocultar detalle ⇥';
  $('panel-toggle').setAttribute('aria-expanded',String(!hidden));requestAnimationFrame(fit);
});
$('fullscreen').addEventListener('click', async () => {
  try { if(document.fullscreenElement)await document.exitFullscreen();else await $('map-area').requestFullscreen(); }
  catch { notify('El navegador no permite pantalla completa. Usá Ocultar detalle para ampliar.'); }
});
document.addEventListener('fullscreenchange',fit);
$('menu-toggle').addEventListener('click', () => { const open=$('navigation').classList.toggle('open');$('menu-toggle').setAttribute('aria-expanded',String(open)); });
$('print').addEventListener('click', () => window.print());
let noticeTimer;
function notify(message) { $('notice').textContent=message;$('notice').hidden=false;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{$('notice').hidden=true;},3500); }
$('copy-link').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(location.href);notify('Enlace copiado. En local, solo abre desde esta computadora.'); }
  catch { notify('No se pudo copiar. Copiá la dirección de la barra del navegador.'); }
});
$('search').addEventListener('input', (event) => {
  const query=event.target.value.trim().toLocaleLowerCase('es');const results=$('search-results');results.replaceChildren();results.hidden=!query;
  if(!query)return;
  const matches=[];
  Object.entries(views).forEach(([id,view])=>{
    const doc=view.document?source(view.document):documents[id];
    if(`${view.title} ${view.subtitle} ${doc?.textContent || ''}`.toLocaleLowerCase('es').includes(query))matches.push({id,label:view.title});
    view.nodes?.filter((node)=>`${node.title} ${node.sub}`.toLocaleLowerCase('es').includes(query)).forEach((node)=>matches.push({id:`${id}/${node.id}`,label:node.title}));
  });
  matches.slice(0,10).forEach(({id,label})=>{const b=document.createElement('button');b.textContent=label;b.addEventListener('click',()=>{location.hash=id;event.target.value='';results.hidden=true;});results.append(b);});
  if(!matches.length)results.append(paragraph('No hay coincidencias en los procesos documentados.'));
});
document.addEventListener('keydown',(event)=>{
  if(event.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){event.preventDefault();$('navigation').classList.add('open');$('menu-toggle').setAttribute('aria-expanded','true');$('search').focus();}
  if(event.key==='Escape'){$('navigation').classList.remove('open');$('menu-toggle').setAttribute('aria-expanded','false');}
});
window.addEventListener('hashchange',navigate);
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(fit,120);});
navigate();

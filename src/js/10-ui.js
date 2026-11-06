/* =========================== INTERFACE =========================== */
const $=s=>document.querySelector(s);
const fmt=(n,d=0)=>{const v=Math.round(n*10**d)/10**d;return v.toLocaleString('fr-FR',{maximumFractionDigits:d})};
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let builds=[fromPreset(PRESETS[0]),fromPreset(PRESETS[3])];
let cur=0,compare=true,area='all',onlyOn=false,query='',view='graph';
const LS='forge-embervale-builds';
/* localStorage peut lever une exception (navigation privée, Artifact) : toujours passer par ces deux fonctions ; k : clé (builds par défaut), d : valeur si absente ou illisible */
function lsGet(k=LS,d=[]){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(v,k=LS){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;($('#toasts')||document.body).appendChild(d);setTimeout(()=>d.remove(),2200)} // empilés dans #toasts (role="status")
const B=()=>builds[cur];

/* Panneaux (1.18.0, HISTORY n° 25) : la page = grille de panneaux (plus d'onglets). Chaque panneau : ouvert / fermé (fermé = absent de la grille,
   réouvrable depuis le rail), replié / déplié, taille S (replié) · M · L (deux colonnes). Disposition retenue dans ce navigateur (lsGet/lsSet),
   jamais dans l'adresse (le hash est le code de partage). Sous 640 px : accordéon, un seul panneau déplié (lay.acc). */
const PANELS=[['tree','Arbre','h-sk'],['eq','Équipement','h-eq'],['fiche','Fiche','h-st'],['calc','Calculateur','h-opt'],['bo','Build optimal','h-bo'],['def','Défense','h-def'],['tab','Tables','h-tab']];
const PIDS=PANELS.map(p=>p[0]),pOk=k=>PIDS.includes(k),pName=k=>(PANELS.find(p=>p[0]===k)||[,''])[1];
const OPT_PANELS=['calc','bo','def','tab'],SIZES=['S','M','L'],LS_PNL='forge-embervale-panneaux';
/* Dispositions prêtes, figées dans le code (QCM 4 de l'étude) : ordre, tailles (M par défaut ; S = replié), panneaux fermés */
const DISPOS={
  theo:{l:'Théoricien',order:['tree','fiche','eq','calc','bo','def','tab'],size:{tree:'L'},closed:['bo','def','tab']},
  combat:{l:'Combat',order:['calc','def','fiche','eq','tree','bo','tab'],size:{calc:'L'},closed:['tree','eq','fiche','bo','tab']},
  mini:{l:'Minimal',order:['eq','fiche','tree','calc','bo','def','tab'],size:{tree:'S'},closed:['calc','bo','def','tab']},
  all:{l:'Tout',order:['tree','eq','fiche','calc','bo','def','tab'],size:{tree:'L'},closed:[]}};
const firstOpen=l=>l.order.find(k=>!l.closed.includes(k))||null;
function mkDispo(k){const d=DISPOS[k],size={};for(const p of PIDS)size[p]=d.size[p]||'M';
  const l={v:1,preset:k,order:d.order.slice(),size,folded:PIDS.filter(p=>size[p]==='S'),closed:d.closed.slice(),acc:null};l.acc=firstOpen(l);return l}
/* Lecture d'un état enregistré : ordre, tailles, repliés, fermés ; identifiants inconnus ignorés, panneaux absents ajoutés à la fin ; S implique replié */
function readSnap(x){if(!x||typeof x!=='object'||!Array.isArray(x.order)||!Array.isArray(x.folded)||!Array.isArray(x.closed)||!x.size||typeof x.size!=='object')return null;
  const ids=a=>[...new Set(a.filter(pOk))],order=ids(x.order);order.push(...PIDS.filter(k=>!order.includes(k)));
  const size={};for(const k of PIDS)size[k]=SIZES.includes(x.size[k])?x.size[k]:'M';
  return {order,size,folded:[...new Set([...ids(x.folded),...PIDS.filter(k=>size[k]==='S')])],closed:ids(x.closed)}}
/* Disposition retenue : une disposition prête est reprise du code (définition figée), « Ma disposition » de l'état enregistré ; illisible ou absente → Théoricien */
const isDispo=k=>typeof k==='string'&&Object.hasOwn(DISPOS,k); // pas « toString », « __proto__ »… (stockage modifié à la main)
function readLayout(x){if(!x||typeof x!=='object'||x.v!==1)return null;let mine=x.mine?readSnap(x.mine):null,l;
  if(isDispo(x.preset))l=mkDispo(x.preset);else if(x.preset==='mine'){const s=readSnap(x);if(!s)return null;l=Object.assign({v:1,preset:'mine'},s);if(!mine)mine=JSON.parse(JSON.stringify(s))}else return null; // « Ma disposition » abîmée : refaite depuis l'état relu
  if(mine)l.mine=mine;l.acc=pOk(x.acc)&&!l.closed.includes(x.acc)?x.acc:x.acc===null?null:firstOpen(l);return l}
function loadLayout(){return readLayout(lsGet(LS_PNL,null))||mkDispo('theo')}
let saveWarned=false;
function saveLayout(){const ok=lsSet(lay,LS_PNL);if(!ok&&!saveWarned){saveWarned=true;toast('Disposition non retenue : stockage du navigateur bloqué (elle vaut jusqu\'au rechargement)')}return ok} // dit une fois par visite
let lay=mkDispo('theo'),org=false,lastShown=new Set();
const isAcc=()=>matchMedia('(max-width:639px)').matches;
const isOpen=k=>!lay.closed.includes(k);
const isFolded=k=>isAcc()?k!==lay.acc:lay.folded.includes(k);
const shown=k=>pOk(k)&&isOpen(k)&&!isFolded(k); // ouvert et déplié : seuls ceux-là sont rendus (renderOptNow)
/* Tout changement manuel (taille, ordre, repli, fermeture, ouverture) bascule sur « Ma disposition », qui est retenue à part (lay.mine) */
function touch(){if(lay.preset!=='mine'&&lay.mine)toast('« Ma disposition » remplacée par celle-ci (partie de '+DISPOS[lay.preset].l+')');lay.preset='mine';lay.mine={order:lay.order.slice(),size:Object.assign({},lay.size),folded:lay.folded.slice(),closed:lay.closed.slice()}}
function commit(){touch();saveLayout();paintLayout()}
function applyDispo(k){let l;if(k==='mine'){if(!lay.mine)return false;l=Object.assign({v:1,preset:'mine'},JSON.parse(JSON.stringify(lay.mine)))}else if(isDispo(k))l=mkDispo(k);else return false;
  if(lay.mine)l.mine=lay.mine;l.acc=lay.acc&&!l.closed.includes(lay.acc)?lay.acc:firstOpen(l);lay=l;saveLayout();paintLayout();return true}
/* Monter / Descendre : échange avec le panneau ouvert voisin (les fermés ne comptent pas) */
function movePanel(k,d){const vis=lay.order.filter(isOpen),i=vis.indexOf(k),j=i+d;if(i<0||j<0||j>=vis.length)return false;
  const a=lay.order.indexOf(k),b=lay.order.indexOf(vis[j]);[lay.order[a],lay.order[b]]=[lay.order[b],lay.order[a]];commit();return true}
function setSize(k,s){if(!pOk(k)||!SIZES.includes(s))return false;lay.size[k]=s;lay.folded=lay.folded.filter(x=>x!==k);if(s==='S')lay.folded.push(k);commit();return true}
/* Replier / Déplier (on : true = replier, absent = basculer). Accordéon : déplier replie les autres, sans toucher à la disposition. Déplier un S le passe en M */
function foldPanel(k,on){if(!pOk(k))return false;if(on===undefined)on=!isFolded(k);
  if(isAcc()){lay.acc=on?(lay.acc===k?null:lay.acc):k;saveLayout();paintLayout();return true}
  lay.folded=lay.folded.filter(x=>x!==k);if(on)lay.folded.push(k);else if(lay.size[k]==='S')lay.size[k]='M';commit();return true}
function closePanel(k){if(!pOk(k)||!isOpen(k))return false;lay.closed.push(k);if(lay.acc===k)lay.acc=firstOpen(lay);commit();return true}
function openPanel(k){if(!pOk(k)||isOpen(k))return false;lay.closed=lay.closed.filter(x=>x!==k);commit();return true}
/* Aller à un panneau (barre basse, rail, clic dans Tables) : ouvert, déplié, ramené en haut de l'écran (sous la barre collée), focus sur sel ou son bouton Replier */
function goPanel(k,sel){if(!pOk(k))return;if(!isOpen(k))openPanel(k);if(isFolded(k))foldPanel(k,false);
  $('#p-'+k).scrollIntoView({block:'start'});const f=$(sel||'#pf-'+k);if(f)f.focus({preventScroll:true})}
function setOrg(on){org=!!on;paintLayout()}
/* Panneau affiché ET dans la fenêtre : sinon un message dit ce qui lui arrive (build optimal arrêté ou calculé) */
function inView(k){if(!shown(k))return false;const r=$('#p-'+k).getBoundingClientRect();return r.top+r.height>0&&r.top<(window.innerHeight||Infinity)}
/* Choix de la cible (#optBar) : dans le Calculateur s'il est affiché, sinon dans Build optimal ; ailleurs, Build optimal dit d'où vient sa cible */
function placeBar(){const t=shown('calc')?'#optTarget':shown('bo')?'#boTarget':null;if(t&&$('#optBar').parentElement!==$(t))$(t).appendChild($('#optBar'));
  $('#boTgtNote').hidden=!(t==='#optTarget'&&shown('bo'))}
/* État → page : ordre (aussi l'ordre du focus), visibilité, tailles, boutons ; puis rendu des panneaux qui viennent d'apparaître. quiet (démarrage) : pas de rendu, renderAll suit */
function paintLayout(quiet){const g=$('#pgrid'),acc=isAcc(),vis=lay.order.filter(isOpen);
  if([...g.querySelectorAll('.pnl')].map(p=>p.id).join()!==lay.order.map(k=>'p-'+k).join())for(const k of lay.order)g.appendChild($('#p-'+k)); // seulement si l'ordre change (un élément déplacé perd le focus)
  for(const k of PIDS){const p=$('#p-'+k),op=isOpen(k),fo=isFolded(k),f=$('#pf-'+k),i=vis.indexOf(k);
    p.hidden=!op;p.setAttribute('data-size',lay.size[k]);p.classList.toggle('folded',fo);$('#pb-'+k).hidden=fo;
    f.setAttribute('aria-expanded',String(!fo));f.textContent=fo?'Déplier':'Replier';f.hidden=org&&!acc;$('#po-'+k).hidden=!org;
    for(const s of SIZES)$(`#ps-${k}-${s}`).setAttribute('aria-pressed',String(lay.size[k]===s));
    $('#pu-'+k).disabled=i<=0;$('#pd-'+k).disabled=i<0||i>=vis.length-1;
    $('#r-'+k).setAttribute('aria-pressed',String(op))}
  $('#pEmpty').hidden=vis.length>0;$('#dispo').value=lay.preset;$('#dispoMine').disabled=!lay.mine;
  $('#org').setAttribute('aria-pressed',String(org));$('#orgDone').hidden=!org;$('#orgHint').hidden=!org;$('#pgrid').classList.toggle('org',org);
  placeBar();
  const now=new Set(PIDS.filter(shown));
  if(!quiet){const nw=[...now].filter(k=>!lastShown.has(k));
    if(nw.includes('tree')&&view==='graph'&&window.G){G.wake();if(treeRefit){treeRefit=false;G.focus(area)}} // classe choisie pendant que l'arbre était caché : centré sur sa zone
    if(nw.some(k=>OPT_PANELS.includes(k)))renderOptNow()} // seuls les panneaux du calculateur affichés sont rendus (20-optimizer.js)
  lastShown=now}
const ICON={tree:'<circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="12" cy="18" r="2"/><path d="M7.4 7.6l3.6 8.6M16.6 7.6l-3.6 8.6M8 6h8"/>',
  eq:'<path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6z"/>',fiche:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  calc:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',bo:'<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.5l-5.3 2.9 1.2-6-4.5-4.1 6-.7z"/>',
  def:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',tab:'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 10h18M9 5v14"/>',
  reg:'<path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/>',cible:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
  plus:'<circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/>'};
const ico=k=>`<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
/* « Ma classe » (1.19.0, HISTORY n° 26) : Guerrier, Rôdeur, Mage = les trois zones de l'arbre (AREAS). Une famille d'arme est rangée dans la zone de ses
   compétences de dégâts (Voie du guerrier, Voie du barbare ; Maîtrise des dagues, Tireur d'élite ; Maîtrise des baguettes, Lanceur de sorts) : convention
   du simulateur, le jeu n'impose pas de classe. Un clic : Build optimal ouvert et calculé pour les deux familles de la classe, arbre centré sur sa zone,
   classement du Calculateur sur la classe ; re-cliquer la classe la retire. Non retenue (comme la cible). La classe ne bride pas l'arbre (décision n° 18). */
const CLS=AREAS.filter(a=>a[0]!=='core'),CLS_OF={melee:'war',dagger:'rng',bow:'rng',wand:'mag',staff:'mag'}; // CLS_OF : famille de dégâts (CAT[c][1]) → classe
let myCls=null,treeRefit=false; // treeRefit : arbre caché au choix de la classe, recentré sur sa zone quand il réapparaît (paintLayout)
const clsName=k=>(CLS.find(c=>c[0]===k)||[,''])[1];
/* Pastille d'une zone, à sa couleur (texte : nom de la zone par défaut) */
const zoneTag=(k,t)=>{const a=AREAS.find(x=>x[0]===k);return a?`<span class="ztag" style="--ac:var(${a[2]})">${esc(t??a[1])}</span>`:''};
/* Points dépensés dans une zone : compétences au coût du rang, nœuds d'attribut à 1 point ; la somme des quatre zones = spentPoints */
const zonePts=(b,k)=>SK.reduce((a,s)=>a+(s.area===k?s.cost*Math.min(b.sk[s.id]||0,s.max):0),0)+PIPS.reduce((a,p)=>a+(p[3]===k?b.pip[p[0]]||0:0),0);
function paintCls(){for(const [k] of CLS){const bt=$('#c-'+k);if(bt)bt.setAttribute('aria-pressed',String(myCls===k))}
  const o=$('#oFamCls');if(o){o.disabled=!myCls;o.textContent=myCls?`Ma classe : ${clsName(myCls)} · ${clsFams(myCls)}`:'Ma classe (à choisir en haut)'}
  const f=$('#oFam');if(f)f.value=oFam} // liste « Armes à classer » à jour même si le Calculateur est caché (il ne la relit qu'à son rendu)
function setCls(k){if(!CLS.some(c=>c[0]===k))return false;myCls=myCls===k?null:k;area=myCls||'all';
  if(myCls)oFam='cls';else if(oFam==='cls')oFam='same';
  if(BO.busy)boStopRun(); // calcul d'une autre classe : arrêté sans message (relancé juste après, ou réglages changés)
  paintCls();renderSkills();
  if(myCls){const was=shown('bo');goPanel('bo','#c-'+k);if(was)renderOptNow()}else renderOptNow(); // panneau qui apparaît : déjà rendu par paintLayout
  if(view==='graph'&&window.G){if(shown('tree'))G.focus(area);else treeRefit=true} // arbre caché (fermé, replié, accordéon) : recentré quand il réapparaît
  if(!myCls){toast('Classe retirée : le build optimal revient aux six familles d\'arme');return true}
  boStart();toast(`${clsName(k)} : build optimal en calcul pour ${clsFams(k)} ; arbre centré sur la zone ${clsName(k)}`);return true}
/* Barre basse (< 640 px) : Réglages (niveau, exploration, Flamme : tuiles de l'Arbre), Arbre, Équipement, Cible (Calculateur), Plus (les autres) */
const BBAR=[['reg','Réglages','tree','#lvl'],['tree','Arbre','tree'],['eq','Équipement','eq'],['cible','Cible','calc','#oEnemy']],BMORE=['fiche','bo','def','tab'];
function moreOpen(on){$('#bmore').hidden=!on;$('#bb-plus').setAttribute('aria-expanded',String(on))}
/* Construit le rail, la barre basse et les commandes de chaque en-tête, puis applique la disposition retenue (démarrage, avant la création du graphe) */
function initPanels(){
  $('#rail').innerHTML=PANELS.map(([k,l])=>`<button type="button" id="r-${k}" aria-pressed="true" title="${l} : afficher ou masquer le panneau">${ico(k)}<span>${l}</span></button>`).join('');
  $('#bbar').innerHTML=BBAR.map(([k,l])=>`<button type="button" id="bb-${k}">${ico(k)}<span>${l}</span></button>`).join('')+`<button type="button" id="bb-plus" aria-expanded="false" aria-controls="bmore">${ico('plus')}<span>Plus</span></button>`;
  $('#bmore').innerHTML=BMORE.map(k=>`<button type="button" id="bm-${k}">${ico(k)}<span>${pName(k)}</span></button>`).join('');
  for(const [k,l] of PANELS){const ph=$('#p-'+k).querySelector('.ph');
    ph.insertAdjacentHTML('beforeend',`<div class="ptools"><div class="porg" id="po-${k}" role="group" aria-label="Organiser le panneau ${l}" hidden>`+
      `<span class="psz" role="group" aria-label="Taille">${SIZES.map(s=>`<button type="button" class="btn sm" id="ps-${k}-${s}" aria-pressed="false" aria-label="Taille ${s} : ${{S:'repliée',M:'normale',L:'deux colonnes'}[s]}">${s}</button>`).join('')}</span>`+
      `<button type="button" class="btn sm" id="pu-${k}">Monter</button><button type="button" class="btn sm" id="pd-${k}">Descendre</button><button type="button" class="btn sm" id="px-${k}">Fermer</button></div>`+
      `<button type="button" class="btn sm pfold" id="pf-${k}" aria-expanded="true" aria-controls="pb-${k}">Replier</button></div>`);
    $('#pf-'+k).onclick=()=>foldPanel(k);
    for(const s of SIZES)$(`#ps-${k}-${s}`).onclick=()=>setSize(k,s);
    for(const [id,d] of [['#pu-',-1],['#pd-',1]])$(id+k).onclick=()=>{if(movePanel(k,d)){const b=$(id+k);(b.disabled?$((d<0?'#pd-':'#pu-')+k):b).focus()}}; // déplacé dans la page : focus rendu au bouton (ou à l'autre, à la borne)
    $('#px-'+k).onclick=()=>{if(closePanel(k)){const r=$('#r-'+k);(r.offsetParent!==null?r:$('#org')).focus();toast('Panneau « '+l+' » fermé : rouvrez-le depuis le rail'+(isAcc()?' (« Plus » en bas)':''))}};
    $('#r-'+k).onclick=()=>{if(isOpen(k))closePanel(k);else{openPanel(k);$('#p-'+k).scrollIntoView({block:'nearest'})}}}
  for(const [k,,p,sel] of BBAR)$('#bb-'+k).onclick=()=>{moreOpen(false);goPanel(p,sel)};
  for(const k of BMORE)$('#bm-'+k).onclick=()=>{moreOpen(false);goPanel(k)};
  $('#bb-plus').onclick=()=>{const on=$('#bmore').hidden;moreOpen(on);if(on)$('#bm-'+BMORE[0]).focus()}; // ouvert : focus sur le premier choix
  $('#bmore').onkeydown=$('#bb-plus').onkeydown=e=>{if(e.key==='Escape'&&!$('#bmore').hidden){moreOpen(false);$('#bb-plus').focus()}};
  $('#dispo').onchange=e=>{if(applyDispo(e.target.value))toast('Disposition : '+(e.target.value==='mine'?'Ma disposition':DISPOS[e.target.value].l))};
  for(const [k] of CLS)$('#c-'+k).onclick=()=>setCls(k);
  $('#org').onclick=()=>setOrg(!org);$('#orgDone').onclick=()=>{setOrg(false);$('#org').focus()};
  const mq=matchMedia('(max-width:639px)'),onMq=()=>{moreOpen(false);paintLayout()};if(mq.addEventListener)mq.addEventListener('change',onMq);else if(mq.addListener)mq.addListener(onMq); // vieux Safari : addListener // passage bureau ↔ téléphone : accordéon ou grille
  lay=loadLayout();paintLayout(true)}

function renderTabs(){
  const el=$('#buildTabs');el.innerHTML='';
  builds.forEach((b,i)=>{const t=document.createElement('button');t.className='tab';t.setAttribute('role','tab');t.setAttribute('aria-selected',i===cur);
    t.innerHTML=`<span class="dot" style="background:${i?'var(--shroud)':'var(--ember)'}"></span>${'AB'[i]} · ${esc(b.name)}`;
    t.onclick=()=>{cur=i;renderAll()};el.appendChild(t)});
  $('#buildName').value=B().name;$('#cmp').checked=compare;
}
function chip(txt,cls){return `<span class="chip ${cls||''}">${txt}</span>`}
function sign(v,u){return (v>0?'+':'')+fmt(v,1)+(u||'')}
function perkChip(p,on){
  if(p[0]==='s')return chip(`${ST[p[1]][0]} ${sign(p[2],ST[p[1]][1])}`,on?'':'off');
  if(p[0]==='k'){const s=SKI[p[1]];return chip(`${s?s.fr:p[1]} +${p[2]} rang${p[2]>1?'s':''}`,'sk '+(on?'':'off'))}
  return chip(`Armure (${ARMT[p[1]]}) +3 % de part`,on?'':'off');
}
/* Perk d'arme (5 emplacements dans l'ordre, fichiers 1.0) : grisé tant que l'emplacement n'est pas débloqué (améliorations) ; ✓ = compté dans les dégâts de cette arme */
function wperkChip(p,on){if(p[0]==='k'){const s=SKI[p[1]];return chip(`${s?esc(s.fr):p[1]} +${p[2]} rang${p[2]>1?'s':''} (non compté)`,'sk '+(on?'':'off'))} // rangs d'une arme : actifs hors de la main ? non vérifié
  const [k,v]=p;return chip(`${esc(WPERK[k]||k)} +${fmt(v)}${k in WPU?WPU[k]:' %'}${WPC[k]&&on?' ✓':''}`,'tag'+(on?'':' off'))}
/* Options d'un emplacement d'équipement : nom français (07-noms.js) */
function slotOpts(sl){let opts='<option value="">— Aucun —</option>';
  if(sl[0]==='w'){const groups={};WEAPONS.forEach(w=>{(groups[w[2]]=groups[w[2]]||[]).push(w)});
    for(const c in groups)opts+=`<optgroup label="${CAT[c][0]}">`+groups[c].map(w=>`<option value="${w[0]}">${esc(nmT(ITEMS[w[0]]))} · niv. ${w[3]}</option>`).join('')+'</optgroup>';}
  else if(sl[0]==='r'){opts+=RINGS.map(r=>`<option value="${r[0]}">${esc(nmT(ITEMS[r[0]]))} · niv. ${r[2]}</option>`).join('')}
  else{SETS.forEach(S=>{const p=S.p.find(x=>x[2]===sl);if(p)opts+=`<option value="${p[0]}">${esc(nmT(ITEMS[p[0]]))} · ${S.cls}</option>`})}
  return opts}
function renderSlots(){
  const b=B(),el=$('#slots');el.innerHTML='';let n=0;
  $('#upg').value=b.upg;$('#upgTxt').textContent=b.upg===5?'5/5 · toutes les améliorations':b.upg+'/5 perks débloqués';
  SLOTS.forEach(([sl,lab])=>{
    const wrap=document.createElement('div');wrap.className='slot';
    const sel=document.createElement('select');sel.id='slot-'+sl;sel.setAttribute('aria-label',lab);
    const opts=slotOpts(sl);
    sel.innerHTML=opts;sel.value=b.gear[sl]||'';
    sel.onchange=()=>{if(sel.value)b.gear[sl]=sel.value;else delete b.gear[sl];renderAll()};
    const it=ITEMS[b.gear[sl]];if(it)n++;
    let info='';
    if(it&&it.kind==='weapon'){info=`<div class="chips">${chip(CAT[it.cat][0])}${chip((it.cat==='bow'||it.cat==='staff'?'Puissance ':'Dégâts ')+it.val)}${chip('Type : '+wtypeTxt(it))}${it.oc?chip(`Surcharge ${it.oc} % (non comptée)`):''}${it.wperks.map((p,i)=>wperkChip(p,i<b.upg)).join('')}</div>
      <div class="meta">Perks dans l'ordre des fichiers du jeu ; <span class="tag hyp">hypothèse</span> une amélioration débloque le suivant (grisé : pas encore débloqué) ; ✓ compté dans les dégâts : chance et dégâts de coup critique de cette arme</div>`}
    else if(it){const base=Object.entries(it.base).map(([k,v])=>chip(`${ST[k][0]} ${sign(v,ST[k][1])}`)).join('');
      info=`<div class="chips">${base}${it.perks.map((p,i)=>perkChip(p,i<b.upg)).join('')}</div><div class="meta"><span class="en">${esc(it.n)}</span> · Niv. ${it.lv} · ${esc(it.cls)}${it.src?' · '+esc(it.src):''}${it.set?' · panoplie '+esc(it.setFr):''}</div>`}
    wrap.innerHTML=`<div class="sname"><label for="slot-${sl}">${lab}</label></div>`;
    const cell=document.createElement('div');cell.appendChild(sel);wrap.appendChild(cell);wrap.insertAdjacentHTML('beforeend',info);
    if(it&&it.kind==='weapon'){const gs=document.createElement('select');gs.id='gem-'+sl;gs.setAttribute('aria-label','Gemme de '+lab);
      let go='<option value="">Emplacement de gemme vide</option>';for(let t=1;t<=7;t++)go+=`<optgroup label="Palier ${t}">`+GEMS.filter(g=>g[4]===t).map(g=>{const f=gemFit(GEMI[g[0]],it);return `<option value="${g[0]}">${esc(g[1])} · ${RAR[g[3]][0]}${f===false?' (type non utilisé)':''}</option>`}).join('')+'</optgroup>';
      gs.innerHTML=go;gs.value=(b.gem||{})[sl]||'';gs.onchange=()=>{b.gem=b.gem||{};if(gs.value)b.gem[sl]=gs.value;else delete b.gem[sl];renderAll()};
      const gc=document.createElement('div');gc.className='gemrow';gc.appendChild(gs);const g=GEMI[(b.gem||{})[sl]];
      if(g){const f=gemFit(g,it);gc.insertAdjacentHTML('beforeend',`<div class="gemcard" style="--rc:${RAR[g.r][1]}"><div><span class="gdot"></span><b>${esc(g.fr)}</b> <span class="en">${esc(g.en)}</span></div><div>${esc(g.d)}</div><div class="meta" style="grid-column:auto">${RAR[g.r][0]} · palier ${g.t}${g.types.length?' · se déclenche avec des dégâts '+g.types.map(x=>WTYPE[x]||x).join(', '):' · toutes armes'} · valeurs de base : ${esc(g.v)}</div>${f===false?`<div class="gwarn">Cette arme n'inflige pas de dégâts ${g.types.map(x=>WTYPE[x]||x).join(' / ')} : l'effet risque de ne jamais se déclencher.</div>`:''}</div>`)}
      wrap.appendChild(gc)}
    el.appendChild(wrap);
  });
  $('#eqCount').textContent=n+' / 9 emplacements';
}
function areaColor(k){return `var(${(AREAS.find(a=>a[0]===k)||['','','--ember'])[2]})`}
function lockedMsg(n){const pth=pathTo(B(),n);toast(pth?`Verrouillé : il faut d'abord un nœud relié (chemin le plus court : ${pathCost(B(),pth)} pts)`:'Verrouillé : aucun chemin vers ce nœud')}
function goneMsg(gone){if(gone.length){const sk=gone.filter(n=>n.kind==='skill').length,pp=gone.length-sk;toast(`Plus reliés à un point de départ, donc retirés : ${sk?sk+' compétence'+(sk>1?'s':''):''}${sk&&pp?' et ':''}${pp?pp+' nœud'+(pp>1?'s':'')+" d'attribut":''}`)}}
function addRank(b,id){const s=SKI[id],n=TOPO.byId[id];if(!s)return false;if(!(b.sk[id]>0)&&!canBuy(b,n)){lockedMsg(n);return false}b.sk[id]=Math.min(s.max,(b.sk[id]||0)+1);return true}
function remRank(b,id){const v=(b.sk[id]||0)-1;if(v>0)b.sk[id]=v;else{delete b.sk[id];goneMsg(prune(b))}}
function addPipNode(b,n){if(b.pn[n.id])return false;if(!canBuy(b,n)){lockedMsg(n);return false}b.pn[n.id]=1;syncPips(b);return true}
function remPipNode(b,n){if(!b.pn[n.id])return;delete b.pn[n.id];syncPips(b);goneMsg(prune(b))}
function addPip(b,k){const R=reach(b);const n=TOPO.pips.filter(p=>p.attr===k&&!b.pn[p.id]&&canBuy(b,p,R)).sort((x,y)=>x.idx-y.idx)[0];
  if(!n){toast(TOPO.pips.some(p=>p.attr===k&&!b.pn[p.id])?"Aucun nœud de cet attribut n'est relié pour l'instant : utilisez « Acheter le chemin »":'Tous les nœuds de cet attribut sont acquis');return}addPipNode(b,n)}
function remPip(b,k){let best=null,bc=Infinity;for(const p of TOPO.pips){if(p.attr!==k||!b.pn[p.id])continue;const t=JSON.parse(JSON.stringify(b));delete t.pn[p.id];syncPips(t);const c=prune(t).length;if(c<bc){bc=c;best=p}}if(best)remPipNode(b,best)}
/* Effet de la Flamme sur ce build : nœuds « +1 attribut tous les 2 niveaux de Flamme » acquis (compute, 02-calc.js) */
const FLAME_NODES=[['barbarian','FOR'],['gracefulStride','DEX'],['exalted','INT'],['arcaneConc','ESP'],['thickSkin','CON'],['enduranceFlame','END']];
function flameFx(b,o){const h=Math.floor(Math.max(1,Math.min(11,b.flame))/2),own=FLAME_NODES.filter(([id])=>o.R(id));
  return own.length?own.map(([id,a])=>`${SKI[id].fr} : +${h} ${a}`).join(' · '):`aucun nœud de Flamme acquis (${SKI.exalted.fr}, ${SKI.barbarian.fr}…)`}
function stepFlame(d){const b=B();b.flame=Math.max(1,Math.min(11,b.flame+d));renderAll();const bt=$(d<0?'#flameDn':'#flameUp');if(bt.disabled)$('#flame').focus()} // à la borne : focus sur le champ, pas sur un bouton désactivé
function renderSkills(){
  const b=B();
  $('#lvl').value=b.lvl;$('#exp').value=b.exp;$('#flame').value=b.flame;
  // tuiles Points et Flamme (1.17.0) : points restants en grand (en trop : rouge), barre remplie jusqu'au budget du build
  const sp=spentPoints(b),bu=budget(b),over=sp>bu,o=compute(b);
  $('#ptLbl').textContent=over?'Points en trop':'Points à attribuer';
  const pl=$('#ptLeft');pl.textContent=String(Math.abs(bu-sp));pl.classList.toggle('over',over);
  $('#spent').textContent=`${sp} / ${bu} dépensés`;
  $('#needLvl').textContent=over?`retirez-en ou montez de niveau`:`niveau requis ${levelNeeded(b)}`;
  $('#bar').className='bar'+(over?' over':'');$('#bar').firstElementChild.style.width=Math.min(100,sp/Math.max(1,bu)*100)+'%';
  $('#flameDn').disabled=b.flame<=1;$('#flameUp').disabled=b.flame>=11;$('#flameFx').textContent=flameFx(b,o);
  const ae=$('#areas');ae.innerHTML='';
  [['all','Tout','--ember'],...AREAS].forEach(([k,n,c])=>{const pts=k==='all'?sp:zonePts(b,k);
    const bt=document.createElement('button');bt.className='area';bt.style.setProperty('--ac',`var(${c})`);bt.setAttribute('aria-pressed',area===k);
    bt.innerHTML=`${n} <small>${pts} pts</small>${k===myCls?'<span class="mycls">ma classe</span>':''}`;bt.onclick=()=>{area=k;renderSkills();if(view==='graph'&&window.G)G.focus(k)};ae.appendChild(bt)});
  $('#vGraph').setAttribute('aria-pressed',view==='graph');$('#vList').setAttribute('aria-pressed',view==='list');
  $('#graphView').hidden=view!=='graph';$('#listView').hidden=view!=='list';
  if(view==='graph'){if(window.G)G.refresh(o);return}
  const RR=reach(b),DJ=dijkstra(b,RR);
  const pe=$('#pips');pe.innerHTML='';
  PIPS.filter(p=>area==='all'||p[3]===area).forEach(([k,n,ab,,max])=>{const v=b.pip[k]||0;const d=document.createElement('div');d.className='pip';
    // aucun nœud de cet attribut n'est voisin d'un nœud relié : proposer le chemin le moins cher (la vue liste sert d'alternative au clavier)
    let far=null;if(v<max&&!TOPO.pips.some(p=>p.attr===k&&!b.pn[p.id]&&canBuy(b,p,RR)))for(const p of TOPO.pips)if(p.attr===k&&!b.pn[p.id]&&DJ.dist.has(p)&&(!far||DJ.dist.get(p)<DJ.dist.get(far)))far=p;
    d.innerHTML=`<div><b>${n}</b><div class="lbl">nœuds d'attribut · 1 pt</div>${far?`<button class="btn sm pathb" aria-label="Acheter le chemin vers ${n} +1 (${DJ.dist.get(far)} pts)">Acheter le chemin (${DJ.dist.get(far)} pts)</button>`:''}</div><div class="step" style="grid-row:auto"><button aria-label="Retirer ${n}" ${v?'':'disabled'}>−</button><span class="rk">${v}/${max}</span><button aria-label="Ajouter ${n}" ${v<max?'':'disabled'}>+</button></div>`;
    const [m,p]=d.querySelectorAll('.step button');m.onclick=()=>{remPip(b,k);renderAll()};p.onclick=()=>{addPip(b,k);renderAll()};
    const pb=d.querySelector('.pathb');if(pb)pb.onclick=()=>{const pth=pathTo(b,far);if(pth){buyPath(b,pth);renderAll()}};pe.appendChild(d)});
  pe.hidden=area==='core';
  const ne=$('#nodes');ne.innerHTML='';
  const q=query.toLowerCase();
  const list=SK.filter(s=>(q?(s.fr+' '+s.en).toLowerCase().includes(q):(area==='all'||s.area===area))&&(!onlyOn||(b.sk[s.id]||0)>0||(o.gearRk[s.id]||0)>0));
  if(!list.length)ne.innerHTML='<div class="empty">Aucune compétence ne correspond. Videz la recherche ou décochez « Prises seulement ».</div>';
  list.forEach(s=>{const v=b.sk[s.id]||0,g=o.gearRk[s.id]||0;const tn=TOPO.byId[s.id];const lock=!v&&!canBuy(b,tn,RR);const d=document.createElement('div');d.className='node'+(v?' on':'')+(lock?' lock':'');
    d.style.setProperty('--ac',areaColor(s.area));
    d.innerHTML=`<div class="nn">${esc(s.fr)}<span class="en">${esc(s.en)}</span>${s.nw?'<span class="new">1.0</span>':''}${g?`<span class="gear">+${g} équip.</span>`:''}${lock?'<span class="lk">verrouillé</span>':''}</div>
      <div class="nd">${esc(s.d)}${lock?` <button class="btn sm pathb">Acheter le chemin (${DJ.dist.has(tn)?DJ.dist.get(tn):'—'} pts)</button>`:''}</div>
      <div class="step"><span class="ct">${s.cost} pt${s.cost>1?'s':''}${s.max>1?'/rang':''}</span><button aria-label="Retirer un rang à ${esc(s.fr)}" ${v?'':'disabled'}>−</button><span class="rk">${v}/${s.max}</span><button aria-label="Ajouter un rang à ${esc(s.fr)}" ${v<s.max&&!lock?'':'disabled'}>+</button></div>`;
    const bs=d.querySelectorAll('.step button');bs[0].onclick=()=>{remRank(b,s.id);renderAll()};bs[1].onclick=()=>{if(addRank(b,s.id))renderAll()};
    const pb=d.querySelector('.pathb');if(pb)pb.onclick=()=>{const pth=pathTo(b,tn);if(pth){buyPath(b,pth);renderAll()}};ne.appendChild(d)});
}
/* Fiche */
function rowsFor(o){
  const A=o.attr,r=[];const g=(title)=>r.push({h:title});const x=(lab,v,u,d,better)=>r.push({lab,v,u:u||'',d:d||0,better:better||1});
  g('Ressources');x('Santé',o.hp);x('Régén. de santé',o.hpReg);x('Mana',o.mana);x('Régén. de mana',o.manaReg);x('Vigueur',o.sta);x('Régén. de vigueur',o.staReg);x('Régén. de vigueur de base',o.staRegPct,' %');
  g('Défense');x('Armure physique des objets',o.armPhys,' %');x('Armure magique des objets',o.armMag,' %');x('Résistance au feu',o.resFire,' %');x('Résistance à la glace',o.resIce,' %');
  x('Résistance à la foudre',o.resShock,' %');x('Résistance au Shroud',o.resShroud,' %');x('Résistance au poison',o.resPoison,' %');x('Résistance au froid',o.frost);x('Blocage',o.block);x('Puissance de parade',o.parry,' %');
  g('Offensive');x('Chance de critique (base)',o.critC,' %');x('Dégâts critiques (base, hors perks d\'arme)',o.critD,' %');x('Attaque impitoyable',o.merciless,' %');x('Dégâts dans le dos',o.backstab,' %');x('Attaque furtive',o.sneak,' %');
  x('Contre ennemis de mêlée',o.vs.vsMelee,' %');x('Contre ennemis à distance',o.vs.vsRanged,' %');x('Contre ennemis magiques',o.vs.vsMagic,' %');x('Contre les Déchus',o.vs.vsFell,' %');x('Contre les Creux',o.vs.hollow,' %');
  g('Soutien et utilitaire');x('Soins',o.healing,' %');x('PV à la réanimation',o.reviveHeal,' %');x('Durée de réanimation',o.revive,' s',1,-1);x('Temps de charge des sorts',o.charge,' %',0,-1);
  x('Temps dans le Shroud',o.shroudTime,' s');x('Vitesse de sprint',o.sprint,' %');x('Vitesse en furtivité',o.sneakSpeed,' %');
  x('Vol de vie',o.hpLeech);x('Vol de vie (%)',o.hpLeechP,' %');x('Vol de mana',o.manaLeech);x('Vol de mana (%)',o.manaLeechP,' %');x('Vol de vigueur',o.staLeech);
  return r.map(e=>{if(typeof e.v==='string')e.v=Number(e.v);return e});
}
function attrBlock(o,o2){
  return `<div class="attrs">${PIPS.map(([k,n,ab])=>{const v=o.attr[k];let d='';if(o2){const df=o2.attr[k]-v;d=` <em class="${df>0?'d-up':df<0?'d-dn':'d-0'}">B ${o2.attr[k]}</em>`}
    return `<div class="attr"><span>${n}</span><b>${v}${d}</b></div>`}).join('')}</div>`;
}
function weaponBlock(wc,label){
  if(!wc)return `<div class="wcard"><div class="wl">${label} : aucune arme</div></div>`;
  return `<div class="wcard"><div class="wl">${label} · ${wc.catName} · ${wtypeTxt(wc.w)}</div><h3>${nmH(wc.w)}</h3>
  <div class="big"><div><b>${fmt(wc.hit)}</b><span>${wc.unit} estimés / coup</span></div><div><b>${fmt(wc.avg)}</b><span>moyenne avec critiques</span></div><div><b>+${fmt(wc.bonus)} %</b><span>bonus cumulés</span></div><div><b>${fmt(wc.cc,1)} %</b><span>critique</span></div><div><b>+${fmt(wc.cd)} %</b><span>dégâts critiques</span></div></div>
  ${wc.gem?`<div class="wl" style="color:var(--ink)"><span class="gdot" style="--rc:${RAR[wc.gem.r][1]}"></span>${esc(wc.gem.fr)} : ${esc(wc.gem.d)} <span style="color:var(--muted)">(effet conditionnel, non compté dans les dégâts)</span></div>`:'<div class="wl">Aucune gemme</div>'}
  <details class="why"><summary>Détail des bonus (base ${wc.w.val})</summary><ul>${wc.parts.map(p=>`<li>${esc(p[0])} : +${fmt(p[1])} %</li>`).join('')||'<li>Aucun bonus</li>'}${wc.cparts.map(p=>`<li>Critique · ${esc(p[0])} : +${fmt(p[1])} %</li>`).join('')}${wc.cdparts.map(p=>`<li>Dégâts critiques · ${esc(p[0])} : +${fmt(p[1])} %</li>`).join('')}</ul></details></div>`;
}
function gearSkills(o){const e=Object.entries(o.gearRk);if(!e.length)return '';
  return `<div><div class="lbl">Rangs de compétences apportés par l'équipement</div><div class="chips" style="grid-column:auto;margin-top:4px">${e.sort((a,b)=>b[1]-a[1]).map(([id,v])=>chip(`${SKI[id]?SKI[id].fr:id} +${v}`,'sk')).join('')}</div></div>`}
function renderStats(){
  const el=$('#stats');const oa=compute(builds[0]),ob=compute(builds[1]);
  if(compare){
    $('#stMode').textContent='A contre B';
    const ra=rowsFor(oa),rb=rowsFor(ob);
    let t=`<table class="st"><thead><tr><th>Statistique</th><th style="color:var(--ember)">A</th><th style="color:var(--shroud)">B</th><th>B − A</th></tr></thead><tbody>`;
    ra.forEach((r,i)=>{if(r.h){t+=`<tr><th colspan="4" class="lbl" style="padding-top:12px">${r.h}</th></tr>`;return}
      const vb=rb[i].v;if(!r.v&&!vb)return;const df=vb-r.v;const good=df*r.better>0;
      t+=`<tr><th>${r.lab}</th><td>${fmt(r.v,r.d)}${r.u}</td><td>${fmt(vb,r.d)}${r.u}</td><td class="${df===0?'d-0':good?'d-up':'d-dn'}">${df===0?'=':sign(df,r.u)}</td></tr>`});
    t+='</tbody></table>';
    el.innerHTML=`<div><div class="lbl">Attributs · A (B en couleur)</div>${attrBlock(oa,ob)}</div>
      <div class="lbl">Armes du build A</div>${weaponBlock(oa.weapons[0],'Arme 1')}${weaponBlock(oa.weapons[1],'Arme 2')}
      <div class="lbl">Armes du build B</div>${weaponBlock(ob.weapons[0],'Arme 1')}${weaponBlock(ob.weapons[1],'Arme 2')}
      ${t}${note()}`;
  }else{
    const o=cur?ob:oa;$('#stMode').textContent='Build '+'AB'[cur];
    let t='<table class="st"><tbody>';
    rowsFor(o).forEach(r=>{if(r.h){t+=`<tr><th colspan="2" class="lbl" style="padding-top:12px">${r.h}</th></tr>`;return}if(!r.v)return;t+=`<tr><th>${r.lab}</th><td>${fmt(r.v,r.d)}${r.u}</td></tr>`});
    t+='</tbody></table>';
    el.innerHTML=`<div><div class="lbl">Attributs</div>${attrBlock(o)}</div>${weaponBlock(o.weapons[0],'Arme 1')}${weaponBlock(o.weapons[1],'Arme 2')}${t}${gearSkills(o)}${note()}`;
  }
}
function note(){return `<div class="note"><strong>Comment lire ces chiffres.</strong> La 1.0 n'a <strong>aucun bonus de panoplie</strong> : chaque pièce apporte ses propres stats, porter 5 pièces d'un même set n'ajoute rien. Les fichiers 1.0 ne publient pas les valeurs d'armure finales, d'où les pourcentages seuls. Les dégâts d'armes sont des estimations du wiki au niveau requis, sauf baguettes et bâtons (base commune de la famille, d'après les fichiers 1.0) ; parmi les perks d'arme, seuls la chance et les dégâts de coup critique sont comptés ; les bonus sont additionnés, ce qui reste une approximation du calcul du jeu. Les rangs donnés par l'équipement sont ajoutés à ceux de l'arbre. Les nœuds « +1 tous les 2 niveaux de Flamme » utilisent le niveau de Flamme saisi. Un nœud ne s'achète que s'il touche un point de départ (Étincelle) ou un nœud acquis qui y est relié ; le tracé de l'arbre (positions et liaisons) est celui des fichiers du jeu 1.0, relevé par PinDrop ; que chaque liaison marche dans les deux sens est une déduction de ces fichiers (comme PinDrop), pas un texte officiel. Chaque rang est supposé coûter le prix du nœud (les fichiers n'en donnent qu'un par nœud).</div>`}
function renderSaved(){const s=lsGet();$('#saved').innerHTML='<option value="">Mes builds…</option>'+s.map((x,i)=>`<option value="${i}">${esc(x.name)}</option>`).join('')}
function renderAll(){renderTabs();renderSlots();renderSkills();renderStats()}

/* Événements */
$('#buildName').oninput=e=>{B().name=e.target.value||'Sans nom';renderTabs();$('#buildName').focus();renderStats()};
$('#cmp').onchange=e=>{compare=e.target.checked;renderStats();if(!shown('fiche'))toast('Comparaison A et B '+(compare?'affichée':'retirée')+' : voir le panneau Fiche'+(isOpen('fiche')?' (replié)':' (fermé : rail)'))};
[['mage','Mage et magie'],['heal','Soin et soutien'],['tank','Tank'],['war','Guerrier'],['rng','Rôdeur']].forEach(([c,l])=>$('#preset').insertAdjacentHTML('beforeend',`<optgroup label="${l}">`+PRESETS.map((p,i)=>p.cat===c?`<option value="${i}">${esc(p.name)}</option>`:'').join('')+'</optgroup>'));
$('#preset').onchange=e=>{if(e.target.value==='')return;const p=PRESETS[+e.target.value];builds[cur]=fromPreset(p);e.target.value='';renderAll();
  toast('Build chargé dans '+'AB'[cur]+(p.lvl!=null||p.flame!=null?` : niveau ${B().lvl}, exploration ${B().exp}, Flamme ${B().flame} (réglages du preset)`:''))};
$('#copyAB').onclick=()=>{builds[1-cur]=JSON.parse(JSON.stringify(B()));renderAll();toast('Copié vers '+'AB'[1-cur])};
$('#reset').onclick=()=>{builds[cur]=blankBuild('Build '+'AB'[cur]);renderAll()};
$('#upg').oninput=e=>{B().upg=+e.target.value;renderSlots();renderSkills();renderStats()};
[['#lvl','lvl',1,50],['#exp','exp',0,114],['#flame','flame',1,11]].forEach(([s,k,mn,mx])=>{$(s).onchange=e=>{let v=parseInt(e.target.value,10);if(isNaN(v))v=mn;B()[k]=Math.max(mn,Math.min(mx,v));renderAll()}});
$('#flameDn').onclick=()=>stepFlame(-1);$('#flameUp').onclick=()=>stepFlame(1);
$('#q').oninput=e=>{query=e.target.value.trim();renderSkills()};
$('#onlyOn').onchange=e=>{onlyOn=e.target.checked;renderSkills()};
$('#vGraph').onclick=()=>{view='graph';renderSkills();if(window.G)G.resize()};
$('#vList').onclick=()=>{view='list';renderSkills()};
$('#save').onclick=()=>{const s=lsGet();const b=JSON.parse(JSON.stringify(B()));const i=s.findIndex(x=>x.name===b.name);if(i>=0)s[i]=b;else s.push(b);
  if(lsSet(s)){renderSaved();toast('« '+b.name+' » enregistré dans ce navigateur')}else toast('Enregistrement impossible ici : utilisez « Partager »')};
/* Build enregistré : ceux d'avant le tracé réel (1.8 et avant : nœuds d'attribut de l'ancien tracé, ou comptes seuls) sont migrés */
function loadSaved(s){const b=Object.assign(blankBuild(),JSON.parse(JSON.stringify(s)));b.upg=Math.max(0,Math.min(5,Math.round(+b.upg)||0));/* borné comme dans decode */if(s.tv)return normalize(b);delete b.pn;b.tv=1;return migrate(b,'saved')}
$('#saved').onchange=e=>{if(e.target.value==='')return;const s=lsGet()[+e.target.value];if(s){builds[cur]=loadSaved(s);renderAll();if(!migNotice(builds[cur]))toast('Chargé dans '+'AB'[cur])}};
$('#delSaved').onclick=()=>{const v=$('#saved').value;if(v===''){toast('Choisissez d\'abord un build dans « Mes builds »');return}const s=lsGet();const n=s[+v].name;s.splice(+v,1);lsSet(s);renderSaved();toast('« '+n+' » supprimé')};
/* Build d'avant le tracé réel : dire ce qui a été ajouté pour le relier, et l'éventuel dépassement de budget */
function migNotice(b){const g=b&&b._mig;if(!g||!(g.pts>0||g.gone>0))return false;
  const names=[...g.addSk.map(id=>SKI[id].fr),...Object.entries(g.addPip).map(([a,n])=>PIPS.find(p=>p[0]===a)[1]+' +'+n)];const over=spentPoints(b)-budget(b);
  const m=modal(`<h2>${g.from==='b3'?'Lien fait sur un tracé antérieur':(g.from==='saved'?'Build enregistré':'Lien')+" d'avant le tracé réel"}</h2><p class="sub">${g.from==='b3'?"Ce lien a été créé avant la dernière mise à jour du tracé de l'arbre (patch du jeu).":(g.from==='saved'?'Ce build a été enregistré':'Ce code '+esc(g.from)+'- a été créé')+" avant la version 1.9.0, qui reprend le vrai tracé de l'arbre du jeu."} Vos choix sont conservés${g.gone?`, sauf ${g.gone} nœud${g.gone>1?'s':''} qui n'existe${g.gone>1?'nt':''} plus`:''} (équipement, gemmes, compétences et rangs, attributs).${names.length?` Pour les relier à un point de départ, ces nœuds ont été ajoutés (+${g.pts} pt${g.pts>1?'s':''}) :`:''}</p>
${names.length?`<div>${esc(names.join(', '))}.</div>`:''}${over>0?`<p class="over-msg">Budget dépassé de ${over} pts : retirez des nœuds ou montez de niveau.</p>`:''}<div class="row"><button class="btn primary" id="mok">Compris</button></div>`);
  m.querySelector('#mok').onclick=()=>m.remove();return true}
function modal(html){const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="box" role="dialog" aria-modal="true">${html}</div>`;m.onclick=e=>{if(e.target===m)m.remove()};document.body.appendChild(m);return m}
function copy(text,ta){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>toast('Copié'),()=>{ta.select();toast('Sélectionné : copiez avec Ctrl+C')})}else{ta.select();toast('Sélectionné : copiez avec Ctrl+C')}}
$('#share').onclick=()=>{const code=encode(B());try{history.replaceState(null,'','#'+code)}catch(e){location.hash=code}
  const m=modal(`<h2>Partager « ${esc(B().name)} »</h2><p class="sub">Ce code contient l'équipement, l'arbre et les réglages. Il est aussi placé à la fin du lien de la page : un lien copié depuis la barre d'adresse ouvre directement ce build.</p>
  <textarea id="shareCode" readonly>${code}</textarea><div class="row"><button class="btn primary" id="cpy">Copier le code</button><button class="btn" id="cls">Fermer</button></div>`);
  m.querySelector('#cpy').onclick=()=>copy(code,m.querySelector('#shareCode'));m.querySelector('#cls').onclick=()=>m.remove()};
$('#import').onclick=()=>{const m=modal(`<h2>Importer un build</h2><p class="sub">Collez un code commençant par <code>b3-</code> ; les anciens <code>b2-</code> et <code>b1-</code> marchent aussi (adaptés au tracé réel de l'arbre). Il sera chargé dans l'emplacement ${'AB'[cur]}.</p><textarea id="impCode" placeholder="b3-…"></textarea><p class="over-msg" id="impErr" hidden>Code non reconnu : vérifiez qu'il est complet et commence par b3-, b2- ou b1-.</p><div class="row"><button class="btn primary" id="go">Importer</button><button class="btn" id="cls">Annuler</button></div>`);
  m.querySelector('#go').onclick=()=>{const b=decode(m.querySelector('#impCode').value);if(!b){m.querySelector('#impErr').hidden=false;return}builds[cur]=b;m.remove();renderAll();if(!migNotice(b))toast('Build importé dans '+'AB'[cur])};m.querySelector('#cls').onclick=()=>m.remove()};
function fromHash(){const h=location.hash.slice(1);if(/^b[123]-/i.test(h)){const b=decode(h);if(b){builds[0]=b;cur=0;compare=false;
  if(b._mig){try{history.replaceState(null,'','#'+encode(b))}catch(e){}setTimeout(()=>migNotice(b),0)}return true}
  setTimeout(()=>toast('Lien de partage illisible (incomplet ou abîmé) : builds par défaut affichés'),0)}return false}
window.addEventListener('hashchange',()=>{if(fromHash())renderAll()});
/* Hauteurs de la barre collée (en haut) et de la barre basse (téléphone) sur :root : décalage du rail et du défilement (scroll-padding), pour que rien ne passe dessous */
new ResizeObserver(()=>document.documentElement.style.setProperty('--navh',$('#pBar').offsetHeight+'px')).observe($('#pBar'));
new ResizeObserver(()=>document.documentElement.style.setProperty('--bbh',$('#bbar').offsetHeight+'px')).observe($('#bbar'));
initPanels();

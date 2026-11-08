/* =========================== INTERFACE (2.0.0) =========================== */
/* Une page : vos points, objectifs (combo imposé et expliqué), gemmes, arbre (graphe ou liste) ; builds A et B, enregistrés, partagés, comparés */
const $=s=>document.querySelector(s);
const fmt=(n,d=0)=>{const v=Math.round(n*10**d)/10**d;return v.toLocaleString('fr-FR',{maximumFractionDigits:d})};
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let builds=[goalBuild('tank','healer','Tank + Soigneur'),goalBuild('mageCrit','storm','Mage critique + foudre')];
let cur=0,compare=false,area='all',onlyOn=false,query='',view='graph';
const LS='forge-embervale-builds';
/* localStorage peut lever une exception (navigation privée, Artifact) : toujours passer par ces deux fonctions ; k : clé, d : valeur si absente ou illisible */
function lsGet(k=LS,d=[]){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}}
function lsSet(v,k=LS){try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}}
function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;($('#toasts')||document.body).appendChild(d);setTimeout(()=>d.remove(),2600)} // empilés dans #toasts (role="status")
function modal(html){const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="box" role="dialog" aria-modal="true">${html}</div>`;m.onclick=e=>{if(e.target===m)m.remove()};document.body.appendChild(m);return m}
const B=()=>builds[cur];
const areaColor=k=>`var(${(AREAS.find(a=>a[0]===k)||['','','--ember'])[2]})`;
const zoneTag=(k,t)=>{const a=AREAS.find(x=>x[0]===k);return a?`<span class="ztag" style="--ac:var(${a[2]})">${esc(t??a[1])}</span>`:''};
/* Points dépensés dans une zone : compétences au coût du rang, nœuds d'attribut à 1 point ; la somme des quatre zones = spentPoints */
const zonePts=(b,k)=>SK.reduce((a,s)=>a+(s.area===k?s.cost*Math.min(b.sk[s.id]||0,s.max):0),0)+PIPS.reduce((a,p)=>a+(p[3]===k?b.pip[p[0]]||0:0),0);
const goalsTxt=b=>(b.obj||[])[0]?b.obj.filter(Boolean).map(goalName).join(' + '):'Arbre libre';
const pts=n=>`${n} pt${Math.abs(n)>1?'s':''}`;
const fold=t=>String(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); // recherche sans accents ni majuscules

function renderTabs(){const el=$('#buildTabs');el.innerHTML='';
  builds.forEach((b,i)=>{const t=document.createElement('button');t.className='tab';t.setAttribute('role','tab');t.setAttribute('aria-selected',i===cur);
    t.innerHTML=`<span class="dot" style="background:${i?'var(--shroud)':'var(--ember)'}"></span>${'AB'[i]} · ${esc(b.name)}`;t.onclick=()=>{cur=i;renderAll()};el.appendChild(t)});
  $('#buildName').value=B().name;$('#cmp').checked=compare}

/* ---- Vos points ---- */
function flameFx(b,o){const h=Math.floor(Math.max(1,Math.min(11,b.flame))/2),own=FLAME_NODES.filter(([id])=>o.R(id));
  return own.length?own.map(([id,a])=>`${SKI[id].fr} : +${h} ${PIPS.find(p=>p[0]===a)[2]}`).join(' · '):`aucun nœud de Flamme acquis (${SKI.exalted.fr}, ${SKI.barbarian.fr}…)`}
function renderPoints(){const b=B(),sp=spentPoints(b),bu=budget(b),over=sp>bu,o=compute(b);
  $('#lvl').value=b.lvl;$('#exp').value=b.exp;$('#flame').value=b.flame;
  $('#ptLbl').textContent=over?'Points en trop':'Points à attribuer';
  const pl=$('#ptLeft');pl.textContent=String(Math.abs(bu-sp));pl.classList.toggle('over',over);
  $('#spent').textContent=`${sp} / ${bu} dépensés`;$('#needLvl').textContent=over?'retirez-en ou montez de niveau':`niveau requis ${levelNeeded(b)}`;
  $('#bar').className='bar'+(over?' over':'');$('#bar').firstElementChild.style.width=Math.min(100,sp/Math.max(1,bu)*100)+'%';
  $('#flameDn').disabled=b.flame<=1;$('#flameUp').disabled=b.flame>=11;$('#flameFx').textContent=flameFx(b,o)}

/* ---- Objectifs ---- */
const goalOpts=none=>`<option value="">${none}</option>`+GOAL_GRP.map(([g,l])=>`<optgroup label="${l}">`+GOALS.filter(x=>x.grp===g).map(x=>`<option value="${x.id}">${esc(x.n)}</option>`).join('')+'</optgroup>').join('');
const supOpts=()=>`<option value="">Aucun</option>`+SUPS.map(x=>`<option value="${x.id}">${esc(x.n)}</option>`).join('');
function renderGoals(){const b=B(),[p,s,t]=b.obj||[];$('#goal1').value=p||'';$('#goal2').value=s||'';$('#goal2').disabled=!p;$('#goal3').value=t||'';$('#goal3').disabled=!p;
  for(const o of $('#goal2').querySelectorAll('option'))o.disabled=!!o.value&&o.value===p;
  $('#goalHint').textContent=p?`Le site place vos points pour « ${goalName(p)} »${s?`, puis ceux qui restent pour « ${goalName(s)} »`:''}${t?`, enfin les derniers pour le soutien « ${goalName(t)} »`:''}. Vous pouvez ensuite ajouter des compétences dans l'arbre ; les nœuds imposés ne se retirent pas.`
    :'Arbre libre : vous placez tout vous-même. Choisissez un objectif principal pour que le site impose un combo et explique pourquoi.'}
function goneMsg(gone){if(gone.length){const sk=gone.filter(n=>n.kind==='skill').length,pp=gone.length-sk;toast(`Plus reliés à un point de départ, donc retirés : ${sk?sk+' compétence'+(sk>1?'s':''):''}${sk&&pp?' et ':''}${pp?pp+' nœud'+(pp>1?'s':'')+" d'attribut":''}`)}}
/* i : 0 principal, 1 secondaire, 2 soutien */
function pickGoal(i,v){const b=B(),o=b.obj||[],p=i?o[0]:v||null,s=i===1?v||null:i===2?o[1]||null:(v&&o[1]!==v?o[1]||null:null),t=i===2?v||null:o[2]||null;
  const A=addsOf(b),before=Object.keys(A.sk).length+Object.keys(A.pn).length+Object.keys(A.up).length,newP=p!==(o[0]||null);goneMsg(setGoals(b,p,s,t));
  if(p&&newP)toast(`Combo « ${goalName(p)} » posé, ${Object.keys(GOALI[p].gem).length?'avec ses gemmes':'gemmes inchangées'}${before?' ; vos nœuds placés à la main sont retirés':''}`);else if(!p)toast('Arbre libre : tout est modifiable, rien n\'est imposé');
  renderAll()}

/* ---- Pourquoi ce combo ---- */
const ROLE={p:'Principal',s:'Secondaire',t:'Soutien'},ICO={ok:'✓',part:'◐',no:'○'},STT={ok:'complète',part:'en partie',no:'pas encore'};
function itemChip(k,want,c,st){const got=Math.min(want,isAttr(k)?(c.want.pip[k]||0):(c.want.sk[k]||0)),skip=st.skip.includes(k);
  const txt=skip?`${itemName(k)} : sautée (Flamme 1)`:isAttr(k)?`${itemName(k)} ${got}/${want}`:`${itemName(k)}${want>1||got>1?` ${got}/${want}`:''}`;
  return `<span class="chip${skip||got<want?' off':''}">${esc(txt)}</span>`}
function renderWhy(){const b=B(),c=imposed(b),el=$('#why'),o=compute(b),sp=spentPoints(b),bu=budget(b);
  const res=`<p class="res"><b>Résultat</b> ${PIPS.map(([k,,ab])=>`${ab} ${o.attr[k]}`).join(' · ')} · Santé ${fmt(o.hp)} · Mana ${fmt(o.mana)} · Vigueur ${fmt(o.sta)}</p>`;
  if(!c){el.innerHTML=`<p class="meta2">Aucun objectif : rien n'est imposé ni expliqué. ${sp?`${pts(sp)} placé${sp>1?'s':''} à la main.`:''}</p>${res}`;return}
  el.innerHTML=c.rep.map((r,gi)=>{const g=GOALI[r.id];
    return `<div class="wgoal"><h3>${zoneTag(g.area,ROLE[r.role])} ${esc(g.n)} <small>${pts(r.pts)}</small></h3>`+(g.src?`<p class="meta2 wsrc"><span class="tag est">communauté</span> ${esc(g.src)}</p>`:'')+(g.sim?`<p class="meta2 wsrc"><span class="tag hyp">hypothèse</span> ${esc(g.sim)}</p>`:'')+r.steps.map((st,i)=>`<details class="wstep ${st.st}"><summary><span class="ws" aria-label="Étape ${STT[st.st]}">${ICO[st.st]}</span> ${i+1}. ${esc(st.t)}${st.miss?` <em>— il manque ${pts(st.miss)} pour ${esc(itemName(st.at))}</em>`:''}</summary>`+
      `<p>${esc(st.why)}</p><div class="chips">${Object.entries(st.items).map(([k,w])=>itemChip(k,w,c,st)).join('')}</div></details>`).join('')+'</div>'}).join('')+
    `<p class="meta2">Liaisons ${pts(c.links)} · vos ajouts ${pts(sp-c.buy)} · ${sp>bu?`<span class="over-msg">${pts(sp-bu)} en trop</span>`:`libres ${pts(bu-sp)}`}</p>${res}`+
    `<p class="meta2"><span class="tag hyp">hypothèse</span> Ordre des étapes et raisons : choix du simulateur. Le combo suit les étapes dans l'ordre et s'arrête au premier achat trop cher ; chaque chemin est le moins cher depuis l'arbre déjà relié. Vos ajouts comptent comme déjà acquis : le combo passe par eux sans les payer s'il y gagne (étapes plus avancées ou moins de points) ; il dispose toujours de tout votre budget, vos ajouts viennent en plus. Un de vos nœuds qu'une étape compte devient imposé, sauf si le combo ne l'aurait pas sans lui. Le combo se recalcule à chaque ajout, retrait ou réglage.${(op=>op.length?` Pour ${op.join(' et ')}, l'ordre des éléments de chaque étape est calculé hors ligne : combo complet au moindre coût à 212 points, puis l'avancée la plus rapide quand les points montent.`:'')(c.rep.filter(r=>GOALI[r.id].opt).map(r=>`« ${esc(GOALI[r.id].n)} »`))}</p>`}

/* ---- Gemmes (Arme 1, Arme 2) : effets descriptifs, jamais comptés ---- */
function renderGems(){const b=B(),el=$('#gems');el.innerHTML='';b.gem=b.gem||{};
  for(const [sl,lab] of [['w1','Arme 1'],['w2','Arme 2']]){const row=document.createElement('div');row.className='gemrow';
    let opts='<option value="">Aucune gemme</option>';for(let t=1;t<=7;t++)opts+=`<optgroup label="Palier ${t}">`+GEMS.filter(g=>g[4]===t).map(g=>`<option value="${g[0]}">${esc(g[1])} · ${RAR[g[3]][0]}</option>`).join('')+'</optgroup>';
    row.innerHTML=`<label for="gem-${sl}">${lab}</label><select id="gem-${sl}">${opts}</select>`;const sel=row.querySelector('select');sel.value=b.gem[sl]||'';
    sel.onchange=()=>{if(sel.value)b.gem[sl]=sel.value;else delete b.gem[sl];renderAll()};
    const g=GEMI[b.gem[sl]];if(g)row.insertAdjacentHTML('beforeend',`<div class="gemcard" style="--rc:${RAR[g.r][1]}"><div><span class="gdot"></span><b>${esc(g.fr)}</b> <span class="en">${esc(g.en)}</span></div><div>${esc(g.d)}</div><div class="meta2">${RAR[g.r][0]} · palier ${g.t}${g.types.length?' · se déclenche avec des dégâts '+g.types.map(x=>GTYPE[x]||x).join(', '):''} · valeurs de base : ${esc(g.v)}</div></div>`);
    el.appendChild(row)}
  el.insertAdjacentHTML('beforeend','<p class="meta2">Les gemmes se posent sur l\'arme ; leur effet est décrit, il n\'entre dans aucun chiffre ici (l\'équipement n\'est pas pris en compte).</p>')}

/* ---- Arbre : achats et retraits (invariant : canBuy, prune ; nœuds imposés verrouillés) ----
   Avec objectif (2.3.0) : un achat ou un retrait passe par vos ajouts (b.ad), puis le combo est recalculé depuis les départs (regen, 06-objectifs.js) */
function lockedMsg(n){const pth=pathTo(B(),n);toast(pth?`Verrouillé : il faut d'abord un nœud relié (chemin le plus court : ${pts(pathCost(B(),pth))})`:'Verrouillé : aucun chemin vers ce nœud')}
/* Nœud verrouillé : l'objectif qui le demande (étape), ou liaison vers vos ajouts */
function imposedMsg(b,n){const c=imposed(b),w=c&&n?c.by[n.kind==='pip'?'@'+n.attr:n.id]:null;
  if(c&&n&&c.conn.includes(n.id))toast('Liaison vers un de vos ajouts : retirez d\'abord l\'ajout qu\'elle relie');
  else toast(`Imposé par l'objectif « ${goalName(w?c.rep[w[0]].id:b.obj[0])} » : choisissez « Aucun (arbre libre) » pour le retirer`)}
const withGoal=b=>isMain((b.obj||[])[0]);
/* f modifie vos ajouts (b.ad) ; keep : juste après un ajout (aucun ajout élagué). Le message dit ce que le recalcul a changé, et seulement cela */
function viaAdds(b,f,keep){const c0=imposed(b);f(b.ad);const gone=regen(b,keep,c0),c1=imposed(b);
  if(c0&&c1){const d=c1.wpts-c0.wpts,m=[];if(c0.links!==c1.links)m.push(`liaisons ${pts(c0.links)} → ${pts(c1.links)}`);if(d)m.push(`${d>0?'+':'−'}${pts(Math.abs(d))} sur les étapes`);if(m.length)toast('Combo recalculé : '+m.join(' · '))}
  return gone}
const carriedMsg=()=>toast('Retiré de vos ajouts, mais le combo passe par ce nœud : il reste, imposé');
/* +1 rang : sur un nœud imposé, votre rang au-dessus (up : le combo ne change pas) ; sinon, votre nœud (sk : le combo passe par lui sans le payer) */
function addRank(b,id){const s=SKI[id],n=TOPO.byId[id];if(!s)return false;const r=b.sk[id]||0;if(r>=s.max)return false;if(!r&&!canBuy(b,n)){lockedMsg(n);return false}
  if(!withGoal(b)){b.sk[id]=r+1;return true}const up=!!b.ad.up[id]||!b.ad.sk[id]&&lockOf(b,n)>0;viaAdds(b,A=>{(up?A.up:A.sk)[id]=r+1},true);return true}
/* −1 rang : jamais sous l'imposé ; votre rang au-dessus disparaît au rang du combo (+1 puis −1 ne change rien) ; votre nœud perd un rang, ou part (règle 3) */
function remRank(b,id){const v=(b.sk[id]||0)-1,n=TOPO.byId[id];if(v<0)return false;const lk=lockOf(b,n);if(v<lk){imposedMsg(b,n);return false}
  if(!withGoal(b)){if(v>0)b.sk[id]=v;else{delete b.sk[id];goneMsg(prune(b))}return true}
  if(b.ad.up[id])viaAdds(b,A=>{if(v>lk)A.up[id]=v;else delete A.up[id]},true);
  else if(b.ad.sk[id]){if(v>0)goneMsg(viaAdds(b,A=>{A.sk[id]=v},false));else goneMsg(removeAdd(b,n))}
  else{imposedMsg(b,n);return false}return true}
/* Retirer un de vos nœuds : vos ajouts qu'il était seul à relier partent avec lui (règle 3 ; les éléments d'étape du combo comptent comme reliés,
   le combo les recalcule), puis le combo est recalculé sans lui */
function removeAdd(b,n){const c=imposed(b),t={sk:{...b.sk},pn:{...b.pn}};if(n.kind==='skill')delete t.sk[n.id];else delete t.pn[n.id];
  const seen=new Set([TOPO.core]);for(const m of TOPO.N)if(m!==n&&owned(t,m)&&(m.kind==='skill'?(c.want.sk[m.id]||0)>0&&c.sk[m.id]:m.kind==='pip'&&c.pn[m.id]&&(c.want.pip[m.attr]||0)>0))seen.add(m);
  const st=[...seen];while(st.length){const u=st.pop();for(const v of u.nb)if(!seen.has(v)&&(v.kind==='start'||owned(t,v))){seen.add(v);st.push(v)}}
  const gone=[];viaAdds(b,A=>{for(const k of ['sk','pn','up'])delete A[k][n.id];for(const k of ['sk','pn','up'])for(const id of Object.keys(A[k]))if(!seen.has(TOPO.byId[id])){gone.push(TOPO.byId[id]);for(const g of ['sk','pn','up'])delete A[g][id]}},true);
  if(owned(b,n))carriedMsg();return gone.filter(m=>!owned(b,m))}
function addPipNode(b,n){if(b.pn[n.id])return false;if(!canBuy(b,n)){lockedMsg(n);return false}if(withGoal(b))viaAdds(b,A=>{A.pn[n.id]=1},true);else{b.pn[n.id]=1;syncPips(b)}return true}
function remPipNode(b,n){if(!b.pn[n.id])return false;if(lockOf(b,n)){imposedMsg(b,n);return false}
  if(!withGoal(b)){delete b.pn[n.id];syncPips(b);goneMsg(prune(b));return true}goneMsg(removeAdd(b,n));return true}
function addPip(b,k){const R=reach(b);const n=TOPO.pips.filter(p=>p.attr===k&&!b.pn[p.id]&&canBuy(b,p,R)).sort((x,y)=>x.idx-y.idx)[0];
  if(!n){toast(TOPO.pips.some(p=>p.attr===k&&!b.pn[p.id])?"Aucun nœud de cet attribut n'est relié pour l'instant : utilisez « Acheter le chemin »":'Tous les nœuds de cet attribut sont acquis');return false}return addPipNode(b,n)}
/* −1 attribut : le nœud non imposé dont le retrait coupe le moins */
function remPip(b,k){const imp=imposed(b);let best=null,bc=Infinity;for(const p of TOPO.pips){if(p.attr!==k||!b.pn[p.id]||lockOf(b,p,imp))continue;const t=JSON.parse(JSON.stringify(b));delete t.pn[p.id];syncPips(t);const c=prune(t).length;if(c<bc){bc=c;best=p}}
  if(!best){imposedMsg(b,TOPO.pips.find(p=>p.attr===k&&b.pn[p.id]));return false}return remPipNode(b,best)}
/* « Acheter le chemin » : avec objectif, le chemin entre dans vos ajouts */
function buyTo(b,n){const pth=pathTo(b,n);if(!pth)return;if(withGoal(b))viaAdds(b,A=>{for(const x of pth)if(!owned(b,x)){if(x.kind==='skill')A.sk[x.id]=1;else if(x.kind==='pip')A.pn[x.id]=1}},true);else buyPath(b,pth);renderAll()}
function renderTree(){const b=B(),sp=spentPoints(b),ae=$('#areas');ae.innerHTML='';
  [['all','Tout','--ember'],...AREAS].forEach(([k,n,c])=>{const bt=document.createElement('button');bt.className='area';bt.style.setProperty('--ac',`var(${c})`);bt.setAttribute('aria-pressed',area===k);
    bt.innerHTML=`${n} <small>${pts(k==='all'?sp:zonePts(b,k))}</small>`;bt.onclick=()=>{area=k;renderTree();if(view==='graph'&&window.G)G.focus(k)};ae.appendChild(bt)});
  $('#vGraph').setAttribute('aria-pressed',view==='graph');$('#vList').setAttribute('aria-pressed',view==='list');$('#graphView').hidden=view!=='graph';$('#listView').hidden=view!=='list';
  if(view==='graph'){if(window.G)G.refresh();return}
  const imp=imposed(b),RR=reach(b),DJ=dijkstra(b,RR),pe=$('#pips');pe.innerHTML='';
  PIPS.filter(p=>area==='all'||p[3]===area).forEach(([k,n,,,max])=>{const v=b.pip[k]||0,lk=TOPO.pips.filter(p=>p.attr===k&&lockOf(b,p,imp)).length,d=document.createElement('div');d.className='pip';
    // aucun nœud de cet attribut voisin d'un nœud relié : chemin le moins cher (la vue Liste sert d'alternative au clavier)
    let far=null;if(v<max&&!TOPO.pips.some(p=>p.attr===k&&!b.pn[p.id]&&canBuy(b,p,RR)))for(const p of TOPO.pips)if(p.attr===k&&!b.pn[p.id]&&DJ.dist.has(p)&&(!far||DJ.dist.get(p)<DJ.dist.get(far)))far=p;
    d.innerHTML=`<div><b>${n}</b><div class="lbl">nœuds d'attribut · 1 pt${lk?` · ${lk} imposé${lk>1?'s':''}`:''}</div>${far?`<button class="btn sm pathb" aria-label="Acheter le chemin vers ${n} +1 (${pts(DJ.dist.get(far))})">Acheter le chemin (${pts(DJ.dist.get(far))})</button>`:''}</div><div class="step" style="grid-row:auto"><button aria-label="Retirer ${n}" ${v>lk?'':'disabled'}>−</button><span class="rk">${v}/${max}</span><button aria-label="Ajouter ${n}" ${v<max?'':'disabled'}>+</button></div>`;
    const [m,p]=d.querySelectorAll('.step button');m.onclick=()=>{if(remPip(b,k))renderAll()};p.onclick=()=>{if(addPip(b,k))renderAll()};
    const pb=d.querySelector('.pathb');if(pb)pb.onclick=()=>buyTo(b,far);pe.appendChild(d)});
  pe.hidden=area==='core';
  const ne=$('#nodes');ne.innerHTML='';const q=fold(query);
  const list=SK.filter(s=>(q?fold(s.fr+' '+s.en).includes(q):(area==='all'||s.area===area))&&(!onlyOn||(b.sk[s.id]||0)>0));
  if(!list.length)ne.innerHTML='<div class="empty">Aucune compétence ne correspond. Videz la recherche ou décochez « Prises seulement ».</div>';
  list.forEach(s=>{const v=b.sk[s.id]||0,tn=TOPO.byId[s.id],lk=lockOf(b,tn,imp),lock=!v&&!canBuy(b,tn,RR),d=document.createElement('div');d.className='node'+(v?' on':'')+(lock?' lock':'')+(v>lk?' add':'');
    d.style.setProperty('--ac',areaColor(s.area));
    d.innerHTML=`<div class="nn">${esc(s.fr)}<span class="en">${esc(s.en)}</span>${s.nw?'<span class="new">1.0</span>':''}${lk?'<span class="imp">imposé</span>':v?'<span class="lk">ajouté</span>':''}${lock?'<span class="lk">verrouillé</span>':''}</div>
      <div class="nd">${esc(s.d)}${lock?` <button class="btn sm pathb">Acheter le chemin (${DJ.dist.has(tn)?pts(DJ.dist.get(tn)):'—'})</button>`:''}</div>
      <div class="step"><span class="ct">${s.cost} pt${s.cost>1?'s':''}${s.max>1?'/rang':''}</span><button aria-label="Retirer un rang à ${esc(s.fr)}" ${v>lk?'':'disabled'}>−</button><span class="rk">${v}/${s.max}</span><button aria-label="Ajouter un rang à ${esc(s.fr)}" ${v<s.max&&!lock?'':'disabled'}>+</button></div>`;
    const bs=d.querySelectorAll('.step button');bs[0].onclick=()=>{if(remRank(b,s.id))renderAll()};bs[1].onclick=()=>{if(addRank(b,s.id))renderAll()};
    const pb=d.querySelector('.pathb');if(pb)pb.onclick=()=>buyTo(b,tn);ne.appendChild(d)})}

/* ---- A contre B ---- */
function renderCmp(){$('#p-cmp').hidden=!compare;if(!compare)return;const [a,b]=builds,oa=compute(a),ob=compute(b);
  const row=(l,va,vb,num)=>{const df=num?vb-va:null;return `<tr><th>${l}</th><td>${esc(num?fmt(va):va)}</td><td>${esc(num?fmt(vb):vb)}</td><td class="${df===null?'d-0':df>0?'d-up':df<0?'d-dn':'d-0'}">${df===null||df===0?'=':(df>0?'+':'')+fmt(df)}</td></tr>`};
  const gem=x=>['w1','w2'].map(s=>GEMI[(x.gem||{})[s]]).filter(Boolean).map(g=>g.fr).join(', ')||'aucune';
  const own=(x,y)=>SK.filter(s=>(x.sk[s.id]||0)>0&&!((y.sk[s.id]||0)>0)).map(s=>s.fr).join(', ')||'aucune';
  let t=`<table class="st cmp"><thead><tr><th></th><th style="color:var(--ember)">A · ${esc(a.name)}</th><th style="color:var(--shroud)">B · ${esc(b.name)}</th><th>B − A</th></tr></thead><tbody>`;
  t+=row('Objectifs',goalsTxt(a),goalsTxt(b))+row('Points dépensés',spentPoints(a),spentPoints(b),1)+row('Budget',budget(a),budget(b),1)+row('Flamme',a.flame,b.flame,1);
  for(const [k,n] of PIPS)t+=row(n,oa.attr[k],ob.attr[k],1);
  t+=row('Santé',oa.hp,ob.hp,1)+row('Mana',oa.mana,ob.mana,1)+row('Vigueur',oa.sta,ob.sta,1)+row('Gemmes',gem(a),gem(b));
  t+=`<tr><th>Compétences propres</th><td class="txt">${esc(own(a,b))}</td><td class="txt">${esc(own(b,a))}</td><td></td></tr></tbody></table>`;
  $('#cmpBody').innerHTML=t}

function renderSaved(){const s=lsGet();$('#saved').innerHTML='<option value="">Mes builds…</option>'+s.map((x,i)=>`<option value="${i}">${esc(x.name)}</option>`).join('')}
function renderAll(){renderTabs();renderPoints();renderGoals();renderWhy();renderGems();renderTree();renderCmp()}

/* ---- Événements ---- */
$('#goal1').innerHTML=goalOpts('Aucun (arbre libre)');$('#goal2').innerHTML=goalOpts('Aucun');$('#goal3').innerHTML=supOpts();
$('#goal1').onchange=e=>pickGoal(0,e.target.value);$('#goal2').onchange=e=>pickGoal(1,e.target.value);$('#goal3').onchange=e=>pickGoal(2,e.target.value);
$('#buildName').oninput=e=>{B().name=e.target.value||'Sans nom';renderTabs();$('#buildName').focus();renderCmp()};
$('#cmp').onchange=e=>{compare=e.target.checked;renderCmp();if(compare)$('#p-cmp').scrollIntoView({block:'nearest'})};
$('#copyAB').onclick=()=>{builds[1-cur]=JSON.parse(JSON.stringify(B()));renderAll();toast('Copié vers '+'AB'[1-cur])};
$('#reset').onclick=()=>{builds[cur]=blankBuild('Build '+'AB'[cur]);renderAll();toast('Build '+'AB'[cur]+' vidé : arbre libre')};
/* Fil des étapes : descend au panneau et y met le focus (jamais de hash : il est réservé au code de partage) */
function goStep(id){const p=$('#'+id);if(!p)return false;const h=p.querySelector('h2'),calm=matchMedia('(prefers-reduced-motion: reduce)').matches;
  p.scrollIntoView({behavior:calm?'auto':'smooth',block:'start'});if(h){h.tabIndex=-1;h.focus({preventScroll:true})}return true}
document.querySelectorAll('.steps [data-go]').forEach(b=>{b.onclick=()=>goStep(b.dataset.go)});
/* Réglages : le combo imposé est recalculé, les ajouts encore reliés sont gardés */
function setting(k,v){const b=B(),c0=imposed(b);b[k]=v;if(withGoal(b))goneMsg(regen(b,false,c0));renderAll()}
[['#lvl','lvl',1,50],['#exp','exp',0,114],['#flame','flame',1,11]].forEach(([s,k,mn,mx])=>{$(s).onchange=e=>{let v=parseInt(e.target.value,10);if(isNaN(v))v=mn;setting(k,Math.max(mn,Math.min(mx,v)))}});
function stepFlame(d){setting('flame',Math.max(1,Math.min(11,B().flame+d)));const bt=$(d<0?'#flameDn':'#flameUp');if(bt.disabled)$('#flame').focus()} // à la borne : focus sur le champ
$('#flameDn').onclick=()=>stepFlame(-1);$('#flameUp').onclick=()=>stepFlame(1);
$('#q').oninput=e=>{query=e.target.value.trim();renderTree()};
$('#onlyOn').onchange=e=>{onlyOn=e.target.checked;renderTree()};
$('#vGraph').onclick=()=>{view='graph';renderTree();if(window.G)G.resize()};
$('#vList').onclick=()=>{view='list';renderTree()};
function saveCur(){const s=lsGet();const b=JSON.parse(JSON.stringify(B()));const i=s.findIndex(x=>x.name===b.name);if(i>=0)s[i]=b;else s.push(b);
  if(lsSet(s)){renderSaved();toast('« '+b.name+' » enregistré dans ce navigateur')}else toast('Enregistrement impossible ici : utilisez « Partager »')}
$('#save').onclick=saveCur;
/* Build enregistré : ceux d'avant le tracé réel (1.8 et avant) sont migrés ; objectifs vérifiés (fitGoals) */
function loadSaved(s){const b=Object.assign(blankBuild(),JSON.parse(JSON.stringify(s)));b.upg=Math.max(0,Math.min(5,Math.round(+b.upg)||0));if(!b.gem||typeof b.gem!=='object')b.gem={};
  if(!s||typeof s!=='object'||!('ad' in s))delete b.ad; // build d'avant la 2.3.0 : ajouts déduits de l'arbre (fitGoals)
  if(s&&s.tv)normalize(b);else{delete b.pn;b.tv=1;migrate(b,'saved')}return fitGoals(b)}
$('#saved').onchange=e=>{if(e.target.value==='')return;const s=lsGet()[+e.target.value];if(s){builds[cur]=loadSaved(s);renderAll();if(!notices(builds[cur]))toast('Chargé dans '+'AB'[cur])}};
$('#delSaved').onclick=()=>{const v=$('#saved').value;if(v===''){toast('Choisissez d\'abord un build dans « Mes builds »');return}const s=lsGet();const n=s[+v].name;s.splice(+v,1);lsSet(s);renderSaved();toast('« '+n+' » supprimé')};
/* Lien ou build ancien : ce qui a été ajouté pour le relier, objectif retiré ; true si un message a été montré */
function notices(b){const lost=b&&b._objLost,rc=b&&b._recalc;if(lost)toast((b.obj||[])[0]?'Objectif secondaire ou de soutien retiré : inconnu de cette version du site':'Objectif retiré : il a changé depuis ce lien ou est inconnu de cette version. L\'arbre est gardé tel quel, en arbre libre');
  if(rc){const d=rc.wpts[1]-rc.wpts[0],m=[];if(rc.links[0]!==rc.links[1])m.push(`liaisons ${pts(rc.links[0])} → ${pts(rc.links[1])}`);if(d)m.push(`${d>0?'+':'−'}${pts(Math.abs(d))} sur les étapes`);
    toast(`Lien ou build d'avant la 2.3.0 : combo recalculé avec vos ajouts, comptés comme déjà acquis${m.length?' ('+m.join(' · ')+')':''}`)}
  return migNotice(b)||!!lost||!!rc}
function migNotice(b){const g=b&&b._mig;if(!g||!(g.pts>0||g.gone>0))return false;
  const names=[...g.addSk.map(id=>SKI[id].fr),...Object.entries(g.addPip).map(([a,n])=>PIPS.find(p=>p[0]===a)[1]+' +'+n)];const over=spentPoints(b)-budget(b);
  const m=modal(`<h2>${g.from==='b3'?'Lien fait sur un tracé antérieur':(g.from==='saved'?'Build enregistré':'Lien')+" d'avant le tracé réel"}</h2><p class="sub">${g.from==='b3'?"Ce lien a été créé avant la dernière mise à jour du tracé de l'arbre (patch du jeu).":(g.from==='saved'?'Ce build a été enregistré':'Ce code '+esc(g.from)+'- a été créé')+" avant la version 1.9.0, qui reprend le vrai tracé de l'arbre du jeu."} Vos choix sont conservés${g.gone?`, sauf ${g.gone} nœud${g.gone>1?'s':''} qui n'existe${g.gone>1?'nt':''} plus`:''} (compétences et rangs, attributs, gemmes).${names.length?` Pour les relier à un point de départ, ces nœuds ont été ajoutés (+${pts(g.pts)}) :`:''}</p>
${names.length?`<div>${esc(names.join(', '))}.</div>`:''}${over>0?`<p class="over-msg">Budget dépassé de ${pts(over)} : retirez des nœuds ou montez de niveau.</p>`:''}<div class="row"><button class="btn primary" id="mok">Compris</button></div>`);
  m.querySelector('#mok').onclick=()=>m.remove();return true}
function copy(text,ta){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(()=>toast('Copié'),()=>{ta.select();toast('Sélectionné : copiez avec Ctrl+C')})}else{ta.select();toast('Sélectionné : copiez avec Ctrl+C')}}
$('#share').onclick=()=>{const code=encode(B());try{history.replaceState(null,'','#'+code)}catch(e){location.hash=code}
  const m=modal(`<h2>Partager « ${esc(B().name)} »</h2><p class="sub">Ce code contient l'arbre, les objectifs, les gemmes et les réglages. Il est aussi placé à la fin du lien de la page : un lien copié depuis la barre d'adresse ouvre directement ce build.</p>
  <textarea id="shareCode" readonly>${code}</textarea><div class="row"><button class="btn primary" id="cpy">Copier le code</button><button class="btn" id="cls">Fermer</button></div>`);
  m.querySelector('#cpy').onclick=()=>copy(code,m.querySelector('#shareCode'));m.querySelector('#cls').onclick=()=>m.remove()};
$('#import').onclick=()=>{const m=modal(`<h2>Importer un build</h2><p class="sub">Collez un code commençant par <code>b3-</code> ; les anciens <code>b2-</code> et <code>b1-</code> marchent aussi (adaptés au tracé réel de l'arbre). L'équipement que portent les codes est ignoré. Il sera chargé dans l'emplacement ${'AB'[cur]}.</p><textarea id="impCode" placeholder="b3-…"></textarea><p class="over-msg" id="impErr" hidden>Code non reconnu : vérifiez qu'il est complet et commence par b3-, b2- ou b1-.</p><div class="row"><button class="btn primary" id="go">Importer</button><button class="btn" id="cls">Annuler</button></div>`);
  m.querySelector('#go').onclick=()=>{const b=decode(m.querySelector('#impCode').value);if(!b){m.querySelector('#impErr').hidden=false;return}builds[cur]=b;m.remove();renderAll();if(!notices(b))toast('Build importé dans '+'AB'[cur])};m.querySelector('#cls').onclick=()=>m.remove()};
function fromHash(){const h=location.hash.slice(1);if(/^b[123]-/i.test(h)){const b=decode(h);if(b){builds[0]=b;cur=0;compare=false;
  if(b._mig||b._recalc){try{history.replaceState(null,'','#'+encode(b))}catch(e){}}setTimeout(()=>notices(b),0);return true}
  setTimeout(()=>toast('Lien de partage illisible (incomplet ou abîmé) : builds par défaut affichés'),0)}return false}
window.addEventListener('hashchange',()=>{if(fromHash())renderAll()});

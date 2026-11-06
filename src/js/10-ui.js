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

/* Onglets des parties (1.15.0) : une seule partie affichée ; l'onglet ouvert est retenu dans ce navigateur (lsGet/lsSet), jamais dans l'adresse (le hash est le code de partage) */
const SECS=[['tree','Arbre'],['eq','Équipement'],['calc','Calculateur'],['bo','Build optimal'],['def','Défense'],['tab','Tables']];
const LS_SEC='forge-embervale-onglet',OPT_SECS=['calc','bo','def','tab'],secOk=k=>SECS.some(s=>s[0]===k);
function secSaved(){const k=lsGet(LS_SEC,'tree');return secOk(k)?k:'tree'}
let sec='tree';
/* Démarrage (fin de ce fichier, avant la création du graphe 30-graph.js) : l'onglet retenu est relu et appliqué ; caché, le graphe se cale à sa première ouverture */
function initSec(){showSec(secSaved(),true)}
/* Ouvre une partie : onglet sélectionné (aria-selected, tabindex itinérant), son panneau seul visible, fiche à droite d'Arbre et Équipement seulement,
   choix de la cible déplacé dans l'onglet Build optimal. quiet (démarrage) : ni mémorisation ni rendu, renderAll suit */
function showSec(id,quiet){if(!secOk(id))id='tree';const same=id===sec;sec=id;
  for(const [k] of SECS){const t=$('#t-'+k),on=k===id;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;$('#p-'+k).hidden=!on}
  const side=id==='tree'||id==='eq';$('#ficheAside').hidden=!side;$('#secLay').classList.toggle('side',side);
  if(id==='calc'||id==='bo')$(id==='bo'?'#boTarget':'#optTarget').appendChild($('#optBar'));
  if(quiet)return;
  if(!same){lsSet(id,LS_SEC); // onglet déjà ouvert : rien à refaire (il est tenu à jour), seul le retour en haut de la partie s'applique
    if(id==='tree'&&view==='graph'&&window.G)G.wake(); // canvas à la taille du panneau (et premier cadrage si le graphe était caché au démarrage)
    if(OPT_SECS.includes(id))renderOptNow()} // seul l'onglet ouvert du calculateur est rendu (20-optimizer.js)
  const p=$('#p-'+id);if(p.getBoundingClientRect().top<$('#secBar').getBoundingClientRect().bottom)p.scrollIntoView({block:'start'})} // page défilée : haut de la partie, sous les onglets

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
function renderSlots(){
  const b=B(),el=$('#slots');el.innerHTML='';let n=0;
  $('#upg').value=b.upg;$('#upgTxt').textContent=b.upg===5?'5/5 · toutes les améliorations':b.upg+'/5 perks débloqués';
  SLOTS.forEach(([sl,lab])=>{
    const wrap=document.createElement('div');wrap.className='slot';
    const sel=document.createElement('select');sel.id='slot-'+sl;sel.setAttribute('aria-label',lab);
    let opts='<option value="">— Aucun —</option>';
    if(sl[0]==='w'){const groups={};WEAPONS.forEach(w=>{(groups[w[2]]=groups[w[2]]||[]).push(w)});
      for(const c in groups)opts+=`<optgroup label="${CAT[c][0]}">`+groups[c].map(w=>`<option value="${w[0]}">${esc(w[1])} · niv. ${w[3]}</option>`).join('')+'</optgroup>';}
    else if(sl[0]==='r'){opts+=RINGS.map(r=>`<option value="${r[0]}">${esc(r[1])} · niv. ${r[2]}</option>`).join('')}
    else{SETS.forEach(S=>{const p=S.p.find(x=>x[2]===sl);if(p)opts+=`<option value="${p[0]}">${esc(p[1])} · ${S.cls}</option>`})}
    sel.innerHTML=opts;sel.value=b.gear[sl]||'';
    sel.onchange=()=>{if(sel.value)b.gear[sl]=sel.value;else delete b.gear[sl];renderAll()};
    const it=ITEMS[b.gear[sl]];if(it)n++;
    let info='';
    if(it&&it.kind==='weapon'){info=`<div class="chips">${chip(CAT[it.cat][0])}${chip((it.cat==='bow'||it.cat==='staff'?'Puissance ':'Dégâts ')+it.val)}${chip('Type : '+wtypeTxt(it))}${it.wperks.map(p=>chip(WPERK[p],'tag')).join('')}</div>`}
    else if(it){const base=Object.entries(it.base).map(([k,v])=>chip(`${ST[k][0]} ${sign(v,ST[k][1])}`)).join('');
      info=`<div class="chips">${base}${it.perks.map((p,i)=>perkChip(p,i<b.upg)).join('')}</div><div class="meta">Niv. ${it.lv} · ${esc(it.cls)}${it.src?' · '+esc(it.src):''}${it.set?' · panoplie '+esc(it.set):''}</div>`}
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
function renderSkills(){
  const b=B();
  $('#lvl').value=b.lvl;$('#exp').value=b.exp;$('#flame').value=b.flame;
  const sp=spentPoints(b),bu=budget(b),over=sp>bu;
  $('#spent').innerHTML=`<span${over?' class="over-msg"':''}>${sp} / ${bu} points dépensés</span>`;
  $('#needLvl').innerHTML=over?`<span class="over-msg">Dépassement de ${sp-bu} pts</span>`:`Niveau requis : ${levelNeeded(b)} · reste ${bu-sp}`;
  $('#bar').className='bar'+(over?' over':'');$('#bar').firstElementChild.style.width=Math.min(100,sp/212*100)+'%';
  const o=compute(b);
  const ae=$('#areas');ae.innerHTML='';
  [['all','Tout','--ember'],...AREAS].forEach(([k,n,c])=>{const pts=k==='all'?sp:SK.filter(s=>s.area===k).reduce((a,s)=>a+s.cost*(b.sk[s.id]||0),0)+PIPS.filter(p=>p[3]===k).reduce((a,p)=>a+(b.pip[p[0]]||0),0);
    const bt=document.createElement('button');bt.className='area';bt.style.setProperty('--ac',`var(${c})`);bt.setAttribute('aria-pressed',area===k);
    bt.innerHTML=`${n} <small>${pts} pts</small>`;bt.onclick=()=>{area=k;renderSkills();if(view==='graph'&&window.G)G.focus(k)};ae.appendChild(bt)});
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
  g('Offensive');x('Chance de critique (base)',o.critC,' %');x('Dégâts critiques',o.critD,' %');x('Attaque impitoyable',o.merciless,' %');x('Dégâts dans le dos',o.backstab,' %');x('Attaque furtive',o.sneak,' %');
  x('Contre ennemis de mêlée',o.vs.vsMelee,' %');x('Contre ennemis à distance',o.vs.vsRanged,' %');x('Contre ennemis magiques',o.vs.vsMagic,' %');x('Contre les Fell',o.vs.vsFell,' %');x('Contre les Hollow',o.vs.hollow,' %');
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
  return `<div class="wcard"><div class="wl">${label} · ${wc.catName} · ${wtypeTxt(wc.w)}</div><h3>${esc(wc.w.n)}</h3>
  <div class="big"><div><b>${fmt(wc.hit)}</b><span>${wc.unit} estimés / coup</span></div><div><b>${fmt(wc.avg)}</b><span>moyenne avec critiques</span></div><div><b>+${fmt(wc.bonus)} %</b><span>bonus cumulés</span></div><div><b>${fmt(wc.cc,1)} %</b><span>critique</span></div></div>
  ${wc.gem?`<div class="wl" style="color:var(--ink)"><span class="gdot" style="--rc:${RAR[wc.gem.r][1]}"></span>${esc(wc.gem.fr)} : ${esc(wc.gem.d)} <span style="color:var(--muted)">(effet conditionnel, non compté dans les dégâts)</span></div>`:'<div class="wl">Aucune gemme</div>'}
  <details class="why"><summary>Détail des bonus (base ${wc.w.val})</summary><ul>${wc.parts.map(p=>`<li>${esc(p[0])} : +${fmt(p[1])} %</li>`).join('')||'<li>Aucun bonus</li>'}${wc.cparts.map(p=>`<li>Critique · ${esc(p[0])} : +${fmt(p[1])} %</li>`).join('')}</ul></details></div>`;
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
function note(){return `<div class="note"><strong>Comment lire ces chiffres.</strong> La 1.0 n'a <strong>aucun bonus de panoplie</strong> : chaque pièce apporte ses propres stats, porter 5 pièces d'un même set n'ajoute rien. Les fichiers 1.0 ne publient pas les valeurs d'armure finales, d'où les pourcentages seuls. Les dégâts d'armes sont des estimations du wiki au niveau requis ; les bonus sont additionnés, ce qui reste une approximation du calcul du jeu. Les rangs donnés par l'équipement sont ajoutés à ceux de l'arbre. Les nœuds « +1 tous les 2 niveaux de Flamme » utilisent le niveau de Flamme saisi. Un nœud ne s'achète que s'il touche un point de départ (Étincelle) ou un nœud acquis qui y est relié ; le tracé de l'arbre (positions et liaisons) est celui des fichiers du jeu 1.0, relevé par PinDrop ; que chaque liaison marche dans les deux sens est une déduction de ces fichiers (comme PinDrop), pas un texte officiel. Chaque rang est supposé coûter le prix du nœud (les fichiers n'en donnent qu'un par nœud).</div>`}
function renderSaved(){const s=lsGet();$('#saved').innerHTML='<option value="">Mes builds…</option>'+s.map((x,i)=>`<option value="${i}">${esc(x.name)}</option>`).join('')}
function renderAll(){renderTabs();renderSlots();renderSkills();renderStats()}

/* Événements */
$('#buildName').oninput=e=>{B().name=e.target.value||'Sans nom';renderTabs();$('#buildName').focus();renderStats()};
$('#cmp').onchange=e=>{compare=e.target.checked;renderStats();if(sec!=='tree'&&sec!=='eq')toast('Comparaison A et B '+(compare?'affichée':'retirée')+' : voir la fiche, onglets Arbre et Équipement')};
[['mage','Mage et magie'],['heal','Soin et soutien'],['tank','Tank'],['war','Guerrier'],['rng','Rôdeur']].forEach(([c,l])=>$('#preset').insertAdjacentHTML('beforeend',`<optgroup label="${l}">`+PRESETS.map((p,i)=>p.cat===c?`<option value="${i}">${esc(p.name)}</option>`:'').join('')+'</optgroup>'));
$('#preset').onchange=e=>{if(e.target.value==='')return;builds[cur]=fromPreset(PRESETS[+e.target.value]);e.target.value='';renderAll();toast('Build chargé dans '+'AB'[cur])};
$('#copyAB').onclick=()=>{builds[1-cur]=JSON.parse(JSON.stringify(B()));renderAll();toast('Copié vers '+'AB'[1-cur])};
$('#reset').onclick=()=>{builds[cur]=blankBuild('Build '+'AB'[cur]);renderAll()};
$('#upg').oninput=e=>{B().upg=+e.target.value;renderSlots();renderSkills();renderStats()};
[['#lvl','lvl',1,50],['#exp','exp',0,114],['#flame','flame',1,11]].forEach(([s,k,mn,mx])=>{$(s).onchange=e=>{let v=parseInt(e.target.value,10);if(isNaN(v))v=mn;B()[k]=Math.max(mn,Math.min(mx,v));renderAll()}});
$('#q').oninput=e=>{query=e.target.value.trim();renderSkills()};
$('#onlyOn').onchange=e=>{onlyOn=e.target.checked;renderSkills()};
$('#vGraph').onclick=()=>{view='graph';renderSkills();if(window.G)G.resize()};
$('#vList').onclick=()=>{view='list';renderSkills()};
$('#save').onclick=()=>{const s=lsGet();const b=JSON.parse(JSON.stringify(B()));const i=s.findIndex(x=>x.name===b.name);if(i>=0)s[i]=b;else s.push(b);
  if(lsSet(s)){renderSaved();toast('« '+b.name+' » enregistré dans ce navigateur')}else toast('Enregistrement impossible ici : utilisez « Partager »')};
/* Build enregistré : ceux d'avant le tracé réel (1.8 et avant : nœuds d'attribut de l'ancien tracé, ou comptes seuls) sont migrés */
function loadSaved(s){const b=Object.assign(blankBuild(),JSON.parse(JSON.stringify(s)));if(s.tv)return normalize(b);delete b.pn;b.tv=1;return migrate(b,'saved')}
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
/* Clic : focus posé sur l'onglet (Safari ne le donne pas au clic : il resterait dans le panneau caché) */
function secClick(k){showSec(k);$('#t-'+k).focus({preventScroll:true})}
/* Clavier (motif ARIA des onglets) : ← et → en boucle, Début, Fin ; l'onglet atteint s'ouvre (rendu immédiat) ; Alt, Ctrl, Cmd : laissés au navigateur */
function secKey(e){if(e.altKey||e.ctrlKey||e.metaKey)return;const n=SECS.length;let i=SECS.findIndex(s=>'t-'+s[0]===(e.target&&e.target.id));if(i<0)i=SECS.findIndex(s=>s[0]===sec);
  const j={ArrowRight:(i+1)%n,ArrowLeft:(i+n-1)%n,Home:0,End:n-1}[e.key];if(j===undefined)return;e.preventDefault();showSec(SECS[j][0]);$('#t-'+SECS[j][0]).focus()}
SECS.forEach(([k])=>{$('#t-'+k).onclick=()=>secClick(k)});
$('#secTabs').onkeydown=secKey;
/* Hauteur des onglets collés (1 ou 2 lignes) sur :root : décalage de la fiche collée et du défilement (scroll-padding), pour que rien ne passe dessous */
new ResizeObserver(()=>document.documentElement.style.setProperty('--navh',$('#secBar').offsetHeight+'px')).observe($('#secBar'));
initSec();

/* =========================== BUILD OPTIMAL =========================== */
/* Optimiseur de build complet (1.13.0) : pour N points et un niveau de Flamme, cherche dans chaque famille d'arme l'arme, les 5 pièces d'armure,
   2 anneaux différents et l'arbre (depuis un arbre vide) qui maximisent les dégâts moyens contre la cible (vsEnemy) ; les PV départagent
   les égalités et reçoivent les points restants. Méthode : chaque arme non dominée est essayée ; arbre par deux gloutons (gain par point,
   gain brut) ; équipement pièce par pièce + meilleure paire d'anneaux ; alternance jusqu'à ce que l'équipement ne change plus ;
   amélioration locale si le budget manque. HEURISTIQUE, pas une preuve d'optimalité. Les générateurs rendent la main (yield) à chaque achat : la page reste fluide (boStart). */
const BO_FAM=[['m1','Mêlée une main',c=>CAT[c][1]==='melee'&&CAT[c][2]===1],['m2','Mêlée deux mains',c=>CAT[c][1]==='melee'&&CAT[c][2]===2],
  ['dag','Dagues',c=>c==='dag'],['bow','Arcs',c=>c==='bow'],['wand','Baguettes',c=>c==='wand'],['staff','Bâtons',c=>c==='staff']];
const boFamOf=w=>w?(BO_FAM.find(f=>f[2](w.cat))||[])[0]||null:null;
const BO_AS=['head','chest','hands','legs','feet'];
const BO_AOPT=Object.fromEntries(BO_AS.map(sl=>[sl,Object.values(ITEMS).filter(i=>i.kind==='armor'&&i.slot===sl).map(i=>i.id)]));
const BO_RP=[];RINGS.forEach((x,i)=>RINGS.forEach((y,j)=>{if(i<j)BO_RP.push([x[0],y[0]])})); // deux anneaux différents (doublon en jeu non vérifié)
const BO_TMAX=10000; // au-delà, les familles restantes ne sont pas calculées (signalé)
/* Armes d'une famille, sans les dominées : même catégorie et même répartition des dégâts → seule la base la plus haute peut gagner (perks d'arme non comptés) */
function boWeapons(fk){const f=BO_FAM.find(x=>x[0]===fk)[2],g={};for(const [id] of WEAPONS){const w=ITEMS[id];if(!f(w.cat))continue;const k=w.cat+':'+w.split.map(x=>x.join(' ')).join('+');if(!g[k]||w.val>g[k].val)g[k]=w}return Object.values(g)}
function boScore(b,slot,en){const o=compute(b),wc=o.weapons[slot==='w1'?0:1];return {d:wc?vsEnemy(wc,o,en).avg:0,hp:o.hp}}
/* Ordre lexicographique : dégâts moyens d'abord (tolérance relative 1e-9), puis PV */
const boGt=(x,y)=>x.d>y.d*(1+1e-9)||(x.d>=y.d*(1-1e-9)&&x.hp>y.hp+1e-9);
const boSet=(b,sl,id)=>{if(id)b.gear[sl]=id;else delete b.gear[sl]};
const boGk=(b,slot)=>[...BO_AS,'r1','r2',slot].map(s=>b.gear[s]||'').join('|');
/* Équipement, arbre fixé : chaque pièce d'armure tour à tour, puis la meilleure paire d'anneaux, jusqu'à ce que rien ne s'améliore */
function boGear(b,slot,en){let cur=boScore(b,slot,en);
  for(let more=true,k=0;more&&k<10;k++){more=false;
    for(const sl of BO_AS)for(const id of BO_AOPT[sl]){const old=b.gear[sl];if(old===id)continue;b.gear[sl]=id;const e=boScore(b,slot,en);if(boGt(e,cur)){cur=e;more=true}else boSet(b,sl,old)}
    let rp=[b.gear.r1,b.gear.r2];for(const [x,y] of BO_RP){b.gear.r1=x;b.gear.r2=y;const e=boScore(b,slot,en);if(boGt(e,cur)){cur=e;rp=[x,y];more=true}}
    boSet(b,'r1',rp[0]);boSet(b,'r2',rp[1])}
  return cur}
/* Compétences qui changent les dégâts ou les PV : +1 rang sur un arbre vide (attributs au maximum), ou −1 rang sur un arbre plein (effets croisés : Athlète × Force…) */
function boRel(b,slot,en){const p=clone(b);p.sk={};p.pn={};p.pip={};for(const [k,,,,mx] of PIPS)p.pip[k]=mx;const s0=boScore(p,slot,en),rel=new Set();
  for(const s of SK){p.sk[s.id]=1;const e=boScore(p,slot,en);if(e.d>s0.d*(1+1e-9)||e.hp>s0.hp+1e-9)rel.add(s.id);delete p.sk[s.id]}
  for(const s of SK)p.sk[s.id]=s.max;const s1=boScore(p,slot,en);
  for(const s of SK){p.sk[s.id]=0;const e=boScore(p,slot,en);if(e.d<s1.d*(1-1e-9)||e.hp<s1.hp-1e-9)rel.add(s.id);p.sk[s.id]=s.max}
  return [...rel]}
/* Achats possibles (comme investments, chemin le moins cher compris, un seul Dijkstra) : gd = gain relatif de dégâts, ghp = gain de PV ; all : garder aussi les achats sans gain */
function boInv(b,slot,en,rel,all){const R=reach(b),D=dijkstra(b,R),base=boScore(b,slot,en),out=[];
  const add=(t,cost,it)=>{const e=boScore(t,slot,en);it.cost=cost;it.gd=base.d>0?e.d/base.d-1:0;it.ghp=e.hp-base.hp;if(all||it.gd>5e-4||it.ghp>1e-9)out.push(it)};
  for(const id of rel){const s=SKI[id],n=TOPO.byId[id],r=b.sk[id]||0;if(!n||r>=s.max)continue;const t=clone(b);
    if(r>0){t.sk[id]=r+1;add(t,s.cost,{kind:'skill',id,path:[]})}else if(D.dist.has(n)){const path=trace(D,n);buyPath(t,path);add(t,D.dist.get(n),{kind:'skill',id,path})}}
  for(const [k] of PIPS){let q=null;for(const p of TOPO.pips)if(p.attr===k&&!b.pn[p.id]&&D.dist.has(p)&&(!q||D.dist.get(p)<D.dist.get(q)))q=p;
    if(q){const t=clone(b),path=trace(D,q);buyPath(t,path);add(t,D.dist.get(q),{kind:'pip',id:q.id,path})}}
  return out}
const boPer=(x,y)=>y.gd/Math.max(1,y.cost)-x.gd/Math.max(1,x.cost)||y.ghp-x.ghp||x.cost-y.cost,boGain=(x,y)=>y.gd-x.gd||y.ghp-x.ghp||x.cost-y.cost;
const boPerHp=(x,y)=>y.ghp/Math.max(1,y.cost)-x.ghp/Math.max(1,x.cost)||x.cost-y.cost;
function boBuy(b,it){if(it.kind==='skill'&&(b.sk[it.id]||0)>0)b.sk[it.id]++;else buyPath(b,it.path)}
/* Glouton : à chaque achat, le meilleur gain de dégâts qui tient dans le reste ; s'il n'y en a plus et si hp, le meilleur gain de PV par point.
   Bloqué (aucun achat seul ne rapporte : Essences de vie sans Intelligence, nœud d'Intelligence sans Essences de vie…) : on regarde l'achat d'après
   et on prend le premier achat de la meilleure paire (dégâts d'abord). */
function* boFill(b,slot,en,N,rel,key,hp){for(let g=0;g<500;g++){const left=N-spentPoints(b);if(left<=0)break;
    const all=boInv(b,slot,en,rel,hp).filter(x=>x.cost<=left);let inv=all.filter(x=>x.gd>5e-4);
    if(inv.length)inv.sort(key);else if(hp)inv=all.filter(x=>x.ghp>1e-9).sort(boPerHp);
    if(!inv.length){if(!hp)break;let bd=null,bh=null;
      for(const x of all){const t=clone(b);boBuy(t,x);for(const y of boInv(t,slot,en,rel)){const c=x.cost+y.cost;if(c>left)continue;
          if(y.gd>5e-4){if(!bd||y.gd/c>bd.v)bd={x,v:y.gd/c}}else if(y.ghp>1e-9&&(!bh||y.ghp/c>bh.v))bh={x,v:y.ghp/c}}yield}
      const pk=bd||bh;if(!pk)break;inv=[pk.x]}
    boBuy(b,inv[0]);yield}
  return {b,s:boScore(b,slot,en)}}
function* boTree(b,slot,en,N,rel,hp){let best=null;for(const key of [boPer,boGain]){const t=clone(b);t.sk={};t.pn={};t.pip={};const r=yield* boFill(t,slot,en,N,rel,key,hp);if(!best||boGt(r.s,best.s))best=r}return best}
/* Une arme, pour les dégâts : équipement pour l'arbre vide, puis arbre ↔ équipement jusqu'à ce que l'équipement ne change plus (5 tours au plus) */
function* boWeapon(w,slot,en,N,F,upg){let b=blankBuild('');b.flame=F;b.upg=upg;b.gear={[slot]:w.id};boGear(b,slot,en);
  for(let k=0;k<5;k++){const g0=boGk(b,slot);b=(yield* boTree(b,slot,en,N,boRel(b,slot,en),false)).b;boGear(b,slot,en);if(boGk(b,slot)===g0)break}
  return {w,b,s:boScore(b,slot,en)}}
/* Amélioration locale, si le budget manque (un achat utile ne tient plus) : retirer un rang ou un nœud d'attribut (et ce qui n'est plus relié),
   re-remplir avec les deux gloutons, garder le premier mieux et recommencer ; 300 re-remplissages au plus (même résultat sur toutes les machines) */
function* boLocal(t,slot,en,N,rel){const left=N-spentPoints(t.b);if(left>0&&!boInv(t.b,slot,en,rel).some(x=>x.cost>left))return t;let cur=t,n=0;
  for(let more=true;more&&n<300;){more=false;
    for(const id of [...SK.filter(s=>cur.b.sk[s.id]>0).map(s=>s.id),...Object.keys(cur.b.pn)]){const b=clone(cur.b);if(b.pn[id])delete b.pn[id];else if(--b.sk[id]<=0)delete b.sk[id];syncPips(b);prune(b);
      for(const key of [boPer,boGain]){if(++n>300)break;const f=yield* boFill(clone(b),slot,en,N,rel,key,true);if(boGt(f.s,cur.s)){cur=f;more=true;break}}if(more||n>300)break}}
  return cur}
/* Arme gagnante de la famille : arbre refait depuis zéro avec les PV (les points restants y vont), amélioration locale, puis équipement revu
   (égalités de dégâts départagées par les PV) ; alternance jusqu'à ce que l'équipement ne change plus (3 tours au plus) */
function* boFinish(r,slot,en,N){let b=r.b;
  for(let k=0;k<3;k++){const g0=boGk(b,slot),rel=boRel(b,slot,en);b=(yield* boLocal(yield* boTree(b,slot,en,N,rel,true),slot,en,N,rel)).b;boGear(b,slot,en);if(boGk(b,slot)===g0)break}
  return {w:r.w,b,s:boScore(b,slot,en),used:spentPoints(b)}}
function* boFamily(fk,slot,en,N,F,upg){let best=null;for(const w of boWeapons(fk)){const r=yield* boWeapon(w,slot,en,N,F,upg);if(!best||boGt(r.s,best.s))best=r}
  return Object.assign(yield* boFinish(best,slot,en,N),{fk,fl:BO_FAM.find(f=>f[0]===fk)[1]})}
/* Toutes les familles (celle de l'arme analysée d'abord, toujours calculée) ; rend aussi la progression {res, fam} après chaque famille ;
   passé tmax ms, les familles suivantes sont marquées skip (non calculées) */
function* boRun(slot,en,N,F,upg,first,tmax){const t0=Date.now(),res={},lim=tmax??BO_TMAX;const order=[...BO_FAM].sort((a,b)=>(b[0]===first)-(a[0]===first));
  for(const [i,[fk,fl]] of order.entries()){if(i&&Date.now()-t0>lim){res[fk]={fk,fl,skip:true};continue}res[fk]=yield* boFamily(fk,slot,en,N,F,upg);yield {res:{...res},fam:fl}}
  return {res:BO_FAM.map(f=>res[f[0]]),ms:Date.now()-t0,N,F,slot,en:ENEMIES.indexOf(en)}}
const boDrain=g=>{let r;do r=g.next();while(!r.done);return r.value};
/* Build à appliquer : le résultat + ce que l'optimiseur ne choisit pas, repris du build actuel (nom, niveau, exploration, améliorations, autre arme,
   pièce d'un emplacement où aucune pièce ne change dégâts ni PV) ; gemme gardée si elle reste compatible (les gemmes ne sont pas chiffrées) */
function boMerge(r,b,o){const m=clone(r.b),ot=o.slot==='w1'?'w2':'w1',bg=b.gem||{};Object.assign(m,{name:b.name,lvl:b.lvl,exp:b.exp,upg:b.upg,flame:o.F,tv:1});
  boSet(m,ot,b.gear[ot]);for(const sl of BO_AS)if(!m.gear[sl]&&b.gear[sl])m.gear[sl]=b.gear[sl];
  m.gem={};if(b.gear[ot]&&bg[ot])m.gem[ot]=bg[ot];const g=GEMI[bg[o.slot]];if(g&&gemFit(g,ITEMS[m.gear[o.slot]])!==false)m.gem[o.slot]=g.id;
  return m}

/* ---------- Interface : carte « Build optimal » du calculateur ---------- */
const BO={run:0,busy:false,out:null,part:null,prog:'',key:'',N:null,F:null,stop:false,t0:0};
const boN=b=>Math.max(1,Math.min(212,BO.N??budget(b))),boF=b=>Math.max(1,Math.min(11,BO.F??b.flame));
const boKey=b=>[cur,oEnemy,oSlot,boN(b),boF(b),b.upg].join('|');
function boCard(b,en){return `<div class="ocard" id="boCard"><div class="oh"><h3>Build optimal contre ${esc(en.n)}</h3><span class="lbl">arme, armures, anneaux et arbre</span></div>
  <p class="meta2">L'optimiseur part d'un arbre vide et choisit tout le build pour chaque famille d'arme ; l'arme va en ${oSlot==='w1'?'arme 1':'arme 2'} (emplacement analysé).</p>
  <div class="row"><label class="chk">Points disponibles <input type="number" id="boN" min="1" max="212" value="${boN(b)}" style="width:5rem"></label>
    <label class="chk">Niveau de Flamme <input type="number" id="boF" min="1" max="11" value="${boF(b)}" style="width:4rem"></label>
    <button class="btn sm primary" id="boGo"${BO.busy?' disabled':''}>Calculer le build optimal</button></div>
  <div id="boOut">${boOutHtml()}</div>
  <div class="meta2"><b>Heuristique, pas une preuve d'optimalité</b> : gloutons, alternance équipement / arbre et amélioration locale. Pas de classement entre familles (« Dégâts » et « Puissance » ne se comparent pas, la vitesse d'attaque n'est pas comptée).
    Non comptés : perks élémentaires des armes, gemmes (non choisies), armure des pièces, attaques des ennemis, points faibles, attaques impitoyables et furtives. Deux anneaux différents (doublon en jeu non vérifié).</div></div>`}
function boOutHtml(){const b=B(),valid=BO.key===boKey(b);
  if(BO.busy)return `<p class="meta2" role="status">Calcul en cours… ${esc(BO.prog)} <button class="btn sm" id="boStop">Arrêter</button></p>${BO.part&&valid?boCards(BO.part):''}`;
  if(!BO.out)return BO.stop?'<p class="meta2">Calcul arrêté.</p>':'';
  if(!valid)return '<p class="meta2">Réglages changés depuis le dernier calcul (build, cible, arme analysée, points, Flamme ou améliorations) : relancez le calcul.</p>';
  return `${boCards(BO.out)}<p class="meta2">${BO.stop?'Calcul arrêté avant la fin. ':''}Calculé en ${fmt(BO.out.ms/1000,1)} s.</p>`}
function boCards(o){const b=B(),en=ENEMIES[o.en],cw=compute(b).weapons[o.slot==='w1'?0:1],cf=cw?boFamOf(cw.w):null,cs=cw?boScore(b,o.slot,en):null;
  return `<div class="bogrid">${BO_FAM.map(([fk,fl])=>{const r=o.res.find(x=>x&&x.fk===fk);
    if(!r)return `<div class="wrow"><div class="wl">${fl}</div><p class="meta2">${BO.busy?'En attente…':'Non calculée (calcul arrêté).'}</p></div>`;
    if(r.skip)return `<div class="wrow"><div class="wl">${fl}</div><p class="meta2">Non calculée : temps maximal atteint (${BO_TMAX/1000} s).</p></div>`;
    const m=boMerge(r,b,o),c=compute(m),wc=c.weapons[o.slot==='w1'?0:1],ms=boScore(m,o.slot,en),free=o.N-r.used;
    const vs=cf===fk&&cs?`<p class="meta2">Par rapport à votre build : ${cs.d>0?`<b class="${ms.d>cs.d?'d-up':ms.d<cs.d?'d-dn':'d-0'}">${ms.d>=cs.d?'+':''}${fmt((ms.d/cs.d-1)*100,1)} %</b> de dégâts`:'vous ne faites aucun dégât à cette cible'}, ${ms.hp>=cs.hp?'+':''}${fmt(ms.hp-cs.hp)} PV.</p>`:'';
    const imm=ms.d===0?`<p class="meta2">${esc(en.n)} est immunisé à toutes les armes de cette famille : seuls les PV sont optimisés.</p>`:'';
    const gear=SLOTS.map(([sl,lab])=>{const it=ITEMS[m.gear[sl]];const note=sl===o.slot?'':sl[0]==='w'?' (inchangée)':it&&!r.b.gear[sl]?' (conservée : aucune pièce ne change dégâts ni PV)':'';return `<li>${lab} : ${it?esc(it.n):'—'}${note}</li>`}).join('');
    const g=GEMI[(m.gem||{})[o.slot]],g0=GEMI[(b.gem||{})[o.slot]];
    const gem=`<li>Gemme : ${g?esc(g.fr)+' (conservée)':g0?`à choisir (${esc(g0.fr)} retirée : type de dégâts non utilisé par cette arme ; effet non chiffré)`:'à choisir (effet non chiffré)'}</li>`;
    const sk=boRoles(m,o.slot,en);
    return `<div class="wrow${cf===fk?' sel':''}"><div class="wl">${fl}${cf===fk?' · famille de votre arme':''}</div><div><b>${esc(r.w.n)}</b> <small class="meta2">${wc.catName} · ${wtypeTxt(r.w)}</small></div>
      <div class="big"><div><b>${fmt(ms.d)}</b><span>${wc.unit==='Puissance'?'puissance moyenne':'dégâts moyens'} / coup</span></div><div><b>${fmt(ms.hp)}</b><span>PV</span></div><div><b>${r.used}</b><span>points sur ${o.N}</span></div></div>${imm}${vs}
      <details class="why"><summary>Équipement et compétences</summary><ul>${gear}${gem}<li>Attributs : ${PIPS.map(p=>p[2]+' '+c.attr[p[0]]).join(' · ')}</li>${sk}
        ${free>0?`<li>${free} point${free>1?'s':''} libre${free>1?'s':''} : plus rien n'augmente les dégâts ni les PV.</li>`:''}</ul></details>
      <div class="row"><button class="btn sm primary" data-boap="${fk}">Appliquer</button></div></div>`}).join('')}</div>`}
/* Rôle de chaque compétence achetée : retirer un rang baisse les dégâts → « pour les dégâts » ; sinon les PV → « pour les PV » ; sinon liaison */
function boRoles(m,slot,en){const s0=boScore(m,slot,en),g={d:[],hp:[],l:[]};
  for(const s of SK){const r=m.sk[s.id];if(!(r>0))continue;m.sk[s.id]=r-1;const e=boScore(m,slot,en);m.sk[s.id]=r;g[e.d<s0.d*(1-1e-9)?'d':e.hp<s0.hp-1e-9?'hp':'l'].push(`${esc(s.fr)} ${r}/${s.max}`)}
  return [['d','Compétences pour les dégâts'],['hp','Pour les PV'],['l','Liaisons (chemin)']].map(([k,l])=>g[k].length?`<li>${l} : ${g[k].join(', ')}</li>`:'').join('')}
function boPaint(){const el=$('#boOut');if(el)el.innerHTML=boOutHtml();const go=$('#boGo');if(go)go.disabled=BO.busy}
function boStart(){const b=B(),en=ENEMIES[oEnemy],N=boN(b),F=boF(b),my=++BO.run;BO.N=N;BO.F=F;BO.key=boKey(b);BO.busy=true;BO.out=null;BO.part=null;BO.stop=false;BO.prog='';BO.t0=Date.now();
  const cw=compute(b).weapons[oSlot==='w1'?0:1],g=boRun(oSlot,en,N,F,b.upg,cw?boFamOf(cw.w):null),base={N,F,slot:oSlot,en:oEnemy};
  const tick=()=>{if(my!==BO.run)return;const t=Date.now();let r;do{r=g.next();if(!r.done&&r.value)BO.part=Object.assign({res:Object.values(r.value.res)},base),BO.prog=`${Object.keys(r.value.res).length} famille(s) sur ${BO_FAM.length} (dernière : ${r.value.fam})`}while(!r.done&&Date.now()-t<30);
    if(r.done){BO.busy=false;BO.out=r.value;BO.part=null}boPaint();if(!r.done)setTimeout(tick,0)};
  boPaint();setTimeout(tick,0)}
function boStopRun(){if(!BO.busy)return;BO.run++;BO.busy=false;BO.stop=true;BO.out=BO.part?Object.assign({},BO.part,{ms:Date.now()-BO.t0}):null;BO.part=null;boPaint()}
function boApply(fk){const o=BO.out,r=o&&o.res.find(x=>x&&x.fk===fk);if(!r||r.skip||BO.key!==boKey(B()))return;const m=boMerge(r,B(),o);builds[cur]=m;BO.key=boKey(m);renderAll();
  toast(`Build optimal appliqué : ${r.fl}, ${r.w.n} (${r.used} pts)`)}
/* Événements de la carte (appelé par renderOptNow après chaque rendu) */
function boBind(root){const go=root.querySelector('#boGo');if(!go)return;go.onclick=()=>{const n=parseInt(root.querySelector('#boN').value,10),f=parseInt(root.querySelector('#boF').value,10);
    BO.N=isNaN(n)?null:Math.max(1,Math.min(212,n));BO.F=isNaN(f)?null:Math.max(1,Math.min(11,f));boStart()};
  root.querySelector('#boN').onchange=e=>{const v=parseInt(e.target.value,10);BO.N=isNaN(v)?null:Math.max(1,Math.min(212,v));boPaint()};
  root.querySelector('#boF').onchange=e=>{const v=parseInt(e.target.value,10);BO.F=isNaN(v)?null:Math.max(1,Math.min(11,v));boPaint()};
  root.querySelector('#boOut').onclick=e=>{const ap=e.target.closest('button[data-boap]');if(ap){boApply(ap.dataset.boap);return}if(e.target.closest('#boStop'))boStopRun()}}

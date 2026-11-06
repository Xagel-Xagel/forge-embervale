/* =========================== OPTIMISATION =========================== */
const TI={};DTYPES.forEach((d,i)=>TI[d[0]]=i);
const FLY=/Vulture|Bat\b|Wispwyvern|Dragon Youngling|Bees|Raven/;
ENEMIES.forEach(e=>e.fly=FLY.test(e.n));
const DTL=Object.fromEntries(DTYPES.map(d=>[d[0],d[1]]));
let planN=10,oEnemy=Math.max(0,ENEMIES.findIndex(e=>e.n==='Fell Black Knight')),oSlot='w1',oFam='same',oMxF='all',oMxQ='';
const DEF={hit:600,type:'cut',armP:300,armM:200,cap:60,crowd:false,aura:false};
const famOf=w=>CAT[w.cat][1];
const FAM={melee:'Mêlée (épées, haches, masses, espadons)',dagger:'Dagues',bow:'Arcs',wand:'Baguettes',staff:'Bâtons'};
const xm=v=>v===0?'immunisé':'×'+fmt(v/100,2);
function heat(v){if(v===0)return 'class="hc imm"';const d=v-100;if(!d)return 'class="hc"';
  const p=Math.round(Math.min(45,8+Math.abs(d)*0.75));return `class="hc" style="background:color-mix(in srgb,var(${d>0?'--good':'--bad'}) ${p}%,var(--surface))"`}
function tgtBonus(o,en){let t=0;const p=[];
  if(en.f==='fell'&&o.vs.vsFell){t+=o.vs.vsFell;p.push('contre les Fell +'+o.vs.vsFell+' %')}
  if(en.f==='hollow'&&o.vs.hollow){t+=o.vs.hollow;p.push(SKI.boneToAsh.fr+' +'+o.vs.hollow+' %')}
  if(en.fly&&o.vs.flying){t+=o.vs.flying;p.push(SKI.eaglesBane.fr+' +'+o.vs.flying+' %')}
  return {t,p}}
/* Arme mixte : chaque part est multipliée par le multiplicateur de son type ; m = multiplicateur effectif (moyenne pondérée par les dégâts de chaque part) */
function vsEnemy(wc,o,en){const tb=tgtBonus(o,en);const raw=wc.byType.reduce((a,[t,,h])=>a+h*en.m[TI[t]]/100,0);const m=wc.hit?raw/wc.hit*100:0;const k=wc.hit?raw/wc.hit*(1+tb.t/100):0;return {m,tb,hit:wc.hit*k,avg:wc.avg*k}}
function effVs(b,slot,en){const o=compute(b);const wc=o.weapons[slot==='w1'?0:1];if(!wc)return null;return Object.assign({o,wc},vsEnemy(wc,o,en))}
const clone=x=>JSON.parse(JSON.stringify(x));

function investments(b,slot,en){
  const base=effVs(b,slot,en);if(!base||base.avg<=0)return [];
  const out=[];
  for(const s of SK){const r=b.sk[s.id]||0;if(r>=s.max)continue;
    const t=clone(b);t.sk[s.id]=r+1;const q=effVs(t,slot,en);if(!q||q.avg<=base.avg*1.0005)continue;
    const n=TOPO.byId[s.id];if(!n)continue;const t2=clone(b);let cost,path=[];
    if(r>0){cost=s.cost;t2.sk[s.id]=r+1}else{path=pathTo(t2,n);if(!path)continue;cost=pathCost(t2,path);buyPath(t2,path)}
    const q2=effVs(t2,slot,en);const gain=q2.avg/base.avg-1;
    out.push({kind:'skill',id:s.id,label:s.fr,en:s.en,rank:r+1,max:s.max,cost,via:Math.max(0,path.length-1),gain,per:gain/Math.max(1,cost),avg:q2.avg})}
  const R=reach(b);
  for(const k of ['str','dex','int']){let best=null;
    for(const p of TOPO.pips){if(p.attr!==k||b.pn[p.id])continue;const pth=canBuy(b,p,R)?[p]:pathTo(b,p);if(!pth)continue;const c=pathCost(b,pth);if(!best||c<best.c)best={p,pth,c}}
    if(!best)continue;const t=clone(b);buyPath(t,best.pth);const q=effVs(t,slot,en);if(!q)continue;const gain=q.avg/base.avg-1;if(gain<=0.0005)continue;
    const P=PIPS.find(x=>x[0]===k);out.push({kind:'pip',id:best.p.id,label:P[1]+' +1',en:'nœud d\'attribut',rank:(b.pip[k]||0)+1,max:P[4],cost:best.c,via:best.pth.length-1,gain,per:gain/Math.max(1,best.c),avg:q.avg})}
  return out.sort((a,b)=>b.per-a.per||b.gain-a.gain);
}
function buyInvest(b,it){
  if(it.kind==='pip'){const n=TOPO.byId[it.id];const pth=canBuy(b,n)?[n]:pathTo(b,n);if(pth)buyPath(b,pth);return}
  const s=SKI[it.id],n=TOPO.byId[it.id];if((b.sk[it.id]||0)>0){b.sk[it.id]=Math.min(s.max,b.sk[it.id]+1);return}
  const pth=pathTo(b,n);if(pth)buyPath(b,pth);
}
/* Optimiseur multi-points : meilleure façon de dépenser N points contre une cible (dégâts moyens de l'arme analysée).
   Gloutons (gain par point, puis gain brut), puis amélioration locale : retirer une étape et re-remplir ; le meilleur plan gagne. Invariant de l'arbre préservé (buyInvest). */
function planPoints(b,slot,en,N,tmax){const t0=Date.now(),sp0=spentPoints(b),base=effVs(b,slot,en);if(!base||base.avg<=0||N<1)return null;
  const byPer=(x,y)=>y.per-x.per||y.gain-x.gain,byGain=(x,y)=>y.gain-x.gain||x.cost-y.cost;
  const fill=(t,steps,key)=>{for(let g=0;g<300;g++){const left=N-(spentPoints(t)-sp0);const inv=investments(t,slot,en).filter(x=>x.cost<=left).sort(key);if(!inv.length)break;buyInvest(t,inv[0]);steps.push(inv[0])}
    return {t,steps,avg:effVs(t,slot,en).avg,used:spentPoints(t)-sp0}};
  const replay=list=>{const t=clone(b),steps=[];for(const it of list){const left=N-(spentPoints(t)-sp0);const inv=investments(t,slot,en).find(x=>x.kind===it.kind&&x.id===it.id);if(!inv||inv.cost>left)continue;buyInvest(t,inv);steps.push(inv)}return {t,steps}};
  let best=null;for(const key of [byPer,byGain]){const r=fill(clone(b),[],key);if(!best||r.avg>best.avg+1e-9)best=r}
  for(let more=true,k=0;more&&k<5&&Date.now()-t0<(tmax||1500);k++){more=false;
    for(let i=0;i<best.steps.length&&Date.now()-t0<(tmax||1500);i++){const {t,steps}=replay(best.steps.filter((_,j)=>j!==i));
      for(const key of [byPer,byGain]){const r=fill(clone(t),[...steps],key);if(r.avg>best.avg*1.000001){best=r;more=true;break}}if(more)break}}
  return {...best,base:base.avg,gain:best.avg/base.avg-1}}
function defense(o,d,type){
  const kind=DTYPES[TI[type]][2];const hit=Math.max(0,+d.hit||0);const cap=Math.max(0,Math.min(95,+d.cap||0))/100;const steps=[];
  let v=hit;
  if(kind!=='poison'){const arm=Math.max(0,kind==='phys'?+d.armP||0:+d.armM||0);const after=Math.max(hit-arm,hit*(1-cap));
    steps.push(`armure ${kind==='phys'?'physique':'magique'} ${fmt(arm)} : −${fmt(hit-after)}${hit-arm<hit*(1-cap)?' (plafond atteint)':''}`);v=after}
  else steps.push('le poison ignore l\'armure');
  const res={fire:o.resFire,ice:o.resIce,shock:o.resShock,shroud:o.resShroud,poison:o.resPoison}[type]||0;
  if(res){v*=1-Math.min(100,res)/100;steps.push(`résistance ${fmt(res)} %`)}
  if(d.crowd&&kind==='phys'&&o.R('tower')){v*=0.9;steps.push(SKI.tower.fr+' −10 %')}
  if(d.crowd&&kind==='mag'&&o.R('warden')){v*=0.9;steps.push(SKI.warden.fr+' −10 %')}
  if(d.aura){v*=0.9;steps.push(SKI.earthAura.fr+' −10 %')}
  return {hit,dmg:v,red:hit?1-v/hit:0,ko:v>0?Math.ceil(o.hp/v):Infinity,steps,useful:kind==='poison'?0:hit*cap}
}

function optTable(rows,head,cls){return `<div class="oscroll"><table class="ot ${cls||''}"><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`}

function defOut(o){
  const dsel=defense(o,DEF,DEF.type);
  const drow=DTYPES.map(([k,l])=>{const r=defense(o,DEF,k);return `<tr${k===DEF.type?' class="cur"':''}><th>${l}</th><td>${fmt(r.dmg)}</td><td>${fmt(r.red*100)} %</td><td>${r.ko===Infinity?'∞':r.ko}</td></tr>`});
  const worst=DTYPES.map(([k,l])=>[l,defense(o,DEF,k)]).sort((a,b)=>b[1].dmg-a[1].dmg)[0];
  const kind=DTYPES[TI[DEF.type]][2];const armNow=kind==='phys'?+DEF.armP:kind==='mag'?+DEF.armM:0;const an=kind==='phys'?'physique':'magique';
  return `<div class="dres"><div class="big"><div><b>${fmt(dsel.dmg)}</b><span>dégâts subis</span></div><div><b>${fmt(dsel.red*100)} %</b><span>réduits</span></div><div><b>${dsel.ko===Infinity?'∞':dsel.ko}</b><span>coups avant K.O. (${fmt(o.hp)} PV)</span></div></div>
      <div class="meta2">${dsel.steps.join(' · ')}</div>
      ${kind!=='poison'?`<p class="verdict">${armNow>=dsel.useful?`Votre armure ${an} (${fmt(armNow)}) atteint déjà le plafond pour un coup de ${fmt(dsel.hit)} : au-delà de <b>${fmt(dsel.useful)}</b>, chaque point est perdu contre ce coup. Mieux vaut investir en santé ou en résistances.`:`Chaque point d'armure ${an} retire encore 1 dégât à ce coup, jusqu'à <b>${fmt(dsel.useful)}</b> d'armure (il vous en manque ${fmt(dsel.useful-armNow)}).`}</p>`:`<p class="verdict">Contre le poison, seule la résistance au poison compte (${fmt(o.resPoison)} % actuellement).</p>`}
    </div>
    ${optTable(drow,['Même coup en…','Subis','Réduits','Coups'])}
    <div class="meta2">Type le plus dangereux pour un coup de cette taille : <b>${worst[0]}</b>. Les valeurs d'armure finales ne sont pas publiées dans les fichiers 1.0 : reportez celles de votre fiche personnage.</div>`}
function mxRows(){const q=oMxQ.toLowerCase();
  const mx=ENEMIES.map((e,i)=>[e,i]).filter(([e])=>(oMxF==='all'||e.f===oMxF)&&(!q||e.n.toLowerCase().includes(q)));
  return mx.map(([e,i])=>`<tr${i===oEnemy?' class="cur"':''}><th><button class="lnk" data-en="${i}">${esc(e.n)}</button><small>${FACTIONS[e.f].split(' ')[0]}${e.lv!=='—'?' · niv. '+e.lv:''}</small></th>${e.m.map(v=>`<td ${heat(v)}>${v===0?'0':fmt(v/100,2)}</td>`).join('')}</tr>`).join('')||'<tr><td colspan="9" class="empty">Aucun ennemi.</td></tr>'}
let optT=null;
function renderOpt(){if(optT)clearTimeout(optT);optT=setTimeout(renderOptNow,25)}
/* Seul l'onglet ouvert est rendu (Calculateur, Build optimal, Défense ou Tables) ; showSec (10-ui.js) rend un onglet à son ouverture */
function renderOptNow(){optT=null;
  const b=B(),en=ENEMIES[oEnemy];
  if(BO.busy&&BO.key!==boKey(b))boStopRun(); // build, cible ou réglages changés pendant le calcul du build optimal, quel que soit l'onglet ouvert
  const f={calc:optCalc,bo:optBo,def:optDef,tab:optTab}[sec];if(f)f(b,compute(b),en)}
/* Onglet Calculateur : faiblesses, armes contre la cible, classement des armes, où placer les points */
function optCalc(b,o,en){
  const root=$('#optBody');if(!root)return;
  $('#optFor').textContent='Build '+'AB'[cur]+' · '+b.name;
  $('#oSlot').value=oSlot;$('#oFam').value=oFam;$('#oEnemy').value=String(oEnemy);
  const wc=o.weapons[oSlot==='w1'?0:1];
  // 1. faiblesses
  const order=DTYPES.map((d,i)=>[d,en.m[i]]);const top=Math.max(...en.m);const low=order.filter(x=>x[1]<100);
  const best=order.filter(x=>x[1]===top&&top>100).map(x=>x[0][1]);
  const yours=wc?vsEnemy(wc,o,en).m:null;
  const cWeak=`<div class="ocard"><div class="oh"><h3>${esc(en.n)}</h3><span class="lbl">${FACTIONS[en.f]}${en.lv&&en.lv!=='—'?' · niv. '+en.lv:''}${en.boss?' · boss / élite':''}${en.fly?' · volant':''}</span></div>
    <div class="heat">${order.map(([d,v])=>`<div ${heat(v)} title="${d[1]} : ${v===0?'aucun dégât':v>100?'+'+(v-100)+' % de dégâts subis':v<100?'−'+(100-v)+' % de dégâts subis':'dégâts normaux'}"><span>${d[1]}</span><b>${xm(v)}</b></div>`).join('')}</div>
    <p class="verdict">${best.length?`<b class="d-up">Faiblesse :</b> ${best.join(', ')} (${xm(top)}).`:'<b>Aucune faiblesse marquée.</b>'}
    ${low.length?` <b class="d-dn">Résiste à :</b> ${low.map(x=>x[0][1]+' ('+xm(x[1])+')').join(', ')}.`:''}
    ${wc?` Votre ${oSlot==='w1'?'arme 1':'arme 2'} frappe en <b>${wtypeTxt(wc.w)}</b> : <b class="${yours>100?'d-up':yours<100?'d-dn':''}">${xm(yours)}</b>.`:''}</p>
    <div class="meta2">Source : ${en.src}${en.src==='PinDrop'?' (fichiers du jeu 1.0)':' (fichiers 1.0, désaccord possible avec PinDrop)'}</div></div>`;
  // 2. armes équipées
  const eq=o.weapons.map((w,i)=>{if(!w)return `<div class="wrow"><div class="wl">Arme ${i+1} : aucune</div></div>`;const v=vsEnemy(w,o,en);
    return `<div class="wrow${('w'+(i+1))===oSlot?' sel':''}"><div><div class="wl">Arme ${i+1} · ${w.catName} · ${wtypeTxt(w.w)}</div><b>${esc(w.w.n)}</b></div>
      <div class="big"><div><b>${fmt(v.hit)}</b><span>${w.unit} / coup</span></div><div><b>${fmt(v.avg)}</b><span>moyenne avec critiques</span></div><div><b class="${v.m>100?'d-up':v.m<100?'d-dn':''}">${xm(v.m)}</b><span>type contre la cible</span></div></div>
      <div class="meta2">Hors cible : ${fmt(w.hit)} / coup${v.tb.p.length?' · '+v.tb.p.join(', '):''}</div></div>`}).join('');
  const cEq=`<div class="ocard"><div class="oh"><h3>Vos armes contre cette cible</h3></div>${eq}
    <div class="meta2">Hors coups critiques sur point faible, attaques impitoyables (×${fmt(o.merciless/100,1)}) et furtives (×${fmt(o.sneak/100,1)}), qui multiplient encore ces valeurs.</div></div>`;
  // 3. classement des armes
  const fam=oFam==='same'?(wc?famOf(wc.w):'all'):oFam;
  const list=WEAPONS.map(x=>ITEMS[x[0]]).filter(w=>fam==='all'||famOf(w)===fam).map(w=>{const c=weaponCalc(w,o,o.raw,o.R,o.attr);return {w,c,v:vsEnemy(c,o,en)}}).sort((a,b)=>b.v.avg-a.v.avg);
  const ref=wc?vsEnemy(wc,o,en).avg:0;
  const rows=list.slice(0,12).map((x,i)=>{const same=wc&&x.w.id===wc.w.id;const dv=ref&&wc&&x.c.unit===wc.unit?x.v.avg/ref-1:null;
    return `<tr${same?' class="cur"':''}><td class="n">${i+1}</td><td class="nm"><b>${esc(x.w.n)}</b><small>${x.c.catName} · ${wtypeTxt(x.w)} · niv. ${x.w.lv}</small></td>
    <td><span ${heat(x.v.m)}>${xm(x.v.m)}</span></td><td>${fmt(x.v.avg)}<small>${x.c.unit==='Puissance'?' pui.':''}</small></td>
    <td class="${dv===null?'d-0':dv>0.001?'d-up':dv<-0.001?'d-dn':'d-0'}">${same?'équipée':dv===null?'—':(dv>0?'+':'')+fmt(dv*100,1)+' %'}</td>
    <td class="act">${same?'':`<button class="btn sm" data-eq="${x.w.id}" data-sl="w1">Arme 1</button><button class="btn sm" data-eq="${x.w.id}" data-sl="w2">Arme 2</button>`}</td></tr>`});
  const cRank=`<div class="ocard"><div class="oh"><h3>Meilleures armes contre ${esc(en.n)}</h3><span class="lbl">${fam==='all'?'toutes familles':FAM[fam]}</span></div>
    ${fam==='all'?'<p class="meta2">Attention : « Dégâts » (mêlée, dagues, baguettes) et « Puissance » (arcs, bâtons) ne se comparent pas directement.</p>':''}
    ${optTable(rows,['#','Arme','Type','Moyenne','vs équipée',''],'named')}
    <div class="meta2">Calculé avec vos attributs et compétences actuels : la même arme gagne ou perd des places selon le build.</div></div>`;
  // 4. investissements
  let cInv;
  if(!wc)cInv=`<div class="ocard"><div class="oh"><h3>Où placer vos prochains points</h3></div><p class="empty">Équipez une arme en ${oSlot==='w1'?'arme 1':'arme 2'} pour voir les points les plus rentables.</p></div>`;
  else{const inv=investments(b,oSlot,en);const free=budget(b)-spentPoints(b);
    const ir=inv.slice(0,10).map((x,i)=>`<tr${x.cost>free?' class="over"':''}><td class="n">${i+1}</td><td class="nm"><b>${esc(x.label)}</b><small>${esc(x.en)} · rang ${x.rank}/${x.max}${x.via?` · via ${x.via} nœud${x.via>1?'s':''} sur le chemin`:''}</small></td>
      <td>${x.cost} pt${x.cost>1?'s':''}</td><td class="d-up">+${fmt(x.gain*100,1)} %</td><td>${fmt(x.per*100,2)} %</td>
      <td class="act"><button class="btn sm" data-inv="${i}">${x.cost>free?'Acheter (dépasse)':'Acheter'}</button></td></tr>`);
    cInv=`<div class="ocard"><div class="oh"><h3>Où placer vos prochains points</h3><span class="lbl">${free>=0?free+' pts libres':'budget dépassé de '+(-free)+' pts'}</span></div>
      ${ir.length?optTable(ir,['#','Nœud','Coût','Gain','Gain / pt',''],'named'):vsEnemy(wc,o,en).m===0?`<p class="empty">${esc(en.n)} est immunisé aux dégâts ${wtypeTxt(wc.w)} : aucun point ne changera rien. Changez d'arme (voir le classement).</p>`:'<p class="empty">Aucun nœud accessible n\'augmente encore les dégâts de cette arme contre cette cible : vos bonus offensifs sont au maximum.</p>'}
      <div class="meta2">Classé par gain de dégâts moyens par point dépensé, chemin d'accès compris. Un nœud verrouillé est acheté avec le chemin le moins cher depuis vos nœuds reliés à un point de départ.</div>
      <div class="row"><label class="chk">Répartir au mieux <input type="number" id="planN" min="1" max="212" value="${Math.max(1,Math.min(planN,Math.max(1,free)))}" style="width:5rem" aria-label="Nombre de points à répartir"> points</label><button class="btn sm" id="planGo">Calculer</button></div>
      <div id="planOut"></div></div>`;
    root._inv=inv}
  root.innerHTML=`<div class="optgrid">${cWeak}${cEq}</div><div class="optgrid">${cRank}${cInv}</div>`;
  // événements
  root.querySelectorAll('[data-eq]').forEach(bt=>bt.onclick=()=>{b.gear[bt.dataset.sl]=bt.dataset.eq;if(b.gem)delete b.gem[bt.dataset.sl];renderAll();toast(ITEMS[bt.dataset.eq].n+' équipée en '+(bt.dataset.sl==='w1'?'arme 1':'arme 2'))});
  root.querySelectorAll('[data-inv]').forEach(bt=>bt.onclick=()=>{const it=root._inv[+bt.dataset.inv];if(!it)return;buyInvest(b,it);renderAll();toast(it.label+' acheté ('+it.cost+' pt'+(it.cost>1?'s':'')+')')});
  const pg=root.querySelector('#planGo');if(pg)pg.onclick=()=>{planN=Math.max(1,Math.min(212,parseInt(root.querySelector('#planN').value)||1));const P=planPoints(b,oSlot,en,planN);const out=root.querySelector('#planOut');
    if(!P||!P.steps.length){out.innerHTML='<p class="empty">Aucun point ne peut augmenter les dégâts de cette arme contre cette cible.</p>';return}
    let acc=0;const rows=P.steps.map((x,i)=>{acc+=x.cost;return `<tr><td class="n">${i+1}</td><td class="nm"><b>${esc(x.label)}</b><small>${esc(x.en)} · rang ${x.rank}/${x.max}${x.via?` · via ${x.via} nœud${x.via>1?'s':''}`:''}</small></td><td>${x.cost} pt${x.cost>1?'s':''}</td><td>${acc}</td></tr>`});
    out.innerHTML=`${optTable(rows,['#','Nœud','Coût','Cumul'],'named')}<p class="verdict">${P.used} / ${planN} points : dégâts moyens ${fmt(P.base)} → <b>${fmt(P.avg)}</b> <span class="d-up">(+${fmt(P.gain*100,1)} %)</span>${P.used<planN?' · plus rien d\'autre n\'augmente ces dégâts':''}</p>
      <div class="row"><button class="btn sm primary" id="planApply">Appliquer le plan</button><span class="meta2">Méthode : gloutons puis amélioration locale (pas une preuve d'optimalité).</span></div>`;
    out.querySelector('#planApply').onclick=()=>{builds[cur]=Object.assign(P.t,{name:b.name});renderAll();toast(`Plan appliqué : ${P.used} pts, +${fmt(P.gain*100,1)} %`)}};
}
/* Onglet Build optimal (21-buildopt.js) : même cible et même arme analysée que le calculateur */
function optBo(b,o,en){const root=$('#boBody');if(!root)return;
  $('#boFor').textContent='Build '+'AB'[cur]+' · '+b.name;
  $('#oSlot').value=oSlot;$('#oEnemy').value=String(oEnemy);
  root.innerHTML=boCard(b,en);boBind(root)}
/* Onglet Défense : coup reçu, armure et résistances → dégâts subis et coups avant K.O. (réglages gardés dans DEF) */
function optDef(b,o){const root=$('#defBody');if(!root)return;
  $('#defFor').textContent='Build '+'AB'[cur]+' · '+fmt(o.hp)+' PV';
  root.innerHTML=`<div class="dform">
      <label>Coup reçu (avant réduction)<input type="number" id="dHit" min="0" value="${DEF.hit}"></label>
      <label>Type du coup<select id="dType">${DTYPES.map(d=>`<option value="${d[0]}"${d[0]===DEF.type?' selected':''}>${d[1]}</option>`).join('')}</select></label>
      <label>Armure physique (fiche en jeu)<input type="number" id="dArmP" min="0" value="${DEF.armP}"></label>
      <label>Armure magique (fiche en jeu)<input type="number" id="dArmM" min="0" value="${DEF.armM}"></label>
      <label>Réduction max. par l'armure (%)<input type="number" id="dCap" min="0" max="95" value="${DEF.cap}"></label>
      <div class="dchk"><label class="chk"><input type="checkbox" id="dCrowd"${DEF.crowd?' checked':''}> 3 ennemis ou plus à 20 m${o.R('tower')||o.R('warden')?'':' <small>(Tour / Gardien non pris)</small>'}</label>
      <label class="chk"><input type="checkbox" id="dAura"${DEF.aura?' checked':''}> Aura de terre active</label></div>
    </div><div id="defOut">${defOut(o)}</div>`;
  const upd=()=>{$('#defOut').innerHTML=defOut(compute(B()))};
  const num=(id,k)=>{root.querySelector(id).oninput=e=>{DEF[k]=Math.max(0,parseFloat(e.target.value)||0);upd()}};
  num('#dHit','hit');num('#dArmP','armP');num('#dArmM','armM');num('#dCap','cap');
  root.querySelector('#dType').onchange=e=>{DEF.type=e.target.value;upd()};
  root.querySelector('#dCrowd').onchange=e=>{DEF.crowd=e.target.checked;upd()};
  root.querySelector('#dAura').onchange=e=>{DEF.aura=e.target.checked;upd()}}
/* Onglet Tables : matrice des faiblesses (ouverte par défaut) et formules ; un nom cliqué devient la cible et ouvre le calculateur */
let mxOpen=true,fOpen=false;
function optTab(){const root=$('#tabBody');if(!root)return;
  // 1. matrice complète
  const cMx=`<details class="ocard" id="mxBox"${mxOpen?' open':''}><summary><h3>Table complète : ${ENEMIES.length} ennemis × 8 types de dégâts</h3></summary>
    <div class="filters" style="margin:8px 0"><select id="mxF"><option value="all">Toutes les factions</option>${Object.entries(FACTIONS).map(([k,v])=>`<option value="${k}"${k===oMxF?' selected':''}>${v}</option>`).join('')}</select>
    <input type="text" id="mxQ" placeholder="Filtrer par nom" value="${esc(oMxQ)}" aria-label="Filtrer les ennemis"></div>
    <div class="oscroll mxs"><table class="ot mx"><thead><tr><th>Ennemi</th>${DTYPES.map(d=>`<th>${d[1]}</th>`).join('')}</tr></thead><tbody id="mxBody">${mxRows()}</tbody></table></div>
    <div class="meta2">Multiplicateur appliqué aux dégâts de ce type : 1,2 = +20 % (faiblesse), 0,8 = −20 % (résistance), 0 = immunisé. Cliquez un nom pour l'analyser dans le calculateur. Les feux follets (wisps) sont exclus : les sources se contredisent sur leurs valeurs.</div></details>`;
  // 2. formules
  const cF=`<details class="ocard" id="fBox"${fOpen?' open':''}><summary><h3>Formules utilisées et niveau de confiance</h3></summary><div class="formulas">
    <div><span class="tag ok">officiel</span><b>Armure.</b> Tutoriel en jeu : chaque point d'armure réduit les dégâts reçus de 1, jusqu'à 60 % de réduction au maximum.
      <code>subis = max(coup − armure, coup × (1 − 60 %))</code> L'armure physique couvre tranchant, perçant, contondant ; l'armure magique couvre feu, glace, foudre, Shroud. Le poison ignore l'armure.</div>
    <div><span class="tag ok">fichiers du jeu</span><b>Faiblesses des ennemis.</b> Chaque ennemi a un multiplicateur caché par type de dégâts. Pour une arme à dégâts mixtes, chaque part est multipliée séparément puis additionnée. <span class="tag ok">fichiers du jeu</span> Répartition : 16 armes de mêlée et dagues à 50/50 (ex. tranchant + glace), les autres à 100 %. <span class="tag hyp">hypothèse</span> Une compétence de type (Taillade, Pyromane…) ne joue que sur sa part.
      <code>dégâts sur la cible = Σ (part du type × multiplicateur du type)</code></div>
    <div><span class="tag est">communauté</span><b>Dégâts infligés.</b> <code>coup = base de l'arme × (1 + Σ bonus %) × multiplicateur du type × (1 + bonus contre la famille)</code>
      Bonus : +5 % par point de Force (mêlée), de Dextérité (arcs, dagues) ou d'Intelligence (magie), compétences de famille d'arme et de type de dégâts, statistiques d'équipement. Le simulateur additionne ces bonus ; le jeu en multiplie peut-être certains.</div>
    <div><span class="tag ok">fichiers du jeu</span><b>Arbre de compétences.</b> Positions et liaisons des 243 nœuds : fichiers 1.0 (relevé PinDrop). <span class="tag hyp">déduit</span> Une liaison marche dans les deux sens (9 nœuds n'ont aucun lien entrant) et chaque rang coûte le prix du nœud (un seul coût par nœud dans les fichiers).</div>
    <div><span class="tag est">communauté</span><b>Critiques.</b> <code>moyenne = coup × (1 + chance de critique × dégâts critiques)</code> Base : 10 % de chance, +80 % de dégâts.</div>
    <div><span class="tag hyp">hypothèse</span><b>Résistances en %.</b> Appliquées après l'armure, en multiplication : <code>subis × (1 − résistance)</code>. Idem pour Tour, Gardien et Aura de terre (−10 % chacun quand ils s'appliquent).</div>
    <div><span class="tag hyp">heuristique</span><b>Build optimal.</b> Pour chaque famille d'arme : chaque arme non dominée (même catégorie et même répartition des dégâts → la base la plus haute) est essayée ; l'arbre est rempli depuis zéro par deux gloutons (gain de dégâts par point, gain brut ; quand plus rien n'augmente les dégâts, gain de PV par point ; si aucun achat seul ne rapporte, on regarde l'achat d'après) ; l'équipement est choisi pièce par pièce avec la meilleure paire de deux anneaux différents ; on alterne jusqu'à ce que l'équipement ne change plus ; si le budget manque, amélioration locale (retirer un nœud, re-remplir). Pas une preuve d'optimalité.</div>
    <div><span class="tag hyp">limite</span><b>Ce qui n'est pas compté.</b> Arcs et bâtons : le type affiché est indicatif (la flèche ou le sort porte la répartition, absente des fichiers de l'arme) ; les perks d'arme « feu magique », « dégâts perçants »… et les gemmes ne sont pas convertis en dégâts ; les points faibles, attaques impitoyables et furtives ne sont pas dans le classement.</div>
  </div></details>`;
  root.innerHTML=cMx+cF;
  root.querySelector('#mxBody').onclick=e=>{const bt=e.target.closest('button[data-en]');if(!bt)return;oEnemy=+bt.dataset.en;showSec('calc');$('#t-calc').focus({preventScroll:true});toast('Cible : '+ENEMIES[oEnemy].n)};
  root.querySelector('#mxBox').ontoggle=e=>{mxOpen=e.target.open};
  root.querySelector('#fBox').ontoggle=e=>{fOpen=e.target.open};
  root.querySelector('#mxF').onchange=e=>{oMxF=e.target.value;$('#mxBody').innerHTML=mxRows()};
  root.querySelector('#mxQ').oninput=e=>{oMxQ=e.target.value;$('#mxBody').innerHTML=mxRows()}}
(function initOpt(){
  const sel=$('#oEnemy');if(!sel)return;
  sel.innerHTML=Object.entries(FACTIONS).map(([k,v])=>`<optgroup label="${v}">`+ENEMIES.map((e,i)=>e.f===k?`<option value="${i}">${esc(e.n)}${e.boss?' ★':''}</option>`:'').join('')+'</optgroup>').join('');
  $('#oFam').innerHTML='<option value="same">Même famille que l\'arme analysée</option><option value="all">Toutes les armes</option>'+Object.entries(FAM).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  sel.onchange=e=>{oEnemy=+e.target.value;renderOptNow()};
  $('#oSlot').onchange=e=>{oSlot=e.target.value;renderOptNow()};
  $('#oFam').onchange=e=>{oFam=e.target.value;renderOptNow()};
  const _rs=renderStats;renderStats=function(){_rs();renderOpt()};
})();

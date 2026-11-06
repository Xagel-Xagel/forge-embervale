
/* =========================== GRAPHE (style Obsidian) =========================== */
/* Tracé réel du jeu 1.0 : positions et liaisons des fichiers du jeu (relevé PinDrop, voir 01-tree-data.js).
   Chaque nœud est ancré à sa position réelle : on peut le tirer (effet élastique), il revient toujours à sa place.
   La Flamme (nœud logique reliant les 12 départs) n'est jamais dessinée : un vrai nœud occupe le centre. */


const G=(()=>{
  const cv=$('#gcv'),wrap=$('#gwrap'),card=$('#gcard');const ctx=cv.getContext('2d');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)');
  const {N,E}=TOPO;const V=N.filter(n=>n.kind!=='hub');let W=0,H=0,dpr=1,curR=new Set();
  const cam={x:0,y:0,k:.8};let alpha=0,dirty=true,hover=null,sel=null,lastO=null,drag=null,fitted=false,hoverTarget=null,hoverAmt=0,leaveT=0;
  const glowCache={};
  function glow(col){if(!glowCache[col]){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const gr=x.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');x.globalAlpha=.6;x.fillStyle=gr;x.fillRect(0,0,64,64);glowCache[col]=c}return glowCache[col]}
  /* Libellés des trois zones, au bord extérieur de leurs nœuds (comme le planificateur PinDrop) */
  const zones=AREAS.filter(a=>a[0]!=='core').map(([k,l])=>{const ns=V.filter(n=>n.area===k);const ang=Math.atan2(ns.reduce((a,n)=>a+n.ay,0),ns.reduce((a,n)=>a+n.ax,0));
    const R=Math.max(...ns.map(n=>Math.hypot(n.ax,n.ay)))+30;return {k,l,x:Math.cos(ang)*R,y:Math.sin(ang)*R}});

  /* Ressorts à la longueur réelle + rappel constant vers la position réelle : au repos, le tracé est exactement celui du jeu */
  function home(){for(const p of V){p.x=p.ax;p.y=p.ay;p.vx=p.vy=0}alpha=0;dirty=true}
  function tick(){
    const a=alpha;
    for(const [p,q,L] of E){let dx=q.x-p.x,dy=q.y-p.y,d=Math.sqrt(dx*dx+dy*dy)||1;const f=(d-L)*.06*a;dx/=d;dy/=d;p.vx+=dx*f;p.vy+=dy*f;q.vx-=dx*f;q.vy-=dy*f}
    let mv=0;for(const p of V){p.vx+=(p.ax-p.x)*.1;p.vy+=(p.ay-p.y)*.1;
      if(p===drag){p.vx=p.vy=0;continue}p.vx*=.78;p.vy*=.78;p.x+=p.vx;p.y+=p.vy;mv=Math.max(mv,Math.abs(p.x-p.ax)+Math.abs(p.y-p.ay))}
    alpha=Math.max(0,alpha*.985-.0004);if(!drag&&(alpha<=.002||mv<.05))home(); // revenu en place : on s'arrête
  }
  function release(){if(reduce.matches)home();else alpha=Math.max(alpha,.3)}
  reduce.addEventListener('change',()=>{if(reduce.matches)home()});

  /* État du build */
  const b=()=>B();
  function isOn(n){return n.kind==='start'?curR.has(n):owned(b(),n)}
  function avail(n){if(n.kind!=='skill'&&n.kind!=='pip')return false;if(owned(b(),n))return false;for(const m of n.nb)if(curR.has(m))return true;return false}
  function gearOf(n){return n.kind==='skill'&&lastO?(lastO.gearRk[n.id]||0):0}
  let colors={};
  function readColors(){const cs=getComputedStyle(document.documentElement);const g=v=>cs.getPropertyValue(v).trim();
    colors={bg:g('--g-bg'),node:g('--g-node'),edge:g('--g-edge'),label:g('--g-label'),ring:g('--g-ring'),shroud:g('--shroud'),core:g('--core'),war:g('--war'),rng:g('--rng'),mag:g('--mag'),ember:g('--ember')};for(const k in glowCache)delete glowCache[k];dirty=true}
  readColors();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',readColors);
  new MutationObserver(readColors).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','class','style']});
  const areaCol=a=>colors[a]||colors.ember;

  function matchSet(){const q=query.toLowerCase();if(!q&&!onlyOn)return null;const s=new Set();const bb=b();
    for(const n of N){if(n.kind!=='skill')continue;const okQ=!q||(n.sk.fr+' '+n.sk.en).toLowerCase().includes(q);const okO=!onlyOn||(bb.sk[n.id]||0)>0||gearOf(n)>0;if(okQ&&okO)s.add(n)}return s}

  /* Graphe caché (panneau replié ou fermé, vue Liste) : W = 0, plus rien n'est dessiné ; à la réouverture, wake le recale (canvas vidé, redessiné à l'image suivante).
     Taille inchangée (observateur appelé juste après wake) : le canvas n'est pas vidé une seconde fois, donc pas d'image vide */
  function resize(){const r=wrap.getBoundingClientRect();if(!r.width){W=0;return}const d=Math.min(2,window.devicePixelRatio||1);
    if(r.width!==W||r.height!==H||d!==dpr){dpr=d;W=r.width;H=r.height;cv.width=W*dpr;cv.height=H*dpr;dirty=true}if(!fitted)fit(area)}
  new ResizeObserver(resize).observe(wrap); // #gwrap suit le panneau Arbre : taille S ↔ M ↔ L, repli, accordéon, fenêtre (même effet que G.wake)
  const toS=(x,y)=>[(x-cam.x)*cam.k+W/2,(y-cam.y)*cam.k+H/2];
  const toW=(sx,sy)=>[(sx-W/2)/cam.k+cam.x,(sy-H/2)/cam.k+cam.y];

  function draw(){
    dirty=false;curR=reach(b());ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=colors.bg;ctx.fillRect(0,0,W,H);
    const ms=matchSet();const hl=hover&&hoverAmt>0?new Set([hover,...hover.nb]):null;
    const fa=n=>{let a=1;if(ms&&!ms.has(n)&&!(hl&&hl.has(n)))a=.22;if(hl&&!hl.has(n))a=Math.min(a,1-hoverAmt*.6);return a};
    ctx.setTransform(dpr*cam.k,0,0,dpr*cam.k,dpr*(W/2-cam.x*cam.k),dpr*(H/2-cam.y*cam.k));
    // liens
    for(const [p,q] of E){const on=isOn(p)&&isOn(q);const fq=Math.min(fa(p),fa(q));
      ctx.globalAlpha=(on?.85:.9)*fq;ctx.strokeStyle=on?areaCol(p.area==='core'?q.area:p.area):colors.edge;ctx.lineWidth=(on?1.8:1)/Math.max(.6,cam.k);
      if(hl&&(p===hover||q===hover)){ctx.globalAlpha=.9+.1*hoverAmt;if(!on&&hoverAmt>.5)ctx.strokeStyle=colors.label;ctx.lineWidth=(1+.6*hoverAmt)/Math.max(.6,cam.k)}
      ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}
    // nœuds
    for(const n of V){const on=isOn(n);const col=areaCol(n.area);ctx.globalAlpha=fa(n);
      const r=n.r*(n===hover?1+.12*hoverAmt:1);
      if(n.kind==='start'){ctx.beginPath();ctx.arc(n.x,n.y,r,0,7);ctx.fillStyle=colors.bg;ctx.fill();ctx.lineWidth=2;ctx.strokeStyle=on?col:colors.node;
        if(on){const R=r*2.4;ctx.drawImage(glow(col),n.x-R,n.y-R,2*R,2*R)}ctx.stroke();
        ctx.beginPath();ctx.arc(n.x,n.y,r*.45,0,7);ctx.fillStyle=colors.ember;ctx.fill();
        if(n===sel){ctx.beginPath();ctx.arc(n.x,n.y,r+5,0,7);ctx.lineWidth=1.5/cam.k;ctx.strokeStyle=colors.ring;ctx.stroke()}continue}
      if(on){const R=r*(n.kind==='pip'?2.6:2.9);ctx.drawImage(glow(col),n.x-R,n.y-R,2*R,2*R)}
      const av=!on&&avail(n);if(!on&&!av)ctx.globalAlpha*=.55;
      ctx.beginPath();ctx.arc(n.x,n.y,r,0,7);ctx.fillStyle=on?col:colors.node;ctx.fill();
      if(av){ctx.beginPath();ctx.arc(n.x,n.y,r+1.6,0,7);ctx.lineWidth=1.3;ctx.strokeStyle=col;ctx.stroke()}
      ctx.globalAlpha=fa(n);
      if(n.kind==='skill'){const s=n.sk,rk=b().sk[n.id]||0;
        if(s.max>1){for(let i=0;i<s.max;i++){const a0=-Math.PI/2+i*(2*Math.PI/s.max)+.22,a1=a0+2*Math.PI/s.max-.44;
          ctx.beginPath();ctx.arc(n.x,n.y,r+3,a0,a1);ctx.lineWidth=1.8;ctx.strokeStyle=i<rk?col:colors.edge;ctx.stroke()}}
        const g=gearOf(n);if(g){ctx.setLineDash([2,2]);ctx.beginPath();ctx.arc(n.x,n.y,r+6.5,0,7);ctx.lineWidth=1.2;ctx.strokeStyle=colors.shroud;ctx.stroke();ctx.setLineDash([])}
        if(s.nw){ctx.beginPath();ctx.arc(n.x+r*.75,n.y-r*.75,1.8,0,7);ctx.fillStyle=colors.ember;ctx.fill()}}
      if(n===sel){ctx.beginPath();ctx.arc(n.x,n.y,r+(n.kind==='skill'?9:5),0,7);ctx.lineWidth=1.5/cam.k;ctx.strokeStyle=colors.ring;ctx.stroke()}
    }
    ctx.globalAlpha=1;
    // libellés en coordonnées écran (nets à tous les zooms)
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.textAlign='center';ctx.textBaseline='top';
    const fade=Math.max(0,Math.min(1,(cam.k-.75)/.45));
    // zones, gardées dans le cadre ; puis les noms par priorité (sélection, survol, recherche, acquis), sans chevauchement
    const placed=[],free=x=>!placed.some(q=>x[0]<q[2]&&x[2]>q[0]&&x[1]<q[3]&&x[3]>q[1]);
    ctx.font='700 13px "Alegreya SC", Georgia, serif';
    for(const z of zones){const t=z.l.toUpperCase(),w=ctx.measureText(t).width;let [sx,sy]=toS(z.x,z.y);if(sx<0||sx>W||sy<0||sy>H)continue;sx=Math.max(w/2+8,Math.min(W-w/2-8,sx));sy=Math.max(4,Math.min(H-20,sy-7));
      placed.push([sx-w/2-4,sy,sx+w/2+4,sy+16]);ctx.globalAlpha=.85;ctx.fillStyle=areaCol(z.k);ctx.fillText(t,sx,sy)}
    const lab=[];
    for(const n of V){let a=0,txt='',pr=0;
      if(n.kind==='start'){if(n===hover||n===sel){a=n===sel?1:hoverAmt;txt='Étincelle';pr=3}}
      else if(n.kind==='skill'){txt=n.sk.fr;a=fade;if(n===sel||(ms&&ms.has(n))){a=1;pr=n===sel?4:2}else if(n===hover){a=Math.max(a,hoverAmt);pr=3}else if(isOn(n)){a=Math.max(a,Math.min(1,fade+.35));pr=1}}
      else if(n===hover){a=hoverAmt;txt=PIPS.find(p=>p[0]===n.attr)[1]+' +1';pr=3}
      if(!a||!txt)continue;a*=fa(n);
      const [sx,sy]=toS(n.x,n.y);if(sx<-80||sx>W+80||sy<-30||sy>H+30)continue;lab.push({n,a,txt,pr,sx,sy})}
    lab.sort((p,q)=>q.pr-p.pr);
    for(const L of lab){const bold=L.n===hover||L.n===sel;ctx.font=(bold?'700 ':'500 ')+'12px "Alegreya Sans", system-ui, sans-serif';
      const w=ctx.measureText(L.txt).width,y=L.sy+(L.n.r+5)*cam.k+3,box=[L.sx-w/2-2,y,L.sx+w/2+2,y+14];
      if(L.pr<3&&!free(box))continue;placed.push(box);ctx.globalAlpha=L.a;ctx.fillStyle=colors.label;ctx.fillText(L.txt,L.sx,y)}
    ctx.globalAlpha=1;
  }

  /* Boucle */
  function stepHover(now){
    if(hoverTarget!==hover){
      if(hoverTarget&&hover){hover=hoverTarget;dirty=true}
      else if(hoverTarget){hover=hoverTarget;hoverAmt=0}
      else{if(now-leaveT>140){hoverAmt=reduce.matches?0:Math.max(0,hoverAmt-.1);dirty=true;if(hoverAmt<=0){hover=null;hoverAmt=0}}return}
    }
    if(hover&&hoverAmt<1){hoverAmt=reduce.matches?1:Math.min(1,hoverAmt+.12);dirty=true}
  }
  function loop(now){if(!document.hidden){stepHover(now||performance.now());if(alpha>0.002&&!reduce.matches){tick();dirty=true}if(dirty&&W)draw()}requestAnimationFrame(loop)}
  requestAnimationFrame(loop);

  /* Caméra */
  function fit(filter){const ns=V.filter(n=>!filter||filter==='all'||n.area===filter);if(!ns.length||!W)return;
    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const n of ns){x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);x1=Math.max(x1,n.x);y1=Math.max(y1,n.y)}
    cam.x=(x0+x1)/2;cam.y=(y0+y1)/2;cam.k=Math.min(2.4,Math.max(.25,Math.min((W-60)/Math.max(60,x1-x0),(H-80)/Math.max(60,y1-y0))));fitted=true;dirty=true}

  /* Pointeur */
  const ptrs=new Map();let pan=null,moved=0,pinch=null;
  function hit(sx,sy){const [x,y]=toW(sx,sy);let best=null,bd=Infinity;for(const n of V){const d=Math.hypot(n.x-x,n.y-y);const lim=n.r+(n.kind==='pip'?4:6)/Math.min(1,cam.k);if(d<lim&&d<bd){bd=d;best=n}}return best}
  const pos=e=>{const r=cv.getBoundingClientRect();return [e.clientX-r.left,e.clientY-r.top]};
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);const p=pos(e);ptrs.set(e.pointerId,p);moved=0;
    if(ptrs.size===2){const [a,c]=[...ptrs.values()];pinch={d:Math.hypot(a[0]-c[0],a[1]-c[1]),k:cam.k};if(drag)release();drag=null;pan=null;return}
    if(e.button===2)return;const n=hit(...p);if(n){drag=n;cv.classList.add('grabbing')}else{pan={sx:p[0],sy:p[1],cx:cam.x,cy:cam.y};cv.classList.add('grabbing')}});
  cv.addEventListener('pointermove',e=>{const p=pos(e);
    if(ptrs.has(e.pointerId)){const old=ptrs.get(e.pointerId);moved+=Math.hypot(p[0]-old[0],p[1]-old[1]);ptrs.set(e.pointerId,p)}
    if(pinch&&ptrs.size===2){const [a,c]=[...ptrs.values()];const d=Math.hypot(a[0]-c[0],a[1]-c[1]);cam.k=Math.min(4,Math.max(.2,pinch.k*d/pinch.d));dirty=true;return}
    if(drag&&moved>3){const [x,y]=toW(...p);drag.x=x;drag.y=y;alpha=Math.max(alpha,.25);dirty=true;return}
    if(pan){cam.x=pan.cx-(p[0]-pan.sx)/cam.k;cam.y=pan.cy-(p[1]-pan.sy)/cam.k;dirty=true;return}
    let h=hit(...p);
    if(!h&&hoverTarget){const [x,y]=toW(...p);if(Math.hypot(hoverTarget.x-x,hoverTarget.y-y)<hoverTarget.r+14/Math.min(1,cam.k))h=hoverTarget}
    if(h!==hoverTarget){if(!h)leaveT=performance.now();hoverTarget=h;cv.classList.toggle('pointer',!!h)}});
  function end(e){const p=pos(e);ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;cv.classList.remove('grabbing');
    if(moved<5&&e.button!==2){const n=hit(...p);if(n){if(e.shiftKey)change(n,-1);select(n)}else{sel=null;showCard()}}
    if(drag)release();drag=null;pan=null;dirty=true}
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);pinch=null;if(drag)release();drag=null;pan=null});
  cv.addEventListener('pointerleave',()=>{if(hoverTarget){hoverTarget=null;leaveT=performance.now()}});
  cv.addEventListener('dblclick',e=>{const n=hit(...pos(e));if(n){change(n,+1);select(n)}});
  cv.addEventListener('contextmenu',e=>{e.preventDefault();const n=hit(...pos(e));if(n){change(n,-1);select(n)}});
  cv.addEventListener('wheel',e=>{e.preventDefault();const p=pos(e);const [wx,wy]=toW(...p);const k=Math.min(4,Math.max(.2,cam.k*Math.exp(-e.deltaY*.0015)));
    cam.k=k;cam.x=wx-(p[0]-W/2)/k;cam.y=wy-(p[1]-H/2)/k;dirty=true},{passive:false});

  function change(n,d){const bb=b();if(n.kind==='skill'){if(d>0){if(!addRank(bb,n.id)){showCard();return}}else remRank(bb,n.id)}else if(n.kind==='pip'){if(d>0){if(!addPipNode(bb,n)){showCard();return}}else remPipNode(bb,n)}else return;renderAll()}
  function select(n){sel=n;showCard();dirty=true}
  function lockHtml(bb,n,lock){if(!lock)return '';const pth=pathTo(bb,n);if(!pth)return '<div class="m">Aucun chemin vers ce nœud.</div>';
    const steps=pth.slice(0,-1).filter(x=>!owned(bb,x));const names=steps.map(x=>x.kind==='skill'?x.sk.fr:PIPS.find(p=>p[0]===x.attr)[1]+' +1');
    return `<div class="lockbox"><b>Verrouillé.</b> Il faut d'abord acquérir un nœud relié.${names.length?` Chemin le plus court : ${esc(names.join(' → '))}.`:''}<button class="btn sm pathb">Acheter le chemin (${pathCost(bb,pth)} pts)</button></div>`}
  function showCard(){
    if(!sel||sel.kind==='hub'){card.hidden=true;return}
    const bb=b();card.hidden=false;card.style.setProperty('--ac',areaColor(sel.area));
    if(sel.kind==='start'){const nb=[...sel.nb].filter(n=>n.kind!=='hub').map(n=>n.kind==='skill'?n.sk.fr:PIPS.find(p=>p[0]===n.attr)[1]+' +1');
      card.innerHTML=`<button class="x" aria-label="Fermer">×</button><div class="lbl">Point de départ · gratuit</div><h3>Étincelle</h3><div class="en">Spark</div><div class="d">Permet de réapparaître à l'autel de la Flamme. Ses voisins s'achètent sans autre prérequis.</div><div class="m">Relié à : ${esc(nb.join(', '))}</div>`}
    else if(sel.kind==='pip'){const P=PIPS.find(p=>p[0]===sel.attr);const v=bb.pip[sel.attr]||0;const own=!!bb.pn[sel.id];const lock=!own&&!canBuy(bb,sel);
      card.innerHTML=`<button class="x" aria-label="Fermer">×</button><div class="lbl">Nœud d'attribut · 1 point</div><h3>${P[1]} +1</h3><div class="d">${{str:'+5 % de dégâts de mêlée par point.',con:'+50 de santé par point.',end:'+10 de vigueur par point.',dex:'+5 % de dégâts à l\'arc et aux dagues par point.',int:'+5 % de dégâts magiques par point.',spi:'+20 de mana par point.'}[sel.attr]}</div>
       <div class="step"><button data-d="-1" aria-label="Retirer ce nœud" ${own?'':'disabled'}>−</button><span class="rk">${own?'acquis':lock?'verrouillé':'disponible'}</span><button data-d="1" aria-label="Acquérir ce nœud" ${own||lock?'disabled':''}>+</button></div><div class="m">${P[1]} : ${v}/${P[4]} nœuds acquis</div>${lockHtml(bb,sel,lock)}`}
    else{const s=sel.sk,v=bb.sk[s.id]||0,g=gearOf(sel);const lock=!v&&!canBuy(bb,sel);
      card.innerHTML=`<button class="x" aria-label="Fermer">×</button><div class="lbl">${AREAS.find(a=>a[0]===s.area)[1]}${s.nw?' · nouveau en 1.0':''}</div><h3>${esc(s.fr)}</h3><div class="en">${esc(s.en)}</div><div class="d">${esc(s.d)}</div>
       <div class="step"><button data-d="-1" aria-label="Retirer un rang" ${v?'':'disabled'}>−</button><span class="rk">${v}/${s.max}</span><button data-d="1" aria-label="Ajouter un rang" ${v<s.max&&!lock?'':'disabled'}>+</button><span class="ct">${s.cost} pt${s.cost>1?'s':''}${s.max>1?' / rang':''}</span></div>
       ${g?`<div class="m" style="color:var(--shroud)">+${g} rang${g>1?'s':''} apporté${g>1?'s':''} par l'équipement</div>`:''}${lockHtml(bb,sel,lock)}`}
    card.querySelector('.x').onclick=()=>{sel=null;card.hidden=true;dirty=true};
    card.querySelectorAll('[data-d]').forEach(bt=>bt.onclick=()=>change(sel,+bt.dataset.d));
    const pb=card.querySelector('.pathb');if(pb)pb.onclick=()=>{const pth=pathTo(bb,sel);if(pth){buyPath(bb,pth);renderAll()}};
  }
  $('#gFit').onclick=()=>{area='all';fit();renderSkills()};
  $('#gShake').onclick=()=>{if(reduce.matches){home();return}for(const n of V){n.x+=(Math.random()-.5)*60;n.y+=(Math.random()-.5)*60}alpha=.8;dirty=true};
  resize();fit();
  /* wake : quand le panneau Arbre apparaît (paintLayout) ou change de taille, taille recalée sans toucher au cadrage (premier cadrage si le graphe était caché au démarrage) */
  return {refresh(o){lastO=o;showCard();dirty=true},focus(a){fit(a)},resize(){resize();fit(area)},wake(){resize()},screen(n){return toS(n.x,n.y)},nodes:N,edges:E};
})();
window.G=G;

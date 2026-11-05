/* Arbre : tracé réel du jeu 1.0 (TREE, 01-tree-data.js) — 12 départs (Étincelles, gratuits), 59 nœuds d'attribut +1, 172 compétences.
   La Flamme est un nœud LOGIQUE : source du parcours, reliée aux 12 départs, jamais dessinée (un vrai nœud, Architecte aérien, occupe le centre). */
const TREE_SCALE=.25;
const TOPO=(()=>{
  const N=[],E=[],byId={},byGid={},per={};const AT={'@str':'str','@con':'con','@end':'end','@dex':'dex','@int':'int','@spi':'spi'};
  const roots=TREE.nodes.filter(n=>n[1]==='*');const cx=roots.reduce((a,n)=>a+n[2],0)/roots.length,cy=roots.reduce((a,n)=>a+n[3],0)/roots.length;
  function node(n){n.nb=new Set();n.vx=0;n.vy=0;N.push(n);byId[n.id]=n;if(n.gid)byGid[n.gid]=n;return n}
  const core=node({id:'hub:core',kind:'hub',area:'core',r:0,x:0,y:0,ax:0,ay:0});
  const list=TREE.nodes.map(([gid,key,gx,gy])=>{const x=(gx-cx)*TREE_SCALE,y=(gy-cy)*TREE_SCALE,p={gid,x,y,ax:x,ay:y};
    if(key==='*')return node({...p,id:'start:'+gid,kind:'start',area:'core',r:5.5});
    const attr=AT[key];if(attr)return node({...p,id:'pip:'+gid,kind:'pip',attr,idx:(per[attr]=(per[attr]??-1)+1),area:PIPS.find(q=>q[0]===attr)[3],r:3.4});
    const s=SKI[key];return node({...p,id:s.id,kind:'skill',sk:s,area:s.area,r:s.max>1?6:5+Math.min(4,s.cost)/1.6})});
  for(const [i,j] of TREE.links){const a=list[i],b=list[j];E.push([a,b,Math.hypot(a.x-b.x,a.y-b.y)]);a.nb.add(b);b.nb.add(a)}
  for(const n of N)if(n.kind==='start'){core.nb.add(n);n.nb.add(core)} // liaisons logiques, hors de E (non dessinées)
  return {N,E,byId,byGid,core,pips:N.filter(n=>n.kind==='pip')};
})();

/* Règle de liaison : un nœud ne s'achète que s'il touche un départ ou un nœud acquis relié à un départ */
function syncPips(b){const c={};for(const id in b.pn){const n=TOPO.byId[id];if(b.pn[id]&&n&&n.kind==='pip')c[n.attr]=(c[n.attr]||0)+1;else delete b.pn[id]}b.pip=c;return b}
function owned(b,n){if(n.kind==='hub')return true;if(n.kind==='skill')return (b.sk[n.id]||0)>0;if(n.kind==='pip')return !!b.pn[n.id];return false}
function reach(b){const seen=new Set([TOPO.core]);const st=[TOPO.core];while(st.length){const n=st.pop();for(const m of n.nb){if(seen.has(m))continue;if(m.kind==='start'||owned(b,m)){seen.add(m);st.push(m)}}}return seen}
function canBuy(b,n,R){if(owned(b,n))return true;R=R||reach(b);for(const m of n.nb)if(R.has(m))return true;return false}
function nodeCost(n){return n.kind==='skill'?n.sk.cost:n.kind==='pip'?1:0}
/* Dijkstra depuis les nœuds reliés, pondéré par le coût des nœuds non acquis ; stop(u) arrête au premier nœud extrait qui convient */
function dijkstra(b,R,stop){R=R||reach(b);const dist=new Map(),prev=new Map(),Q=[];for(const n of R){dist.set(n,0);Q.push(n)}
  while(Q.length){let bi=0;for(let i=1;i<Q.length;i++)if(dist.get(Q[i])<dist.get(Q[bi]))bi=i;const u=Q.splice(bi,1)[0];if(stop&&stop(u))return {R,dist,prev,hit:u};
    for(const v of u.nb){if(R.has(v))continue;const d=dist.get(u)+(owned(b,v)?0:nodeCost(v));if(!dist.has(v)||d<dist.get(v)){dist.set(v,d);prev.set(v,u);if(!Q.includes(v))Q.push(v)}}}
  return {R,dist,prev,hit:null}}
function trace(D,target){const path=[];let n=target;while(n&&!D.R.has(n)){path.unshift(n);n=D.prev.get(n)}return path}
function pathTo(b,target){const R=reach(b);if(R.has(target))return [];const D=dijkstra(b,R,u=>u===target);return D.hit?trace(D,target):null}
function pathCost(b,path){return path.reduce((a,n)=>a+(owned(b,n)?0:nodeCost(n)),0)}
function buyPath(b,path){for(const n of path){if(n.kind==='skill'&&!(b.sk[n.id]>0))b.sk[n.id]=1;else if(n.kind==='pip')b.pn[n.id]=1}syncPips(b)}
function prune(b){const R=reach(b);const gone=[];
  for(const id in b.sk){const n=TOPO.byId[id];if(n&&b.sk[id]>0&&!R.has(n)){gone.push(n);delete b.sk[id]}}
  for(const id in b.pn){const n=TOPO.byId[id];if(n&&!R.has(n)){gone.push(n);delete b.pn[id]}}
  syncPips(b);return gone}
/* Presets, codes importés, builds enregistrés : nœuds d'attribut complétés depuis les comptes, puis tout est relié par le chemin le moins cher */
function normalize(b){
  const bad=!b.pn||Object.keys(b.pn).some(id=>!TOPO.byId[id]||TOPO.byId[id].kind!=='pip');
  const want=bad?{...(b.pip||{})}:null;b.pn=b.pn||{};
  for(const id in b.pn)if(!TOPO.byId[id]||TOPO.byId[id].kind!=='pip'||!b.pn[id])delete b.pn[id];
  if(want)for(const a in want){let have=TOPO.pips.filter(p=>p.attr===a&&b.pn[p.id]).length;
    for(const p of TOPO.pips){if(have>=want[a])break;if(p.attr===a&&!b.pn[p.id]){b.pn[p.id]=1;have++}}}
  syncPips(b);
  for(let g=0;g<300;g++){const R=reach(b);
    const lost=TOPO.N.filter(n=>(n.kind==='skill'||n.kind==='pip')&&owned(b,n)&&!R.has(n));if(!lost.length)break;
    const D=dijkstra(b,R);let best=null;for(const n of lost)if(D.dist.has(n)&&(!best||D.dist.get(n)<D.dist.get(best)))best=n;
    if(!best)break;buyPath(b,trace(D,best))}
  return b}
/* Build d'avant le tracé réel (codes b1/b2, builds enregistrés en 1.8) : normalize, en notant ce qui a été ajouté pour relier (jamais enregistré) */
function migrate(b,from){const sk={...b.sk},pip={...(b.pip||{})},before=spentPoints(b);normalize(b);
  const addSk=Object.keys(b.sk).filter(id=>b.sk[id]>0&&!(sk[id]>0)),addPip={};for(const a in b.pip){const d=b.pip[a]-(pip[a]||0);if(d>0)addPip[a]=d}
  Object.defineProperty(b,'_mig',{value:{from,addSk,addPip,pts:spentPoints(b)-before},enumerable:false,configurable:true});return b}

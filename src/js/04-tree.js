/* Arbre : 12 groupes thématiques [zone, id, nom, attribut des nœuds +1, compétences dans l'ordre de liaison] */
const CLUSTERS=[
 ['war','tank','Rempart','con',['heavyPlates','shinyPlates','tower','warden','absorb','nemesis','earthAura','martyr','bash','shockwave','thickSkin','vigDeflect']],
 ['war','blade','Lame','str',['warriorsPath','slasher','veteran','battleHeal','swiftBlades','oneHSpec','evasionAttack','heavyHanded','breach','finesse','steadfast','purification','soulLeech']],
 ['war','barb','Barbare','str',['barbariansPath','barbarian','brute','titanEdge','bloodRage','relentless','heavyHitter','whirlwind','twoHSpec']],
 ['war','athl','Athlète','con',['athlete','crashDown','crashForce','upSlash','splashDash','wetDog','soakedDog','bloodWarrior']],
 ['rng','bow','Archer','dex',['marksman','sniper','ranger','fatalPrecision','multiShot','msSpread','msTrigger','skillShot','puncture','barrage','blessedArrows','swiftshot','bowSpec','shellShock','shrapnel','echoing','bounty','eaglesBane','counterBattery','beeSting','eagleEye']],
 ['rng','assa','Assassin','dex',['daggerMastery','backstabMastery','cutthroat','sneakAttack','daggerSpec','thrust','exposeWeak','sliceDice','venomBlades','venomMastery','quickReflex','kick','stratManeuver','silentStride','veiledVigor','vitalitySurge','survivalInst']],
 ['rng','beast','Maître des bêtes','end',['cullHerd','calmSpirit','beastMaster','vukahLang','vukahCult','primalForce','snakeEater','mithridatist']],
 ['rng','surv','Survivant','end',['runner','airborne','gracefulStride','enduranceFlame','updraft','arachnoid','wanderlust','rebound','goodMetab','sweetTooth','dessert','lastMeal','vileConcoction']],
 ['mag','wiz','Sorcier','int',['wizard','arsonist','iceman','thunder','chainHit','massDestr','quickCharge','frost','counterstrike','radiantAura','fireResistance','iceResistance','shockResistance','shroudResistance']],
 ['mag','battle','Mage de bataille','int',['mageApprentice','wandMastery','wandSpec','sting','unity','arcaneProlif','eternalSpark','wandEvasion','aerialWand','blastCast','blink','blinkAttack','emergencyBlink','arcaneDeflect','begone','sleight','spellslinger']],
 ['mag','heal','Guérisseur','spi',['healer','waterAura','watersOfLife','healingRevive','lifeBurst','righteousFire','divineSurge','sharedMisery','shroudMitigation','lifeEssences']],
 ['mag','necro','Arcaniste','spi',['manaCurrents','necromancer','exalted','arcaneConc','advNecro','totemMastery','terror','bloodletting','bloodMagic','darkArts','boneToAsh']]
];
const AREA_ANGLE={mag:-90,rng:30,war:150};

/* Topologie de l'arbre : Flamme au centre, 12 points de départ, compétences reliées en arbre.
   Reconstruction thématique : la position exacte des nœuds du jeu n'est pas publiée. */
const TOPO=(()=>{
  const N=[],E=[],byId={};const rad=d=>d*Math.PI/180;
  function node(n){n.vx=0;n.vy=0;n.nb=new Set();N.push(n);byId[n.id]=n;return n}
  function link(a,b,len){E.push([a,b,len||40]);a.nb.add(b);b.nb.add(a)}
  const core=node({id:'hub:core',kind:'hub',area:'core',label:'Flamme',r:11,x:0,y:0,ax:0,ay:0,as:.2});
  const first=['doubleJump','innerFires','merciless','powerParry','saviour'];
  const coreSk=[...first.map(id=>SKI[id]),...SK.filter(s=>s.area==='core'&&!first.includes(s.id))];
  coreSk.forEach((s,i)=>{const a=rad(i/coreSk.length*360+15),R=70+(i%2)*28;
    const n=node({id:s.id,kind:'skill',sk:s,area:'core',r:s.max>1?6:5+Math.min(3,s.cost)/2,x:Math.cos(a)*R,y:Math.sin(a)*R,ax:Math.cos(a)*R,ay:Math.sin(a)*R,as:.01});
    link(i<5?core:byId[coreSk[i-5].id],n,34)});
  const pipIdx={str:0,con:0,dex:0,end:0,int:0,spi:0};
  const perArea={};CLUSTERS.forEach(c=>(perArea[c[0]]=perArea[c[0]]||[]).push(c));
  const share={};CLUSTERS.forEach(c=>{const tot=PIPS.find(p=>p[0]===c[3])[4];const same=CLUSTERS.filter(x=>x[3]===c[3]);share[c[1]]=same[0]===c?Math.ceil(tot/2):Math.floor(tot/2)});
  for(const ar in perArea){perArea[ar].forEach((c,ci)=>{
    const ang=rad(AREA_ANGLE[ar]+[-42,-14,14,42][ci]);const cx=Math.cos(ang),cy=Math.sin(ang);
    const P=share[c[1]],onPath=Math.min(2,P);
    let prev=core;
    for(let j=0;j<onPath;j++){const R=125+j*45;const idx=pipIdx[c[3]]++;
      const n=node({id:`pip:${c[3]}:${idx}`,kind:'pip',attr:c[3],idx,area:ar,cl:c[1],r:3.4,x:cx*R,y:cy*R});link(prev,n,26);prev=n}
    const sR=225;const st=node({id:'start:'+c[1],kind:'start',area:ar,label:c[2],r:8,x:cx*sR,y:cy*sR,ax:cx*sR,ay:cy*sR,as:.03,cl:c[1]});link(prev,st,28);
    const ccx=cx*360,ccy=cy*360;const list=c[4].map(id=>SKI[id]).filter(Boolean);
    list.forEach((s,i)=>{const a=ang+(i-(list.length-1)/2)*0.06,R=290+((i*53)%120);
      const n=node({id:s.id,kind:'skill',sk:s,area:ar,cl:c[1],r:s.max>1?6.5:5+Math.min(4,s.cost)/1.6,x:Math.cos(a)*R,y:Math.sin(a)*R,ax:ccx,ay:ccy,as:.006});
      link(i===0?st:byId[list[Math.floor((i-1)/2)].id],n,38)});
    // attributs restants : petites branches accrochées aux compétences du groupe
    for(let j=onPath;j<P;j++){const par=byId[list[(1+(j-onPath)*3)%list.length].id];const idx=pipIdx[c[3]]++;
      const n=node({id:`pip:${c[3]}:${idx}`,kind:'pip',attr:c[3],idx,area:ar,cl:c[1],r:3.4,x:par.x+8,y:par.y+8});link(par,n,22)}
  });
    const cs=perArea[ar];for(let i=0;i<cs.length-1;i++){const A=cs[i][4],Bc=cs[i+1][4];link(byId[A[A.length-1]],byId[Bc[Math.min(2,Bc.length-1)]],60)}
  }
  link(byId[perArea.mag[3][4][4]],byId[perArea.rng[0][4][6]],90);
  link(byId[perArea.rng[3][4][7]],byId[perArea.war[0][4][7]],90);
  link(byId[perArea.war[3][4][5]],byId[perArea.mag[0][4][9]],90);
  return {N,E,byId,core,pips:N.filter(n=>n.kind==='pip')};
})();

/* Règle de liaison : un nœud ne s'achète que s'il touche un nœud acquis relié à la Flamme */
function syncPips(b){const c={};for(const id in b.pn){const n=TOPO.byId[id];if(b.pn[id]&&n)c[n.attr]=(c[n.attr]||0)+1;else delete b.pn[id]}b.pip=c;return b}
function owned(b,n){if(n.kind==='hub')return true;if(n.kind==='skill')return (b.sk[n.id]||0)>0;if(n.kind==='pip')return !!b.pn[n.id];return false}
function reach(b){const seen=new Set([TOPO.core]);const st=[TOPO.core];while(st.length){const n=st.pop();for(const m of n.nb){if(seen.has(m))continue;if(m.kind==='start'||owned(b,m)){seen.add(m);st.push(m)}}}return seen}
function canBuy(b,n,R){if(owned(b,n))return true;R=R||reach(b);for(const m of n.nb)if(R.has(m))return true;return false}
function nodeCost(n){return n.kind==='skill'?n.sk.cost:n.kind==='pip'?1:0}
function pathTo(b,target){
  const R=reach(b);if(R.has(target))return [];
  const dist=new Map(),prev=new Map(),Q=[];for(const n of R){dist.set(n,0);Q.push(n)}
  while(Q.length){let bi=0;for(let i=1;i<Q.length;i++)if(dist.get(Q[i])<dist.get(Q[bi]))bi=i;const u=Q.splice(bi,1)[0];if(u===target)break;
    for(const v of u.nb){if(R.has(v))continue;const d=dist.get(u)+(owned(b,v)?0:nodeCost(v));if(!dist.has(v)||d<dist.get(v)){dist.set(v,d);prev.set(v,u);if(!Q.includes(v))Q.push(v)}}}
  if(!dist.has(target))return null;const path=[];let n=target;while(n&&!R.has(n)){path.unshift(n);n=prev.get(n)}return path}
function pathCost(b,path){return path.reduce((a,n)=>a+(owned(b,n)?0:nodeCost(n)),0)}
function buyPath(b,path){for(const n of path){if(n.kind==='skill'&&!(b.sk[n.id]>0))b.sk[n.id]=1;else if(n.kind==='pip')b.pn[n.id]=1}syncPips(b)}
function prune(b){const R=reach(b);const gone=[];
  for(const id in b.sk){const n=TOPO.byId[id];if(n&&b.sk[id]>0&&!R.has(n)){gone.push(n);delete b.sk[id]}}
  for(const id in b.pn){const n=TOPO.byId[id];if(n&&!R.has(n)){gone.push(n);delete b.pn[id]}}
  syncPips(b);return gone}
function normalize(b){
  if(!b.pn){b.pn={};for(const a in (b.pip||{})){TOPO.pips.filter(p=>p.attr===a).sort((x,y)=>x.idx-y.idx).slice(0,b.pip[a]).forEach(p=>b.pn[p.id]=1)}}
  syncPips(b);
  for(let g=0;g<300;g++){const R=reach(b);
    const lost=TOPO.N.filter(n=>(n.kind==='skill'||n.kind==='pip')&&owned(b,n)&&!R.has(n));if(!lost.length)break;
    let best=null;for(const n of lost){const pth=pathTo(b,n);if(pth&&(!best||pathCost(b,pth)<pathCost(b,best)))best=pth}
    if(!best)break;buyPath(b,best)}
  return b}

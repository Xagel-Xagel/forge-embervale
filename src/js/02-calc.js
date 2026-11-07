/* =========================== CALCUL =========================== */
/* Build : arbre (sk rangs, pn nœuds d'attribut acquis, pip comptes), réglages (niveau, exploration, Flamme), gemmes, objectifs (obj : [principal, secondaire, soutien]),
   ad : vos ajouts avec objectif (2.3.0 : {sk rangs, pn nœuds}, le combo est recalculé avec eux, 06-objectifs.js).
   gear et upg : champs INERTES (2.0.0) — l'équipement n'est plus pris en compte, mais un ancien lien qui en porte le garde, pour le réécrire à l'identique (03-share.js). */
function blankBuild(name){return {name:name||'Nouveau build',gear:{},gem:{},sk:{},pip:{},pn:{},lvl:50,exp:114,flame:11,upg:5,tv:1,obj:[],ad:{sk:{},pn:{}}}} // tv : build fait sur le tracé réel (1.9.0+)
function spentPoints(b){let t=0;for(const id in b.sk){const s=SKI[id];if(s)t+=s.cost*Math.min(b.sk[id],s.max)}for(const k in b.pip)t+=b.pip[k]||0;return t}
function budget(b){return 2*(Math.max(1,Math.min(50,b.lvl))-1)+Math.max(0,Math.min(114,b.exp))}
function levelNeeded(b){const need=spentPoints(b)-Math.max(0,Math.min(114,b.exp));return need<=0?1:Math.ceil(need/2)+1}
/* Nœuds « +1 attribut tous les 2 niveaux de Flamme » (fichiers du jeu) */
const FLAME_NODES=[['barbarian','str'],['thickSkin','con'],['enduranceFlame','end'],['gracefulStride','dex'],['exalted','int'],['arcaneConc','spi']];
/* Attributs (nœuds + Flamme + Rôdeur), santé, mana et vigueur de base : sans équipement ni gemme (formules : docs/FORMULAS.md) */
function compute(b){
  const R=id=>Math.min(b.sk[id]||0,(SKI[id]||{max:0}).max);
  const half=Math.floor(Math.max(1,Math.min(11,b.flame))/2),A={};
  for(const [k] of PIPS)A[k]=b.pip[k]||0;
  for(const [id,k] of FLAME_NODES)if(R(id))A[k]+=half;
  A.end+=R('ranger');A.dex+=R('ranger');
  return {attr:A,R,hp:100+50*A.con+3*A.str*R('athlete')+3*A.dex*R('veiledVigor')+3*A.int*R('lifeEssences'),mana:100+20*A.spi,sta:100+10*A.end};
}

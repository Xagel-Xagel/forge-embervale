/* =========================== CALCUL =========================== */
function blankBuild(name){return {name:name||'Nouveau build',gear:{},gem:{},sk:{},pip:{},pn:{},lvl:50,exp:114,flame:11,upg:5}}
function fromPreset(p){const b=blankBuild(p.name);b.gear={...p.gear};b.gem={...(p.gem||{})};b.sk={...p.sk};b.pip={...p.pip};delete b.pn;return normalize(b)}
function spentPoints(b){let t=0;for(const id in b.sk){const s=SKI[id];if(s)t+=s.cost*Math.min(b.sk[id],s.max)}for(const k in b.pip)t+=b.pip[k]||0;return t}
function budget(b){return 2*(Math.max(1,Math.min(50,b.lvl))-1)+Math.max(0,Math.min(114,b.exp))}
function levelNeeded(b){const need=spentPoints(b)-Math.max(0,Math.min(114,b.exp));return need<=0?1:Math.ceil(need/2)+1}
function unlocked(item,upg){return item.perks?item.perks.slice(0,upg):[]}

function compute(b){
  const s={};const add=(k,v)=>{s[k]=(s[k]||0)+v};
  const gearRk={};
  for(const [slot] of SLOTS){const it=ITEMS[b.gear[slot]];if(!it||it.kind==='weapon')continue;
    for(const k in it.base)add(k,it.base[k]);
    for(const p of unlocked(it,b.upg)){if(p[0]==='s')add(p[1],p[2]);else if(p[0]==='k')gearRk[p[1]]=(gearRk[p[1]]||0)+p[2];else if(p[0]==='a')add('armShare_'+p[1],3)}}
  const R=id=>(Math.min(b.sk[id]||0,(SKI[id]||{max:0}).max))+(gearRk[id]||0);
  const half=Math.floor(Math.max(1,Math.min(11,b.flame))/2);
  const A={str:(b.pip.str||0)+(R('barbarian')?half:0),con:(b.pip.con||0)+(R('thickSkin')?half:0),end:(b.pip.end||0)+(R('enduranceFlame')?half:0)+R('ranger'),
    dex:(b.pip.dex||0)+(R('gracefulStride')?half:0)+R('ranger'),int:(b.pip.int||0)+(R('exalted')?half:0),spi:(b.pip.spi||0)+(R('arcaneConc')?half:0)};
  const o={attr:A,raw:s,gearRk};
  o.hp=100+50*A.con+(s.hp||0)+3*A.str*R('athlete')+3*A.dex*R('veiledVigor')+3*A.int*R('lifeEssences');
  o.mana=100+20*A.spi+(s.mana||0);
  o.sta=100+10*A.end+(s.sta||0);
  o.hpReg=s.hpReg||0;o.manaReg=(s.manaReg||0)+5*R('manaCurrents');o.staReg=s.staReg||0;o.staRegPct=10*R('rebound');
  o.armPhys=4*R('heavyPlates');o.armMag=4*R('shinyPlates');
  o.resFire=(s.resFire||0)+5*R('fireResistance');o.resIce=(s.resIce||0)+5*R('iceResistance');o.resShock=(s.resShock||0)+5*R('shockResistance');
  o.resShroud=(s.resShroud||0)+5*R('shroudResistance');o.resPoison=(s.resPoison||0)+4*R('snakeEater');o.frost=s.frost||0;
  o.block=s.block||0;o.parry=10*R('powerParry');
  o.critC=10+(s.critC||0)+5*R('fatalPrecision');o.critD=80+(s.critD||0)+R('fatalPrecision');
  o.merciless=500+40*R('opportunity')+(s.merciless||0);o.backstab=(s.backstab||0)+20*R('backstabMastery');o.sneak=900+100*R('cutthroat');
  o.healing=(s.healing||0)+15*R('healer');o.shroudTime=(s.shroudTime||0)+60*R('innerFires');o.sprint=(s.sprint||0)+5*R('runner');
  o.sneakSpeed=s.sneakSpeed||0;o.revive=(s.revive||0)-R('saviour');o.reviveHeal=10+(s.reviveHeal||0)+8*R('healingRevive');
  o.charge=-10*R('quickCharge');o.hpLeech=s.hpLeech||0;o.hpLeechP=s.hpLeechP||0;o.manaLeech=s.manaLeech||0;o.manaLeechP=s.manaLeechP||0;o.staLeech=s.staLeech||0;
  o.vs={vsMelee:s.vsMelee||0,vsRanged:(s.vsRanged||0)+8*R('counterBattery'),vsMagic:s.vsMagic||0,vsFell:s.vsFell||0,hollow:5*R('boneToAsh'),flying:10*R('eaglesBane')};
  o.weapons=['w1','w2'].map(sl=>{const w=ITEMS[b.gear[sl]];if(!w)return null;const r=weaponCalc(w,o,s,R,A);r.gem=GEMI[(b.gem||{})[sl]]||null;return r});
  o.R=R;
  return o;
}
function weaponCalc(w,o,s,R,A){
  const [catName,fam,hands]=CAT[w.cat];const parts=[];const P=(n,v)=>{if(v)parts.push([n,v])};
  if(fam==='melee')P('Force × 5 %',A.str*5);
  if(fam==='dagger'||fam==='bow')P('Dextérité × 5 %',A.dex*5);
  if(fam==='wand'||fam==='staff')P('Intelligence × 5 %',A.int*5);
  const skW={sw1:'warriorsPath',ax1:'warriorsPath',cl1:'warriorsPath',gs:'titanEdge',ax2:'barbariansPath',hm2:'barbariansPath',cl2:'barbariansPath',bow:'marksman',dag:'daggerMastery'}[w.cat];
  if(skW)P(SKI[skW].fr,5*R(skW));
  if(fam==='wand'||fam==='staff')P(SKI.mageApprentice.fr,5*R('mageApprentice'));
  if(fam==='wand')P(SKI.wandMastery.fr,5*R('wandMastery'));
  if(fam==='staff')P(SKI.spellslinger.fr,5*R('spellslinger'));
  const melee=fam==='melee'||fam==='dagger';
  if(melee&&w.type==='cut')P(SKI.slasher.fr,10*R('slasher'));
  if(melee&&w.type==='blunt')P(SKI.brute.fr,10*R('brute'));
  if(melee&&w.type==='pierce')P(SKI.thrust.fr,10*R('thrust'));
  if(fam==='bow'&&w.type==='pierce')P(SKI.puncture.fr,10*R('puncture'));
  const el={fire:'arsonist',ice:'iceman',shock:'thunder',shroud:'darkArts'}[w.type];
  if(el)P(SKI[el].fr,10*R(el));
  if(melee)P('Équip. : dégâts de mêlée',s.dmgMelee||0);
  if(hands===2)P('Équip. : mêlée deux mains',s.dmg2H||0);
  if(fam==='bow')P('Équip. : dégâts à distance',s.dmgRanged||0);
  if(fam==='staff')P('Équip. : dégâts des bâtons',s.dmgStaff||0);
  if(fam==='dagger')P('Équip. : dégâts des dagues',s.dmgDagger||0);
  if(w.type==='blunt')P('Équip. : tous dégâts contondants',s.bluntAll||0);
  const em={fire:'fireMagic',ice:'iceMagic',shock:'shockMagic',shroud:'shroudMagic'}[w.type];
  if(em)P('Équip. : '+ST[em][0].toLowerCase(),s[em]||0);
  const bonus=parts.reduce((a,p)=>a+p[1],0);
  let cc=o.critC;const cparts=[['Base',10]];if(s.critC)cparts.push(['Équip. : critique',s.critC]);if(R('fatalPrecision'))cparts.push([SKI.fatalPrecision.fr,5*R('fatalPrecision')]);
  if(melee){cc+=(s.critCMelee||0)+2*R('veteran');if(s.critCMelee)cparts.push(['Équip. : critique mêlée',s.critCMelee]);if(R('veteran'))cparts.push([SKI.veteran.fr,2*R('veteran')])}
  if(fam==='bow'){cc+=(s.critCRanged||0)+2*R('sniper');if(s.critCRanged)cparts.push(['Équip. : critique à distance',s.critCRanged]);if(R('sniper'))cparts.push([SKI.sniper.fr,2*R('sniper')])}
  if(fam==='wand'||fam==='staff'){cc+=(s.critCMagic||0)+2*R('wizard');if(s.critCMagic)cparts.push(['Équip. : critique magique',s.critCMagic]);if(R('wizard'))cparts.push([SKI.wizard.fr,2*R('wizard')])}
  cc=Math.min(100,cc);
  const hit=w.val*(1+bonus/100);const avg=hit*(1+cc/100*o.critD/100);
  return {w,catName,unit:(fam==='bow'||fam==='staff')?'Puissance':'Dégâts',bonus,parts,cc,cparts,hit,avg};
}

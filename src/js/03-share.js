/* Partage : code compact, uniquement lettres, chiffres et tirets.
   TABLES FIGÉES : la place de chaque objet, gemme, compétence et nœud y est définitive (c'est elle que les codes enregistrent).
   Ne jamais réordonner ni supprimer ; ajouter EN FIN seulement (tests/share.test.js vérifie inclusion, doublons et empreintes).
   items, gems : ordre de la 1.8.0 (b1, b2, b3) · sk : ordre de SK en 1.8.0 (b1, b2) · b1 : attributs et maxima du format b1 ·
   b2 : attribut de chacun des 59 nœuds de l'ancien tracé thématique (c CON, s FOR, d DEX, e END, i INT, p ESP) ·
   at, nd : identifiants de jeu (base 36) des nœuds d'attribut et des compétences du tracé réel (b3) ·
   slots : emplacements d'équipement (2.0.0 : l'équipement n'est plus pris en compte, mais celui d'un ancien lien est relu et réécrit tel quel) ·
   goals : objectifs (06-objectifs.js), segment -o du b3 (2.0.0) ; objectifs de soutien SUPS ajoutés en fin (2.1.0). */
const FZ={
 items:`
  emb_h emb_c emb_g emb_l emb_f cre_h cre_c cre_g cre_l cre_f ash_h ash_c ash_g ash_l ash_f sky_h sky_c sky_g sky_l sky_f fla_h fla_c fla_g fla_l fla_f
  lif_h lif_c lif_g lif_l lif_f ven_h ven_c ven_g ven_l ven_f rg_am rg_as rg_ah rg_um rg_us rg_uh rg_anc rg_mf rg_eth rg_ths rg_heir rg_frost rg_cmd
  rg_gem w_aurora w_wailing w_fang w_apex w_dragsw w_graven w_skull w_lfaxe w_jez w_dimh w_meat w_flesh w_adorned w_oath w_horn w_lfdag w_valor w_gotn
  w_spiked w_darkwood w_boreal w_thunderb w_warhero w_ram w_aero w_goat w_rot w_chief w_star w_sunh w_drak w_tomb w_rattle w_temple w_talion w_winged
  w_ignited w_bloodflow w_ancdrak w_totem w_mythic w_polymath w_moor w_violet w_storm w_oracle w_reeds w_guidance w_apprentice w_frostw w_twisting
  w_deceiving w_mirage`.trim().split(/\s+/),
 gems:`
  g_bleed g_burn g_punct g_skulls g_retal g_swift g_toxic g_fract g_embers g_lnecro g_overp g_storm g_agil g_mania g_corrupt g_reap g_light g_blust
  g_necro g_meteor g_cold g_curr g_gnecro g_aero g_lyc g_cleanse g_destiny g_armor g_hyper`.trim().split(/\s+/),
 sk:`
  wellRested mason lumberjack miner qualityGear merciless doubleJump powerParry innerFires snap saviour opportunity giantHook groundHook fisherman
  pickSpec fellSpec prospector airborneArch evasionAttack barbarian warriorsPath shinyPlates heavyPlates slasher brute heavyHanded breach veteran
  crashForce tower warden absorb bloodRage soulLeech battleHeal relentless crashDown bloodWarrior purification vigDeflect martyr nemesis shockwave
  swiftBlades heavyHitter bash earthAura splashDash thickSkin finesse steadfast upSlash titanEdge whirlwind wetDog soakedDog twoHSpec oneHSpec athlete
  barbariansPath sneakAttack airborne marksman calmSpirit snakeEater runner counterBattery vukahLang updraft beastMaster goodMetab vukahCult ranger
  mithridatist bounty sniper shrapnel echoing blessedArrows thrust backstabMastery sweetTooth vitalitySurge eaglesBane silentStride skillShot swiftshot
  arachnoid wanderlust beeSting multiShot shellShock enduranceFlame gracefulStride eagleEye dessert msSpread msTrigger daggerMastery sliceDice
  venomBlades venomMastery quickReflex kick lastMeal exposeWeak stratManeuver cutthroat rebound cullHerd primalForce vileConcoction fatalPrecision
  bowSpec daggerSpec veiledVigor puncture barrage survivalInst healingRevive watersOfLife mageApprentice arsonist darkArts iceman frost quickCharge
  blinkAttack emergencyBlink counterstrike arcaneConc wizard chainHit massDestr bloodMagic necromancer terror bloodletting lifeBurst blink
  shroudMitigation healer sting exalted arcaneProlif arcaneDeflect thunder begone waterAura radiantAura unity eternalSpark lifeEssences shroudResistance
  fireResistance iceResistance shockResistance righteousFire divineSurge sharedMisery boneToAsh sleight manaCurrents spellslinger wandMastery wandSpec
  wandEvasion aerialWand totemMastery advNecro blastCast`.trim().split(/\s+/),
 slots:'head chest hands legs feet w1 w2 r1 r2'.split(' '),
 goals:'tank sword barb archer assassin mageCrit fire ice storm necro healer paladin survie vigueur resist mana'.split(' '),
 b1:[['str',11],['con',11],['end',8],['dex',7],['int',11],['spi',11]],
 b2:'ccccccssssssssssscccccdddddddeeeeeeeeiiiiiiiiiiippppppppppp',
 at:`
  ml34if utqucn j06qca 1gd62en 1m76abp 18u6geg 1tu4p7b 1y3twab 1skigoj evm0y8 35p3tb 27th6o 1rkw3ke ipgty9 8qaa6k an50g0 1f1pjpd 9y2o4y axd60g 1ob651f
  1aeg1z2 1qjlln9 hmo27n rlvqsi hud4q8 136hjok 169ma3d 3xe09e 1auaxjn 1chqkna lpzki3 11qot5x 18okx3b nvsfkg 180qgme 10y05bu 1oe64l7 101011r 16sd25b
  7tyb4s 13cdgsq u3ewct a3gm4i beub9v 110miev fj7jpn 1rv6bfd 1lm4k0r itley 1th8yhf b7lnsa oal925 1wwtpca 9vl5y4 q9awwi 14rs954 s8qir2 14r1h78 1xv3exe`.trim().split(/\s+/),
 nd:`
  19y36em da0c3h z089j0 1ewibyn mdpkqa 1hb1ez5 1yzh0sg 109wojd 4tr9yh 1g6zvs4 1ogbtgq jsgcxy hipz1 1h0ur88 1fph9t1 1xdxwxg 1a65x9z 4s7hws izu0gt rl16a8
  1ynrmek 16ja5lo 1jzmk3w gxeq9v 1fy9dg8 19i51ta 1ygy0le 13qb3xb 1of9yqe 3cn6s8 sw2nvg 1s26jcz 1n53avj t254n4 3n3tqn 1sronk4 1qxe01l 15mtoaz 10g7bqz
  10moz14 ylh8gl 1ut6fbp 12srlh1 2sbu3i 15hbit0 1juwg75 1j6uczh 1ktbgnc 1injhfp c1p2qd eyqc2w 1tmjg6h 1gfx53a 1565ivj 1ks86mu glp9jc 1uji3fo 1yitmfo
  1c0vzat 1vbuqpq jes7bh a12wr7 86k6y9 e66ttu t9kkhc 3ugj1b elppc3 3qkrnh 11n2ojy 1f33rnw ta0kh0 tfq3h0 jeglwy 8mcwu2 n1n5bg 1k2v1x8 nuyocx 19lt0bv
  8s26gi 8zlkgm 15gb7w0 lowr1t vf78se 2a31ld xzgp8l 4uxo7j piamng k7nxux 1whhxd2 185nxd5 1kde2mp 1gkvg5u glpsf9 hs16sa kvxw2u hzfh6u 2d1au3 1em9mqe
  1e9ybhf cqjrfc 1d35nri wu8i2f 16cxiqp 1ew0ju0 1rch5vz 1dl5h9b 1gkijf6 1g1nwpv q8v9m6 ztvqfo 16qgqx5 6sqpfi i1hyk4 1dpfv28 q0u520 1eiyl53 hw8hbp
  1mf44h6 5par6k ml76k0 1bl0b35 zltk3l 1gdh4r8 tey402 1yfwowq 1os1eqn bsfaqh zk6n1x 1vrzb19 1315vv2 1hmcbp1 14p4kzj gqmdnu mohczi 1xlinps 1mcpl0f
  15cihy1 1byygq7 1ek8p7b 1hgsn84 1hmu8dw pyd2q9 1bkypfb 1s0azsy 1q8iok1 c7q10k i9vxre 1qwc5ez 1kdlcfr ng4q58 tzr2f7 1siolwc 94s27p wr8oai 1hl02q5
  1iuklxw 10ec75t kwbal8 i7jz5k wilj5z 1f5bfp0 na1jpb 2vxs21 1aqtdn2 6qzqmz eyx7bo k0p2ws 17jfx5l zal1ri 8c6srr tguby2 12zegsf`.trim().split(/\s+/)
};
const B2A={c:'con',s:'str',d:'dex',e:'end',i:'int',p:'spi'};
const b36=n=>n.toString(36).padStart(2,'0');
const big36=s=>{let v=0n;for(const ch of s)v=v*36n+BigInt(parseInt(ch,36));return v};
const bitsOf=v=>{const o=[];for(let i=0;v>0n;i++,v>>=1n)if(v&1n)o.push(i);return o};
/* b3-<en-tête>-<équipement>-<masque des nœuds d'attribut>-<masque des compétences>-<rangs : 1 chiffre par compétence possédée, ou 0>[-g<gemmes>][-o<objectifs>]-<contrôle>
   objectifs (2.0.0) : 2 caractères par objectif (principal, secondaire ; zz = aucun), places dans FZ.goals ; absent = arbre libre ;
   2.1.0 : 2 caractères de plus pour le soutien, seulement s'il y en a un (sans soutien, le code reste celui de la 2.0.0)
   contrôle = 2 caractères (FNV-1a du reste, modulo 36²) : un lien tronqué ou abîmé est refusé au lieu de donner un autre build */
function b3sum(s){let h=0x811c9dc5;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,0x01000193)>>>0}return b36(h%1296)}
function encode(b){
  const head=[b.lvl,b.exp,b.flame,b.upg].map(b36).join('');
  const it=FZ.slots.map(sl=>{const i=FZ.items.indexOf(b.gear[sl]);return i<0?'zz':b36(i)}).join('');
  let at=0n,nd=0n;const rk=[];
  FZ.at.forEach((g,i)=>{const n=TOPO.byGid[g];if(n&&b.pn&&b.pn[n.id])at|=1n<<BigInt(i)});
  FZ.nd.forEach((g,i)=>{const n=TOPO.byGid[g];const v=n&&n.kind==='skill'?Math.min(b.sk[n.id]||0,n.sk.max):0;if(v>0){nd|=1n<<BigInt(i);rk.push(v.toString(36))}});
  const gm=['w1','w2'].map(sl=>{const i=FZ.gems.indexOf((b.gem||{})[sl]);return i<0?'zz':b36(i)}).join('');
  const ob=(b.obj||[])[0]&&FZ.goals.includes(b.obj[0])?(FZ.goals.includes(b.obj[2])?[0,1,2]:[0,1]).map(i=>{const k=FZ.goals.indexOf(b.obj[i]);return k<0?'zz':b36(k)}).join(''):'';
  const s='b3-'+head+'-'+it+'-'+at.toString(36)+'-'+nd.toString(36)+'-'+(rk.join('')||'0')+(gm!=='zzzz'?'-g'+gm:'')+(ob?'-o'+ob:'');return s+'-'+b3sum(s);
}
/* Code illisible, tronqué ou corrompu → null (jamais d'exception : la page doit toujours démarrer) */
function decode(code){try{const b=decodeCode(code);return b&&fitGoals(b)}catch(e){return null}} // fitGoals : 06-objectifs.js
function decodeCode(code){
  const s=String(code).trim().replace(/^#/,'').toLowerCase();if(s.length>3000)return null;let m;
  if((m=s.match(/^b3-([0-9a-z]{8})-([0-9a-z]{18})-([0-9a-z]+)-([0-9a-z]+)-([0-9a-z]+)(?:-g([0-9a-z]{4}))?(?:-o([0-9a-z]{4}(?:[0-9a-z]{2})?))?-([0-9a-z]{2})$/))){
    if(b3sum(s.slice(0,-3))!==m[8])return null;
    const b=baseOf(m[1],m[2],m[6]);let gone=0;
    for(const i of bitsOf(big36(m[3]))){const n=TOPO.byGid[FZ.at[i]];if(n&&n.kind==='pip')b.pn[n.id]=1;else gone++}
    // un chiffre de rang par bit posé, même hors table (code d'une version plus récente) : un écart signale un lien tronqué
    const bits=bitsOf(big36(m[4])),rk=m[5];if(bits.length?rk.length!==bits.length:rk!=='0')return null;
    for(let k=0;k<bits.length;k++){const v=parseInt(rk[k],36);if(!v)return null;const n=TOPO.byGid[FZ.nd[bits[k]]];if(n&&n.kind==='skill')b.sk[n.id]=Math.min(v,n.sk.max);else gone++}
    if(m[7]){if(m[7].startsWith('zz')||m[7].endsWith('zz')&&m[7].length===6)return null;b.obj=m[7].match(/../g).map(x=>x==='zz'?null:FZ.goals[parseInt(x,36)]||'?'+x)} // ?xx : objectif inconnu (version plus récente), signalé par fitGoals
    syncPips(b);const R=reach(b);
    // tracé régénéré depuis (nœud disparu ou liaison changée) : migrer et le dire, sinon décodage exact
    if(!gone&&!TOPO.N.some(n=>owned(b,n)&&!R.has(n)))return normalize(b);
    migrate(b,'b3');b._mig.gone=gone;return b}
  // b1 et b2 : codes d'avant le tracé réel → comptes par attribut, puis migration (normalize relie au tracé réel)
  if(!(m=s.match(/^(b[12])-([0-9a-z]{8})-([0-9a-z]{18})-([0-9a-z]+)-([0-9a-z]+)(?:-g([0-9a-z]{4}))?$/)))return null;
  const b=baseOf(m[2],m[3],m[6]);delete b.pn;
  if(m[1]==='b2'){for(const i of bitsOf(big36(m[4]))){const a=B2A[FZ.b2[i]];if(a)b.pip[a]=(b.pip[a]||0)+1}}
  else{if(m[4].length!==6)return null;m[4].split('').forEach((c,i)=>{const v=parseInt(c,36);if(v)b.pip[FZ.b1[i][0]]=Math.min(v,FZ.b1[i][1])})}
  m[5].split('').forEach((c,i)=>{const v=parseInt(c,36),k=SKI[FZ.sk[i]];if(v&&k)b.sk[k.id]=Math.min(v,k.max)});
  return migrate(b,m[1]);
}
function baseOf(h,it,gm){const b=blankBuild('Build partagé');const v=h.match(/../g).map(x=>parseInt(x,36));
  b.lvl=Math.max(1,Math.min(50,v[0]));b.exp=Math.max(0,Math.min(114,v[1]));b.flame=Math.max(1,Math.min(11,v[2]));b.upg=Math.max(0,Math.min(5,v[3]));
  it.match(/../g).forEach((x,i)=>{if(x!=='zz'){const id=FZ.items[parseInt(x,36)];if(id)b.gear[FZ.slots[i]]=id}}); // inerte : relu pour être réécrit à l'identique
  if(gm)gm.match(/../g).forEach((x,i)=>{if(x!=='zz'){const id=FZ.gems[parseInt(x,36)];if(GEMI[id])b.gem[['w1','w2'][i]]=id}});
  return b}

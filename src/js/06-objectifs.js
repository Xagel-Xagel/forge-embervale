/* =========================== OBJECTIFS (2.0.0) =========================== */
/* Objectifs prêts : chacun reprend TELLES QUELLES les compétences, les rangs et les attributs d'un build prédéfini des versions 1.x (presets, 01-data.js
   jusqu'à la 1.19.0 ; Tank = « Sadi Fourbe »), rangés en étapes. L'ORDRE DES ÉTAPES ET LEURS RAISONS SONT DES CHOIX DU SIMULATEUR (hypothèse),
   pas un guide officiel ; les effets cités viennent des descriptions des compétences (SK, fichiers du jeu 1.0).
   {id (place figée : FZ.goals), n nom, grp groupe du menu, area couleur, gem gemmes posées, steps : [titre, raison, {compétence: rang | attribut: nœuds}]} */
const GOAL_GRP=[['war','Guerrier'],['rng','Rôdeur'],['mag','Mage'],['sup','Soins']];
const GOALS=[
 {id:'tank',n:"Tank (d'après Sadi Fourbe)",grp:'war',area:'war',gem:{w1:'g_armor',w2:'g_reap'},steps:[
  ['Attirer les coups',"Némésis attire l'attention des ennemis : c'est vous qu'ils frappent, pas le groupe.",{nemesis:3}],
  ['Encaisser',"Constitution (+50 de santé par point), plaques (armure des objets), Tour (+10 % de résistance physique) et Gardien (+10 % de résistance magique) face à 3 ennemis ou plus à 20 m.",{con:11,heavyPlates:3,shinyPlates:3,tower:1,warden:1}],
  ['Blesser sans frapper',"Aura radieuse brûle les Déchus proches, Contre-coup renvoie parfois des dégâts en feu, Givre ralentit les attaquants de mêlée ; Pyromane : +10 % de dégâts de feu par rang.",{radiantAura:3,counterstrike:3,frost:3,arsonist:3}],
  ['Se soigner',"Aura d'eau et Eaux de vie soignent selon l'Intelligence, Guérisseur : +15 % de soins par rang ; Essences de vie et Exalté ajoutent santé et Intelligence.",{waterAura:3,watersOfLife:1,healer:3,int:11,exalted:1,lifeEssences:3}],
  ['Parer',"Parade puissante, Déviations (vigueur, mana), Coup de choc et Onde de choc : chaque parade rapporte.",{powerParry:3,vigDeflect:3,arcaneDeflect:3,bash:3,shockwave:1}],
  ['Tenir',"Aura de terre (+10 % de résistances au groupe), Absorption, mana, résistance au feu, Peau épaisse et Double saut.",{earthAura:3,absorb:3,manaCurrents:3,spi:6,fireResistance:3,thickSkin:1,doubleJump:1}]]},
 {id:'sword',n:'Épée et bouclier',grp:'war',area:'war',gem:{w1:'g_blust',w2:'g_swift'},steps:[
  ['Dégâts à une main',"Voie du guerrier (+5 % par rang), Taillade (+10 % de dégâts tranchants par rang) et Force (+5 % de dégâts de mêlée par point).",{warriorsPath:3,slasher:3,str:11}],
  ['Critiques qui soignent',"Vétéran (+2 % de critique en mêlée par rang) ; Soin de bataille rend 1 % de santé max par rang à chaque critique.",{veteran:3,battleHeal:3}],
  ['Parer et punir',"Parade puissante, puis Attaque impitoyable (500 % sur un ennemi déséquilibré), Opportunité et Brèche.",{powerParry:3,merciless:1,opportunity:3,breach:1}],
  ['Encaisser',"Constitution, plaques, Athlète (santé selon la Force), Tour, Gardien et Aura de terre.",{con:11,heavyPlates:3,shinyPlates:3,athlete:3,tower:1,warden:1,earthAura:3}],
  ['Rythme',"Capacité spéciale à une main, Lames rapides (+15 % de vitesse), Attaque d'esquive et Rage sanguinaire.",{oneHSpec:1,swiftBlades:1,evasionAttack:1,bloodRage:3}],
  ['Flamme et confort',"Barbare et Peau épaisse : +1 Force et +1 Constitution tous les 2 niveaux de Flamme ; Double saut.",{barbarian:1,thickSkin:1,doubleJump:1}]]},
 {id:'barb',n:'Barbare deux mains',grp:'war',area:'war',gem:{w1:'g_fract',w2:'g_bleed'},steps:[
  ['Dégâts à deux mains',"Voie du barbare (+5 % par rang), Brute (+10 % de dégâts contondants par rang) et Force (+5 % de dégâts de mêlée par point).",{barbariansPath:3,brute:3,str:10}],
  ['Gros coups',"Capacité spéciale à deux mains, Frappe lourde (+10 % de vitesse), Crescendo tourbillon et Tranchant du titan (espadons).",{twoHSpec:1,heavyHitter:1,whirlwind:1,titanEdge:3}],
  ['Critiques et rage',"Vétéran, Implacable (+8 % de critique au coup suivant), Soin de bataille et Rage sanguinaire.",{veteran:3,relentless:1,battleHeal:3,bloodRage:3}],
  ['Encaisser',"Constitution (+50 de santé par point), Athlète (santé selon la Force) et Plaques lourdes.",{con:11,athlete:3,heavyPlates:3}],
  ['Coups impitoyables',"Attaque impitoyable, Opportunité, Attaque plongeante (+50 % en zone) et Chute : force.",{merciless:1,opportunity:3,crashDown:1,crashForce:1}],
  ['Flamme et confort',"Barbare et Peau épaisse : +1 Force et +1 Constitution tous les 2 niveaux de Flamme ; Double saut.",{barbarian:1,thickSkin:1,doubleJump:1}]]},
 {id:'archer',n:'Archer',grp:'rng',area:'rng',gem:{w1:'g_aero',w2:'g_punct'},steps:[
  ["Dégâts à l'arc","Tireur d'élite (+5 % par rang), Perforation (+10 % de dégâts perçants à distance par rang) et Dextérité (+5 % par point).",{marksman:3,puncture:3,dex:7}],
  ['Critiques',"Précision fatale (+5 % de critique par rang), Sniper (+2 % à l'arc par rang), Tir d'adresse (points faibles) et Flèches bénies (mana sur critique).",{fatalPrecision:3,sniper:3,skillShot:3,blessedArrows:3}],
  ['Salves',"Tir multiple et sa dispersion (flèches en plus), capacité spéciale des arcs et Obus étourdissant.",{multiShot:1,msSpread:1,bowSpec:1,shellShock:1}],
  ['Vigueur',"Rôdeur (+1 Dextérité, +1 Endurance par rang), Endurance (+10 de vigueur par point) et Rebond (régénération de vigueur).",{ranger:3,end:8,rebound:3}],
  ['Survie',"Vigueur voilée (santé selon la Dextérité), un peu de Constitution et Barrage (répare l'arc).",{veiledVigor:3,con:2,barrage:3}],
  ['Cibles',"Contre-batterie (+8 % contre les tireurs par rang), Fléau des aigles (+10 % contre les volants par rang) et Dard d'abeille.",{counterBattery:3,eaglesBane:3,beeSting:1}],
  ['Flamme et confort',"Foulée gracieuse et Endurance de la Flamme : +1 Dextérité et +1 Endurance tous les 2 niveaux de Flamme ; Double saut.",{gracefulStride:1,enduranceFlame:1,doubleJump:1}]]},
 {id:'assassin',n:'Assassin aux dagues',grp:'rng',area:'rng',gem:{w1:'g_toxic',w2:'g_agil'},steps:[
  ['Furtivité',"Attaque furtive (+900 % sur un ennemi qui ne vous voit pas), Égorgeur (+100 % par rang) et Pas feutré.",{sneakAttack:1,cutthroat:3,silentStride:3}],
  ['Dégâts aux dagues',"Maîtrise des dagues (+5 % par rang), Estoc (+10 % de dégâts perçants en mêlée par rang) et Dextérité.",{daggerMastery:3,thrust:3,dex:6}],
  ['Dans le dos',"Maîtrise du coup dans le dos (+20 % par rang) et Exposer la faiblesse (+25 % de dégâts physiques subis).",{backstabMastery:3,exposeWeak:1}],
  ['Critiques',"Précision fatale (+5 % de critique par rang), Vétéran (+2 % aux dagues par rang) et Hacher menu.",{fatalPrecision:3,veteran:3,sliceDice:1}],
  ['Mobilité',"Capacité spéciale des dagues, Manœuvre stratégique, Attaque d'esquive, Coup de pied et Blocage réflexe.",{daggerSpec:1,stratManeuver:1,evasionAttack:1,kick:1,quickReflex:1}],
  ['Endurance et survie',"Endurance (+10 de vigueur par point), Vigueur voilée (santé selon la Dextérité) et Instinct de survie.",{end:8,veiledVigor:3,survivalInst:3}],
  ['Flamme et confort',"Foulée gracieuse et Endurance de la Flamme : +1 Dextérité et +1 Endurance tous les 2 niveaux de Flamme ; Double saut.",{gracefulStride:1,enduranceFlame:1,doubleJump:1}]]},
 {id:'mageCrit',n:'Mage critique (baguette)',grp:'mag',area:'mag',gem:{w1:'g_storm',w2:'g_corrupt'},steps:[
  ['Chance de critique',"Précision fatale (+5 % de critique par rang) et Sorcier (+2 % aux baguettes et bâtons par rang) : la chance d'abord.",{fatalPrecision:3,wizard:3}],
  ['Dégâts de baguette',"Apprenti mage, Maîtrise des baguettes (+5 % chacun par rang) et Intelligence (+5 % de dégâts magiques par point).",{mageApprentice:3,wandMastery:3,int:11}],
  ['Effets des critiques',"Coup en chaîne, Destruction massive, Terreur, Saignée et Frappe et sort : un critique peut déclencher foudre, étourdissement, orbes ou un bonus au bâton.",{chainHit:1,massDestr:1,terror:3,bloodletting:3,blastCast:1}],
  ['Foudre et Shroud',"Tonnerre et Arts sombres : +10 % de dégâts de foudre et de Shroud par rang.",{thunder:3,darkArts:3}],
  ['Bâton',"Lanceur de sorts : +5 % de dégâts aux bâtons par rang, pour la seconde arme.",{spellslinger:3}],
  ['Flamme et santé',"Exalté (+1 Intelligence tous les 2 niveaux de Flamme) et un peu de Constitution.",{exalted:1,con:2}]]},
 {id:'fire',n:'Sorcier de feu (bâton)',grp:'mag',area:'mag',gem:{w1:'g_light',w2:'g_burn'},steps:[
  ['Dégâts de feu',"Pyromane (+10 % de dégâts de feu par rang), Lanceur de sorts, Apprenti mage et Intelligence.",{arsonist:3,spellslinger:3,mageApprentice:3,int:11}],
  ['Lancer plus vite',"Charge rapide (−10 % de temps de charge par rang), Courants de mana et Esprit (+20 de mana par point).",{quickCharge:3,manaCurrents:3,spi:11}],
  ['Critiques',"Sorcier, Coup en chaîne, Destruction massive, Terreur et Saignée.",{wizard:3,chainHit:1,massDestr:1,terror:3,bloodletting:3}],
  ['Feu autour de vous',"Aura radieuse, Contre-coup, Clignement et Clignement explosif.",{radiantAura:3,counterstrike:3,blink:1,blinkAttack:1}],
  ['Survie',"Résistance au feu, Essences de vie (santé selon l'Intelligence) et un peu de Constitution.",{fireResistance:3,lifeEssences:3,con:2}],
  ['Flamme et confort',"Exalté et Concentration arcanique : +1 Intelligence et +1 Esprit tous les 2 niveaux de Flamme ; Double saut.",{exalted:1,arcaneConc:1,doubleJump:1}]]},
 {id:'ice',n:'Mage de glace (contrôle)',grp:'mag',area:'mag',gem:{w1:'g_cold',w2:'g_curr'},steps:[
  ['Ralentir et étourdir',"Givre ralentit les attaquants de mêlée ; Terreur peut étourdir sur un critique de sort.",{frost:3,terror:3}],
  ['Dégâts de glace',"Homme de glace (+10 % de dégâts de glace par rang), Apprenti mage et Intelligence.",{iceman:3,mageApprentice:3,int:11}],
  ['Baguette et bâton',"Maîtrise des baguettes et Lanceur de sorts : +5 % chacun par rang.",{wandMastery:3,spellslinger:3}],
  ['Lancer plus vite',"Charge rapide, Courants de mana et Esprit (+20 de mana par point).",{quickCharge:3,manaCurrents:3,spi:11}],
  ['Critiques',"Sorcier (+2 % de critique par rang) et Coup en chaîne.",{wizard:3,chainHit:1}],
  ['Défense',"Contre-coup, Déviation arcanique, Clignement et Clignement d'urgence (même étourdi), Résistance à la glace, Essences de vie et Constitution.",{counterstrike:3,arcaneDeflect:3,blink:1,emergencyBlink:1,iceResistance:3,lifeEssences:3,con:2}],
  ['Flamme et confort',"Exalté et Concentration arcanique : +1 Intelligence et +1 Esprit tous les 2 niveaux de Flamme ; Double saut.",{exalted:1,arcaneConc:1,doubleJump:1}]]},
 {id:'storm',n:'Mage de foudre (baguette)',grp:'mag',area:'mag',gem:{w1:'g_storm',w2:'g_curr'},steps:[
  ['Dégâts de foudre',"Tonnerre (+10 % de dégâts de foudre par rang), Maîtrise des baguettes, Apprenti mage et Intelligence.",{thunder:3,wandMastery:3,mageApprentice:3,int:11}],
  ['Critiques en chaîne',"Sorcier (+2 % de critique par rang), Coup en chaîne et Destruction massive.",{wizard:3,chainHit:1,massDestr:1}],
  ['Baguette',"Capacité spéciale, Piqûre, Prolifération arcanique, Frappe et sort, Esquive à la baguette et Baguette aérienne.",{wandSpec:1,sting:1,arcaneProlif:1,blastCast:1,wandEvasion:1,aerialWand:1}],
  ['Mana',"Unité (mana rendu), Charge rapide et Esprit (+20 de mana par point).",{unity:3,quickCharge:3,spi:11}],
  ['Survie',"Résistance à la foudre, Essences de vie, un peu de Constitution et Étincelle éternelle (répare la baguette).",{shockResistance:3,lifeEssences:3,con:2,eternalSpark:3}],
  ['Flamme et confort',"Exalté et Concentration arcanique : +1 Intelligence et +1 Esprit tous les 2 niveaux de Flamme ; Double saut.",{exalted:1,arcaneConc:1,doubleJump:1}]]},
 {id:'necro',n:'Nécromancien invocateur',grp:'mag',area:'mag',gem:{w1:'g_gnecro',w2:'g_necro'},steps:[
  ['Invoquer',"Nécromancien (crânes), Nécromancie avancée (+1 allié Creux par rang) et Maîtrise des totems (+1 totem par rang).",{necromancer:3,advNecro:3,totemMastery:3}],
  ['Dégâts de Shroud',"Arts sombres (+10 % de dégâts de Shroud), Lanceur de sorts, Apprenti mage et Intelligence.",{darkArts:3,spellslinger:3,mageApprentice:3,int:11}],
  ['Mana',"Courants de mana, Charge rapide, Esprit et Magie du sang (sous 20 % de mana, convertit la santé en mana).",{manaCurrents:3,quickCharge:3,spi:11,bloodMagic:1}],
  ['Critiques',"Saignée et Terreur : orbes ou étourdissement sur un critique de sort.",{bloodletting:3,terror:3}],
  ['Survie',"Os en cendres (+5 % contre les Creux par rang), Résistance au Shroud, Essences de vie, Constitution et Clignement.",{boneToAsh:3,shroudResistance:3,lifeEssences:3,con:2,blink:1}],
  ['Flamme et confort',"Exalté et Concentration arcanique : +1 Intelligence et +1 Esprit tous les 2 niveaux de Flamme ; Double saut.",{exalted:1,arcaneConc:1,doubleJump:1}]]},
 {id:'healer',n:'Soigneur de groupe',grp:'sup',area:'mag',gem:{w1:'g_reap',w2:'g_destiny'},steps:[
  ['Soigner',"Guérisseur (+15 % de soins par rang), Aura d'eau et Eaux de vie, qui soignent selon l'Intelligence.",{healer:3,waterAura:3,watersOfLife:1,int:11}],
  ['Soin de groupe',"Éclat de vie (soin de groupe), Élan divin (soins critiques) et Feu vertueux.",{lifeBurst:1,divineSurge:1,righteousFire:3}],
  ['Relever',"Sauveur (réanimation plus rapide) et Réanimation curative (+8 % de santé par rang).",{saviour:3,healingRevive:3}],
  ['Mana',"Courants de mana, Charge rapide et Esprit (+20 de mana par point).",{manaCurrents:3,quickCharge:3,spi:11}],
  ['Protéger du Shroud',"Atténuation du Shroud et Misère partagée : temps et résistance au Shroud pour le groupe.",{shroudMitigation:3,sharedMisery:3}],
  ['Survie',"Essences de vie (santé selon l'Intelligence), un peu de Constitution et Peau épaisse.",{lifeEssences:3,con:2,thickSkin:1}],
  ['Attaque',"Apprenti mage et Sorcier, pour les sorts offensifs.",{mageApprentice:3,wizard:3}],
  ['Flamme et confort',"Exalté et Concentration arcanique : +1 Intelligence et +1 Esprit tous les 2 niveaux de Flamme ; Double saut.",{exalted:1,arcaneConc:1,doubleJump:1}]]},
 {id:'paladin',n:'Paladin soigneur',grp:'sup',area:'war',gem:{w1:'g_retal',w2:'g_reap'},steps:[
  ['Soigner',"Guérisseur (+15 % de soins par rang), Aura d'eau et Eaux de vie, qui soignent selon l'Intelligence.",{healer:3,waterAura:3,watersOfLife:1,int:11}],
  ['Armure',"Plaques lourdes et brillantes (armure des objets) et Aura de terre (+10 % de résistances au groupe).",{heavyPlates:3,shinyPlates:3,earthAura:3}],
  ['Mêlée qui soigne',"Voie du guerrier, Soin de bataille (santé rendue sur un critique de mêlée) et un peu de Force.",{warriorsPath:3,battleHeal:3,str:4}],
  ['Soin de groupe',"Feu vertueux, Élan divin, Sauveur, Réanimation curative et Martyr (soigne les alliés à votre mort).",{righteousFire:3,divineSurge:1,saviour:3,healingRevive:3,martyr:1}],
  ['Parer',"Parade puissante et Déviation arcanique (+10 de mana par parade réussie, par rang).",{powerParry:3,arcaneDeflect:3}],
  ['Mana et survie',"Esprit, Essences de vie, Constitution, Peau épaisse, Exalté et Double saut.",{spi:6,lifeEssences:3,con:2,thickSkin:1,exalted:1,doubleJump:1}]]},
];
/* Objectifs de soutien (2.1.0) : 3e objectif, passé en dernier sur les points restants. COMPÉTENCES SEULES (ni attribut ni gemme), choisies par le joueur.
   Contenu, ordre des étapes et raisons : CHOIX DU SIMULATEUR (hypothèse) ; les effets cités viennent des descriptions de SK. Place figée : fin de FZ.goals. */
const SUPS=[
 {id:'survie',n:'Survie (santé)',area:'war',steps:[
  ['Santé selon vos attributs',"Athlète, Vigueur voilée et Essences de vie : +3 × Force, Dextérité ou Intelligence de santé max par rang.",{athlete:3,veiledVigor:3,lifeEssences:3}],
  ['Constitution de la Flamme',"Peau épaisse : +1 Constitution tous les 2 niveaux de Flamme.",{thickSkin:1}],
  ['Relever le groupe',"Réanimation curative : +8 % de santé aux joueurs réanimés par rang.",{healingRevive:3}]]},
 {id:'vigueur',n:'Endurance (vigueur)',area:'rng',steps:[
  ['Régénérer la vigueur',"Rebond (+10 % de régén. de vigueur de base par rang) et Rôdeur (+1 Dextérité, +1 Endurance et régén. de vigueur par rang).",{rebound:3,ranger:3}],
  ['Courir',"Coureur : +5 % de vitesse de sprint par rang, sprint moins coûteux.",{runner:3}],
  ['Parer pour la vigueur',"Déviation vigoureuse : +15 vigueur par rang à chaque parade réussie.",{vigDeflect:3}],
  ['Endurance de la Flamme',"Endurance de la Flamme : +1 Endurance tous les 2 niveaux de Flamme.",{enduranceFlame:1}]]},
 {id:'resist',n:'Résistances',area:'mag',steps:[
  ['Résistances élémentaires',"Résistances au feu, à la glace et à la foudre : +5 % chacune par rang.",{fireResistance:3,iceResistance:3,shockResistance:3}],
  ['Résister au Shroud',"Résistance au Shroud : +5 % par rang.",{shroudResistance:3}],
  ['Pour le groupe',"Aura de terre : +10 % de résistances pour vous et les alliés proches.",{earthAura:3}],
  ['Entouré',"Tour (+10 % de résistance physique) et Gardien (+10 % de résistance magique) avec 3 ennemis ou plus à 20 m.",{tower:1,warden:1}]]},
 {id:'mana',n:'Mana',area:'mag',steps:[
  ['Régénérer le mana',"Courants de mana : +5 de régén. de mana de base par rang.",{manaCurrents:3}],
  ['Mana en défense',"Déviation arcanique (+10 mana par rang à chaque parade réussie) et Absorption (4 % de chance de convertir les dégâts magiques reçus en mana).",{arcaneDeflect:3,absorb:3}],
  ['Esprit de la Flamme',"Concentration arcanique : +1 Esprit tous les 2 niveaux de Flamme.",{arcaneConc:1}]]}];
const GOALI={};GOALS.forEach(g=>GOALI[g.id]=g);SUPS.forEach(g=>GOALI[g.id]={...g,sup:1});
const isMain=id=>!!GOALI[id]&&!GOALI[id].sup,isSup=id=>!!GOALI[id]&&!!GOALI[id].sup;
const isAttr=k=>PIPS.some(p=>p[0]===k);
const itemName=k=>isAttr(k)?PIPS.find(p=>p[0]===k)[1]:SKI[k].fr;
const goalName=id=>GOALI[id]?GOALI[id].n:'';

/* Calcul d'un combo : pour chaque élément des étapes, dans l'ordre, achat du chemin le moins cher depuis l'arbre relié (pathTo, dijkstra : 04-tree.js),
   puis des rangs ; ARRÊT au premier achat trop cher pour les points restants. Les liaisons devenues inutiles sont retirées en fin d'étape (comme normalize).
   Nœud de Flamme sauté à la Flamme 1 (il n'y donne rien). Puis l'objectif secondaire, sur les points restants, et enfin le soutien (2.1.0) sur les derniers.
   2.3.0 — vos ajouts (A) : le combo part d'un arbre qui les contient déjà, ils ne lui coûtent rien (dijkstra : nœud acquis = 0) et il garde tout le budget
   (ajouts « en plus », QCM du 2026-11-07). Vos rangs comptent pour une étape, et ce qu'elle en compte devient imposé ; vos nœuds d'attribut s'ajoutent
   au compte des étapes. Un ajout que l'arbre ne relie pas l'est ensuite par le chemin le moins cher. Le glouton peut faire moins bien avec les ajouts
   (≈ 2,5 % des cas mesurés) : on garde alors l'ancien calcul (combo seul, ajouts posés dessus) — jamais d'objectif moins avancé, ni plus cher à avancée égale —
   s'il respecte vos ajouts (aucun de vos nœuds d'attribut ni de vos liaisons n'y devient imposé).
   Résultat = PARTIE IMPOSÉE (sk, pn, pip, spent, links ; arbre = partie imposée ∪ ajouts, regen), mis en cache. */
const pipCount=(b,k)=>TOPO.pips.reduce((a,p)=>a+(p.attr===k&&b.pn[p.id]?1:0),0);
const nReach=b=>{let c=0;for(const n of reach(b))if(n.kind==='skill'||n.kind==='pip')c++;return c};
const NOADD=()=>({sk:{},pn:{}});
/* Vos ajouts (b.ad), nettoyés : compétence connue (rang 1 à max), nœud d'attribut du tracé */
function cleanAdds(A){const o=NOADD();if(!A||typeof A!=='object')return o;
  for(const id in A.sk||{}){const s=SKI[id],v=Math.round(+A.sk[id])||0;if(s&&TOPO.byId[id]&&v>0)o.sk[id]=Math.min(v,s.max)}
  for(const id in A.pn||{}){const n=TOPO.byId[id];if(n&&n.kind==='pip'&&A.pn[id])o.pn[id]=1}return o}
const addKey=A=>Object.keys(A.sk).sort().map(k=>k+':'+A.sk[k]).join(',')+'/'+Object.keys(A.pn).sort().join(',');
/* Liaison retirée seulement si elle ne coupe aucun nœud relié (vos ajouts compris) ; un nœud d'attribut, seulement au-delà du compte des étapes (sp : les vôtres) */
function cleanLinks(b,want,links,sp){let r0=nReach(b);for(const id of [...links].reverse()){const n=TOPO.byId[id];if(!owned(b,n)){links.delete(id);continue}
  if(n.kind==='skill'){if(want.sk[id]||b.sk[id]!==1)continue;delete b.sk[id];if(nReach(b)<r0-1)b.sk[id]=1;else{links.delete(id);r0--}}
  else{if(pipCount(b,n.attr)-(sp[n.attr]||0)<=(want.pip[n.attr]||0))continue;delete b.pn[id];if(nReach(b)<r0-1)b.pn[id]=1;else{links.delete(id);r0--}}}
  syncPips(b)}
function runGoal(b,g,left,want,links,role,sp){
  const rep={id:g.id,role,steps:[],pts:0},s0=spentPoints(b),PC=k=>pipCount(b,k)-(sp[k]||0);let stop=null;
  const C=()=>{const a=spentPoints(b);cleanLinks(b,want,links,sp);left+=a-spentPoints(b)};
  const buy=(pth,target)=>{for(const x of pth)if(x!==target&&!owned(b,x))links.add(x.id);buyPath(b,pth)};
  g.steps.forEach(([t,why,items],i)=>{const st={t,why,items,st:'ok',skip:[]};rep.steps.push(st);
    if(stop){st.st='no';return}const sp0=spentPoints(b);
    for(const [k,want0] of Object.entries(items)){
      if(isAttr(k)){let have=PC(k);want.pip[k]=Math.max(want.pip[k]||0,Math.min(want0,have));
        const near=()=>dijkstra(b,reach(b),u=>u.kind==='pip'&&u.attr===k&&!owned(b,u));
        while(have<want0){let D=near();if(!D.hit)break;let c=D.dist.get(D.hit);
          if(c>left){C();D=near();if(!D.hit)break;c=D.dist.get(D.hit);if(c>left){stop={k,miss:c-left};break}} // trop cher : liaisons inutiles rendues, puis nouvel essai
          buy(trace(D,D.hit),D.hit);left-=c;have=PC(k);want.pip[k]=Math.max(want.pip[k],Math.min(want0,have))}}
      else{const s=SKI[k],n=TOPO.byId[k];if(FLAME_NODES.some(f=>f[0]===k)&&Math.floor(b.flame/2)===0){st.skip.push(k);continue}
        want.sk[k]=Math.max(want.sk[k]||0,Math.min(want0,b.sk[k]||0));
        while((b.sk[k]||0)<want0){if(!(b.sk[k]>0)){let pth=pathTo(b,n),c=pathCost(b,pth);if(c>left){C();pth=pathTo(b,n);c=pathCost(b,pth);if(c>left){stop={k,miss:c-left};break}}buy(pth,n);left-=c}
          else{if(s.cost>left){C();if(s.cost>left){stop={k,miss:s.cost-left};break}}b.sk[k]++;left-=s.cost}want.sk[k]=Math.max(want.sk[k],b.sk[k])}}
      if(stop)break}
    C();if(stop){st.st=spentPoints(b)>sp0?'part':'no';st.miss=stop.miss;st.at=stop.k}});
  rep.pts=spentPoints(b)-s0;return {rep,left}}
/* Vos ajouts que l'arbre ne relie pas : reliés par le chemin le moins cher (comme normalize), au-delà du budget s'il le faut. Renvoie ceux qu'il a fallu relier */
function linkAdds(b,A,links){const R0=reach(b),miss=[...Object.keys(A.sk),...Object.keys(A.pn)].filter(id=>!R0.has(TOPO.byId[id]));
  for(let g=0;miss.length&&g<300;g++){const R=reach(b),lost=TOPO.N.filter(n=>(n.kind==='skill'||n.kind==='pip')&&owned(b,n)&&!R.has(n));if(!lost.length)break;
    const D=dijkstra(b,R);let best=null;for(const n of lost)if(D.dist.has(n)&&(!best||D.dist.get(n)<D.dist.get(best)))best=n;if(!best)break;
    const pth=trace(D,best);for(const n of pth)if(!owned(b,n))links.add(n.id);buyPath(b,pth)}
  return miss}
/* Partie imposée d'un passage : rangs et nœuds, points, liaisons (imposé − éléments des étapes), étape de chaque élément (by) ; tree : points de tout l'arbre */
function part(sk,pn,want,rep,left,orphans,tree){const pip={};for(const id in pn){const a=TOPO.byId[id].attr;pip[a]=(pip[a]||0)+1}
  const spent=Object.entries(sk).reduce((a,[id,r])=>a+SKI[id].cost*Math.min(r,SKI[id].max),0)+Object.keys(pn).length;
  const wpts=Object.entries(want.sk).reduce((a,[id,r])=>a+SKI[id].cost*r,0)+Object.values(want.pip).reduce((a,v)=>a+v,0);
  const by={};rep.forEach((r,gi)=>r.steps.forEach((st,si)=>{for(const k in st.items){const key=isAttr(k)?'@'+k:k;if(!by[key])by[key]=[gi,si]}}));
  return {sk,pn,pip,rep,spent,links:spent-wpts,wpts,left,by,want,orphans,tree}}
/* Un passage du moteur ; A : vos ajouts posés d'avance (gratuits pour lui), ou null (combo seul) */
function runCombo(goals,lvl,exp,flame,A){const b=blankBuild();Object.assign(b,{lvl,exp,flame});const want={sk:{},pip:{}},links=new Set(),rep=[],sp={};
  if(A){Object.assign(b.sk,A.sk);Object.assign(b.pn,A.pn);syncPips(b);for(const id in A.pn){const a=TOPO.byId[id].attr;sp[a]=(sp[a]||0)+1}}
  const s0=spentPoints(b);let left=budget(b);
  for(const [id,role] of goals){const r=runGoal(b,GOALI[id],left,want,links,role,sp);left=r.left;rep.push(r.rep)}
  const orphans=A?linkAdds(b,A,links):[];if(orphans.length)cleanLinks(b,want,links,sp);syncPips(b);
  const sk={},pn={};for(const id in b.sk){const v=A&&A.sk[id]?Math.min(b.sk[id],want.sk[id]||0):b.sk[id];if(v>0)sk[id]=v}
  for(const id in b.pn)if(b.pn[id]&&!(A&&A.pn[id]))pn[id]=1;
  return part(sk,pn,want,rep,budget(b)-spentPoints(b)+s0,orphans,spentPoints(b))}
/* Ancien calcul, pour comparer : combo seul (z), vos ajouts posés dessus, reliés au besoin */
function overlay(z,A,lvl,exp,flame){const b=blankBuild();Object.assign(b,{lvl,exp,flame});b.sk={...z.sk};b.pn={...z.pn};
  for(const id in A.sk)b.sk[id]=Math.max(b.sk[id]||0,A.sk[id]);Object.assign(b.pn,A.pn);syncPips(b);
  const links=new Set(),orphans=linkAdds(b,A,links),sk={...z.sk},pn={...z.pn};let c=0;for(const id of links){const n=TOPO.byId[id];c+=nodeCost(n);if(n.kind==='skill')sk[id]=1;else pn[id]=1}
  return part(sk,pn,z.want,z.rep,z.left-c,orphans,spentPoints(b))}
const better=(a,o)=>a.wpts>o.wpts||a.wpts===o.wpts&&a.tree<=o.tree?a:o;
const COMBO=new Map();
function combo(p,s,lvl,exp,flame,t,A){t=isSup(t)?t:null;A=cleanAdds(A);const ak=addKey(A),key=[p,s,lvl,exp,flame,t,ak].join('|');if(COMBO.has(key))return COMBO.get(key);
  const goals=[[isMain(p)?p:null,'p'],[isMain(s)&&s!==p?s:null,'s'],[t,'t']].filter(x=>x[0]);let out;
  if(ak==='/'){out=runCombo(goals,lvl,exp,flame,null);out.drop=[]}
  else{const z=combo(p,s,lvl,exp,flame,t),a=runCombo(goals,lvl,exp,flame,A),o=overlay(z,A,lvl,exp,flame);
    const fair=Object.keys(A.pn).every(id=>!z.pn[id])&&Object.keys(A.sk).every(id=>!z.sk[id]||(z.want.sk[id]||0)>0);out=fair?better(a,o):a;
    out.drop=a.orphans.filter(id=>o.orphans.includes(id))} // ajouts qu'aucun des deux calculs ne relie : élagués par regen (règle 3), sauf juste après un ajout
  out.ad=A;if(COMBO.size>300)COMBO.clear();COMBO.set(key,out);return out}

/* Build et objectifs : arbre = partie imposée ∪ vos ajouts (b.ad, 2.3.0). Un nœud imposé ne se retire pas (rang minimum = rang imposé) ;
   un changement de réglage (niveau, exploration, Flamme) ou de secondaire garde les ajouts encore reliés ; un nouveau principal repart du combo seul. */
function imposed(b){const o=b.obj||[];return isMain(o[0])?combo(o[0],o[1]||null,b.lvl,b.exp,b.flame,o[2]||null,b.ad):null}
/* Vos ajouts : b.ad avec objectif ; en arbre libre, tout l'arbre (placé à la main) */
function addsOf(b){if(imposed(b))return cleanAdds(b.ad);const sk={},pn={};for(const id in b.sk)if(b.sk[id]>0)sk[id]=b.sk[id];for(const id in b.pn)if(b.pn[id])pn[id]=1;return {sk,pn}}
const treeOf=(imp,A)=>{const sk={...imp.sk},pn={...imp.pn};for(const id in A.sk)sk[id]=Math.max(sk[id]||0,A.sk[id]);Object.assign(pn,A.pn);return {sk,pn}};
const sameTree=(x,b)=>{const ks=Object.keys(x.sk),kp=Object.keys(x.pn);return ks.length===Object.keys(b.sk).filter(id=>b.sk[id]>0).length&&ks.every(id=>b.sk[id]===x.sk[id])&&
  kp.length===Object.keys(b.pn).filter(id=>b.pn[id]).length&&kp.every(id=>!!b.pn[id])};
/* Arbre recalculé depuis les départs avec vos ajouts. keep (juste après un ajout) : tous vos ajouts restent, reliés par le moteur s'il le faut ;
   sinon (retrait, réglage, secondaire, soutien) : un ajout qu'aucun calcul ne relie plus est élagué (règle 3), tant qu'il en reste. Renvoie les ajouts élagués */
function regen(b,keep){b.ad=cleanAdds(b.ad);const gone=[];let imp=imposed(b);if(!imp)return gone;
  for(let g=0;!keep&&imp.drop.length&&g<99;g++){for(const id of imp.drop){gone.push(TOPO.byId[id]);delete b.ad.sk[id];delete b.ad.pn[id]}imp=imposed(b)}
  const t=treeOf(imp,b.ad);b.sk=t.sk;b.pn=t.pn;syncPips(b);return gone}
function rebuild(b,A){if(A!==undefined)b.ad=cleanAdds(A);return regen(b,false)}
/* Choisir les objectifs : principal (nouveau → combo seul, gemmes de l'objectif posées), secondaire et soutien (ajouts gardés).
   obj = [p, s] sans soutien (forme d'avant la 2.1.0, lien inchangé), [p, s, t] avec. */
const objOf=(p,s,t)=>p?(t?[p,s,t]:[p,s]):[];
function setGoals(b,p,s,t){p=isMain(p)?p:null;s=p&&isMain(s)&&s!==p?s:null;t=p&&isSup(t)?t:null;const was=(b.obj||[])[0]||null;
  b.obj=objOf(p,s,t);if(!p){b.ad=NOADD();return []}if(was!==p){b.ad=NOADD();b.gem={...GOALI[p].gem}}return regen(b,false)}
/* Rang minimum d'un nœud (imposé), 0 sinon */
function lockOf(b,n,imp){imp=imp===undefined?imposed(b):imp;if(!imp)return 0;return n.kind==='skill'?(imp.sk[n.id]||0):n.kind==='pip'&&imp.pn[n.id]?1:0}
/* Lien, build enregistré : objectifs inconnus retirés ; arbre qui n'est pas celui que le moteur tire des objectifs et des ajouts (objectif changé depuis)
   → objectifs retirés, arbre gardé tel quel ; noté dans _objLost. Vos ajouts viennent du lien (segment -a) ou du build enregistré (ad) ; sans eux
   (lien ou build d'avant la 2.3.0) : ajouts = arbre − combo seul, puis combo recalculé avec eux s'il change (QCM du 2026-11-07 : _recalc, message) */
function fitGoals(b){const o=Array.isArray(b.obj)?b.obj:[],p=isMain(o[0])?o[0]:null,s=p&&isMain(o[1])&&o[1]!==p?o[1]:null,t=p&&isSup(o[2])?o[2]:null;
  let lost=!!(o[0]&&!p)||!!(o[1]&&o[1]!==o[0]&&!s)||!!(o[2]&&p&&!t);
  const given=b.ad&&typeof b.ad==='object'?cleanAdds(b.ad):null;b.obj=objOf(p,s,t);b.ad=NOADD();
  if(p){const z=imposed(b),fits=A=>{b.ad=A;if(sameTree(treeOf(imposed(b),A),b))return true;b.ad=NOADD();return false};let ok=false;
    if(given){for(const id in given.sk)if(!((b.sk[id]||0)>=given.sk[id]))delete given.sk[id];for(const id in given.pn)if(!b.pn[id])delete given.pn[id];ok=fits(given)}
    const has=Object.keys(z.sk).every(id=>(b.sk[id]||0)>=z.sk[id])&&Object.keys(z.pn).every(id=>b.pn[id]),A=NOADD();
    if(!ok&&has){for(const id in b.sk)if(b.sk[id]>(z.sk[id]||0))A.sk[id]=b.sk[id];for(const id in b.pn)if(b.pn[id]&&!z.pn[id])A.pn[id]=1;ok=fits(A)}
    if(!ok&&has&&!given){b.ad=A;const imp=imposed(b);Object.defineProperty(b,'_recalc',{value:{links:[z.links,imp.links],wpts:[z.wpts,imp.wpts]},enumerable:false,configurable:true});regen(b,true);ok=true}
    if(!ok){b.obj=[];b.ad=NOADD();lost=true}}
  if(lost)Object.defineProperty(b,'_objLost',{value:true,enumerable:false,configurable:true});return b}
/* Build d'un objectif (démarrage, tests) */
function goalBuild(p,s,name,t){const b=blankBuild(name||goalName(p));setGoals(b,p,s,t);return b}

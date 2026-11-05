/* Gemmes d'arme (1.0) : [id, nom FR, nom EN, rareté, palier, type de dégâts que l'arme doit infliger pour déclencher l'effet, effet, valeurs de base de la carte] */
const RAR={c:['Commune','#8a8f98'],u:['Peu commune','#3f9a5b'],r:['Rare','#3b78c4'],e:['Épique','#8b52c9'],l:['Légendaire','#d08a1e']};
const GEMS=[
 ['g_bleed','Gemme de saignement','Gem of Bleeding','c',1,['cut'],'Les critiques tranchants font saigner (dégâts sur la durée).','8 · 6 s'],
 ['g_burn','Gemme de brûlure','Gem of Burning','c',1,['fire'],'Les dégâts de feu enflamment la cible, avec un temps de recharge.','3 s · 6 · 5 s'],
 ['g_punct','Gemme de perforation','Gem of Puncturing','c',1,['pierce'],'Les dégâts perçants posent un affaiblissement qui ajoute des dégâts perçants.','3 · 3 s'],
 ['g_skulls','Gemme des crânes','Gem of Skulls','u',1,[],'Un kill furtif ou impitoyable peut invoquer un crâne compagnon.','1 · 30 %'],
 ['g_retal','Gemme de représailles','Gem of Retaliation','c',2,[],'Bloquer renforce l\'attaque suivante (dégâts contondants et recul).','33 % · 15'],
 ['g_swift','Gemme de célérité','Gem of Swiftness','u',2,[],'Après un sprint, les attaques infligent des dégâts tranchants bonus.','4 · 5 s'],
 ['g_toxic','Gemme de trahison toxique','Gem of Toxic Betrayal','u',2,[],'Les coups dans le dos empoisonnent.','3 · 6 s'],
 ['g_fract','Gemme de fracture','Gem of Fracturing','r',2,['blunt'],'Un kill contondant peut projeter jusqu\'à 4 éclats d\'os à tête chercheuse.','33 % · 8 · 50 %'],
 ['g_embers','Gemme des braises d\'espoir','Gem of Hopeful Embers','r',2,[],'Quand le temps dans le Shroud est bas, les ennemis vaincus lâchent des orbes de temps.','20 s · 2 min'],
 ['g_lnecro','Gemme de nécromancie mineure','Gem of Lesser Necromancy','u',3,[],'Un kill peut invoquer un Hollow Wretch allié (4 max).','10 % · 1'],
 ['g_overp','Gemme de domination','Gem of Overpowering','u',3,[],'Contre un ennemi qui bloque : dégâts de vigueur et recul supplémentaires.','10'],
 ['g_storm','Gemme de l\'œil du cyclone','Gem of Storm\'s Eye','u',3,[],'Marque les ennemis ; frapper une cible marquée envoie un éclair vers une autre.','4'],
 ['g_agil','Gemme d\'agilité','Gem of Agility','r',3,[],'Après une esquive, le coup suivant fait des dégâts tranchants bonus et rend de la vigueur.','3 · 15'],
 ['g_mania','Gemme de frénésie','Gem of Battle Mania','r',4,[],'Sous l\'effet d\'un élixir, les dégâts donnent de la régénération ; à la fin, la régénération est suspendue.','25 · 15 · 10 · 3 s · 10 s'],
 ['g_corrupt','Gemme de corruption','Gem of Corruption','e',4,[],'Marques cumulables (5 max) qui explosent en dégâts de Shroud.','5'],
 ['g_reap','Gemme de moisson d\'âmes','Gem of Soul Reaping','e',4,[],'Les ennemis marqués lâchent une fiole d\'âme qui soigne les alliés à 5 m.','62 s · 5'],
 ['g_light','Gemme de lumière focalisée','Gem of Focused Light','l',4,[],'Viser ou bloquer marque les ennemis (3 cumuls) pour des dégâts de feu bonus.','450 % · 100 % · 10 · 225 %'],
 ['g_blust','Gemme de soif de sang','Gem of Bloodlust','r',5,[],'Les kills peuvent lâcher des orbes de santé qui donnent des dégâts tranchants bonus.','10 % · 5 % · 10 s · 4'],
 ['g_necro','Gemme de nécromancie','Gem of Necromancy','r',5,[],'Un kill peut invoquer un Hollow Damned allié (2 max).','10 % · 1'],
 ['g_meteor','Gemme d\'impact météorique','Gem of Meteoric Impact','e',5,[],'Atterrir après un vol plané crée une explosion et une traînée de feu, puis des dégâts de feu bonus.','3 · 3 s · 7 · 3 · 5 s'],
 ['g_cold','Gemme de sang-froid','Gem of Cold Composure','l',5,[],'Bloquer ou viser donne des résistances mais ralentit ; être touché ou attaquer libère une explosion de glace.','−30 % · 20 · 20 · 10'],
 ['g_curr','Gemme des courants','Gem of Currents','r',6,[],'Les cibles mouillées deviennent trempées ; frapper une cible trempée peut ajouter de la foudre.','8 · 6 s · 33 %'],
 ['g_gnecro','Gemme de nécromancie supérieure','Gem of Greater Necromancy','r',6,[],'Un kill peut invoquer un Hollow Reaper allié (1 max).','10 % · 1'],
 ['g_aero','Gemme d\'acrobaties','Gem of Aerobatics','e',6,[],'Les attaques en l\'air lancent des projectiles perçants à tête chercheuse.','2'],
 ['g_lyc','Gemme de lycanthropie','Gem of Lycanthropy','l',6,[],'Les kills de nuit peuvent créer un orbe lunaire (ressources et buff de nourriture).','27 · 1 % · 10 · 60 s'],
 ['g_cleanse','Gemme de purification','Gem of Cleansing','e',7,[],'Les dégâts retirent un moment la résistance au Shroud de la cible.','3 s'],
 ['g_destiny','Gemme du destin','Gem of Destiny','e',7,[],'Marque un ennemi proche ; le vaincre lâche un orbe qui rend la ressource la plus basse.','20 s · 10 · 10 · 15'],
 ['g_armor','Gemme de blindage','Gem of Armoring','l',7,[],'Les kills lâchent un orbe qui donne une résistance aux dégâts pendant un court moment.','1 s'],
 ['g_hyper','Gemme d\'hyperspécialisation','Gem of Hyperspecialization','l',7,[],'Après une capacité spéciale, les kills rendent de la Concentration (Focus).','3 s · 10'],
];
const GEMI={};GEMS.forEach(([id,fr,en,r,t,types,d,v])=>GEMI[id]={id,fr,en,r,t,types,d,v});
const PERKTYPE={dCut:'cut',dPierce:'pierce',dBlunt:'blunt',dPoison:'poison',venom:'poison',mFire:'fire',mIce:'ice',mShock:'shock',mShroud:'shroud'};
function gemFit(g,w){if(!g||!w||!g.types.length)return null;const t=new Set([w.type,...w.wperks.map(p=>PERKTYPE[p]).filter(Boolean)]);return g.types.some(x=>t.has(x))}

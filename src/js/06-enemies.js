/* Ennemis 1.0 : multiplicateurs de dégâts subis (%), ordre tranchant, perçant, contondant, poison, feu, glace, Shroud, foudre. 0 = immunisé.
   Source : PinDrop (fichiers du jeu 1.0) ; Hollow Damned et Hollow Wretch : enshrouded.tools (fichiers 1.0). */
const DTYPES=[['cut','Tranchant','phys'],['pierce','Perçant','phys'],['blunt','Contondant','phys'],['poison','Poison','poison'],['fire','Feu','mag'],['ice','Glace','mag'],['shroud','Shroud','mag'],['shock','Foudre','mag']];
/* Noms de factions : officiels (MetaBot, voir 07-noms.js), sauf Vukah (aucun nom français trouvé) et Faune */
const FACTIONS={fell:'Déchus',hollow:'Creux',scav:'Maraudeurs',vukah:'Vukah',drak:'Drak\'Dal',wild:'Faune',ancient:'Anciens'};
const ENEMIES=[];
function EN(f,list){list.forEach(([n,lv,m,boss,src])=>ENEMIES.push({n,f,lv,m,boss:!!boss,src:src||'PinDrop'}))}
const FELL_BASE=[100,100,100,100,120,100,0,100],FELL_ARM=[100,100,100,120,120,100,0,120];
EN('fell',[
 ['Lord Vorgoth','50',FELL_BASE,1],['Fell Black Knight','45–50',FELL_ARM],['Fell Sentinel','28–50',FELL_ARM],['Fell Crusader','21–50',FELL_ARM],['Fell Marksman','16–50',FELL_ARM],
 ['Fell Commander','16–50',FELL_ARM],['Fell Soldier III','5–50',FELL_ARM],['Fell Scout II','11–50',FELL_ARM],['Fell Soldier I / II','3–50',FELL_BASE],['Fell Scout','3–50',FELL_BASE],
 ['Fell Defender I / II','1–50',FELL_BASE],['Fell Lancer','1–50',FELL_BASE],['Fell Squire','1–50',FELL_BASE],['Fell Critter','1–50',[100,100,120,100,120,100,0,100]],
 ['Fell Sicklescythe','21–50',FELL_ARM],['Fell Sporehead','20–50',FELL_BASE],['Fell Banshee','5–50',FELL_BASE],['Fell Monstrosity','16–48',FELL_BASE],['Fell Striker','9–48',FELL_BASE,1],
 ['Fell Cyclops','28–48',[100,100,100,140,140,100,0,100],1],['Armored Fell Thunderbrute','11–50',FELL_ARM,1],['Fell Thunderbrute','3–5',FELL_BASE,1],
 ['Fell Critter Queen (début)','11–16',[100,100,100,120,140,100,0,100],1],['Fell Critter Queen (avancée)','21–50',[100,100,100,120,100,140,0,100],1],
 ['Fell Wispwyvern','—',[100,100,100,90,120,100,0,100],1],['Fell Dragon Youngling','—',[100,100,100,90,120,100,0,100],1],
 ['Shroud Stalker','15–50',[80,120,80,100,120,140,0,100],1],['Shroud Flayer','—',[120,100,100,100,120,100,0,100]],['Shroud Gazer','3–53',FELL_BASE],
 ['Shroud Depthdweller','9–50',[100,100,100,100,100,100,0,100]],['Large Shroud Depthdweller','16–48',[100,100,100,100,100,100,0,100]],
 ['Fell Boar','11–41',[120,100,100,120,120,100,0,100]],['Fell Crab','37–45',[60,100,140,100,100,100,0,100]],['Fell Vine','9–50',[120,80,80,100,140,100,0,100]],
 ['Fell Vinebloom','13–50',[120,80,80,0,120,100,0,100]],['Fell Fungal Friend','15–20',[140,100,60,60,120,120,0,100]]
]);
EN('hollow',[
 ['Hollow Cyclops','19–24',[80,60,150,0,120,100,60,100],1],['Hollow Summoner','7–45',[100,100,150,0,120,80,60,100]],['Hollow Reaper','18–32',[80,60,150,0,120,80,60,130]],
 ['Hollow Hound','3–45',[80,60,150,0,120,80,60,100]],['Hollow Damned','—',[72,54,135,0,120,80,60,120],0,'enshrouded.tools'],['Hollow Wretch','—',[80,60,150,0,120,80,60,100],0,'enshrouded.tools']
]);
const SCAV=[100,120,100,80,80,120,120,100];
EN('scav',[
 ['Scavenger Tyrant','28–45',[60,130,80,80,60,130,120,100],1],['Scavenger Gorger Matron','7–15',[120,130,80,80,80,140,120,100],1],['Scavenger Pyreblade','28–45',[100,120,100,80,60,130,120,100]],
 ['Scavenger Miner','28–45',[80,120,100,80,80,110,120,100]],['Scavenger Summit Cannoneer','28–45',[80,120,100,80,80,110,120,100]],['Scavenger Summit Strayshooter','28–45',[80,120,100,80,80,110,120,100]],
 ['Scavenger Arsonist','28–45',[80,120,100,80,80,120,120,100]],['Scavenger Snow Sabertooth','28–35',[100,100,100,120,120,60,120,100]],['Scavenger Butcher','9–27',[80,100,80,60,100,140,120,100]],
 ['Scavenger Blaster','21–27',[80,120,80,60,80,140,120,100]],['Scavenger Scalper','1–27',SCAV],['Scavenger Cannoneer','3–27',SCAV],['Scavenger Strayshooter','1–27',SCAV],
 ['Scavenger Scrapshield','3–27',[100,90,100,80,80,120,120,100]],['Scavenger Hound','3–45',[120,120,80,80,80,120,120,100]]
]);
const VUK=[100,80,100,120,100,80,120,100];
EN('vukah',[['Vukah','3–28',VUK],['Vukah Sage','3–28',VUK],['Vukah Bonebreaker','15–21',VUK],['Vukah Bonehunter','15–25',VUK],['Vukah Beastmaster Shaman','16–28',VUK],
 ['Vukah Lightning Shaman','15–28',[100,80,100,120,100,80,120,80]],['Vukah Totem Shaman','16–28',[100,80,100,120,100,80,120,80]]]);
const DRAK=[80,140,80,100,80,120,120,120];
EN('drak',[['Drak\'Dal Chieftain','37–48',DRAK,1],['Drak\'Dal Priest','37–48',DRAK],['Drak\'Dal Spearfisher','37–48',DRAK],['Drak\'Dal Broodwarden','15–48',DRAK],['Drak\'Dal Hunter','15–48',DRAK]]);
const ANC=[80,80,120,50,80,120,100,50];
EN('ancient',[['Ancient S.P.D.R. Construct','48–50',ANC,1],['Ancient G.A.R.D. Construct (Burner)','46–53',[80,80,120,50,50,120,100,50]],['Ancient G.A.R.D. Construct (Dozer)','50',ANC],
 ['Ancient G.A.R.D. Construct (Slicer)','46–50',ANC],['Ancient B.L.D.R. Construct','48–50',ANC],['Ancient C.R.T.R. Construct','46–50',ANC],['Ancient G.T.H.R. Construct I / II','46–53',ANC],
 ['Ancient G.U.N.R. Construct I / II','48',ANC],['Ancient M.I.N.R. Construct','46–50',ANC],['Ancient S.I.R.N. Construct','46–50',ANC]]);
EN('wild',[
 ['Cyclops','30–35',[100,100,100,100,100,100,120,100],1],['Direwolf','9',[100,100,100,120,120,80,120,100],1],['Whitewing Vulture','28–46',[100,120,100,120,140,60,120,80]],
 ['Draconian Vulture','21–27',[100,120,100,120,60,140,120,80]],['Snow Sabertooth','28–46',[100,100,100,120,120,60,120,100]],['Sabertooth','16–28',[100,100,100,120,60,120,120,100]],
 ['Wolf','3–9',[100,100,100,120,120,100,120,100]],['Boar','11–43',[100,120,80,120,100,100,120,100]],['Crab','37–46',[60,100,140,100,80,120,120,120]],
 ['Summit Spider / Spitting Spider','28–46',[100,100,100,60,120,80,120,100]],['Summit Spider Mama','28–46',[100,80,120,60,120,80,120,100]],['Spider / Spitting Spider','3–46',[100,100,100,60,100,100,120,100]],
 ['Spider Mama','5–46',[100,80,120,60,100,100,120,100]],['Venomous Stinger','37–45',[100,80,140,0,100,100,120,100]],['Stinger','15',[100,80,140,60,100,100,120,100]],
 ['Venomous Scorpion','21–27',[100,80,120,60,100,100,120,100]],['Summit Bat','28–35',[100,100,100,100,140,60,120,100]],['Electric Bat','1–48',[100,100,100,100,100,140,120,60]],
 ['Bat','1–48',[100,100,100,100,100,100,120,100]],['Bees','1–45',[100,100,100,100,300,100,120,100]],['Raven','16–35',[100,100,100,120,100,100,120,100]],['Rat','1–46',[100,100,100,50,100,100,120,100]]
]);

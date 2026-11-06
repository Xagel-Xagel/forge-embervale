/* Noms français (décision de l'utilisateur, 2026-11-06, liste validée : docs/etudes/traductions-noms-2026-11-06.md).
   Les clés restent les identifiants (objets) ou les noms anglais (panoplies, ennemis) : les codes de partage (FZ) et le code n'en dépendent pas.
   Objets et panoplies : noms officiels du jeu, lus sur MetaBot (https://metabot.gg/fr_FR/enshrouded, tables de textes 1.0, build 1285601), relevés le 2026-11-06 ;
   les panoplies sont déduites du nom de leurs pièces.
   Ennemis : [nom français, source] — o = officiel (MetaBot), d = déduit d'un nom officiel (objet du même nom), t = traduction du simulateur (aucun nom officiel trouvé). */
const FR_ITEMS={
 emb_h:'Casque de Gardebraise',emb_c:'Plastron de Gardebraise',emb_g:'Gants de Gardebraise',emb_l:'Pantalon de Gardebraise',
 emb_f:'Bottes de Gardebraise',cre_h:'Casque de la crête de feu',cre_c:'Plastron de la crête de feu',cre_g:'Gants de la crête de feu',
 cre_l:'Pantalon de la crête de feu',cre_f:'Bottes de la crête de feu',ash_h:'Cagoule du marcheur d\'Ashwind',ash_c:'Plastron du marcheur d\'Ashwind',
 ash_g:'Gants du marcheur d\'Ashwind',ash_l:'Pantalon du marcheur d\'Ashwind',ash_f:'Bottes du marcheur d\'Ashwind',sky_h:'Casque du spectre céleste',
 sky_c:'Plastron du spectre céleste',sky_g:'Gants du spectre céleste',sky_l:'Pantalon du spectre céleste',sky_f:'Bottes du spectre céleste',
 fla_h:'Chapeau du Flame arcaniste',fla_c:'Plastron du Flame arcaniste',fla_g:'Gants du Flame arcaniste',fla_l:'Pantalon du Flame arcaniste',
 fla_f:'Bottes du Flame arcaniste',lif_h:'Casque de Lifelock',lif_c:'Plastron de Lifelock',lif_g:'Gants de Lifelock',
 lif_l:'Pantalon de Lifelock',lif_f:'Bottes de Lifelock',ven_h:'Casque creux vénérable',ven_c:'Plastron creux vénérable',
 ven_g:'Gants creux vénérables',ven_l:'Pantalon creux vénérable',ven_f:'Bottes creuses vénérables',rg_am:'Anneau de mana des Anciens',
 rg_as:'Anneau d\'endurance des Anciens',rg_ah:'Anneau de santé des Anciens',rg_um:'Anneau de mana ultime',rg_us:'Anneau d\'endurance ultime',
 rg_uh:'Anneau de santé ultime',rg_anc:'Anneau des Anciens',rg_mf:'Anneau de la Mère Flame',rg_eth:'Anneau de l’éther',
 rg_ths:'Anneau de neige-foudre',rg_heir:'Anneau de l\'héritier',rg_frost:'Anneau de gel',rg_cmd:'Anneau de commandant',
 rg_gem:'Anneau des Gémeaux',w_aurora:'Épée d\'Aurora',w_wailing:'Lame gémissante',w_fang:'Lame à crocs',
 w_apex:'Machette à pointes',w_dragsw:'Épée du Dragon',w_graven:'Hache idole gravée',w_skull:'Hache fendeuse de crâne',
 w_lfaxe:'Hache forgée légère',w_jez:'Apothéose de Jezmina',w_dimh:'Marteau des Dimweald',w_meat:'Hachoir à viande',
 w_flesh:'Broyeur de chair',w_adorned:'Dagues de drakling ornées',w_oath:'Briseur de serment',w_horn:'Dagues à corne',
 w_lfdag:'Dagues forgées légères',w_valor:'Dagues Cœur de vaillance',w_gotn:'Garde de l’Épée du Nord',w_spiked:'Grande épée à pointes',
 w_darkwood:'Hache en bois sombre',w_boreal:'Hache boréale',w_thunderb:'Grande hache coup de tonnerre',w_warhero:'Hache en or du héros de guerre',
 w_ram:'Marteau à percussion',w_aero:'Aerostriker',w_goat:'Marteau de la chèvre',w_rot:'Rotblood',
 w_chief:'Marteau du chef',w_star:'Étoile ancestrale',w_sunh:'Marteau du soleil',w_drak:'Arc sifflement des Drak',
 w_tomb:'Arc du pilleur de tombes',w_rattle:'Arc serpents à sonnettes',w_temple:'Arc du gardien du temple',w_talion:'Arc du Talion',
 w_winged:'Ombre ailée',w_ignited:'Arc enflammé',w_bloodflow:'Baguette de flux sanguin',w_ancdrak:'Baguette ancienne des Drak',
 w_totem:'Baguette totem',w_mythic:'Baguette mythique',w_polymath:'Baguette de Polymathe',w_moor:'Bâton du marais',
 w_violet:'Tempête violette',w_storm:'Bâton tempête',w_oracle:'Everblue de l\'Oracle',w_reeds:'Bâton de roseaux',
 w_guidance:'Bâton de guidance',w_apprentice:'Baguette d\'apprenti',w_frostw:'Baguette du gel',w_twisting:'Baguette torsadée',
 w_deceiving:'Bâton trompeur',w_mirage:'Mirage'
};
const FR_SETS={'Emberguard':'Gardebraise','Crestflame':'Crête de feu','Ashwind Strider':'Marcheur d\'Ashwind','Sky Specter':'Spectre céleste','Flame Arcanist':'Flame arcaniste','Lifelock':'Lifelock','Venerable Hollow':'Creux vénérable'};
const FR_ENEMIES={
 'Lord Vorgoth':['Seigneur Vorgoth','t'],'Fell Black Knight':['Chevalier noir Déchu','d'],'Fell Sentinel':['Sentinelle Déchue','t'],
 'Fell Crusader':['Croisé Déchu','t'],'Fell Marksman':['Tireur d\'élite Déchu','t'],'Fell Commander':['Commandant Déchu','t'],
 'Fell Soldier III':['Soldat Déchu III','t'],'Fell Scout II':['Éclaireur Déchu II','t'],'Fell Soldier I / II':['Soldat Déchu I / II','t'],
 'Fell Scout':['Éclaireur Déchu','t'],'Fell Defender I / II':['Défenseur Déchu I / II','t'],'Fell Lancer':['Lancier Déchu','t'],
 'Fell Squire':['Écuyer Déchu','t'],'Fell Critter':['Bestiole Déchue','t'],'Fell Sicklescythe':['Faucille des Déchus','o'],
 'Fell Sporehead':['Tête-à-spores Déchue','t'],'Fell Banshee':['Banshee Déchue','t'],'Fell Monstrosity':['Monstruosité des Déchus','o'],
 'Fell Striker':['Attaquant Déchu','o'],'Fell Cyclops':['Cyclope Déchu','t'],'Armored Fell Thunderbrute':['Brute-tonnerre Déchue blindée','t'],
 'Fell Thunderbrute':['Brute-tonnerre Déchue','t'],'Fell Critter Queen (début)':['Reine des bestioles Déchue (début)','t'],'Fell Critter Queen (avancée)':['Reine des bestioles Déchue (avancée)','t'],
 'Fell Wispwyvern':['Wispwyvern des Déchus','o'],'Fell Dragon Youngling':['Jeune dragon Déchu','o'],'Shroud Stalker':['Pisteur de Brume','o'],
 'Shroud Flayer':['Écorcheur de Brume','t'],'Shroud Gazer':['Guetteur de Brume','t'],'Shroud Depthdweller':['Rôdeur des profondeurs de Brume','t'],
 'Large Shroud Depthdweller':['Grand rôdeur des profondeurs de Brume','t'],'Fell Boar':['Sanglier Déchu','t'],'Fell Crab':['Crabe Déchu','t'],
 'Fell Vine':['Liane Déchue','t'],'Fell Vinebloom':['Fleur-liane Déchue','t'],'Fell Fungal Friend':['Ami fongique Déchu','t'],
 'Hollow Cyclops':['Cyclope Creux','o'],'Hollow Summoner':['Invocateur Creux','t'],'Hollow Reaper':['Faucheur Creux','t'],
 'Hollow Hound':['Chien Creux','t'],'Hollow Damned':['Damné Creux','t'],'Hollow Wretch':['Misérable Creux','t'],
 'Scavenger Tyrant':['Maraudeur Tyran','o'],'Scavenger Gorger Matron':['Matrone Grandgosier des Maraudeurs','o'],'Scavenger Pyreblade':['Maraudeur Lame-bûcher','t'],
 'Scavenger Miner':['Maraudeur mineur','t'],'Scavenger Summit Cannoneer':['Maraudeur canonnier des sommets','t'],'Scavenger Summit Strayshooter':['Maraudeur tireur errant des sommets','t'],
 'Scavenger Arsonist':['Maraudeur incendiaire','t'],'Scavenger Snow Sabertooth':['Dent-de-sabre des neiges des Maraudeurs','t'],'Scavenger Butcher':['Maraudeur boucher','t'],
 'Scavenger Blaster':['Maraudeur artificier','t'],'Scavenger Scalper':['Maraudeur scalpeur','t'],'Scavenger Cannoneer':['Maraudeur canonnier','t'],
 'Scavenger Strayshooter':['Maraudeur tireur errant','t'],'Scavenger Scrapshield':['Maraudeur Bouclier-ferraille','t'],'Scavenger Hound':['Chien des Maraudeurs','t'],
 'Vukah':['Vukah','t'],'Vukah Sage':['Vukah sage','t'],'Vukah Bonebreaker':['Vukah brise-os','t'],
 'Vukah Bonehunter':['Vukah chasseur d\'os','t'],'Vukah Beastmaster Shaman':['Chaman vukah maître des bêtes','t'],'Vukah Lightning Shaman':['Chaman vukah de la foudre','t'],
 'Vukah Totem Shaman':['Chaman vukah des totems','t'],'Drak\'Dal Chieftain':['Chef des Drak\'Dal','d'],'Drak\'Dal Priest':['Prêtre des Drak\'Dal','t'],
 'Drak\'Dal Spearfisher':['Pêcheur à la lance des Drak\'Dal','t'],'Drak\'Dal Broodwarden':['Gardien de couvée des Drak\'Dal','t'],'Drak\'Dal Hunter':['Chasseur des Drak\'Dal','t'],
 'Ancient S.P.D.R. Construct':['Créature S.P.D.R. des Anciens','o'],'Ancient G.A.R.D. Construct (Burner)':['Créature G.A.R.D. des Anciens (Brûleur)','t'],'Ancient G.A.R.D. Construct (Dozer)':['Créature G.A.R.D. des Anciens (Bulldozer)','t'],
 'Ancient G.A.R.D. Construct (Slicer)':['Créature G.A.R.D. des Anciens (Trancheur)','t'],'Ancient B.L.D.R. Construct':['Créature B.L.D.R. des Anciens','t'],'Ancient C.R.T.R. Construct':['Créature C.R.T.R. des Anciens','t'],
 'Ancient G.T.H.R. Construct I / II':['Créature G.T.H.R. des Anciens I / II','t'],'Ancient G.U.N.R. Construct I / II':['Créature G.U.N.R. des Anciens I / II','t'],'Ancient M.I.N.R. Construct':['Créature M.I.N.R. des Anciens','t'],
 'Ancient S.I.R.N. Construct':['Créature S.I.R.N. des Anciens','t'],'Cyclops':['Cyclope','t'],'Direwolf':['Loup géant','o'],
 'Whitewing Vulture':['Vautour aile-blanche','t'],'Draconian Vulture':['Vautour draconien','t'],'Snow Sabertooth':['Dent-de-sabre des neiges','t'],
 'Sabertooth':['Dent-de-sabre','t'],'Wolf':['Loup','t'],'Boar':['Sanglier','t'],
 'Crab':['Crabe','t'],'Summit Spider / Spitting Spider':['Araignée / Araignée cracheuse des sommets','t'],'Summit Spider Mama':['Mère araignée des sommets','t'],
 'Spider / Spitting Spider':['Araignée / Araignée cracheuse','t'],'Spider Mama':['Mère araignée','t'],'Venomous Stinger':['Dard venimeux','t'],
 'Stinger':['Dard','t'],'Venomous Scorpion':['Scorpion venimeux','t'],'Summit Bat':['Chauve-souris des sommets','t'],
 'Electric Bat':['Chauve-souris électrique','t'],'Bat':['Chauve-souris','t'],'Bees':['Abeilles','t'],
 'Raven':['Corbeau','t'],'Rat':['Rat','t']
};
Object.values(ITEMS).forEach(it=>{it.fr=FR_ITEMS[it.id];if(it.set)it.setFr=FR_SETS[it.set]});
ENEMIES.forEach(e=>{[e.fr,e.fs]=FR_ENEMIES[e.n]});
/* Affichage : français, puis l'anglais en italique (comme les compétences) ; ° = traduction du simulateur */
const TRAD_TIP='Traduction du simulateur : aucun nom français officiel trouvé';
const trMark=o=>o.fs==='t'?`<sup class="trm" title="${TRAD_TIP}">°</sup>`:'';
function nmH(o){return `${esc(o.fr)}${trMark(o)} <span class="en">${esc(o.n)}</span>`}
function nmF(o){return esc(o.fr)+trMark(o)}
function nmT(o){return o.fr+(o.fs==='t'?' °':'')}
/* Recherche sur les deux noms, sans tenir compte de la casse ni des accents */
const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const nmMatch=(o,q)=>fold(o.fr+' '+o.n).includes(fold(q));

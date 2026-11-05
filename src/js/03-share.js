/* Partage : code compact, uniquement lettres, chiffres et tirets */
const ALL_ITEMS=Object.keys(ITEMS);
function encode(b){
  const head=[b.lvl,b.exp,b.flame,b.upg].map(n=>n.toString(36).padStart(2,'0')).join('');
  const it=SLOTS.map(([sl])=>{const i=ALL_ITEMS.indexOf(b.gear[sl]);return i<0?'zz':i.toString(36).padStart(2,'0')}).join('');
  const sk=SK.map(s=>Math.min(b.sk[s.id]||0,s.max).toString(36)).join('').replace(/0+$/,'');
  let bits=0n;TOPO.pips.forEach((n,i)=>{if(b.pn&&b.pn[n.id])bits|=1n<<BigInt(i)});
  const gm=['w1','w2'].map(sl=>{const i=GEMS.findIndex(g=>g[0]===(b.gem||{})[sl]);return i<0?'zz':i.toString(36).padStart(2,'0')}).join('');
  return 'b2-'+head+'-'+it+'-'+bits.toString(36)+'-'+(sk||'0')+(gm!=='zzzz'?'-g'+gm:'');
}
function decode(code){
  const m=String(code).trim().replace(/^#/,'').match(/^(b[12])-([0-9a-z]{8})-([0-9a-z]{18})-([0-9a-z]+)-([0-9a-z]+)(?:-g([0-9a-z]{4}))?$/);
  if(!m)return null;const v2=m[1]==='b2';m.splice(1,1);const b=blankBuild('Build partagé');
  if(m[5])m[5].match(/../g).forEach((x,i)=>{if(x!=='zz'){const g=GEMS[parseInt(x,36)];if(g)b.gem[['w1','w2'][i]]=g[0]}});
  const h=m[1].match(/../g).map(x=>parseInt(x,36));[b.lvl,b.exp,b.flame,b.upg]=h;
  m[2].match(/../g).forEach((x,i)=>{if(x!=='zz'){const id=ALL_ITEMS[parseInt(x,36)];if(id)b.gear[SLOTS[i][0]]=id}});
  if(v2){let bits=0n;for(const ch of m[3])bits=bits*36n+BigInt(parseInt(ch,36));TOPO.pips.forEach((n,i)=>{if((bits>>BigInt(i))&1n)b.pn[n.id]=1})}
  else{delete b.pn;if(m[3].length!==6)return null;m[3].split('').forEach((c,i)=>{const v=parseInt(c,36);if(v)b.pip[PIPS[i][0]]=Math.min(v,PIPS[i][4])})}
  m[4].split('').forEach((c,i)=>{const v=parseInt(c,36);if(v&&SK[i])b.sk[SK[i].id]=Math.min(v,SK[i].max)});
  return normalize(b);
}

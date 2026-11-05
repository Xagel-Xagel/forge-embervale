function mk(){const t=function(){};return new Proxy(t,{get(o,k){if(k==='value')return o._v??'';if(k==='hidden'||k==='checked')return o['_'+k]??false;if(k===Symbol.toPrimitive)return ()=>'';if(k in o)return o[k];
 if(k==='getBoundingClientRect')return ()=>({width:1000,height:600,left:0,top:0});if(k==='querySelectorAll')return ()=>[mk(),mk()];if(k==='getContext')return ()=>mk();if(k==='firstElementChild'||k==='style'||k==='classList'||k==='dataset')return mk();
 return mk()},set(o,k,v){o[k==='value'?'_v':k==='hidden'?'_hidden':k==='checked'?'_checked':k]=v;return true},apply(){return mk()}})}
global.document=mk();global.window=global;global.location={hash:'',slice(){return ''}};location.hash='';
global.matchMedia=()=>({matches:false,addEventListener(){}});global.getComputedStyle=()=>({getPropertyValue:()=> '#000'});
global.MutationObserver=class{observe(){}};global.ResizeObserver=class{constructor(f){this.f=f}observe(){this.f()}};
let frames=0;global.requestAnimationFrame=f=>{if(frames++<200)setImmediate(f)};global.localStorage={getItem:()=>null,setItem(){}};global.history={replaceState(){}};
document.querySelector=()=>mk();document.createElement=()=>mk();document.documentElement=mk();document.body=mk();document.hidden=false;
global.addEventListener=()=>{};

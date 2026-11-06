const {chromium}=require('playwright');
const [A,B,file,inkX]=[+process.argv[2],+process.argv[3],process.argv[4]||'test.html',+(process.argv[5]||1)];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:820}});
await p.addInitScript(([x,fa])=>{window.__inkX=x;if(fa)window.__forceArch=fa;},[inkX,process.argv[6]||null]);
await p.goto('file:///home/claude/t2/'+file);await p.waitForTimeout(300);
const out=await p.evaluate(([A,B])=>{
 store.set('momo_story_seen',true);store.set('momo_tut_done',true);store.set('momo_dev_all',true);store.set('momo_pin_done',true);for(let i=11;i<=400;i+=10)store.set('momo_ch_'+i,true);
 document.getElementById('story').classList.add('hidden');mode='level';
 function run(path){ setup(); if(!beginAt(path[0])) return null; for(let i=1;i<path.length;i++){ if(!drawing) break; moveTo(path[i]); } const ink=inkUsed; release(); if(phase!=='sim') return null; let n=0; while(phase==='sim'&&n<2000){step();n++;} return {...endInfo,ink}; }
 const dense=pts=>{const o=[pts[0]];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],d=Math.hypot(b.x-a.x,b.y-a.y),k=Math.ceil(d/5);for(let j=1;j<=k;j++)o.push({x:a.x+(b.x-a.x)*j/k,y:a.y+(b.y-a.y)*j/k});}return o;};
 const ell=(cx,cy,rx,ry,a0=-Math.PI/2,ext=0.35)=>{const o=[];for(let a=a0;a<=a0+2*Math.PI+ext;a+=0.07)o.push({x:cx+rx*Math.cos(a),y:cy+ry*Math.sin(a)});return o;};
 const res=[];
 for(let lv=A;lv<=B;lv++){
  level=lv; setup(); const sp={...L.sp}, potTop=Math.max(L.pot.y,(L.pot2||L.pot).y)+18;
  const legB=(x,y0)=>{for(let y=y0;y<=potTop+80;y+=2){if(blocked({x,y}))return y-3;}return potTop+80;};
  const S=[];
  // 1) 다리 있는 지붕
  for(const h of [26,40,60]) for(const wd of [36,46,60,80]){ const yl=sp.y-h; S.push(dense([{x:sp.x-wd,y:legB(sp.x-wd,yl)},{x:sp.x-wd,y:yl},{x:sp.x+wd,y:yl},{x:sp.x+wd,y:legB(sp.x+wd,yl)}])); }
  // 2) 모모를 통째로 감싸는 고리
  const cx0=L.twin?(L.sp.x+L.sp2.x)/2:sp.x, extra=L.twin?Math.abs(L.sp.x-L.sp2.x)/2:0;
  for(const rx of [55,70,90,115]) for(const ry of [55,70,95]) for(const cy of [15,35,55]) S.push(dense(ell(cx0,sp.y+cy,rx+extra,ry)));
  // 3) 핀 그물(양옆 핀) / 핀 천막
  const pins=L.pins;
  if(pins.length>=2){ const [q1,q2]=[...pins].sort((a,b)=>a.x-b.x);
    for(const dep of [30,50,70]) for(const up of [55,75]) S.push(dense([q1,{x:(q1.x+q2.x)/2,y:Math.max(q1.y,q2.y)+dep},q2,{x:q2.x+6,y:sp.y-up+30},{x:sp.x,y:sp.y-up},{x:q1.x-6,y:sp.y-up+30},{x:q1.x-4,y:q1.y+6}])); }
  for(const pn of pins) for(const w of [46,60]) for(const dy of [60,90]) S.push(dense([{x:sp.x-w,y:sp.y+dy},pn,{x:sp.x+w,y:sp.y+dy}]));
  // 가시 발판·작은 발판: 발판 위에 선을 깔고 그대로 위로 돌아 지붕까지
  const blk=L.S.find(o=>o.kind==='spikes'||(L.fall==='block'&&o.kind==='plat'));
  if(blk){const bt=blk.y-blk.h/2,x0=blk.x-blk.w/2,x1=blk.x+blk.w/2;
    for(const m of [8,20]) for(const up of [40,60]) for(const lift of [4,9]) S.push(dense([{x:x0-m,y:bt-lift},{x:x1+m,y:bt-lift},{x:x1+m+10,y:sp.y-10},{x:sp.x,y:sp.y-up},{x:x0-m-10,y:sp.y-10},{x:x0-m,y:bt-lift-12}]));
    for(const m of [12,26]) for(const up of [45,65]) S.push(dense([{x:sp.x,y:sp.y-up},{x:x1+m,y:sp.y-10},{x:x1+m,y:bt+blk.h+14},{x:x0-m,y:bt+blk.h+14},{x:x0-m,y:sp.y-10},{x:sp.x+6,y:sp.y-up-4}]));}
  let t=0,w=0,F=0,minInk=1e9;
  const per=[];for(const pth of S){const e=run(pth);if(!e)continue;t++;per.push([e.win?1:0,Math.round(e.hp||0),Math.round(e.ink)]);if(e.win){w++;F+=0.5+0.5*e.hp/100;minInk=Math.min(minInk,e.ink);}}
  res.push({lv,arch:L.arch,fall:L.fall||null,twin:!!L.twin,boss:L.boss,water:!!L.water,hives:L.hives.length,D:+L.diff.toFixed(3),t,w,F:t?+(F/t).toFixed(3):0,minInk:w?Math.round(minInk):null,ink:L.ink,par:L.par,mods:L.mods.join('+'),kinds:L.kinds.join('+'),hz:L.hz||null,intro:!!(L.intro||L.archIntro||L.modIntro||L.featIntro),per});
 }
 return res;},[A,B]);
console.log(JSON.stringify(out));await b.close();})();

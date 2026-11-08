const {chromium}=require('playwright');
const [A,B,file,inkX]=[+process.argv[2],+process.argv[3],process.argv[4]||'test.html',+(process.argv[5]||1)];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:820}});
await p.addInitScript(([x,fa])=>{window.__inkX=x;if(fa)window.__forceArch=fa;},[inkX,process.argv[6]||null]);
if(process.env.NOWIND) await p.addInitScript(()=>{window.__noWind=1;});
await p.goto('file:///home/claude/t2/'+file);await p.waitForTimeout(300);
const out=await p.evaluate(([A,B])=>{
 store.set('momo_story_seen',true);store.set('momo_tut_done',true);store.set('momo_dev_all',true);store.set('momo_pin_done',true);for(let i=11;i<=400;i+=10)store.set('momo_ch_'+i,true);
 document.getElementById('story').classList.add('hidden');mode='level';
 function run(path){ setup(); if(!beginAt(path[0])) return null; for(let i=1;i<path.length;i++){ if(!drawing) break; moveTo(path[i]); } const ink=inkUsed; release(); if(phase!=='sim') return null; let n=0; while(phase==='sim'&&n<2000){step();n++;} return {...endInfo,ink}; }
 const dense=pts=>{const o=[pts[0]];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],d=Math.hypot(b.x-a.x,b.y-a.y),k=Math.ceil(d/5);for(let j=1;j<=k;j++)o.push({x:a.x+(b.x-a.x)*j/k,y:a.y+(b.y-a.y)*j/k});}return o;};
 const ell=(cx,cy,rx,ry,a0=-Math.PI/2,ext=0.35)=>{const o=[];for(let a=a0;a<=a0+2*Math.PI+ext;a+=0.07)o.push({x:cx+rx*Math.cos(a),y:cy+ry*Math.sin(a)});return o;};
 const res=[];
 for(let lv=A;lv<=B;lv++){
  // 검증: 선 없이 3초 돌려서, 적(발사대·오리·드론 기지)마다 모모 근처까지 오는지 확인 → 한 번도 못 오면 '죽은 적'
  level=lv; setup();
  const dead=[]; { startSim(); for(const c of catList()) Body.setStatic(c,true); hp=1e9; const reach=new Map(); const srcs=[...L.hives.map(h=>['hive:'+h.kind,h]),...L.chutes.map(c=>['chute:'+c.type,c])];
   let n=0, lastRock=new Map(); while(phase==='sim'&&simT<3500&&n<900){ step(); n++;
     for(const c of catList()){ const hd=headOf(c).position;
       for(const b2 of [...bugs,...drops]) if(b2.plugin&&b2.plugin.src&&dist(b2.position,hd)<(b2.plugin.src.kind==='tank'?62:38)) reach.set(b2.plugin.src,1);
       for(const k of rocks) if(k.plugin&&k.plugin.chute&&dist(k.position,hd)<45) reach.set(k.plugin.chute,1); }
     // 물풍선은 모모 가까이(90px)에서 터지면 물보라가 닿으므로 '도달'로 셈
     const now=new Set(rocks); for(const [k,pos] of lastRock) if(!now.has(k)&&catList().some(c=>dist(pos,headOf(c).position)<90)) reach.set(k.plugin.chute,1);
     lastRock=new Map(rocks.filter(k=>k.plugin&&k.plugin.chute).map(k=>[k,{x:k.position.x,y:k.position.y}])); }
   for(const [nm,o] of srcs) if(!reach.has(o) && nm!=='hive:crawl') dead.push(nm);
   if(!srcs.length && !L.clouds.length && !L.kinds.some(k=>k==='crawl'||k==='bigdog')) dead.push('적 없음');
   // 발사대 겹침
   for(let i=0;i<L.chutes.length;i++) for(let j=0;j<i;j++){const a=L.chutes[i],c=L.chutes[j]; if(a.type===c.type&&(a.type==='top'?Math.abs(a.x-c.x)<80:Math.sign(a.x)===Math.sign(c.x)&&Math.abs(a.y-c.y)<70)) dead.push('발사대 겹침');} }
  level=lv; setup(); const sp={...L.sp}, potTop=Math.max(L.pot.y,(L.pot2||L.pot).y)+18;
  const legB=(x,y0)=>{for(let y=y0;y<=potTop+80;y+=2){if(blocked({x,y}))return y-3;}return potTop+80;};
  const S=[];
  // 1) 다리 있는 지붕
  for(const h of [26,40,60]) for(const wd of [36,46,60,80]){ const yl=sp.y-h; S.push(dense([{x:sp.x-wd,y:legB(sp.x-wd,yl)},{x:sp.x-wd,y:yl},{x:sp.x+wd,y:yl},{x:sp.x+wd,y:legB(sp.x+wd,yl)}])); }
  // 1-2) 코코 판: 두 마리를 잇는 다리 지붕
  if(L.twin){ const a=L.sp,c={x:L.sp2.x,y:L.sp2.y+8},lo=a.x<c.x?a:c,hi=a.x<c.x?c:a;
   for(const up of [22,34,50]) for(const m of [36,50]) for(const legs of [true,false]){ const yL=lo.y-up,yR=hi.y-up,pts=[],x0=lo.x-m,x1=hi.x+m;
    if(legs)pts.push({x:x0,y:legB(x0,yL)}); pts.push({x:x0,y:yL},{x:lo.x,y:yL-6},{x:(lo.x+hi.x)/2,y:Math.min(yL,yR)-10},{x:hi.x,y:yR-6},{x:x1,y:yR}); if(legs)pts.push({x:x1,y:legB(x1,yR)});
    S.push(dense(pts)); } }
  // 2) 모모를 통째로 감싸는 고리
  const cx0=L.twin?(L.sp.x+L.sp2.x)/2:sp.x, extra=L.twin?Math.abs(L.sp.x-L.sp2.x)/2:0;
  // v2.5: 고리 금지 → 한쪽(위·아래·왼·오른)이 50px 열린 호
  const arc=(cx,cy,rx,ry,ph)=>{const h=Math.asin(Math.min(1,27/Math.min(rx,ry)))+0.05,o=[];for(let a=ph+h;a<=ph+2*Math.PI-h;a+=0.07)o.push({x:cx+rx*Math.cos(a),y:cy+ry*Math.sin(a)});return o;};
  for(const rx of [55,80,105]) for(const ry of [55,85]) for(const cy of [20,45]) for(const ph of [-Math.PI/2,Math.PI/2,Math.PI,0]) S.push(dense(arc(cx0,sp.y+cy,rx+extra,ry,ph)));
  // 3) 핀 그물(양옆 핀) / 핀 천막
  const pins=L.pins;
  if(pins.length>=2){ const [q1,q2]=[...pins].sort((a,b)=>a.x-b.x);
    for(const dep of [30,50,70]) for(const up of [55,75]) S.push(dense([q1,{x:(q1.x+q2.x)/2,y:Math.max(q1.y,q2.y)+dep},q2,{x:q2.x+6,y:sp.y-up+30},{x:sp.x,y:sp.y-up},{x:q1.x-6,y:sp.y-up+30},{x:q1.x-4,y:q1.y+6}])); }
  if(pins.length>=2){ const [q1,q2]=[...pins].sort((a,b)=>a.x-b.x);
    for(const up of [40,60]) for(const legs of [false,true]){ const pk={x:(q1.x+q2.x)/2,y:Math.min(sp.y-up,Math.min(q1.y,q2.y)-10)}, pts=[];
      if(legs) pts.push({x:q1.x-30,y:legB(q1.x-30,q1.y+20)}); pts.push(q1,pk,q2); if(legs) pts.push({x:q2.x+30,y:legB(q2.x+30,q2.y+20)}); S.push(dense(pts)); } }
  for(const pn of pins) for(const w of [46,60]) for(const dy of [60,90]) S.push(dense([{x:sp.x-w,y:sp.y+dy},pn,{x:sp.x+w,y:sp.y+dy}]));
  // 가시 발판·작은 발판: 발판 위에 선을 깔고 그대로 위로 돌아 지붕까지
  const blk=L.S.find(o=>o.kind==='spikes'||(L.fall==='block'&&o.kind==='plat'));
  if(blk){const bt=blk.y-blk.h/2,x0=blk.x-blk.w/2,x1=blk.x+blk.w/2;
    for(const m of [8,20]) for(const up of [40,60]) for(const lift of [4,9]) S.push(dense([{x:x0-m,y:bt-lift},{x:x1+m,y:bt-lift},{x:x1+m+10,y:sp.y-10},{x:sp.x,y:sp.y-up},{x:x0-m-10,y:sp.y-10},{x:x0-m,y:bt-lift-12}]));
    for(const m of [12,26]) for(const up of [45,65]) S.push(dense([{x:sp.x,y:sp.y-up},{x:x1+m,y:sp.y-10},{x:x1+m,y:bt+blk.h+14},{x:x0-m,y:bt+blk.h+14},{x:x0-m,y:sp.y-10},{x:sp.x+6,y:sp.y-up-4}]));}
  let t=0,w=0,F=0,minInk=1e9;
  const per=[];for(const pth of S){const e=run(pth);if(!e)continue;t++;per.push([e.win?1:0,Math.round(e.hp||0),Math.round(e.ink)]);if(e.win){w++;F+=0.5+0.5*e.hp/100;minInk=Math.min(minInk,e.ink);}}
  res.push({lv,arch:L.arch,fall:L.fall||null,twin:!!L.twin,boss:L.boss,water:!!L.water,hives:L.hives.length,D:+L.diff.toFixed(3),t,w,F:t?+(F/t).toFixed(3):0,minInk:w?Math.round(minInk):null,ink:L.ink,par:L.par,mods:L.mods.join('+'),kinds:L.kinds.join('+'),hz:L.hz||null,intro:!!(L.intro||L.archIntro||L.modIntro||L.featIntro),dead,per});
 }
 return res;},[A,B]);
console.log(JSON.stringify(out));await b.close();})();

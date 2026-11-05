// 레벨별 '관대함' 측정: 여러 표준 풀이 중 이기는 비율(체력 가중). 낮을수록 어려움
const {chromium}=require('playwright');
const [A,B,file]=[+process.argv[2],+process.argv[3],process.argv[4]||'test.html'];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:820}});
await p.goto('file:///home/claude/t/'+file);await p.waitForTimeout(300);
const out=await p.evaluate(([A,B])=>{
 store.set('momo_story_seen',true);store.set('momo_tut_done',true);store.set('momo_dev_all',true);for(let i=11;i<=400;i+=10)store.set('momo_ch_'+i,true);
 document.getElementById('story').classList.add('hidden');mode='level';
 function run(path){ setup(); if(!beginAt(path[0])) return null; for(let i=1;i<path.length;i++){ if(!drawing) break; moveTo(path[i]); } release(); if(phase!=='sim') return null; let n=0; while(phase==='sim'&&n<2000){step();n++;} return {...endInfo}; }
 const dense=pts=>{const o=[pts[0]];for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i],d=Math.hypot(b.x-a.x,b.y-a.y),k=Math.ceil(d/5);for(let j=1;j<=k;j++)o.push({x:a.x+(b.x-a.x)*j/k,y:a.y+(b.y-a.y)*j/k});}return o;};
 const res=[];
 for(let lv=A;lv<=B;lv++){
  level=lv; setup(); const sp={...L.sp}, potTop=Math.max(L.pot.y,(L.pot2||L.pot).y)+18;
  const legB=(x,y0)=>{for(let y=y0;y<=potTop+60;y+=2){if(blocked({x,y}))return y-3;}return potTop+60;};
  const S=[];
  if(L.twin){
   const a=L.sp,c={x:L.sp2.x,y:L.sp2.y+8},lo=a.x<c.x?a:c,hi=a.x<c.x?c:a;
   for(const up of [22,30,40,55]) for(const m of [34,42,52]) for(const legs of [true,false]) for(const mid of [0,30]){
    const yL=lo.y-up,yR=hi.y-up,yM=Math.min(yL,yR)-mid,pts=[],x0=lo.x-m,x1=hi.x+m;
    if(legs)pts.push({x:x0,y:legB(x0,yL)}); pts.push({x:x0,y:yL},{x:lo.x,y:yL-6},{x:(lo.x+hi.x)/2,y:yM},{x:hi.x,y:yR-6},{x:x1,y:yR}); if(legs)pts.push({x:x1,y:legB(x1,yR)});
    S.push(dense(pts));}
  } else if(L.arch==='drop'){ const g=L.dropGap;
   for(const ext of [30,50]) for(const rt of [18,30]) for(const lift of [0,1]){ const yb=g.y-12, top=sp.y-rt;
     S.push(dense([{x:g.gl-ext,y:yb},{x:g.gl+8,y:yb+(lift?0:8)},{x:(g.gl+g.gr)/2,y:yb+20},{x:g.gr-8,y:yb+(lift?0:8)},{x:g.gr+ext,y:yb},{x:g.gr+ext-10,y:top+20},{x:sp.x,y:top},{x:g.gl-ext+10,y:top+20},{x:g.gl-ext+2,y:yb-4}]));
     const [q1,q2]=L.slopePins; S.push(dense([{x:q1.x-ext*0.5,y:q1.y},q1,{x:(g.gl+g.gr)/2,y:yb+16},q2,{x:q2.x+ext*0.3,y:top+30},{x:sp.x,y:top},{x:q1.x-ext*0.3,y:top+30},{x:q1.x-ext*0.5,y:q1.y-2}]));}
  } else {
   if(L.arch==='slope'){ const sl=L.slope,d=sl.left?1:-1,surf=x=>sl.y0+(x-sl.x0)*(sl.y1-sl.y0)/(sl.x1-sl.x0),[p1,p2]=L.slopePins||[];
    if(p1) for(const back of [30,45]) for(const h of [50,70]){ S.push(dense([p2,p1,{x:p1.x-d*10,y:sp.y-h+30},{x:sp.x,y:sp.y-h+15},{x:sp.x-d*back,y:sp.y-h+35},{x:sp.x-d*back,y:surf(sp.x-d*back)-9}])); S.push(dense([p2,p1,{x:p1.x-d*6,y:sp.y-h+40},{x:sp.x-d*back*0.6,y:sp.y-h+20}])); } }
   for(const yl of [sp.y-20,sp.y-26,sp.y-34,sp.y-44]) for(const wd of [32,36,42,50,60]){
    const ends=[]; for (const sd of [-1,1]){ let x=sp.x+sd*wd, hit=false; for(let k=0;k<=wd;k+=2){ const xx=sp.x+sd*k; if(blocked({x:xx,y:yl})){hit=true;x=sp.x+sd*(k-3);break;} } ends.push({x,hit}); }
    const [Lf,Rt]=ends; const path=[];
    if(!Lf.hit) path.push({x:Lf.x,y:legB(Lf.x,yl)},{x:Lf.x,y:yl}); else path.push({x:Lf.x,y:yl});
    if(!Rt.hit) path.push({x:Rt.x,y:yl},{x:Rt.x,y:legB(Rt.x,yl)}); else path.push({x:Rt.x,y:yl});
    S.push(dense(path));
    const arc=[]; for(let a=Math.PI;a>=0;a-=0.1) arc.push({x:sp.x+wd*Math.cos(a),y:sp.y+8-(sp.y+8-yl)*Math.sin(a)});
    S.push(dense([{x:arc[0].x,y:legB(arc[0].x,arc[0].y)},...arc,{x:arc[arc.length-1].x,y:legB(arc[arc.length-1].x,arc[arc.length-1].y)}]));
   }
   for(const R of [60,75,90,110]){const ring=[];for(let a=-Math.PI/2;a<=1.5*Math.PI+0.01;a+=0.08)ring.push({x:sp.x+R*Math.cos(a),y:sp.y+30+R*0.9*Math.sin(a)});S.push(ring);}
   L.pins.forEach(pn=>{for(const d of [-1,1]) S.push(dense([pn,{x:sp.x+d*45,y:sp.y-28},{x:sp.x+d*50,y:sp.y+24}]));});
  }
  let t=0,w=0,F=0;
  for(const pth of S){const e=run(pth);if(!e)continue;t++;if(e.win){w++;F+=0.5+0.5*e.hp/100;}}
  res.push({lv,intro:!!(L.intro||L.archIntro||L.modIntro||L.featIntro),arch:L.arch,twin:!!L.twin,boss:L.boss,D:+L.diff.toFixed(3),B:+(L.B||0),t,w,F:t?+(F/t).toFixed(3):0,mods:L.mods.join('+'),kinds:L.kinds.join('+'),ink:L.ink,par:L.par});
 }
 return res;},[A,B]);
console.log(JSON.stringify(out));await b.close();})();

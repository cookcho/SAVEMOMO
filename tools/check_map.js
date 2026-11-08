// 맵 구조 검사: 장애물·핀·적·모모 위치가 이상한 곳(지형 속, 공중에 뜬 상자, 겹침, 화면 밖 등)
const {chromium}=require('playwright');
const [A,B,file]=[+process.argv[2],+process.argv[3],process.argv[4]||'test.html'];
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:820}});
await p.goto('file:///home/claude/t2/'+file);await p.waitForTimeout(300);
const out=await p.evaluate(([A,B])=>{
 store.set('momo_story_seen',true);store.set('momo_tut_done',true);store.set('momo_dev_all',true);store.set('momo_pin_done',true);for(let i=11;i<=400;i+=10)store.set('momo_ch_'+i,true);
 mode='level'; const res=[];
 const rectOf=o=>o.shape==='circle'?{x:o.x,y:o.y,w:o.r*2,h:o.r*2,c:1}:{x:o.x,y:o.y,w:o.w,h:o.h,a:o.a||0};
 const ov=(a,b,pad=0)=>Math.abs(a.x-b.x)<(a.w+b.w)/2-pad&&Math.abs(a.y-b.y)<(a.h+b.h)/2-pad;
 const OBS=['obs','box','boulder'];
 for(let lv=A;lv<=B;lv++){
  level=lv; setup(); const iss=[]; const S=L.S, sp=L.sp;
  const terr=S.filter(o=>!OBS.includes(o.kind)&&o.kind!=='cactus');
  const obs=S.filter(o=>OBS.includes(o.kind));
  // 1) 장애물
  for(const o of obs){ const r=rectOf(o);
    if(r.x-r.w/2<-6||r.x+r.w/2>W+6||r.y-r.h/2<90) iss.push(o.kind+' 화면 밖');
    if(terr.some(t=>t.kind!=='ground'&&ov(r,rectOf(t),3))) iss.push(o.kind+' 지형과 겹침');
    if(obs.some(q=>q!==o&&ov(r,rectOf(q),0))) iss.push(o.kind+' 장애물끼리 겹침');
    if(o.kind!=='obs'){ const bot=r.y+r.h/2; const below={x:r.x,y:bot+4,w:Math.max(8,r.w*0.4),h:6}; if(!terr.some(t=>ov(below,rectOf(t),0))&&bot<GY-4) iss.push(o.kind+' 공중에 뜸'); }
    if(L.water&&r.y+r.h/2>WATER_Y-2) iss.push(o.kind+' 위험 바닥에 잠김');
    if(dist(o,sp)<40||(L.sp2&&dist(o,L.sp2)<40)) iss.push(o.kind+' 고양이와 겹침');
  }
  // 2) 핀
  for(const pn of L.pins){ if(blocked(pn)) iss.push('핀이 지형 속'); if(dist(pn,sp)<30) iss.push('핀이 머리에 붙음'); if(L.zones.some(z=>Math.abs(z.x-pn.x)<z.w/2&&Math.abs(z.y-pn.y)<z.h/2)) iss.push('핀이 금지구역 안'); if(pn.y<90||pn.x<0||pn.x>W) iss.push('핀 화면 밖'); }
  // 3) 적 기지·발사대
  for(const h of L.hives){ if(h.kind==='crawl'||h.kind==='bigdog') continue; const hr={x:h.x,y:h.y,w:30,h:30}; if(terr.some(t=>ov(hr,rectOf(t),2))) iss.push(h.kind+' 기지가 지형 속'); if(h.x<10||h.x>W-10||h.y<40) iss.push(h.kind+' 기지 화면 밖'); if(dist(h,sp)<90) iss.push(h.kind+' 기지가 모모 코앞'); }
  const stat=engine.world.bodies.filter(x=>x.isStatic&&!x.isSensor&&x.label!=='edgeWall');
  for(const h of L.hives){ if(h.kind==='crawl'||h.kind==='bigdog') continue; const pts=[[0,0],[22,0],[-22,0],[0,22],[0,-22]].map(([dx,dy])=>({x:h.x+dx,y:h.y+dy})); if(pts.filter(q=>Matter.Query.point(stat,q).length).length>=2) iss.push(h.kind+' 기지가 지형에 박힘'); }
  for(const c of L.cacti){ const q={x:c.x,y:c.y+c.r+4}; if(!Matter.Query.point(stat,q).length&&q.y<GY-2) iss.push('선인장 공중에 뜸'); }
  for(const c of L.chutes) if(c.type==='side'&&(c.y<80||c.y>GY-20)) iss.push('옆 대포 높이 이상');
  if(L.clouds.length&&['pocket','well','alcove','cave'].includes(L.arch)) iss.push('땅속 모모에 비');
  // 4) 금지 구역이 고양이를 덮음
  for(const z of L.zones){ if(Math.abs(z.x-sp.x)<z.w/2+20&&Math.abs(z.y-sp.y)<z.h/2+20) iss.push('금지구역이 모모를 덮음'); }
  // 5) 고양이: 시작 자리가 지형 속이거나, 떨어지는 판이 아닌데 0.8초 만에 크게 움직임/위험 바닥에 닿음
  for(const c of catList()){ const bb=c.bounds, cr={x:(bb.min.x+bb.max.x)/2,y:(bb.min.y+bb.max.y)/2,w:bb.max.x-bb.min.x,h:bb.max.y-bb.min.y}; const hit=Matter.Query.collides(c, engine.world.bodies.filter(x=>x.isStatic&&!x.isSensor)).filter(q=>q.depth>3); if(hit.length&&!L.slope) iss.push((c===coco?'코코':'모모')+' 지형 속에 시작'); }
  const p0=catList().map(c=>({...c.position}));
  startSim(); for(const h of bugs) Matter.Composite.remove(engine.world,h); bugs.length=0; L.hives.forEach(h=>h.n=0); L.chutes.forEach(c=>c.interval=1e9); hp=1e9; ducks=[]; spawnQ=[]; L.clouds=[]; claws=[];
  let n=0; while(phase==='sim'&&simT<800&&n<300){ step(); n++; }
  catList().forEach((c,i)=>{ const d=dist(c.position,p0[i]); if(!L.floatCat&&!L.slope&&!L.winds.length&&L.arch!=='seesaw'&&L.arch!=='hang'&&d>25) iss.push((c===coco?'코코':'모모')+' 시작하자마자 '+Math.round(d)+'px 밀림'); });
  if(phase==='end'&&endInfo&&!endInfo.win&&!L.floatCat&&!L.slope&&!L.winds.length) iss.push('적 없이도 바로 실패: '+endInfo.reason);
  if(iss.length) res.push({lv,arch:L.arch,fall:L.fall||null,iss:[...new Set(iss)]});
 }
 return res;},[A,B]);
console.log(JSON.stringify(out));await b.close();})();

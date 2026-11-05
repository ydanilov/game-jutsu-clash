// Maple Temple visual check: island select with 4 cards, then a busy mid-game moment, then zoomed in (edge markers).
const L=require('./lib');
(async()=>{
  const {s,url}=await L.serve();const b=await L.launch();
  const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];L.watch(p,errs);
  await p.addInitScript(()=>{try{localStorage.removeItem('inkElements.v1');}catch(e){}});
  await p.goto(url,{waitUntil:'commit'});await L.ready(p);
  await p.evaluate(()=>{window.__jc.instant(true);window.__jc.video(false);window.__jc.unlockAll();window.__jc.seenAll();window.__jc.go('maps');});
  await L.frames(p,10);await L.shot(p,'peek4_maps');
  await p.evaluate(()=>{const TD=window.TD;window.__jc.startMap(3);const g=TD.G;g.gold=5000;
    [[12,8,'earth'],[6,2,'fire'],[6,15,'water'],[19,6,'air'],[23,11,'earth'],[27,4,'fire'],[8,8,'water'],[4,11,'air'],[16,3,'fire'],[22,8,'water']].forEach(([i,j,t])=>TD.build(i,j,t));
    TD.fuse(g.grid[2][6].tower,g.grid[6][19].tower);
    window.__jc.skipToWave(9);TD.sim(14);window.__jc.clearCuts();});
  await L.frames(p,4);await p.evaluate(()=>window.__jc.snapCam());await L.frames(p,8);await L.shot(p,'peek4_play');
  await p.evaluate(()=>{const C=window.TD.CAM;C.tr=14;C.ttx=-6;C.ttz=-2;window.__jc.snapCam();});await L.frames(p,8);await L.shot(p,'peek4_zoom');
  const ui=await p.evaluate(()=>window.__jc.ui().filter(u=>/^edge/.test(u.id)).map(u=>u.id));console.log('edge markers',ui);
  console.log(errs.slice(0,8).join('\n')||'no errors');await b.close();s.close();
})();

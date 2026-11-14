// Visual check of one island: node peekmap.js <mapIndex> — home view, close-up, build grid.
const L=require('./lib');
(async()=>{const mi=+(process.argv[2]||0);const {s,url}=await L.serve();const b=await L.launch();
  const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];L.watch(p,errs);
  await p.addInitScript(()=>{try{localStorage.removeItem('inkElements.v1');}catch(e){}});
  await p.goto(url,{waitUntil:'commit'});await L.ready(p);
  await p.evaluate(i=>{window.__jc.instant(true);window.__jc.video(false);window.__jc.unlockAll();window.__jc.seenAll();window.__jc.startMap(i);window.__jc.clearCuts();},mi);
  await L.frames(p,6);await p.evaluate(()=>window.__jc.snapCam());await L.frames(p,8);await L.shot(p,'map'+mi+'_home');
  await p.evaluate(()=>{const C=window.TD.CAM;C.tr=9;window.__jc.snapCam();});await L.frames(p,8);await L.shot(p,'map'+mi+'_close');
  console.log(errs.slice(0,8).join('\n')||'no errors');await b.close();s.close();})().catch(e=>{console.error(e);process.exit(1);});

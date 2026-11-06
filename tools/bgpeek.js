const L=require('./lib');
(async()=>{const {s,url}=await L.serve();const b=await L.launch();const errs=[];
  const p=await b.newPage({viewport:{width:1280,height:720}});L.watch(p,errs);
  await p.goto(url,{waitUntil:'commit'});await L.ready(p);
  await p.evaluate(()=>{window.__jc.instant(true);window.__jc.video(false);window.__jc.unlockAll();window.__jc.seenAll();});
  for(let i=0;i<4;i++){await p.evaluate(i=>{window.__jc.startMap(i);window.__jc.clearCuts();},i);await L.frames(p,4);await p.evaluate(()=>window.__jc.snapCam());await L.frames(p,6);await L.shot(p,'bg_'+i);}
  console.log(JSON.stringify(errs));await b.close();s.close();})().catch(e=>{console.error(e);process.exit(1);});

const L=require('./lib');
(async()=>{const {s,url}=await L.serve();const b=await L.launch();const errs=[];
  const p=await b.newPage({viewport:{width:1440,height:810}});L.watch(p,errs);
  await p.goto(url,{waitUntil:'commit'});await L.ready(p);await p.keyboard.press('Enter');await L.settle(p);await p.waitForTimeout(1500);await L.frames(p,3);
  await L.shot(p,'lobby_new');
  console.log(JSON.stringify(errs));await b.close();s.close();})().catch(e=>{console.error(e);process.exit(1);});

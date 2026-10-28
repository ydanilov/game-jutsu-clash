// Boot: no console errors, intro (title art) renders, every image requested and loaded, then the 3D lobby.
const L=require('./lib');
(async()=>{
  const {s,url}=await L.serve();const b=await L.launch();const fails=[],errs=[];
  const p=await b.newPage({viewport:{width:1440,height:900}});L.watch(p,errs);
  const req=new Set(),ok=new Set();
  p.on('request',r=>{const m=r.url().match(/assets\/(jc_\w+\.webp)/);if(m)req.add(m[1]);});
  p.on('response',r=>{const m=r.url().match(/assets\/(jc_\w+\.webp)/);if(m&&r.status()===200)ok.add(m[1]);});
  await p.goto(url,{waitUntil:'commit'});await L.ready(p);
  const st=await p.evaluate(()=>window.__jc.state);
  L.check(st.screen==='intro','starts on the intro (key art) screen',fails);
  const nArt=Object.keys(st.art).length;
  L.check(nArt>=35&&req.size===nArt,req.size+'/'+nArt+' images requested',fails);
  L.check(ok.size===nArt,ok.size+' images served 200',fails);
  L.check(Object.values(st.art).every(v=>v==='ok'),'all images decoded: '+JSON.stringify(st.art),fails);
  // canvas actually has pixels from the art
  const px=await p.evaluate(()=>{const c=document.getElementById('game');const x=c.getContext('2d').getImageData(c.width/2,c.height*0.45,1,1).data;return Array.from(x);});
  L.check(px[3]>0,'overlay painted at centre '+px,fails);
  await L.shot(p,'boot_intro_desktop');
  await p.mouse.click(720,450);await L.settle(p);await p.waitForTimeout(1000);
  L.check((await p.evaluate(()=>window.__jc.state.screen))==='title','click goes to the 3D lobby',fails);
  await L.shot(p,'boot_title_desktop');
  // missing art fallback: block images, game still boots without errors
  await p.close();
  const p2=await b.newPage({viewport:{width:1280,height:720}});const errs2=[];L.watch(p2,errs2);
  await p2.route(/assets\/jc_/,r=>r.abort());
  await p2.goto(url,{waitUntil:'commit'});await L.ready(p2);
  const st2=await p2.evaluate(()=>window.__jc.state.art);
  L.check(Object.values(st2).every(v=>v==='fail'),'blocked art reported as failed',fails);
  await p2.keyboard.press('Enter');await L.settle(p2);
  await p2.evaluate(()=>window.__jc.go('maps'));await p2.waitForTimeout(500);await L.shot(p2,'boot_fallback_maps');
  await p2.evaluate(()=>{window.__jc.startMap(0);window.__jc.win();});await p2.waitForTimeout(1800);await L.shot(p2,'boot_fallback_win');
  L.check(errs2.length===0,'no errors without art '+errs2.join(' | '),fails);
  L.check(errs.length===0,'no console errors '+errs.join(' | '),fails);
  await b.close();s.close();
  console.log(fails.length?'BOOT FAILED ('+fails.length+')':'BOOT PASSED');process.exit(fails.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});

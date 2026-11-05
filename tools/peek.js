// Peek: screenshot each map at the default start camera (after the intro glide) and report spawn/shrine on-screen.
const L=require('./lib');
(async()=>{
  const {s,url}=await L.serve();const b=await L.launch();
  const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];L.watch(p,errs);
  await p.addInitScript(()=>{try{localStorage.removeItem('inkElements.v1');}catch(e){}});
  await p.goto(url,{waitUntil:'commit'});await L.ready(p);
  await p.evaluate(()=>{window.__jc.instant(true);window.__jc.video(false);window.__jc.unlockAll();window.__jc.seenAll&&window.__jc.seenAll();});
  const n=await p.evaluate(()=>window.__jc.LB?TD.MAPS.length:TD.MAPS.length);
  const only=process.argv[2]!=null?[+process.argv[2]]:[...Array(n).keys()];
  for(const i of only){
    await p.evaluate(i=>{window.__jc.clearCuts();window.__jc.startMap(i);},i);
    await L.frames(p,4);await p.evaluate(()=>{window.__jc.snapCam();});await L.frames(p,6);
    const vis=await p.evaluate(i=>{const M=TD.MAPS[i],a=M.path[0],z=M.path[M.path.length-1];const s0=[Math.max(0,a[0]),Math.max(0,a[1])];
      const f=(tx,ty)=>{const c=window.__jc.tileClient(tx,ty);return c&&c.x>0&&c.y>0&&c.x<1280&&c.y<720?'on':'OFF '+JSON.stringify(c);};
      return {spawn:f(Math.min(31,Math.max(0,a[0])),Math.min(17,Math.max(0,a[1]))),shrine:f(z[0],z[1])};},i);
    console.log('map',i,JSON.stringify(vis));
    await L.shot(p,'peek_map'+i);
  }
  console.log(errs.slice(0,10).join('\n')||'no errors');
  await b.close();s.close();
})();

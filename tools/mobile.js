// Mobile: portrait shows the rotate prompt, landscape/tablet stage fits with no overflow, touch-tap build works, pinch zooms, hit areas >= 44 CSS px.
const L=require('./lib');
const VPS=[{n:'phone_portrait',w:390,h:844,dpr:3},{n:'phone_landscape',w:844,h:390,dpr:3},{n:'tablet_portrait',w:768,h:1024,dpr:2},{n:'tablet_landscape',w:1024,h:768,dpr:2}];
(async()=>{
  const {s,url}=await L.serve();const b=await L.launch();const fails=[];
  for(const v of VPS){
    console.log('== '+v.n);
    const c=await b.newContext({viewport:{width:v.w,height:v.h},deviceScaleFactor:v.dpr,hasTouch:true,isMobile:true});
    const p=await c.newPage();const errs=[];L.watch(p,errs);
    await p.addInitScript(()=>{try{localStorage.removeItem('inkElements.v1');}catch(e){}});
    await p.goto(url,{waitUntil:'commit'});await L.ready(p);
    const info=await p.evaluate(()=>{const r=document.getElementById('stage').getBoundingClientRect();return{rot:!document.getElementById('rotate').hidden,st:{l:r.left,t:r.top,w:r.width,h:r.height},sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,iw:innerWidth,ih:innerHeight,US:window.__jc.state.US,Q:window.__jc.state.QLOW};});
    const portraitPhone=v.h>v.w&&v.w<600;
    L.check(info.rot===portraitPhone,'rotate prompt '+(portraitPhone?'shown':'hidden'),fails);
    L.check(info.sw<=info.iw&&info.sh<=info.ih,'no page overflow '+JSON.stringify([info.sw,info.sh]),fails);
    L.check(info.st.l>=0&&info.st.t>=0&&info.st.l+info.st.w<=v.w+0.5&&info.st.t+info.st.h<=v.h+0.5,'stage inside viewport '+JSON.stringify(info.st),fails);
    L.check(Math.abs(info.st.w/info.st.h-16/9)<0.01,'stage is 16:9',fails);
    await L.shot(p,'mobile_'+v.n+'_boot');
    if(portraitPhone){
      // escape hatch still works
      await p.tap('#rotAnyway');await p.waitForTimeout(300);
      L.check(await p.evaluate(()=>document.getElementById('rotate').hidden),'"play anyway" dismisses the prompt',fails);
      await L.shot(p,'mobile_'+v.n+'_anyway');await c.close();continue;
    }
    if(v.w<900)L.check(info.Q===true,'small screen uses low quality (shadows 1024, dpr<=1)',fails);
    await L.clickId(p,'start',{touch:true});await L.settle(p);await p.evaluate(()=>window.__jc.instant(true));await p.waitForTimeout(800);
    await L.shot(p,'mobile_'+v.n+'_title');
    await L.clickId(p,'play',{touch:true});await p.waitForTimeout(300);await L.shot(p,'mobile_'+v.n+'_maps');
    // touch targets on the map screen and HUD >= 44 css px
    const small=async()=>p.evaluate(()=>{const r=document.getElementById('game').getBoundingClientRect(),k=r.width/window.__jc.state.VW;return window.__jc.ui().filter(u=>!u.id.startsWith('orb_')&&!u.id.startsWith('cx_')&&(u.w*k<43.5||u.h*k<43.5)).map(u=>u.id+':'+Math.round(u.w*k)+'x'+Math.round(u.h*k));});
    let sm=await small();L.check(sm.length===0,'map-select targets >= 44px '+sm.join(','),fails);
    await L.clickId(p,'map0',{touch:true});await L.settle(p);await p.waitForTimeout(1200);
    sm=await small();L.check(sm.length===0,'HUD targets >= 44px '+sm.join(','),fails);
    await L.shot(p,'mobile_'+v.n+'_play');
    // tap a tile -> build menu -> tap Fire
    const t=(await p.evaluate(()=>window.__jc.freeTiles(1)))[0];const cc=await p.evaluate(t=>window.__jc.tileClient(t.tx,t.ty),t);
    await p.touchscreen.tap(cc.x,cc.y);await L.frames(p,3);
    L.check((await p.evaluate(()=>window.__jc.state.menu))==='build','tap opens the build menu',fails);
    sm=await small();L.check(sm.length===0,'radial targets >= 44px '+sm.join(','),fails);
    await L.shot(p,'mobile_'+v.n+'_buildmenu');
    await L.clickId(p,'b_fire',{touch:true,wait:300});
    const tw=await p.evaluate(()=>window.__jc.state.towers);
    L.check(tw.length===1&&tw[0].type==='fire','touch build works',fails);
    // pinch zoom via CDP touch
    const cdp=await c.newCDPSession(p);const r0=await p.evaluate(()=>TD.CAM.tr);const cx=v.w/2,cy=v.h/2;
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-40,y:cy,id:1},{x:cx+40,y:cy,id:2}]});
    for(let k=1;k<=8;k++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-40-k*12,y:cy,id:1},{x:cx+40+k*12,y:cy,id:2}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await L.frames(p,3);
    const r1=await p.evaluate(()=>TD.CAM.tr);
    L.check(r1<r0*0.8,'pinch out zooms in ('+r0.toFixed(1)+' -> '+r1.toFixed(1)+')',fails);
    // one-finger drag turns the camera
    const az0=await p.evaluate(()=>TD.CAM.taz);
    await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy+60,id:3}]});
    for(let k=1;k<=6;k++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx+k*20,y:cy+60,id:3}]});
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await L.frames(p,3);
    const az1=await p.evaluate(()=>TD.CAM.taz);
    L.check(Math.abs(az1-az0)>0.2,'drag turns the camera',fails);
    L.check((await p.evaluate(()=>window.__jc.state.towers.length))===1,'gestures did not build or open menus',fails);
    if(v.n==='phone_landscape'){
      await p.evaluate(()=>{window.__jc.clearCuts();const t=window.__jc.freeTiles(1)[0];window.__jc.ult('meteor',t.tx,t.ty);});
      L.check((await p.evaluate(()=>window.__jc.state.vid))===null,'phones use the still ultimate cut-in by default',fails);await L.skipCut(p,true);
      await p.evaluate(()=>{window.__jc.video(true);window.__jc.preloadVideos();});
      await p.waitForFunction(()=>window.__jc.state.vidState.tornado!=='loading',null,{timeout:90000});
      await p.evaluate(()=>{window.__jc.G.specials=[];const t=window.__jc.freeTiles(1)[0];window.__jc.ult('tornado',t.tx,t.ty);});
      let st;for(let k=0;k<60;k++){st=await p.evaluate(()=>window.__jc.state);if(st.vid!=='wait'&&(st.vid!=='video'||st.vidT>1))break;await L.frames(p,1);}
      L.check(st.vid==='video','forced video cut-in plays on a phone ('+st.vid+')',fails);await L.shot(p,'mobile_'+v.n+'_video');
      await L.skipCut(p,true);L.check(!(await p.evaluate(()=>window.__jc.state.cutin)),'tap skips the video',fails);
      await p.evaluate(()=>{window.__jc.video();window.__jc.G.specials=[];});
    }
    await L.clickId(p,'pause',{touch:true,wait:400});await L.shot(p,'mobile_'+v.n+'_pause');
    L.check(errs.length===0,'no errors '+errs.join(' | '),fails);
    await c.close();
  }
  await b.close();s.close();
  console.log(fails.length?'MOBILE FAILED ('+fails.length+')':'MOBILE PASSED');process.exit(fails.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});

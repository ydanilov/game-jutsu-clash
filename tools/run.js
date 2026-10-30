// Run: start each map, fast-forward waves via window.__jc, trigger the Ronin and Shogun cut-ins, and both result screens.
const L=require('./lib');
(async()=>{
  const {s,url}=await L.serve();const b=await L.launch();const fails=[];
  const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];L.watch(p,errs);
  await p.addInitScript(()=>{try{localStorage.removeItem('inkElements.v1');}catch(e){}});
  await p.goto(url,{waitUntil:'commit'});await L.ready(p);
  await p.evaluate(()=>{window.__jc.instant(true);window.__jc.video(false);});
  // video cut-ins (forced on: headless counts as a low-end device, which uses the stills)
  console.log('== video cut-ins');
  await p.evaluate(()=>{window.__jc.video(true);window.__jc.startMap(0);window.__jc.preloadVideos();});
  await p.waitForFunction(()=>Object.values(window.__jc.state.vidState).every(v=>v!=='loading'),null,{timeout:90000});
  const vs=await p.evaluate(()=>window.__jc.state.vidState);L.check(Object.values(vs).every(v=>v==='ready'),'all 5 clips load '+JSON.stringify(vs),fails);
  const vidPlay=async(label,shot)=>{
    for(let k=0;k<60;k++){const st=await p.evaluate(()=>window.__jc.state);if(st.vid!=='wait')break;await L.frames(p,1);}
    let st=await p.evaluate(()=>window.__jc.state);L.check(st.vid==='video',label+' plays as video ('+st.vid+')',fails);
    for(let k=0;k<60;k++){st=await p.evaluate(()=>window.__jc.state);if(!st.vid||st.vidT>1.1)break;await L.frames(p,1);}
    if(shot)await L.shot(p,shot);
    const t0=st.vidT;await p.keyboard.press('Enter');
    for(let k=0;k<30;k++){st=await p.evaluate(()=>window.__jc.state);if(!st.cutin&&!st.cut)break;await L.frames(p,1);}
    L.check(!st.cutin&&st.cut!=='boss',label+' video skippable (skipped at '+t0.toFixed(2)+'s)',fails);};
  for(const u of ['meteor','tsunami','tornado']){
    await p.evaluate(u=>{window.__jc.clearCuts();const t=window.__jc.freeTiles(1)[0];window.__jc.ult(u,t.tx,t.ty);},u);
    await vidPlay(u,'run_video_'+u);
    L.check(await p.evaluate(()=>window.__jc.G.specials.length>0),u+' effect runs after the video',fails);await p.evaluate(()=>{window.__jc.G.specials=[];});
  }
  await p.evaluate(()=>{window.__jc.clearCuts();const t=window.__jc.freeTiles(1)[0];window.__jc.ult('meteor',t.tx,t.ty);});
  for(let k=0;k<60&&(await p.evaluate(()=>window.__jc.state.vid))==='wait';k++)await L.frames(p,1);
  {const st=await p.evaluate(()=>window.__jc.state);L.check(st.vid==='video'&&st.vidDur<=1.85,'repeat ultimate uses the short clip ('+st.vidDur+'s)',fails);}
  await L.skipCut(p);await p.evaluate(()=>{window.__jc.G.specials=[];});
  await p.evaluate(()=>{window.__jc.skipToWave(5);window.__jc.untilBoss(40);});
  L.check((await p.evaluate(()=>window.__jc.state.vidKey))==='ronin','ronin cut-in uses its clip',fails);await vidPlay('ronin','run_video_ronin');
  await p.evaluate(()=>{window.__jc.clearCuts();window.__jc.skipToWave(20);let k=null;for(let i=0;i<10&&k!=='shogun';i++){k=window.__jc.untilBoss(40);if(k&&k!=='shogun')window.__jc.clearCuts();}});
  L.check((await p.evaluate(()=>window.__jc.state.vidKey))==='shogun','shogun cut-in uses its clip',fails);await vidPlay('shogun','run_video_shogun');
  await p.evaluate(()=>{window.__jc.clearCuts();window.__jc.video(false);window.__jc.resetReveals();});
  // blocked video -> still art
  {const c2=await b.newContext({viewport:{width:1280,height:720}});const p2=await c2.newPage();const e2=[];L.watch(p2,e2);await p2.route(/assets\/video\//,r=>r.abort());
   await p2.goto(url,{waitUntil:'commit'});await L.ready(p2);
   await p2.evaluate(()=>{window.__jc.video(true);window.__jc.instant(true);window.__jc.startMap(0);const t=window.__jc.freeTiles(1)[0];window.__jc.ult('meteor',t.tx,t.ty);});
   let st;for(let k=0;k<60;k++){st=await p2.evaluate(()=>window.__jc.state);if(st.vid!=='wait')break;await L.frames(p2,1);}
   L.check(st.cutin==='meteor'&&(st.vid==='still'||st.vid===null),'blocked video falls back to the still cut-in ('+st.vid+')',fails);await L.frames(p2,3);await L.shot(p2,'run_video_blocked');
   await p2.keyboard.press('Enter');for(let k=0;k<30&&(await p2.evaluate(()=>window.__jc.state.cutin));k++)await L.frames(p2,1);
   L.check(!(await p2.evaluate(()=>window.__jc.state.cutin)),'still fallback skippable',fails);
   await p2.evaluate(()=>{window.__jc.video();window.__jc.reducedMotion(true);window.__jc.clearCuts();const t=window.__jc.freeTiles(1)[0];window.__jc.ult('tsunami',t.tx,t.ty);});
   L.check((await p2.evaluate(()=>window.__jc.state.vid))===null,'reduced motion uses the still (no video)',fails);
   L.check(e2.length===0,'no errors with video blocked '+e2.join(' | '),fails);await c2.close();}
  // new-enemy reveal fires once per type (fresh save), and pauses the sim
  console.log('== reveals + ultimates');
  await p.evaluate(()=>{window.__jc.startMap(0);window.__jc.skipToWave(1);});
  const rv=await p.evaluate(()=>window.__jc.untilCut('enemy',20));
  L.check(rv==='grunt','enemy reveal for the first grunt ('+rv+')',fails);
  const t0=await p.evaluate(()=>window.__jc.G.time);await L.frames(p,6);const t1=await p.evaluate(()=>window.__jc.G.time);
  L.check(t1===t0,'sim paused during the reveal',fails);await L.shot(p,'run_reveal_grunt');
  await L.skipCut(p);L.check(!(await p.evaluate(()=>window.__jc.state.cut)),'reveal skippable',fails);
  await p.evaluate(()=>{window.__jc.step(15);window.__jc.skipToWave(2);window.__jc.step(15);});
  const rs=await p.evaluate(()=>window.__jc.state.reveals.filter(r=>r==='enemy:grunt').length);
  L.check(rs===1,'grunt reveal fired exactly once ('+rs+')',fails);
  L.check((await p.evaluate(()=>window.__jc.state.seenEnemies)).includes('grunt'),'seenEnemies saved',fails);
  for(const u of ['meteor','tsunami','tornado']){
    await p.evaluate(u=>{window.__jc.clearCuts();const t=window.__jc.freeTiles(1)[0];window.__jc.ult(u,t.tx,t.ty);},u);
    L.check((await p.evaluate(()=>window.__jc.state.cutin))===u,u+' cut-in fires',fails);
    await L.frames(p,3);await L.shot(p,'run_ult_'+u);
    await p.keyboard.press('Enter');for(let k=0;k<10&&(await p.evaluate(()=>window.__jc.state.cutin));k++)await L.frames(p,2);
    L.check(!(await p.evaluate(()=>window.__jc.state.cutin)),u+' cut-in skipped with Enter',fails);
    L.check(await p.evaluate(()=>window.__jc.G.specials.length>0),u+' effect running',fails);
    for(let k=0;k<6;k++)await L.frames(p,2);await L.shot(p,'run_fx_'+u);await p.evaluate(()=>{window.__jc.G.specials=[];});
  }
  for(const mi of [0,1,2]){
    console.log('== map '+mi);
    await p.evaluate(mi=>{window.__jc.startMap(mi);window.__jc.gold(5000);
      const t=window.__jc.freeTiles(6),G=window.__jc.G;['fire','water','earth','air','fire','water'].forEach((e,i)=>t[i]&&TD.build(t[i].tx,t[i].ty,e));
      window.__jc.skipToWave(1);window.__jc.step(20);window.__jc.skipToWave(2);window.__jc.step(20);},mi);
    let st=await p.evaluate(()=>window.__jc.state);
    L.check(st.wave===2&&st.result===null,'map '+mi+' simulates waves 1-2 (hp '+Math.round(st.hp)+')',fails);
    // ronin (wave 5)
    await p.evaluate(()=>window.__jc.skipToWave(5));
    const r=await p.evaluate(()=>window.__jc.untilBoss(30));
    L.check(r==='ronin','ronin cut-in triggers on wave 5 ('+r+')',fails);
    if(mi===0){await p.waitForTimeout(400);await L.shot(p,'run_cutin_ronin');}
    // skip by click
    await p.mouse.click(640,360);await L.frames(p,3);
    await p.waitForFunction(()=>!window.__jc.state.bossCut,null,{timeout:60000});
    L.check(true,'cut-in skippable / ends',fails);
    // shogun (wave 20)
    await p.evaluate(()=>window.__jc.skipToWave(20));
    const sg=await p.evaluate(()=>{let k=null;for(let i=0;i<20&&k!=='shogun';i++){k=window.__jc.untilBoss(30);if(k&&k!=='shogun'){/* skip */}}return k;});
    L.check(sg==='shogun','shogun cut-in triggers on wave 20 ('+sg+')',fails);
    if(mi===0){
      await p.evaluate(()=>{const G=window.__jc.G;});await p.waitForTimeout(250);await L.shot(p,'run_cutin_shogun_a');
      await p.waitForTimeout(500);await L.shot(p,'run_cutin_shogun_b');
    }
    await p.keyboard.press('Enter');await p.waitForFunction(()=>!window.__jc.state.bossCut,null,{timeout:60000});
    if(mi===0){await p.waitForTimeout(300);await L.shot(p,'run_shogun_fight');}
    // results
    if(mi===2){await p.evaluate(()=>window.__jc.lose());}else await p.evaluate(()=>window.__jc.win());
    await p.waitForFunction(()=>window.__jc.G&&window.__jc.G.resultT>1.6,null,{timeout:90000});
    st=await p.evaluate(()=>window.__jc.state);
    L.check(st.result===(mi===2?'lose':'win'),'map '+mi+' result '+st.result,fails);
    await L.shot(p,'run_result_map'+mi+'_'+st.result);
  }
  // reduced motion cut-in
  await p.evaluate(()=>{window.__jc.reducedMotion(true);window.__jc.startMap(0);window.__jc.skipToWave(5);});
  const r2=await p.evaluate(()=>window.__jc.untilBoss(30));
  L.check(r2==='ronin','reduced-motion cut-in still shows',fails);await p.waitForTimeout(300);await L.shot(p,'run_cutin_reduced');
  const sv=await p.evaluate(()=>({c:TD.save.cleared,b:TD.save.best,k:localStorage.getItem('inkElements.v1')!==null}));
  L.check(sv.c[0]&&sv.c[1]&&sv.k,'progress saved under inkElements.v1 '+JSON.stringify(sv),fails);
  L.check(errs.length===0,'no errors '+errs.join(' | '),fails);
  await b.close();s.close();
  console.log(fails.length?'RUN FAILED ('+fails.length+')':'RUN PASSED');process.exit(fails.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});

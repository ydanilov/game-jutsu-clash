// Run: start each map, fast-forward waves via window.__jc, trigger the Ronin and Shogun cut-ins, and both result screens.
const L=require('./lib');
(async()=>{
  const {s,url}=await L.serve();const b=await L.launch();const fails=[];
  const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];L.watch(p,errs);
  await p.addInitScript(()=>{try{localStorage.removeItem('inkElements.v1');}catch(e){}});
  await p.goto(url,{waitUntil:'commit'});await L.ready(p);
  await p.evaluate(()=>window.__jc.instant(true));
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

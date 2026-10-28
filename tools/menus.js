// Menus: title -> map select -> each map -> build each base tower -> upgrade -> fuse two -> codex -> pause -> settings -> quit.
// Screenshots of every state at desktop 1440x900 and mobile landscape 844x390 (touch) into tools/shots/.
const L=require('./lib');
async function run(b,url,vp,tag,touch,fails){
  console.log('== '+tag);
  const ctxo={viewport:vp,deviceScaleFactor:touch?2:1,hasTouch:!!touch,isMobile:!!touch};
  const c=await b.newContext(ctxo);const p=await c.newPage();const errs=[];L.watch(p,errs);
  await p.addInitScript(()=>{try{localStorage.removeItem('inkElements.v1');}catch(e){}});
  await p.goto(url,{waitUntil:'commit'});await L.ready(p);
  const S=n=>L.shot(p,'menus_'+tag+'_'+n);
  const tap=async(id,w)=>L.clickId(p,id,{touch,wait:w});
  const st=()=>p.evaluate(()=>window.__jc.state);
  await S('00_intro');
  await tap('start');await L.settle(p);await p.waitForTimeout(1200);await p.evaluate(()=>window.__jc.instant(true));
  L.check((await st()).screen==='title','intro -> title',fails);await S('01_title');
  // keyboard focus visible on title
  if(!touch){await p.keyboard.press('ArrowDown');await L.frames(p,8);await S('02_title_focus');await p.mouse.move(5,5);await p.mouse.move(400,300);}
  // hover state on PLAY (desktop)
  if(!touch){const c0=await p.evaluate(()=>window.__jc.center('play'));await p.mouse.move(c0.x,c0.y);await L.frames(p,12);await S('03_title_hover');}
  // empty codex
  await tap('codex');await L.settle(p);await p.waitForTimeout(400);L.check((await st()).screen==='codex','codex opens',fails);await S('04_codex_empty');
  await tap('back');await L.settle(p);
  await tap('settings');await L.settle(p);await p.waitForTimeout(400);L.check((await st()).screen==='settings','settings opens',fails);await S('05_settings');
  await tap('s_rm_on');L.check((await st()).RM===true,'reduced-motion toggle works',fails);await tap('s_rm_auto');
  await tap('back');await L.settle(p);
  await tap('how');await L.settle(p);await p.waitForTimeout(400);await S('06_help');await tap('back');await L.settle(p);
  await tap('play');await L.settle(p);await p.waitForTimeout(500);L.check((await st()).screen==='maps','map select opens',fails);await S('07_maps');
  // locked map: tapping does nothing
  await tap('map2');await p.waitForTimeout(300);L.check((await st()).screen==='maps','locked map stays on map select',fails);
  await p.evaluate(()=>window.__jc.unlockAll(true));await L.frames(p,4);await S('08_maps_unlocked');
  for(const mi of [0,1,2]){
    await tap('map'+mi,50);await L.settle(p);await p.waitForTimeout(1600);
    const s=await st();L.check(s.screen==='play'&&s.wave===0,'map '+mi+' starts',fails);
    await S('1'+mi+'_play_map'+mi);
    if(mi<2){await p.evaluate(()=>window.__jc.go('maps'));await p.waitForTimeout(400);}
  }
  // build each base tower by tapping tiles and the radial menu
  await p.evaluate(()=>window.__jc.gold(2000));
  const tiles=await p.evaluate(()=>window.__jc.freeTiles(5));
  const els=['fire','water','earth','air'];
  for(let i=0;i<4;i++){
    const t=tiles[i];const cc=await p.evaluate(t=>window.__jc.tileClient(t.tx,t.ty),t);
    if(touch)await p.touchscreen.tap(cc.x,cc.y);else await p.mouse.click(cc.x,cc.y);await L.frames(p,3);await p.waitForTimeout(350);
    if(i===0)await S('20_build_menu');
    if(i===0&&!touch){const h=await p.evaluate(()=>window.__jc.center('b_air'));await p.mouse.move(h.x,h.y);await L.frames(p,10);await S('21_build_hover');}
    await tap('b_'+els[i],200);
  }
  let s=await st();L.check(s.towers.length===4&&els.every(e=>s.towers.some(t=>t.type===e)),'built all four base towers',fails);
  // disabled state: no gold
  await p.evaluate(()=>window.__jc.gold(10));
  {const t=tiles[4];const cc=await p.evaluate(t=>window.__jc.tileClient(t.tx,t.ty),t);if(touch)await p.touchscreen.tap(cc.x,cc.y);else await p.mouse.click(cc.x,cc.y);await L.frames(p,3);await p.waitForTimeout(350);await S('22_build_disabled');
    await tap('b_fire');L.check((await st()).towers.length===4,'disabled build does nothing',fails);await p.keyboard.press('Escape');}
  await p.evaluate(()=>window.__jc.gold(2000));
  // upgrade tower 0
  const t0=s.towers[0];let cc=await p.evaluate(t=>window.__jc.tileClient(t.tx,t.ty),t0);
  if(touch)await p.touchscreen.tap(cc.x,cc.y);else await p.mouse.click(cc.x,cc.y);await L.frames(p,3);await p.waitForTimeout(350);await S('23_tower_menu');
  await tap('upg');s=await st();L.check(s.towers.find(t=>t.tx===t0.tx&&t.ty===t0.ty).up===1,'upgrade works',fails);
  // fuse via menu: FUSE then tap tower 1
  await tap('fus');L.check((await st()).fuseFrom,'fuse mode on',fails);await S('24_fuse_pick');
  const t1=s.towers[1];cc=await p.evaluate(t=>window.__jc.tileClient(t.tx,t.ty),t1);
  if(touch)await p.touchscreen.tap(cc.x,cc.y);else await p.mouse.click(cc.x,cc.y);await L.frames(p,3);await p.waitForTimeout(500);
  s=await st();L.check(s.towers.length===3&&s.codex.length===1,'fusion made ('+s.codex.join(',')+')',fails);await S('25_fused');
  // fuse by drag (desktop mouse only; touch drag uses the same pointer path)
  {const a=s.towers.find(t=>['earth','air'].includes(t.type)),bb=s.towers.find(t=>t!==a&&['earth','air'].includes(t.type));
   const ca=await p.evaluate(t=>window.__jc.tileClient(t.tx,t.ty),a),cb=await p.evaluate(t=>window.__jc.tileClient(t.tx,t.ty),bb);
   if(!touch){await p.mouse.move(ca.x,ca.y);await p.mouse.down();await p.mouse.move((ca.x+cb.x)/2,(ca.y+cb.y)/2,{steps:6});await p.mouse.move(cb.x,cb.y,{steps:6});await L.frames(p,6);await S('26_drag_fuse');await p.mouse.up();}
   else{const cdp=await c.newCDPSession(p);const tp=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});await tp('touchStart',ca.x,ca.y);for(let k=1;k<=10;k++)await tp('touchMove',ca.x+(cb.x-ca.x)*k/10,ca.y+(cb.y-ca.y)*k/10);await L.frames(p,6);await S('26_drag_fuse');await tp('touchEnd');}
   await p.waitForTimeout(400);s=await st();L.check(s.towers.length===2&&s.codex.length===2,'drag fusion made ('+s.codex.join(',')+')',fails);}
  // ultimate + wave button states
  await tap('next',300);await p.waitForTimeout(800);await S('27_wave1');
  // pause, settings, quit
  await tap('pause',300);L.check((await st()).paused,'pause opens',fails);await p.waitForTimeout(300);await S('30_pause');
  if(!touch){await p.keyboard.press('ArrowDown');await L.frames(p,6);await S('31_pause_focus');}
  await tap('psettings',300);await S('32_pause_settings');await tap('s_ui_large',300);await S('33_pause_settings_large');await tap('s_ui_auto',200);
  await tap('pset_back',200);await tap('quit');await L.settle(p);await p.waitForTimeout(400);
  L.check((await st()).screen==='maps','quit to map select',fails);
  await p.evaluate(()=>window.__jc.go('codex'));await p.waitForTimeout(500);await S('34_codex_found');
  // stage fits viewport
  const ov=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight,iw:innerWidth,ih:innerHeight}));
  L.check(ov.sw<=ov.iw&&ov.sh<=ov.ih,'no page overflow '+JSON.stringify(ov),fails);
  L.check(errs.length===0,'no errors '+errs.join(' | '),fails);
  await c.close();
}
(async()=>{
  const {s,url}=await L.serve();const b=await L.launch();const fails=[];
  const only=process.argv[2];
  if(!only||only==='desktop')await run(b,url,{width:1440,height:900},'desktop',false,fails);
  if(!only||only==='mobile')await run(b,url,{width:844,height:390},'mobile',true,fails);
  await b.close();s.close();
  console.log(fails.length?'MENUS FAILED ('+fails.length+')':'MENUS PASSED');process.exit(fails.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});

// Level 3 fusions + tower growth: fuse a mix with a base tower, check the result, the form changes, the new attack kinds and the codex tab.
const L=require('./lib.js');
(async()=>{
  const {s,url}=await L.serve();const b=await L.launch();const p=await b.newPage({viewport:{width:1280,height:720}});const errs=[],fails=[];L.watch(p,errs);
  await p.goto(url,{waitUntil:'commit'});await L.ready(p);
  await p.evaluate(()=>{window.__jc.video(false);window.__jc.instant&&window.__jc.instant(true);window.__jc.seenAll&&window.__jc.seenAll();window.__jc.startMap(0);window.__jc.gold(99999);});
  await L.settle(p);
  const r=await p.evaluate(()=>{const TD=window.TD,G=TD.G,ft=[];for(let y=0;y<G.grid.length;y++)for(let x=0;x<G.grid[0].length;x++){if(!TD.tileFree(x,y))continue;let n=0;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const q=G.grid[y+dy]&&G.grid[y+dy][x+dx];if(q&&q.road)n++;}ft.push({tx:x,ty:y,n});}ft.sort((p,q)=>q.n-p.n);const pickd=[];for(const c of ft){if(pickd.every(o=>Math.abs(o.tx-c.tx)+Math.abs(o.ty-c.ty)>1))pickd.push(c);if(pickd.length>=12)break;}ft.length=0;ft.push(...pickd);const at=i=>G.grid[ft[i].ty][ft[i].tx].tower;
    TD.build(ft[0].tx,ft[0].ty,'fire');TD.build(ft[1].tx,ft[1].ty,'water');TD.fuse(at(0),at(1));// steam
    const steam=G.towers.find(t=>t.type==='steam');TD.build(ft[2].tx,ft[2].ty,'earth');const ok1=TD.fuse(steam,at(2));// dragon
    const dragon=G.towers.find(t=>t.type==='dragon');
    TD.build(ft[3].tx,ft[3].ty,'water');TD.build(ft[4].tx,ft[4].ty,'water');TD.fuse(at(3),at(4));const wh=G.towers.find(t=>t.type==='whirl');TD.build(ft[5].tx,ft[5].ty,'air');TD.fuse(at(5),wh);// rain (base dragged onto mix)
    TD.build(ft[6].tx,ft[6].ty,'fire');TD.build(ft[7].tx,ft[7].ty,'earth');TD.fuse(at(6),at(7));const mg=G.towers.find(t=>t.type==='magma');TD.build(ft[8].tx,ft[8].ty,'air');TD.fuse(mg,at(8));// meteor
    const bad=TD.fuse(dragon,G.towers.find(t=>t.type==='rain'));
    TD.build(ft[9].tx,ft[9].ty,'earth');const e=at(9);
    return {types:G.towers.map(t=>t.type).sort(),ok1,bad,codex:TD.save.codex.slice()};});
  console.log(JSON.stringify(r));
  L.check(r.types.includes('dragon')&&r.types.includes('rain')&&r.types.includes('meteor'),'mix + base makes level 3 towers',fails);
  L.check(!r.bad,'two level 3 towers do not fuse',fails);
  L.check(r.codex.includes('dragon')&&r.codex.includes('rain'),'level 3 towers go into the codex',fails);
  await p.evaluate(()=>window.__jc.clearCuts());await L.frames(p,8);await L.shot(p,'l3_built');
  // grow the earth tower through its forms
  const tiers=[];for(const n of [1,2,3,3]){await p.evaluate(n=>{const G=window.TD.G,t=G.towers.find(x=>x.type==='earth');for(let i=0;i<n;i++)window.TD.upgrade(t);},n);await L.frames(p,4);tiers.push(await p.evaluate(()=>{const t=window.TD.G.towers.find(x=>x.type==='earth');return t.up;}));}
  L.check(tiers[tiers.length-1]>=9,'earth tower powered up to '+tiers.join(','),fails);
  await p.evaluate(()=>{const G=window.TD.G;for(const t of G.towers)if(window.TD.T[t.type].tri)for(let i=0;i<3;i++)window.TD.upgrade(t);});
  await L.frames(p,6);await L.shot(p,'l3_forms');
  // fight a few waves so storm / ray / beam kinds fire
  const hp=await p.evaluate(()=>{window.__jc.clearCuts();window.__jc.skipToWave(1);window.TD.sim(45);window.__jc.clearCuts();window.__jc.skipToWave(2);window.TD.sim(45);return {hp:window.__jc.state.hp,dealt:window.TD.G.towers.map(t=>[t.type,Math.round(t.dealt||0)])};});
  console.log(JSON.stringify(hp));
  const solo=await p.evaluate(()=>{const out={};for(const ty of ['rain','meteor','sun','dragon','forge','hurricane','tsunami']){window.__jc.startMap(0);window.__jc.gold(99999);const TD=window.TD,G=TD.G;let best=null;for(let y=0;y<G.grid.length;y++)for(let x=0;x<G.grid[0].length;x++){if(!TD.tileFree(x,y))continue;let n=0;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const q=G.grid[y+dy]&&G.grid[y+dy][x+dx];if(q&&q.road)n++;}if(!best||n>best.n)best={x,y,n};}
    TD.build(best.x,best.y,'water');G.towers[0].type=ty;window.__jc.clearCuts();window.__jc.skipToWave(1);TD.sim(40);out[ty]=Math.round(G.towers[0].dealt||0);}return out;});
  console.log(JSON.stringify(solo));
  L.check(Object.values(solo).every(v=>v>0),'every level 3 attack kind hits (storm, ray, beam, pierce, multi, lob)',fails);
  await p.evaluate(()=>window.__jc.clearCuts());await L.frames(p,6);await L.shot(p,'l3_fight');
  await p.evaluate(()=>window.__jc.go('codex'));await L.settle(p);await L.clickId(p,'tab_tri');await L.frames(p,6);await L.shot(p,'l3_codex');
  L.check(errs.length===0,'no errors '+errs.slice(0,3).join(' | '),fails);
  console.log(fails.length?'LEVEL3 FAILED ('+fails.length+')':'LEVEL3 PASSED');await b.close();s.close();process.exit(fails.length?1:0);
})();

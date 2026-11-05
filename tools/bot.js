// Balance bot: the same greedy player on every map. Builds where a tower covers the most road
// (spirit stones count), mixes elements, fuses pairs, powers up, calls waves when the road is clear.
// node bot.js [mapIndex...]  -> prints wave reached / shrine HP per map
const L=require('./lib');
(async()=>{
  const {s,url}=await L.serve();const b=await L.launch();
  const p=await b.newPage({viewport:{width:960,height:540}});const errs=[];L.watch(p,errs);
  await p.addInitScript(()=>{try{localStorage.removeItem('inkElements.v1');}catch(e){}});
  await p.goto(url,{waitUntil:'commit'});await L.ready(p);
  await p.evaluate(()=>{window.__jc.instant(true);window.__jc.video(false);window.__jc.unlockAll();window.__jc.seenAll&&window.__jc.seenAll();});
  const maps=process.argv.slice(2).length?process.argv.slice(2).map(Number):[0,1,2,3];
  for(const mi of maps){
    const r=await p.evaluate(mi=>{
      const TD=window.TD;TD.start(mi);const G=()=>TD.G,T=TD.T,TS=40,tc=i=>20+TS*i;
      const road=[];for(let j=0;j<18;j++)for(let i=0;i<32;i++)if(G().grid[j][i].road)road.push([i,j]);
      const cover=(i,j,rg)=>{let n=0;for(const [a,c] of road)if(Math.hypot(tc(a)-tc(i),tc(c)-tc(j))<=rg)n++;return n;};
      const els=['earth','fire','water','air','earth','fire','air','water'];let k=0;const log=[];
      const spend=()=>{
        for(let guard=0;guard<40;guard++){const g=G();const type=els[k%els.length],c=T[type].cost;
          // fuse two base towers of a known-good pair when both exist
          const base=g.towers.filter(t=>T[t.type].cost);
          if(base.length>=6){const a=base.find(t=>t.type==='fire'),bb=base.find(t=>t.type==='air'),e1=base.filter(t=>t.type==='earth');
            if(a&&bb){TD.fuse(a,bb);continue;}if(e1.length>=2){TD.fuse(e1[0],e1[1]);continue;}}
          const ups=g.towers.filter(t=>!T[t.type].cost).sort((x,y)=>x.up-y.up);
          const wantBuild=g.towers.length<10+g.wave*0.6;
          if(wantBuild&&g.gold>=c){let best=null,bs=-1;for(let j=0;j<18;j++)for(let i=0;i<32;i++){if(!TD.tileFree(i,j))continue;const sc=cover(i,j,T[type].range)*(g.stones&&g.stones.has(i+','+j)?1.35:1);if(sc>bs){bs=sc;best=[i,j];}}
            if(best&&TD.build(best[0],best[1],type)){k++;continue;}}
          const u=(ups[0]||g.towers.slice().sort((x,y)=>x.up-y.up)[0]);if(u){const cost=Math.round((T[u.type].cost?T[u.type].cost*0.75:110)*Math.pow(1.35,u.up)/5)*5;if(g.gold>=cost+(wantBuild?c:0)){TD.upgrade(u);continue;}}
          break;}
      };
      for(let w=0;w<20&&!G().result;w++){spend();TD.callWave();let t=0;while(!G().result&&(G().spawners.length||G().enemies.length)&&t<400){TD.sim(2);t+=2;if(G().ult.charge>=TD.ultNeed()){const e=G().enemies.slice().sort((a,b)=>(a.P.L-a.d)-(b.P.L-b.d))[0];if(e)TD.fireUlt(TD.curUlt(),e.x,e.y);}spend();}
        log.push(G().hp);}
      return {map:TD.MAPS[mi].name,wave:G().wave,hp:Math.round(G().hp),result:G().result,towers:G().towers.length,onStones:G().towers.filter(t=>t.stone).length,hpLog:log.join(',')};
    },mi);
    console.log(JSON.stringify(r));
  }
  console.log(errs.slice(0,8).join('\n')||'no errors');
  await b.close();s.close();
})();

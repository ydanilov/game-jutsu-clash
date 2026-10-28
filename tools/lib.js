// Shared Playwright helpers: static server for the repo root, Chromium launch (swiftshader), error capture.
const http=require('http'),fs=require('fs'),path=require('path');
const { chromium } = require('playwright');
const ROOT=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.css':'text/css','.json':'application/json'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{const u=decodeURIComponent(q.url.split('?')[0]);if(u==='/favicon.ico'){r.writeHead(204);r.end();return;}const f=path.join(ROOT,u);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end('nf');return;}r.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r);});s.listen(0,()=>res({s,url:'http://localhost:'+s.address().port+'/tools/test.html'}));});}
function exe(){const c=['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'];for(const p of c)if(fs.existsSync(p))return p;return undefined;}
async function launch(){return chromium.launch({executablePath:exe(),args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});}
function watch(page,errs){
  page.on('crash',()=>console.log('  !! renderer crashed (environment)'));page.on('close',()=>console.log('  !! page closed'));
  page.on('pageerror',e=>errs.push('PAGEERR '+e.message+' @ '+(e.stack||'').split('\n').slice(1,3).join(' ')));
  page.on('console',m=>{if(m.type()==='error'){const t=m.text();if(/fonts\.(googleapis|gstatic)|ERR_|net::/.test(t))return;errs.push('CONSOLE '+t);}});
  // fonts load from Google when online; set JC_OFFLINE=1 to block them (the game falls back to system fonts)
  if(process.env.JC_OFFLINE)page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
}
async function ready(page){await page.evaluate(()=>document.fonts&&document.fonts.ready).catch(()=>{});await page.waitForFunction(()=>window.__jc&&window.__jc.state&&Object.values(window.__jc.state.art).every(v=>v!=='pending'),null,{timeout:90000});await page.waitForTimeout(400);}
const SHOTS=path.join(__dirname,'shots');fs.mkdirSync(SHOTS,{recursive:true});
const shot=(page,name)=>page.screenshot({path:path.join(SHOTS,name+'.png')});
async function clickId(page,id,o={}){await page.waitForFunction(i=>!!window.__jc.center(i),id,{timeout:60000}).catch(()=>{});const c=await page.evaluate(i=>window.__jc.center(i),id);if(!c)throw new Error('no control '+id+' on '+(await page.evaluate(()=>window.__jc.state.screen)));if(o.touch)await page.touchscreen.tap(c.x,c.y);else await page.mouse.click(c.x,c.y);await frames(page,3);if(o.wait)await page.waitForTimeout(o.wait);}
async function frames(page,n){await page.evaluate(n=>new Promise(r=>{let k=0;const f=()=>{if(++k>=n)r();else requestAnimationFrame(f);};requestAnimationFrame(f);}),n||3);}
async function settle(page){await page.waitForFunction(()=>!window.__jc.state.curtain,null,{timeout:90000});await frames(page,4);}
function check(cond,msg,fails){if(!cond){fails.push(msg);console.log('  FAIL',msg);}else console.log('  ok',msg);}
// skip whatever cut-in is showing (click/tap the middle) and wait until play resumes
async function skipCut(page,touch){for(let i=0;i<8;i++){const st=await page.evaluate(()=>window.__jc.state);if(!st.cut&&!st.cutin)return;const c=await page.evaluate(()=>window.__jc.toClient(window.__jc.state.VW/2,window.__jc.state.VH/2));if(touch)await page.touchscreen.tap(c.x,c.y);else await page.mouse.click(c.x,c.y);for(let k=0;k<12;k++){await frames(page,2);const s2=await page.evaluate(()=>window.__jc.state);if(!s2.cut&&!s2.cutin)return;}}}
async function waitCut(page,kind){await page.waitForFunction(k=>window.__jc.state.cut===k||window.__jc.state.cutin===k,kind,{timeout:90000});await frames(page,6);}
module.exports={skipCut,waitCut,serve,launch,watch,ready,shot,clickId,frames,settle,check,SHOTS};

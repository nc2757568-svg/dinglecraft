#!/usr/bin/env node
/* mobile_qa.mjs (game 7.0, the iPhone fixes): the MUTED phone check of a built html, on an iPhone-sized touch screen in Chrome's
   device emulation. It is not Safari: a real iPhone is still the final word (docs/QA.md, "Phones").

   node tools/qa/ui/mobile_qa.mjs --launch [--port 9441] [--profile DIR] [--build dist/dinglecraft_v<VER>.html] [--out DIR]
   node tools/qa/ui/mobile_qa.mjs --port 9441 [--server 9541] ...      (your own Chrome + server already running)

   --launch starts YOUR OWN headless Chrome (tools/qa/chrome.sh, --mute-audio; set CHROME, and on a machine without a GPU point it
   at a wrapper that adds --use-angle=swiftshader --enable-unsafe-swiftshader) and scripts/serve.mjs on port+100, and stops both.
   For a phone held upright (390x664, DPR 3) and on its side (750x342, DPR 3, a 47 px notch inset each side, a 21 px home indicator):
   - the page loads with touch on (body.touch), sound off and no console error; the boot gate is down; every main-menu button is
     the element under its own centre
   - real touch taps go through the first-run intro, Create New World and Create World (world "mobileqa"): a world starts
   - the HUD: all nine hotbar slots inside the window and under their own centres, clear of the touch controls and the XP badge; a
     tap on slot 9 selects it
   - the touch controls: inside the window and the safe area, under their own centres; a drag on the view turns the camera, the
     joystick walks, INV opens the inventory and its close button closes it, the pause button pauses and Resume resumes
   Then, with JavaScript off (what a file preview does): the loading line and the <noscript> note show and no menu button does.
   MUTED, always (tools/qa/lib/cdp.mjs): --mute-audio, vx_vox_settings {snd:0,mus:0,tp:'og'} before the page runs, soundOn=false
   and AC.suspend() on every evaluation, rAF frozen (frames move only through __vox.frameStep), the brain on a dead port, tp:'og'
   restored at the end. Shots + summary.json in --out (default out/qa/mobile_qa_<time>/). Exit 1 on any failed check. */
import fs from 'fs';import path from 'path';import {spawn,execFileSync} from 'child_process';
import {args,connect,REPO,defaultBuild,outDir,rel} from '../lib/cdp.mjs';

const A=args(),PORT=+(A.port||9441),SRV=+(A.server||PORT+100),BUILD=A.build||defaultBuild();
const OUT=path.resolve(A.out||outDir('mobile_qa'));fs.mkdirSync(OUT,{recursive:true});
if(!fs.existsSync(path.join(REPO,BUILD))){console.log(`mobile_qa: ${BUILD} not found: run \`npm run build\` first`);process.exit(2);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const kids=[];
const stopKids=()=>{for(const k of kids){try{process.kill(k.pid,'SIGTERM');}catch(e){}}};
process.on('exit',stopKids);process.on('SIGINT',()=>{stopKids();process.exit(130);});
if(A.launch){
  const prof=path.resolve(A.profile||path.join(REPO,'out','qa','chrome_'+PORT));
  kids.push({pid:+execFileSync(path.join(REPO,'tools','qa','chrome.sh'),[String(PORT),prof],{encoding:'utf8'}).trim()});
  kids.push({pid:spawn(process.execPath,[path.join(REPO,'scripts','serve.mjs'),'--port',String(SRV)],{cwd:REPO,stdio:'ignore'}).pid});
  for(let i=0;i<50;i++){try{if(await fetch(`http://127.0.0.1:${SRV}/`))break;}catch(e){}await sleep(100);}
}
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const DEVS=[{name:'portrait',w:390,h:664,dpr:3,mobile:true,touch:true,ua:UA,insets:{top:0,right:0,bottom:0,left:0}},
  {name:'landscape',w:750,h:342,dpr:3,mobile:true,touch:true,ua:UA,insets:{top:0,right:47,bottom:21,left:47}}];
const checks=[],shots=[];
const check=(name,cond,info)=>{checks.push({name,ok:!!cond,info:info===undefined?null:info});console.log((cond?'ok   ':'FAIL ')+name+(info!==undefined?'  '+JSON.stringify(info).slice(0,300):''));};
const C=await connect(PORT);
const shot=async name=>{const f=path.join(OUT,String(shots.length+1).padStart(2,'0')+'_'+name+'.jpg');await C.shot(f);shots.push(f);};
const errs=()=>C.logs.filter(l=>/^(error|exception)/.test(l));
const T=async(type,pts)=>C.send('Input.dispatchTouchEvent',{type,touchPoints:pts});
const tap=async(x,y)=>{await T('touchStart',[{x,y,id:1}]);await sleep(40);await T('touchEnd',[]);await sleep(150);};
const mid=id=>C.ev(`const e=document.getElementById(${JSON.stringify(id)}),r=e.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2];`);
const tapId=async id=>{const [x,y]=await mid(id);await tap(x,y);};
/* in-page helpers: frames with strictly increasing timestamps; is an element the one under its own centre, inside a box */
const HELP=`window.__mq={T:900000,stp(n){for(let i=0;i<(n||1);i++){this.T+=40;__vox.frameStep(this.T);}},
  hit(e){const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !!h&&(h===e||e.contains(h));},
  inside(e,i){const r=e.getBoundingClientRect();return r.width>0&&r.left>=i.left-0.5&&r.top>=i.top-0.5&&r.right<=innerWidth-i.right+0.5&&r.bottom<=innerHeight-i.bottom+0.5;},
  over(a,b){const r=a.getBoundingClientRect(),s=b.getBoundingClientRect();return r.left<s.right&&s.left<r.right&&r.top<s.bottom&&s.top<r.bottom;}};`;

for(const D of DEVS){
  const n0=C.logs.length;
  await C.open(`http://127.0.0.1:${SRV}/${BUILD}?b=${Date.now()}`,D);
  await C.ev(HELP);
  const L=await C.ev(`return {touch:document.body.classList.contains('touch'),sound:soundOn,inner:[innerWidth,innerHeight],gate:document.getElementById('title').classList.contains('tboot'),
    menu:['t_go_new','t_go_load','t_help','t_reddit','t_credits'].map(id=>[id,__mq.inside(document.getElementById(id),{top:0,right:0,bottom:0,left:0})]),
    intro:getComputedStyle(document.getElementById('rpintro')).display!=='none'}`);
  check(`${D.name}: loads ${L.inner.join('x')} with touch on and sound off, the boot gate down`,L.touch&&L.sound===false&&!L.gate&&L.inner[0]===D.w,L);
  await shot(D.name+'_title');
  if(L.intro){await tapId('rp_ok');check(`${D.name}: a tap on Let’s go closes the first-run intro`,await C.ev(`return getComputedStyle(document.getElementById('rpintro')).display==='none'`));}
  const M=await C.ev(`return ['t_go_new','t_go_load','t_help','t_reddit','t_credits'].map(id=>[id,__mq.hit(document.getElementById(id))])`);
  check(`${D.name}: every main-menu button is the element under its own centre (nothing covers it)`,M.every(m=>m[1]),M);
  await tapId('t_go_new');
  check(`${D.name}: a tap on Create New World opens it`,await C.ev(`return __vox.getTM().view==='new'`));
  await C.ev(`document.getElementById('t_name').value='mobileqa';document.getElementById('t_new').scrollIntoView({block:'center'});`);
  await tapId('t_new');
  await C.ev(`__mq.stp(160);__vox.GR.mobSpawn=false;if(paused)resumeGame();__mq.stp(30);`);
  const W=await C.ev(`return {playing:__vox.playing,title:getComputedStyle(document.getElementById('title')).display,world:__vox.getWORLD?__vox.getWORLD().name:null}`);
  check(`${D.name}: a tap on Create World starts a world`,W.playing===true&&W.title==='none',W);
  const H=await C.ev(`const s=[...document.querySelectorAll('#hotbar .hslot')],ids=['joy','btnjump','btnsneak','btndrop','btninv','btnpause'];
    return {n:s.length,inside:s.map(e=>__mq.inside(e,{top:0,right:0,bottom:0,left:0})),hit:s.map(e=>__mq.hit(e)),
      clear:ids.every(id=>s.every(e=>!__mq.over(document.getElementById(id),e))),
      xp:(x=>!!x&&x.getClientRects().length>0&&s.every(e=>!__mq.over(x,e))&&ids.every(id=>!__mq.over(x,document.getElementById(id)))&&__mq.inside(x,{top:0,right:0,bottom:0,left:0}))(document.getElementById('xp')),hud:getComputedStyle(document.documentElement).getPropertyValue('--uih').trim()}`);
  check(`${D.name}: all nine hotbar slots inside the window (HUD scale ${H.hud})`,H.n===9&&H.inside.every(Boolean),H.inside);
  check(`${D.name}: every hotbar slot is the element under its own centre, and no touch control covers one`,H.hit.every(Boolean)&&H.clear,{hit:H.hit,clear:H.clear});
  check(`${D.name}: the XP badge is on screen, off the hotbar and off every touch control`,H.xp===true);
  {const [x,y]=await C.ev(`const r=document.querySelectorAll('#hotbar .hslot')[8].getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]`);
    await tap(x,y);check(`${D.name}: a tap on hotbar slot 9 selects it`,await C.ev(`return __vox.P.sel===8`));}
  const B=await C.ev(`const i=${JSON.stringify(D.insets)};return ['joy','btnjump','btnsneak','btndrop','btninv','btnpause'].map(id=>{const e=document.getElementById(id);return [id,__mq.inside(e,i),__mq.hit(e)];})`);
  check(`${D.name}: the touch controls sit inside the safe area ${JSON.stringify(D.insets)}`,B.every(b=>b[1]),B);
  check(`${D.name}: every touch control is the element under its own centre`,B.every(b=>b[2]),B);
  await shot(D.name+'_world');
  {const y0=await C.ev(`return __vox.P.yaw`),x=D.w*0.6,y=D.h*0.35;await T('touchStart',[{x,y,id:7}]);
    for(let k=1;k<=8;k++){await T('touchMove',[{x:x-k*10,y,id:7}]);await sleep(16);}await T('touchEnd',[]);await sleep(80);
    const y1=await C.ev(`return __vox.P.yaw`);check(`${D.name}: a drag on the view turns the camera`,Math.abs(y1-y0)>0.2,{from:+y0.toFixed(3),to:+y1.toFixed(3)});}
  {const [x,y]=await mid('joy');await T('touchStart',[{x,y,id:3}]);await T('touchMove',[{x,y:y-40,id:3}]);
    const f=await C.ev(`return __vox.TOUCH.f`);await T('touchEnd',[]);await sleep(50);const f0=await C.ev(`return __vox.TOUCH.f`);
    check(`${D.name}: the joystick walks forward and lets go`,f>0.5&&f0===0,{held:f,released:f0});}
  await tapId('btninv');const inv=await C.ev(`return modalOpen()`);await shot(D.name+'_inventory');
  await tapId('mclose');const invc=await C.ev(`return !modalOpen()`);
  check(`${D.name}: INV opens the inventory and its close button closes it`,inv===true&&invc===true,{open:inv,closed:invc});
  await tapId('btnpause');const pz=await C.ev(`return paused`);await shot(D.name+'_pause');
  await tapId('p_resume');const rz=await C.ev(`return !paused`);
  check(`${D.name}: the pause button pauses and Resume resumes`,pz===true&&rz===true,{paused:pz,resumed:rz});
  const E=C.logs.slice(n0).filter(l=>/^(error|exception)/.test(l));
  check(`${D.name}: no console error or exception`,E.length===0,E.slice(0,5));
  await C.ev(`try{__vox.quitToTitle();}catch(e){}`);
}
/* JavaScript off: a file preview shows the page without running it */
await C.send('Emulation.setScriptExecutionDisabled',{value:true});
await C.send('Page.navigate',{url:`http://127.0.0.1:${SRV}/${BUILD}?b=${Date.now()}`});
for(let i=0;i<200;i++){await sleep(250);try{const r=await C.send('Runtime.evaluate',{expression:'document.readyState',returnByValue:true});if(r.result&&r.result.result&&r.result.result.value==='complete')break;}catch(e){}}
const N=(await C.send('Runtime.evaluate',{expression:`(()=>{const v=id=>{const e=document.getElementById(id);return !!e&&e.getClientRects().length>0;};
  const ns=[...document.querySelectorAll('#tboot p')].filter(p=>p.getClientRects().length&&/JavaScript is not running/.test(p.textContent)).length;
  return {gate:v('tboot'),menu:v('tmain'),buttons:['t_go_new','t_go_load','t_help'].some(v),msg:v('tboot_msg'),noscript:ns};})()`,returnByValue:true})).result.result.value;
check('JavaScript off (a file preview): the loading box and the <noscript> note show, no menu button does',N&&N.gate&&!N.menu&&!N.buttons&&!N.msg&&N.noscript===1,N);
await shot('noscript_title');
await C.send('Emulation.setScriptExecutionDisabled',{value:false});
await C.open(`http://127.0.0.1:${SRV}/${BUILD}?b=${Date.now()}`);await C.restoreOG();
const tp=await C.ev(`return JSON.parse(localStorage.getItem('vx_vox_settings')||'{}').tp`);
check("vx_vox_settings tp restored to 'og'",tp==='og',tp);
const pass=checks.filter(c=>c.ok).length,fail=checks.length-pass;
fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify({build:BUILD,pass,fail,checks,shots:shots.map(rel)},null,1));
console.log(`mobile_qa: ${pass} passed, ${fail} failed; shots + summary.json in ${rel(OUT)}`);
C.close();stopKids();process.exit(fail?1:0);

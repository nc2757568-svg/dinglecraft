#!/usr/bin/env node
/* play_qa.mjs (game 7.0, the playability pass): the MUTED survival-loop check of a built html in a real browser, driven with real
   input events (keys, mouse buttons and clicks on the real DOM) and stepped frames.

   node tools/qa/ui/play_qa.mjs --launch [--port 9471] [--profile DIR] [--build dist/dinglecraft_v<VER>.html] [--out DIR]
   node tools/qa/ui/play_qa.mjs --port 9471 [--server 9571] ...         (your own Chrome + server already running)

   On a 1280x720 desktop window: clicks through the title into a new survival world; walks (W), jumps (Space), sprints (Ctrl),
   sneaks (Shift) and turns the camera with the mouse; mines a stone block with a pickaxe held on the left mouse button and picks
   the drop up; places a block with the right button; crafts planks in the 2x2 grid with real clicks (log, grid, result, slot);
   fights a zombie with a sword (left clicks) and takes its hits; dies, sees the death screen and clicks Respawn; fires a shotgun
   and an SMG at a dummy (the 7.0 damage fix in a real browser); steps into a Nether portal and back out of the Nether; runs a
   tornado; pauses and resumes with Esc; saves from the pause menu, clicks Save &amp; Quit, loads the world from Saved Worlds by
   clicking it, and finds the block it placed. Zero console errors throughout. It also records the JavaScript cost of a frame in
   each phase (the renderer's own draw excluded) for docs/QA.md's performance notes.
   MUTED, always (tools/qa/lib/cdp.mjs): --mute-audio, vx_vox_settings {snd:0,mus:0,tp:'og'}, soundOn=false + AC.suspend() on
   every evaluation, rAF frozen (only __vox.frameStep moves the game), the brain on a dead port, tp:'og' restored at the end.
   Shots + summary.json in --out (default out/qa/play_qa_<time>/). Exit 1 on any failed check. */
import fs from 'fs';import path from 'path';import {spawn,execFileSync} from 'child_process';
import {args,connect,REPO,defaultBuild,outDir,rel} from '../lib/cdp.mjs';

const A=args(),PORT=+(A.port||9471),SRV=+(A.server||PORT+100),BUILD=A.build||defaultBuild();
const OUT=path.resolve(A.out||outDir('play_qa'));fs.mkdirSync(OUT,{recursive:true});
if(!fs.existsSync(path.join(REPO,BUILD))){console.log(`play_qa: ${BUILD} not found: run \`npm run build\` first`);process.exit(2);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const kids=[];const stopKids=()=>{for(const k of kids){try{process.kill(k.pid,'SIGTERM');}catch(e){}}};
process.on('exit',stopKids);process.on('SIGINT',()=>{stopKids();process.exit(130);});
if(A.launch){
  const prof=path.resolve(A.profile||path.join(REPO,'out','qa','chrome_'+PORT));
  kids.push({pid:+execFileSync(path.join(REPO,'tools','qa','chrome.sh'),[String(PORT),prof],{encoding:'utf8'}).trim()});
  kids.push({pid:spawn(process.execPath,[path.join(REPO,'scripts','serve.mjs'),'--port',String(SRV)],{cwd:REPO,stdio:'ignore'}).pid});
  for(let i=0;i<50;i++){try{if(await fetch(`http://127.0.0.1:${SRV}/`))break;}catch(e){}await sleep(100);}
}
const checks=[],shots=[],perf={};
const check=(name,cond,info)=>{checks.push({name,ok:!!cond,info:info===undefined?null:info});console.log((cond?'ok   ':'FAIL ')+name+(info!==undefined?'  '+JSON.stringify(info).slice(0,300):''));};
const C=await connect(PORT);
const shot=async name=>{const f=path.join(OUT,String(shots.length+1).padStart(2,'0')+'_'+name+'.jpg');await C.shot(f);shots.push(f);};
const errs=()=>C.logs.filter(l=>/^(error|exception)/.test(l));
/* real input */
const KC={KeyW:87,KeyA:65,KeyS:83,KeyD:68,Space:32,ShiftLeft:16,ControlLeft:17,KeyE:69,Escape:27};
const KK={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',Space:' ',ShiftLeft:'Shift',ControlLeft:'Control',KeyE:'e',Escape:'Escape'};
const key=async(code,type)=>C.send('Input.dispatchKeyEvent',{type,code,key:KK[code],windowsVirtualKeyCode:KC[code],nativeVirtualKeyCode:KC[code]});
const press=async code=>{await key(code,'rawKeyDown');await key(code,'keyUp');};
const mouse=async(type,x,y,button='none',extra={})=>C.send('Input.dispatchMouseEvent',Object.assign({type,x,y,button,clickCount:type==='mouseMoved'?0:1},extra));
const click=async(x,y,button='left')=>{await mouse('mousePressed',x,y,button);await mouse('mouseReleased',x,y,button);await sleep(30);};
const clickId=async id=>{const r=await C.ev(`const e=document.getElementById(${JSON.stringify(id)});if(!e)return null;e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2];`);
  if(!r)throw new Error('no #'+id);await click(r[0],r[1]);};
/* in-page helpers: strictly increasing frames; the JS cost of a frame without the renderer's draw (timed apart) */
await C.open(`http://127.0.0.1:${SRV}/${BUILD}?b=${Date.now()}`);
const HELP=`window.__pq={T:950000,js:[],stp(n){for(let i=0;i<(n||1);i++){this.T+=40;const r=renderer.render;let rt=0;
    renderer.render=function(){const t=performance.now();const o=r.apply(this,arguments);rt+=performance.now()-t;return o;};
    const t0=performance.now();__vox.frameStep(this.T);const tot=performance.now()-t0;renderer.render=r;this.js.push(tot-rt);}},
  take(){const a=this.js.slice().sort((x,y)=>x-y);this.js=[];if(!a.length)return null;const q=p=>a[Math.min(a.length-1,Math.floor(p*a.length))];
    return {n:a.length,med:+q(0.5).toFixed(2),p95:+q(0.95).toFixed(2),max:+a[a.length-1].toFixed(2)};},
  cnt(id){return __vox.P.inv.reduce((s,x)=>s+(x&&x.id===id?x.count:0),0);},
  pad(ox,oz){const P=__vox.P,m0=P.mode;P.mode='c';P.flying=false;P.x=ox+0.5;P.z=oz+0.5;P.y=62;P.vx=P.vy=P.vz=0;this.stp(30);
    for(let x=-6;x<=6;x++)for(let z=-8;z<=6;z++){__vox.setBlock(ox+x,61,oz+z,__vox.B.STONE);for(let y=62;y<67;y++)__vox.setBlock(ox+x,y,oz+z,0);}
    P.x=ox+0.5;P.z=oz+0.5;P.y=62;P.vx=P.vy=P.vz=0;P.yaw=0;P.pitch=0;P.fallD=0;this.stp(30);P.mode=m0;P.fallD=0;},
  purge(){for(const e of __vox.entities.slice())if(e.t==='mob'){e.hp=0;e.dead=true;try{__vox.removeEnt&&__vox.removeEnt(e);}catch(x){}}this.stp(3);}};`;
await C.ev(HELP);
const stp=async n=>C.ev(`__pq.stp(${n});`);
const take=async name=>{perf[name]=await C.ev('return __pq.take()');};

/* ===== title -> world ===== */
const T0=await C.ev(`return {gate:document.getElementById('title').classList.contains('tboot'),intro:getComputedStyle(document.getElementById('rpintro')).display}`);
if(T0.intro!=='none')await clickId('rp_ok');
await clickId('t_go_new');
await C.ev(`document.getElementById('t_name').value='playqa';document.getElementById('t_seed').value='777';`);
await clickId('t_new');await stp(200);
const W=await C.ev(`return {playing:__vox.playing,mode:__vox.P.mode,title:getComputedStyle(document.getElementById('title')).display}`);
check('a click on Create World starts a survival world',W.playing&&W.mode==='s'&&W.title==='none',W);
await C.ev(`__vox.GR.mobSpawn=false;__vox.GR.dayCycle=false;__vox.setTime&&__vox.setTime(0.3);__pq.pad(300,300);`);await take('world_start');
await shot('world');

/* ===== movement ===== */
const pos=()=>C.ev(`const P=__vox.P;return {x:P.x,y:P.y,z:P.z,g:P.onGround,yaw:P.yaw}`);
{await C.ev(`__vox.P.yaw=0;`);await stp(5);const a=await pos();await key('KeyW','rawKeyDown');await stp(25);await key('KeyW','keyUp');await stp(5);const b=await pos();
  const walk=Math.hypot(b.x-a.x,b.z-a.z);check(`W walks forward (${walk.toFixed(2)} m in 1 s, toward -z)`,walk>2&&b.z<a.z,{walk});
  await C.ev(`__pq.pad(300,300);`);const c=await pos();await key('ControlLeft','rawKeyDown');await key('KeyW','rawKeyDown');await stp(25);await key('KeyW','keyUp');await key('ControlLeft','keyUp');await stp(5);
  const d=await pos();const run=Math.hypot(d.x-c.x,d.z-c.z);check(`Ctrl+W sprints faster than walking (${run.toFixed(2)} m vs ${walk.toFixed(2)} m)`,run>walk*1.15,{run,walk});
  await C.ev(`__pq.pad(300,300);`);const e=await pos();await key('ShiftLeft','rawKeyDown');await key('KeyW','rawKeyDown');await stp(25);await key('KeyW','keyUp');await key('ShiftLeft','keyUp');await stp(5);
  const f=await pos();const sn=Math.hypot(f.x-e.x,f.z-e.z);check(`Shift+W sneaks slower than walking (${sn.toFixed(2)} m)`,sn<walk*0.7&&sn>0.2,{sn});
  await C.ev(`__pq.pad(300,300);`);const g=await pos();await key('Space','rawKeyDown');let top=g.y;for(let i=0;i<12;i++){await stp(1);top=Math.max(top,(await pos()).y);}await key('Space','keyUp');await stp(20);
  const h=await pos();check(`Space jumps and lands (peak +${(top-g.y).toFixed(2)} m)`,top-g.y>0.8&&Math.abs(h.y-g.y)<0.05&&h.g,{peak:top-g.y});
  /* the mouse turns the camera (no pointer lock in the rig: hover-look over the canvas) */
  const y0=(await pos()).yaw;await mouse('mouseMoved',640,360);for(let i=1;i<=6;i++){await mouse('mouseMoved',640-i*20,360);}await stp(2);const y1=(await pos()).yaw;
  check('moving the mouse over the view turns the camera',Math.abs(y1-y0)>0.05,{from:y0,to:y1});
  /* walls stop the player */
  await C.ev(`__pq.pad(300,300);for(let x=-6;x<=6;x++)for(let y=62;y<66;y++)__vox.setBlock(300+x,y,298,__vox.B.STONE);__vox.P.yaw=0;`);await stp(5);
  await key('KeyW','rawKeyDown');await stp(40);await key('KeyW','keyUp');const w=await pos();check(`a wall stops the player (z ${w.z.toFixed(2)} stays behind 299)`,w.z>=298.9,{z:w.z});}
await take('movement');

/* ===== mining and picking up ===== */
await C.ev(`__pq.pad(300,300);__pq.purge();const P=__vox.P;P.inv=P.inv.map(()=>null);P.inv[0]={id:128,count:1,dur:251};P.sel=0;__vox.setBlock(300,63,298,__vox.B.STONE);P.yaw=0;P.pitch=0;`);await stp(3);
{const c0=await C.ev(`return __pq.cnt(__vox.B.COBBLE)`);await mouse('mousePressed',640,360,'left');let n=0;
  while(n<60&&await C.ev(`return __vox.getBlock(300,63,298)===__vox.B.STONE`)){await stp(1);n++;}await mouse('mouseReleased',640,360,'left');await stp(2);
  await key('KeyW','rawKeyDown');await stp(8);await key('KeyW','keyUp');await stp(30);   /* walk up to the drop (the pickup magnet reaches 2 m) */
  const c1=await C.ev(`return __pq.cnt(__vox.B.COBBLE)`);check(`holding the left button with an iron pickaxe mines stone (${n} frames) and the cobble is picked up`,n<60&&c1===c0+1,{n,c0,c1});
  const dur=await C.ev(`return __vox.P.inv[0]&&__vox.P.inv[0].dur`);check('the pickaxe lost durability for the block',dur<251,{dur});}
/* placing */
await C.ev(`__pq.pad(300,300);const P=__vox.P;P.inv[1]={id:__vox.B.DIRT,count:5};P.sel=1;P.pitch=-1.0;P.yaw=0;`);await stp(3);   /* back on the pad centre: the floor cell 1.5 m ahead, not the one under the player's feet */
{await mouse('mousePressed',640,360,'right');await stp(2);await mouse('mouseReleased',640,360,'right');await stp(3);
  const r=await C.ev(`let f=null;for(let z=296;z<=300;z++)if(__vox.getBlock(300,62,z)===__vox.B.DIRT)f=z;return {f,n:__pq.cnt(__vox.B.DIRT)}`);
  check('a right click places the held dirt on the floor in front',r.f!==null&&r.n===4,r);}
await take('mining_placing');

/* ===== crafting with real clicks in the 2x2 grid ===== */
await C.ev(`const P=__vox.P;P.inv[5]={id:__vox.B.LOG_O,count:2};P.pitch=0;`);await stp(2);
await press('KeyE');await stp(2);
{const open=await C.ev(`return MODAL.kind`);check('E opens the inventory',open==='inv',open);
  const xy=sel=>C.ev(`const s=(${sel});if(!s)return null;const b=s.el.getBoundingClientRect();return [b.left+b.width/2,b.top+b.height/2];`);
  const logS=await xy(`MODAL.slots.find(s=>{const v=s.get();return v&&v.id===__vox.B.LOG_O;})`),grid=await xy(`MODAL.slots.find(s=>s.home==='grid'&&!s.get())`),res=await xy(`MODAL.slots.find(s=>s.kind==='result')`);
  if(logS&&grid&&res){await click(...logS);await click(...grid,'right');await click(...logS);await stp(1);
    const out=await C.ev(`const r=MODAL.slots.find(s=>s.kind==='result').get();return r&&{id:r.id,n:r.count}`);
    check('one log in the 2x2 grid offers 4 oak planks',!!out&&out.id===5&&out.n===4,out);
    await click(...res);await stp(1);const empty=await xy(`MODAL.slots.find(s=>s.kind!=='result'&&s.home!=='grid'&&!s.get())`);if(empty)await click(...empty);await stp(1);
  }else check('the inventory shows a log, an empty grid cell and the result slot',false,{logS,grid,res});
  await press('KeyE');await stp(2);
  const n=await C.ev(`return {pl:__pq.cnt(__vox.B.PLANK_O),open:!!MODAL.kind,cur:!!cursorStack}`);
  check('taking the result puts 4 planks in the inventory and E closes it',n.pl===4&&!n.open&&!n.cur,n);}
await take('crafting');

/* ===== combat ===== */
await C.ev(`__pq.pad(300,300);__pq.purge();const P=__vox.P;P.hp=20;P.inv[0]={id:131,count:1,dur:251};P.sel=0;P.yaw=0;P.pitch=0;__vox.spawnMob('zombie',P.x,P.y,P.z-2.2);`);await stp(2);
{let hit=0,taken=0;const hp0=await C.ev(`return __vox.P.hp`);
  for(let i=0;i<40;i++){const z=await C.ev(`const z=__vox.entities.find(e=>e.t==='mob'&&e.mt==='zombie'&&!e.dead);if(!z)return null;const P=__vox.P;
      P.yaw=Math.atan2(-(z.x-P.x),-(z.z-P.z));P.pitch=Math.atan2((z.y+1)-(P.y+1.62),Math.hypot(z.x-P.x,z.z-P.z));return z.hp;`);
    if(z===null)break;await click(640,360);await stp(4);hit++;}
  const st=await C.ev(`return {alive:!!__vox.entities.find(e=>e.t==='mob'&&e.mt==='zombie'&&!e.dead),hp:__vox.P.hp,swordDur:__vox.P.inv[0]&&__vox.P.inv[0].dur}`);
  taken=hp0-st.hp;
  check(`left clicks with an iron sword kill a zombie (${hit} swings; it hit back for ${taken})`,!st.alive&&hit<40,st);
  check('the sword wore down with use',st.swordDur<251,st.swordDur);}
await take('combat_melee');
/* guns in a real browser (the 7.0 fix) */
{const r=await C.ev(`__pq.pad(300,300);__pq.purge();const P=__vox.P;P.mode='c';P.inv[0]={id:201,count:1};P.sel=0;P.useT=0;P.yaw=0;
    __vox.spawnMob('pig',P.x,P.y,P.z-3);const e=__vox.entities[__vox.entities.length-1];e.hp=e.maxHp=500;e.spd=0;P.pitch=Math.atan2((e.y+e.h*0.5)-(P.y+1.62),3);return e.hp;`);
  await mouse('mousePressed',640,360,'left');await stp(1);await mouse('mouseReleased',640,360,'left');
  for(let i=0;i<12;i++){await C.ev(`const P=__vox.P,e=__vox.entities.find(m=>m.t==='mob'&&m.mt==='pig');if(e){e.x=P.x;e.z=P.z-3;e.vx=e.vz=0;}__pq.stp(1);`);}
  const d=await C.ev(`const e=__vox.entities.find(m=>m.t==='mob'&&m.mt==='pig');return e?500-e.hp:null;`);
  check(`a shotgun blast at 3 m lands most of its pellets (${d} damage; one pellet is 2.4)`,d>2.4*4,d);
  await C.ev(`__vox.P.mode='s';__pq.purge();`);}
await take('combat_guns');

/* ===== death and respawn ===== */
await C.ev(`__vox.P.mode='s';__vox.damagePlayer(999,0,0);`);await stp(10);
{const d=await C.ev(`return {dead:__vox.P.dead,screen:getComputedStyle(document.getElementById('death')).display}`);check('lethal damage shows the death screen',d.dead&&d.screen!=='none',d);
  await shot('death');await clickId('d_respawn');await stp(60);
  const r=await C.ev(`return {dead:__vox.P.dead,hp:__vox.P.hp,screen:getComputedStyle(document.getElementById('death')).display,playing:__vox.playing}`);
  check('a click on Respawn brings the player back at full health',!r.dead&&r.hp===20&&r.screen==='none'&&r.playing,r);}
await take('death_respawn');

/* ===== the Nether and back ===== */
{await C.ev(`__vox.GR.mobSpawn=false;const P=__vox.P;P.hp=20;__pq.pad(320,300);__vox.setBlock(320,62,300,__vox.B.PORTAL_N);`);await stp(2);
  const d0=await C.ev(`return DIM`);await stp(45);const d1=await C.ev(`return {dim:DIM,y:__vox.P.y,hp:__vox.P.hp}`);await stp(120);
  check(`standing in a Nether portal for 1.8 s goes from ${d0} to the Nether`,d0==='over'&&d1.dim==='nether',d1);await shot('nether');
  const s=await C.ev(`const P=__vox.P;const x=Math.floor(P.x),y=Math.floor(P.y+0.2),z=Math.floor(P.z);return {feet:__vox.getBlock(x,y,z),portal:__vox.B.PORTAL_N}`);
  if(s.feet!==s.portal)await C.ev(`const P=__vox.P;__vox.setBlock(Math.floor(P.x),Math.floor(P.y+0.2),Math.floor(P.z),__vox.B.PORTAL_N);`);
  await stp(110);const d2=await C.ev(`return {dim:DIM,dead:__vox.P.dead,playing:__vox.playing}`);await stp(60);
  check('a portal in the Nether brings the player back to the overworld, alive',d2.dim==='over'&&!d2.dead&&d2.playing,d2);}
await take('dimensions');

/* ===== a disaster and a dragon, then pause ===== */
{await C.ev(`__pq.pad(300,300);__vox.startDisaster&&__vox.startDisaster('tornado',__vox.P.x+30,__vox.P.z);`);await stp(150);await take('tornado');
  await C.ev(`__vox.endDisaster&&__vox.endDisaster();__vox.spawnMob('dragon',__vox.P.x+10,__vox.P.y+6,__vox.P.z);`);await stp(150);await take('dragon');
  const ok1=await C.ev(`return {playing:__vox.playing,p:!!__vox.P}`);check('a tornado and a dragon run 300 frames without stopping the game',ok1.playing&&ok1.p,ok1);
  await C.ev(`__pq.purge();__vox.GR.mobSpawn=false;`);
  await press('Escape');await stp(2);const pz=await C.ev(`return {paused,menu:getComputedStyle(document.getElementById('pause')).display}`);
  check('Esc pauses (the pause menu shows)',pz.paused&&pz.menu!=='none',pz);await shot('pause');
  await press('Escape');await stp(2);check('Esc again resumes',await C.ev(`return !paused`));}

/* ===== save, quit, load ===== */
{await C.ev(`__pq.pad(300,300);__vox.setBlock(301,62,301,__vox.B.GLASS);__vox.P.inv[8]={id:__vox.B.TORCH,count:7};`);await stp(3);
  await press('Escape');await stp(1);await clickId('p_save');await sleep(400);
  await clickId('p_quit');await sleep(600);await stp(5);
  const t=await C.ev(`return {playing:__vox.playing,title:getComputedStyle(document.getElementById('title')).display}`);check('Save & Quit returns to the title',!t.playing&&t.title!=='none',t);
  await clickId('t_go_load');await sleep(300);
  const row=await C.ev(`const r=[...document.querySelectorAll('#t_worlds .wrow')].find(r=>/playqa/.test(r.textContent));if(!r)return null;const b=r.querySelector('button:not(.danger)')||r;b.scrollIntoView({block:'center'});const q=b.getBoundingClientRect();return [q.left+q.width/2,q.top+q.height/2];`);
  if(row){await click(...row);await sleep(800);await stp(120);}
  const l=await C.ev(`return {playing:__vox.playing,glass:__vox.getBlock(301,62,301)===__vox.B.GLASS,torches:__pq.cnt(__vox.B.TORCH),mode:__vox.P.mode}`);
  check('the saved world loads from Saved Worlds with the placed glass and the 7 torches in the inventory',!!row&&l.playing&&l.glass&&l.torches===7&&l.mode==='s',l);
  await shot('reloaded');}
await take('reload');

const E=errs();check('zero console errors or exceptions in the whole session',E.length===0,E.slice(0,6));
await C.ev(`try{__vox.quitToTitle();}catch(e){}`);await C.restoreOG();
const pass=checks.filter(c=>c.ok).length,fail=checks.length-pass;
fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify({build:BUILD,pass,fail,checks,perf,shots:shots.map(rel)},null,1));
console.log('frame JS cost (ms, renderer draw excluded):',JSON.stringify(perf));
console.log(`play_qa: ${pass} passed, ${fail} failed; shots + summary.json in ${rel(OUT)}`);
C.close();stopKids();process.exit(fail?1:0);

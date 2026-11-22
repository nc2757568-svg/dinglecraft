/* u_play.js (game 7.0, the playability pass, gate x1): three combat and mining bugs that survived every update, pinned with
   real frames (the texture-pack boot, seeded, no network, nothing heard).
   1 a shotgun blast is one shot: its eight pellets all land, instead of the first pellet's hurt window (0.25 s) eating the
     other seven (a point-blank blast did 2.4 damage, a pistol shot does 5)
   2 rapid fire is not wasted: an SMG stream (a shot every 0.115 s) deals its damage instead of two bullets in three vanishing
     into the window; a melee swing still respects the window (no double hits)
   3 mining re-rates the block when the held tool changes mid-swing: a fist that switches to a pickaxe finishes at pickaxe
     speed, and a pickaxe that switches to a fist cannot finish at pickaxe speed (and drops nothing)
   4 input between frames: a click (or a touch tap) whose press and release both land between two frames still acts once, and
     a touch long press with food or a bow holds the right button, so a phone can eat and draw a bow */
'use strict';
const boot=require('../lib/hr_boot.js'),{ok}=boot;
const V=boot({seed:4242});
const step=boot.stepper(800000);

boot.run(async()=>{
  V.startNewWorld('uplay','4242','c');V.GR.mobSpawn=false;V.GR.snail=false;
  step(160);
  const P=()=>V.P;
  /* a quiet test pad high above the terrain: a stone floor, nothing hostile, a fixed time of day */
  const pad=(ox,oz)=>{const p=P();p.x=ox+0.5;p.z=oz+0.5;p.y=62;p.vx=p.vy=p.vz=0;step(30);
    for(let x=-4;x<=4;x++)for(let z=-8;z<=4;z++){V.setBlock(ox+x,61,oz+z,V.B.STONE);for(let y=62;y<66;y++)V.setBlock(ox+x,y,oz+z,0);}
    p.x=ox+0.5;p.z=oz+0.5;p.y=62;p.vx=p.vy=p.vz=0;step(30);};
  const purge=()=>{for(const e of V.entities.slice())if(e.t==='mob'){e.hp=0;e.dead=true;}step(5);};
  const gun=t=>200+0*4+t;          /* iron guns: 0 pistol, 1 shotgun, 2 smg, 3 sniper (gunId in p08) */
  const hold=id=>{const p=P();p.inv[0]=id?{id,count:1}:null;p.sel=0;p.useT=0;p.atkT=0;};
  /* a target dummy 3 m straight ahead (yaw 0 looks along -z), level with the eye, held still */
  const dummy=(hp)=>{const p=P();V.spawnMob('pig',p.x,p.y,p.z-3);const e=V.entities[V.entities.length-1];
    e.hp=hp;e.maxHp=hp;e.hurtT=0;e.spd=0;return e;};
  const pin=e=>{const p=P();e.x=p.x;e.z=p.z-3;e.y=p.y;e.vx=e.vz=0;};
  const aimAt=e=>{const p=P();p.yaw=0;p.pitch=Math.atan2((e.y+e.h*0.5)-(p.y+1.62),3);};

  /* ===== 1. the shotgun ===== */
  pad(400,400);purge();
  {const p=P();p.mode='c';hold(gun(1));const e=dummy(500);pin(e);aimAt(e);step(2);
    const hp0=e.hp;V.MB.l=true;step(1);V.MB.l=false;
    for(let i=0;i<12;i++){pin(e);step(1);}
    const dealt=hp0-e.hp;
    ok(`one point-blank shotgun blast deals more than a single pellet (dealt ${dealt.toFixed(1)}, a pellet is 2.4, eight are 19.2)`,dealt>2.4*4);}

  /* ===== 2. rapid fire ===== */
  purge();
  {const p=P();hold(gun(2));const e=dummy(500);pin(e);aimAt(e);step(2);
    const hp0=e.hp;let shots=0,last=p.useT;V.MB.l=true;
    for(let i=0;i<30;i++){pin(e);aimAt(e);p.pitch=Math.atan2((e.y+e.h*0.5)-(p.y+1.62),3);step(1);if(p.useT>last+0.05)shots++;last=p.useT;}
    V.MB.l=false;for(let i=0;i<6;i++){pin(e);step(1);}
    const dealt=hp0-e.hp;
    ok(`an SMG stream deals its damage (${shots} shots, dealt ${dealt.toFixed(1)}, at least ${(shots*3*0.75).toFixed(1)} expected)`,shots>=6&&dealt>=shots*3*0.75);}
  purge();
  {const p=P();hold(0);const e=dummy(500);pin(e);aimAt(e);step(2);
    const hp0=e.hp;V.hurtMob(e,4,0,-1);V.hurtMob(e,4,0,-1);
    ok('two melee hits in the same instant still count once (the hurt window stays for everything but bullets)',hp0-e.hp===4);}

  /* ===== 2b. input that comes and goes between two frames (a quick click, a touch tap) ===== */
  purge();
  {const p=P();p.mode='s';hold(131);const e=dummy(500);pin(e);aimAt(e);step(3);p.atkT=0;
    const hp0=e.hp;V.mbDown('l');V.mbUp('l');
    ok('a click released before the next frame is still held for that frame',V.MB.l===true);
    pin(e);step(1);
    ok(`and that frame swings: the dummy takes the sword hit (${hp0-e.hp}) and the button is released after it`,hp0-e.hp>=6&&V.MB.l===false);
    step(3);const hp1=e.hp;pin(e);step(10);ok('no phantom second swing afterwards',e.hp===hp1);}
  {const p=P();const apple=V.IT.APPLE,bow=+(Object.keys(V.DEFS).find(k=>V.DEFS[k]&&V.DEFS[k].bow)||-1);
    p.inv[0]={id:apple,count:3};p.sel=0;const kf=V.touchHoldKey();p.inv[0]=bow>0?{id:bow,count:1}:null;const kb=V.touchHoldKey();
    p.inv[0]={id:131,count:1};const ks=V.touchHoldKey();
    ok(`a touch long press uses food and bows (right: ${kf}, ${kb}) and mines or fights with anything else (left: ${ks})`,kf==='r'&&kb==='r'&&ks==='l'&&bow>0);
    p.inv[0]={id:apple,count:3};p.hunger=10;p.pitch=1.2;V.mbDown(V.touchHoldKey());step(48);V.mbUp('r');step(2);
    ok(`holding food with the touch long press eats it (hunger 10 -> ${p.hunger}, apples left ${p.inv[0]&&p.inv[0].count})`,p.hunger>10&&p.inv[0]&&p.inv[0].count===2);}

  /* ===== 3. mining with a tool switch ===== */
  purge();
  const pick=+(Object.keys(V.DEFS).find(k=>{const d=V.DEFS[k];return d&&d.tool&&d.tool.type==='pick'&&d.tool.tier===2;})||-1);
  ok('an iron-tier pickaxe exists to mine with',pick>0);
  const target=()=>{const p=P();const x=Math.floor(p.x),y=Math.floor(p.y+1.62),z=Math.floor(p.z)-2;V.setBlock(x,y,z,V.B.STONE);
    p.yaw=0;p.pitch=0;return [x,y,z];};
  const mineFrames=(switchAt,from,to,cap)=>{const p=P();p.mode='s';hold(from);p.inv[1]=to?{id:to,count:1}:null;const [x,y,z]=target();step(2);
    let n=0;V.MB.l=true;
    while(V.getBlock(x,y,z)===V.B.STONE&&n<cap){if(n===switchAt)p.sel=to===from?0:1;step(1);n++;}
    V.MB.l=false;step(2);const broke=V.getBlock(x,y,z)!==V.B.STONE;V.setBlock(x,y,z,0);return {n,broke};};
  const fist=0;
  const pk=mineFrames(-1,pick,pick,400),fs=mineFrames(-1,fist,fist,400);
  ok(`baselines: a pickaxe breaks stone in ${pk.n} frames, a fist in ${fs.n}`,pk.broke&&fs.broke&&fs.n>pk.n*2);
  {const r=mineFrames(5,fist,pick,400);
    ok(`fist then pickaxe after 5 frames: finishes near pickaxe pace (${r.n} frames, pickaxe alone ${pk.n}, fist alone ${fs.n})`,r.broke&&r.n<=pk.n+6);}
  {const half=Math.max(2,Math.floor(pk.n/2)),r=mineFrames(half,pick,fist,400);
    ok(`pickaxe then fist halfway: cannot finish at pickaxe pace (${r.n} frames, pickaxe alone ${pk.n})`,r.n>pk.n+6);}
});

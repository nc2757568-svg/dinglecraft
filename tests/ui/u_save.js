/* u_save.js (game 7.0, the reliability pass, gate x1): worlds are never lost or overwritten by accident, and every creature
   comes back the way it left. Headless (the texture-pack boot, seeded; the stub storage; nothing heard, no network).
   1 names: a new world never takes a saved world's name ("My World" twice becomes "My World (2)"); an imported file is saved at
     once, under a name of its own, and never replaces a world already there
   2 failures speak: a save that fails (a full browser storage) says so even when quiet, and Save & Quit stays in the world
     unless the player agrees to lose the session
   3 a round trip through snapshot/applySave keeps: enchantments on items lying on the ground, a Blockling's block (it drops
     that block when killed), a dimension boss's fortress (no second boss), a snake's length
   4 the dimension stash keeps a Blockling's block and a snake's length
   5 Critter Jars keep a tame dragon tame, an alien's name and feelings, a Blockling's block and a snake's length; bosses and
     Puppet Purgatory's cast do not fit in a jar (no more boss duplication) */
'use strict';
const boot=require('../lib/hr_boot.js'),{ok}=boot;
const V=boot({seed:5151});
const step=boot.stepper(820000);
const doc=global.document,el=id=>doc.getElementById(id);
const flush=async()=>{for(let i=0;i<6;i++)await new Promise(r=>setImmediate(r));};
const has=async k=>{try{await global.storage.get(k);return true;}catch(e){return false;}};

boot.run(async()=>{
  ok('the reliability seams are on __vox',['uniqueWorldName','importWorldText','mobKeep','mobRestore','listWorlds'].every(k=>typeof V[k]==='function'));
  /* ===== 1. names ===== */
  ok('uniqueWorldName: a free name stays, a taken one gets (2), then (3), whatever its case or spaces',
    V.uniqueWorldName(' Mine ',['Other'])==='Mine'&&V.uniqueWorldName('My World',['My World'])==='My World (2)'&&
    V.uniqueWorldName('my world',['My World','My World (2)'])==='my world (3)'&&V.uniqueWorldName('',['world'])==='world (2)');
  await global.storage.set('vxw:My World',JSON.stringify({f:1,name:'My World',marker:'OLD'}));
  await V.listWorlds();
  el('t_name').value='My World';el('t_seed').value='1';
  el('t_new').onclick();await flush();
  ok(`Create World with a taken name starts "${V.getWORLD().name}" and leaves the old save alone`,V.getWORLD().name==='My World (2)'&&V.playing);
  ok('the toast says what happened',/already/.test(el('toast').textContent));
  step(120);
  ok('saving the new world writes its own key',(await V.saveToStorage(V.getWORLD().name,true))===true&&await has('vxw:My World (2)'));
  ok('the old "My World" is untouched',JSON.parse((await global.storage.get('vxw:My World')).value).marker==='OLD');
  /* import */
  const snap=V.snapshot('My World');const text=JSON.stringify(snap);
  await V.quitToTitle();await flush();
  await V.importWorldText(text,'My World.vxw.json');await flush();
  ok(`an imported file named like an existing world is saved at once as "${V.getWORLD().name}"`,V.getWORLD().name==='My World (3)'&&await has('vxw:My World (3)'));
  ok('and the existing "My World" is still the old one',JSON.parse((await global.storage.get('vxw:My World')).value).marker==='OLD');
  step(30);await V.quitToTitle();await flush();
  {const n0=V.getWORLD().name;await V.importWorldText('{not json','broken.json');await flush();
    ok('a broken file is refused with a message and nothing is written',/Import failed/.test(el('toast').textContent)&&!await has('vxw:broken')&&!V.playing);}

  /* ===== 2. failures speak ===== */
  {V.startNewWorld('Full Disk','2','s');step(60);
    const set0=global.storage.set;global.storage.set=async()=>{throw new Error('QuotaExceededError');};
    el('toast').textContent='';
    const r=await V.saveToStorage('Full Disk',true);
    ok('a failed quiet save returns false and says so anyway',r===false&&/Could not save/.test(el('toast').textContent));
    global.confirm=()=>false;
    await V.quitToTitle();await flush();
    ok('Save & Quit with a failing save stays in the world when the player says no',V.playing===true);
    global.confirm=()=>true;
    await V.quitToTitle();await flush();
    ok('and goes to the title when the player agrees to lose the session',V.playing===false);
    global.storage.set=set0;delete global.confirm;}

  /* ===== 3. round trips ===== */
  V.startNewWorld('Trips','3','s');V.GR.mobSpawn=false;step(160);
  const P=()=>V.P;
  const round=()=>{const d=JSON.parse(JSON.stringify(V.snapshot('Trips')));V.applySave(d);step(40);};
  const mob=mt=>V.entities.find(e=>e.t==='mob'&&e.mt===mt&&!e.dead);
  const purge=()=>{for(const e of V.entities.slice())if(e.t==='mob'&&!e.bot){e.dead=true;}step(2);};
  {const p=P();V.spawnDrop(p.x+2,p.y+1,p.z,{id:131,count:1,dur:200,ench:{sharp:3}},0,0,0);
    round();const d=V.entities.find(e=>e.t==='drop'&&e.st&&e.st.id===131);
    ok('an enchanted sword on the ground keeps its enchantment through save and load',!!d&&d.st.ench&&d.st.ench.sharp===3);}
  purge();
  {const p=P();V.spawnMob('blockling',p.x+3,p.y,p.z);const b=V.entities[V.entities.length-1];b.blockId=V.B.DIA_ORE;
    round();const r=mob('blockling');
    ok('a Blockling remembers its block (diamond ore) through save and load',!!r&&r.blockId===V.B.DIA_ORE);
    if(r){const p2=P();r.x=p2.x+1.5;r.z=p2.z;V.hurtMob(r,999,1,0);step(30);
      const drop=V.entities.find(e=>e.t==='drop'&&e.st&&e.st.id===V.B.DIA_ORE),inv=V.P.inv.some(x=>x&&x.id===V.B.DIA_ORE);ok('and killing it gives that block back (on the ground or already picked up)',!!drop||inv);}}
  purge();
  {const p=P();V.spawnMob('infernis',p.x+6,p.y,p.z);const b=V.entities[V.entities.length-1];b.cellId='3,4';
    round();const r=mob('infernis');ok('a fortress boss keeps its fortress through save and load (no second Infernis)',!!r&&r.cellId==='3,4');}
  purge();
  {const p=P();V.spawnMob('snake',p.x+3,p.y,p.z);const s=V.entities[V.entities.length-1];step(2);V.snakeGrow(s,4);
    round();const r=mob('snake');ok(`a snake keeps its length through save and load (${r&&r.segMeshes?r.segMeshes.length:'none'} of 4)`,!!r&&r.segMeshes&&r.segMeshes.length===4);}
  purge();

  /* ===== 4. the dimension stash ===== */
  {const p=P();V.spawnMob('blockling',p.x+3,p.y,p.z);V.entities[V.entities.length-1].blockId=V.B.GOLD_ORE;
    V.spawnMob('snake',p.x-3,p.y,p.z);const s=V.entities[V.entities.length-1];step(2);V.snakeGrow(s,3);
    V.setDim('nether',p.x,40,p.z);step(10);V.setDim('over',p.x,p.y+1,p.z);step(10);
    const b=mob('blockling'),s2=mob('snake');
    ok('a trip to the Nether and back keeps a Blockling’s block and a snake’s length',!!b&&b.blockId===V.B.GOLD_ORE&&!!s2&&s2.segMeshes&&s2.segMeshes.length===3);}
  purge();

  /* ===== 5. Critter Jars ===== */
  const jarRoundTrip=(mt,setup)=>{const p=P();V.spawnMob(mt,p.x+2,p.y,p.z);const m=V.entities[V.entities.length-1];step(2);setup&&setup(m);
    const kept=V.jarPayload(m);V.removeEnt(m);step(2);const r=V.jarRelease(kept,p.x+2,p.y,p.z);step(2);return r;};
  {const r=jarRoundTrip('dragon',m=>{m.tame=true;m.fed=3;});ok('a tame dragon comes out of a jar tame',!!r&&r.tame===true&&r.fed===3);}
  {const r=jarRoundTrip('alien',m=>{m.name='Zorbo';m.rel=42;m.rom=7;});ok('an alien comes out of a jar with its name and feelings',!!r&&r.name==='Zorbo'&&r.rel===42&&r.rom===7);}
  {const r=jarRoundTrip('blockling',m=>{m.blockId=V.B.IRON_ORE;});ok('a jarred Blockling keeps its block',!!r&&r.blockId===V.B.IRON_ORE);}
  {const r=jarRoundTrip('snake',m=>{V.snakeGrow(m,5);});ok('a jarred snake keeps its length',!!r&&r.segMeshes&&r.segMeshes.length===5);}
  purge();
  ok('bosses (Infernis, the Dragon King, the dungeon Warden, the Titan) and the Purgatory cast do not fit in a jar',
    ['infernis','valkyra','dking','boss','titan'].every(mt=>V.jarRefuses({t:'mob',mt}))&&!V.jarRefuses({t:'mob',mt:'pig'})&&
    Object.keys(V.MOBT).filter(k=>V.MOBT[k].pmob).every(mt=>V.jarRefuses({t:'mob',mt})));
});

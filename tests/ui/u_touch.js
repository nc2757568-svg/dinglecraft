/* u_touch.js (game 7.0, the iPhone fixes, gate x1): why the title buttons and the touch controls did nothing on an iPhone, pinned.
   Headless (the texture-pack boot plus stubs_T: a working classList on #title). Nothing is heard; nothing touches the network.
   1 the boot gate: the title menu is plain HTML and CSS, painted long before the 40+ MB script has arrived and wired it (and
     forever in a file preview that runs no script), so #title starts as .tboot: a loading line stands where the buttons go, the
     buttons are not shown, a <noscript> explains a preview, and a Try again button reloads without needing the game's script
   2 the boot watchdog (#tbootjs, before three.js and the game): an error before the menu is wired (WebGL refused, say: iOS
     Lockdown Mode, low memory) shows what broke instead of leaving dead buttons; one IIFE, no global names, quiet once booted
   3 the game drops the gate only after every title button is wired; a WebGL failure at boot (a child process whose
     WebGLRenderer throws, like an iPhone that refuses a context) leaves the gate up, so the watchdog's message is what shows
   4 the HUD on a phone held upright: all nine hotbar slots fit a 390 px (and a 320 px) wide window; desktops and landscape
     phones keep their old scale
   5 the touch controls stay clear of the notch and the home indicator (safe-area insets), and the source rules behind 1-4 */
'use strict';
const boot=require('../lib/hr_boot.js'),{ok}=boot;
const fs=require('fs'),vm=require('vm'),cp=require('child_process');
const V=boot({stubs:['T']});
const {REC}=require('../lib/stubs_T.js');
const HH=fs.readFileSync(boot.BUILD+'head.html','utf8');
const CSS=HH;   /* the built head: html/css/core.css is in it */

boot.run(async()=>{
  /* ===== 1. the boot gate in the markup ===== */
  ok('#title starts behind the boot gate (class "ovl tboot")',/<div id="title" class="ovl tboot">/.test(HH));
  const gi=HH.indexOf('id="tboot"'),mi=HH.indexOf('<nav id="tmain"');
  ok('the loading line (#tboot, role=status) stands in #tstage right before the main menu',gi>0&&mi>gi&&HH.indexOf('<div id="tstage">')<gi&&
    /<div id="tboot" role="status" aria-live="polite">/.test(HH)&&/<p id="tboot_msg">Loading DINGLECRAFT/.test(HH));
  {const g=HH.slice(gi,mi);
    ok('it explains a slow load and a file preview (#tboot_hint), and a <noscript> says the script is not running',/<p id="tboot_hint">[^<]*slow[^<]*preview[^<]*<\/p>/.test(g)&&
      /<noscript>[\s\S]*#tboot_msg,#tboot_hint\{display:none\}[\s\S]*<\/noscript>/.test(g));
    ok('Try again reloads the page by itself (an inline handler: it works when the game script never ran), hidden until needed',
      /<button id="tboot_retry" class="mc-btn" hidden onclick="location\.reload\(\)">Try again<\/button>/.test(g));}
  ok('CSS: behind the gate the main menu is not shown (no button that cannot answer yet) and the loading line is',
    /#title\.tboot #tmain\{display:none\}/.test(CSS)&&/#title\.tboot #tboot\{display:block\}/.test(CSS)&&/#tboot\{display:none;/.test(CSS));
  ok('CSS: the slow-load hint takes no room and fades in only after a while (an animation delay of 8 s or more), at once on a boot error',
    (m=>!!m&&+m[1]>=8)(/#tboot_hint\{[^}]*animation:tbootslow [^;}]* (\d+(?:\.\d+)?)s forwards/.exec(CSS))&&/#title\.tbootfail #tboot_hint\{opacity:1;max-height:none;margin-top:10px;animation:none\}/.test(CSS)&&
    /#tboot_hint\{max-height:0;overflow:hidden;opacity:0;/.test(CSS));

  /* ===== 2. the boot watchdog ===== */
  const wm=/<script id="tbootjs">([\s\S]*?)<\/script>/.exec(HH),WD=wm?wm[1]:'';
  const at=s=>HH.indexOf(s);
  ok('the watchdog script is in head.html, before three.js and before the game script',!!WD&&at('<script id="tbootjs">')>0&&
    at('<script id="tbootjs">')<at('three.js r128 (assets/vendor/three.r128.min.js)')&&at('<script id="tbootjs">')<HH.lastIndexOf('<script>'));
  const body=WD.replace(/\/\*[\s\S]*?\*\//g,'').trim();
  ok('it is one IIFE (declares nothing in the game’s shared global scope)',/^\(function\(\)\{[\s\S]*\}\)\(\);$/.test(body)&&body.indexOf('})();')===body.length-5);
  const run=(cls)=>{const L={},mk=id=>({id,textContent:'',hidden:true,className:''});
    const E={title:Object.assign(mk('title'),{className:cls}),tboot_msg:mk('tboot_msg'),tboot_hint:mk('tboot_hint'),tboot_retry:mk('tboot_retry')};
    E.tboot_msg.textContent='Loading DINGLECRAFT…';
    const sb={document:{getElementById:id=>E[id]||null},addEventListener:(t,f)=>{(L[t]=L[t]||[]).push(f);}};sb.window=sb;
    const ctx=vm.createContext(sb),before=Object.keys(ctx).sort().join();vm.runInContext(WD,ctx);
    return {E,L,fresh:Object.keys(ctx).sort().join()===before,fire:(m,err)=>(L.error||[]).forEach(f=>f(err?{message:'',error:{message:m}}:{message:m}))};};
  {const w=run('ovl tboot');
    ok('the watchdog adds no global name and listens for errors on window',w.fresh&&(w.L.error||[]).length===1);
    w.fire('Error: Error creating WebGL context.');
    ok('a WebGL refusal before the menu is wired: .tbootfail, a WebGL message, the raw error in the hint, Try again shown',
      /\btbootfail\b/.test(w.E.title.className)&&/WebGL/.test(w.E.tboot_msg.textContent)&&!/Loading/.test(w.E.tboot_msg.textContent)&&
      /Lockdown Mode/.test(w.E.tboot_hint.textContent)&&/Error creating WebGL context/.test(w.E.tboot_hint.textContent)&&w.E.tboot_retry.hidden===false);
    const m1=w.E.tboot_msg.textContent;w.fire('TypeError: an echo of the first failure');
    ok('only the first error is shown (later ones are its echoes)',w.E.tboot_msg.textContent===m1);}
  {const w=run('ovl tboot');w.fire("TypeError: undefined is not an object (evaluating 'x.y')",true);
    ok('any other boot error is shown as it is, read from e.error when e.message is empty',/could not start/.test(w.E.tboot_msg.textContent)&&
      /undefined is not an object/.test(w.E.tboot_msg.textContent)&&w.E.tboot_retry.hidden===false);}
  {const w=run('ovl');w.fire('Error: a game error long after the menu was wired');
    ok('once the gate is down the watchdog stays quiet (in-game errors are not boot failures)',!/tbootfail/.test(w.E.title.className)&&
      w.E.tboot_msg.textContent==='Loading DINGLECRAFT…'&&w.E.tboot_retry.hidden===true);}

  /* ===== 3. the game drops the gate, and only after wiring ===== */
  ok('stubs_T saw the built #title start behind the gate',REC.initial.includes('tboot'));
  ok('after boot the gate is down (#title no longer .tboot)',global.document.getElementById('title').classList.contains('tboot')===false);
  ok('the gate dropped only once every title button had its handler (Create New World, Load World, Controls, Credits, Create World, Import)',
    !!REC.dropped&&Object.values(REC.dropped).every(Boolean));
  {const child=`'use strict';const P=require(${JSON.stringify(boot.P.REPO+'tests/lib/paths.js')});require(P.STUBS);require(${JSON.stringify(__dirname+'/../lib/stubs_T.js')});
    THREE.WebGLRenderer=class{constructor(){throw new Error('Error creating WebGL context.');}};
    let err=null;try{require(P.BUILD+'game.js');}catch(e){err=String(e&&e.message);}
    const T=document.getElementById('title');
    process.stdout.write(JSON.stringify({err,gate:T.classList.contains('tboot'),wired:typeof document.getElementById('t_go_new').onclick==='function'}));process.exit(0);`;
    const r=cp.spawnSync(process.execPath,['-e',child],{encoding:'utf8',timeout:60000});
    let o=null;try{o=JSON.parse(r.stdout.trim().split('\n').pop());}catch(e){}
    ok('a WebGL failure at boot (the iPhone case) throws out of boot() with the gate still up and no button wired',!!o&&/Error creating WebGL context/.test(o.err)&&
      o.gate===true&&o.wired===false);
    const w=run('ovl tboot');if(o)w.fire('Error: '+o.err);
    ok('fed that error, the watchdog turns the dead title into a message and a Try again button',/WebGL/.test(w.E.tboot_msg.textContent)&&w.E.tboot_retry.hidden===false);}

  /* ===== 4. the HUD on a phone held upright ===== */
  const Cp=V.uiCompute,B=V.UI_BASE;
  for(const [w,h,dpr] of [[390,664,3],[390,844,3],[375,553,2],[320,460,2]]){const r=Cp('auto',w,h,dpr);
    ok(`${w}x${h} (portrait phone): all nine hotbar slots fit (HUD ${r.hud}, row ${Math.round(r.hud*B.hudW)} px <= ${w-16}), overlays stay 100%`,
      r.hud*B.hudW<=w-16+1e-6&&r.hud>=0.5&&r.hud<1&&r.eff===1&&Math.abs(Math.round(r.hud*20)/20-r.hud)<1e-9);}
  for(const [w,h,dpr] of [[844,390,3],[750,342,3],[667,375,2],[1280,720,1],[1920,1080,1],[800,500,1],[1024,576,1]]){
    const c=V.uiCaps(w,h),r=Cp('auto',w,h,dpr);
    ok(`${w}x${h}: the HUD keeps its old scale (never below 100% once the row fits): ${r.hud}`,c.hud>=1&&r.hud>=1);}
  {const r=V.uiApply({w:390,h:664,dpr:3});
    ok('uiApply at 390x664 applies the phone HUD scale to --uih (0.7) and keeps the overlays at 1',r.hud===0.7&&r.eff===1);
    const back=V.uiApply();ok('and node goes back to 100% afterwards (nothing is live)',back.hud===1&&back.eff===1);}

  /* ===== 5. the touch controls clear of the notch and the home indicator; the source rules ===== */
  ok('the joystick and the touch buttons sit inside the safe area (an @supports block of env(safe-area-inset-*), the old offsets the minimum and the fallback)',
    (b=>!!b&&['#joy{left:max(18px,env(safe-area-inset-left));bottom:max(96px,calc(env(safe-area-inset-bottom) + 84px))}',
      '#btnjump{right:max(22px,env(safe-area-inset-right));bottom:max(100px,calc(env(safe-area-inset-bottom) + 88px))}',
      '#btnsneak{right:max(104px,calc(env(safe-area-inset-right) + 82px));bottom:max(78px,calc(env(safe-area-inset-bottom) + 66px))}',
      '#btndrop{right:max(22px,env(safe-area-inset-right));bottom:max(184px,calc(env(safe-area-inset-bottom) + 172px))}',
      '#btninv{right:max(88px,calc(env(safe-area-inset-right) + 66px));bottom:max(178px,calc(env(safe-area-inset-bottom) + 166px))}',
      '#btnpause{right:max(14px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top))}'].every(r=>b.includes(r)))(
      (/@supports \(left:max\(1px,env\(safe-area-inset-left\)\)\)\{([\s\S]*?)\n\}/.exec(CSS)||[])[1])&&
    /#joy\{position:fixed;left:18px;bottom:96px;/.test(CSS)&&/#btnjump\{right:22px;bottom:100px\}/.test(CSS)&&/#btnpause\{right:14px;top:14px;/.test(CSS));
  ok('CSS: on a window narrower than the hotbar row the XP and armour badges sit above the hearts and hunger row, not on the hotbar',
    /@media \(max-width:525px\)\{#xp\{bottom:106px\}#armor\{right:auto;left:10px;bottom:106px\}\}/.test(CSS)&&
    CSS.indexOf('@media (max-width:525px){#xp')>CSS.indexOf('#xp{position:fixed;right:10px;bottom:10px;')&&CSS.indexOf('@media (max-width:525px){#xp')>CSS.indexOf('#armor{position:fixed;right:10px;bottom:42px;'));
  {const rs=boot.readSrc('core/p07a_render_sound.js'),inp=boot.readSrc('ui/p06b_input.js');
    ok('audio() resumes a context iOS left "interrupted" (a phone call, Siri), as well as a suspended one',/if\(AC\.state==='suspended'\|\|AC\.state==='interrupted'\)AC\.resume\(\);/.test(rs));
    ok('a touchend (the gesture iOS accepts for sound) kicks the audio too, beside touchstart and pointerdown',/document\.addEventListener\('touchend',kickAudio,true\);/.test(inp)&&
      /document\.addEventListener\('touchstart',kickAudio,true\);/.test(inp)&&/document\.addEventListener\('pointerdown',kickAudio,true\);/.test(inp));}
  const tb=boot.readSrc('ui/p07g_title.js'),bl=boot.readSrc('core/p07h_boot_loop.js'),us=boot.readSrc('ui/p06e_ui_scale.js');
  {const a=tb.indexOf('function tmBoot('),b=tb.indexOf('\n}\n',a),f=tb.slice(a,b),g=f.indexOf("classList.remove('tboot')");
    ok('tmBoot drops the gate after its last button handler and before the first view is shown',g>f.lastIndexOf("on('t_pname_ok'")&&g<f.indexOf("\n  tmShow('main');"));}
  ok('boot() creates the game renderer before it wires the menus (a WebGL refusal can never leave half a menu)',
    bl.indexOf('renderer=new THREE.WebGLRenderer')>0&&bl.indexOf('renderer=new THREE.WebGLRenderer')<bl.indexOf('wireMenus();'));
  ok('uiCaps: the HUD floor is what fits the bare hotbar row (0.05 steps, 50% at the least, 100% at the most)',
    /const hf=Math\.max\(0\.5,Math\.min\(1,Math\.floor\(\(w-16\)\/UI_BASE\.hudW\*20\+1e-9\)\/20\)\);/.test(us)&&/hud:Math\.max\(hf,Math\.floor\(hu\*20\+1e-9\)\/20\)/.test(us));
});

/* stubs_T.js (game 7.0, the iPhone fixes): extends the root DOM stub for tests/ui/u_touch.js only (never edit root stubs.js).
   Adds only what is missing: a working classList on #title (the root stub's classList ignores every call), seeded from the
   class attribute the built head.html gives #title, and a record of what was wired the moment the game dropped the boot gate
   (`tboot`): which title buttons had an onclick at that instant. */
'use strict';
const fs=require('fs');
const P=require('./paths.js');
const T=global.document.getElementById('title');   /* the root stub caches elements by id, so the game gets this same object */
const head=fs.readFileSync(P.BUILD+'head.html','utf8');
const m=/<div id="title" class="([^"]*)"/.exec(head);
const cls=new Set(m?m[1].split(/\s+/).filter(Boolean):[]);
const REC={initial:[...cls],dropped:null};
const sync=()=>{T.className=[...cls].join(' ');};
T.classList={
  add(...a){for(const c of a)cls.add(c);sync();},
  remove(...a){for(const c of a){if(c==='tboot'&&cls.has(c)&&!REC.dropped){
      const w=id=>typeof global.document.getElementById(id).onclick==='function';
      REC.dropped={go_new:w('t_go_new'),go_load:w('t_go_load'),help:w('t_help'),credits:w('t_credits'),create:w('t_new'),import:w('t_import')};}
    cls.delete(c);}sync();},
  toggle(c,f){const on=f===undefined?!cls.has(c):!!f;if(on)cls.add(c);else cls.delete(c);sync();return on;},
  contains:c=>cls.has(c)};
sync();
module.exports={REC};

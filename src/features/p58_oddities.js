/* The Oddities Update: original blocky creatures and tiny overworld landmarks.
   No external assets, branded character models or network dependencies. */
const ODD_MOBS=new Set(['duck','furblin','mlgmonkey','zestprez','chipbuck']);
const ODD_SITE_SEEN=new Set();
let oddSiteClock=0;

MOBT.duck={hp:8,hw:0.35,h:0.78,spd:1.1,body:'#f6edd7',legc:'#f19b33',
  drop:{id:IT.STRING,min:0,max:1}};
MOBT.furblin={hp:13,hw:0.44,h:1.12,spd:1.6,body:'#9278c1',legc:'#7760a9',
  drop:{id:IT.STRING,min:0,max:2}};
MOBT.mlgmonkey={hp:25,hw:0.38,h:1.55,spd:2.4,hostile:true,dmg:2,
  body:'#885b37',legc:'#5d3b26',drop:{id:IT.APPLE,min:0,max:2}};
MOBT.zestprez={hp:65,hw:0.42,h:1.92,spd:1.9,hostile:true,dmg:3,
  body:'#1b4670',legc:'#17253b',drop:{id:IT.GOLD,min:1,max:3}};
MOBT.chipbuck={hp:90,hw:0.75,h:2.15,spd:2.1,hostile:true,dmg:5,
  body:'#a35e32',legc:'#59351f',drop:{id:IT.APPLE,min:2,max:5}};

/* Built entirely from axis-aligned boxes, including oversized mechanical eyes. */
function oddMobMesh(mt){
  const G=new THREE.Group(),legs=[],mats=[];
  function cube(w,h,d,c,x,y,z,parent){
    const mesh=boxMesh(w,h,d,c);mesh.position.set(x,y,z);
    (parent||G).add(mesh);mats.push(mesh.material);return mesh;
  }
  function limb(x,y,z,c,w,h,phase,amp){
    const g=new THREE.Group();g.position.set(x,y,z);G.add(g);
    cube(w,h,w,c,0,-h*0.5,0,g);
    legs.push({g,ph:phase,ax:'x',base:0,amp:amp||0.5});
  }
  function eye(x,y,z,scale,iris){
    cube(scale,scale,0.085,'#fffdf6',x,y,z);
    cube(scale*0.58,scale*0.64,0.09,iris,x,y,z+0.085);
    cube(scale*0.28,scale*0.40,0.095,'#17141c',x,y,z+0.17);
    cube(scale*0.13,scale*0.13,0.1,'#ffffff',x-scale*0.09,y+scale*0.11,z+0.22);
  }
  if(mt==='duck'){
    cube(0.83,0.50,1.04,'#f6edd7',0,0.47,0);
    cube(0.55,0.53,0.54,'#fff8e8',0,0.88,0.33);
    cube(0.43,0.13,0.42,'#ed9134',0,0.71,0.69);
    cube(0.23,0.28,0.38,'#e7cfaa',0,0.68,-0.52);
    for(const s of[-1,1]){
      eye(s*0.17,0.96,0.615,0.14,'#403329');
      cube(0.13,0.18,0.32,'#e1c9a8',s*0.43,0.52,0);
      limb(s*0.21,0.26,0,'#ec9a39',0.12,0.24,s>0?0:Math.PI);
      cube(0.25,0.075,0.30,'#f4a238',s*0.21,0.06,0.15);
    }
  }else if(mt==='furblin'){
    cube(0.98,0.86,0.82,'#9278c1',0,0.56,0);
    cube(0.80,0.66,0.18,'#cdb7ec',0,0.67,0.39);
    cube(0.66,0.38,0.13,'#f5ddba',0,0.35,0.48);
    for(const s of[-1,1]){
      eye(s*0.24,0.80,0.505,0.31,'#34b9ab');
      const ear=cube(0.29,0.42,0.27,'#ad93d7',s*0.43,1.08,0);
      ear.rotation.z=-s*0.35;
      limb(s*0.31,0.26,0,'#7760a9',0.20,0.22,s>0?0:Math.PI,0.35);
    }
    cube(0.25,0.18,0.22,'#eeb35b',0,0.50,0.60);
    cube(0.28,0.13,0.19,'#6b4e99',0,1.14,0.02);
  }else if(mt==='mlgmonkey'){
    cube(0.68,0.82,0.46,'#6d432c',0,0.91,0);
    cube(0.48,0.62,0.12,'#c79664',0,0.95,0.29);
    cube(0.68,0.58,0.56,'#96613a',0,1.62,0.07);
    cube(0.56,0.25,0.12,'#c18a55',0,1.47,0.40);
    for(const s of[-1,1]){
      cube(0.25,0.32,0.17,'#b37a48',s*0.42,1.67,0.02);
      cube(0.24,0.18,0.11,'#131419',s*0.18,1.73,0.36);
      cube(0.09,0.05,0.07,'#fafafa',s*0.21,1.78,0.43);
      limb(s*0.42,1.23,0,'#875735',0.21,0.70,s>0?Math.PI:0);
      limb(s*0.19,0.53,0,'#63432c',0.22,0.52,s>0?0:Math.PI);
    }
    cube(0.13,0.06,0.09,'#1b1c23',0,1.73,0.40);
    cube(0.40,0.17,0.20,'#56351f',0,0.67,-0.37);
  }else if(mt==='zestprez'){
    cube(0.62,0.81,0.38,'#193a66',0,1.00,0);
    cube(0.12,0.61,0.08,'#df3640',0,1.05,0.25);
    cube(0.60,0.58,0.52,'#f4d52a',0,1.75,0);
    cube(0.30,0.20,0.39,'#f6e541',0,1.83,0);
    cube(0.29,0.12,0.23,'#62a846',0.18,2.12,0);
    for(const s of[-1,1]){
      eye(s*0.16,1.78,0.32,0.13,'#739e33');
      limb(s*0.42,1.32,0,'#18345d',0.19,0.68,s>0?Math.PI:0);
      limb(s*0.19,0.58,0,'#202941',0.22,0.56,s>0?0:Math.PI);
    }
    cube(0.20,0.065,0.06,'#84551f',0,1.60,0.37);
  }else if(mt==='chipbuck'){
    cube(1.50,1.25,1.29,'#96512d',0,0.88,0);
    cube(1.12,0.93,0.12,'#e5ba7b',0,0.80,0.70);
    cube(1.18,0.94,1.02,'#a9633c',0,1.77,0.14);
    for(const s of[-1,1]){
      cube(0.33,0.45,0.30,'#814520',s*0.47,2.30,0);
      cube(0.22,0.29,0.17,'#eeb8b4',s*0.48,2.33,0.18);
      eye(s*0.31,1.86,0.73,0.39,s>0?'#40cc91':'#d2a5ff');
      cube(0.37,0.35,0.44,'#d99957',s*0.49,1.48,0.52);
      limb(s*0.69,1.18,0,'#88502f',0.27,0.62,s>0?Math.PI:0,0.75);
      limb(s*0.47,0.40,0,'#794229',0.36,0.31,s>0?0:Math.PI,0.5);
      cube(0.13,0.29,0.14,'#ffffff',s*0.10,1.32,0.77);
    }
    const tail=cube(0.47,0.57,0.78,'#7a3e26',0,0.72,-0.82);
    tail.rotation.x=0.42;
    cube(0.31,0.16,0.36,'#d39350',0,1.51,0.80);
    cube(0.13,0.12,0.11,'#302018',0,1.56,1.05);
  }
  return {G,legs,mats};
}

/* The territory generator uses the ordinary chunk buffer, not runtime edits.
   Thus the same seed always yields the same site, and old save edits still win. */
const ODD_SITE_NAMES={marsh:'Quackwater Hollow',grove:'The Humming Grove',
  canopy:'Sunglass Canopy',capitol:'The Zesty Capitol',burrow:'Chipbuck Burrow'};
function oddSite(cx,cz){
  if(Math.max(Math.abs(cx),Math.abs(cz))<12)return null; /* OG trace/spawn sanctuary */
  if(h2(cx,cz,SEED+5801)>=0.11)return null;
  const x=cx*CH+8,z=cz*CH+8,ci=colInfo(x,z);
  if(ci.h<=SEA+1||ci.h>=WH-12)return null;
  const kinds=['marsh','grove','canopy','capitol','burrow'];
  const kind=kinds[Math.floor(h2(cx,cz,SEED+5802)*kinds.length)];
  if(kind==='marsh'&&ci.h>SEA+11)return null;
  if(kind==='canopy'&&ci.b!==BIOME.FOREST&&ci.b!==BIOME.BIRCH)return null;
  if(kind==='burrow'&&ci.h<SEA+4)return null;
  return {cx,cz,x,z,y:ci.h,kind};
}
function stampOddSite(blocks,x0,z0){
  const cx=x0/CH,cz=z0/CH,s=oddSite(cx,cz);
  if(!s)return;
  function put(x,y,z,id){
    const lx=x-x0,lz=z-z0;
    if(lx<0||lx>=CH||lz<0||lz>=CH||y<1||y>=WH-2)return;
    blocks[bidx(lx,y,lz)]=id;
  }
  function surface(x,z){return colInfo(x,z).h;}
  const x=s.x,z=s.z,h=s.y;
  if(s.kind==='marsh'){
    for(let dx=-5;dx<=5;dx++)for(let dz=-5;dz<=5;dz++){
      const rr=dx*dx+dz*dz,wx=x+dx,wz=z+dz,y=surface(wx,wz);
      if(Math.abs(y-h)>2)continue;
      if(rr<=15){put(wx,y,wz,B.WATER);put(wx,y-1,wz,B.CLAY);put(wx,y+1,wz,B.AIR);}
      else if(rr<=26){put(wx,y,wz,B.SAND);if((dx*5+dz*7)%4===0)put(wx,y+1,wz,B.TALLGRASS);}
    }
    for(let i=0;i<4;i++){put(x-4+i,h+1,z+3,B.PLANK_O);put(x-4+i,h,z+3,B.LOG_O);}
    put(x-4,h+2,z+3,B.TORCH);
  }else if(s.kind==='grove'){
    for(let dx=-5;dx<=5;dx++)for(let dz=-5;dz<=5;dz++){
      const r=dx*dx+dz*dz,wx=x+dx,wz=z+dz,y=surface(wx,wz);
      if(r<=25&&Math.abs(y-h)<3){
        if(r<5)put(wx,y,wz,B.WOOL);
        else if(r>12&&r<26&&((dx*13+dz*7)&3)===0)put(wx,y+1,wz,B.FLOWER_R);
      }
    }
    for(const [dx,dz] of [[-4,-4],[4,-4],[-4,4],[4,4]]){
      const y=surface(x+dx,z+dz);
      put(x+dx,y+1,z+dz,B.LOG_B);put(x+dx,y+2,z+dz,B.GLOWSTONE);
    }
  }else if(s.kind==='canopy'){
    for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++){
      put(x+dx,h+3,z+dz,B.PLANK_O);
      if(Math.abs(dx)===3&&Math.abs(dz)===3)for(let y=surface(x+dx,z+dz)+1;y<=h+3;y++)put(x+dx,y,z+dz,B.LOG_O);
    }
    for(let dx=-5;dx<=5;dx++)for(let dz=-5;dz<=5;dz++)
      if(dx*dx+dz*dz<32&&Math.abs(dx)+Math.abs(dz)>4)put(x+dx,h+6,z+dz,B.LEAF_O);
    for(const dx of[-2,2])put(x+dx,h+4,z-2,B.TORCH);
  }else if(s.kind==='capitol'){
    for(let dx=-4;dx<=4;dx++)for(let dz=-3;dz<=3;dz++){
      put(x+dx,h+1,z+dz,B.SANDSTONE);
      if(Math.abs(dx)===4&&Math.abs(dz)===3)for(let dy=2;dy<=5;dy++)put(x+dx,h+dy,z+dz,B.SANDSTONE);
      if(Math.abs(dx)<=3&&Math.abs(dz)<=2)put(x+dx,h+2,z+dz,B.BRICK);
    }
    for(let dx=-4;dx<=4;dx++)for(let dz=-3;dz<=3;dz++)put(x+dx,h+6,z+dz,B.SANDSTONE);
    put(x,h+7,z,B.GLOWSTONE);put(x,h+8,z,B.LEAF_O);
    for(let dx=-1;dx<=1;dx++){put(x+dx,h+1,z+4,B.STONEBRICK);put(x+dx,h+2,z+3,B.STONEBRICK);}
  }else if(s.kind==='burrow'){
    for(let dx=-4;dx<=4;dx++)for(let dz=-4;dz<=4;dz++){
      const r=dx*dx+dz*dz,wx=x+dx,wz=z+dz,y=surface(wx,wz);
      if(r<10&&Math.abs(y-h)<3){
        for(let k=0;k<4;k++)put(wx,y-k,wz,B.AIR);
        put(wx,y-4,wz,B.PLANK_S);
      }else if(r>=10&&r<20){put(wx,y,wz,B.LOG_S);}
    }
    for(const dx of[-2,2]){put(x+dx,h+1,z-3,B.GLOWSTONE);put(x+dx,h+1,z+3,B.GLOWSTONE);}
    put(x,h-3,z,B.CHEST); /* a physical abandoned cache to investigate */
  }
}
function oddSiteTick(dt){
  if(!playing||!P||DIM!=='over'||!GR.mobSpawn)return;
  oddSiteClock-=dt;if(oddSiteClock>0)return;
  oddSiteClock=2.5;
  const cx=Math.floor(P.x/CH),cz=Math.floor(P.z/CH);
  for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
    const site=oddSite(cx+dx,cz+dz);if(!site)continue;
    const k=site.cx+','+site.cz;
    if(ODD_SITE_SEEN.has(k)||!chunkAt(site.x,site.z))continue;
    const dist=Math.hypot(P.x-site.x,P.z-site.z);
    if(dist>24)continue;
    ODD_SITE_SEEN.add(k);
    const type={marsh:'duck',grove:'furblin',canopy:'mlgmonkey',capitol:'zestprez',burrow:'chipbuck'}[site.kind];
    const count=site.kind==='marsh'?3:(site.kind==='grove'?2:1);
    const yy=site.y+(site.kind==='canopy'?4:(site.kind==='capitol'?3:1));
    for(let i=0;i<count;i++){
      const xx=site.x+(i-1)*1.4,zz=site.z+(i%2)*1.4;
      spawnMob(type,xx+0.5,yy+0.3,zz+0.5);
    }
    showToast('Discovered: '+ODD_SITE_NAMES[site.kind]);
    return;
  }
}
function oddAmbientSpawn(x,z,h,p){
  if(Math.max(Math.abs(x),Math.abs(z))<190||Math.random()>0.10)return false;
  const ci=colInfo(x,z),sy=surfaceTop(x,z);
  if(sy<=SEA-2||sy>=WH-3||!mobClearOfPlayers(x,z))return false;
  if(getBlock(x,sy+1,z)!==B.AIR||getBlock(x,sy+2,z)!==B.AIR)return false;
  let type=null;
  if(ci.h<=SEA+4&&p<8)type='duck';
  else if((ci.b===BIOME.FOREST||ci.b===BIOME.BIRCH)&&p<8)type='furblin';
  else if(ci.b===BIOME.FOREST&&h<12&&Math.random()<0.35)type='mlgmonkey';
  if(!type)return false;
  spawnMob(type,x+0.5,sy+1,z+0.5);return true;
}

/* Distinct attack rhythms and cheap, short-lived projectiles. */
function oddShot(e,color,dmg,kind){
  if(!P||P.dead||P.mode==='c')return;
  const x=e.x,y=e.y+Math.min(e.h*0.8,1.5),z=e.z;
  const dx=P.x-x,dy=P.y+1-y,dz=P.z-z,d=Math.hypot(dx,dy,dz)||1;
  const m=new THREE.Mesh(new THREE.BoxGeometry(0.24,0.22,0.28),
    new THREE.MeshLambertMaterial({color}));
  scene.add(m);
  entities.push({t:'oddproj',x,y,z,vx:dx/d*11,vy:dy/d*11+0.9,vz:dz/d*11,
    age:0,mesh:m,dmg,kind});
}
function oddProjectileTick(e,dt){
  e.age+=dt;e.vy-=GRAV*0.11*dt;
  e.x+=e.vx*dt;e.y+=e.vy*dt;e.z+=e.vz*dt;
  e.mesh.position.set(e.x,e.y,e.z);
  e.mesh.rotation.z+=dt*4;
  const px=Math.floor(e.x),py=Math.floor(e.y),pz=Math.floor(e.z);
  const hit=P&&!P.dead&&P.mode!=='c'&&Math.hypot(P.x-e.x,P.y+1-e.y,P.z-e.z)<0.85;
  if(hit){LASTDMG={by:e.kind==='paper'?'President Zest':'MLG Monkey',how:'mob',t:AG_T};
    damagePlayer(e.dmg,e.vx,e.vz);burstParticles(e.x,e.y,e.z,B.WOOL,5,0.5);}
  if(hit||solidAt(px,py,pz)||e.age>6||e.y<1){
    removeEnt(e);e.mesh.geometry.dispose();e.mesh.material.dispose();
  }
}
function oddMobAction(e,dt,T){
  if(!P||P.dead||DIM!=='over')return;
  e.oddCd=Math.max(0,(e.oddCd||0)-dt);
  const dx=P.x-e.x,dz=P.z-e.z,dist=Math.hypot(dx,dz),dy=Math.abs(P.y-e.y);
  if(P.mode==='c'||dy>4)return;
  if(e.mt==='mlgmonkey'&&dist<13&&dist>3&&e.oddCd===0&&mobSees(e)){
    e.oddCd=3.2;oddShot(e,0xfad754,2,'banana');playS('bow');
  }else if(e.mt==='zestprez'&&dist<16&&dist>3&&e.oddCd===0&&mobSees(e)){
    e.oddCd=2.2;
    oddShot(e,0xf9f4cf,3,'paper');playS('bow');
  }else if(e.mt==='chipbuck'&&dist<3.4&&e.oddCd===0){
    e.oddCd=4.8;P.vy=Math.max(P.vy,7);
    LASTDMG={by:'Chipbuck',how:'mob',t:AG_T};
    damagePlayer(4,dx,dz);playS('thud');
    burstParticles(e.x,e.y+0.4,e.z,B.DIRT,14,1.2);
  }else if(e.mt==='furblin'&&e.mode==='flee'&&dist<3.5&&e.oddCd===0){
    e.oddCd=5;P.vy=Math.max(P.vy,4);
    P.vx+=dx/(dist||1)*5;P.vz+=dz/(dist||1)*5;
    burstParticles(e.x,e.y+0.5,e.z,B.WOOL,8,0.7);
  }
}

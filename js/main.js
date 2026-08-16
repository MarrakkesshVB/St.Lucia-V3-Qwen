/* ============================================================
   ST. LUCIA EXPRESS — Night Voyage + Golden Globe
   One owner per effect: GSAP/ScrollTrigger = DOM + scroll progress,
   rAF loop = camera/3D interpolation. No raw scroll listeners.
============================================================ */
const $  = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
const lerp  = (a,b,t)=>a+(b-a)*t;
const smooth= t=>t*t*(3-2*t);

const RM    = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DESK  = matchMedia('(min-width:1024px)').matches;
const HOVER = matchMedia('(hover:hover)').matches;
const glOK  = ()=>{try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch(e){return false;}};
const USE3D = DESK && HOVER && !RM && glOK();

const HAS_GSAP = typeof window.gsap!=='undefined' && typeof window.ScrollTrigger!=='undefined';
if(!RM && HAS_GSAP) document.documentElement.classList.add('js');
if(!USE3D) document.documentElement.classList.add('mode-fallback');
if(HAS_GSAP) gsap.registerPlugin(ScrollTrigger);

/* ---------- year ---------- */
$('#year').textContent = new Date().getFullYear();

/* ---------- counters ---------- */
function runCount(el){
  const target=parseFloat(el.dataset.count||'0');
  const dec=parseInt(el.dataset.decimals||'0',10);
  const suf=el.dataset.suffix||'';
  if(RM){el.textContent=target.toFixed(dec)+suf;return;}
  const t0=performance.now(),dur=1900;
  (function f(now){
    const t=clamp((now-t0)/dur,0,1), e=1-Math.pow(1-t,3);
    el.textContent=(target*e).toFixed(dec)+suf;
    if(t<1)requestAnimationFrame(f);
  })(t0);
}
const cio=new IntersectionObserver(es=>es.forEach(en=>{
  if(en.isIntersecting){runCount(en.target);cio.unobserve(en.target);}
}),{threshold:.5});
$$('.count').forEach(c=>cio.observe(c));

/* ---------- DOM reveals (GSAP owns DOM animation) ---------- */
if(HAS_GSAP && !RM){
  $$('.reveal').forEach(el=>{
    gsap.fromTo(el,{y:46,opacity:0},{y:0,opacity:1,duration:1.05,ease:'power3.out',
      scrollTrigger:{trigger:el,start:'top 86%',once:true}});
  });
  $$('.reveal-group').forEach(g=>{
    gsap.fromTo(g.children,{y:38,opacity:0},{y:0,opacity:1,duration:.9,ease:'power3.out',stagger:.12,
      scrollTrigger:{trigger:g,start:'top 84%',once:true}});
  });
  /* hero entrance */
  const tl=gsap.timeline({defaults:{ease:'power4.out'},delay:.15});
  tl.fromTo('#hero .eyebrow',{y:24,opacity:0},{y:0,opacity:1,duration:.9})
    .fromTo('.hero-title .line-inner',{yPercent:112},{yPercent:0,duration:1.25,stagger:.14},'-=.4')
    .fromTo('.hero-tag',{y:26,opacity:0},{y:0,opacity:1,duration:.9},'-=.55')
    .fromTo('.hero-ctas .btn',{y:22,opacity:0},{y:0,opacity:1,duration:.8,stagger:.12},'-=.5')
    .fromTo('.scroll-cue',{opacity:0},{opacity:1,duration:1},'-=.3');
}

/* ---------- quote form → mailto ---------- */
const toast=$('#toast');let toastT;
$('#quoteForm').addEventListener('submit',e=>{
  e.preventDefault();
  const fd=new FormData(e.target);
  const g=n=>{const v=(fd.get(n)||'').toString().trim();return v||'—';};
  const body=[
    'QUOTE REQUEST — St. Lucia Express','================================',
    'Origin: '+g('origin'),
    'Destination: '+g('destination'),
    'Service Type: '+g('service'),
    'Estimated Weight / Volume: '+g('cargo'),
    '','Sent from stluciaexpress.com'
  ].join('\n');
  window.location.href='mailto:ingrid@stluciaexpress.com?subject='+encodeURIComponent('Quote Request')+'&body='+encodeURIComponent(body);
  toast.classList.add('show');clearTimeout(toastT);
  toastT=setTimeout(()=>toast.classList.remove('show'),4200);
});

/* ---------- scroll progress (single owner) ---------- */
const journey={p:0,t:0};
if(HAS_GSAP && USE3D){
  ScrollTrigger.create({start:0,end:'max',onUpdate:self=>{
    journey.t=self.progress;
    document.body.classList.toggle('scrolled',self.scroll()>30);
    updateNav(self.progress);
  }});
}

/* ============================================================
   3D — THE NIGHT VOYAGE + GOLDEN GLOBE (desktop only)
============================================================ */
let navPs=[],navEls=$$('.nav-a');
function updateNav(p){
  let act=null;
  for(const n of navPs){if(p>=n.p-0.02)act=n;}
  navEls.forEach(a=>a.classList.toggle('active',!!act&&a.el===act.el));
}

if(USE3D){
  try{ const THREE=await import('three'); boot(THREE); }
  catch(err){ document.documentElement.classList.add('mode-fallback'); }
}

function boot(THREE){
const canvas=$('#gl');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));
renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.12;

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x050507);
scene.fog=new THREE.Fog(0x050507,70,430);

const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,0.1,2400);
camera.position.set(-17,10.5,30);

/* ---------- lights ---------- */
scene.add(new THREE.HemisphereLight(0x30344a,0x050506,0.85));
const moonLight=new THREE.DirectionalLight(0xf3e2b8,2.1);
moonLight.position.set(70,90,-160);scene.add(moonLight);
const deckLight=new THREE.PointLight(0xC5A059,260,95,2);
deckLight.position.set(0,10,6);scene.add(deckLight);

/* ---------- glow texture ---------- */
function glowTex(){
  const c=document.createElement('canvas');c.width=c.height=256;
  const x=c.getContext('2d');
  const g=x.createRadialGradient(128,128,0,128,128,128);
  g.addColorStop(0,'rgba(255,236,200,1)');
  g.addColorStop(.35,'rgba(197,160,89,.4)');
  g.addColorStop(1,'rgba(197,160,89,0)');
  x.fillStyle=g;x.fillRect(0,0,256,256);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const GLOW=glowTex();

/* ---------- stars ---------- */
const starCount=1500;
const sPos=new Float32Array(starCount*3),sSize=new Float32Array(starCount),sPhase=new Float32Array(starCount),sTint=new Float32Array(starCount);
for(let i=0;i<starCount;i++){
  let x=0,y=-999,z=0;
  while(y<-80){
    const u=Math.random()*2-1,th=Math.random()*Math.PI*2,r=650;
    const s=Math.sqrt(1-u*u);
    x=r*s*Math.cos(th);y=r*u;z=r*s*Math.sin(th);
  }
  sPos.set([x,y,z],i*3);
  sSize[i]=.8+Math.random()*1.9;
  sPhase[i]=Math.random();
  sTint[i]=Math.random()<.22?1:0;
}
const starGeo=new THREE.BufferGeometry();
starGeo.setAttribute('position',new THREE.BufferAttribute(sPos,3));
starGeo.setAttribute('aSize',new THREE.BufferAttribute(sSize,1));
starGeo.setAttribute('aPhase',new THREE.BufferAttribute(sPhase,1));
starGeo.setAttribute('aTint',new THREE.BufferAttribute(sTint,1));
const starMat=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uTime:{value:0}},
  vertexShader:`
    attribute float aSize;attribute float aPhase;attribute float aTint;
    uniform float uTime;varying float vA;varying float vTint;
    void main(){
      vec4 mv=modelViewMatrix*vec4(position,1.0);
      vA=0.62+0.38*sin(uTime*1.4+aPhase*6.2831);
      vTint=aTint;
      gl_PointSize=aSize*1.7*(650.0/-mv.z);
      gl_Position=projectionMatrix*mv;
    }`,
  fragmentShader:`
    varying float vA;varying float vTint;
    void main(){
      float a=smoothstep(0.5,0.0,length(gl_PointCoord-0.5))*vA;
      vec3 bone=vec3(0.88,0.85,0.80);vec3 gold=vec3(0.772,0.627,0.349);
      gl_FragColor=vec4(mix(bone,gold,vTint),a);
    }`
});
scene.add(new THREE.Points(starGeo,starMat));

/* ---------- moon ---------- */
const moon=new THREE.Mesh(new THREE.CircleGeometry(9,48),new THREE.MeshBasicMaterial({color:0xEDE2C8}));
moon.material.fog=false;moon.position.set(120,120,-560);moon.lookAt(0,20,0);scene.add(moon);
const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xC5A059,transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));
halo.material.fog=false;halo.scale.set(170,170,1);halo.position.copy(moon.position);scene.add(halo);

/* ---------- ocean (procedural shader) ---------- */
const oceanGeo=new THREE.PlaneGeometry(1100,1100,180,180);
oceanGeo.rotateX(-Math.PI/2);
const oceanMat=new THREE.ShaderMaterial({
  transparent:true,
  uniforms:{uTime:{value:0},uFade:{value:1},uCam:{value:new THREE.Vector3()}},
  vertexShader:`
    uniform float uTime;
    varying vec3 vPos;varying vec3 vN;varying float vDist;
    float waveH(vec2 p,float t){
      float h=0.0;
      h+=sin(p.x*0.055+t*0.9)*0.55;
      h+=sin(p.y*0.075-t*0.6)*0.45;
      h+=sin((p.x+p.y)*0.035+t*0.5)*0.75;
      h+=sin(length(p-vec2(30.0,-80.0))*0.04-t*0.8)*0.35;
      return h;
    }
    void main(){
      vec3 pos=position;vec2 pxz=pos.xz;float t=uTime;
      float h=waveH(pxz,t);
      float e=2.0;
      float hx=waveH(pxz+vec2(e,0.0),t);
      float hz=waveH(pxz+vec2(0.0,e),t);
      pos.y+=h;
      vN=normalize(vec3(-(hx-h)/e,1.0,-(hz-h)/e));
      vec4 wp=modelMatrix*vec4(pos,1.0);
      vPos=wp.xyz;
      vec4 mv=viewMatrix*wp;
      vDist=-mv.z;
      gl_Position=projectionMatrix*mv;
    }`,
  fragmentShader:`
    uniform float uFade;uniform float uTime;uniform vec3 uCam;
    varying vec3 vPos;varying vec3 vN;varying float vDist;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    void main(){
      vec3 N=normalize(vN);
      vec3 V=normalize(uCam-vPos);
      vec3 moonDir=normalize(vec3(0.35,0.55,-0.75));
      vec3 R=reflect(-moonDir,N);
      float spec=pow(max(dot(R,V),0.0),46.0);
      float fres=pow(1.0-max(dot(N,V),0.0),3.0);
      float glit=step(0.985,hash(floor(vPos.xz*0.9)+floor(uTime*3.0)));
      vec3 gold=vec3(0.772,0.627,0.349);
      vec3 col=vec3(0.010,0.011,0.017);
      col+=gold*spec*1.2;
      col+=gold*fres*0.09;
      col+=gold*glit*spec*2.0;
      float fogF=smoothstep(120.0,420.0,vDist);
      col=mix(col,vec3(0.02,0.02,0.028),fogF);
      float a=uFade*(1.0-smoothstep(380.0,540.0,vDist));
      gl_FragColor=vec4(col,a);
    }`
});
const ocean=new THREE.Mesh(oceanGeo,oceanMat);
scene.add(ocean);

/* ---------- golden wake ---------- */
const wakeGeo=new THREE.PlaneGeometry(16,110,1,1);
wakeGeo.rotateX(-Math.PI/2);
const wakeMat=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uTime:{value:0},uIntensity:{value:.2}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`
    uniform float uTime;uniform float uIntensity;varying vec2 vUv;
    void main(){
      float w=mix(0.16,0.5,1.0-vUv.y);
      float c=smoothstep(w,w*0.2,abs(vUv.x-0.5));
      float s=sin(vUv.y*52.0+uTime*3.0)*0.5+0.5;
      float foam=smoothstep(0.55,1.0,s)*0.6;
      float a=uIntensity*c*pow(vUv.y,1.7)*(0.35+foam);
      gl_FragColor=vec4(vec3(0.772,0.627,0.349),a);
    }`
});
const wake=new THREE.Mesh(wakeGeo,wakeMat);
wake.position.set(0,0.35,68.5);wake.renderOrder=2;scene.add(wake);

/* ---------- materials ---------- */
const M={
  hull:new THREE.MeshStandardMaterial({color:0x0b0c11,roughness:.62,metalness:.38,flatShading:true}),
  bone:new THREE.MeshStandardMaterial({color:0xD8D0C4,roughness:.55,metalness:.15,flatShading:true}),
  gold:new THREE.MeshStandardMaterial({color:0xC5A059,roughness:.42,metalness:.55,flatShading:true,emissive:0x2a1f0c,emissiveIntensity:.4}),
  dark:new THREE.MeshStandardMaterial({color:0x14151c,roughness:.6,metalness:.3,flatShading:true}),
  bronze:new THREE.MeshStandardMaterial({color:0x5A4626,roughness:.6,metalness:.35,flatShading:true}),
  dim:new THREE.MeshStandardMaterial({color:0x8f887c,roughness:.7,metalness:.2,flatShading:true}),
  win:new THREE.MeshStandardMaterial({color:0x201c12,emissive:0xC5A059,emissiveIntensity:1.7,roughness:.4}),
  glow:new THREE.MeshBasicMaterial({color:0xFFD98F}),
  piton:new THREE.MeshStandardMaterial({color:0x08080b,roughness:.9,flatShading:true})
};

/* ---------- ship ---------- */
const ship=new THREE.Group();
const hs=new THREE.Shape();
hs.moveTo(0,17);hs.lineTo(4.3,9.5);hs.lineTo(4.7,-13.5);hs.lineTo(-4.7,-13.5);hs.lineTo(-4.3,9.5);hs.closePath();
const hullGeo=new THREE.ExtrudeGeometry(hs,{depth:4.4,steps:1,bevelEnabled:true,bevelThickness:.7,bevelSize:.8,bevelSegments:2});
hullGeo.rotateX(-Math.PI/2);
const hull=new THREE.Mesh(hullGeo,M.hull);
hull.position.y=-2.4;ship.add(hull);

function box(w,h,d,mat,x,y,z){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);ship.add(m);return m;}

/* superstructure */
box(5.4,3.4,3.6,M.bone,0,4.4,10.2);
box(4.4,2.4,3.0,M.bone,0,7.3,10.2);
box(4.0,0.75,0.14,M.win,0,7.6,8.66);
box(1.5,2.0,1.1,M.dark,0,9.2,12.0);
box(1.6,0.35,1.2,M.gold,0,9.9,12.0);

/* mast */
const mast=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,5,6),M.dark);
mast.position.set(0,5.2,-15.5);ship.add(mast);
const mastL=new THREE.Mesh(new THREE.SphereGeometry(.22,10,10),M.glow);
mastL.position.set(0,7.8,-15.5);ship.add(mastL);
const mastGlow=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xC5A059,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false}));
mastGlow.scale.set(4,4,1);mastGlow.position.copy(mastL.position);ship.add(mastGlow);

/* numbered golden containers 01–04 */
function numTex(n){
  const c=document.createElement('canvas');c.width=c.height=256;
  const x=c.getContext('2d');
  x.fillStyle='#B8934E';x.fillRect(0,0,256,256);
  x.fillStyle='rgba(0,0,0,0.10)';
  for(let i=0;i<16;i++)x.fillRect(i*16,0,6,256);
  x.fillStyle='#0A0A0C';
  x.font='italic 700 118px Georgia, serif';
  x.textAlign='center';x.textBaseline='middle';
  x.fillText(n,128,134);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
['01','02','03','04'].forEach((n,i)=>{
  const t=numTex(n);
  const face=new THREE.MeshStandardMaterial({map:t,roughness:.5,metalness:.4});
  const mats=[M.gold,face,M.gold,M.gold,M.gold,M.gold];
  const m=new THREE.Mesh(new THREE.BoxGeometry(3.1,3,4.4),mats);
  m.position.set(-2.4,4.2,-9+i*5);
  ship.add(m);
});
/* muted cargo stacks */
const stackMats=[M.dark,M.bronze,M.dim,M.hull];
let seed=7;const rnd=()=>((seed=seed*16807%2147483647)/2147483647);
for(let row=0;row<2;row++){
  for(let z=-11;z<=4;z+=5){
    const lv=1+Math.floor(rnd()*2);
    for(let l=0;l<lv;l++){
      const m=new THREE.Mesh(new THREE.BoxGeometry(2.3,2.6,4.4),stackMats[Math.floor(rnd()*4)]);
      m.position.set(row?1.2:3.6,4.0+l*2.6,z);
      ship.add(m);
    }
  }
}
scene.add(ship);

/* ---------- buoys ---------- */
const buoys=new THREE.Group();
const buoyList=[];
for(let k=0;k<8;k++){
  const g=new THREE.Group();
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.5,.62,1.3,8),M.dark);g.add(base);
  const top=new THREE.Mesh(new THREE.SphereGeometry(.4,10,10),new THREE.MeshStandardMaterial({color:0xC5A059,emissive:0xC5A059,emissiveIntensity:1.6}));
  top.position.y=.95;g.add(top);
  const gl=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xC5A059,transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));
  gl.scale.set(5,5,1);gl.position.y=1;g.add(gl);
  g.position.set((k%2?1:-1)*(7+(k*1.7)%6),0,-6-k*11);
  g.userData.ph=Math.random()*6.28;
  buoyList.push(g);buoys.add(g);
}
scene.add(buoys);

/* ---------- GOLDEN GLOBE ---------- */
const globe=new THREE.Group();
globe.position.set(0,120,-40);scene.add(globe);
const R=26;
globe.add(new THREE.Mesh(new THREE.SphereGeometry(R-0.5,48,48),new THREE.MeshStandardMaterial({color:0x07070a,roughness:.9,metalness:.1})));

function latLonToVec3(lat,lon,r){
  const phi=(90-lat)*Math.PI/180,theta=(lon+180)*Math.PI/180;
  return new THREE.Vector3(-r*Math.sin(phi)*Math.cos(theta),r*Math.cos(phi),r*Math.sin(phi)*Math.sin(theta));
}
/* dot grid */
const DN=1100,dPos=new Float32Array(DN*3),dSize=new Float32Array(DN);
const GA=Math.PI*(3-Math.sqrt(5));
for(let i=0;i<DN;i++){
  const y=1-(i/(DN-1))*2,rad=Math.sqrt(1-y*y),th=GA*i;
  dPos.set([Math.cos(th)*rad*R,y*R,Math.sin(th)*rad*R],i*3);
  dSize[i]=2.1+Math.random()*1.4;
}
const dotGeo=new THREE.BufferGeometry();
dotGeo.setAttribute('position',new THREE.BufferAttribute(dPos,3));
dotGeo.setAttribute('aSize',new THREE.BufferAttribute(dSize,1));
const dotMat=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uOpacity:{value:0}},
  vertexShader:`
    attribute float aSize;varying float vB;
    void main(){
      vec4 mv=modelViewMatrix*vec4(position,1.0);
      gl_PointSize=aSize*(120.0/-mv.z);
      vB=fract(sin(dot(position.xy,vec2(12.9898,78.233)))*43758.5453);
      gl_Position=projectionMatrix*mv;
    }`,
  fragmentShader:`
    uniform float uOpacity;varying float vB;
    void main(){
      float a=smoothstep(0.5,0.08,length(gl_PointCoord-0.5));
      vec3 gold=vec3(0.772,0.627,0.349);
      vec3 col=mix(gold,vec3(0.94,0.90,0.82),step(0.93,vB));
      gl_FragColor=vec4(col,a*(0.5+0.5*vB)*uOpacity);
    }`
});
globe.add(new THREE.Points(dotGeo,dotMat));

/* 45 ports */
const PORTS=[[25.76,-80.19],[26.08,-80.13],[26.53,-78.68],[25.06,-77.34],[17.97,-76.8],[18.45,-66.12],[18.46,-69.9],[18.55,-72.34],[23.14,-82.38],[17.12,-61.85],[15.3,-61.38],[13.15,-61.23],[13.1,-59.62],[10.65,-61.52],[12.11,-68.93],[12.52,-70.04],[16.24,-61.54],[14.6,-61.07],[13.99,-60.99],[9.35,-79.9],[10.4,-75.52],[11.0,-74.8],[10.6,-66.92],[5.83,-55.15],[19.2,-96.14],[29.74,-95.27],[29.95,-90.07],[30.32,-81.66],[32.08,-81.09],[32.78,-79.93],[36.85,-76.29],[40.7,-74.02],[42.36,-71.05],[44.65,-63.58],[51.95,4.14],[51.27,4.4],[53.55,9.97],[36.13,-5.44],[41.35,2.17],[44.41,8.93],[37.94,23.62],[1.26,103.84],[31.23,121.49],[-23.97,-46.3],[-12.05,-77.15]];
const pPos=new Float32Array(PORTS.length*3),pPhase=new Float32Array(PORTS.length),pSize=new Float32Array(PORTS.length);
PORTS.forEach((p,i)=>{
  const v=latLonToVec3(p[0],p[1],R+0.25);
  pPos.set([v.x,v.y,v.z],i*3);
  pPhase[i]=Math.random();pSize[i]=4.2+Math.random()*2;
});
const portGeo=new THREE.BufferGeometry();
portGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
portGeo.setAttribute('aPhase',new THREE.BufferAttribute(pPhase,1));
portGeo.setAttribute('aSize',new THREE.BufferAttribute(pSize,1));
const portMat=new THREE.ShaderMaterial({
  transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{uTime:{value:0},uOpacity:{value:0}},
  vertexShader:`
    attribute float aPhase;attribute float aSize;
    uniform float uTime;varying float vP;
    void main(){
      vec4 mv=modelViewMatrix*vec4(position,1.0);
      vP=0.6+0.4*sin(uTime*2.0+aPhase*6.2831);
      gl_PointSize=aSize*(120.0/-mv.z);
      gl_Position=projectionMatrix*mv;
    }`,
  fragmentShader:`
    uniform float uOpacity;varying float vP;
    void main(){
      float a=smoothstep(0.5,0.05,length(gl_PointCoord-0.5));
      gl_FragColor=vec4(vec3(0.85,0.68,0.4),a*vP*uOpacity);
    }`
});
globe.add(new THREE.Points(portGeo,portMat));

/* orbital comets: estelas de luz girando alrededor del planeta */
const TAU=Math.PI*2;
const ORBITS=[
 {r:1.05,tilt:[1.1,0,0.35],speed:0.10,phase:0.10},
 {r:1.12,tilt:[-0.5,0,1.15],speed:0.07,phase:0.55},
 {r:1.20,tilt:[0.35,0,-0.95],speed:0.055,phase:0.30},
 {r:1.08,tilt:[0.85,0,2.10],speed:0.085,phase:0.80},
 {r:1.16,tilt:[-1.0,0,-0.55],speed:0.065,phase:0.42},
 {r:1.03,tilt:[0.55,0,1.75],speed:0.095,phase:0.65}
];
const comets=ORBITS.map(o=>{
  const Ro=R*o.r;
  const pts=[];
  for(let k=0;k<=120;k++){
    const a=TAU*k/120;
    pts.push(new THREE.Vector3(Math.cos(a)*Ro,0,Math.sin(a)*Ro));
  }
  const curve=new THREE.CatmullRomCurve3(pts,false);
  const geo=new THREE.TubeGeometry(curve,240,0.07,5,false);
  const mat=new THREE.MeshBasicMaterial({color:0xC5A059,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
  mat.fog=false;
  const mesh=new THREE.Mesh(geo,mat);
  mesh.rotation.set(...o.tilt);
  globe.add(mesh);
  const head=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xFFE3A6,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
  head.scale.set(3.5,3.5,1);
  mesh.add(head);
  return {geo,mat,head,Ro,speed:o.speed,phase:o.phase};
});

/* atmosphere */
const atmo=new THREE.Sprite(new THREE.SpriteMaterial({map:GLOW,color:0xC5A059,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}));
atmo.material.fog=false;atmo.scale.set(120,120,1);globe.add(atmo);
globe.visible=false;

/* ============================================================
   CAMERA KEYFRAMES — one interpolation system owns the camera
============================================================ */
const secs={legacy:$('#legacy'),services:$('#services'),process:$('#process'),network:$('#network'),testi:$('#testimonials'),quote:$('#quote'),footer:$('#footer')};
let keys=[];
function docH(){return Math.max(1,document.documentElement.scrollHeight-innerHeight);}
function P(el){return clamp(el.offsetTop/docH(),0,1);}
function buildKeys(){
  const pL=P(secs.legacy),pS=P(secs.services),pP=P(secs.process),pN=P(secs.network),pT=P(secs.testi),pQ=P(secs.quote),pF=P(secs.footer);
  keys=[
    {p:0,cam:[-17,10.5,30],look:[0,3.5,-6],ocean:1,globe:0,arc:0,wake:.18,speed:.4,fogN:70,fogF:430,par:2.8},
    {p:pL-0.05,cam:[-12,4.5,18],look:[0,2.8,-14],ocean:1,globe:0,arc:0,wake:.3,speed:.8,fogN:50,fogF:380,par:2.2},
    {p:pL+0.03,cam:[-10,2.4,11],look:[3,2.6,-24],ocean:1,globe:0,arc:0,wake:.35,speed:.9,fogN:40,fogF:340,par:1.8},
    {p:pS+0.02,cam:[-9.5,9.8,14],look:[0,6.2,-4],ocean:1,globe:0,arc:0,wake:.3,speed:.85,fogN:45,fogF:380,par:1.5},
    {p:pP+0.02,cam:[2,24,36],look:[0,1.5,-30],ocean:1,globe:0,arc:0,wake:1,speed:1.25,fogN:60,fogF:520,par:1.3},
    {p:pN-0.02,cam:[2,64,72],look:[0,64,-48],ocean:.4,globe:.45,arc:0,wake:.3,speed:.8,fogN:120,fogF:900,par:1.0},
    {p:pN+0.03,cam:[6,130,50],look:[0,130,-40],ocean:0,globe:1,arc:1,wake:0,speed:0,fogN:180,fogF:1500,par:.9},
    {p:pT+0.02,cam:[42,128,18],look:[0,120,-40],ocean:0,globe:1,arc:1,wake:0,speed:0,fogN:180,fogF:1500,par:.7},
    {p:pQ-0.05,cam:[-6,16,34],look:[0,8,-60],ocean:.55,globe:.2,arc:1,wake:.3,speed:.4,fogN:110,fogF:640,par:1.2},
    {p:pQ+0.03,cam:[-12,5.2,26],look:[2,5,-60],ocean:1,globe:0,arc:1,wake:.45,speed:.35,fogN:46,fogF:330,par:1.7},
    {p:pF,cam:[-18,8,34],look:[0,4.5,-14],ocean:1,globe:0,arc:1,wake:.3,speed:.25,fogN:55,fogF:360,par:1.4},
    {p:1,cam:[-20,9,38],look:[0,5,-16],ocean:1,globe:0,arc:1,wake:.25,speed:.2,fogN:55,fogF:380,par:1.2}
  ];
  for(let i=1;i<keys.length;i++)if(keys[i].p<=keys[i-1].p)keys[i].p=keys[i-1].p+0.002;
  navPs=navEls.map(a=>{
    const el=document.getElementById(a.getAttribute('href').slice(1));
    return el?{el,p:P(el)}:null;
  }).filter(Boolean);
}
buildKeys();

const cur={cam:new THREE.Vector3(-17,10.5,30),look:new THREE.Vector3(0,3.5,-6),ocean:1,globe:0,arc:0,wake:.2,speed:.4,fogN:70,fogF:430,par:2.5};
const SCALARS=['ocean','globe','arc','wake','speed','fogN','fogF','par'];
function sample(p){
  p=clamp(p,0,1);
  let i=0;
  while(i<keys.length-2&&p>keys[i+1].p)i++;
  const a=keys[i],b=keys[i+1];
  const t=smooth(clamp((p-a.p)/Math.max(1e-5,(b.p-a.p)),0,1));
  cur.cam.set(lerp(a.cam[0],b.cam[0],t),lerp(a.cam[1],b.cam[1],t),lerp(a.cam[2],b.cam[2],t));
  cur.look.set(lerp(a.look[0],b.look[0],t),lerp(a.look[1],b.look[1],t),lerp(a.look[2],b.look[2],t));
  for(const k of SCALARS)cur[k]=lerp(a[k],b[k],t);
}

/* ---------- mouse parallax (single pointermove owner) ---------- */
const mouse={x:0,y:0,tx:0,ty:0};
window.addEventListener('pointermove',e=>{
  mouse.tx=(e.clientX/innerWidth-0.5)*2;
  mouse.ty=(e.clientY/innerHeight-0.5)*2;
},{passive:true});

/* ---------- visibility / pause ---------- */
let canvasInView=true,pageVisible=true;
new IntersectionObserver(es=>{canvasInView=es[0].isIntersecting;},{threshold:0}).observe(canvas);
document.addEventListener('visibilitychange',()=>{pageVisible=!document.hidden;});

/* ---------- resize ---------- */
let rto;
window.addEventListener('resize',()=>{
  clearTimeout(rto);
  rto=setTimeout(()=>{
    camera.aspect=innerWidth/innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth,innerHeight);
    buildKeys();
    if(HAS_GSAP)ScrollTrigger.refresh();
  },180);
});

/* ---------- main loop ---------- */
const clock=new THREE.Clock();
let elapsed=0;
if(HAS_GSAP)journey.p=journey.t;
function frame(){
  requestAnimationFrame(frame);
  if(!canvasInView||!pageVisible)return;
  const dt=Math.min(clock.getDelta(),0.05);
  elapsed+=dt;

  if(!HAS_GSAP){
    journey.t=clamp(scrollY/docH(),0,1);
    document.body.classList.toggle('scrolled',scrollY>30);
    updateNav(journey.t);
  }
  journey.p+=(journey.t-journey.p)*(1-Math.exp(-dt*5.5));
  sample(journey.p);

  mouse.x+=(mouse.tx-mouse.x)*(1-Math.exp(-dt*4));
  mouse.y+=(mouse.ty-mouse.y)*(1-Math.exp(-dt*4));

  camera.position.copy(cur.cam);
  camera.position.x+=mouse.x*cur.par;
  camera.position.y-=mouse.y*cur.par*0.5;
  camera.lookAt(cur.look);

  scene.fog.near=cur.fogN;scene.fog.far=cur.fogF;

  /* ocean + wake + stars */
  oceanMat.uniforms.uTime.value=elapsed;
  oceanMat.uniforms.uFade.value=cur.ocean;
  oceanMat.uniforms.uCam.value.copy(camera.position);
  ocean.visible=cur.ocean>0.02;
  wakeMat.uniforms.uTime.value=elapsed;
  wakeMat.uniforms.uIntensity.value=cur.wake;
  wake.visible=cur.wake>0.02&&cur.ocean>0.02;
  starMat.uniforms.uTime.value=elapsed;

  /* ship */
  ship.visible=cur.ocean>0.03;
  ship.position.y=Math.sin(elapsed*0.8)*0.4;
  ship.rotation.z=Math.sin(elapsed*0.5)*0.03;
  ship.rotation.x=Math.sin(elapsed*0.63)*0.018;

  /* buoys drift */
  buoys.visible=cur.ocean>0.05;
  const drift=cur.speed*dt*7;
  for(const b of buoyList){
    b.position.z+=drift;
    if(b.position.z>22)b.position.z-=110;
    b.position.y=Math.sin(elapsed*1.1+b.userData.ph)*0.35;
    b.rotation.z=Math.sin(elapsed*0.9+b.userData.ph)*0.06;
  }

  /* globe */
  globe.visible=cur.globe>0.02;
  if(globe.visible){
    globe.rotation.y=elapsed*0.12;
    dotMat.uniforms.uOpacity.value=cur.globe;
    portMat.uniforms.uOpacity.value=cur.globe;
    portMat.uniforms.uTime.value=elapsed;
    for(const c of comets){
      const total=c.geo.index.count;
      const win=Math.floor(total*0.16);
      const f=(elapsed*c.speed+c.phase)%1;
      const fade=Math.max(0,Math.min(1,f/0.1,(1-f)/0.1));
      c.mat.opacity=cur.globe*0.55*fade;
      const start=Math.floor(f*(total-win));
      c.geo.setDrawRange(start,win);
      const aH=TAU*((start+win)/total);
      c.head.position.set(Math.cos(aH)*c.Ro,0,Math.sin(aH)*c.Ro);
      c.head.material.opacity=cur.globe*0.9*fade;
    }
  }

  renderer.render(scene,camera);
}
frame();
}
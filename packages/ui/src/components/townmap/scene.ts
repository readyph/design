// @ts-nocheck
/**
 * TownMap scene engine (RDY-276, C16): the owner's isometric platform map, ported from the Portal Home prototype
 * (workshop/prototypes/portal-home/round-2/final/map.js) into a per-instance factory.
 *
 * Kept from the prototype: isometric projection, buildings per kind, generic office fallback, props, vehicles,
 * vans, camera rotation, painter's sort. Changed for the package:
 *  - no module state and no DOM creation: the React component renders the <svg> and the labels; this engine only
 *    draws into the layers it is given and reports label anchors;
 *  - colours follow the tokens in CSS: structural colours are `var(--map-*)`, every other colour is emitted as
 *    `light-dark(light, night)`, so a theme switch needs no redraw and no setDark;
 *  - the rAF loop is idle-aware (stops when nothing moves), pauses when off-screen, and everything is torn down in destroy().
 * The typed boundary is `SceneConfig` / `TownScene`; the drawing code below it is the prototype's, left untyped on purpose.
 */
export type TownStatus = 'ACTIVE' | 'DEGRADED' | 'OFFLINE';
export type TownLinkStatus = 'ok' | 'slow' | 'broken';
export type TownMapType = 'warehouse' | 'service' | 'store' | 'office';
export interface ScenePlatform { id: string; type: TownMapType; name: string; sign?: string; status: TownStatus; color?: string }
export interface SceneLink { from: string; to: string; status: TownLinkStatus }
export interface SceneView { sel: string | null; focus: string | null; hl: string[] | null }
export interface SceneLayers { svg: SVGSVGElement; base: SVGGElement; marks: SVGGElement; links: SVGGElement; glow: SVGGElement; objects: SVGGElement }
export interface SceneConfig {
  uid: string;
  /** false: the ring only, nothing is dimmed when a building is selected. */
  dim: () => boolean;
  colorOf: (id: string) => string | undefined;
  onPick: (id: string | null) => void;
  onHover: (id: string | null) => void;
  /** The view changed (rotation frame, zoom, redraw): label anchors moved. */
  onView: () => void;
  reduced: () => boolean;
}
export interface TownScene {
  attach(layers: SceneLayers): () => void;
  render(platforms: (ScenePlatform | null)[], links: SceneLink[]): void;
  setView(v: SceneView): void;
  state(): SceneView;
  morph(from: SceneView, ms: number): void;
  runVan(from: string, to: string): boolean;
  rotate(dir: number): void;
  zoom(dir: number): number;
  anchors(host: DOMRect): { id: string; ax: number; ay: number }[];
  setPaused(p: boolean): void;
  destroy(): void;
}

export function createTownScene(cfg: SceneConfig): TownScene {
const UID = cfg.uid;
const OPTS = { get dim() { return cfg.dim(); } };
/* ---------- tokens ---------- */
const P50='#EFF6FF',P100='#DBEAFE',P200='#BFDBFE',P300='#93C5FD',P400='#60A5FA',P500='#3B82F6',
      P600='#2563EB',P700='#1D4ED8',P800='#1E40AF',P900='#1E3A8A',
      AMBER='#D97706',PEACH_BG='#FBE5DE',PEACH_FG='#8F3D28',TEAL='#1F6A73',
      INK='#171717',INK_M='#525252';
const LIT='#FFD66B', LIT_SOFT='#FFE7A3';

/* ---------- camera + isometric projection ---------- */
// OX/OY: world offset of the plot being drawn (builders draw in their own plot coords)
// THETA: camera rotation around the island centre (CX, CY)
let OX=0, OY=0, CX=0, CY=0, THETA=0, ROT={c:1,s:0}, CAM={x:1,y:1};
function setTheta(t){ THETA=t; ROT={c:Math.cos(t), s:Math.sin(t)}; CAM={x:ROT.c+ROT.s, y:ROT.c-ROT.s}; }
const C = Math.cos(Math.PI/6), S = 0.5;
const P = (x,y,z=0) => { x+=OX-CX; y+=OY-CY; const xr=x*ROT.c-y*ROT.s, yr=x*ROT.s+y*ROT.c; return [(xr-yr)*C, (xr+yr)*S - z]; };
const f1 = n => Math.round(n*10)/10, f3 = n => Math.round(n*1000)/1000, num=(a,b)=>a-b;
const pts = a => a.map(p => { const q = P(...p); return f1(q[0])+','+f1(q[1]); }).join(' ');
const vis = (n, comp) => n*comp > 1e-6;                  // is a face with normal sign n (on that axis) facing the camera?
const SX = () => CAM.x>0 ? 1 : -1, SY = () => CAM.y>0 ? 1 : -1;
const screenSide = (nx,ny) => (nx*ROT.c-ny*ROT.s) - (nx*ROT.s+ny*ROT.c);   // <0 → face points screen-left
const faceTone = (nx,ny,c) => screenSide(nx,ny) < 0 ? c.left : c.right;

// "Clay" look (à la Zdog): no outlines — every shape is stroked in its own fill colour with
// round joins, so corners and edges puff out and read as soft rounded volume.
const EDGE = '__clay__';
let CW = 5;
const CLAY_K = 1.9;
const clay = w => '__clay:'+w;
const NOE = 'stroke="none"';
const poly = (a, fill, extra=EDGE) => {
  let e = extra;
  if(extra===EDGE || (typeof extra==='string' && extra.startsWith('__clay:'))){
    const w = (extra===EDGE ? CW : +extra.slice(7)) * CLAY_K;
    e = `stroke="${fill}" stroke-width="${w}" stroke-linejoin="round"`;
  }
  return `<polygon points="${pts(a)}" fill="${fill}" ${e}/>`;
};
const withCW = (w, fn) => { const prev=CW; CW=w; try { return fn(); } finally { CW=prev; } };

function shade(hex, k){
  const n = parseInt(hex.slice(1),16); let r=n>>16, g=(n>>8)&255, b=n&255;
  const f = c => Math.round(k>0 ? c+(255-c)*k : c*(1+k));
  return '#'+[f(r),f(g),f(b)].map(v=>v.toString(16).padStart(2,'0')).join('');
}
const tone = (hex, up=.32, dn=-.2) => ({ top: shade(hex,up), left: hex, right: shade(hex,dn) });
const WHITE = { top:'#FFFFFF', left:'#F3F7FD', right:'#D5E3F6' };
const CONCRETE = { top:'#F4F7FC', left:'#DCE6F5', right:'#C3D4EE' };
const GREY = tone('#E5E5E5',.4,-.18);

// the two camera-facing vertical faces of an axis-aligned block
function walls(x0,x1,y0,y1,z0,z1,c,e=EDGE){
  const sx=SX(), sy=SY(), fx=sx>0?x1:x0, fy=sy>0?y1:y0;
  return poly([[fx,y0,z0],[fx,y1,z0],[fx,y1,z1],[fx,y0,z1]], faceTone(sx,0,c), e)
       + poly([[x0,fy,z0],[x1,fy,z0],[x1,fy,z1],[x0,fy,z1]], faceTone(0,sy,c), e);
}
function box(x,y,z,w,d,h,c,e=EDGE){
  return walls(x,x+w,y,y+d,z,z+h,c,e) + poly([[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]], c.top, e);
}
// decals on a vertical plane; n = which way the face points (+1 / -1). Hidden when facing away.
const qL = (y,x0,x1,z0,z1,f,e=EDGE,n=1) => vis(n,CAM.y) ? poly([[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]], f, e) : '';
const qR = (x,y0,y1,z0,z1,f,e=EDGE,n=1) => vis(n,CAM.x) ? poly([[x,y0,z0],[x,y1,z0],[x,y1,z1],[x,y0,z1]], f, e) : '';
const qT = (z,x0,x1,y0,y1,f,e=EDGE) => poly([[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]], f, e);
function line(a,b,stroke,w=1,extra=''){ const p=P(...a), q=P(...b);
  return `<line x1="${f1(p[0])}" y1="${f1(p[1])}" x2="${f1(q[0])}" y2="${f1(q[1])}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`; }
function textPlane(axis,n,s,x,y,z,size,fill,weight=700,ls=0,extra=''){
  if(!vis(n, axis==='y'?CAM.y:CAM.x)) return '';
  const p0=P(x,y,z), p1 = axis==='y' ? P(x+1,y,z) : P(x,y+1,z);
  let ax=p1[0]-p0[0], ay=p1[1]-p0[1]; if(ax<0){ ax=-ax; ay=-ay; }       // always read left → right
  return `<text transform="matrix(${f3(ax)},${f3(ay)},0,1,${f1(p0[0])},${f1(p0[1])})" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="middle" letter-spacing="${ls}" font-family="Nunito, Inter, sans-serif" ${extra}>${s}</text>`;
}
const textL = (s,x,y,z,size,fill,w,ls,ex) => textPlane('y',1,s,x,y,z,size,fill,w,ls,ex);
const textR = (s,x,y,z,size,fill,w,ls,ex) => textPlane('x',1,s,x,y,z,size,fill,w,ls,ex);
function ellT(x,y,z,r,fill,extra=''){ const [sx,sy]=P(x,y,z);
  return `<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(r*1.2247)}" ry="${f1(r*.7071)}" fill="${fill}" ${extra}/>`; }
function circV(plane, u, v, r, fill, e=NOE){ const a=[];
  for(let i=0;i<18;i++){ const t=i/18*Math.PI*2, du=r*Math.cos(t), dv=r*Math.sin(t);
    a.push(plane.axis==='y' ? [u+du, plane.at, v+dv] : [plane.at, u+du, v+dv]); }
  return poly(a, fill, e); }
// paint a list of [x, y, svgString] back-to-front for the current camera
const sorted = items => items.sort((a,b)=>(a[0]*CAM.x+a[1]*CAM.y)-(b[0]*CAM.x+b[1]*CAM.y)).map(i=>i[2]).join('');

/* ---------- lights ---------- */
let CUR = null;                                  // platform whose plot is being drawn
const isLit = () => !!(CUR && CUR.lights);
const glow = str => (str && isLit()) ? `<g filter="url(#glow)">${str}</g>` : str;
const lit = (on, off) => isLit() ? on : off;

/* ---------- scene registry ---------- */
const PLOT = 520, RW = 60, M = 30;
let svgEl, baseEl, glowEl, objLayer, linksEl;
let objects=[], movers=[], baseDraws=[], glowDraws=[], lastOrder=[], LABEL_K=1, DIRTY=true, PLATS=[], LABELS=[];
function obj(fp, fn){
  const g=document.createElementNS('http://www.w3.org/2000/svg','g');
  const o={ fp:[fp[0]+OX,fp[1]+OX,fp[2]+OY,fp[3]+OY], ox:OX, oy:OY, plot:CUR, fn, g };
  if(CUR){ g.classList.add('plot-obj'); }
  g.__o=o; objects.push(o); objLayer.appendChild(g); return o;
}
const baseAdd = fn => baseDraws.push({ox:OX, oy:OY, plot:CUR, fn});
const glowAdd = fn => glowDraws.push({ox:OX, oy:OY, plot:CUR, fn});
function run(d){ OX=d.ox; OY=d.oy; CUR=d.plot; const s=d.fn(); OX=OY=0; CUR=null; return s; }
const shadow = (x0,x1,y0,y1,o=22) => poly([[x0+o,y0,0],[x1+o,y0,0],[x1+o,y1-o*.4,0],[x1,y1,0],[x0+o,y1,0]], 'rgba(30,58,138,.07)', NOE);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hash = s => { let h=7; for(const ch of String(s)) h=(h*31+ch.charCodeAt(0))>>>0; return h; };

/* ---------- flat roof with parapet ---------- */
function flatRoof(x0,x1,y0,y1,H,deck=P100){
  const ix = CAM.x>0 ? x0+6 : x1-6, iy = CAM.y>0 ? y0+6 : y1-6;
  return qT(H,x0,x1,y0,y1,'#FFFFFF') + qT(H-5,x0+6,x1-6,y0+6,y1-6,deck)
       + poly([[x0+6,iy,H-5],[x1-6,iy,H-5],[x1-6,iy,H],[x0+6,iy,H]],'#E3ECF8')
       + poly([[ix,y0+6,H-5],[ix,y1-6,H-5],[ix,y1-6,H],[ix,y0+6,H]],'#CAD9EF');
}

/* ---------- Warehouse (Inventory) ---------- */
const WALLB = { top:P500, left:P600, right:P700 };
function warehouse(){
  const x0=60,x1=400,y0=60,y1=360,H=100,RY=210,RZ=150,o=10, k=(RZ-H)/(RY-y0), zb=H-o*k;
  obj([x0-o,x1+o,y0-o,y1], ()=>withCW(8, ()=>{ let s='';
    const gx=CAM.x>0?x1:x0, wy=CAM.y>0?y1:y0, gcol=faceTone(SX(),0,WALLB), wcol=faceTone(0,SY(),WALLB);
    s += poly([[gx,y0,0],[gx,y1,0],[gx,y1,H],[gx,RY,RZ],[gx,y0,H]], gcol);                 // gable end
    s += glow(poly([[gx,RY-40,H+(RY-40-y0)*k-14],[gx,RY+40,H+(y1-RY-40)*k-14],[gx,RY+40,H+(y1-RY-40)*k-30],[gx,RY-40,H+(RY-40-y0)*k-30]], lit(LIT_SOFT,P300)));
    s += poly([[x0,wy,0],[x1,wy,0],[x1,wy,H],[x0,wy,H]], wcol);                            // long wall
    for(let x=x0+40;x<x1-20;x+=90) s += poly([[x-1.5,wy,4],[x+1.5,wy,4],[x+1.5,wy,H-6],[x-1.5,wy,H-6]], shade(wcol,-.08), clay(4));
    ['A','B','C'].forEach((L,i)=>{ const xa=95+i*90;
      s += qL(y1,xa-6,xa+66,12,88,'#FFFFFF');
      s += qL(y1,xa,xa+60,14,82,P800);
      for(let z=30;z<80;z+=16) s += qL(y1,xa+6,xa+54,z,z+2,shade(P800,-.15),clay(3));
      s += textL(L,xa+30,y1,32,38,lit(LIT_SOFT,P300),800);
      s += glow(qL(y1,xa+18,xa+42,91,95,lit(LIT,'#CBD5E1'),clay(3)));                       // door lamp
    });
    const zf=y=>RZ-(y-RY)*k, zk=y=>H+(y-y0)*k;
    const back = () => { let r=poly([[x0-o,y0-o,zb],[x1+o,y0-o,zb],[x1+o,RY,RZ],[x0-o,RY,RZ]], P400), sk='';
      for(let i=0;i<7;i++){ const xa=x0+22+i*46, xb=xa+16;
        sk += poly([[xa,y0+14,zk(y0+14)],[xb,y0+14,zk(y0+14)],[xb,RY-16,zk(RY-16)],[xa,RY-16,zk(RY-16)]], lit(LIT_SOFT,P200), clay(3)); }
      return r+glow(sk); };
    const front = () => { let r=poly([[x0-o,RY,RZ],[x1+o,RY,RZ],[x1+o,y1+o,zb],[x0-o,y1+o,zb]], P500), sk='';
      for(let i=0;i<7;i++){ const xa=x0+22+i*46, xb=xa+16;
        sk += poly([[xa,RY+16,zf(RY+16)],[xb,RY+16,zf(RY+16)],[xb,y1-14,zf(y1-14)],[xa,y1-14,zf(y1-14)]], lit(LIT,P100), clay(3)); }
      return r+glow(sk); };
    s += CAM.y>0 ? back()+front() : front()+back();
    const ex=CAM.x>0?x1+o:x0-o, ey=CAM.y>0?y1+o:y0-o;
    s += poly([[ex,y0-o,zb],[ex,RY,RZ],[ex,y1+o,zb],[ex,y1+o,zb-4],[ex,RY,RZ-4],[ex,y0-o,zb-4]], P800);
    s += poly([[x0-o,ey,zb-4],[x1+o,ey,zb-4],[x1+o,ey,zb],[x0-o,ey,zb]], P700);
    s += line([x0-o,RY,RZ+.5],[x1+o,RY,RZ+.5],shade(P400,.15),8);
    return s; }));
  obj([x0,x1,y1,y1+20], ()=>withCW(8, ()=> box(x0,y1,0,x1-x0,20,12,CONCRETE)
      + [0,1,2].map(i=>qL(y1+20,95+i*90,155+i*90,2,10,AMBER)).join('')));
}

/* ---------- Service shop (SMS) ---------- */
function serviceShop(){
  const x0=660,x1=940,y0=140,y1=380,H=86;
  obj([x0,x1,y0,y1], ()=>withCW(7, ()=>{ let s='';
    s += walls(x0,x1,y0,y1,0,H,WHITE);
    s += walls(x0,x1,y0,y1,H-16,H-5,{left:P600,right:P800});
    s += flatRoof(x0,x1,y0,y1,H);
    // +x side: windows + door
    s += glow(qR(x1,170,236,30,56,lit(LIT,P200)) + qR(x1,250,300,30,56,lit(LIT,P200)));
    if(!isLit()) s += vis(1,CAM.x) ? poly([[x1,178,32],[x1,190,32],[x1,206,54],[x1,194,54]],'#fff','stroke="#fff" stroke-width="3" stroke-linejoin="round" opacity=".6"') : '';
    s += qR(x1,318,348,0,50,P700) + glow(qR(x1,322,344,26,46,lit(LIT,P300)));
    // +y side: bays
    if(vis(1,CAM.y)) [680,770,860].forEach((xa,i)=>{
      s += qL(y1,xa-4,xa+68,0,66,P700);
      if(i===0){
        s += glow(qL(y1,xa,xa+64,0,62,lit('#FCE7B0',P900)));
        s += qL(y1,xa+7,xa+10,0,50,AMBER,clay(3)) + qL(y1,xa+54,xa+57,0,50,AMBER,clay(3)) + qL(y1,xa+7,xa+57,22,24,AMBER,clay(3));
        s += poly([[xa+12,y1,25],[xa+52,y1,25],[xa+52,y1,33],[xa+44,y1,35],[xa+38,y1,43],[xa+22,y1,43],[xa+16,y1,35],[xa+12,y1,34]], P400, clay(4));
        s += poly([[xa+23,y1,36],[xa+37,y1,36],[xa+36,y1,41],[xa+24,y1,41]], P200, clay(2));
        s += circV({axis:'y',at:y1},xa+20,25,4,'#26355F') + circV({axis:'y',at:y1},xa+44,25,4,'#26355F');
      } else {
        s += qL(y1,xa,xa+64,0,62,'#E7EEF9');
        for(let z=14;z<60;z+=14) s += qL(y1,xa+6,xa+58,z,z+2,P200,clay(3));
        s += qL(y1,xa+26,xa+38,2,5,P300,clay(3));
      }
      s += glow(qL(y1,xa+22,xa+42,69,72,lit(LIT,'#CBD5E1'),clay(3)));
    });
    // rooftop, painted back-to-front
    const roof=[];
    roof.push([723,189, box(706,176,H-5,34,26,14,GREY) + ellT(723,189,H+9.2,8,'#A3A3A3')]);
    roof.push([787,197, box(770,184,H-5,34,26,14,GREY) + ellT(787,197,H+9.2,8,'#A3A3A3')]);
    for(let i=0;i<4;i++){ const x=832+i*24;
      roof.push([x+10,290, poly([[x,250,H-3],[x+20,250,H-3],[x+20,330,H+6],[x,330,H+6]], P700, clay(3))]); }
    roof.push([800,375, box(708,372,H,184,6,26,tone(P700,.3,-.2))
      + textL('SERVICE SHOP',800,378.3,H+8,15,lit(LIT,'#FFFFFE'),800,2, isLit()?'filter="url(#glow)"':'')]);
    s += sorted(roof);
    return s; }));
}

/* ---------- Store (POS / retail) ---------- */
function store(){
  const x0=100,x1=420,y0=680,y1=940,H=78;
  obj([x0,x1,y0,y1], ()=>withCW(7, ()=>{ let s='';
    s += walls(x0,x1,y0,y1,0,H,WHITE);
    s += flatRoof(x0,x1,y0,y1,H);
    const roof=[[200,735, box(180,720,H-5,40,30,12,GREY)]];
    for(let i=0;i<3;i++) for(let j=0;j<2;j++){ const x=250+i*50, y=760+j*80;
      roof.push([x+13,y+20, box(x,y,H-5,26,40,5,CONCRETE) + glow(qT(H+.1,x+3,x+23,y+3,y+37,lit(LIT,P200),clay(3)))]); }
    s += sorted(roof);
    if(vis(1,CAM.x)){
      const win=(ya,yb)=>{ let w = glow(qR(x1,ya,yb,6,54,lit(LIT_SOFT,P200),clay(3)));
        if(!isLit()) w += poly([[x1,ya+10,8],[x1,ya+24,8],[x1,ya+42,52],[x1,ya+28,52]],'#fff','stroke="#fff" stroke-width="3" stroke-linejoin="round" opacity=".55"');
        for(let y=ya+8;y<yb-6;y+=12) w += qR(x1,y+1,y+7,32,39,[AMBER,P500,PEACH_BG][(y/12|0)%3],clay(3));
        return w; };
      s += win(698,782) + win(838,922);
      s += qR(x1,790,830,0,54,P700) + glow(qR(x1,796,824,4,48,lit(LIT,P300),clay(3)));
      s += qR(x1,y0,y1,H-15,H-2,P700);
      s += textR('STORE',x1+.3,(y0+y1)/2,H-12.5,12,lit(LIT,'#FFFFFE'),800,4, isLit()?'filter="url(#glow)"':'');
    }
    s += glow(qL(y1,150,205,26,54,lit(LIT_SOFT,P200),clay(3)) + qL(y1,225,280,26,54,lit(LIT_SOFT,P200),clay(3)));
    s += qL(y1,310,392,12,62,PEACH_BG);
    s += qL(y1,322,354,22,52,AMBER,clay(3)) + qL(y1,360,382,40,52,P500,clay(3)) + qL(y1,360,382,22,34,P200,clay(3));
    return s; }));
  // awning is its own object so it sorts correctly from every side
  obj([x1,x1+28,692,928], ()=>withCW(7, ()=>{ let s='';
    const n=14, ya=692, yb=928, wdt=(yb-ya)/n;
    for(let i=0;i<n;i++){ const a=ya+i*wdt, c=ya+(i+1)*wdt, col=i%2?'#FFFFFF':AMBER;
      s += poly([[x1,a,62],[x1,c,62],[x1+28,c,52],[x1+28,a,52]], col, clay(3));
      s += qR(x1+28,a,c,45,52, i%2?'#F3F7FD':shade(AMBER,-.15), clay(4)); }
    const ye = CAM.y>0 ? yb : ya;
    s += poly([[x1,ye,62],[x1+28,ye,52],[x1+28,ye,45]], shade(AMBER,-.25), clay(3));
    return s; }));
}

/* ---------- generic building (fallback for any other platform type) ---------- */
function office(p){
  const x0=90,x1=380,y0=70,y1=330,H=130, mid=(x0+x1)/2, acc=p.color||P600;
  obj([x0,x1,y0,y1], ()=>withCW(7, ()=>{ let s='';
    s += walls(x0,x1,y0,y1,0,H,WHITE);
    const fx=CAM.x>0?x1:x0, fy=CAM.y>0?y1:y0; let w='';
    for(let z=48; z<H-20; z+=28){
      w += poly([[x0+16,fy,z],[x1-16,fy,z],[x1-16,fy,z+16],[x0+16,fy,z+16]], lit(LIT_SOFT,P200), clay(3));
      w += poly([[fx,y0+16,z],[fx,y1-16,z],[fx,y1-16,z+16],[fx,y0+16,z+16]], lit(LIT_SOFT,shade(P200,-.06)), clay(3)); }
    s += glow(w);
    s += walls(x0,x1,y0,y1,H-14,H-4,{left:acc,right:shade(acc,-.2)});
    s += flatRoof(x0,x1,y0,y1,H);
    s += qL(y1,mid-30,mid+30,0,38,acc) + glow(qL(y1,mid-22,mid+22,2,32,lit(LIT,P300),clay(3)));
    const name = esc(String(p.sign ?? p.name).toUpperCase().slice(0,18)), sw = Math.min(x1-x0-30, 40+name.length*11);
    s += sorted([
      [155,130, box(130,110,H-5,50,40,18,GREY) + ellT(155,130,H+13.2,11,'#A3A3A3')],
      [mid,y1-5, box(mid-sw/2,y1-8,H,sw,6,26,tone(acc,.3,-.2)) + textL(name,mid,y1-1.7,H+8,15,lit(LIT,'#FFFFFE'),800,1.5, isLit()?'filter="url(#glow)"':'')] ]);
    return s; }));
  obj([mid-40,mid+40,y1,y1+22], ()=>withCW(7, ()=> box(mid-40,y1,38,80,22,5,tone(acc))));
}

/* ---------- props ---------- */
const BOX_W = WHITE, BOX_A = tone(AMBER,.35,-.18), BOX_B = tone(P400,.35,-.18), WOOD = tone(P300,.3,-.2);
function pallet(x,y,layers,pattern){
  obj([x,x+36,y,y+30], ()=>withCW(3, ()=>{ let s = box(x,y,0,36,30,5,WOOD), i=0;
    for(let l=0;l<layers;l++){ const items=[];
      for(const [dx,dy] of [[0,0],[18,0],[0,15],[18,15]]){ const c = pattern[i++%pattern.length];
        let t = box(x+dx,y+dy,5+l*13,18,15,13,c);
        if(c===BOX_W) t += qL(y+dy+15,x+dx+8,x+dx+10,7+l*13,16+l*13,'#E3ECF8',clay(2));
        items.push([x+dx+9,y+dy+7.5,t]); }
      s += sorted(items); }
    return s; }));
}
function tree(x,y,r=17){
  obj([x-4,x+4,y-4,y+4], ()=>{ const [sx,sy]=P(x,y,14+r);
    return ellT(x+5,y+3,0,r*.85,'rgba(30,58,138,.08)') + line([x,y,0],[x,y,18],'#A0634E',9)
      + `<circle cx="${f1(sx)}" cy="${f1(sy)}" r="${r}" fill="#5FAE7A"/>`
      + `<circle cx="${f1(sx-r*.16)}" cy="${f1(sy-r*.18)}" r="${f1(r*.8)}" fill="#7DC793"/>`; });
}
const trees = list => list.forEach(([x,y])=>tree(x,y, 17+((x*7+y*3)%7)));
function tires(x,y){
  obj([x-9,x+9,y-9,y+9], ()=>{ let s='';
    for(let i=0;i<4;i++){ const z=i*7, [sx,sy]=P(x,y,z), [tx,ty]=P(x,y,z+6), rx=9*1.2247, ry=9*.7071;
      s += `<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="#26355F"/>`;
      s += `<rect x="${f1(sx-rx)}" y="${f1(ty)}" width="${f1(rx*2)}" height="${f1(sy-ty)}" fill="#26355F"/>`;
      s += `<ellipse cx="${f1(tx)}" cy="${f1(ty)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${P800}"/>`;
      s += `<ellipse cx="${f1(tx)}" cy="${f1(ty)}" rx="${f1(rx*.45)}" ry="${f1(ry*.45)}" fill="#26355F"/>`; }
    return s; });
}
function bench(x,y){
  obj([x,x+12,y,y+36], ()=>withCW(2.5, ()=> sorted([
    [x+2,y+3, box(x+1,y+2,0,2,2,6,tone(P800))], [x+2,y+33, box(x+1,y+32,0,2,2,6,tone(P800))],
    [x+5,y+18, box(x,y,6,10,36,3,WOOD) + box(x,y,9,2.5,36,9,WOOD)] ])));
}
function toolbox(x,y){ obj([x,x+14,y,y+12], ()=>withCW(3, ()=> box(x,y,0,14,12,22,tone('#DC2626',.35,-.2)) + qL(y+13,x+2,x+12,13,14,'#991B1B',clay(2)))); }
// street lamp + the pool of light it throws when the plot's lights are on
function lamp(x,y){
  obj([x-2,x+2,y-2,y+2], ()=>{ const [hx,hy]=P(x,y,48);
    return ellT(x+3,y+2,0,5,'rgba(30,58,138,.1)') + line([x,y,0],[x,y,46],'#94A3B8',4.5)
      + (isLit() ? `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="15" fill="${LIT}" opacity=".5" filter="url(#blur8)"/>` : '')
      + `<circle cx="${f1(hx)}" cy="${f1(hy)}" r="6.5" fill="${lit('#FFE38A','#E2E8F0')}"/>`; });
  pool(x,y,48);
}
const pool = (x,y,r) => glowAdd(()=> isLit() ? ellT(x,y,0,r,'url(#pool)') : '');

/* ---------- vehicles ---------- */
const DIRS = { '+x':{f:[1,0],s:[0,1]}, '-x':{f:[-1,0],s:[0,-1]}, '+y':{f:[0,1],s:[-1,0]}, '-y':{f:[0,-1],s:[1,0]} };
function bbOf(cx,cy,dir,a0,a1,c0,c1){ const {f,s}=DIRS[dir], xs=[], ys=[];
  for(const a of [a0,a1]) for(const c of [c0,c1]){ xs.push(cx+f[0]*a+s[0]*c); ys.push(cy+f[1]*a+s[1]*c); }
  return [Math.min(...xs),Math.max(...xs),Math.min(...ys),Math.max(...ys)]; }
const alongX = d => d[1]==='x';
function sidePlane(dir,bb,off=1){
  if(alongX(dir)) return { axis:'y', at: CAM.y>0 ? bb[3]+off : bb[2]-off };
  return { axis:'x', at: CAM.x>0 ? bb[1]+off : bb[0]-off }; }
function quadOn(pl,u0,u1,z0,z1,fill){
  return pl.axis==='y' ? poly([[u0,pl.at,z0],[u1,pl.at,z0],[u1,pl.at,z1],[u0,pl.at,z1]],fill,clay(2.5))
                       : poly([[pl.at,u0,z0],[pl.at,u1,z0],[pl.at,u1,z1],[pl.at,u0,z1]],fill,clay(2.5)); }
function sideQuad(cx,cy,dir,bb,a0,a1,z0,z1,fill){ const {f}=DIRS[dir], pl=sidePlane(dir,bb);
  const u = (alongX(dir) ? [cx+f[0]*a0,cx+f[0]*a1] : [cy+f[1]*a0,cy+f[1]*a1]).sort(num);
  return quadOn(pl,u[0]+1,u[1]-1,z0+1,z1-1,fill); }
function endQuad(cx,cy,dir,bb,end,c0,c1,z0,z1,fill){ const {f,s}=DIRS[dir], k=end==='front'?1:-1, fx=f[0]*k, fy=f[1]*k;
  if(fx*CAM.x+fy*CAM.y <= 0) return '';
  if(alongX(dir)){ const u=[cy+s[1]*c0,cy+s[1]*c1].sort(num); return quadOn({axis:'x',at: fx>0?bb[1]+1:bb[0]-1},u[0]+1,u[1]-1,z0+1,z1-1,fill); }
  const u=[cx+s[0]*c0,cx+s[0]*c1].sort(num); return quadOn({axis:'y',at: fy>0?bb[3]+1:bb[2]-1},u[0]+1,u[1]-1,z0+1,z1-1,fill); }

const MODELS = {
  truck: { r:6.5, wheels:[-42,-26,38], parts:[
    { a:[-56,20], c:[-13,13], z:[7,50], tone:WHITE, side:[[-50,14,18,24,P500]], rear:[[-11,11,10,47,'#E3ECF8']] },
    { a:[22,56], c:[-12,12], z:[7,36], tone:tone(P600), side:[[32,48,22,32,P200]], front:[[-10,10,22,33,P200],[-10,10,10,14,P300]] } ]},
  van: { r:5.5, wheels:[-18,20], parts:[
    { a:[-30,16], c:[-12,12], z:[5,33], tone:WHITE, side:[[2,14,20,30,P200],[-28,14,12,16,P600]], front:[[-10,10,21,31,P200]], rear:[[-10,10,20,30,P200]] },
    { a:[16,30], c:[-12,12], z:[5,20], tone:WHITE, side:[[16,28,12,16,P600]], front:[[-9,9,10,13,P300]] } ]},
  cvan: { r:5.5, wheels:[-18,20], parts:[
    { a:[-30,16], c:[-12,12], z:[5,33], tone:null, side:[[2,14,20,30,P100],[-27,-1,12,26,'#FFFFFF']], front:[[-10,10,21,31,P100]], rear:[[-10,10,12,30,'#FFFFFF']] },
    { a:[16,30], c:[-12,12], z:[5,20], tone:null, front:[[-9,9,10,13,'#FFFFFF']] } ]},
  car: { r:4.5, wheels:[-13,13], parts:[
    { a:[-22,22], c:[-11,11], z:[3,13], tone:null },
    { a:[-12,8], c:[-10,10], z:[13,22], tone:null, side:[[-10,6,15,21,P100]], front:[[-8,8,15,21,P100]], rear:[[-8,8,15,21,P100]] } ]},
  forklift: { r:3.6, wheels:[-6,5], parts:[
    { a:[-9,6], c:[-7,7], z:[2,13], tone:tone(AMBER,.35,-.18), side:[[-7,4,8,11,P900]] },
    { a:[-7,-5], c:[-7,-5], z:[13,26], tone:tone(P800) }, { a:[-7,-5], c:[5,7], z:[13,26], tone:tone(P800) },
    { a:[2,4], c:[-7,-5], z:[13,26], tone:tone(P800) }, { a:[2,4], c:[5,7], z:[13,26], tone:tone(P800) },
    { a:[-8,5], c:[-7,7], z:[26,28], tone:tone(P800) },
    { a:[7,9], c:[-6,6], z:[0,32], tone:tone(P900,.3,-.1) },
    { a:[9,21], c:[-5,5], z:[1,2.5], tone:tone(P900,.3,-.1) } ]},
};
function drawVehicle(model, cx, cy, dir, opts={}){ return withCW(3.5, ()=>{
  const M = MODELS[model]; let s='', all=[1e9,-1e9,1e9,-1e9];
  const parts = M.parts.concat(opts.load ? [{ a:[9,21], c:[-6,6], z:[2.5,16], tone:BOX_W }] : [])
    .map(p => { const bb=bbOf(cx,cy,dir,p.a[0],p.a[1],p.c[0],p.c[1]);
      all=[Math.min(all[0],bb[0]),Math.max(all[1],bb[1]),Math.min(all[2],bb[2]),Math.max(all[3],bb[3])]; return {...p,bb}; })
    .sort((p,q)=> (p.z[0]>12)-(q.z[0]>12) || ((p.bb[0]+p.bb[1])*CAM.x+(p.bb[2]+p.bb[3])*CAM.y)-((q.bb[0]+q.bb[1])*CAM.x+(q.bb[2]+q.bb[3])*CAM.y));
  s += qT(0,all[0]-1,all[1]+4,all[2]-1,all[3]+4,'rgba(30,58,138,.10)','stroke="rgba(30,58,138,.10)" stroke-width="6" stroke-linejoin="round"');
  for(const p of parts){ const bb=p.bb, t=p.tone||(p.z[0]>=13 ? tone(shade(opts.color,.25)) : tone(opts.color));
    s += box(bb[0],bb[2],p.z[0],bb[1]-bb[0],bb[3]-bb[2],p.z[1]-p.z[0],t);
    for(const q of p.side||[]) s += sideQuad(cx,cy,dir,bb,q[0],q[1],q[2],q[3],q[4]);
    for(const q of p.front||[]) s += endQuad(cx,cy,dir,bb,'front',q[0],q[1],q[2],q[3],q[4]);
    for(const q of p.rear||[]) s += endQuad(cx,cy,dir,bb,'rear',q[0],q[1],q[2],q[3],q[4]); }
  const {f}=DIRS[dir], pl=sidePlane(dir,all,.3);
  for(const a of M.wheels){ const u = alongX(dir) ? cx+f[0]*a : cy+f[1]*a;
    s += circV(pl,u,M.r,M.r,'#26355F',clay(2.5)) + circV(pl,u,M.r,M.r*.4,'#C9D3E3',clay(1.5)); }
  return { svg:s, fp:all }; });
}
function staticVehicle(model,cx,cy,dir,opts){ const fp=drawVehicle(model,cx,cy,dir,opts).fp; obj(fp, ()=>drawVehicle(model,cx,cy,dir,opts).svg); }

/* ---------- plot types: building + yard + props, drawn in their own coords ---------- */
// shift: maps a type's drawing coords onto a 0..PLOT plot; label: anchor point for the floating label
const TYPES = {
  warehouse: { shift:[0,40], label:[230,210,150], face:'y', gate:420, attach:[396,364,88], build(p){
    baseAdd(()=> qT(0, 40, 480, 380, 560, CONCRETE.top, clay(14)) + shadow(60,400,60,380));
    warehouse();
    [125,215,305].forEach(x=>pool(x,396,34));
    staticVehicle('truck',215,437,'+y');
    pallet(78,410,3,[BOX_W,BOX_W,BOX_A,BOX_W]); pallet(122,410,2,[BOX_W,BOX_B,BOX_W,BOX_W]);
    pallet(78,456,2,[BOX_A,BOX_W,BOX_W,BOX_A]); pallet(122,456,1,[BOX_W]);
    pallet(283,508,2,[BOX_W,BOX_A,BOX_W,BOX_W]);
    lamp(460,395); lamp(52,545);
    addMover({ model:'forklift', path:[[300,478],[300,404]], speed:28, offset:hash(p.id)%5, pingpong:true, pause:1.2 });
    trees([[455,90],[455,190],[455,300],[25,110],[25,260],[25,380]]);
  }},
  service: { shift:[560,40], label:[800,260,112], face:'y', gate:120, attach:[668,384,76], build(p){
    baseAdd(()=> qT(0, 640, 960, 380, 560, CONCRETE.top, clay(14)) + shadow(660,940,140,380));
    serviceShop();
    [712,802,892].forEach(x=>pool(x,400,32));
    staticVehicle('car',802,446,'-y',{color:P500});
    staticVehicle('car',905,470,'+y',{color:'#E5E5E5'});
    tires(866,410); tires(886,416); toolbox(664,392);
    lamp(650,545); lamp(958,395);
    trees([[620,70],[975,90],[975,230],[975,360],[600,200],[600,330]]);
  }},
  store: { shift:[-20,600], label:[260,810,78], face:'x', gate:400, attach:[410,944,60], build(p){
    baseAdd(()=> qT(0, 420, 500, 660, 960, CONCRETE.top, clay(14)) + shadow(100,448,680,940));
    store();
    pool(450,740,42); pool(450,880,42); pool(450,810,30);
    bench(458,742); bench(458,856);
    lamp(492,672); lamp(492,948);
    trees([[30,700],[48,860],[40,960],[470,690],[470,935],[200,985],[340,985],[60,1060],[210,1070],[360,1055],[470,1080]]);
  }},
  office: { shift:[0,0], label:[235,200,130], face:'y', gate:340, attach:[370,334,100], build(p){
    baseAdd(()=> qT(0, 60, 500, 330, 500, CONCRETE.top, clay(14)) + shadow(90,380,70,330));
    office(p);
    pool(235,360,44);
    staticVehicle('car',440,400,'+y',{color:AMBER}); staticVehicle('car',440,460,'+y',{color:'#E5E5E5'});
    bench(60,360); lamp(80,490); lamp(400,490);
    trees([[40,60],[40,180],[40,300],[440,70],[440,180],[440,290],[150,470],[300,470]]);
  }},
  lot: { shift:[540,620], label:null, build(){
    baseAdd(()=>{ let b = qT(0, 580, 975, 660, 975, P50, clay(14));
      for(let k=0;k<7;k++){ const x=610+k*55; b += line([x,672,0],[x,745,0],'#D6E4F8',4) + line([x,890,0],[x,962,0],'#D6E4F8',4); }
      return b + line([610,745,0],[940,745,0],'#D6E4F8',4) + line([610,890,0],[940,890,0],'#D6E4F8',4); });
    staticVehicle('car',637,710,'-y',{color:AMBER}); staticVehicle('car',747,710,'-y',{color:'#E5E5E5'});
    staticVehicle('car',857,710,'-y',{color:TEAL}); staticVehicle('car',692,926,'+y',{color:P700});
    staticVehicle('car',857,926,'+y',{color:P400});
    trees([[995,700],[995,830],[995,960],[760,815],[880,815],[620,1060],[800,1075],[980,1060],[580,1110]]);
  }},
};

/* ---------- movers (once = a single trip, used for a confirmed transfer) ---------- */
function addMover(m){ m.path = m.path.map(([x,y])=>[x+OX,y+OY]);
  const sx=OX, sy=OY, sc=CUR; OX=OY=0; CUR=null; m.o = obj([0,0,0,0], null); OX=sx; OY=sy; CUR=sc; movers.push(m); return m; }
function locate(m, t){
  const path=m.path;
  if(!m.L){ m.seg=[]; m.L=0; for(let i=0;i<path.length-1;i++){ const l=Math.hypot(path[i+1][0]-path[i][0],path[i+1][1]-path[i][1]); m.seg.push(l); m.L+=l; } }
  const L=m.L; let d, back=false;
  if(m.once){ if(m.t0==null) m.t0=t; d=Math.min(L,(t-m.t0)*m.speed); if(d>=L) m.done=true; }
  else if(m.pingpong){ const leg=L/m.speed, cyc=2*(leg+m.pause), u=(t+m.offset)%cyc;
    if(u<m.pause) d=0; else if(u<m.pause+leg) d=(u-m.pause)*m.speed;
    else if(u<2*m.pause+leg) d=L; else { d=L-(u-2*m.pause-leg)*m.speed; back=true; } }
  else d=(t*m.speed+m.offset)%L;
  let i=0, r=d; while(i<m.seg.length-1 && r>m.seg[i]){ r-=m.seg[i]; i++; }
  const a=path[i], b=path[i+1]||path[i], k=m.seg[i] ? Math.min(1,r/m.seg[i]) : 0;
  const x=a[0]+(b[0]-a[0])*k, y=a[1]+(b[1]-a[1])*k;
  let dx=b[0]-a[0], dy=b[1]-a[1]; if(back){dx=-dx;dy=-dy;}
  const dir = Math.abs(dx)>Math.abs(dy) ? (dx>0?'+x':'-x') : (dy>0?'+y':'-y');
  const op = (m.pingpong || m.once) ? 1 : Math.max(0,Math.min(1,d/45,(L-d)/45));
  return {x,y,dir,op,back};
}

/* =====================================================================
   CONNECTIONS: one hue per status, as tokens (ok accent, slow warn, broken bad). Shape carries the status too:
   ok = solid, slow = long dashes with slow vans, broken = short dashes, no vans.
   ===================================================================== */
const LINK = { ok:'var(--accent)', slow:'var(--warn-dot)', broken:'var(--bad-dot)' };
const LINK_HEX = { ok:'#2A56C6', slow:'#C99413', broken:'#D23763' }; // vans only (they shade their colour, so they need a hex)
const lcol = c => LINK[c.status] || LINK.ok;
let CONNS=[], linkDraws=[], PLOTINFO={}, HILITE=null, ACTIVE_LINKS=[], GRID=null, SEL=null, FOCUS=null;
// focus(id) (Platforms, owner feedback 2): only that building and its own roads stay lit, as Home's platform filter
const linkOn = c => FOCUS ? (c.from===FOCUS || c.to===FOCUS) : (!HILITE || HILITE.links.has(c.id));
const dimOf = c => linkOn(c) ? 1 : .16;
function gatePoint(info,G){ const T=info.T;
  if(T.face==='x') return { axis:'v', k:info.c+1, y:G.ry(info.r)+RW+T.gate };
  return { axis:'h', j:info.r+1, x:G.rx(info.c)+RW+T.gate }; }
function route(A,B,G){
  const hy=j=>G.ry(j)+RW/2, vx=k=>G.rx(k)+RW/2;
  const pick=(n,f)=>{ let best=0,bc=Infinity; for(let i=0;i<=n;i++){ const c=f(i); if(c<bc-1e-6){ bc=c; best=i; } } return best; };
  let pts;
  if(A.axis==='h' && B.axis==='h'){
    if(A.j===B.j) pts=[[A.x,hy(A.j)],[B.x,hy(B.j)]];
    else { const k=pick(G.cols,k=>Math.abs(A.x-vx(k))+Math.abs(vx(k)-B.x)+Math.abs(A.x-vx(k))*1e-3);
      pts=[[A.x,hy(A.j)],[vx(k),hy(A.j)],[vx(k),hy(B.j)],[B.x,hy(B.j)]]; }
  } else if(A.axis==='v' && B.axis==='v'){
    if(A.k===B.k) pts=[[vx(A.k),A.y],[vx(B.k),B.y]];
    else { const j=pick(G.rows,j=>Math.abs(A.y-hy(j))+Math.abs(hy(j)-B.y)+Math.abs(A.y-hy(j))*1e-3);
      pts=[[vx(A.k),A.y],[vx(A.k),hy(j)],[vx(B.k),hy(j)],[vx(B.k),B.y]]; }
  } else if(A.axis==='h') pts=[[A.x,hy(A.j)],[vx(B.k),hy(A.j)],[vx(B.k),B.y]];
  else pts=[[vx(A.k),A.y],[vx(A.k),hy(B.j)],[B.x,hy(B.j)]];
  return pts.filter((p,i)=>i===0 || Math.hypot(p[0]-pts[i-1][0],p[1]-pts[i-1][1])>0.5);
}
function buildLinks(G){
  ACTIVE_LINKS = CONNS.map(c=>({ ...c, id:c.from+'~'+c.to })).filter(c=>PLOTINFO[c.from] && PLOTINFO[c.to] && c.from!==c.to);
  ACTIVE_LINKS.forEach((c,n)=>{ c.slot=n; c.route=route(gatePoint(PLOTINFO[c.from],G), gatePoint(PLOTINFO[c.to],G), G); });
  const N=ACTIVE_LINKS.length;
  ACTIVE_LINKS.forEach(c=>{
    const o = N>1 ? (c.slot-(N-1)/2)*Math.min(8, 40/(N-1)) : 0;
    c.path = c.route.map(([x,y])=>[x+o,y+o]);
    if(c.status!=='broken') addMover({ model:'cvan', path:c.path, speed:c.status==='slow'?22:72, offset:c.slot*2.7, pingpong:true, pause:c.status==='slow'?3.2:1.6, link:c, conn:c.id });
  });
  linkDraws.push({ ox:0, oy:0, plot:null, fn:()=>ACTIVE_LINKS.map(c=>{
    const col=lcol(c), pts = c.path.map(([x,y])=>P(x,y,.5).map(f1).join(',')).join(' ');
    const ends = [c.path[0], c.path[c.path.length-1]].map(([x,y])=>ellT(x,y,.5,10,col)+ellT(x,y,.6,4.5,'#fff')).join('');
    if(c.status==='broken') return `<g opacity="${dimOf(c)}"><polyline points="${pts}" fill="none" stroke="${col}" stroke-width="6" stroke-dasharray="5 13" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>${ends}</g>`;
    return `<g opacity="${dimOf(c)}">
      <polyline points="${pts}" fill="none" stroke="${col}" stroke-width="8"${c.status==='slow'?' stroke-dasharray="30 10"':''} stroke-linejoin="round" stroke-linecap="round" opacity=".8"/>
      <polyline class="${c.status==='slow'?'animate-town-flow-a-slow':'animate-town-flow-a'} [stroke-dasharray:1_26] motion-reduce:animate-none" points="${pts}" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <polyline class="${c.status==='slow'?'animate-town-flow-b-slow':'animate-town-flow-b'} [stroke-dasharray:1_26] [stroke-dashoffset:13] motion-reduce:animate-none" points="${pts}" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" opacity=".75"/>
      ${ends}</g>`; }).join('') });
}


/* ---------- depth sort (isometric painter's order, camera-aware) ---------- */
function behind(a,b){
  return (CAM.x>0 ? a.fp[1]<=b.fp[0]+.01 : a.fp[0]>=b.fp[1]-.01) || (CAM.y>0 ? a.fp[3]<=b.fp[2]+.01 : a.fp[2]>=b.fp[3]-.01); }
function sortObjects(){
  const n=objects.length, indeg=new Array(n).fill(0), adj=objects.map(()=>[]);
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){ if(i===j) continue;
    if(behind(objects[i],objects[j]) && !behind(objects[j],objects[i])){ adj[i].push(j); indeg[j]++; } }
  const key=o=>(o.fp[0]+o.fp[1])*CAM.x+(o.fp[2]+o.fp[3])*CAM.y;
  const ready=[], out=[]; for(let i=0;i<n;i++) if(!indeg[i]) ready.push(i);
  while(out.length<n){
    if(!ready.length){ let m=-1; for(let i=0;i<n;i++) if(indeg[i]>0 && (m<0||key(objects[i])<key(objects[m]))) m=i; if(m<0) break; indeg[m]=0; ready.push(m); }
    ready.sort((p,q)=>key(objects[p])-key(objects[q])); const i=ready.shift(); if(indeg[i]===-1) continue; indeg[i]=-1; out.push(i);
    for(const j of adj[i]) if(indeg[j]>0 && --indeg[j]===0) ready.push(j);
  }
  if(out.join()!==lastOrder.join()){ out.forEach(i=>objLayer.appendChild(objects[i].g)); lastOrder=out; }
}

/* ---------- drawing ---------- */
function redrawStatic(){
  baseEl.innerHTML = themed(baseDraws.map(run).join(''));
  marksEl.innerHTML = plotMarks();
  glowEl.innerHTML = glowDraws.map(run).join('');
  for(const o of objects) if(o.fn) o.g.innerHTML = themed(run({ox:o.ox, oy:o.oy, plot:o.plot, fn:o.fn}));
  // a filtered platform: its building stays, every other building is dimmed (no selection = nothing dimmed)
  for(const o of objects) if(o.plot && o.plot.id) o.g.setAttribute('opacity', (SEL && OPTS.dim !== false && o.plot.id !== SEL) || (FOCUS && o.plot.id !== FOCUS) ? '.3' : '1'); // opts.dim = false (Platforms): the ring only, nothing dimmed
  linksEl.innerHTML = themed(linkDraws.map(run).join(''));
  lastOrder=[];
}

/* ---------- build the whole map from data ---------- */
function render(platforms, connections){
  PLATS = platforms.map(p=>(p ? { ...p, lights: p.status !== 'OFFLINE' } : null)); CONNS = connections || []; // null = an empty lot at that place in the grid
  objects=[]; movers=[]; baseDraws=[]; glowDraws=[]; linkDraws=[]; PLOTINFO={}; LABELS=[]; lastOrder=[]; objLayer.innerHTML=''; OX=OY=0; CUR=null;
  const n = PLATS.length, cols = Math.max(1, Math.ceil(Math.sqrt(n))), rows = Math.max(1, Math.ceil(n/cols));
  const LX = 2*M + (cols+1)*RW + cols*PLOT, LY = 2*M + (rows+1)*RW + rows*PLOT;
  CX = LX/2; CY = LY/2;
  const rx = k => M + k*(PLOT+RW), ry = k => M + k*(PLOT+RW);
  GRID = { cols, rows, rx, ry, LX, LY };
  baseAdd(()=>{
    let b = box(0,0,-30,LX,LY,30,{ top:'#FFFFFD', left:'#C9DCF7', right:'#A9C6F0' }, clay(22));
    for(let j=0;j<=rows;j++) b += qT(0, M, LX-M, ry(j), ry(j)+RW, P100, clay(6));
    for(let k=0;k<=cols;k++) b += qT(0, rx(k), rx(k)+RW, M, LY-M, P100, clay(6));
    const nearX = x => { for(let k=0;k<=cols;k++) if(x>rx(k)-40 && x<rx(k)+RW+30) return true; return false; };
    const nearY = y => { for(let j=0;j<=rows;j++) if(y>ry(j)-40 && y<ry(j)+RW+30) return true; return false; };
    for(let j=0;j<=rows;j++) for(let x=M+8;x<LX-M-22;x+=42){ if(nearX(x)) continue; b += qT(0,x,x+22,ry(j)+28.5,ry(j)+31.5,'#FFFFFF',clay(3)); }
    for(let k=0;k<=cols;k++) for(let y=M+8;y<LY-M-22;y+=42){ if(nearY(y)) continue; b += qT(0,rx(k)+28.5,rx(k)+31.5,y,y+22,'#FFFFFF',clay(3)); }
    for(let k=0;k<=cols;k++) for(let j=0;j<=rows;j++){ const X=rx(k), Y=ry(j);
      for(let y=Y+5;y<Y+RW-4;y+=9){ if(X-28>M) b += qT(0,X-28,X-6,y,y+4.5,'#FFFFFF',clay(2.5)); if(X+RW+28<LX-M) b += qT(0,X+RW+6,X+RW+28,y,y+4.5,'#FFFFFF',clay(2.5)); }
      for(let x=X+5;x<X+RW-4;x+=9){ if(Y-28>M) b += qT(0,x,x+4.5,Y-28,Y-6,'#FFFFFF',clay(2.5)); if(Y+RW+28<LY-M) b += qT(0,x,x+4.5,Y+RW+6,Y+RW+28,'#FFFFFF',clay(2.5)); } }
    return b; });
  for(let i=0;i<cols*rows;i++){
    const p = PLATS[i] || null, T = p ? (TYPES[p.type] || TYPES.office) : TYPES.lot;
    OX = rx(i%cols)+RW - T.shift[0]; OY = ry(Math.floor(i/cols))+RW - T.shift[1]; CUR = p;
    T.build(p || {id:'lot'+i});
    if(p) PLOTINFO[p.id] = { i, c:i%cols, r:Math.floor(i/cols), ox:OX, oy:OY, T, p };
    if(p && T.label) LABELS.push({ plot:p, i, at:T.label, ox:OX, oy:OY });
    OX=OY=0; CUR=null;
  }
  const models=['truck','car','truck','car'], colors=['#E5E5E5','#F1F5F9','#CBD5E1','#E5E5E5','#F8FAFC'];
  for(let j=0;j<=rows;j++){ const fwd=j%2===0, y=ry(j)+(fwd?45:15);
    addMover({ model:models[j%4], path: fwd?[[M,y],[LX-M,y]]:[[LX-M,y],[M,y]], speed:55+(j*17)%40, offset:j*233, color:colors[j%5] }); }
  for(let k=0;k<=cols;k++){ const fwd=k%2===1, x=rx(k)+(fwd?45:15);
    addMover({ model:models[(k+1)%4], path: fwd?[[x,M],[x,LY-M]]:[[x,LY-M],[x,M]], speed:60+(k*23)%35, offset:k*311+150, color:colors[(k+2)%5] }); }
  buildLinks(GRID);
  // frame the island tightly: the extremes over the four snap rotations, plus room above for the roofs and labels
  const th0 = THETA; let x0=1e9, x1=-1e9, y0=1e9, y1=-1e9;
  for(const th of [0, Math.PI/2, Math.PI, 3*Math.PI/2]){ setTheta(th); OX=OY=0;
    for(const [x,y,z] of [[0,0,0],[LX,0,0],[LX,LY,0],[0,LY,0],[0,0,-30],[LX,0,-30],[LX,LY,-30],[0,LY,-30]]){ const q=P(x,y,z); x0=Math.min(x0,q[0]); x1=Math.max(x1,q[0]); y0=Math.min(y0,q[1]); y1=Math.max(y1,q[1]); } }
  setTheta(th0);
  const halfW = Math.max(-x0, x1) + 20, top = y0 - 240, bottom = y1 + 10; // owner refine 4: less air above and below
  BASEVB = { x:-halfW, y:top, w:2*halfW, h:bottom-top };
  applyView();
  dirty();
}

/* ---------- selected / hovered plots: a pale tint, and a full ring on the selected one ---------- */
function plotMarks(){
  if(!GRID) return ''; let s='';
  for(const id in PLOTINFO){ const info=PLOTINFO[id], sel=SEL===id, hov=FOCUS ? FOCUS===id : !!(HILITE && HILITE.plots.has(id));
    if(!sel && !hov) continue;
    const x0=GRID.rx(info.c)+RW+10, y0=GRID.ry(info.r)+RW+10, x1=x0+PLOT-20, y1=y0+PLOT-20;
    // the plot takes its platform's identity colour; the accent when a platform has none
    const own = cfg.colorOf(id), acc = own || 'var(--accent)';
    let fill = 'var(--accent-tint)';
    if(own && /^#[0-9a-f]{6}$/i.test(own)){ const rgb = [1,3,5].map(k=>parseInt(own.slice(k,k+2),16)).join(',');
      fill = `light-dark(rgba(${rgb},${sel ? .16 : .11}), rgba(${rgb},${sel ? .26 : .18}))`; }
    s += `<polygon points="${pts([[x0,y0,.4],[x1,y0,.4],[x1,y1,.4],[x0,y1,.4]])}" fill="${fill}" stroke="${acc}" stroke-width="${sel ? 8 : 4}" stroke-opacity="${sel ? 1 : .55}" stroke-linejoin="round"/>`;
  }
  return s;
}

/* ---------- theme: tokens for structure, light-dark() for the rest (no redraw on a theme switch) ---------- */
const TOKEN = { '#FFFFFD':'var(--map-top)', '#C9DCF7':'var(--map-side)', '#A9C6F0':'var(--map-side-2)', '#DBEAFE':'var(--map-road)', '#FFD66B':'var(--map-window)', '#FFE7A3':'var(--map-window-soft)' };
const NIGHT = {
  '#FFFFFF':'#34425C', '#F3F7FD':'#2B3A55', '#D5E3F6':'#22304A',
  '#F4F7FC':'#172238', '#DCE6F5':'#1E2A42', '#C3D4EE':'#18233A',
  '#EFF6FF':'#16203A', '#BFDBFE':'#2A4470', '#93C5FD':'#3B5B92',
  '#D6E4F8':'#26344F', '#E3ECF8':'#25324C', '#CAD9EF':'#1F2B44', '#E7EEF9':'#2A3852',
  '#5FAE7A':'#2F6B4B', '#7DC793':'#3E8560',
  '#171717':'#F1F5F9', '#525252':'#94A3B8',
  '#E5E5E5':'#64748B', '#F1F5F9':'#334155', '#F8FAFC':'#475569', '#CBD5E1':'#475569', '#E2E8F0':'#3A475E',
  '#A3A3A3':'#475569', '#C9D3E3':'#64748B',
};
const KEEP = new Set(['#FFFFFE','#2563EB','#FFE38A','#FCE7B0','#FFF7D6','#FEF3C7','#F59E0B','#B45309']);
const nightCache = {};
function nightColor(hex){
  let h = hex.toUpperCase(); if(h.length===4) h = '#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
  if(NIGHT[h]) return NIGHT[h]; if(nightCache[h]) return nightCache[h];
  let r=parseInt(h.slice(1,3),16)/255, g=parseInt(h.slice(3,5),16)/255, b=parseInt(h.slice(5,7),16)/255;
  const mx=Math.max(r,g,b), mn=Math.min(r,g,b); let H=0, Sa=0, L=(mx+mn)/2;
  if(mx!==mn){ const d=mx-mn; Sa = L>.5 ? d/(2-mx-mn) : d/(mx+mn);
    H = mx===r ? (g-b)/d+(g<b?6:0) : mx===g ? (b-r)/d+2 : (r-g)/d+4; H/=6; }
  L = L>0.75 ? 0.16 + (L-0.75)*0.6 : L*0.82; Sa *= 0.85;
  const q = L<.5 ? L*(1+Sa) : L+Sa-L*Sa, pp = 2*L-q;
  const hue = t => { t=(t+1)%1; return t<1/6 ? pp+(q-pp)*6*t : t<1/2 ? q : t<2/3 ? pp+(q-pp)*(2/3-t)*6 : pp; };
  const out = '#'+[hue(H+1/3),hue(H),hue(H-1/3)].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('');
  return nightCache[h] = out;
}
const colourCache = {};
function colour(hex){
  let h = hex.toUpperCase(); if(h.length===4) h = '#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3];
  if(colourCache[h]) return colourCache[h];
  if(TOKEN[h]) return colourCache[h] = TOKEN[h];
  if(KEEP.has(h)) return colourCache[h] = h;
  const n = nightColor(h);
  return colourCache[h] = n.toUpperCase() === h ? h : `light-dark(${h}, ${n})`;
}
const themed = str => str
  .replace(/#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g, colour)
  .replace(/rgba\(30,58,138,([\d.]+)\)/g, (m,a)=>`light-dark(${m}, rgba(0,4,16,${Math.min(.55,a*3.2).toFixed(2)}))`)
  .replace(/url\(#(glow|pool|blur8)\)/g, (m,id)=>`url(#${UID}-${id})`);

/* ---------- view ---------- */
let marksEl, BASEVB = null, ZOOM = 1, target = 0, drag = null, moved = false, hoverId = null;
let DESTROYED = false, PAUSED = false, raf = 0, morphT = 0, unbind = [];
const kick = () => { if(!raf && !DESTROYED && !PAUSED && svgEl) raf = requestAnimationFrame(frame); };
const dirty = () => { DIRTY = true; kick(); };
function applyView(){
  if(!BASEVB || !svgEl) return; const b = BASEVB, w = b.w/ZOOM, h = b.h/ZOOM;
  let cx = b.x + b.w/2, cy = b.y + b.h/2;
  if(ZOOM > 1 && SEL && PLOTINFO[SEL]){ const info = PLOTINFO[SEL]; OX=OY=0; const q = P(GRID.rx(info.c)+RW+PLOT/2, GRID.ry(info.r)+RW+PLOT/2, 0); cx = q[0]; cy = q[1] - 60; }
  cx = Math.max(b.x + w/2, Math.min(b.x + b.w - w/2, cx)); cy = Math.max(b.y + h/2, Math.min(b.y + b.h - h/2, cy));
  svgEl.setAttribute('viewBox', `${f1(cx - w/2)} ${f1(cy - h/2)} ${f1(w)} ${f1(h)}`);
  cfg.onView();
}
function anchors(hr){
  const m = svgEl && svgEl.getScreenCTM && svgEl.getScreenCTM(); if(!m) return [];
  return LABELS.map(L=>{ OX=L.ox; OY=L.oy; const q=P(...L.at); OX=OY=0;
    return { id:L.plot.id, ax: m.a*q[0] + m.c*q[1] + m.e - hr.left, ay: m.b*q[0] + m.d*q[1] + m.f - hr.top }; });
}

/* ---------- interaction: drag to rotate, click a building to pick it, empty ground clears ---------- */
function plotAt(e){
  const el = document.elementFromPoint ? document.elementFromPoint(e.clientX, e.clientY) : null;
  const g = el && el.closest && el.closest('g.plot-obj'); return g && g.__o && g.__o.plot ? g.__o.plot.id : null;
}
function bindPointer(){
  const on = (type, fn, opt) => { svgEl.addEventListener(type, fn, opt); unbind.push(()=>svgEl.removeEventListener(type, fn, opt)); };
  on('pointerdown', e => { if(e.button) return; drag = { x:e.clientX, t:THETA }; moved = false; try{ svgEl.setPointerCapture(e.pointerId); }catch(_){} });
  on('pointermove', e => {
    if(!drag){ const id = plotAt(e);
      if(id !== hoverId){ hoverId = id; if(id) svgEl.setAttribute('data-over',''); else svgEl.removeAttribute('data-over'); cfg.onHover(id); } return; }
    const dx = e.clientX-drag.x;
    if(Math.abs(dx) > 4){ moved = true; svgEl.setAttribute('data-dragging',''); }
    if(moved){ target = drag.t - dx*0.008; setTheta(target); dirty(); } });
  on('pointerleave', () => { if(hoverId){ hoverId = null; svgEl.removeAttribute('data-over'); cfg.onHover(null); } });
  on('pointercancel', () => { drag = null; svgEl.removeAttribute('data-dragging'); });
  on('pointerup', e => { svgEl.removeAttribute('data-dragging');
    if(drag && !moved) cfg.onPick(plotAt(e));
    if(drag && moved){ target = Math.round(THETA/(Math.PI/2))*(Math.PI/2); dirty(); }
    drag = null; });
  // Ctrl / Cmd + wheel (and trackpad pinch) zooms; a plain wheel scrolls the page, never traps it
  on('wheel', e => { if(!(e.ctrlKey || e.metaKey)) return; e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); }, { passive:false });
}

/* ---------- public API ---------- */
function attach(layers){
  svgEl = layers.svg; baseEl = layers.base; marksEl = layers.marks; linksEl = layers.links; glowEl = layers.glow; objLayer = layers.objects;
  setTheta(0); bindPointer();
  return () => { unbind.forEach(f=>f()); unbind = []; };
}
function rotate(d){
  target = Math.round((target + d*Math.PI/2)/(Math.PI/2))*(Math.PI/2);
  if(cfg.reduced()){ setTheta(target); }
  dirty();
}
function zoom(d){ const z = Math.max(1, Math.min(2.4, Math.round((ZOOM + d*0.35)*100)/100)); if(z!==ZOOM){ ZOOM = z; applyView(); } return ZOOM; }
const known = id => (id && PLOTINFO[id]) ? id : null;
function applyState(st){
  SEL = known(st.sel); FOCUS = known(st.focus);
  const set = new Set((st.hl || []).filter(id=>PLOTINFO[id]));
  HILITE = set.size ? { plots:set, links:new Set(ACTIVE_LINKS.filter(c=>set.has(c.from) && set.has(c.to)).map(c=>c.id)) } : null;
}
function setView(st){ applyState(st); dirty(); if(ZOOM>1) applyView(); }
function state(){ return { sel: SEL, focus: FOCUS, hl: HILITE ? [...HILITE.plots] : null }; }
// subpage slides: the map stays put and only its view changes. morph(from, ms) shows `from` at once, then eases to the current view:
// buildings by an opacity animation, the plot rings and the roads by a cross-fade of their layers. Static under reduced motion.
function drawNow(){ const lo = lastOrder; redrawStatic(); lastOrder = lo; DIRTY = false; }
function morph(from, ms){
  if(!svgEl || !GRID || !from || cfg.reduced() || !marksEl.animate) return;
  const to = state(), same = (x, y) => x.sel===y.sel && x.focus===y.focus && String(x.hl||'')===String(y.hl||'');
  if(same(from, to)) return;
  clearTimeout(morphT); svgEl.querySelectorAll('.t-ghost').forEach(g=>g.remove());
  applyState(from); drawNow();
  const blds = objects.filter(o=>o.plot && o.plot.id), was = blds.map(o=>o.g.getAttribute('opacity') || '1');
  const ghosts = [marksEl, linksEl].map(el=>{ const c = el.cloneNode(true); c.classList.add('t-ghost'); el.after(c); return c; });
  applyState(to); drawNow();
  const o = { duration: ms, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
  blds.forEach((b, i)=>{ const now = b.g.getAttribute('opacity') || '1'; if(now !== was[i]) b.g.animate([{ opacity: +was[i] }, { opacity: +now }], o); });
  ghosts.forEach(g=>{ g.animate([{ opacity: 1 }, { opacity: 0 }], { ...o, fill: 'forwards' }); });
  [marksEl, linksEl].forEach(el=>el.animate([{ opacity: 0 }, { opacity: 1 }], o));
  morphT = setTimeout(()=>{ ghosts.forEach(g=>g.remove()); }, ms + 60);
  kick();
}
function runVan(from, to){
  const A = PLOTINFO[from], B = PLOTINFO[to]; if(!A || !B || !GRID) return false;
  if(cfg.reduced()) return true; // no motion: the highlight the caller sets is the feedback
  const path = route(gatePoint(A,GRID), gatePoint(B,GRID), GRID); OX=OY=0; CUR=null;
  addMover({ model:'cvan', path, speed:110, once:true, accent:true });
  kick(); return true;
}
function setPaused(p){ PAUSED = !!p; if(PAUSED){ if(raf){ cancelAnimationFrame(raf); raf = 0; } } else kick(); }
function destroy(){
  DESTROYED = true; if(raf) cancelAnimationFrame(raf); raf = 0; clearTimeout(morphT);
  unbind.forEach(f=>f()); unbind = [];
  if(svgEl && svgEl.querySelectorAll) svgEl.querySelectorAll('.t-ghost').forEach(g=>g.remove());
  objects = []; movers = []; baseDraws = []; glowDraws = []; linkDraws = []; LABELS = []; PLOTINFO = {};
}

/* ---------- loop ---------- */
function frame(ms){
  raf = 0; if(DESTROYED || !svgEl) return;
  const reduce = cfg.reduced();
  if(!drag && Math.abs(target-THETA) > 1e-4){ setTheta(reduce || Math.abs(target-THETA) < 0.002 ? target : THETA + (target-THETA)*0.14); DIRTY = true; }
  const t = reduce ? 6 : ms/1000;
  // DEGRADED: the lights flicker (two short drops every 1.7 s); reduced motion keeps them on
  if(!reduce) for(const p of PLATS){ if(!p || p.status!=='DEGRADED') continue; const ph=(ms + hash(p.id)%900)%1700; const on = !(ph<110 || (ph>240 && ph<330)); if(on!==p.lights){ p.lights=on; DIRTY=true; } }
  if(DIRTY){ redrawStatic(); DIRTY=false; cfg.onView(); }
  for(let i=movers.length-1;i>=0;i--){ const m=movers[i];
    if(m.once && reduce){ m.done = true; }
    const p=locate(m, m.once ? ms/1000 : t);
    if(m.done){ m.o.g.remove(); const oi=objects.indexOf(m.o); if(oi>=0) objects.splice(oi,1); movers.splice(i,1); lastOrder=[]; continue; }
    const color = m.accent ? LINK_HEX.ok : m.link ? LINK_HEX[m.link.status] || LINK_HEX.ok : (m.color||P500);
    const v=drawVehicle(m.model,p.x,p.y,p.dir,{color, load: m.model==='forklift' && !p.back});
    m.o.fp=v.fp; m.o.g.innerHTML=themed(v.svg); m.o.g.setAttribute('opacity',(p.op*(m.link && !linkOn(m.link) ? .15 : 1)).toFixed(2)); }
  sortObjects();
  if(!reduce || DIRTY || drag || Math.abs(target-THETA) > 1e-4) kick();
}

return { attach, render, setView, state, morph, runVan, rotate, zoom, anchors, setPaused, destroy };
}

import * as T from './vendor/three.module.js';

const V = (x,y,z) => new T.Vector3(x,y,z);
let seed=38;
function rand(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
const materials = (color, extra={}) => new T.MeshPhysicalMaterial({color,roughness:.4,metalness:.1,clearcoat:.3,clearcoatRoughness:.35,side:T.DoubleSide,...extra});

function surface(fn, uN, vN, colorFn){
  const p=[],uv=[],colors=[],indices=[];
  for(let i=0;i<=uN;i++)for(let j=0;j<=vN;j++){
    const u=i/uN,v=j/vN,q=fn(u,v);p.push(...q);uv.push(u,v);
    if(colorFn){const c=colorFn(u,v,q);colors.push(c.r,c.g,c.b);}
  }
  for(let i=0;i<uN;i++)for(let j=0;j<vN;j++){const a=i*(vN+1)+j,b=a+vN+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);
  if(colors.length)g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.computeVertexNormals();return g;
}
function add(group,geometry,material){const m=new T.Mesh(geometry,material);group.add(m);return m;}
function ellipsoid(group,p,s,mat){const m=add(group,new T.SphereGeometry(1,40,28),mat);m.position.set(...p);m.scale.set(...s);return m;}
function tube(group,points,radius,mat,segments=40,sides=10,endRadius=radius){
  const c=new T.CatmullRomCurve3(points.map(p=>V(...p)));
  const g=new T.TubeGeometry(c,segments,1,sides,false),a=g.attributes.position;
  for(let i=0;i<=segments;i++){
    const t=i/segments,center=c.getPointAt(t),r=T.MathUtils.lerp(radius,endRadius,t);
    for(let j=0;j<=sides;j++){const k=i*(sides+1)+j;const v=V(a.getX(k),a.getY(k),a.getZ(k)).sub(center).multiplyScalar(r).add(center);a.setXYZ(k,v.x,v.y,v.z);}
  }g.computeVertexNormals();return add(group,g,mat);
}

function scaleMap(kind){
  const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');
  ctx.fillStyle='#888888';ctx.fillRect(0,0,1024,512);
  const w=kind==='fish'?28:20,h=kind==='fish'?29:20;
  for(let y=-h;y<512+h;y+=h*.76)for(let x=-w;x<1024+w;x+=w){
    const dx=x+((Math.round(y/(h*.76))%2)*w*.5);
    ctx.fillStyle=`rgb(${155+rand()*35},${155+rand()*35},${155+rand()*35})`;
    ctx.beginPath();ctx.ellipse(dx,y,w*.46,h*.48,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#555';ctx.lineWidth=1.3;ctx.stroke();
    ctx.strokeStyle='#d0d0d0';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(dx,y,w*.33,h*.33,0,.1,2.9);ctx.stroke();
  }
  const tex=new T.CanvasTexture(c);tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.anisotropy=4;return tex;
}

function scaleRelief(group,prof,baseColor,cols,rows,start,end,lizard=false){
  const positions=[],normals=[],colors=[],indices=[];let vertex=0;
  const color=new T.Color(baseColor);
  for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
    const u=start+(end-start)*(i+(j%2)*.5)/cols,v=j/rows,angle=v*Math.PI*2;
    const [x,ry,rz]=profile(prof,u),previous=profile(prof,Math.max(0,u-.001)),next=profile(prof,Math.min(1,u+.001));
    const alongTangent=V(next[0]-previous[0],(next[1]-previous[1])*Math.cos(angle)+(lizard?.0006*Math.cos(u*4):0),(next[2]-previous[2])*Math.sin(angle)).normalize();
    const side=V(0,-ry*Math.sin(angle),rz*Math.cos(angle)).normalize(),normal=side.clone().cross(alongTangent).normalize();
    const center=V(x,ry*Math.cos(angle)+(lizard?.075*Math.sin(u*4):0),rz*Math.sin(angle));
    const edge=Math.min(1,(u-start)*18,(end-u)*18),dx=(lizard?.036:.044)*(.3+.7*edge),dy=(lizard?.027:.037)*(.3+.7*edge);
    const c=color.clone().multiplyScalar(.90+rand()*.12);
    if(Math.cos(angle)>.6)c.multiplyScalar(.7);if(Math.cos(angle)<-.5)c.multiplyScalar(1.15);
    positions.push(center.x+normal.x*.007,center.y+normal.y*.007,center.z+normal.z*.007);normals.push(...normal.toArray());colors.push(c.r,c.g,c.b);
    for(let k=0;k<12;k++){
      const a=k/12*Math.PI*2,along=Math.cos(a)*dx,across=Math.sin(a)*dy;
      const p=center.clone().addScaledVector(side,across).addScaledVector(alongTangent,along).addScaledVector(normal,.001);
      positions.push(...p.toArray());normals.push(...normal.clone().addScaledVector(side,Math.sin(a)*.12).add(V(Math.cos(a)*.1,0,0)).normalize().toArray());colors.push(c.r,c.g,c.b);
      indices.push(vertex,vertex+1+k,vertex+1+(k+1)%12);
    }vertex+=13;
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(indices);
  add(group,g,materials('#ffffff',{vertexColors:true,roughness:lizard?.6:.39,metalness:lizard?.12:.5,clearcoat:.2}));
}

export function mushroom(){
  seed=12;const root=new T.Group();
  const grain=document.createElement('canvas');grain.width=grain.height=512;const ctx=grain.getContext('2d');
  ctx.fillStyle='#999';ctx.fillRect(0,0,512,512);
  for(let i=0;i<45000;i++){ctx.fillStyle=rand()>.5?'#666':'#bbb';ctx.fillRect(rand()*512,rand()*512,1,2);}
  const texture=new T.CanvasTexture(grain);texture.wrapS=texture.wrapT=T.RepeatWrapping;
  const cap=materials('#c28b4d',{roughness:.6,metalness:.10,clearcoat:.15,vertexColors:true,bumpMap:texture,bumpScale:.035});
  const underside=materials('#a28a5f',{roughness:.8,metalness:.02});
  const gillmat=materials('#ba9762',{roughness:.7,metalness:.02});
  const stemmat=materials('#bdb48f',{roughness:.75,metalness:.02,bumpMap:texture,bumpScale:.025});
  const gold=new T.Color('#d7ad6a'),brown=new T.Color('#805326');
  function fruit(x,y,z,scale,tilt){
    const f=new T.Group();root.add(f);f.position.set(x,y,z);f.scale.setScalar(scale);f.rotation.z=tilt;
    const cy=.83, R=1.28;
    add(f,surface((u,v)=>{
      const a=v*Math.PI*2,r=R*Math.sin(u*Math.PI/2),w=Math.sin(a*7+.8)*.02+Math.sin(a*13)*.008;
      return [r*Math.cos(a)*(1+w),cy+.70*Math.cos(u*Math.PI/2)**1.35+w*u*u,r*Math.sin(a)*(1+w)];
    },52,160,(u,v)=>gold.clone().lerp(brown,(1-u)*.64+Math.sin(v*50+u*30)*.025)),cap);
    add(f,surface((u,v)=>{const a=v*Math.PI*2,r=.13+u*(R-.13);return[r*Math.cos(a),cy-.08*Math.sin(u*Math.PI*.9),r*Math.sin(a)];},18,160),underside);
    add(f,surface((u,v)=>{const a=v*Math.PI*2,w=Math.sin(a*7+.8)*.02+Math.sin(a*13)*.008;const r=T.MathUtils.lerp(R*(1+w),R,u);return[r*Math.cos(a),T.MathUtils.lerp(cy+w,cy-.08*Math.sin(Math.PI*.9),u),r*Math.sin(a)];},4,160),gillmat);
    // The lamellae are actual radial blades, visible from below and in silhouette.
    for(let j=0;j<100;j++){
      const a=j/100*Math.PI*2;
      add(f,surface((u,v)=>{
        const r=(j%2?.24:.14)+u*(R-.04-(j%2?.24:.14)),ang=a+Math.sin(u*3)*.013;
        const top=cy-.08*Math.sin((r-.13)/(R-.13)*Math.PI*.9);
        return [Math.cos(ang)*r,top-v*(.015+.10*Math.sin(u*Math.PI)**.6),Math.sin(ang)*r];
      },22,1),gillmat);
    }
    tube(f,[[.04,-1.05,0],[-.08,-.68,.01],[-.07,-.1,0],[.035,.48,0],[0,.93,0]],.19,stemmat,70,28,.14);
    for(let j=0;j<33;j++){
      const a=j/33*Math.PI*2;
      tube(f,[[.04+.19*Math.cos(a),-1.03,.19*Math.sin(a)],[-.07+.17*Math.cos(a),-.45,.17*Math.sin(a)],[.015+.14*Math.cos(a),.47,.14*Math.sin(a)]],.0035,underside,22,4,.0015);
    }
  }
  fruit(.28,-.1,0,1,-.10);fruit(-.92,-.60,.28,.53,.23);
  const rootmat=materials('#b2b998',{roughness:.7});
  for(let j=0;j<25;j++){
    const a=rand()*Math.PI*2,l=.35+rand()*.9;
    const end=[.27+Math.cos(a)*l,-1.23-rand()*.12,Math.sin(a)*l*.6];
    tube(root,[[.28,-1.07,0],[.27+Math.cos(a)*l*.38,-1.18,Math.sin(a)*l*.25],end],.012,rootmat,20,5,.001);
    if(j%2===0) tube(root,[[.27+Math.cos(a)*l*.4,-1.2,Math.sin(a)*l*.2],[end[0]-.12,-1.23,end[2]+.2],[end[0]-.22,-1.24,end[2]+.4]],.005,rootmat,14,4,.001);
  }
  return root;
}

function profile(points,t){
  const s=t*(points.length-1),i=Math.min(points.length-2,Math.floor(s)),f=s-i;
  const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
  return p1.map((_,k)=>.5*((2*p1[k])+(-p0[k]+p2[k])*f+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*f*f+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*f*f*f));
}
function membrane(group,outline,mat,ribmat,base){
  const curve=new T.CatmullRomCurve3(outline.map(p=>V(...p)));const origin=V(...base);
  const g=surface((u,v)=>{const edge=curve.getPoint(u);const p=origin.clone().lerp(edge,v);p.z+=Math.sin(u*Math.PI*16)*.012*v;return p.toArray();},56,10);
  add(group,g,mat);
  for(let i=0;i<=16;i++){
    const p=curve.getPoint(i/16),mid=origin.clone().lerp(p,.5);mid.z+=.01;
    tube(group,[origin.toArray(),mid.toArray(),p.toArray()],.007,ribmat,10,4,.0015);
  }
}
export function fish(){
  seed=24;const root=new T.Group();const tex=scaleMap('fish');
  const skin=materials('#ffffff',{vertexColors:true,metalness:.55,roughness:.29,clearcoat:.55,bumpMap:tex,bumpScale:.055});
  const dorsal=new T.Color('#2a544b'),silver=new T.Color('#c3d1aa'),belly=new T.Color('#e6debf');
  const prof=[[-1.63,.105,.09],[-1.35,.22,.14],[-.85,.49,.24],[-.2,.62,.34],[.48,.58,.32],[1.03,.40,.255],[1.42,.24,.18],[1.62,.06,.05]];
  add(root,surface((u,v)=>{
    const [x,ry,rz]=profile(prof,u),a=v*Math.PI*2;
    return[x,ry*Math.cos(a),rz*Math.sin(a)];
  },110,72,(u,v,p)=>{
    const upper=(Math.cos(v*Math.PI*2)+1)*.5;
    const c=upper>.5?silver.clone().lerp(dorsal,(upper-.5)*1.95):belly.clone().lerp(silver,upper*1.5);
    const stripes=(Math.sin(p[0]*12+.5+Math.cos(v*6)*1.2)+1)*.5;
    if(upper>.45)c.multiplyScalar(1-.32*stripes**12);
    return c;
  }),skin);
  scaleRelief(root,prof,'#b3c7b1',41,34,.19,.79);
  const fin=materials('#bf955c',{transparent:true,opacity:.63,roughness:.43,metalness:.25,clearcoat:.5,depthWrite:false});
  const ray=materials('#d3b783',{metalness:.37,roughness:.35});
  membrane(root,[[-1.67,.06,0],[-2.24,.71,0],[-2.09,.13,0],[-2.05,-.15,0],[-2.30,-.71,0],[-1.63,-.06,0]],fin,ray,[-1.55,0,0]);
  membrane(root,[[-1.11,.31,0],[-.75,.88,0],[-.42,1.04,0],[.07,.91,0],[.61,.60,0]],fin,ray,[.35,.48,0]);
  membrane(root,[[-1.2,-.31,0],[-.94,-.69,0],[-.47,-.70,0],[-.1,-.56,0]],fin,ray,[-.2,-.42,0]);
  for(const side of [-1,1]){
    membrane(root,[[.47,-.12,side*.27],[-.16,-.62,side*.59],[-.34,-.22,side*.49]],fin,ray,[.50,-.06,side*.28]);
    membrane(root,[[.02,-.48,side*.1],[-.26,-.91,side*.22],[-.59,-.69,side*.2]],fin,ray,[-.1,-.45,side*.12]);
    const iris=materials('#be9f57',{metalness:.48,roughness:.18});const black=materials('#06110f',{roughness:.12,clearcoat:1});
    ellipsoid(root,[1.19,.14,side*.201],[.138,.142,.07],iris);
    ellipsoid(root,[1.213,.145,side*.252],[.077,.084,.024],black);
    ellipsoid(root,[1.24,.181,side*.27],[.021,.02,.009],materials('#ffffff',{emissive:'#bacfd4',emissiveIntensity:.5}));
    tube(root,[[.88,.30,side*.18],[.63,.15,side*.321],[.62,-.17,side*.30],[.80,-.31,side*.225]],.012,materials('#466453'),30,6,.006);
    tube(root,[[1.58,-.016,side*.036],[1.43,-.078,side*.12],[1.25,-.075,side*.19]],.008,materials('#354c3f'),22,5,.004);
    tube(root,[[-1.20,.02,side*.17],[-.6,.02,side*.30],[.35,.055,side*.327],[.67,.1,side*.30]],.004,ray,45,4,.003);
  }
  root.rotation.z=.07;return root;
}

export function lizard(){
  seed=44;const root=new T.Group(),tex=scaleMap('lizard');
  const skin=materials('#64794a',{roughness:.66,metalness:.10,clearcoat:.1,bumpMap:tex,bumpScale:.08});
  const light=materials('#b5b582',{roughness:.56,bumpMap:tex,bumpScale:.025});
  const dark=materials('#384c2d',{roughness:.5});
  const prof=[[-1.34,.08,.09],[-1.15,.17,.18],[-.72,.31,.29],[-.1,.33,.33],[.45,.225,.20],[.72,.20,.205],[1.05,.25,.26],[1.38,.17,.18],[1.59,.07,.09]];
  const top=new T.Color('#687d3c'),bottom=new T.Color('#c4bd88');
  add(root,surface((u,v)=>{
    const [x,ry,rz]=profile(prof,u),a=v*Math.PI*2;
    return[x,ry*Math.cos(a)+.075*Math.sin(u*4),rz*Math.sin(a)];
  },110,64,(u,v,p)=>{
    const s=(Math.cos(v*Math.PI*2)+1)/2,c=bottom.clone().lerp(top,s);
    const band=Math.abs(Math.sin(v*Math.PI*2));
    if(band>.82 && s>.37)c.multiplyScalar(.54);
    if(band>.72 && band<.82 && s>.5)c.lerp(new T.Color('#d6c992'),.7);
    c.multiplyScalar(.94+Math.sin(u*170+v*140)*.05);return c;
  }),materials('#ffffff',{vertexColors:true,roughness:.66,metalness:.1,bumpMap:tex,bumpScale:.07}));
  scaleRelief(root,prof,'#8b9b63',39,30,.12,.88,true);
  // Long, continuous taper, with an asymmetric resting curve.
  tube(root,[[-1.08,.01,0],[-1.65,-.01,.03],[-2.13,-.025,.23],[-2.62,-.025,.59],[-3.02,.025,.73],[-3.38,.08,.55],[-3.50,.10,.25]],.175,skin,100,20,.003);
  for(const side of [-1,1]){
    // Front and hind limbs branch into five tapered digits each.
    for(const hind of [false,true]){
      const x=hind?-.86:.51,s=side;
      const shoulder=[x,.015,s*.19],elbow=[x+(hind?-.3:-.18),-.22,s*.53],wrist=[x+(hind?.19:.27),-.51,s*.83];
      tube(root,[shoulder,elbow,wrist],hind?.14:.105,skin,32,14,.052);
      ellipsoid(root,wrist,[.12,.052,.08],skin);
      for(let j=0;j<5;j++){
        const a=(j-2)*.38,length=.18+.10*(1-Math.abs(j-2)/3),dx=Math.cos(a)*length,dz=Math.sin(a)*length;
        const end=[wrist[0]+dx,-.55,wrist[2]+s*(.075+dz)];
        tube(root,[[wrist[0]+.025,-.51,wrist[2]+s*(j-2)*.027],[wrist[0]+dx*.55,-.53,wrist[2]+s*(.04+dz*.6)],end],.021,light,16,7,.006);
        tube(root,[end,[end[0]+.035,-.535,end[2]+s*.012],[end[0]+.049,-.552,end[2]+s*.02]],.006,materials('#cab98d'),6,5,.001);
      }
    }
    const eye=[1.12,.155,side*.221];
    ellipsoid(root,eye,[.129,.129,.075],skin);
    ellipsoid(root,[1.137,.16,side*.276],[.094,.095,.028],materials('#b6a361',{roughness:.24,metalness:.4}));
    ellipsoid(root,[1.15,.16,side*.302],[.038,.072,.013],materials('#06110c',{roughness:.14,clearcoat:1}));
    ellipsoid(root,[1.171,.19,side*.313],[.018,.017,.006],materials('#e6eacb',{emissive:'#aecba9',emissiveIntensity:.3}));
    ellipsoid(root,[1.46,.025,side*.139],[.015,.014,.009],dark);
    tube(root,[[1.56,-.02,side*.077],[1.32,-.075,side*.173],[1.04,-.10,side*.221],[.87,-.07,side*.20]],.006,dark,28,5,.003);
    // Individually modelled lateral scales catch the studio rim light.
    for(let j=0;j<42;j++){
      const x=-1.03+j*.047,ry=.23+.085*Math.sin(j/42*Math.PI);
      const m=ellipsoid(root,[x,.12,side*ry],[.018,.026,.008],j%4===0?light:skin);m.rotation.z=.2;
    }
  }
  root.position.x=.55;root.rotation.z=.08;root.rotation.y=.28;return root;
}

export function prepareModel(root,kind,clock){
  root.updateMatrixWorld(true);
  const meshes=[];
  root.traverse(m=>{if(m.isMesh)meshes.push(m);});
  const assembled=new T.Group();const pointPos=[],pointColors=[];
  const accent=new T.Color(kind==='mushroom'?'#e0ba86':kind==='fish'?'#95d1cd':'#b6d799');
  const sampleMeshes=[];let areaTotal=0;
  for(const m of meshes){
    const g=m.geometry.clone().applyMatrix4(m.matrixWorld);
    const mesh=new T.Mesh(g,m.material.clone());mesh.userData.baseOpacity=mesh.material.opacity;mesh.material.transparent=true;
    mesh.material.onBeforeCompile=shader=>{
      shader.uniforms.specimenTime=clock;
      shader.vertexShader='uniform float specimenTime;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+deform(kind));
    };mesh.material.customProgramCacheKey=()=>kind;assembled.add(mesh);
    const a=g.attributes.position,ind=g.index;let cum=[],area=0;
    const A=new T.Vector3(),B=new T.Vector3(),C=new T.Vector3();
    for(let i=0;i<ind.count;i+=3){A.fromBufferAttribute(a,ind.getX(i));B.fromBufferAttribute(a,ind.getX(i+1));C.fromBufferAttribute(a,ind.getX(i+2));area+=B.sub(A).cross(C.sub(A)).length()*.5;cum.push(area);}
    areaTotal+=area;sampleMeshes.push({g,area,cum});
  }
  // Area-weighted triangle sampling avoids clumps at mesh poles and fine gills.
  for(const {g,area,cum} of sampleMeshes){
    const a=g.attributes.position,ind=g.index,N=Math.round(24000*area/areaTotal);
    for(let j=0;j<N;j++){
      const target=rand()*area;let lo=0,hi=cum.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(cum[mid]<target)lo=mid+1;else hi=mid;}
      const k=lo*3,A=V().fromBufferAttribute(a,ind.getX(k)),B=V().fromBufferAttribute(a,ind.getX(k+1)),C=V().fromBufferAttribute(a,ind.getX(k+2));
      const r=Math.sqrt(rand()),s=rand();A.multiplyScalar(1-r).addScaledVector(B,r*(1-s)).addScaledVector(C,r*s);pointPos.push(A.x,A.y,A.z);
      const c=accent.clone().multiplyScalar(.5+rand()*.7);pointColors.push(c.r,c.g,c.b);
    }
  }
  const pg=new T.BufferGeometry();pg.setAttribute('position',new T.Float32BufferAttribute(pointPos,3));pg.setAttribute('color',new T.Float32BufferAttribute(pointColors,3));
  const pointMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,uniforms:{specimenTime:clock,alpha:{value:0},pointScale:{value:1}},
    vertexShader:`uniform float specimenTime;uniform float pointScale;varying vec3 vColor;void main(){vColor=color;vec3 transformed=position;${deform(kind)}vec4 mv=modelViewMatrix*vec4(transformed,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(16.*pointScale/-mv.z,1.,5.);}`,
    fragmentShader:'uniform float alpha;varying vec3 vColor;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(vColor,alpha*smoothstep(.5,.10,d));}' });
  const points=new T.Points(pg,pointMaterial);assembled.add(points);
  if(kind==='mushroom'){
    const positions=[],phase=[];
    for(let i=0;i<90;i++){const a=rand()*Math.PI*2,r=.25+rand()*.95;positions.push(.28+Math.cos(a)*r,.6,Math.sin(a)*r);phase.push(rand());}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('phase',new T.Float32BufferAttribute(phase,1));
    const mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{specimenTime:clock},vertexShader:'uniform float specimenTime;attribute float phase;varying float fade;void main(){float t=fract(phase+specimenTime*.055);vec3 p=position;p.y-=t*2.1;p.x+=sin(t*5.+phase*20.)*.12*t;fade=sin(t*3.14159)*.33;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(12./-mv.z,1.,3.);}',fragmentShader:'varying float fade;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.83,.71,.48,fade*smoothstep(.5,.1,d));}'});
    assembled.add(new T.Points(geo,mat));
  }
  // Free the construction meshes; only the baked, animated sculpture is retained.
  const oldMats=new Set();root.traverse(m=>{if(m.isMesh){m.geometry.dispose();oldMats.add(m.material);}});oldMats.forEach(m=>m.dispose());
  return {group:assembled,points,meshes:assembled.children.filter(x=>x.isMesh)};
}
function deform(kind){
  if(kind==='fish')return 'float w=pow(clamp((1.5-transformed.x)/3.6,0.,1.),1.8);transformed.z+=sin(transformed.x*2.7+specimenTime*2.8)*.22*w;';
  if(kind==='lizard')return 'float w=pow(clamp((-transformed.x+.1)/3.2,0.,1.),1.6);transformed.z+=sin(specimenTime*1.25+transformed.x*1.6)*.15*w;transformed.y*=1.+sin(specimenTime*1.7)*.013;';
  return '';
}

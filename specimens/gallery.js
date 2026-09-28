import * as T from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {mushroom,fish,lizard,prepareModel} from './models.js';

const params=new URLSearchParams(location.search);
const embedded=params.get('embed')==='1';
if(embedded)document.body.classList.add('embed');
const copy={
  sv:{collection:'En levande samling',science:'Till vetenskapen',loading:'Formar naturen…',reset:'Återställ',gesture:'Dra för att utforska',traceTitle:'Det synliga är bara början.',surface:'Yta',dna:'DNA-spår',traceHelp:'Dra för att se bortom ytan',mushroom:'Svamp',fish:'Fisk',lizard:'Ödla',forest:'Under marken',water:'Under ytan',land:'Nära marken',note:'Konstnärliga naturstudier. DNA-vyn är en illustration, inte provresultat.',download:'Spara transparent bild',embed:'Använd på webbplatsen',embedTitle:'En skulptur. Valfri sida.',embedDescription:'Bädda in den valda skulpturen. Bakgrunden är transparent och modellen kan fortfarande roteras.',copy:'Kopiera kod',pause:'Pausa rörelsen',play:'Starta rörelsen',copied:'Koden är kopierad.',copyFail:'Markera och kopiera koden ovan.',failure:'3D är inte tillgängligt i den här webbläsaren. Prova en webbläsare med WebGL aktiverat.',zoomIn:'Zooma in',zoomOut:'Zooma ut',stage:'Interaktiv 3D-modell. Dra för att rotera. Använd piltangenter för rotation, plus och minus för zoom, 0 för återställning.',trace:'Övergång mellan yta och schematiska DNA-spår'},
  en:{collection:'A living collection',science:'Back to the science',loading:'Shaping nature…',reset:'Reset view',gesture:'Drag to explore',traceTitle:'The visible is only the beginning.',surface:'Surface',dna:'DNA traces',traceHelp:'Drag to see beyond the surface',mushroom:'Mushroom',fish:'Fish',lizard:'Lizard',forest:'Beneath the forest',water:'Beneath the surface',land:'Close to the ground',note:'Artistic nature studies. The DNA view is illustrative, not sample data.',download:'Save transparent image',embed:'Use on the website',embedTitle:'One sculpture. Any page.',embedDescription:'Embed the selected sculpture. Its background is transparent, and the model remains interactive.',copy:'Copy code',pause:'Pause motion',play:'Play motion',copied:'Embed code copied.',copyFail:'Select and copy the code above.',failure:'3D is unavailable in this browser. Please try a browser with WebGL enabled.',zoomIn:'Zoom in',zoomOut:'Zoom out',stage:'Interactive 3D model. Drag to rotate. Arrow keys rotate, plus and minus zoom, 0 resets the view.',trace:'Transition from the surface to schematic DNA traces'}
};
const content={
 mushroom:{accent:'#d0a875',camera:[2.5,.65,6.3],sv:['Skogens dolda nätverk','Svampen.','En liten fruktkropp. Ett mycket större liv under marken.','Vrid på svampen och upptäck skivorna under hatten.','Med DNA från jord kan MIX undersöka svampsamhällen som annars är svåra att upptäcka.'],en:['The forest’s hidden network','The mushroom.','A small fruiting body. A much larger life beneath the forest.','Turn the mushroom to discover the gills beneath its cap.','DNA from soil helps MIX investigate fungal communities that are otherwise difficult to observe.']},
 fish:{accent:'#77b7b4',camera:[1.1,.75,6.4],sv:['Ett vattenprov. En större värld.','Fisken.','Livet under ytan lämnar spår långt innan vi ser det.','Upptäck fjällens struktur och fenornas tunna strålar.','MIX analyserar DNA i vatten för att undersöka vilka fiskarter som finns i en miljö.'],en:['One water sample. A wider world.','The fish.','Life beneath the surface leaves traces long before we see it.','Explore the scale pattern and the fine rays within the fins.','MIX analyses DNA in water to investigate which fish species occur in an environment.']},
 lizard:{accent:'#a3bf82',camera:[1.8,3.2,6.2],sv:['Små liv. Stora sammanhang.','Ödlan.','Mellan sten och vegetation finns en värld att förstå.','Följ den långa svansen och de fint formade tårna.','Alla organismer lämnar genetiska spår. Vad som kan upptäckas beror på miljö, provtagning och analysmetod.'],en:['Small lives. Larger connections.','The lizard.','Between stone and vegetation, there is a world to understand.','Follow the long tail and the finely shaped toes.','Organisms leave genetic traces. What can be detected depends on the environment, sampling and analytical method.']}
};
let lang=params.get('lang')==='en'?'en':'sv';
let selected=Object.hasOwn(content,params.get('specimen'))?params.get('specimen'):'mushroom';
let paused=matchMedia('(prefers-reduced-motion: reduce)').matches;
let ready=false,current,renderer,controls,camera,scene,frame=0,inView=true,last=0,dirty=60,lastFit=1;
const clock={value:0};const cache=new Map();const stage=document.querySelector('#stage');
const trace=document.querySelector('#trace');
const $=s=>document.querySelector(s);

function updateCopy(){
 document.documentElement.lang=lang;document.title=`${copy[lang][selected]} — MIX Research / 3D`;
 document.querySelectorAll('[data-i18n]').forEach(el=>el.textContent=copy[lang][el.dataset.i18n]);
 const row=content[selected][lang];['category','name','description','detail','context'].forEach((id,i)=>$('#'+id).textContent=row[i]);
 $('#language').textContent=lang==='sv'?'EN':'SV';$('#language').setAttribute('aria-label',lang==='sv'?'Switch to English':'Byt till svenska');
 $('#science-link').href=lang==='en'?'../vetenskapen-en.html':'../vetenskapen.html';
 $('#motion-label').textContent=copy[lang][paused?'play':'pause'];$('#motion').setAttribute('aria-pressed',String(paused));
 $('.motion-icon').textContent=paused?'▷':'Ⅱ';
 $('#zoom-in').setAttribute('aria-label',copy[lang].zoomIn);$('#zoom-out').setAttribute('aria-label',copy[lang].zoomOut);
 stage.setAttribute('aria-label',copy[lang].stage);trace.setAttribute('aria-label',copy[lang].trace);
 $('.gallery').dataset.specimen=selected;document.documentElement.style.setProperty('--accent',content[selected].accent);
 document.querySelectorAll('button[data-model]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.model===selected)));
 const url=new URL(location.href);url.searchParams.set('specimen',selected);url.searchParams.set('lang',lang);history.replaceState(null,'',url);
}
updateCopy();

function studio(){
 const room=new T.Scene();room.add(new T.Mesh(new T.SphereGeometry(15,24,16),new T.MeshBasicMaterial({color:'#334c47',side:T.BackSide})));
 const panels=[[-3,5,4,4,7,'#fff7dc',5],[4,2,1,2,6,'#a4d2dd',4],[0,4,-4,5,2,'#c6dfac',5],[-6,0,-2,2,5,'#a9b49a',2]];
 for(const [x,y,z,w,h,c,intensity]of panels){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(intensity),side:T.DoubleSide}));m.position.set(x,y,z);m.lookAt(0,0,0);room.add(m);}
 const generator=new T.PMREMGenerator(renderer);const rt=generator.fromScene(room,.06);generator.dispose();room.traverse(m=>{if(m.isMesh){m.geometry.dispose();m.material.dispose();}});return rt;
}
let environment;
function start(){
 renderer=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
 renderer.setClearColor(0x000000,0);renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=T.SRGBColorSpace;
 renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;stage.appendChild(renderer.domElement);
 renderer.domElement.setAttribute('aria-hidden','true');scene=new T.Scene();camera=new T.PerspectiveCamera(37,1,.1,60);
 environment=studio();scene.environment=environment.texture;
 scene.add(new T.HemisphereLight('#f6e8cd','#183d32',.75));
 const key=new T.DirectionalLight('#fff2ce',2.5);key.position.set(-3,5,5);scene.add(key);
 const rim=new T.DirectionalLight('#a1d4d8',2.5);rim.position.set(3,1,-3);scene.add(rim);
 const fill=new T.DirectionalLight('#adc8a2',.8);fill.position.set(0,-2,4);scene.add(fill);
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.minDistance=3.4;controls.maxDistance=11;controls.rotateSpeed=.65;controls.enableZoom=embedded;controls.minPolarAngle=.12;controls.maxPolarAngle=Math.PI-.12;
 controls.addEventListener('change',()=>{dirty=30;});controls.addEventListener('start',()=>{dirty=60;});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();ready=false;cancelAnimationFrame(frame);showFailure();});
 renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
 new ResizeObserver(resize).observe(stage);
 new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)wake();else cancelAnimationFrame(frame);},{threshold:.01}).observe(stage);
 ready=true;choose(selected);trace.value=T.MathUtils.clamp(Number(params.get('trace'))||0,0,100);setTrace();resize();$('#loading').hidden=true;document.body.dataset.ready='true';wake();
}
function showFailure(){
 $('#loading').hidden=false;$('#loading').textContent=copy[lang].failure;
 const img=document.createElement('img');img.className='fallback-image';img.alt=copy[lang][selected];img.src=`posters/${selected}.png`;img.onerror=()=>img.remove();stage.prepend(img);
 $('#download').disabled=true;stage.dataset.fallback='true';
}
function choose(kind){
 selected=kind;updateCopy();if(!ready){const poster=stage.querySelector('.fallback-image');if(poster){poster.src=`posters/${kind}.png`;poster.alt=copy[lang][kind];}return;}
 if(current)scene.remove(current.group);
 if(!cache.has(kind)){const builder={mushroom,fish,lizard}[kind];cache.set(kind,prepareModel(builder(),kind,clock));}
 current=cache.get(kind);scene.add(current.group);trace.value=0;setTrace();reset();
 stage.dataset.model=kind;stage.dataset.vertices=current.points.geometry.attributes.position.count;
}
function fit(){return Math.max(1,({mushroom:.95,fish:1.15,lizard:1.28}[selected])/camera.aspect);}
function reset(){
 camera.position.set(...content[selected].camera);if(selected==='lizard')camera.position.set(.5,6.3,3.8);
 controls.target.set(selected==='lizard'?-.3:0,0,0);lastFit=fit();camera.position.multiplyScalar(lastFit).add(controls.target);
 controls.maxDistance=Math.max(11,camera.position.distanceTo(controls.target)*1.7);controls.update();dirty=60;
}
function resize(){
 if(!renderer)return;const r=stage.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();
 const next=fit();camera.position.sub(controls.target).multiplyScalar(next/lastFit).add(controls.target);lastFit=next;controls.maxDistance=Math.max(11,camera.position.distanceTo(controls.target)*1.7);controls.update();dirty=60;
}
function setTrace(){
 if(!current)return;const a=Number(trace.value)/100;
 current.meshes.forEach(m=>{m.material.opacity=m.userData.baseOpacity*(1-a)**1.5;m.visible=a<.995;m.material.depthWrite=a<.1&&m.userData.baseOpacity>.99;});
 current.points.material.uniforms.alpha.value=a;current.points.visible=a>.001;current.points.material.uniforms.pointScale.value=renderer.getPixelRatio();dirty=40;
 trace.setAttribute('aria-valuetext',`${100-Number(trace.value)}% ${copy[lang].surface}, ${trace.value}% ${copy[lang].dna}`);
}
function render(){
 const t=clock.value;if(current){
  current.group.position.y=selected==='fish'?Math.sin(t*.65)*.05:0;
  current.group.rotation.y=selected==='mushroom'?Math.sin(t*.20)*.045:Math.sin(t*.32)*.035;
 }
 controls.update();renderer.render(scene,camera);
}
function loop(now){
 if(document.hidden||!inView||!ready){frame=0;return;}
 frame=requestAnimationFrame(loop);
 if(now-last<32)return;const dt=Math.min((now-last)/1000,.06);last=now;
 if(!paused)clock.value+=dt;
 if(!paused||dirty>0){render();dirty--;}
}
function wake(){cancelAnimationFrame(frame);last=performance.now();dirty=60;frame=requestAnimationFrame(loop);}
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(frame);else wake();});
document.querySelectorAll('button[data-model]').forEach(b=>b.addEventListener('click',()=>choose(b.dataset.model)));
$('#language').addEventListener('click',()=>{lang=lang==='sv'?'en':'sv';updateCopy();setTrace();});
$('#motion').addEventListener('click',()=>{paused=!paused;updateCopy();dirty=40;});
matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',e=>{paused=e.matches;updateCopy();});
trace.addEventListener('input',setTrace);$('#reset').addEventListener('click',()=>{if(ready)reset();});
function zoom(factor){if(!ready)return;const offset=camera.position.clone().sub(controls.target);const distance=T.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance);camera.position.copy(controls.target).add(offset.setLength(distance));controls.update();dirty=40;}
$('#zoom-in').addEventListener('click',()=>zoom(.84));$('#zoom-out').addEventListener('click',()=>zoom(1.19));
stage.addEventListener('keydown',e=>{
 if(!ready)return;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
  e.preventDefault();const s=new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
  if(e.key==='ArrowLeft')s.theta-=.15;if(e.key==='ArrowRight')s.theta+=.15;
  if(e.key==='ArrowUp')s.phi-=.12;if(e.key==='ArrowDown')s.phi+=.12;s.phi=T.MathUtils.clamp(s.phi,.12,Math.PI-.12);
  camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(s));controls.update();dirty=40;
 }else if(e.key==='+'||e.key==='='){e.preventDefault();zoom(.84);}else if(e.key==='-'){e.preventDefault();zoom(1.19);}else if(e.key==='0'){e.preventDefault();reset();}
});
$('#download').addEventListener('click',()=>{
 if(!ready)return;render();renderer.domElement.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`MIX-${selected}-${Number(trace.value)>50?'DNA':'sculpture'}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);});
});
$('#embed').addEventListener('click',()=>{
 const url=new URL('./index.html',location.href);url.searchParams.set('specimen',selected);url.searchParams.set('embed','1');url.searchParams.set('lang',lang);
 if(Number(trace.value)>0)url.searchParams.set('trace',trace.value);
 $('#embed-code').value=`<iframe src="${url.href}" title="MIX Research — ${copy[lang][selected]} 3D" loading="lazy" style="width:100%;height:600px;border:0;background:transparent" allow="fullscreen"></iframe>`;
 $('#copy-status').textContent='';$('#embed-dialog').showModal();
});
$('#copy').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#embed-code').value);$('#copy-status').textContent=copy[lang].copied;}catch{$('#embed-code').select();$('#copy-status').textContent=copy[lang].copyFail;}});
try{start();}catch(error){console.error('Specimen renderer:',error);showFailure();}

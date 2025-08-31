import {createEl, easing, readImage} from './utils.js';
import {exportProject} from './exporter.js';

const fileInput=document.getElementById('fileInput');
const layersList=document.getElementById('layersList');
const canvas=document.getElementById('previewCanvas');
const ctx=canvas.getContext('2d');
const baseSpeedEl=document.getElementById('baseSpeed');
const directionEl=document.getElementById('direction');
const easingEl=document.getElementById('easing');
const canvasSizeEl=document.getElementById('canvasSize');
const bgStartEl=document.getElementById('bgStart');
const bgEndEl=document.getElementById('bgEnd');
const sunRaysEl=document.getElementById('sunRays');
const statusMem=document.getElementById('statusMem');
const statusFPS=document.getElementById('statusFPS');
const dropOverlay=document.getElementById('dropOverlay');

let layers=[]; let selectedIndex=-1; let running=true; let lastTime=0; let fps=0, fpsCount=0, fpsLast=0;

function addLayer(opts){
  const layer=Object.assign({
    name:opts.name||'Layer '+(layers.length+1),
    img:opts.img||null,
    srcName:opts.srcName||null,
    speed:0.2, offsetX:0, offsetY:0, scale:1, opacity:1, blur:0, repeatX:false, visible:true, scroll:0, fileSize:opts.fileSize||0
  }, opts);
  layers.push(layer);
  renderLayers();
}

function handleFiles(files){
  Array.from(files).forEach(file=>{
    if(!file.type.startsWith('image'))return;
    if(file.size>8*1024*1024)alert('Warning: large image '+file.name);
    readImage(file).then(img=>{
      addLayer({img, srcName:file.name, fileSize:file.size});
    });
  });
}

fileInput.addEventListener('change',e=>{handleFiles(e.target.files); fileInput.value='';});

document.getElementById('btnAdd').onclick=()=>fileInput.click();
document.getElementById('btnEmpty').onclick=()=>addLayer({});
document.getElementById('btnReset').onclick=()=>{layers=[];selectedIndex=-1;renderLayers();};
document.getElementById('btnExport').onclick=()=>exportProject({layers, canvas:{w:canvas.width,h:canvas.height,bg:[bgStartEl.value,bgEndEl.value],sunRays:sunRaysEl.checked}});

function renderLayers(){
  layersList.innerHTML='';
  layers.forEach((l,idx)=>{
    const row=createEl('div',{class:'layer',draggable:true});
    if(idx===selectedIndex)row.classList.add('selected');
    if(l.visible===false)row.style.opacity=0.4;
    const thumb=l.img?createEl('img',{src:l.img.src}):createEl('div',{style:'width:40px;height:40px;background:#555;margin-right:4px;'});
    const nameInput=createEl('input',{type:'text',value:l.name,oninput:ev=>{l.name=ev.target.value;}});
    const eye=createEl('button',{onclick:()=>{l.visible=!l.visible;renderLayers();}}, l.visible?'👁':'🚫');
    const del=createEl('button',{onclick:()=>{layers.splice(idx,1); if(selectedIndex>=layers.length)selectedIndex=layers.length-1; renderLayers();}}, '🗑');
    const controls=createEl('div',{class:'controls'},
      createEl('label',{},'spd',createEl('input',{type:'number',step:'0.1',min:'0',max:'2',value:l.speed,oninput:e=>l.speed=parseFloat(e.target.value)})),
      createEl('label',{},'ox',createEl('input',{type:'number',value:l.offsetX,oninput:e=>l.offsetX=parseFloat(e.target.value)})),
      createEl('label',{},'oy',createEl('input',{type:'number',value:l.offsetY,oninput:e=>l.offsetY=parseFloat(e.target.value)})),
      createEl('label',{},'sc',createEl('input',{type:'number',step:'0.1',min:'0.2',max:'2',value:l.scale,oninput:e=>l.scale=parseFloat(e.target.value)})),
      createEl('label',{},'op',createEl('input',{type:'number',step:'0.1',min:'0.1',max:'1',value:l.opacity,oninput:e=>l.opacity=parseFloat(e.target.value)})),
      createEl('label',{},'bl',createEl('input',{type:'number',step:'0.1',min:'0',max:'10',value:l.blur,oninput=e=>l.blur=parseFloat(e.target.value)})),
      createEl('label',{},'repeat',createEl('input',{type:'checkbox',checked:l.repeatX,onchange:e=>l.repeatX=e.target.checked}))
    );
    row.append(thumb,nameInput,eye,del,controls);
    row.onclick=()=>{selectedIndex=idx;renderLayers();};
    row.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',idx);});
    row.addEventListener('dragover',e=>e.preventDefault());
    row.addEventListener('drop',e=>{e.preventDefault();const from=+e.dataTransfer.getData('text/plain');const to=idx;if(from!==to){const m=layers.splice(from,1)[0];layers.splice(to,0,m);renderLayers();}});
    layersList.appendChild(row);
  });
  updateMemory();
}

function updateMemory(){
  const bytes=layers.reduce((a,l)=>a+l.fileSize,0);
  statusMem.textContent='Memory: '+(bytes/1024/1024).toFixed(2)+' MB';
}

canvasSizeEl.onchange=()=>{const [w,h]=canvasSizeEl.value.split('x').map(Number);canvas.width=w;canvas.height=h;};

document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT')return;
  if(e.key==='ArrowDown'){selectedIndex=Math.min(layers.length-1,selectedIndex+1);renderLayers();}
  else if(e.key==='ArrowUp'){selectedIndex=Math.max(0,selectedIndex-1);renderLayers();}
  else if(e.key==='Delete' && selectedIndex>=0){layers.splice(selectedIndex,1);selectedIndex=Math.min(selectedIndex,layers.length-1);renderLayers();}
  else if(e.key===' '){running=!running;}
});

function drawBackground(){
  const grad=ctx.createLinearGradient(0,0,0,canvas.height);
  grad.addColorStop(0,bgStartEl.value);
  grad.addColorStop(1,bgEndEl.value);
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  if(sunRaysEl.checked){
    ctx.save();
    ctx.globalAlpha=0.2;
    ctx.translate(canvas.width/2,0);
    for(let i=0;i<20;i++){
      ctx.rotate(Math.PI/20);
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(canvas.width,0);
      ctx.strokeStyle='rgba(255,255,255,0.3)';
      ctx.stroke();
    }
    ctx.restore();
  }
}

function loop(t){
  requestAnimationFrame(loop);
  if(!lastTime)lastTime=t; const dt=(t-lastTime)/1000; lastTime=t;
  if(running){
    drawBackground();
    const base=parseFloat(baseSpeedEl.value)*parseFloat(directionEl.value);
    const ease=easing[easingEl.value];
    const e=ease((t/1000)%1);
    layers.forEach((l)=>{
      if(!l.visible) return;
      if(l.img){
        l.scroll+=(base*e*dt*l.speed);
        const w=l.img.width*l.scale;
        const h=l.img.height*l.scale;
        ctx.save();
        ctx.globalAlpha=l.opacity;
        ctx.filter=`blur(${l.blur}px)`;
        let x=((-l.scroll)%w)-w;
        do{
          ctx.drawImage(l.img,x+l.offsetX,l.offsetY,w,h);
          if(!l.repeatX)break;
          x+=w;
        }while(x<canvas.width);
        ctx.restore();
      }
    });
  }
  fpsCount++; if(t-fpsLast>1000){fps=fpsCount; fpsCount=0; fpsLast=t; statusFPS.textContent='FPS: '+fps;}
}
requestAnimationFrame(loop);

// drag & drop
window.addEventListener('dragover',e=>{e.preventDefault();dropOverlay.classList.add('show');});
window.addEventListener('drop',e=>{e.preventDefault();dropOverlay.classList.remove('show'); handleFiles(e.dataTransfer.files);});
window.addEventListener('dragleave',e=>{dropOverlay.classList.remove('show');});

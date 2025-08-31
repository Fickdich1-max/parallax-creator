export function createEl(tag, attrs={}, ...children){
  const el=document.createElement(tag);
  Object.entries(attrs).forEach(([k,v])=>{if(k.startsWith('on'))el.addEventListener(k.substring(2),v);else if(v!==null)el.setAttribute(k,v);});
  children.forEach(ch=>{if(typeof ch==='string')el.appendChild(document.createTextNode(ch)); else if(ch) el.appendChild(ch);});
  return el;
}
export const easing={
  linear:t=>t,
  easeIn:t=>t*t,
  easeOut:t=>t*(2-t),
  easeInOut:t=>t<.5?2*t*t:-1+(4-2*t)*t
};
export function readImage(file){
  return new Promise((res,rej)=>{
    const img=new Image();
    img.onload=()=>res(img);
    img.onerror=rej;
    const reader=new FileReader();
    reader.onload=e=>{img.src=e.target.result;};
    reader.readAsDataURL(file);
  });
}
export function dataURLToBlob(dataURL){
  const arr=dataURL.split(','), mime=arr[0].match(/:(.*?);/)[1];
  const bstr=atob(arr[1]); let n=bstr.length; const u8arr=new Uint8Array(n);
  while(n--)u8arr[n]=bstr.charCodeAt(n);
  return new Blob([u8arr],{type:mime});
}

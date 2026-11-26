const $=s=>document.querySelector(s),login=$('#login'),work=$('#work'),form=$('#edit'),target=$('#target'),status=$('#status');
let key='',demo=false,record=null,photo='',baseline={},busy=false;
const demoRecords=new Map();
const fresh=()=>({version:'',draft:null,published:null,previous:null});
function say(s){status.textContent=s;}
async function call(action,body){
 const id=target.value;
 if(demo){
  let r=demoRecords.get(id)||fresh();
  if(action==='edit')return structuredClone(r);
  if(action==='draft')r={...r,draft:body.value};
  if(action==='publish')r={...r,previous:r.published,published:body.value,draft:null};
  if(action==='restore'){if(!r.published)throw Error('No practice publication to restore.');r={...r,published:r.previous,previous:r.published,draft:null};}
  r.version=crypto.randomUUID();demoRecords.set(id,r);return structuredClone(r);
 }
 const response=await fetch('/.netlify/functions/site-content?action='+encodeURIComponent(action)+'&id='+encodeURIComponent(id),{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const data=await response.json();if(!response.ok)throw Error(data.message||'Request failed');return data;
}
function read(){
 if(target.value==='appearance')return {theme:form.elements.theme.value,font:form.elements.font.value};
 const v={};for(const k of ['heading','intro','alt','seoTitle','description'])v[k]=form.elements[k].value.trim();
 v.photo=photo;return v;
}
function show(){
 if(!record)return;
 const v=record.draft||record.published||{};
 const theme=target.value==='appearance';
 $('#page-fields').hidden=theme;$('#theme-fields').hidden=!theme;
 if(theme){form.elements.theme.value=v.theme||'original';form.elements.font.value=v.font||'original';}
 else{for(const k of ['heading','intro','alt','seoTitle','description']){form.elements[k].value=v[k]||'';form.elements[k].placeholder=baseline[k]||'';}photo=v.photo||'';form.elements.photoUrl.value=photo.startsWith('https:')?photo:'';form.elements.upload.value='';}
 $('#open-page').href=theme?'index.html':target.value+'.html';$('#open-page').hidden=demo;
 render();
}
function render(){
 const v=read(),p=$('#preview'),img=p.querySelector('img');
 p.style.background=v.theme==='navy'?'#142c47':'#203e32';p.style.fontFamily=v.font==='serif'?'Georgia,serif':'system-ui,sans-serif';
 p.querySelector('h3').textContent=v.heading||baseline.heading||(target.value==='appearance'?'Appearance sample':'Original page headline');
 p.querySelector('p').textContent=v.intro||baseline.intro||'Your content preview';
 img.hidden=!v.photo;if(v.photo){img.src=v.photo;img.alt=v.alt||'';}else img.removeAttribute('src');
}
async function load(){
 if(busy)return;busy=true;target.disabled=true;
 try{record=await call('edit');baseline={};
 if(target.value!=='appearance'){
  const page=await fetch(target.value+'.html');if(page.ok){const doc=new DOMParser().parseFromString(await page.text(),'text/html'),h=doc.querySelector('main h1'),p=doc.querySelector('main .hero .wrap p:not(.eyebrow)');baseline={heading:h?.textContent||'',intro:p?.textContent||'',seoTitle:doc.title,description:doc.querySelector('meta[name=description]')?.content||''};}
 }
 show();say('Ready to edit.');}catch(e){record=null;say(e.message);throw e;}finally{busy=false;target.disabled=false;}
}
async function start(practice){
 demo=practice;key=practice?'':login.elements.key.value.trim();say('Opening editor…');
 try{await load();login.hidden=true;work.hidden=false;$('#mode').textContent=demo?'Practice mode: changes stay in this tab, never on the website.':'Owner editing: Publish changes the website for this deployment.';login.reset();}catch{key='';}
}
login.onsubmit=e=>{e.preventDefault();start(false);};$('#demo').onclick=()=>start(true);
$('#lock').onclick=()=>location.reload();
$('#appearance-nav').onclick=()=>{if(work.hidden){say('Unlock the editor or enter practice mode first.');return;}target.value='appearance';load().catch(()=>{});};
target.onchange=()=>load().catch(()=>{});
form.oninput=e=>{if(e.target.name==='photoUrl')photo=e.target.value.trim();render();};
$('#remove').onclick=()=>{photo='';form.elements.photoUrl.value='';form.elements.upload.value='';render();};
form.elements.upload.onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12000000){say('Select a JPEG, PNG or WebP photo under 12 MB.');return;}
 try{const bitmap=await createImageBitmap(file),ratio=Math.min(1,1400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();let quality=.82;photo=canvas.toDataURL('image/jpeg',quality);while(photo.length>450000&&quality>.32){quality-=.1;photo=canvas.toDataURL('image/jpeg',quality);}if(photo.length>450000){photo='';throw Error('Photo is too large. Try a smaller one.');}form.elements.photoUrl.value='';render();say('Photo ready. Save a draft or publish when finished.');}catch(err){say(err.message||'Unable to open image.');}
};
form.onsubmit=async e=>{e.preventDefault();if(busy||!record)return;const action=e.submitter.value,v=read();if(action!=='restore'&&v.photo&&!v.alt){say('Enter a photo description.');return;}if(action!=='draft'&&!demo&&!confirm(action==='publish'?'Publish changes to this deployment?':'Restore the previous published version?'))return;busy=true;target.disabled=true;for(const b of form.querySelectorAll('button'))b.disabled=true;try{record=await call(action,{value:v,version:record.version});show();say((demo?'Practice: ':'')+({draft:'Draft saved. Public website unchanged.',publish:'Published.',restore:'Previous version restored.'}[action]));}catch(err){say(err.message);}finally{busy=false;target.disabled=false;for(const b of form.querySelectorAll('button'))b.disabled=false;}};

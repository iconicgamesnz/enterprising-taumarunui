const $=s=>document.querySelector(s),login=$('#login'),work=$('#work'),form=$('#edit'),target=$('#target'),status=$('#status');
let key='',accountUser='',demo=false,record=null,photo='',baseline={},busy=false;
const demoRecords=new Map(),demoMedia=new Map();
const fresh=()=>({version:'',draft:null,published:null,previous:null});
function say(s){status.textContent=s;}
async function call(action,body){
 const id=target.value;
 if(demo){
  let r=demoRecords.get(id)||fresh();
  if(action==='edit')return structuredClone(r);
  if(action==='draft')r={...r,draft:body.value};
  if(action==='unpublish')r={...r,draft:r.draft||r.published,previous:r.published,published:null};
  if(action==='publish')r={...r,previous:r.published,published:body.value,draft:null};
  if(action==='restore'){if(!r.published)throw Error('No practice publication to restore.');r={...r,published:r.previous,previous:r.published,draft:null};}
  r.version=crypto.randomUUID();demoRecords.set(id,r);return structuredClone(r);
 }
 const response=await fetch('/.netlify/functions/site-content?action='+encodeURIComponent(action)+'&id='+encodeURIComponent(id),{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
 const data=await response.json();if(!response.ok)throw Error(data.message||'Request failed');return data;
}
function read(){
 if(target.value==='appearance')return {theme:form.elements.theme.value,font:form.elements.font.value};
 const v={};for(const k of ['heading','intro','alt','seoTitle','description','body'])v[k]=form.elements[k].value.trim();
 v.photo=photo;return v;
}
function show(){
 if(!record)return;
 const v=record.draft||record.published||{};
 const theme=target.value==='appearance';
 $('#unpublish').hidden=!target.value.startsWith('post-');
 $('#page-fields').hidden=theme;$('#theme-fields').hidden=!theme;
 if(theme){form.elements.theme.value=v.theme||'original';form.elements.font.value=v.font||'original';}
 else{for(const k of ['heading','intro','alt','seoTitle','description','body']){form.elements[k].value=v[k]||'';form.elements[k].placeholder=baseline[k]||'';}photo=v.photo||'';form.elements.photoUrl.value=photo.startsWith('https:')?photo:'';form.elements.upload.value='';}
 $('#open-page').href=theme?'index.html':target.value.startsWith('post-')?'news.html#'+target.value:target.value+'.html';$('#open-page').hidden=demo;
 render();
}
function render(){
 const v=read(),p=$('#preview'),img=p.querySelector('img');
 p.style.background=v.theme==='navy'?'#142c47':'#203e32';p.style.fontFamily=v.font==='serif'?'Georgia,serif':'system-ui,sans-serif';
 p.querySelector('h3').textContent=v.heading||baseline.heading||(target.value==='appearance'?'Appearance sample':'Original page headline');
 p.querySelector('p').textContent=v.intro||baseline.intro||'Your content preview';
 p.querySelector('.body-preview').textContent=v.body||'';
 img.hidden=!v.photo;if(v.photo){img.src=v.photo;img.alt=v.alt||'';}else img.removeAttribute('src');
}
async function load(){
 if(busy)return;busy=true;target.disabled=true;
 try{record=await call('edit');baseline={};
 if(target.value!=='appearance'&&!target.value.startsWith('post-')){
  const page=await fetch(target.value+'.html');if(page.ok){const doc=new DOMParser().parseFromString(await page.text(),'text/html'),h=doc.querySelector('main h1'),p=doc.querySelector('main .hero .wrap p:not(.eyebrow)');baseline={heading:h?.textContent||'',intro:p?.textContent||'',seoTitle:doc.title,description:doc.querySelector('meta[name=description]')?.content||''};}
 }
 show();say('Ready to edit.');}catch(e){record=null;say(e.message);throw e;}finally{busy=false;target.disabled=false;}
}
async function start(practice){
 demo=practice;key=practice?'':login.elements.key.value.trim();say('Opening editor…');
 try{accountUser='';if(!practice&&login.elements.username.value.trim()){const a=await service('cms-accounts','login',{username:login.elements.username.value,password:key},false);key=a.token;accountUser=a.username;}await load();login.hidden=true;work.hidden=false;$('#mode').textContent=demo?'Practice mode: changes stay in this tab, never on the website.':(accountUser?'Signed in as '+accountUser:'Owner editing')+': Publish changes the website for this deployment.';login.reset();refreshMedia().catch(()=>{});}catch(e){key='';say(e.message||'Unable to sign in.');}
}
login.onsubmit=e=>{e.preventDefault();start(login.elements.username.value.trim().toLowerCase()==='demo'&&login.elements.key.value==='eti-practice');};$('#demo').onclick=()=>start(true);
$('#lock').onclick=async()=>{if(accountUser)try{await service('cms-accounts','logout',{});}catch{}location.reload();};
$('#appearance-nav').onclick=()=>{if(work.hidden){say('Unlock the editor or enter practice mode first.');return;}target.value='appearance';load().catch(()=>{});};
target.onchange=()=>load().catch(()=>{});
form.oninput=e=>{if(e.target.name==='photoUrl')photo=e.target.value.trim();render();};
$('#remove').onclick=()=>{photo='';form.elements.photoUrl.value='';form.elements.upload.value='';render();};
form.elements.upload.onchange=async e=>{
 const file=e.target.files[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12000000){say('Select a JPEG, PNG or WebP photo under 12 MB.');return;}
 try{const bitmap=await createImageBitmap(file),ratio=Math.min(1,1400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();let quality=.82;photo=canvas.toDataURL('image/jpeg',quality);while(photo.length>450000&&quality>.32){quality-=.1;photo=canvas.toDataURL('image/jpeg',quality);}if(photo.length>450000){photo='';throw Error('Photo is too large. Try a smaller one.');}form.elements.photoUrl.value='';render();say('Photo ready. Save a draft or publish when finished.');}catch(err){say(err.message||'Unable to open image.');}
};
form.onsubmit=async e=>{e.preventDefault();if(busy||!record)return;const action=e.submitter?.value||'draft',v=read();if(['draft','publish'].includes(action)&&v.photo&&!v.alt){say('Enter a photo description.');return;}if(action!=='draft'&&!demo&&!confirm(action==='publish'?'Publish changes to this deployment?':'Restore the previous published version?'))return;busy=true;target.disabled=true;for(const b of form.querySelectorAll('button'))b.disabled=true;try{record=await call(action,{value:v,version:record.version});show();if(target.value.startsWith('post-'))refreshPosts().catch(()=>{});say((demo?'Practice: ':'')+({draft:'Draft saved. Public website unchanged.',publish:'Published.',unpublish:'Unpublished.',restore:'Previous version restored.'}[action]));}catch(err){say(err.message);}finally{busy=false;target.disabled=false;for(const b of form.querySelectorAll('button'))b.disabled=false;}};

async function service(name,action,body,auth=true,query=''){
 const r=await fetch('/.netlify/functions/'+name+'?action='+action+query,{method:body?'POST':'GET',headers:{...(auth?{Authorization:'Bearer '+key}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.message||'Request failed');return data;
}
function choosePost(id,title){let option=[...target.options].find(o=>o.value===id);if(!option){option=new Option(title||'New post',id);target.add(option);}target.value=id;load().catch(()=>{});}
function panel(id){if(work.hidden){say('Sign in or enter practice mode first.');return false;}for(const p of ['posts','media','accounts'])$('#'+p+'-panel').hidden=p!==id;return true;}
async function refreshPosts(){
 const rows=demo?[...demoRecords].filter(([id,r])=>id.startsWith('post-')&&(r.draft||r.published)).map(([id,r])=>({id,heading:(r.draft||r.published).heading,published:!!r.published})):(await service('site-content','post-index')).posts;
 const ul=$('#posts-list');ul.replaceChildren();for(const r of rows){const li=document.createElement('li'),b=document.createElement('button');b.type='button';b.textContent=(r.heading||'Untitled')+(r.published?' — published':' — draft');b.onclick=()=>choosePost(r.id,r.heading);li.append(b);ul.append(li);}
}
$('#posts-nav').onclick=()=>{if(panel('posts'))refreshPosts().catch(e=>say(e.message));};
$('#new-post').onclick=()=>choosePost('post-'+crypto.randomUUID(),'New post');
async function refreshMedia(){
 const rows=demo?[...demoMedia].map(([id,v])=>({id,name:v.name,alt:v.alt})):await service('cms-media','list');
 const ul=$('#media-list'),select=$('#media-select');ul.replaceChildren();select.replaceChildren(new Option('Choose media',''));
 for(const r of rows){select.add(new Option(r.name,r.id));const li=document.createElement('li'),use=document.createElement('button'),remove=document.createElement('button');use.type=remove.type='button';use.textContent=r.name;remove.textContent='Remove from library';remove.className='secondary';use.onclick=()=>selectMedia(r.id).catch(e=>say(e.message));remove.onclick=async()=>{if(!confirm('Remove this library copy?'))return;try{if(demo)demoMedia.delete(r.id);else await service('cms-media','remove',{id:r.id});await refreshMedia();}catch(e){say(e.message);}};li.append(use,' ',remove);ul.append(li);}
}
async function selectMedia(id){if(!id)return;const v=demo?demoMedia.get(id):await service('cms-media','get',undefined,true,'&id='+encodeURIComponent(id));photo=v.photo;form.elements.alt.value=v.alt;form.elements.photoUrl.value=photo.startsWith('https:')?photo:'';render();say('Photo selected. Save draft or publish to apply.');}
$('#media-nav').onclick=()=>{if(panel('media'))refreshMedia().catch(e=>say(e.message));};
$('#media-select').onchange=e=>selectMedia(e.target.value).catch(err=>say(err.message));
$('#library-save').onclick=async()=>{if(!photo||!form.elements.alt.value.trim()){say('Select an image and enter its description first.');return;}const name=prompt('Name this image in the media library',form.elements.alt.value);if(!name?.trim())return;const v={name:name.trim(),photo,alt:form.elements.alt.value.trim()};try{if(demo)demoMedia.set(crypto.randomUUID(),v);else await service('cms-media','add',v);await refreshMedia();say('Image saved in '+(demo?'practice':'website')+' media library.');}catch(e){say(e.message);}};
async function refreshAccounts(){const list=$('#accounts-list');list.replaceChildren();for(const u of await service('cms-accounts','list')){const li=document.createElement('li');li.textContent=u.username+(u.active?' — active':' — disabled');list.append(li);}}
$('#accounts-nav').onclick=()=>{if(!panel('accounts'))return;$('#owner-accounts').hidden=demo||!!accountUser;$('#password-form').hidden=demo||!accountUser;$('#account-info').textContent=demo?'Practice mode does not create actual accounts.':accountUser?'Signed in as '+accountUser+'. Changing your password ends existing sessions.':'Owner recovery access: create and revoke individual editor accounts. Share generated credentials privately.';if(!demo&&!accountUser)refreshAccounts().catch(e=>say(e.message));};
$('#account-form').onsubmit=async e=>{e.preventDefault();const a=e.submitter.value;if(a!=='create'&&!confirm('This invalidates existing sessions. Continue?'))return;try{const r=await service('cms-accounts',a,{username:e.target.elements.username.value});$('#account-result').textContent=r.password?'Username: '+r.username+' | Temporary password: '+r.password:'Account disabled.';await refreshAccounts();}catch(err){say(err.message);}};
$('#password-form').onsubmit=async e=>{e.preventDefault();try{await service('cms-accounts','password',Object.fromEntries(new FormData(e.target)));key='';location.reload();}catch(err){say(err.message);}};

document.addEventListener('DOMContentLoaded',async()=>{
 const q=document.getElementById('business-search'),cat=document.getElementById('business-category'),sort=document.getElementById('business-sort'),out=document.getElementById('business-results'),empty=document.getElementById('directory-empty'),count=document.getElementById('directory-count');
 let records=[];let loadError=false;
 const safeUrl=(value)=>{try{const u=new URL(value);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}};
 const addText=(parent,tag,text,cls)=>{if(!text)return;const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;parent.append(el);return el;};
 const addLink=(parent,label,url)=>{const href=safeUrl(url);if(!href)return;const a=document.createElement('a');a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;parent.append(a);};
 try{const response=await fetch('businesses.json',{cache:'no-store'});if(!response.ok)throw Error('Unable to load directory');const data=await response.json();records=(Array.isArray(data.businesses)?data.businesses:[]).filter(x=>x&&x.approved===true&&typeof x.name==='string'&&x.name.trim());}
 catch(e){loadError=true;empty.textContent='The directory could not be loaded. Please refresh or try again later.';}
 for(const c of [...new Set(records.map(x=>x.category).filter(Boolean))].sort()){const o=document.createElement('option');o.value=c;o.textContent=c;cat.append(o);}
 function render(){
  const term=q.value.trim().toLocaleLowerCase(),category=cat.value;
  const shown=records.filter(x=>(!category||x.category===category)&&[x.name,x.category,x.description,x.location].join(' ').toLocaleLowerCase().includes(term)).sort((a,b)=>sort.value==='za'?b.name.localeCompare(a.name):a.name.localeCompare(b.name));
  out.replaceChildren();
  for(const x of shown){const item=document.createElement('article');item.className='listing';
   addText(item,'h3',x.name);addText(item,'small',x.category);addText(item,'p',x.description);addText(item,'p',x.location,'muted');
   if(x.website)addLink(item,'Visit website ↗',x.website);
   if(x.phone&&/^\+?[0-9() .-]{6,25}$/.test(x.phone)){const a=document.createElement('a');a.href='tel:'+x.phone.replace(/[^+0-9]/g,'');a.textContent='Call '+x.phone;item.append(a);}
   out.append(item);
  }
  count.textContent=loadError?'Directory unavailable':shown.length+' business listing'+(shown.length===1?'':'s');
  empty.hidden=shown.length>0;
  if(!loadError)empty.textContent=records.length?(term||category?'No matching businesses found. Try another search or category.':'No approved businesses are available yet.'):'Business listings are being verified before publication.';
 }
 for(const control of [q,cat,sort])control.addEventListener('input',render);
 render();
});
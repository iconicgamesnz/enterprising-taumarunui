document.addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('.site-nav-toggle'),n=document.getElementById('site-links');if(b&&n){b.addEventListener('click',()=>{const open=n.classList.toggle('open');b.setAttribute('aria-expanded',String(open));b.textContent=open?'Close ×':'Menu ☰';});}});
async function applyContactAndFees() {
  const result=await fetch('/.netlify/functions/committee?action=settings');
  if(!result.ok)return;
  const {email,individual,business}=await result.json();
  for(const link of document.querySelectorAll('a[href^="mailto:info@taumarunui.co.nz"]')){
    if(link.textContent==='info@taumarunui.co.nz')link.textContent=email;
    link.href='mailto:'+email+(link.search||'');
  }
  for(const [type,amount] of Object.entries({individual,business})){
    const el=document.querySelector('[data-fee="'+type+'"]');if(el)el.textContent='$'+amount;
  }
}
applyContactAndFees().catch(()=>{});

// Apply only published, server-validated content; never inject HTML.
async function applyPublishedContent(){
 const page=(location.pathname.split('/').pop()||'index.html').replace(/\.html$/,'');
 if(!['index','about','membership','contact','directory','events','privacy'].includes(page))return;
 const get=async id=>{const r=await fetch('/.netlify/functions/site-content?action=public&id='+id,{cache:'no-store'});return r.ok?(await r.json()).published:null;};
 const [v,a]=await Promise.all([get(page),get('appearance')]);
 if(a){
  if(a.theme==='green'){document.documentElement.style.setProperty('--navy','#203e32');document.documentElement.style.setProperty('--blue','#345a48');document.querySelectorAll('.hero').forEach(el=>el.style.background='linear-gradient(120deg,#203e32,#345a48)');}
  if(a.theme==='navy'){document.documentElement.style.setProperty('--navy','#091a2d');document.documentElement.style.setProperty('--blue','#17324e');document.querySelectorAll('.hero').forEach(el=>el.style.background='linear-gradient(120deg,#091a2d,#17324e)');}
  if(a.font==='system'||a.font==='serif'){const f=a.font==='serif'?'Georgia,serif':'system-ui,sans-serif';document.body.style.fontFamily=f;document.querySelectorAll('h1,h2,h3').forEach(el=>el.style.fontFamily=f);}
 }
 if(!v)return;
 const main=document.querySelector('main');if(!main)return;
 const title=main.querySelector('h1'),intro=main.querySelector('.hero .wrap p:not(.eyebrow)')||main.querySelector('p:not(.eyebrow)');
 if(v.heading&&title)title.textContent=v.heading;if(v.intro&&intro)intro.textContent=v.intro;
 for(const item of v.sections||[]){if(!/^e[1-9][0-9]{0,3}$/.test(item.key))continue;const node=main.querySelector('[data-edit-key="'+item.key+'"]');if(!node)continue;if(item.type==='text'&&node.tagName!=='IMG')node.textContent=item.text;else if(item.type==='image'&&node.tagName==='IMG'){node.src=item.src;node.alt=item.alt;}}
 if(v.seoTitle)document.title=v.seoTitle;const meta=document.querySelector('meta[name=description]');if(v.description&&meta)meta.content=v.description;
 if(v.body){const section=document.createElement('section');section.className='section';const wrap=document.createElement('div');wrap.className='wrap';const body=document.createElement('p');body.style.whiteSpace='pre-wrap';body.textContent=v.body;wrap.append(body);section.append(wrap);main.append(section);}
 if(v.photo){const existing=main.querySelector('.hero img');const image=existing||document.createElement('img');image.src=v.photo;image.alt=v.alt||'';image.loading='lazy';image.style.cssText='display:block;max-width:100%;max-height:440px;object-fit:contain;border-radius:6px;margin:24px 0';const wrap=main.querySelector('.hero .wrap')||main;if(!existing)wrap.append(image);}
}
applyPublishedContent().catch(()=>{});

if(!['admin.html','editor.html','workspace.html','calendar-review.html'].includes(location.pathname.split('/').pop())){const s=document.createElement('script');s.src='/workspace-public.js';document.head.append(s);}

const form=document.querySelector('#legacy-search'), params=new URLSearchParams(location.search);
const path=(params.get('event')||'').replace(/^\/+|\/+$/g,'').replace(/^event\//,'');
const at=params.get('at')||'';
let rows=[],matches=[],offset=0,details={};
const target=document.querySelector('#legacy-results');
const localDate=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Pacific/Auckland'}).format(new Date());
form.elements.term.value=params.get('series')?.replaceAll('-',' ').replace(/\/$/,'')||'';
form.elements.date.value=path?'':localDate();
function el(tag, value){const node=document.createElement(tag);if(value!==undefined)node.textContent=value;return node;}
function safeUrl(value){try{const u=new URL(value);return u.protocol==='https:'?u.href:null;}catch{return null;}}
function slugKey(slug){return String(slug||'').replace(/^\/+|\/+$/g,'').replace(/^event\//,'');}
function sourceLink(slug){return 'https://taumarunui.co.nz/event/'+slugKey(slug).split('/').filter(Boolean).map(encodeURIComponent).join('/')+'/';}
function detailLink(slug,start){const p=new URLSearchParams({event:slugKey(slug),at:start});return '/legacy-events.html?'+p;}
function displayDate(start,end,allDay){return allDay?start.slice(0,10)+' · All day':start.replace('T',' ')+' – '+end.replace('T',' ');}
function render(){
  for(const [name,start,end,venue,slug,allDay] of matches.slice(offset,offset+25)){
    const card=el('article');card.className='tile';card.style.marginBottom='1rem';
    const h=el('h2'),link=el('a',name);link.href=detailLink(slug,start);h.append(link);
    const p=el('p',displayDate(start,end,allDay)+(venue?' · '+venue:''));
    const meta=details[slugKey(slug)+'|'+start]||{};
    const image=safeUrl(meta.image);
    if(image){const img=el('img');img.src=image;img.alt=meta.imageAlt||name;img.loading='lazy';img.style.cssText='max-width:100%;max-height:320px;object-fit:contain;display:block;margin-bottom:1rem';card.append(img);}
    card.append(h,p);
    if(meta.description){const desc=el('p',meta.description);desc.style.whiteSpace='pre-wrap';if(!path||!at){desc.textContent=meta.description.length>240?meta.description.slice(0,240)+'…':meta.description;}card.append(desc);}
    if(path&&at&&!meta.description)card.append(el('p','Full details and poster have not yet been migrated. Check the original listing for more information.'));
    const source=el('a','View original event listing');source.href=safeUrl(meta.url)||sourceLink(slug);source.rel='noopener';card.append(source);
    target.append(card);
  }
  offset+=25;document.querySelector('#more').hidden=offset>=matches.length;
}
function find(initial=false){
  const term=form.elements.term.value.toLowerCase(),from=form.elements.date.value;
  matches=rows.filter(([name,start,,,slug])=>initial&&path?(slugKey(slug)===path||slugKey(slug).startsWith(path+'/'))&&(!at||start===at):name.toLowerCase().includes(term)&&start>=from);
  document.querySelector('#legacy-status').textContent=matches.length+' matching events';
  target.replaceChildren();offset=0;
  if(initial&&path&&at&&matches.length===1){document.title=matches[0][0]+' | Enterprising Taumarunui';document.querySelector('h1').textContent=matches[0][0];const back=el('a','Back to all events');back.href='/legacy-events.html';target.append(back);form.hidden=true;}
  render();
}
document.querySelector('#more').onclick=render;
form.onsubmit=e=>{e.preventDefault();find();};
Promise.all([fetch('/legacy-events.json').then(r=>{if(!r.ok)throw Error();return r.json();}),fetch('/event-details.json').then(r=>r.ok?r.json():{}).catch(()=>({}))]).then(([data,metadata])=>{rows=data;details=metadata;find(true);}).catch(()=>document.querySelector('#legacy-status').textContent='Could not load events. Please try again.');

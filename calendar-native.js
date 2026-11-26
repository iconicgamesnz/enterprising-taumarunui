import {christmasParade,isChristmasParade2026} from './featured-events.js';
const form=document.querySelector('#calendar-filter'),target=document.querySelector('#calendar-results'),status=document.querySelector('#calendar-status'),more=document.querySelector('#calendar-more');
const params=new URLSearchParams(location.search);
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Pacific/Auckland'}).format(new Date());
form.elements.date.value=today;
let rows=[],offset=0,shown=[],warnings=[];
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const safe=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
const slugKey=s=>String(s||'').replace(/^\/+|\/+$/g,'').replace(/^event\//,'');
const day=s=>String(s||'').slice(0,10);
const dateText=s=>String(s||'').replace('T',' ');
const key=e=>e.title.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase()+'|'+dateText(e.start).slice(0,16);
function card(e,full=false){
 const node=el('article');node.className='tile';node.style.marginBottom='1rem';
 const img=safe(e.image);if(img){const n=el('img');n.src=img;n.alt=e.imageAlt||e.title;n.loading='lazy';n.style.cssText='width:100%;max-height:360px;object-fit:contain';node.append(n);}
 const h=el(full?'h1':'h3');const a=el('a',e.title);a.href=e.href;h.append(a);node.append(h,el('p',e.allDay?day(e.start)+' · All day':dateText(e.start)+' – '+dateText(e.end)));
 if(e.location)node.append(el('p',e.location));
 if(e.description){const p=el('p',full?e.description:e.description.slice(0,180)+(e.description.length>180?'…':''));p.style.whiteSpace='pre-wrap';node.append(p);}
 if(full){for(const [label,url] of [['Registration or information',e.registration],['Original listing',e.source]]){const v=safe(url);if(v){const a=el('a',label);a.href=v;a.rel='noopener';node.append(a,el('p',''));}}}
 if(e.snapshot)node.append(el('small','Existing calendar snapshot — confirm with organiser.'));
 return node;
}
function renderMore(){for(const e of shown.slice(offset,offset+30))target.append(card(e));offset+=30;more.hidden=offset>=shown.length;}
function render(){
 const date=form.elements.date.value||today,view=form.elements.view.value,q=form.elements.search.value.toLowerCase().trim();
 const filtered=rows.filter(e=>(e.title+' '+e.location+' '+(e.description||'')).toLowerCase().includes(q));
 target.replaceChildren();more.hidden=true;offset=0;target.style.display='block';
 if(view==='month'){
   const [y,m]=date.split('-').map(Number),days=new Date(Date.UTC(y,m,0)).getUTCDate();
   const first=new Date(Date.UTC(y,m-1,1)),pad=(first.getUTCDay()+6)%7;
   const grid=el('div');grid.style.cssText='display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px';
   for(const name of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])grid.append(el('strong',name));
   for(let i=0;i<pad;i++)grid.append(el('div'));
   for(let d=1;d<=days;d++){const dt=y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');const events=filtered.filter(e=>day(e.start)<=dt&&day(e.end||e.start)>=dt);const b=el('button',d+' · '+events.length);b.type='button';b.setAttribute('aria-label',dt+', '+events.length+' events');b.style.cssText='min-height:48px;padding:3px;font-size:12px;overflow-wrap:anywhere';b.onclick=()=>{form.elements.date.value=dt;form.elements.view.value='day';render();};grid.append(b);}
   target.append(grid);shown=filtered.filter(e=>day(e.start).startsWith(date.slice(0,7)));status.textContent=shown.length+' occurrences starting this month. Choose a day. '+warnings.join(' ');return;
 }
 shown=filtered.filter(e=>view==='day'?day(e.start)<=date&&day(e.end||e.start)>=date:day(e.end||e.start)>=date);
 if(view==='photo')target.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px';
 else target.style.cssText='display:block';
 status.textContent=shown.length+' matching events. '+warnings.join(' ');renderMore();
}
form.onsubmit=e=>{e.preventDefault();render();};more.onclick=renderMore;
const read=async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw Error('Unavailable');return r.json();};
Promise.allSettled([read('/legacy-events.json'),read('/event-details.json'),read('/.netlify/functions/community-events?action=published')]).then(results=>{
 const archived=results[0].status==='fulfilled'?results[0].value:[];const details=results[1].status==='fulfilled'?results[1].value:{};const current=results[2].status==='fulfilled'?results[2].value.items:[];
 if(results[0].status!=='fulfilled')warnings.push('Existing calendar snapshot unavailable.');
 if(results[2].status!=='fulfilled')warnings.push('New event feed temporarily unavailable.');
 const map=new Map();
 for(const [title,start,end,location,slug,allDay] of archived){const k=slugKey(slug),meta=details[k+'|'+start]||{};const e={title,start,end,location,allDay,...meta,snapshot:true,href:'/legacy-events.html?'+new URLSearchParams({event:k,at:start})};map.set(key(e),e);}
 for(const e of current){e.href='/events.html?'+new URLSearchParams({id:e.id});map.set(key(e),e);}
 // Merge the confirmed one-off event, rather than appending a duplicate.
 const matches=[...map.entries()].filter(([,e])=>isChristmasParade2026(e));
 const approved=matches.find(([,e])=>!e.snapshot);
 for(const [k] of matches)map.delete(k);
 const parade={...christmasParade,...(approved?approved[1]:{}),id:christmasParade.id,href:christmasParade.href};
 map.set(key(parade),parade);
 rows=[...map.values()].sort((a,b)=>a.start.localeCompare(b.start));
 const id=params.get('id');if(id){const e=rows.find(x=>x.id===id);form.hidden=true;status.textContent=warnings.join(' ');if(e){const back=el('a','Back to calendar');back.href='/events.html';target.append(back,card(e,true));document.title=e.title+' | Enterprising Taumarunui';}else target.append(el('p','This event is unavailable or cancelled.'));return;}
 render();
});

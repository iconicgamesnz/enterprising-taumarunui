import {christmasParade,isChristmasParade2026} from './featured-events.js';
const form=document.querySelector('#calendar-filter'),target=document.querySelector('#calendar-results'),status=document.querySelector('#calendar-status'),more=document.querySelector('#calendar-more');
const params=new URLSearchParams(location.search);
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Pacific/Auckland'}).format(new Date());
form.elements.date.value=today;
let rows=[],offset=0,shown=[],warnings=[],filterMonth='';
const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
const safe=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}};
const slugKey=s=>String(s||'').replace(/^\/+|\/+$/g,'').replace(/^event\//,'');
const day=s=>String(s||'').slice(0,10);
const dateText=s=>String(s||'').replace('T',' ');
const key=e=>e.title.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase()+'|'+dateText(e.start).slice(0,16);
function card(e,full=false){
 const node=el('article');node.className='ec-card';
 const img=safe(e.image);if(img){const n=el('img');n.src=img;n.alt=e.imageAlt||e.title;n.loading='lazy';n.addEventListener('error',()=>n.remove(),{once:true});n.style.cssText='width:100%;max-height:360px;object-fit:contain';node.append(n);}
 const h=el(full?'h1':'h3');const a=el('a',e.title);a.href=e.href;h.append(a);node.append(h,el('p',e.allDay?day(e.start)+' · All day':dateText(e.start)+' – '+dateText(e.end)));
 if(e.location)node.append(el('p',e.location));
 if(e.description){const p=el('p',full?e.description:e.description.slice(0,180)+(e.description.length>180?'…':''));p.style.whiteSpace='pre-wrap';node.append(p);}
 if(full){for(const [label,url] of [['Registration or information',e.registration],['Original listing',e.source]]){const v=safe(url);if(v){const a=el('a',label);a.href=v;a.rel='noopener';node.append(a,el('p',''));}}}
 if(e.snapshot)node.append(el('small','Existing calendar snapshot — confirm with organiser.'));
 return node;
}
const utc=d=>new Date(d+'T12:00:00Z'), iso=d=>d.toISOString().slice(0,10);
function shift(d,n){const v=utc(d);v.setUTCDate(v.getUTCDate()+n);return iso(v);}
function monthStart(d,n=0){const v=utc(d);v.setUTCDate(1);v.setUTCMonth(v.getUTCMonth()+n);return iso(v);}
const monday=d=>(utc(d).getUTCDay()+6)%7;
const fmt=(d,o)=>new Intl.DateTimeFormat('en-NZ',{timeZone:'UTC',...o}).format(utc(d));
const long=d=>fmt(d,{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const names=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const cats=[['Markets',/\bmarkets?\b/i],['Family',/\b(toy library|christmas parade|school holidays|kids|children|playgroup|family)\b/i],['Arts & Culture',/\b(art|arts|choir|quiltmakers|craft|exhibition|concert|theatre|photography)\b/i],['Workshops',/\bworkshops?\b/i],['Business Hui',/\bbusiness hui\b/i],['Networking',/\bnetworking\b/i],['Business & Learning',/\b(business|networking|enterprise|training)\b/i],['Sport',/\b(sport|rugby|football|basketball|golf|tennis|bowls|netball|cricket)\b/i],['Wellness',/\b(wellness|yoga|pilates|fitness|health)\b/i]];
function tags(e){const set=new Set(Array.isArray(e.tags)?e.tags:[]);for(const [label,re] of cats)if(re.test(e.title))set.add(label);if(!set.size)set.add('Community');return set;}
function onDay(items,d){return items.filter(e=>{const start=day(e.start),end=day(e.end||e.start);const midnight=!e.allDay&&end>start&&/T00:00(?::00)?$/.test(String(e.end).replace(' ','T'));return start<=d&&(midnight?d<end:d<=end);});}
function selectDay(d){form.elements.date.value=d;form.elements.month.value=d.slice(0,7);form.elements.view.value='day';render(true);}
function cell(d,text,count){const b=el('button',text);b.type='button';b.className='ec-cell'+(d===today?' ec-today':'');b.setAttribute('aria-label',long(d)+', '+count+' events');if(d===today)b.setAttribute('aria-current','date');if(count){const badge=el('span',String(count));badge.className='ec-count';b.append(badge);}b.onclick=()=>selectDay(d);return b;}
function grid(start,items){const g=el('div');g.className='ec-grid';for(const n of names){const s=el('span',n);s.className='ec-weekday';g.append(s);}let count=monday(start);for(let i=0;i<count;i++){const x=el('span');x.className='ec-blank';g.append(x);}for(let d=start;d<monthStart(start,1);d=shift(d,1)){g.append(cell(d,String(utc(d).getUTCDate()),onDay(items,d).length));count++;}while(count%7){const x=el('span');x.className='ec-blank';g.append(x);count++;}return g;}
function list(items){const wrap=el('div');wrap.className='ec-list';if(!items.length){wrap.append(el('p','No events are listed.'));return wrap;}for(const e of items){const a=el('a');a.href=e.href;a.className='ec-row';const date=el('time');date.className='ec-date';date.dateTime=day(e.start);date.append(el('b',String(utc(day(e.start)).getUTCDate())),fmt(day(e.start),{month:'short'}).toUpperCase());const desc=el('span');const meta=el('span',(e.allDay?'All day':String(e.start).slice(11,16))+(e.location?' · '+e.location:''));meta.className='ec-meta';desc.append(el('strong',e.title),meta);a.append(date,desc);wrap.append(a);}return wrap;}
function renderMore(){const part=shown.slice(offset,offset+30);if(form.elements.view.value==='photo'||form.elements.view.value==='day'){for(const e of part)target.append(card(e));}else target.append(list(part));offset+=30;more.hidden=offset>=shown.length;}
const period=document.querySelector('#cal-period');
const tabs=[...document.querySelectorAll('#cal-tabs [data-view]')];
for(const b of tabs)b.onclick=()=>{form.elements.view.value=b.dataset.view;filterMonth='';render(true);};
function move(n){const d=form.elements.date.value||today,v=form.elements.view.value;form.elements.date.value=v==='year'?monthStart(d,n*12):v==='month'?monthStart(d,n):shift(d,n*(v==='week'?7:1));render(true);}
document.querySelector('#cal-prev').onclick=()=>move(-1);
document.querySelector('#cal-next').onclick=()=>move(1);
document.querySelector('#cal-today').onclick=()=>{form.elements.date.value=today;render(true);};
function render(focus=false){
 const date=form.elements.date.value||today,view=form.elements.view.value,q=norm(form.elements.search.value),category=form.elements.category.value;
 const listing=view==='list'||view==='photo';
 form.elements.month.value=listing?filterMonth:date.slice(0,7);
 document.querySelector('#cal-month-label').textContent=listing?'Filter upcoming events by month':'Jump to month';
 for(const b of tabs)b.setAttribute('aria-pressed',String(b.dataset.view===view));
 const filtered=rows.filter(e=>(!q||norm(e.title+' '+(e.location||'')+' '+(e.description||'')).includes(q))&&(!category||tags(e).has(category)));
 target.replaceChildren();target.className='';more.hidden=true;offset=0;
 const week=shift(date,-monday(date));
 period.textContent=view==='year'?date.slice(0,4):view==='month'?fmt(date,{month:'long',year:'numeric'}):view==='week'?'Week of '+long(week):view==='day'?long(date):filterMonth?fmt(filterMonth+'-01',{month:'long',year:'numeric'}):'Upcoming events';
 document.querySelector('#cal-prev').hidden=listing;document.querySelector('#cal-next').hidden=listing;
 if(focus)period.focus();
 if(view==='month'||view==='year'||view==='week'){
  if(view==='month')target.append(grid(monthStart(date),filtered));
  if(view==='year'){const y=el('div');y.className='ec-year';for(let i=0;i<12;i++){const d=monthStart(date.slice(0,4)+'-01-01',i),s=el('section');s.append(el('h4',fmt(d,{month:'long'})),grid(d,filtered));y.append(s);}target.append(y);}
  if(view==='week'){const g=el('div');g.className='ec-grid';for(let i=0;i<7;i++){const d=shift(week,i);g.append(cell(d,names[i]+' '+utc(d).getUTCDate(),onDay(filtered,d).length));}target.append(g);for(let i=0;i<7;i++){const d=shift(week,i),events=onDay(filtered,d);if(events.length){const s=el('section');s.className='ec-section';s.append(el('h4',long(d)),list(events));target.append(s);}}}
  const now=onDay(filtered,today),next=filtered.filter(e=>day(e.start)>today).slice(0,3);const panel=el('section');panel.className='ec-section';panel.append(el('h3',now.length?'What’s on today':'Next up'),list(now.length?now:next));target.append(panel);status.textContent=warnings.join(' ');return;
 }
 shown=view==='day'?onDay(filtered,date):filtered.filter(e=>day(e.end||e.start)>=today&&(!filterMonth||(day(e.start)<monthStart(filterMonth+'-01',1)&&day(e.end||e.start)>=filterMonth+'-01')));
 if(view==='photo'||view==='day')target.className='ec-photos';
 status.textContent=shown.length+' matching events. '+warnings.join(' ');if(shown.length)renderMore();else target.append(el('p','No events are listed for this selection.'));
}
form.onsubmit=e=>{e.preventDefault();if(form.elements.search.value.trim()||form.elements.category.value){form.elements.view.value='list';filterMonth='';}render(true);};more.onclick=renderMore;
form.elements.category.onchange=()=>{if(form.elements.category.value)form.elements.view.value='list';render(true);};
form.elements.month.onchange=()=>{if(['list','photo'].includes(form.elements.view.value)){filterMonth=form.elements.month.value;render(true);}else if(form.elements.month.value){form.elements.date.value=form.elements.month.value+'-01';form.elements.view.value='month';render(true);}};
form.elements.view.onchange=()=>render(true);form.elements.date.onchange=()=>render(true);
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
 const id=params.get('id');if(id){const e=rows.find(x=>x.id===id);form.hidden=true;document.querySelector('#calendar-nav').hidden=true;document.querySelector('#cal-tabs').hidden=true;status.textContent=warnings.join(' ');if(e){const back=el('a','Back to calendar');back.href='/events.html';target.append(back,card(e,true));document.title=e.title+' | Enterprising Taumarunui';}else target.append(el('p','This event is unavailable or cancelled.'));return;}
 render();
});

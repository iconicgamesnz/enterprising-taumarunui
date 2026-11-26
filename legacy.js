const form=document.querySelector('#legacy-search'), params=new URLSearchParams(location.search);
const path=(params.get('event')||'').replace(/^\/+|\/+$/g,'');
let rows=[],matches=[],offset=0;
form.elements.term.value=params.get('series')?.replaceAll('-',' ').replace(/\/$/,'')||'';
form.elements.date.value=path?'':new Intl.DateTimeFormat('sv-SE',{timeZone:'Pacific/Auckland'}).format(new Date());
function render(){
  const target=document.querySelector('#legacy-results');
  for(const [name,start,end,venue,,allDay] of matches.slice(offset,offset+25)){
    const card=document.createElement('article'),h=document.createElement('h2'),p=document.createElement('p');
    h.textContent=name;p.textContent=(allDay?start.slice(0,10)+' · All day':start+' to '+end)+(venue?' · '+venue:'');
    card.append(h,p);target.append(card);
  }
  offset+=25;document.querySelector('#more').hidden=offset>=matches.length;
}
function find(initial=false){
  const term=form.elements.term.value.toLowerCase();
  matches=rows.filter(([name,start,,,slug])=>initial&&path?(slug===path||slug.startsWith(path+'/')):name.toLowerCase().includes(term)&&start>=form.elements.date.value);
  document.querySelector('#legacy-status').textContent=matches.length+' matching events';
  document.querySelector('#legacy-results').replaceChildren();offset=0;render();
}
document.querySelector('#more').onclick=render;
form.onsubmit=e=>{e.preventDefault();find();};
fetch('/legacy-events.json').then(r=>r.json()).then(data=>{rows=data;find(true);}).catch(()=>document.querySelector('#legacy-status').textContent='Could not load events. Please try again.');

// Calendar-day arithmetic, preserving local wall time across NZ daylight saving.
const dayMs=86400000;
function stamp(s){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Invalid date');const d=new Date(s+'T00:00:00Z');if(!Number.isFinite(+d)||d.toISOString().slice(0,10)!==s)throw Error('Invalid date');return +d;}
const dayString=n=>new Date(n).toISOString().slice(0,10);
export function recurrence(body,start,end){
 const repeat=body.repeat||'none';
 if(!['none','daily','weekly','fortnightly','monthly'].includes(repeat))throw Error('Invalid repeat pattern');
 if(repeat==='none')return {repeat,repeatUntil:'',exceptions:''};
 const first=stamp(start.slice(0,10)),last=stamp(body.repeatUntil||'');
 if(last<first||last-first>366*2*dayMs)throw Error('Repeat end must be within two years of start.');
 const exceptions=String(body.exceptions||'').split(/[\s,]+/).filter(Boolean);
 for(const date of exceptions){const d=stamp(date);if(d<first||d>last)throw Error('Excluded date is outside the series.');}
 return {repeat,repeatUntil:dayString(last),exceptions:[...new Set(exceptions)].sort().join(',')};
}
export function occurrences(event){
 const rule=recurrence(event,event.start,event.end),first=stamp(event.start.slice(0,10)),end=stamp(event.end.slice(0,10)),length=end-first;
 const excluded=new Set(rule.exceptions.split(','));
 if(rule.repeat==='none')return [{...event,occurrence:event.start.slice(0,10)}];
 const last=stamp(rule.repeatUntil),result=[],base=new Date(first);
 for(let i=0;i<=732;i++){
  let next;
  if(rule.repeat==='monthly'){const d=new Date(Date.UTC(base.getUTCFullYear(),base.getUTCMonth()+i,base.getUTCDate()));if(d.getUTCDate()!==base.getUTCDate())continue;next=+d;}
  else next=first+i*dayMs*({daily:1,weekly:7,fortnightly:14}[rule.repeat]);
  if(next>last)break;
  const date=dayString(next);if(excluded.has(date))continue;
  result.push({...event,start:date+event.start.slice(10),end:dayString(next+length)+event.end.slice(10),occurrence:date});
 }
 return result;
}

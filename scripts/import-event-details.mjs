// Read-only migration from the public WordPress events API. No calendar or email writes.
// Run: node scripts/import-event-details.mjs
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
const site='https://taumarunui.co.nz';
const from=process.argv[2]||'2026-11-26',to=process.argv[3]||'2028-11-26';
const rows=JSON.parse(gunzipSync(await readFile('reports/legacy-events.json.gz')));
const cleanSlug=v=>String(v||'').replace(/^\/+|\/+$/g,'').replace(/^event\//,'');
const normalize=v=>String(v||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();
const decode=v=>String(v||'').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const c=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return c>=0&&c<=0x10ffff?String.fromCodePoint(c):'';}).replace(/&(amp|lt|gt|quot|apos|nbsp|ndash|mdash|rsquo|lsquo|hellip);/g,(_,k)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',rsquo:'’',lsquo:'‘',hellip:'…'}[k]));
const plain=v=>decode(String(v||'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<\/?(?:p|br|li|div|h[1-6])\b[^>]*>/gi,'\n').replace(/<[^>]*>/g,'')).replace(/\n[ \t]*\n+/g,'\n\n').trim();
const key=(name,start)=>normalize(plain(name))+'|'+String(start||'').replace('T',' ').slice(0,16);
const validUrl=v=>{try{const u=new URL(v);return u.protocol==='https:'?u.href:'';}catch{return '';}};
const all=[];let page=1,total=null;
while(true){
  const url=new URL('/wp-json/tribe/events/v1/events',site);
  for(const [k,v] of Object.entries({start_date:from+' 00:00:00',end_date:to+' 23:59:59',per_page:50,page}))url.searchParams.set(k,String(v));
  const response=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error('WordPress API returned '+response.status+' on page '+page+'; no output written.');
  const data=await response.json();
  if(!Array.isArray(data.events)||!Number.isInteger(Number(data.total_pages)))throw Error('Unexpected WordPress API response');
  if(total===null)total=Number(data.total);
  all.push(...data.events);
  if(page>=Number(data.total_pages))break;
  if(++page>500)throw Error('Pagination safety limit');
}
if(Number.isFinite(total)&&all.length!==total)throw Error('Incomplete export; expected '+total+' got '+all.length);
const byKey=new Map(),bySlug=new Map();
for(const event of all){
 const url=validUrl(event.url);
 const slug=url?cleanSlug(new URL(url).pathname):cleanSlug(event.slug);
 const k=key(event.title,event.start_date);
 if(!byKey.has(k))byKey.set(k,[]);byKey.get(k).push(event);
 if(slug){if(!bySlug.has(slug))bySlug.set(slug,[]);bySlug.get(slug).push(event);}
}
const catalog={},report=[];
for(const [name,start,end,venue,rawSlug,allDay] of rows){
 const slug=cleanSlug(rawSlug),k=key(name,start);
 const candidates=(bySlug.get(slug)||[]).filter(e=>key(e.title,e.start_date)===k);
 const exact=candidates.length?candidates:(byKey.get(k)||[]);
 if(exact.length!==1){report.push({name,start,end,venue,slug,status:exact.length?'ambiguous':'missing'});continue;}
 const e=exact[0],description=plain(e.description),image=validUrl(e.image?.url||e.image?.sizes?.full?.url),url=validUrl(e.url);
 catalog[slug+'|'+start]={description,image,imageAlt:plain(e.image?.alt||name),url};
 report.push({name,start,end,venue,slug,status:'matched',hasDescription:!!description,hasImage:!!image,sourceUrl:url,sourceEnd:e.end_date,sourceVenue:e.venue?.venue||'',sourceAllDay:e.all_day});
}
const snapshotKeys=new Set(rows.map(r=>key(r[0],r[1])));
const newEvents=all.filter(e=>!snapshotKeys.has(key(e.title,e.start_date))).map(e=>({id:e.id,title:plain(e.title),start:e.start_date,end:e.end_date,url:validUrl(e.url)}));
await mkdir('reports',{recursive:true});
await writeFile('event-details.json',JSON.stringify(catalog));
await writeFile('reports/event-details-reconciliation.json',JSON.stringify({from,to,sourceCount:all.length,snapshotCount:rows.length,matched:report.filter(x=>x.status==='matched').length,missing:report.filter(x=>x.status==='missing').length,ambiguous:report.filter(x=>x.status==='ambiguous').length,missingDescriptions:report.filter(x=>x.status==='matched'&&!x.hasDescription).length,missingImages:report.filter(x=>x.status==='matched'&&!x.hasImage).length,newEvents,report},null,2));
console.log('Read '+all.length+' public occurrences. Review reports/event-details-reconciliation.json before deployment. No events published.');

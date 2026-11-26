import { storeName } from '../event-store.mjs';
import { getStore } from '@netlify/blobs';
import { reviewer as requireReviewer } from '../access.mjs';
import { JWT } from 'google-auth-library';
import { DateTime } from 'luxon';
import { recurrence, occurrences } from '../recurrence.mjs';

const calendarId = () => process.env.ETI_CALENDAR_ID || 'enterprisingtaumarunui@gmail.com';
const error = (status, message) => Object.assign(new Error(message), {status});
function reply(data, status = 200) {
  return Response.json(data, {status, headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
function field(body, key, max) {
  const value = body?.[key];
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw error(400, 'Please check the ' + key + ' field.');
  return value.trim();
}
function eventFields(body) {
  const data = {};
  for (const [key, max] of Object.entries({title:140, location:240, description:2000, start:16, end:16})) data[key] = field(body,key,max);
  for (const key of ['start','end']) {
    const time = DateTime.fromISO(data[key], {zone:'Pacific/Auckland'});
    if (!time.isValid || time.toFormat("yyyy-MM-dd'T'HH:mm") !== data[key] || time.getPossibleOffsets().length !== 1) throw error(400,'Choose a valid, unambiguous New Zealand local time.');
  }
  if (data.end <= data.start) throw error(400,'The event must end after it starts.');
  for (const key of ['image','registration']) {
    const value=body?.[key];
    if (!value) {data[key]='';continue;}
    if(typeof value!=='string'||value.length>1500)throw error(400,'Check '+key+' URL.');
    let u;try{u=new URL(value);}catch{throw error(400,'Check '+key+' URL.');}
    if(u.protocol!=='https:'||u.username||u.password)throw error(400,'Use a public HTTPS URL.');
    data[key]=u.href;
  }
  try { Object.assign(data,recurrence(body,data.start,data.end)); } catch(e) { throw error(400,e.message); }
  for(const occurrence of occurrences(data))for(const value of [occurrence.start,occurrence.end]){const t=DateTime.fromISO(value,{zone:'Pacific/Auckland'});if(!t.isValid||t.toFormat("yyyy-MM-dd'T'HH:mm")!==value||t.getPossibleOffsets().length!==1)throw error(400,'Exclude the daylight-saving transition date or choose an unambiguous local time.');}
  return data;
}
const read = (store,key) => store.get(key,{type:'json'});
function calendarClient() {
  if (!process.env.ETI_CALENDAR_ID || !process.env.ETI_GOOGLE_SERVICE_ACCOUNT) throw error(503,'Google Calendar needs connecting. The event is still in the queue.');
  const {client_email, private_key} = JSON.parse(process.env.ETI_GOOGLE_SERVICE_ACCOUNT);
  return new JWT({email:client_email,key:private_key,scopes:['https://www.googleapis.com/auth/calendar.events']});
}
async function publish(client, id, event) {
  const url = 'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(calendarId()) + '/events';
  const googleId = 'e' + id.replaceAll('-','');
  const when = dateTime => ({dateTime:DateTime.fromISO(dateTime,{zone:'Pacific/Auckland'}).toISO(),timeZone:'Pacific/Auckland'});
  const data = {id:googleId,summary:event.title,location:event.location,description:event.description,start:when(event.start),end:when(event.end),extendedProperties:{private:{etiSubmission:id}}};
  try {
    await client.request({url,method:'POST',data});
  } catch (cause) {
    if (cause.response?.status === 409) {
      const existing = await client.request({url:url + '/' + googleId});
      if (existing.data.status !== 'cancelled' && existing.data.extendedProperties?.private?.etiSubmission === id) return;
    }
    throw error(502,'Google Calendar could not confirm publication. Retry the saved approval after checking calendar access.');
  }
}

export async function handle(request, store, getClient = calendarClient) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'submit';
  if (action === 'calendar' && request.method === 'GET') return reply({id:calendarId()});
  if (['published','ical'].includes(action) && request.method === 'GET') {
    const {blobs}=await store.list({prefix:'public-events/'});
    const items=[];
    for(const {key} of blobs){
      const entry=await read(store,key);
      if(!entry || entry.status!=='published')continue;
      for(const instance of occurrences(entry.event)){
        const {title,location,start,end,description,image='',registration='',occurrence}=instance;
        items.push({id:key.slice('public-events/'.length)+'-'+occurrence,title,location,start,end,description,image,registration});
      }
    }
    items.sort((a,b)=>a.start.localeCompare(b.start));
    if(action==='ical'){
      const esc=v=>String(v||'').replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
      const utc=v=>DateTime.fromISO(v,{zone:'Pacific/Auckland'}).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
      const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Iconic Mahi//ETI Local Events//EN','CALSCALE:GREGORIAN','X-WR-CALNAME:ETI Local Events'];
      const dt=DateTime.utc().toFormat("yyyyMMdd'T'HHmmss'Z'");
      for(const e of items){
        lines.push('BEGIN:VEVENT','UID:'+e.id+'@taumarunui.co.nz','DTSTAMP:'+dt,'DTSTART:'+utc(e.start),'DTEND:'+utc(e.end),'SUMMARY:'+esc(e.title),'LOCATION:'+esc(e.location),'DESCRIPTION:'+esc(e.description));
        if(e.registration)lines.push('URL:'+e.registration);
        lines.push('END:VEVENT');
      }
      lines.push('END:VCALENDAR');
      const encoder=new TextEncoder();
      const folded=lines.map(line=>{let out='',size=0;for(const ch of line){const n=encoder.encode(ch).length;if(size+n>75){out+='\r\n ';size=1;}out+=ch;size+=n;}return out;}).join('\r\n')+'\r\n';
      return new Response(folded,{headers:{'Content-Type':'text/calendar; charset=utf-8','Cache-Control':'public, max-age=300','X-Content-Type-Options':'nosniff'}});
    }
    return reply({items});
  }
  if (action !== 'submit') await requireReviewer(request,store);
  if(action==='manage' && request.method==='GET'){
    const {blobs}=await store.list({prefix:'public-events/'});
    const items=[];
    for(const {key} of blobs){const entry=await read(store,key);if(entry)items.push({id:key.slice('public-events/'.length),...entry});}
    return reply({items});
  }
  if (action === 'queue' && request.method === 'GET') {
    const {blobs} = await store.list({prefix:'submissions/'});
    const items = [];
    for (const {key} of blobs) {
      const id = key.split('/')[1];
      if (await store.get('done/' + id)) continue;
      const decision = await read(store,'decisions/' + id);
      if (decision?.action === 'decline') continue;
      const submission = await read(store,key);
      const draft=await read(store,'drafts/'+id);
      items.push({...submission,...draft?.event,...decision?.event,id,version:draft?.version||'',locked:!!decision});
    }
    return reply({items:items.sort((a,b)=>a.created.localeCompare(b.created))});
  }
  if (request.method !== 'POST') throw error(405,'Use the event form.');
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw error(415,'JSON is required.');
  const raw = await request.text();
  if (raw.length > 10000) throw error(413,'Submission is too long.');
  let body;
  try { body = JSON.parse(raw); } catch { throw error(400,'Invalid submission.'); }
  const id = body?.id;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id)) throw error(400,'Invalid submission reference.');
  if (action === 'submit') {
    const event = eventFields(body);
    const email = field(body,'email',254);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw error(400,'Check the organiser email.');
    if (!body.website) await store.setJSON('submissions/' + id,{...event,email,created:new Date().toISOString()},{onlyIfNew:true});
    return reply({message:'Submitted for ETI review.'},202);
  }
  if(['create','edit','cancel'].includes(action)){
    const k='public-events/'+id;
    const prior=await store.getWithMetadata(k,{type:'json'});
    if(action==='create'&&prior)throw error(409,'Event already exists.');
    if(action!=='create'&&!prior)throw error(404,'Event unavailable.');
    if(prior && prior.data.version!==body.version)throw error(409,'Another reviewer changed this event. Refresh and try again.');
    const entry={event:action==='cancel'?prior.data.event:eventFields(body),status:action==='cancel'?'cancelled':'published',version:crypto.randomUUID()};
    const result=await store.setJSON(k,entry,prior?{onlyIfMatch:prior.etag}:{onlyIfNew:true});
    if(!result.modified)throw error(409,'Another reviewer changed this event. Refresh and try again.');
    return reply({message:action==='cancel'?'Removed from public calendar.':'Saved to public calendar.'});
  }
  if (!['draft','approve','decline'].includes(action)) throw error(404,'Unknown action.');
  if (!await store.get('submissions/' + id)) throw error(404,'Submission unavailable.');
  if (action === 'draft') {
    if (await store.get('decisions/'+id)) throw error(409,'This event already has a decision. Refresh the queue.');
    const previous=await store.getWithMetadata('drafts/'+id,{type:'json'});
    if ((previous?.data.version||'')!==(body.version||'')) throw error(409,'Another reviewer saved changes. Refresh the queue.');
    const entry={event:eventFields(body),version:crypto.randomUUID()};
    const result=await store.setJSON('drafts/'+id,entry,previous?{onlyIfMatch:previous.etag}:{onlyIfNew:true});
    if (!result.modified) throw error(409,'Another reviewer saved changes. Refresh the queue.');
    return reply({message:'Edits saved for review.'});
  }
  // Independent calendar is the publication destination. No outbound Google or email actions.
  const proposal = action === 'approve' ? {action,event:eventFields(body),calendar:calendarId()} : {action};
  await store.setJSON('decisions/' + id,proposal,{onlyIfNew:true});
  const decision = await read(store,'decisions/' + id);
  if (decision.action !== action) throw error(409,'Another reviewer already decided this event. Refresh the queue.');
  if (action === 'approve' && !await store.get('done/' + id)) {
    const saved=await store.setJSON('public-events/'+id,{event:decision.event,status:'published',version:crypto.randomUUID()},{onlyIfNew:true});
    if(!saved.modified && !await store.get('public-events/'+id))throw error(503,'Publication not confirmed. Retry approval.');
    await store.set('done/' + id,'published',{onlyIfNew:true});
  }
  return reply({message:action === 'approve' ? 'Published to the community calendar.' : 'Submission declined.'});
}
export default async function(request) {
  try { return await handle(request,getStore({name:storeName,consistency:'strong'})); }
  catch (cause) { return reply({message:cause.status ? cause.message : 'The request could not be completed. Please try again.'},cause.status || 500); }
}
export const config = {rateLimit:{windowSize:60,windowLimit:45,aggregateBy:['ip','domain']}};

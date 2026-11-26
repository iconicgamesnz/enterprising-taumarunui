import {getStore} from '@netlify/blobs';
import {JWT} from 'google-auth-library';
import {DateTime} from 'luxon';
import {createHash} from 'node:crypto';
import {storeName} from '../event-store.mjs';
import {occurrences} from '../recurrence.mjs';

// Deliberately disabled by default. Only an explicitly approved dedicated mirror
// calendar may be written; never send invitations or include attendee data.
export default async function(){
 if(process.env.ETI_GOOGLE_SYNC_ENABLED!=='true')return;
 const id=process.env.ETI_GOOGLE_MIRROR_CALENDAR_ID;
 if(!id||!process.env.ETI_GOOGLE_SERVICE_ACCOUNT||id==='enterprisingtaumarunui@gmail.com')throw Error('An explicit dedicated mirror calendar and service account are required.');
 const {client_email,private_key}=JSON.parse(process.env.ETI_GOOGLE_SERVICE_ACCOUNT);
 const client=new JWT({email:client_email,key:private_key,scopes:['https://www.googleapis.com/auth/calendar.events']});
 const store=getStore({name:storeName,consistency:'strong'});
 const root='https://www.googleapis.com/calendar/v3/calendars/'+encodeURIComponent(id)+'/events';
 const namespace='iconic-mahi-eti-v1';
 const desired=new Map();
 const {blobs}=await store.list({prefix:'public-events/'});
 const when=value=>({dateTime:DateTime.fromISO(value,{zone:'Pacific/Auckland'}).toISO(),timeZone:'Pacific/Auckland'});
 for(const {key} of blobs){
  const entry=await store.get(key,{type:'json'});
  if(!entry)throw Error('Incomplete source read; abort synchronization.');
  if(entry.status!=='published')continue;
  for(const e of occurrences(entry.event)){
   const eventId='e'+createHash('sha256').update(namespace+'|'+key+'|'+e.occurrence).digest('hex');
   const data={summary:e.title,location:e.location,description:[e.description,e.registration].filter(Boolean).join('\n\n'),start:when(e.start),end:when(e.end)};
   const hash=createHash('sha256').update(JSON.stringify(data)).digest('hex');
   desired.set(eventId,{...data,id:eventId,extendedProperties:{private:{etiMirror:namespace,etiHash:hash}}});
  }
 }
 // Compare only events previously marked as ours. Never modify unrelated events.
 const existing=new Map();
 let token;
 do{
  const url=new URL(root);url.searchParams.set('privateExtendedProperty','etiMirror='+namespace);url.searchParams.set('maxResults','2500');if(token)url.searchParams.set('pageToken',token);
  const {data}=await client.request({url:url.href});
  for(const event of data.items||[])if(event.extendedProperties?.private?.etiMirror===namespace)existing.set(event.id,event);
  token=data.nextPageToken;
 }while(token);
 let writes=0;
 for(const [eventId,data] of desired){
  const old=existing.get(eventId);
  if(old?.extendedProperties?.private?.etiHash===data.extendedProperties.private.etiHash)continue;
  if(writes>=100)return;
  if(old){const {id:_,...patch}=data;await client.request({url:root+'/'+eventId+'?sendUpdates=none',method:'PATCH',data:patch});}
  else await client.request({url:root+'?sendUpdates=none',method:'POST',data});
  writes++;
 }
 // Avoid mass deletion caused by an unexpected empty source. Manual recovery
 // is required in that case. Cancelled events are removed only if the source
 // store still contains their records.
 if(!blobs.length&&existing.size)return;
 for(const [eventId] of existing){
  if(desired.has(eventId))continue;
  if(writes>=100)return;
  await client.request({url:root+'/'+eventId+'?sendUpdates=none',method:'DELETE'});
  writes++;
 }
}
export const config={schedule:'*/30 * * * *'};

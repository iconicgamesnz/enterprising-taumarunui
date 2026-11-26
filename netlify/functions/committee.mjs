import { getStore } from '@netlify/blobs';
import { randomBytes } from 'node:crypto';
import baseline from '../../businesses.json' with {type:'json'};
import { storeName } from '../event-store.mjs';
import { reviewer, fail, hash } from '../access.mjs';

const defaults={email:'info@taumarunui.co.nz',individual:25,business:50};
const base=new Map(baseline.businesses.map(row=>[hash(row.name),row]));
const get=(s,k)=>s.get(k,{type:'json'});
async function listings(store,all=false) {
  const rows=new Map(base);
  const {blobs}=await store.list({prefix:'listing/'});
  await Promise.all(blobs.map(async ({key})=>{const row=await get(store,key);if(row)rows.set(key.slice(8),row.value);}));
  return [...rows.entries()].filter(([,r])=>all||r.approved).map(([id,r])=>({...r,id}));
}
function cleanListing(data) {
  const out={};
  for(const [field,limit] of Object.entries({name:160,category:100,location:220,description:1600,website:500,phone:60})) {
    out[field]=String(data[field]??'').trim();
    if(out[field].length>limit)throw fail(400,'Shorten '+field+'.');
  }
  if(!out.name || !out.category) throw fail(400,'Enter a business name and category.');
  if(out.website && !/^https?:\/\//i.test(out.website))throw fail(400,'Use a full website address beginning with https:// or http://.');
  out.member=data.member===true;out.approved=data.approved===true;
  return out;
}
function settings(data){
  const {email,individual,business}=data;
  if(typeof email!=='string'||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||![individual,business].every(v=>Number.isFinite(v)&&v>=0&&v<=100000))throw fail(400,'Check the email address and both fees.');
  return {email,individual,business};
}
async function save(store,key,value,version,previous) {
  const before=await store.getWithMetadata(key,{type:'json'});
  if((before?.data.version||'')!==version)throw fail(409,'Someone changed this record. Reload before editing.');
  const next={value,version:crypto.randomUUID(),previous:before?.data.value||previous||null};
  const result=await store.setJSON(key,next,before?{onlyIfMatch:before.etag}:{onlyIfNew:true});
  if(!result.modified)throw fail(409,'Another update arrived. Reload and try again.');
  return next;
}
export default async function(request) {
  const send=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'private,no-store'}});
  try {
    const store=getStore({name:storeName,consistency:'strong'});
    const url=new URL(request.url), action=url.searchParams.get('action')||'directory';
    if(request.method==='GET'&&action==='directory')return send({businesses:await listings(store)});
    if(request.method==='GET'&&action==='settings')return send((await get(store,'settings'))?.value||defaults);
    const role=await reviewer(request,store,['grant','revoke','keys','archive'].includes(action));
    if(request.method==='GET'){
      if(action==='keys') {
        const {blobs}=await store.list({prefix:'reviewers/'});
        return send(await Promise.all(blobs.map(async({key})=>({id:key.slice(10),name:await store.get(key)}))));
      }
      if(action==='index')return send({role,rows:(await listings(store,true)).map(({id,name,approved})=>({id,name,approved}))});
      if(action==='record'){
        const id=url.searchParams.get('id');
        if(id!=='settings'&&!/^[a-f0-9]{64}$/.test(id))throw fail(400,'Invalid record.');
        return send(await get(store,id==='settings'?id:'listing/'+id)||{value:id==='settings'?defaults:base.get(id)||{},version:''});
      }
    }
    if(request.method!=='POST')throw fail(405,'Unsupported operation.');
    if(!request.headers.get('content-type')?.startsWith('application/json'))throw fail(415,'JSON required.');
    const raw=await request.text();
    if(raw.length>(action==='archive'?500000:15000))throw fail(413,'Too much data.');
    const body=JSON.parse(raw);
    if(action==='archive'){
      if(!Array.isArray(body.businesses))throw fail(400,'Invalid archive.');
      const result=await store.setJSON('private-research/original',body,{onlyIfNew:true});
      return send({saved:result.modified});
    }
    if(action==='grant'){
      const name=String(body.name||'').trim().slice(0,100);if(!name)throw fail(400,'Enter a reviewer name.');
      const key=randomBytes(32).toString('hex');await store.set('reviewers/'+hash(key),name);
      return send({key});
    }
    if(action==='revoke'&&/^[a-f0-9]{64}$/.test(body.id)){await store.delete('reviewers/'+body.id);return send({ok:true});}
    const config=action==='settings', restore=body.restore===true;
    if(!config&&action!=='listing')throw fail(400,'Unknown operation.');
    const id=body.id||hash(String(body.value?.name||'').trim());
    if(!config&&!/^[a-f0-9]{64}$/.test(id))throw fail(400,'Invalid listing.');
    const key=config?'settings':'listing/'+id, original=config?defaults:base.get(id);
    const before=await get(store,key);
    if(!config&&!body.id&&(before||original))throw fail(409,'A listing with this name already exists.');
    const prior=before?.value||original;
    const value=restore?before?.previous:config?settings(body.value):{...prior,...cleanListing(body.value)};
    if(!value)throw fail(400,'There is no earlier version to restore.');
    return send(await save(store,key,value,body.version||'',original||(!config?{...value,approved:false}:null)));
  }catch(e){return send({message:e.status?e.message:'Unable to complete the change. Please retry.'},e.status||500);}
}
export const config={rateLimit:{windowLimit:120,windowSize:60,aggregateBy:['ip','domain']}};

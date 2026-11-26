import {getStore} from '@netlify/blobs';
import {storeName} from '../event-store.mjs';
import {contentEditor,fail,hash} from '../access.mjs';
import {clean} from '../cms-validation.mjs';
const reply=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'}});
export default async function(request){
 try{
  const store=getStore({name:storeName,consistency:'strong'});await contentEditor(request,store);
  const u=new URL(request.url),action=u.searchParams.get('action')||'list';
  if(request.method==='GET'&&action==='list'){
   const {blobs}=await store.list({prefix:'cms-media/'});
   const list=await Promise.all(blobs.map(async({key})=>{const v=await store.get(key,{type:'json'});return {id:key.slice(10),name:v.name,alt:v.alt};}));
   return reply(list);
  }
  const id=u.searchParams.get('id')||'';
  if(request.method==='GET'&&action==='get'&&/^[a-f0-9]{64}$/.test(id)){
   const v=await store.get('cms-media/'+id,{type:'json'});if(!v)throw fail(404,'Image not found.');return reply(v);
  }
  if(request.method!=='POST'||!request.headers.get('content-type')?.startsWith('application/json'))throw fail(405,'Unsupported operation.');
  const raw=await request.text();if(raw.length>460000)throw fail(413,'Image too large.');
  const b=JSON.parse(raw);
  if(action==='remove'&&/^[a-f0-9]{64}$/.test(b.id)){await store.delete('cms-media/'+b.id);return reply({ok:true});}
  if(action!=='add')throw fail(400,'Unknown action.');
  const v=clean({photo:b.photo,alt:b.alt},'index'),name=String(b.name||'').trim().slice(0,120);
  if(!name||!v.photo)throw fail(400,'Enter a name and an image.');
  const key=hash(v.photo+'\n'+v.alt+'\n'+name);
  await store.setJSON('cms-media/'+key,{name,photo:v.photo,alt:v.alt},{onlyIfNew:true});
  return reply({id:key,name,alt:v.alt});
 }catch(e){return reply({message:e.status?e.message:'Unable to complete media action.'},e.status||500);}
}
export const config={rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain']}};

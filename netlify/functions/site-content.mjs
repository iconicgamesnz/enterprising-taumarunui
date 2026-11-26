import {getStore} from '@netlify/blobs';
import {storeName} from '../event-store.mjs';
import {contentEditor,fail} from '../access.mjs';
const pages=new Set(['index','about','membership','contact','directory','events','privacy']);
const response=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'}});
import {clean} from '../cms-validation.mjs';
const empty=()=>({version:'',draft:null,published:null,previous:null});
export default async function(request){
 try{
  const u=new URL(request.url),id=u.searchParams.get('id')||'index',action=u.searchParams.get('action')||'public';
  if(id!=='appearance'&&!pages.has(id)&&!/^post-[a-f0-9-]{36}$/.test(id))throw fail(400,'Unknown page.');
  const store=getStore({name:storeName,consistency:'strong'}),key='site-content/'+id;
  if(request.method==='GET'&&['posts','post-index'].includes(action)){
   if(action==='post-index')await contentEditor(request,store);
   const {blobs}=await store.list({prefix:'site-content/post-'});
   const rows=await Promise.all(blobs.map(async({key})=>{const r=await store.get(key,{type:'json'});const v=action==='posts'?r?.published:r?.draft||r?.published;return v?{id:key.slice(13),heading:v.heading,description:v.description, ...(action==='posts'?{body:v.body||'',photo:v.photo||'',alt:v.alt||''}:{published:!!r.published})}:null;}));
   return response({posts:rows.filter(Boolean)});
  }
  if(request.method==='GET'&&action==='public'){
   const record=await store.get(key,{type:'json'});
   return response({published:record?.published||null});
  }
  await contentEditor(request,store);
  const before=await store.getWithMetadata(key,{type:'json'}),record=before?.data||empty();
  if(request.method==='GET'&&action==='edit')return response(record);
  if(request.method!=='POST'||!['draft','publish','restore','unpublish'].includes(action))throw fail(405,'Unsupported operation.');
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw fail(415,'JSON required.');
  const raw=await request.text();if(raw.length>1800000)throw fail(413,'Content too large.');
  const body=JSON.parse(raw);
  if((body.version||'')!==record.version)throw fail(409,'Someone changed this page. Reload before editing.');
  let next={...record,version:crypto.randomUUID()};
  if(action==='draft')next.draft=clean(body.value,id);
  if(action==='publish'){next.previous=record.published;next.published=clean(body.value,id);next.draft=null;}
  if(action==='unpublish'){if(!id.startsWith('post-'))throw fail(400,'Only posts can be unpublished here.');next.draft=record.draft||record.published;next.previous=record.published;next.published=null;}
  if(action==='restore'){if(!record.published)throw fail(400,'There is no published version to restore.');next.published=record.previous;next.previous=record.published;next.draft=null;}
  const saved=await store.setJSON(key,next,before?{onlyIfMatch:before.etag}:{onlyIfNew:true});
  if(!saved.modified)throw fail(409,'Someone changed this page. Reload before editing.');
  return response(next);
 }catch(e){return response({message:e.status?e.message:'Unable to complete the change.'},e.status||500);}
}
export const config={rateLimit:{windowLimit:90,windowSize:60,aggregateBy:['ip','domain']}};

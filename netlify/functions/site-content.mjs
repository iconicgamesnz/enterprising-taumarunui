import {getStore} from '@netlify/blobs';
import {storeName} from '../event-store.mjs';
import {reviewer,fail} from '../access.mjs';
const pages=new Set(['index','about','membership','contact','directory','events','photos','privacy']);
const themes=new Set(['original','green','navy']);
const fonts=new Set(['original','system','serif']);
const response=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'}});
function clean(input,id){
 if(!input||typeof input!=='object')throw fail(400,'Invalid content.');
 if(id==='appearance'){
  if(!themes.has(input.theme)||!fonts.has(input.font))throw fail(400,'Choose a supported appearance.');
  return {theme:input.theme,font:input.font};
 }
 const out={};
 for(const [k,max] of Object.entries({heading:160,intro:1200,alt:180,seoTitle:120,description:300})){
  if(typeof (input[k]??'')!=='string')throw fail(400,'Invalid '+k);
  out[k]=(input[k]||'').trim();
  if(out[k].length>max)throw fail(400,'Shorten '+k);
 }
 const photo=input.photo||'';
 if(typeof photo!=='string'||photo.length>450000)throw fail(400,'Choose a smaller image.');
 if(photo){
  if(photo.startsWith('data:')){
   const m=photo.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
   if(!m)throw fail(400,'Only JPEG, PNG or WebP images are supported.');
   const b=Buffer.from(m[2],'base64');
   const valid=m[1]==='jpeg'?b[0]===255&&b[1]===216&&b[2]===255:m[1]==='png'?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP';
   if(!valid)throw fail(400,'Invalid image.');
  }else{
   let u;try{u=new URL(photo)}catch{throw fail(400,'Enter an HTTPS image URL.')}
   if(u.protocol!=='https:'||u.username||u.password||photo.length>1800)throw fail(400,'Enter an HTTPS image URL.');
  }
  if(!out.alt)throw fail(400,'Describe the photo for screen readers.');
 }
 return {...out,photo};
}
const empty=()=>({version:'',draft:null,published:null,previous:null});
export default async function(request){
 try{
  const u=new URL(request.url),id=u.searchParams.get('id')||'index',action=u.searchParams.get('action')||'public';
  if(id!=='appearance'&&!pages.has(id))throw fail(400,'Unknown page.');
  const store=getStore({name:storeName,consistency:'strong'}),key='site-content/'+id;
  if(request.method==='GET'&&action==='public'){
   const record=await store.get(key,{type:'json'});
   return response({published:record?.published||null});
  }
  await reviewer(request,store,true);
  const before=await store.getWithMetadata(key,{type:'json'}),record=before?.data||empty();
  if(request.method==='GET'&&action==='edit')return response(record);
  if(request.method!=='POST'||!['draft','publish','restore'].includes(action))throw fail(405,'Unsupported operation.');
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw fail(415,'JSON required.');
  const raw=await request.text();if(raw.length>470000)throw fail(413,'Content too large.');
  const body=JSON.parse(raw);
  if((body.version||'')!==record.version)throw fail(409,'Someone changed this page. Reload before editing.');
  let next={...record,version:crypto.randomUUID()};
  if(action==='draft')next.draft=clean(body.value,id);
  if(action==='publish'){next.previous=record.published;next.published=clean(body.value,id);next.draft=null;}
  if(action==='restore'){if(!record.published)throw fail(400,'There is no published version to restore.');next.published=record.previous;next.previous=record.published;next.draft=null;}
  const saved=await store.setJSON(key,next,before?{onlyIfMatch:before.etag}:{onlyIfNew:true});
  if(!saved.modified)throw fail(409,'Someone changed this page. Reload before editing.');
  return response(next);
 }catch(e){return response({message:e.status?e.message:'Unable to complete the change.'},e.status||500);}
}
export const config={rateLimit:{windowLimit:90,windowSize:60,aggregateBy:['ip','domain']}};

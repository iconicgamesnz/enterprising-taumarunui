import {getStore} from '@netlify/blobs';
import {storeName} from '../event-store.mjs';
import {contentEditor,fail} from '../access.mjs';
import {defaults,cleanWorkspace,publicWorkspace,submission} from '../workspace-model.mjs';
const reply=(v,status=200)=>Response.json(v,{status,headers:{'Cache-Control':'private,no-store','X-Content-Type-Options':'nosniff'}});
const read=(s,k)=>s.get(k,{type:'json'}),fresh=()=>({version:'',value:defaults(),previous:null});
async function body(req){if(!req.headers.get('content-type')?.startsWith('application/json'))throw fail(415,'JSON required.');const raw=await req.text();if(raw.length>1000000)throw fail(413,'Request too large.');try{return JSON.parse(raw)}catch{throw fail(400,'Invalid JSON.');}}
async function items(store,kind){const {blobs}=await store.list({prefix:'workspace-inbox/'+kind+'/'});return (await Promise.all(blobs.map(async({key})=>{const v=await read(store,key);return v?{...v,id:key.split('/').pop()}:null;}))).filter(Boolean).sort((a,b)=>b.created.localeCompare(a.created));}
export async function handle(req,store){
 const a=new URL(req.url).searchParams.get('action')||'public',k='workspace-config';
 if(req.method==='GET'&&a==='public')return reply(publicWorkspace((await read(store,k)||fresh()).value));
 if(req.method==='GET'&&a==='comments'){if(!(await read(store,k)||fresh()).value.comments)return reply({items:[]});return reply({items:(await items(store,'comment')).filter(x=>x.status==='approved').map(({name,message,created,id})=>({name,message,created,id}))});}
 if(req.method==='POST'&&['enquire','comment'].includes(a)){const config=(await read(store,k)||fresh()).value,kind=a==='comment'?'comment':'enquiry';if(!(kind==='comment'?config.comments:config.forms))throw fail(403,'This feature is not enabled.');const b=await body(req);if(b.website)return reply({ok:true},202);const value=submission(b,kind);await store.setJSON('workspace-inbox/'+kind+'/'+crypto.randomUUID(),{...value,created:new Date().toISOString(),status:'pending',version:crypto.randomUUID()},{onlyIfNew:true});return reply({ok:true},202);}
 const user=await contentEditor(req,store);
 if(req.method==='GET'&&a==='edit')return reply({...((await read(store,k))||fresh()),role:user.role});
 if(req.method==='GET'&&a==='inbox')return reply({enquiries:await items(store,'enquiry'),comments:await items(store,'comment')});
 if(req.method!=='POST')throw fail(405,'Unsupported request.');const b=await body(req);
 if(a==='save'||a==='restore'){const before=await store.getWithMetadata(k,{type:'json'}),r=before?.data||fresh();if(b.version!==r.version)throw fail(409,'Someone changed the site. Reload first.');if(a==='restore'&&!r.previous)throw fail(400,'No previous version.');const value=cleanWorkspace(a==='restore'?r.previous:b.value,r.value,user.role==='owner'),next={version:crypto.randomUUID(),value,previous:r.value};if(!(await store.setJSON(k,next,before?{onlyIfMatch:before.etag}:{onlyIfNew:true})).modified)throw fail(409,'Another change was saved.');return reply({...next,role:user.role});}
 if(a==='moderate'){if(!['enquiry','comment'].includes(b.kind)||!/^[a-f0-9-]{36}$/.test(b.id))throw fail(400,'Unknown record.');const statuses=b.kind==='comment'?['pending','approved','rejected']:['pending','resolved'];if(!statuses.includes(b.status))throw fail(400,'Invalid status.');const key='workspace-inbox/'+b.kind+'/'+b.id,old=await store.getWithMetadata(key,{type:'json'});if(!old)throw fail(404,'Record not found.');if(old.data.version!==b.version)throw fail(409,'Record changed. Reload.');if(!(await store.setJSON(key,{...old.data,status:b.status,version:crypto.randomUUID()},{onlyIfMatch:old.etag})).modified)throw fail(409,'Record changed.');return reply({ok:true});}
 throw fail(404,'Unknown action.');
}
export default async function(req){try{return await handle(req,getStore({name:storeName,consistency:'strong'}));}catch(e){return reply({message:e.status?e.message:'Unable to complete request.'},e.status||500);}}
export const config={rateLimit:{windowLimit:40,windowSize:60,aggregateBy:['ip','domain']}};

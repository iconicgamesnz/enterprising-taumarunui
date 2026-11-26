import {getStore} from '@netlify/blobs';
import {storeName} from '../event-store.mjs';
import {reviewer,fail,hash,accountSession} from '../access.mjs';
import {randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {promisify} from 'node:util';
const derive=promisify(scrypt);
const get=(s,k)=>s.get(k,{type:'json'});
const reply=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const username=v=>String(v||'').trim().toLowerCase();
const valid=u=>/^[a-z0-9][a-z0-9._-]{2,39}$/.test(u)&&u!=='owner';
const makePassword=()=>randomBytes(18).toString('base64url');
async function verifier(password,salt){return (await derive(password,salt,64)).toString('hex');}
export default async function(request){
 try{
  const store=getStore({name:storeName,consistency:'strong'}),action=new URL(request.url).searchParams.get('action');
  if(action==='login'){
   if(request.method!=='POST'||!request.headers.get('content-type')?.startsWith('application/json'))throw fail(405,'POST JSON required.');
   const raw=await request.text();if(raw.length>2000)throw fail(413,'Too large.');
   const b=JSON.parse(raw),u=username(b.username),p=b.password;
   if(!valid(u)||typeof p!=='string'||p.length>128)throw fail(401,'Invalid username or password.');
   const user=await get(store,'cms-user/'+u),salt=user?.salt||'00000000000000000000000000000000';
   const attempt=await verifier(p,salt),stored=user?.verifier||'0'.repeat(128);
   if(!user?.active||!timingSafeEqual(Buffer.from(attempt,'hex'),Buffer.from(stored,'hex')))throw fail(401,'Invalid username or password.');
   const token=randomBytes(32).toString('hex'),expires=Date.now()+8*60*60*1000;
   await store.setJSON('cms-session/'+hash(token),{username:u,generation:user.generation,expires});
   return reply({token,username:u,expires});
  }
  if(action==='logout'&&request.method==='POST'){
   const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
   if(/^[a-f0-9]{64}$/.test(token)&&await accountSession(request,store))await store.delete('cms-session/'+hash(token));
   return reply({ok:true});
  }
  if(action==='profile'&&request.method==='GET'){
   const session=await accountSession(request,store);if(!session)throw fail(401,'Sign in again.');return reply(session);
  }
  if(action==='password'&&request.method==='POST'){
   const session=await accountSession(request,store);if(!session)throw fail(401,'Sign in again.');
   if(!request.headers.get('content-type')?.startsWith('application/json'))throw fail(415,'JSON required.');
   const raw=await request.text();if(raw.length>2000)throw fail(413,'Too large.');
   const b=JSON.parse(raw);
   if(typeof b.current!=='string'||b.current.length>128||typeof b.password!=='string'||b.password.length<14||b.password.length>128)throw fail(400,'Use a new password of 14–128 characters.');
   const k='cms-user/'+session.username,old=await store.getWithMetadata(k,{type:'json'});
   if(!old?.data.active||!timingSafeEqual(Buffer.from(await verifier(b.current,old.data.salt),'hex'),Buffer.from(old.data.verifier,'hex')))throw fail(403,'Current password incorrect.');
   const salt=randomBytes(16).toString('hex'),next={...old.data,salt,verifier:await verifier(b.password,salt),generation:randomBytes(16).toString('hex')};
   if(!(await store.setJSON(k,next,{onlyIfMatch:old.etag})).modified)throw fail(409,'Account changed. Sign in again.');
   return reply({ok:true});
  }
  await reviewer(request,store,true);
  if(action==='list'&&request.method==='GET'){
   const {blobs}=await store.list({prefix:'cms-user/'});
   return reply(await Promise.all(blobs.map(async({key})=>{const u=await get(store,key);return {username:key.slice(9),active:u.active};})));
  }
  if(request.method!=='POST'||!['create','reset','disable'].includes(action)||!request.headers.get('content-type')?.startsWith('application/json'))throw fail(405,'Unsupported operation.');
  const raw=await request.text();if(raw.length>2000)throw fail(413,'Too large.');
  const b=JSON.parse(raw),u=username(b.username);if(!valid(u))throw fail(400,'Choose a username of 3–40 letters, numbers, dots or dashes.');
  const k='cms-user/'+u,old=await store.getWithMetadata(k,{type:'json'});
  if(action==='create'&&old)throw fail(409,'Username already exists.');
  if(action!=='create'&&!old)throw fail(404,'Account not found.');
  const password=action==='disable'?null:makePassword(),salt=randomBytes(16).toString('hex');
  const next={active:action!=='disable',generation:randomBytes(16).toString('hex'),salt,verifier:password?await verifier(password,salt):'0'.repeat(128)};
  const saved=await store.setJSON(k,next,old?{onlyIfMatch:old.etag}:{onlyIfNew:true});
  if(!saved.modified)throw fail(409,'Account changed. Reload.');
  return reply({username:u,password,active:next.active});
 }catch(e){return reply({message:e.status?e.message:'Unable to complete account action.'},e.status||500);}
}
export const config={rateLimit:{windowLimit:12,windowSize:60,aggregateBy:['ip','domain']}};

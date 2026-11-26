import {fail} from './access.mjs';
const themes=new Set(['original','green','navy']);
const fonts=new Set(['original','system','serif']);
export function clean(input,id){
 if(!input||typeof input!=='object')throw fail(400,'Invalid content.');
 if(id==='appearance'){
  if(!themes.has(input.theme)||!fonts.has(input.font))throw fail(400,'Choose a supported appearance.');
  return {theme:input.theme,font:input.font};
 }
 const out={};
 for(const [k,max] of Object.entries({heading:160,intro:1200,alt:180,seoTitle:120,description:300,body:12000})){
  if(typeof (input[k]??'')!=='string')throw fail(400,'Invalid '+k);
  out[k]=(input[k]||'').trim();
  if(out[k].length>max)throw fail(400,'Shorten '+k);
 }
 if(id.startsWith('post-')&&!out.heading)throw fail(400,'Enter a post title.');
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
 const sections=[];
 if(input.sections!==undefined){if(!Array.isArray(input.sections)||input.sections.length>120)throw fail(400,'Too many section edits.');const seen=new Set();for(const v of input.sections){if(!v||!/^e[1-9][0-9]{0,3}$/.test(v.key)||seen.has(v.key))throw fail(400,'Invalid section reference.');seen.add(v.key);if(v.type==='text'){if(typeof v.text!=='string'||v.text.length>4000)throw fail(400,'Shorten section text.');sections.push({key:v.key,type:'text',text:v.text});}else if(v.type==='image'){if(typeof v.src==='string'&&/^\/?[\w/-]+\.(?:jpg|jpeg|png|webp)$/i.test(v.src)&&typeof v.alt==='string'&&v.alt.trim()&&v.alt.length<=180){sections.push({key:v.key,type:'image',src:v.src,alt:v.alt});continue;}const image=clean({photo:v.src,alt:v.alt},'index');if(!image.photo)throw fail(400,'Choose a replacement image.');sections.push({key:v.key,type:'image',src:image.photo,alt:image.alt});}else throw fail(400,'Unknown section type.');}}
 return {...out,photo,sections};
}

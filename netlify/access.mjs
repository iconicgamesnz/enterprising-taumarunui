import {randomBytes,timingSafeEqual,createHash} from 'node:crypto';
export const fail=(status,message)=>Object.assign(new Error(message),{status});
export const hash=value=>createHash('sha256').update(value).digest('hex');
export async function reviewer(request,store,ownerOnly=false) {
  let owner=await store.get('review-access');
  if (!owner) {
    await store.set('review-access',randomBytes(32).toString('hex'),{onlyIfNew:true});
    owner=await store.get('review-access');
  }
  const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');
  if (!token || !owner) throw fail(401,'Enter your reviewer key.');
  if (timingSafeEqual(Buffer.from(hash(token)),Buffer.from(hash(owner)))) return 'owner';
  if (!ownerOnly && /^[a-f0-9]{64}$/.test(token) && await store.get('reviewers/'+hash(token))) return 'reviewer';
  throw fail(403,'Access denied. Ask the project owner for a reviewer key.');
}

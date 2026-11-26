import test from 'node:test';
import assert from 'node:assert/strict';
import {handle} from '../netlify/functions/community-events.mjs';

test('private review, edits, calendar failure recovery, replay and decline',async () => {
  const records = new Map([['review-access','key']]);
  const store = {
    get:async k => records.get(k) ?? null,
    async set(k,v) { if (!records.has(k)) records.set(k,v); },
    async setJSON(k,v) { await this.set(k,v); },
    list:async ({prefix}) => ({blobs:[...records.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))})
  };
  const event = {id:crypto.randomUUID(),title:'Test only',location:'Hall',description:'Doors open at 9',email:'organiser@example.invalid',start:'2027-01-18T09:00',end:'2027-01-18T10:00'};
  const call = (action,body,auth=true,client) => handle(new Request('https://example.invalid/?action='+action,{
    method:body?'POST':'GET',headers:{'content-type':'application/json',Authorization:auth?'Bearer key':''},body:body?JSON.stringify(body):undefined
  }),store,client);
  await assert.rejects(call('queue',null,false),{status:401});
  await assert.rejects(call('submit',{...event,end:event.start}),{status:400});
  await call('submit',event); await call('submit',event);
  assert.equal((await (await call('queue')).json()).items.length,1);
  await assert.rejects(call('approve',event,false),{status:401});
  await assert.rejects(call('approve',event),{status:503});
  assert.equal(records.has('decisions/'+event.id),false);
  let payload;
  const failedClient = () => ({request:async ({data}) => {payload=data; throw new Error('interrupted');}});
  await assert.rejects(call('approve',{...event,title:'Edited'},true,failedClient),{status:502});
  assert.equal(payload.summary,'Edited');
  assert.equal(payload.start.dateTime,'2027-01-18T09:00:00.000+13:00');
  assert.ok(!JSON.stringify(payload).includes(event.email));
  await assert.rejects(call('decline',event),{status:409});
  const retry = () => ({request:async ({method,data}) => {
    if (method==='POST') {assert.equal(data.summary,'Edited'); throw {response:{status:409}};}
    return {data:{extendedProperties:{private:{etiSubmission:event.id}}}};
  }});
  await call('approve',event,true,retry);
  await call('approve',event,true,failedClient);
  assert.equal((await (await call('queue')).json()).items.length,0);
  const another = {...event,id:crypto.randomUUID()};
  await call('submit',another); await call('decline',another);
  assert.equal((await (await call('queue')).json()).items.length,0);
});

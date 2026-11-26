export function openCommittee(key) {
  const host=document.querySelector('#committee');
  const pick=host.querySelector('#listing-select'), form=host.querySelector('#listing-edit');
  const fees=host.querySelector('#settings-edit'), roles=host.querySelector('#reviewer-tools');
  const status=host.querySelector('[role=status]');
  let current='',version='',feeVersion='';
  const run=fn=>async e=>{
    if(e)e.preventDefault();
    try{await fn(e);}catch(err){status.textContent=err.message;}
  };
  async function api(action,body) {
    const r=await fetch('/.netlify/functions/committee?action='+action,{method:body?'POST':'GET',cache:'no-store',
      headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
    const data=await r.json();if(!r.ok)throw new Error(data.message);return data;
  }
  async function loadRecord() {
    const id=pick.value;
    const record=id?await api('record&id='+id):{value:{approved:true},version:''};
    if(id!==pick.value)return;
    current=id;version=record.version;form.reset();
    for(const field of form.elements) {
      if(!field.name)continue;
      if(field.type==='checkbox')field.checked=!!record.value[field.name];
      else field.value=record.value[field.name]||'';
    }
    form.querySelector('[value=restore]').disabled=!record.previous;
  }
  async function refresh(selected=''){
    const data=await api('index');
    pick.replaceChildren(new Option('Add a new business',''));
    for(const r of data.rows.sort((a,b)=>a.name.localeCompare(b.name)))pick.add(new Option(r.name+(r.approved?'':' (unpublished)'),r.id));
    pick.value=selected;
    await loadRecord();
    const s=await api('record&id=settings');feeVersion=s.version;
    for(const [k,v] of Object.entries(s.value))fees.elements[k].value=v;
    fees.querySelector('[value=restore]').disabled=!s.previous;
    roles.hidden=data.role!=='owner';
    if(!roles.hidden){
      const select=roles.querySelector('select');
      select.replaceChildren(new Option('Select a reviewer',''));
      for(const r of await api('keys'))select.add(new Option(r.name,r.id));
    }
  }
  pick.onchange=run(loadRecord);
  form.onsubmit=run(async e=>{
    const restore=e.submitter.value==='restore';
    if(restore&&!confirm('Restore the previous version of this listing?'))return;
    const val=Object.fromEntries(new FormData(form));val.approved=form.elements.approved.checked;val.member=form.elements.member.checked;
    await api('listing',{id:current,version,value:val,restore});
    await refresh(current);status.textContent=restore?'Previous listing restored.':'Listing saved.';
  });
  fees.onsubmit=run(async e=>{
    const restore=e.submitter.value==='restore';
    if(restore&&!confirm('Restore the previous fees and contact email?'))return;
    await api('settings',{version:feeVersion,restore,value:{email:fees.elements.email.value,individual:Number(fees.elements.individual.value),business:Number(fees.elements.business.value)}});
    await refresh(current);status.textContent='Site settings saved.';
  });
  roles.querySelector('form').onsubmit=run(async e=>{
    const f=e.target;const {key}=await api('grant',{name:f.elements.name.value});
    f.reset();await refresh(current);roles.querySelector('output').textContent=key;
    status.textContent='Copy the key and deliver it privately to this reviewer.';
  });
  roles.querySelector('#revoke').onclick=run(async()=>{
    const id=roles.querySelector('select').value;
    if(!id||!confirm('Revoke this reviewer’s access now?'))return;
    await api('revoke',{id});await refresh(current);status.textContent='Reviewer access revoked.';
  });
  host.hidden=false;run(refresh)();
}

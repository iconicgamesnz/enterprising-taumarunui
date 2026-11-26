document.addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('.site-nav-toggle'),n=document.getElementById('site-links');if(b&&n){b.addEventListener('click',()=>{const open=n.classList.toggle('open');b.setAttribute('aria-expanded',String(open));b.textContent=open?'Close ×':'Menu ☰';});}});
async function applyContactAndFees() {
  const result=await fetch('/.netlify/functions/committee?action=settings');
  if(!result.ok)return;
  const {email,individual,business}=await result.json();
  for(const link of document.querySelectorAll('a[href^="mailto:info@taumarunui.co.nz"]')){
    if(link.textContent==='info@taumarunui.co.nz')link.textContent=email;
    link.href='mailto:'+email+(link.search||'');
  }
  for(const [type,amount] of Object.entries({individual,business})){
    const el=document.querySelector('[data-fee="'+type+'"]');if(el)el.textContent='$'+amount;
  }
}
applyContactAndFees().catch(()=>{});

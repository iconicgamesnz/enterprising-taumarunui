import {openCommittee} from './committee.js';
const endpoint = '/.netlify/functions/community-events';
let reviewer = '';
async function api(action, body) {
  const headers = {};
  if (reviewer) headers.Authorization = 'Bearer ' + reviewer;
  if (body) headers['Content-Type'] = 'application/json';
  const response = await fetch(endpoint + '?action=' + action, {
    method:body ? 'POST' : 'GET',headers,body:body ? JSON.stringify(body) : undefined,cache:'no-store'
  });
  let data;
  try { data = await response.json(); } catch { throw new Error('The event service is unavailable. Please try again.'); }
  if (!response.ok) throw new Error(data.message || 'Please try again.');
  return data;
}
const form = document.querySelector('#event-form');
if (form) {
  const frame = document.querySelector('.calendar iframe');
  api('calendar').then(({id}) => {
    const url = new URL(frame.src);
    if (url.searchParams.get('src') === id) return;
    url.searchParams.set('src',id);
    frame.src = url.href;
    document.querySelector('.calendar + p a').href = url.href;
  }).catch(() => {});
  let id = crypto.randomUUID();
  form.addEventListener('submit',async event => {
    event.preventDefault();
    const status = form.querySelector('[role=status]');
    const button = form.querySelector('button');
    button.disabled = true;
    status.textContent = 'Sending…';
    try {
      const result = await api('submit',{...Object.fromEntries(new FormData(form)),id});
      status.textContent = result.message;
      form.reset();
      id = crypto.randomUUID();
    } catch (e) { status.textContent = e.message; }
    finally { button.disabled = false; }
  });
}
const access = document.querySelector('#access');
if (access) {
  const queue = document.querySelector('#queue');
  const controls = document.querySelector('#controls');
  const status = document.querySelector('#review-status');
  async function refresh(note = '') {
    const key = reviewer;
    const {items} = await api('queue');
    if (key !== reviewer || !reviewer) return;
    queue.replaceChildren();
    access.hidden = true;
    controls.hidden = false;
    status.textContent = [note,items.length ? 'Awaiting review: ' + items.length : 'The review queue is empty.'].filter(Boolean).join(' ');
    for (const item of items) {
      const row = document.querySelector('#review').content.firstElementChild.cloneNode(true);
      row.querySelector('h2').textContent = item.title;
      row.querySelector('.contact').textContent = 'Organiser: ' + item.email;
      for (const key of ['title','location','start','end','description']) {
        row.elements[key].value = item[key];
        row.elements[key].readOnly = item.locked;
      }
      if (item.locked) {
        row.querySelector('[value=approve]').textContent = 'Retry publication';
        row.querySelector('[value=decline]').hidden = true;
      }
      row.addEventListener('submit',async event => {
        event.preventDefault();
        const action = event.submitter.value;
        if (action === 'decline' && !confirm('Decline this submission?')) return;
        const feedback = row.querySelector('[role=status]');
        const buttons = row.querySelectorAll('button');
        buttons.forEach(button => button.disabled = true);
        feedback.textContent = 'Saving…';
        try {
          const result = await api(action,{...Object.fromEntries(new FormData(row)),id:item.id});
          await refresh(result.message);
        } catch (e) {
          feedback.textContent = e.message;
          try { await refresh(e.message); } catch { /* Keep the actionable error visible. */ }
        } finally { buttons.forEach(button => button.disabled = false); }
      });
      queue.append(row);
    }
  }
  access.addEventListener('submit',async event => {
    event.preventDefault();
    reviewer = access.elements.key.value.trim();
    try { await refresh(); access.reset(); openCommittee(reviewer); } catch (e) { reviewer = ''; status.textContent = e.message; }
  });
  document.querySelector('#refresh').onclick = () => refresh().catch(e => status.textContent = e.message);
  document.querySelector('#logout').onclick = () => {
    location.reload(); reviewer = ''; queue.replaceChildren(); controls.hidden = true; access.hidden = false;
    status.textContent = ''; access.elements.key.focus();
  };
}

document.addEventListener('DOMContentLoaded', async () => {
  const search = document.getElementById('business-search');
  const category = document.getElementById('business-category');
  const sort = document.getElementById('business-sort');
  const membersOnly = document.getElementById('members-only');
  const reset = document.getElementById('directory-reset');
  const results = document.getElementById('business-results');
  const empty = document.getElementById('directory-empty');
  const count = document.getElementById('directory-count');
  let businesses = [];
  let error = false;

  const create = (tag, cls, content) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (content !== undefined && content !== null) el.textContent = String(content);
    return el;
  };
  const safeWeb = value => {
    try {
      const u = new URL(value);
      return ['https:', 'http:'].includes(u.protocol) ? u.href : '';
    } catch { return ''; }
  };
  const phoneHref = phone => /^[+]?[0-9() .-]{6,25}$/.test(phone || '')
    ? 'tel:' + phone.replace(/[^+0-9]/g, '') : '';
  const link = (text, href, external = false) => {
    const a = create('a', '', text);
    a.href = href;
    if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  };
  const pageLink = business => 'business.html?business=' + encodeURIComponent(business.name);
  const searchable = business => [
    business.name, business.category, business.description, business.location
  ].filter(Boolean).join(' ').toLocaleLowerCase('en-NZ');

  try {
    const response = await fetch('businesses.json', {cache:'no-store'});
    if (!response.ok) throw new Error('Cannot load directory');
    const json = await response.json();
    businesses = (Array.isArray(json.businesses) ? json.businesses : [])
      .filter(b => b && b.approved === true && typeof b.name === 'string' && b.name.trim());
  } catch (err) {
    error = true;
    empty.textContent = 'The directory is temporarily unavailable. Please try again later.';
  }

  const categories = [...new Set(businesses.map(b => b.category).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  for (const c of categories) {
    const option = create('option', '', c);
    option.value = c;
    category.append(option);
  }

  const initial = new URLSearchParams(window.location.search);
  if (initial.has('q')) search.value = initial.get('q') || '';
  if (initial.has('category') && categories.includes(initial.get('category'))) category.value = initial.get('category');

  function render() {
    const term = search.value.trim().toLocaleLowerCase('en-NZ');
    const filtered = businesses.filter(b =>
      (!term || searchable(b).includes(term)) &&
      (!category.value || b.category === category.value) &&
      (!membersOnly.checked || b.member === true)
    ).sort((a, b) => {
      if (sort.value === 'members') return Number(b.member === true) - Number(a.member === true) || a.name.localeCompare(b.name);
      return sort.value === 'za' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
    });

    results.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const b of filtered) {
      const card = create('article', 'listing directory-card');
      const header = create('div', 'directory-card-head');
      const icon = create('div', 'directory-monogram', b.name.slice(0, 1).toUpperCase());
      icon.setAttribute('aria-hidden', 'true');
      header.append(icon);
      const titleGroup = create('div', 'directory-card-heading');
      titleGroup.append(create('span', 'directory-category', b.category || 'Local business'));
      const heading = create('h3');
      heading.append(link(b.name, pageLink(b)));
      titleGroup.append(heading);
      header.append(titleGroup);
      card.append(header);
      if (b.member === true) card.append(create('span', 'member-chip', 'ETI member'));
      if (b.description) card.append(create('p', 'directory-description', b.description));
      if (b.location) card.append(create('p', 'directory-location', b.location));
      const actions = create('div', 'directory-card-actions');
      actions.append(link('View profile', pageLink(b)));
      const website = safeWeb(b.website);
      if (website) actions.append(link('Website ↗', website, true));
      const phone = phoneHref(b.phone);
      if (phone) actions.append(link('Call', phone));
      card.append(actions);
      fragment.append(card);
    }
    results.append(fragment);
    count.textContent = error ? 'Directory unavailable' :
      filtered.length + ' of ' + businesses.length + ' listed businesses';
    empty.hidden = filtered.length > 0;
    if (!error) empty.textContent = businesses.length ?
      'No matching businesses. Clear the filters or try another search.' :
      'Listings are being checked before publication.';
  }

  for (const control of [search, category, sort, membersOnly]) {
    control.addEventListener(control === search ? 'input' : 'change', render);
  }
  reset.addEventListener('click', () => {
    search.value = '';
    category.value = '';
    sort.value = 'az';
    membersOnly.checked = false;
    history.replaceState(null, '', window.location.pathname);
    render();
    search.focus();
  });
  render();
});

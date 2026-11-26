document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('business-profile');
  const params = new URLSearchParams(location.search);
  const requested = params.get('business') || '';
  const create = (tag, cls, label) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (label !== undefined && label !== null) el.textContent = String(label);
    return el;
  };
  const link = (label, href, cls = '', external = false) => {
    const a = create('a', cls, label);
    a.href = href;
    if (external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    return a;
  };
  const safeWeb = value => {
    try {
      const u = new URL(value);
      return ['https:', 'http:'].includes(u.protocol) ? u.href : '';
    } catch { return ''; }
  };
  const phoneHref = phone => /^[+]?[0-9() .-]{6,25}$/.test(phone || '')
    ? 'tel:' + phone.replace(/[^+0-9]/g, '') : '';
  const fail = message => {
    root.replaceChildren(create('h1', 'business-title', 'Business not found'),
                         create('p', 'section-intro', message));
  };

  if (!requested || requested.length > 200) {
    fail('Return to the directory to choose a business.');
    return;
  }
  try {
    const response = await fetch('businesses.json', {cache: 'no-store'});
    if (!response.ok) throw new Error('Unavailable');
    const data = await response.json();
    const record = (Array.isArray(data.businesses) ? data.businesses : [])
      .find(item => item && item.approved === true && item.name === requested);
    if (!record) {
      fail('This listing may have been updated or is not currently published.');
      return;
    }
    document.title = record.name + ' | Enterprising Taumarunui';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = record.name + ' — local Taumarunui business profile and public contact details.';

    const panel = create('article', 'business-profile');
    const kicker = create('p', 'kicker', record.category || 'Local business');
    const heading = create('h1', 'business-title', record.name);
    panel.append(kicker, heading);
    if (record.member === true) panel.append(create('span', 'member-chip member-chip-large', 'ETI member'));
    if (record.description) panel.append(create('p', 'business-lead', record.description));
    if (record.member === true && record.profile_intro) {
      panel.append(create('p', 'member-profile-intro', record.profile_intro));
    }
    if (record.member === true && Array.isArray(record.services) && record.services.length) {
      const offerings = create('section', 'member-services');
      offerings.append(create('h2', '', 'What we offer'));
      const list = create('ul');
      for (const service of record.services.slice(0, 12)) {
        if (typeof service === 'string' && service.trim()) list.append(create('li', '', service));
      }
      offerings.append(list);
      panel.append(offerings);
    }

    const details = create('div', 'business-detail-grid');
    const info = create('section', 'business-detail-panel');
    info.append(create('h2', '', 'Business details'));
    if (record.location) {
      info.append(create('h3', '', 'Location'));
      info.append(create('p', '', record.location));
      if (/\\b(street|road|terrace|avenue|drive|lane|place)\\b/i.test(record.location)) {
        const query = encodeURIComponent(record.name + ', ' + record.location + ', New Zealand');
        info.append(link('Find on Google Maps ↗', 'https://www.google.com/maps/search/?api=1&query=' + query, 'business-map-link', true));
      }
    }
    if (record.phone && phoneHref(record.phone)) {
      info.append(create('h3', '', 'Phone'));
      info.append(link(record.phone, phoneHref(record.phone), 'business-detail-link'));
    }
    const web = safeWeb(record.website);
    if (web) {
      info.append(create('h3', '', 'Website'));
      info.append(link('Visit business website ↗', web, 'business-detail-link', true));
    }
    if (!record.location && !record.phone && !web) {
      info.append(create('p', 'muted', 'Public contact details are being checked. You can request information through ETI.'));
    }
    details.append(info);
    const contact = create('aside', 'business-help-panel');
    contact.append(create('h2', '', 'Local connections'));
    contact.append(create('p', '', record.member === true
      ? 'This business has confirmed ETI membership. Membership is separate from the accuracy of individual contact details.'
      : 'This business is part of the local directory. Directory inclusion does not indicate ETI membership or endorsement.'));
    const subject = encodeURIComponent('ETI directory update: ' + record.name);
    contact.append(link('Suggest an update', 'mailto:enterprisingtaumarunui@gmail.com?subject=' + subject, 'button'));
    details.append(contact);
    panel.append(details);
    panel.append(create('p', 'directory-disclaimer', 'Public information changes over time. Please confirm opening hours, services and appointments directly with the business. ETI reviews corrections before publishing them.'));
    root.replaceChildren(panel);
  } catch (e) {
    fail('The directory could not be loaded. Please try again later.');
  }
});

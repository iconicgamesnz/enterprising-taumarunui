// Source: user-provided current ETI homepage, November 2026.
// Artwork currently references the original public site; replace with the prepared
// local poster after asset migration. No registration form submission or email.
export const christmasParade = {
  "id": "christmas-parade-2026",
  "title": "Taumarunui Christmas Parade",
  "start": "2026-12-05T12:00",
  "end": "2026-12-05T13:30",
  "location": "Hakiaha Street, Taumarunui",
  "description": "Anything Christmassy! Join businesses, schools, community groups and whānau for a festive community celebration. Register your float using the official registration form. Proudly supported by Inframax.",
  "registration": "https://docs.google.com/forms/d/e/1FAIpQLSeWarrEbIjjdau1SrZUMJwAdazrr3MSdZlLxbFgrSit3pGp-g/viewform?usp=header",
  "image": "https://taumarunui.co.nz/wp-content/uploads/2026/11/eti_christmas_santa_2026.webp",
  "imageAlt": "Santa waving beside a decorated Christmas tree",
  "source": "https://taumarunui.co.nz/",
  "href": "/events.html?id=christmas-parade-2026"
};
export function isChristmasParade2026(e){
 const title=String(e.title||'').normalize('NFKC').toLowerCase().trim().replace(/[–—-]/g,' ').replace(/\s+/g,' ');
 return String(e.start||'').slice(0,10)==='2026-12-05' && /^(?:2026 )?(?:taumarunui )?christmas parade(?: 2026)?$/.test(title);
}

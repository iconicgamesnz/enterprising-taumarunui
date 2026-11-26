import {christmasParade} from './featured-events.js';
const section=document.querySelector('#christmas-feature');
const now=new Intl.DateTimeFormat('sv-SE',{timeZone:'Pacific/Auckland',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date()).replace(' ','T');
if(section && now<=christmasParade.end)section.hidden=false;

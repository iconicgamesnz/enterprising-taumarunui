#!/usr/bin/env python3
"""Read-only fallback for public ETI event detail pages.
Run from repo root: python3 scripts/crawl-public-events.py
Optional --allow-content-reuse only once ETI confirms rights.
No email, calendar writes, auth, or backend access.
"""
import argparse, gzip, json, pathlib, time, urllib.request, urllib.parse, re, html
from html.parser import HTMLParser
from datetime import datetime
from zoneinfo import ZoneInfo
P=pathlib.Path
parser=argparse.ArgumentParser()
parser.add_argument('--allow-content-reuse',action='store_true')
parser.add_argument('--limit',type=int,default=0)
args=parser.parse_args()
rows=json.loads(gzip.decompress(P('reports/legacy-events.json.gz').read_bytes()))
checkpoint=P('reports/public-event-crawl.json')
cache=json.loads(checkpoint.read_text()) if checkpoint.exists() else {}
class Schema(HTMLParser):
    def __init__(self): super().__init__(convert_charrefs=False); self.scripts=[]; self.active=False; self.parts=[]
    def handle_starttag(self,tag,attrs):
        if tag=='script' and dict(attrs).get('type','').lower()=='application/ld+json': self.active=True; self.parts=[]
    def handle_data(self,data):
        if self.active:self.parts.append(data)
    def handle_endtag(self,tag):
        if tag=='script' and self.active:self.scripts.append(''.join(self.parts));self.active=False
def walk(v):
    if isinstance(v,dict):
        t=v.get('@type',[])
        if isinstance(t,str):t=[t]
        if any(x=='Event' or str(x).endswith('Event') for x in t):yield v
        for k,value in v.items():
            if k!='@context':yield from walk(value)
    elif isinstance(v,list):
        for item in v:yield from walk(item)
def text(v):return html.unescape(re.sub(r'<[^>]+>',' ',str(v or ''))).strip()
def normal(v):return ' '.join(text(v).casefold().split())
def local(v):
    try:
        d=datetime.fromisoformat(v.replace('Z','+00:00'))
        if d.tzinfo:d=d.astimezone(ZoneInfo('Pacific/Auckland'))
        return d.strftime('%Y-%m-%d %H:%M')
    except (TypeError,ValueError,AttributeError):return ''
def image(v):
    if isinstance(v,list):return image(v[0]) if v else ''
    if isinstance(v,dict):return image(v.get('url') or v.get('contentUrl'))
    return v if isinstance(v,str) and v.startswith('https://') else ''
def write(p,data):
    p.parent.mkdir(exist_ok=True,parents=True);tmp=p.with_suffix(p.suffix+'.tmp');tmp.write_text(json.dumps(data,ensure_ascii=False,indent=2));tmp.replace(p)
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':'IconicMahi-ETI-Migration/1.0 (public calendar reconciliation)','Accept':'text/html'})
    with urllib.request.urlopen(req,timeout=20) as response:
        final=urllib.parse.urlparse(response.geturl())
        if final.hostname not in ('taumarunui.co.nz','www.taumarunui.co.nz'):raise ValueError('Unexpected redirect')
        raw=response.read(3_000_001)
        if len(raw)>3_000_000:raise ValueError('Page too large')
        return raw.decode(response.headers.get_content_charset() or 'utf-8','replace')
count=0
for name,start,end,venue,rawslug,all_day in rows:
    slug=str(rawslug or '').strip('/')
    if slug.startswith('event/'):slug=slug[6:]
    k=slug+'|'+start
    if k in cache and cache[k].get('status')=='matched':continue
    if args.limit and count>=args.limit:break
    if not slug:
        cache[k]={'status':'missing-slug','name':name,'start':start};continue
    url='https://taumarunui.co.nz/event/'+'/'.join(urllib.parse.quote(x,safe='-') for x in slug.split('/'))+'/'
    count+=1
    try:
        h=Schema();h.feed(get(url));events=[]
        for script in h.scripts:
            try:events.extend(walk(json.loads(script)))
            except (ValueError,TypeError):pass
        matches=[e for e in events if normal(e.get('name'))==normal(name) and (local(e.get('startDate'))==local(start) or (all_day and str(e.get('startDate',''))[:10]==start[:10]))]
        if len(matches)!=1:
            cache[k]={'status':'ambiguous' if matches else 'not-matched','name':name,'start':start,'url':url}
        else:
            e=matches[0];cache[k]={'status':'matched','name':name,'start':start,'url':url,'sourceEnd':e.get('endDate'),'sourceStatus':e.get('eventStatus'),'imageCandidate':image(e.get('image')),'descriptionCandidate':text(e.get('description')) if args.allow_content_reuse else ''}
    except Exception as exc:cache[k]={'status':'unavailable','name':name,'start':start,'url':url,'reason':str(exc)[:180]}
    if count%10==0:write(checkpoint,cache)
    time.sleep(0.8)
write(checkpoint,cache)
metadata={}
for k,v in cache.items():
    if v.get('status')=='matched':
        metadata[k]={'url':v['url'],'description':v.get('descriptionCandidate','') if args.allow_content_reuse else '', 'image':v.get('imageCandidate','') if args.allow_content_reuse else '', 'imageAlt':v.get('name','')}
write(P('event-details.json'),metadata)
from collections import Counter
print('Snapshot occurrences:',len(rows),'Checked records:',len(cache),'Results:',dict(Counter(v['status'] for v in cache.values())))
print('Review missing, cancelled, changed and ambiguous events before publishing. No Google Calendar or email writes.')

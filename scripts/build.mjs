import { mkdir, readdir, copyFile, rm } from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist', {recursive:true});
for (const file of await readdir('.')) {
  if (/\.(html|js|css)$/.test(file)) {
    await copyFile(file, 'dist/' + file);
  }
}

// Each review branch uses its own persistent submission queue.
const { createHash } = await import('node:crypto');
const { writeFile } = await import('node:fs/promises');
const branch = process.env.HEAD || process.env.BRANCH || 'local';
const scope = createHash('sha256').update(branch).digest('hex').slice(0,12);
await writeFile('netlify/event-store.mjs', 'export const storeName = "eti-events-' + scope + '";\n');

const {gunzipSync} = await import('node:zlib');
const {readFile} = await import('node:fs/promises');
// Comparison report remains in project archive and is not copied to public assets.
await copyFile('redirects.txt','dist/_redirects');

await copyFile('taumarunui-history.webp','dist/taumarunui-history.webp');
await writeFile('dist/legacy-events.json',gunzipSync(await readFile('reports/legacy-events.json.gz')));

// Optional verified public event details export; no live data writes at build time.
try { await copyFile('event-details.json','dist/event-details.json'); } catch (e) { if(e.code!=='ENOENT') throw e; }

// Only publish approved baseline business records, not candidate research.
const directory = JSON.parse(await readFile('businesses.json','utf8'));
await writeFile('dist/businesses.json', JSON.stringify({businesses:directory.businesses.filter(b=>b.approved===true)}));

import { mkdir, readdir, copyFile } from 'node:fs/promises';
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
await writeFile('dist/calendar-comparison.csv',gunzipSync(await readFile('reports/calendar-comparison.csv.gz')));
await copyFile('redirects.txt','dist/_redirects');

await copyFile('taumarunui-history.webp','dist/taumarunui-history.webp');
await writeFile('dist/legacy-events.json',gunzipSync(await readFile('reports/legacy-events.json.gz')));

import { mkdir, readdir, copyFile } from 'node:fs/promises';
await mkdir('dist', {recursive:true});
for (const file of await readdir('.')) {
  if (/\.(html|js|css)$/.test(file) || file === 'businesses.json') {
    await copyFile(file, 'dist/' + file);
  }
}

// Each review branch uses its own persistent submission queue.
const { createHash } = await import('node:crypto');
const { writeFile } = await import('node:fs/promises');
const branch = process.env.HEAD || process.env.BRANCH || 'local';
const scope = createHash('sha256').update(branch).digest('hex').slice(0,12);
await writeFile('netlify/event-store.mjs', 'export const storeName = "eti-events-' + scope + '";\n');

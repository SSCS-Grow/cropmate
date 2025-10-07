import { promises as fs } from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'src');
const exts = new Set(['.ts', '.tsx']);

async function walk(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await walk(p));
    else if (exts.has(path.extname(entry.name))) out.push(p);
  }
  return out;
}

function isClientComponent(text) {
  const head = text.split('\n').slice(0, 5).join('\n');
  return /['"]use client['"]/.test(head);
}

function patch(text) {
  // const supabase = createClient()  -> const supabase = await createClient()
  // const db = createClient()        -> const db = await createClient()
  return text.replace(/\b(const\s+[A-Za-z_$][\w$]*\s*=\s*)createClient\(\)/g, '$1await createClient()');
}

(async () => {
  const files = await walk(ROOT);
  let changed = 0;
  for (const f of files) {
    let txt = await fs.readFile(f, 'utf8');
    if (isClientComponent(txt)) continue;               // rør ikke client components
    if (!txt.includes('createClient(')) continue;       // kun filer der bruger createClient
    const newTxt = patch(txt);
    if (newTxt !== txt) {
      await fs.writeFile(f, newTxt, 'utf8');
      changed++;
      console.log('Patched:', path.relative(process.cwd(), f));
    }
  }
  console.log(`Done. Patched files: ${changed}`);
})();

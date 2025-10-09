// scripts/safe-replace-imports.mjs
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const exts = new Set(['.ts', '.tsx']);
const froms = [
  '@/lib/supabase/server',
  '../lib/supabase/server',
  '../../lib/supabase/server',
  '../../../lib/supabase/server',
];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      walk(p);
    } else if (exts.has(p.slice(p.lastIndexOf('.')))) {
      let src = readFileSync(p, 'utf8');
      let changed = false;
      for (const from of froms) {
        const before = src;
        src = src.replaceAll(from, '@/utils/supabase/server');
        if (src !== before) changed = true;
      }
      if (changed) {
        writeFileSync(p, src, 'utf8'); // bevarer linjeskift
        console.log('Updated:', p);
      }
    }
  }
}

walk(join(ROOT, 'src'));
console.log('Done.');

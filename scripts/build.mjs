import { build } from 'esbuild';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(root, 'dist');
if (!output.startsWith(root)) throw new Error('Refusing to write outside the project directory.');

function loadLocalEnvironment(text) {
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*(VITE_[A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, name] = match;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[name]) process.env[name] = value;
  }
}

try {
  loadLocalEnvironment(await readFile(path.join(root, '.env.local'), 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const forbiddenKey = Object.keys(process.env).find((name) => name.startsWith('VITE_') && /SECRET|SERVICE_ROLE/i.test(name));
if (forbiddenKey) throw new Error(`A server-only Supabase secret was found in ${forbiddenKey}. Remove it; browser bundles are public.`);

await rm(output, { recursive: true, force: true });
await mkdir(path.join(output, 'assets'), { recursive: true });
const html = await readFile(path.join(root, 'index.html'), 'utf8');
await writeFile(path.join(output, 'index.html'), html, 'utf8');
await copyFile(path.join(root, 'src', 'style.css'), path.join(output, 'assets', 'nemo.css'));
await build({
  entryPoints: [path.join(root, 'src', 'main.js')],
  outfile: path.join(output, 'assets', 'nemo.js'),
  bundle: true,
  minify: true,
  sourcemap: false,
  target: ['es2020'],
  format: 'iife',
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''),
    'process.env.NODE_ENV': '"production"',
  },
});
console.log('NEMO built to dist/. Supabase credentials are optional for guest demo mode.');


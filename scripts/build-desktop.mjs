import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('dist-desktop', { recursive: true });
await build({ entryPoints: ['desktop/main.ts'], outfile: 'dist-desktop/main.cjs', platform: 'node', target: 'node24', format: 'cjs', bundle: true, external: ['electron', 'node:sqlite'], sourcemap: false });
await build({ entryPoints: ['desktop/preload.ts'], outfile: 'dist-desktop/preload.cjs', platform: 'node', target: 'node24', format: 'cjs', bundle: true, external: ['electron'], sourcemap: false });
await mkdir('dist-server', { recursive: true });
await build({ entryPoints: ['server/index.ts', 'server/mcp.ts'], outdir: 'dist-server', outExtension: { '.js': '.mjs' }, platform: 'node', target: 'node22', format: 'esm', bundle: true, external: ['node:sqlite'], banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" } });
await writeFile('dist-desktop/package.json', JSON.stringify({ private: true, type: 'commonjs' }));
console.log('Built desktop runtime, preload, local server and MCP bridge. Packaging and install verification are separate steps.');

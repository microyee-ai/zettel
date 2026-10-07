import { build } from 'esbuild';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

await mkdir('dist-desktop', { recursive: true });
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
// Capture source provenance before bundling. Candidate verification compares this
// embedded record with the checkout, rather than assigning its SHA to any binary.
const buildInfo = {
  version: pkg.version,
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  sourceDirty: !!execFileSync('git', ['status', '--porcelain', '--untracked-files=normal'], { encoding: 'utf8' }).trim(),
};
await writeFile('dist-desktop/build-info.json', JSON.stringify(buildInfo, null, 2) + '\n');
await build({ entryPoints: ['desktop/main.ts'], outfile: 'dist-desktop/main.cjs', platform: 'node', target: 'node24', format: 'cjs', bundle: true, external: ['electron', 'node:sqlite'], sourcemap: false });
await build({ entryPoints: ['desktop/preload.ts'], outfile: 'dist-desktop/preload.cjs', platform: 'node', target: 'node24', format: 'cjs', bundle: true, external: ['electron'], sourcemap: false });
await mkdir('dist-server', { recursive: true });
await build({ entryPoints: ['server/index.ts', 'server/mcp.ts'], outdir: 'dist-server', outExtension: { '.js': '.mjs' }, platform: 'node', target: 'node22', format: 'esm', bundle: true, external: ['node:sqlite'], banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" } });
await writeFile('dist-desktop/package.json', JSON.stringify({ private: true, type: 'commonjs' }));
console.log('Built desktop runtime, preload, local server and MCP bridge. Packaging and install verification are separate steps.');

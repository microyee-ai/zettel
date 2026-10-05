import { execFileSync } from 'node:child_process';
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

await mkdir('build', { recursive: true });
// All arguments here are fixed program constants, never user input.
const npm = args => execFileSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, { encoding: 'utf8', shell: process.platform === 'win32' });
const packages = JSON.parse(npm(['query', '.prod']));
const notices = ['Zettel third-party notices\nGenerated from the installed production dependency graph.\nElectron/Chromium notices are also included in their distributed framework.\n', await readFile('LICENSE', 'utf8')];
const missing = [];
for (const pkg of packages.sort((a, b) => a.name.localeCompare(b.name))) {
  if (!pkg.location) continue;
  notices.push(`\n${'='.repeat(72)}\n${pkg.name}@${pkg.version}\nDeclared license: ${typeof pkg.license === 'string' ? pkg.license : JSON.stringify(pkg.license)}\n`);
  const files = (await readdir(pkg.location)).filter(name => /^(licen[cs]e|copying|notice|ofl)(\.|$|-)/i.test(name));
  if (!files.length) missing.push(pkg.name);
  for (const file of files) { try { notices.push(`${file}\n${await readFile(join(pkg.location, file), 'utf8')}`); } catch { /* Directories do not contain a top-level notice. */ } }
}
await writeFile('build/THIRD_PARTY_NOTICES.txt', notices.join('\n').replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, ''));
await writeFile('build/sbom.cdx.json', npm(['sbom', '--omit=dev', '--sbom-format=cyclonedx']));
console.log(`Collected notices for ${packages.length} production packages. Missing top-level license files: ${missing.join(', ') || 'none'}`);

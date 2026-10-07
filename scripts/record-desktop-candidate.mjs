// Create a non-publishing manifest, rejecting stale or mismatched verification.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFile, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { arch, platform } from 'node:os';
import { join, resolve } from 'node:path';
const directory = resolve(process.argv[2] || 'release');
const pkg = JSON.parse(await readFile('package.json', 'utf8'));
const sourceCommit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const names = (await readdir(directory)).filter(name => name.includes(pkg.version) && /\.(zip|dmg|exe|AppImage)$/.test(name)).sort();
if (!names.length) throw new Error('No version-matched packaged candidates found');
const files = []; const verification = []; const screenshots = [];
async function digest(path) { return createHash('sha256').update(await readFile(path)).digest('hex'); }
for (const name of names) {
  const path = join(directory, name); const sha256 = await digest(path);
  const relativeReport = `verification/${name}.json`;
  let check;
  try { check = JSON.parse(await readFile(join(directory, relativeReport), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (check && (check.artifact?.sha256 !== sha256 || check.source?.commit !== sourceCommit || check.version !== pkg.version)) throw new Error(`Stale verification evidence: ${name}`);
  if (check?.status === 'passed' && (check.buildProvenance?.sourceCommit !== sourceCommit || check.buildProvenance?.version !== pkg.version || typeof check.buildProvenance?.sourceDirty !== 'boolean')) throw new Error(`Missing or mismatched embedded build provenance: ${name}`);
  if (check?.screenshot) {
    if (check.screenshot.path !== `verification/${name}.png`) throw new Error(`Unexpected screenshot path: ${name}`);
    if (await digest(join(directory, check.screenshot.path)) !== check.screenshot.sha256) throw new Error(`Mismatched screenshot digest: ${name}`);
    screenshots.push({ name: check.screenshot.path, sha256: check.screenshot.sha256 });
  }
  files.push({ name, bytes: (await stat(path)).size, sha256 });
  verification.push({ artifact: name, artifactSha256: sha256, status: check?.status || 'not-run', evidence: check ? relativeReport : null,
    evidenceSha256: check ? await digest(join(directory, relativeReport)) : null, buildProvenance: check?.buildProvenance || null });
}
for (const name of ['THIRD_PARTY_NOTICES.txt', 'sbom.cdx.json']) {
  await copyFile(join('build', name), join(directory, name));
  files.push({ name, bytes: (await stat(join(directory, name))).size, sha256: await digest(join(directory, name)) });
}
const manifest = { schemaVersion: 1, product: 'Zettel', version: pkg.version, sourceCommit,
  trackedTreeDirty: !!execFileSync('git', ['diff', 'HEAD', '--name-only'], { encoding: 'utf8' }).trim(),
  runUrl: process.env.ZETTEL_WORKFLOW_RUN_URL || null, platform: process.env.ZETTEL_CANDIDATE_PLATFORM || { darwin: 'macos', win32: 'windows', linux: 'linux' }[platform()],
  architecture: process.env.ZETTEL_CANDIDATE_ARCH || arch(), nodeVersion: process.version, electronVersion: pkg.devDependencies.electron,
  publisherSigning: 'Not configured; developer build candidate', publishedRelease: false,
  installVerification: { status: verification.every(item => item.status === 'passed') ? 'passed' : verification.some(item => item.status === 'failed') ? 'failed' : 'incomplete', scope: 'Automated extraction/install and packaged-app checks only; see per-artifact evidence and unverified gates', artifacts: verification }, files };
await writeFile(join(directory, 'artifact-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
const checksumFiles = [...files, ...screenshots, ...verification.filter(item => item.evidence).map(item => ({ name: item.evidence, sha256: item.evidenceSha256 })), { name: 'artifact-manifest.json', sha256: await digest(join(directory, 'artifact-manifest.json')) }];
await writeFile(join(directory, 'SHA256SUMS'), checksumFiles.map(file => `${file.sha256}  ${file.name}`).join('\n') + '\n');
console.log(`Recorded ${files.length} files; automated install verification: ${manifest.installVerification.status}. No release was published.`);
if (manifest.installVerification.status !== 'passed') process.exitCode = 1;

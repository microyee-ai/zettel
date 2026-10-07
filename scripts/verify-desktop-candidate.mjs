// Verify the distribution bytes, never electron-builder's unpacked staging app.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { arch, platform, release, tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
const options = { directory: resolve(root, 'release'), output: undefined, artifacts: [], linuxSandboxHelper: false, allowNsisInstall: false };
for (let index = 2; index < process.argv.length; index++) {
  const arg = process.argv[index];
  if (arg === '--linux-sandbox-helper') options.linuxSandboxHelper = true;
  else if (arg === '--allow-nsis-install') options.allowNsisInstall = true;
  else if (['--dir', '--output-dir', '--artifact'].includes(arg)) {
    const value = process.argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
    if (arg === '--artifact') options.artifacts.push(resolve(value));
    else options[arg === '--dir' ? 'directory' : 'output'] = resolve(value);
  } else throw new Error(`Unknown argument: ${arg}`);
}
const output = options.output || join(options.directory, 'verification');
await mkdir(output, { recursive: true });
const platformName = { darwin: 'macos', win32: 'windows', linux: 'linux' }[platform()];
assert.ok(platformName, 'Unsupported verification host');
const extensions = { darwin: ['.zip', '.dmg'], win32: ['.exe'], linux: ['.AppImage'] }[platform()];
const artifacts = options.artifacts.length ? options.artifacts : (await readdir(options.directory)).filter(name => name.includes(pkg.version) && extensions.some(extension => name.endsWith(extension))).sort().map(name => join(options.directory, name));
assert.ok(artifacts.length, `No ${platformName} ${pkg.version} artifacts found`);
if (!options.artifacts.length) for (const extension of extensions) assert.ok(artifacts.some(path => path.endsWith(extension)), `Missing ${extension} distribution`);
function command(binary, args, { cwd = root, timeout = 60000, env = process.env, windowsVerbatimArguments = false } = {}) {
  return new Promise((resolveCommand, reject) => {
    const child = spawn(binary, args, { cwd, env, windowsVerbatimArguments, detached: platform() !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = ''; let timedOut = false;
    child.stdout.on('data', data => { stdout = (stdout + data).slice(-1000000); });
    child.stderr.on('data', data => { stderr = (stderr + data).slice(-1000000); });
    const timer = setTimeout(() => {
      timedOut = true;
      if (platform() === 'win32') spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
      else {
        // Give Playwright's SIGTERM handler a chance to close Electron. Then reap
        // the entire owned process group so timed-out smoke runs cannot leak apps.
        child.kill('SIGTERM');
        const cleanup = setTimeout(() => { try { process.kill(-child.pid, 'SIGKILL'); } catch {} }, 5000);
        // Keep the cleanup timer alive even if the verifier child exits first.
      }
    }, timeout);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('close', (code, signal) => {
      clearTimeout(timer);
      if (code !== 0 || timedOut) reject(new Error(`${basename(binary)} ${args[0] || ''} ${timedOut ? 'timed out' : `exited ${code ?? signal}`}\n${stderr}\n${stdout}`));
      else resolveCommand({ stdout, stderr });
    });
  });
}
const sourceCommit = (await command('git', ['rev-parse', 'HEAD'])).stdout.trim();
const sourceDiff = (await command('git', ['diff', 'HEAD', '--binary'])).stdout;
const source = { commit: sourceCommit, trackedTreeDirty: !!sourceDiff, trackedDiffSha256: sourceDiff ? createHash('sha256').update(sourceDiff).digest('hex') : null,
  workflowRunUrl: process.env.ZETTEL_WORKFLOW_RUN_URL || null };
let failures = 0;
for (const artifact of artifacts) {
  const bytes = await readFile(artifact);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const name = basename(artifact);
  const reportPath = join(output, `${name}.json`);
  const workspace = await mkdtemp(join(tmpdir(), 'zettel-candidate-'));
  const evidence = { schemaVersion: 1, product: 'Zettel', version: pkg.version, status: 'running', startedAt: new Date().toISOString(),
    artifact: { name, bytes: bytes.length, sha256 }, source, host: { platform: platformName, architecture: arch(), osRelease: release(), node: process.version, githubActions: process.env.GITHUB_ACTIONS === 'true', runnerImage: process.env.ImageOS || null },
    installation: { status: 'not-run' }, smoke: { status: 'not-run' }, cleanup: { status: 'not-run' },
    unverified: ['Manual clean-host installation and native file dialogs', 'Publisher identity, notarization and OS trust prompts', 'Upgrade from an earlier supported version', 'Automatic updates', 'External AI provider'] };
  let mounted = false; let uninstaller; let helper; let stage = 'artifact-installation';
  const mount = join(workspace, 'mounted');
  try {
    assert.ok(extensions.some(extension => artifact.endsWith(extension)), 'Artifact extension does not match this host');
    let executable;
    if (platform() === 'darwin') {
      const installed = join(workspace, 'installed');
      await mkdir(installed);
      if (artifact.endsWith('.zip')) {
        await command('ditto', ['-x', '-k', artifact, installed]);
        evidence.installation.method = 'Actual ZIP extracted with ditto';
      } else {
        await mkdir(mount);
        await command('hdiutil', ['verify', artifact]);
        await command('hdiutil', ['attach', '-readonly', '-nobrowse', '-mountpoint', mount, artifact]); mounted = true;
        await command('ditto', [join(mount, 'Zettel.app'), join(installed, 'Zettel.app')]);
        await command('hdiutil', ['detach', mount]); mounted = false;
        evidence.installation.method = 'Actual DMG verified, mounted read-only, app copied out, image detached before launch';
      }
      executable = join(installed, 'Zettel.app', 'Contents', 'MacOS', 'Zettel');
      await command('codesign', ['--verify', '--deep', '--strict', join(installed, 'Zettel.app')]);
      const signing = await command('codesign', ['-dv', '--verbose=2', join(installed, 'Zettel.app')]);
      evidence.installation.signatureIntegrity = 'passed';
      evidence.installation.signingDetails = signing.stderr.trim();
    } else if (platform() === 'win32') {
      assert.ok(process.env.GITHUB_ACTIONS === 'true' || options.allowNsisInstall, 'NSIS modifies per-user installation registration. Use a disposable Windows account and opt in with --allow-nsis-install.');
      const existing = await command('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', "$entries = Get-ItemProperty 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' -ErrorAction SilentlyContinue; if ($entries | Where-Object { $_.DisplayName -eq 'Zettel' }) { throw 'Existing Zettel installation found; use a clean account' }"]);
      assert.equal(existing.stdout.trim(), '');
      const installed = join(workspace, 'installed');
      // NSIS requires /D last and its path unquoted, even when it contains spaces.
      await command(artifact, ['/S', '/currentuser', `/D=${installed}`], { timeout: 180000, windowsVerbatimArguments: true });
      executable = join(installed, 'Zettel.exe');
      uninstaller = join(installed, 'Uninstall Zettel.exe');
      evidence.installation.method = 'Actual NSIS installer run silently per-user into an isolated directory';
      evidence.unverified.push('Interactive NSIS wizard and SmartScreen behavior');
    } else {
      await chmod(artifact, 0o755);
      await command(artifact, ['--appimage-extract'], { cwd: workspace });
      executable = join(workspace, 'squashfs-root', 'zettel');
      evidence.installation.method = 'Actual AppImage self-extracted; launch the Electron binary shipped in that AppDir';
      evidence.unverified.push('FUSE mount/direct AppImage launch, desktop integration and other Linux distributions');
      if (options.linuxSandboxHelper) {
        // Only the disposable artifact's Chromium helper changes. No global policy changes.
        helper = join(workspace, 'squashfs-root', 'chrome-sandbox');
        await command('sudo', ['-n', 'chown', 'root:root', helper]);
        await command('sudo', ['-n', 'chmod', '4755', helper]);
        const helperStat = await stat(helper);
        assert.equal(helperStat.uid, 0); assert.equal(helperStat.mode & 0o7777, 0o4755);
        evidence.installation.sandboxHelper = 'Bundled chrome-sandbox root-owned mode 4755 in disposable AppDir';
      } else evidence.installation.sandboxHelper = 'Host sandbox policy unchanged';
    }
    assert.ok((await stat(executable)).isFile(), 'Installed executable must exist');
    evidence.installation.status = 'passed';
    stage = 'packaged-app-smoke';
    const smokePath = join(workspace, 'smoke.json');
    try {
      await command(process.execPath, ['--import', 'tsx', join(root, 'tests/server-desktop-smoke.ts'), executable], {
        timeout: 240000, env: { ...process.env, ZETTEL_EXPECTED_VERSION: pkg.version, ZETTEL_EXPECTED_SOURCE_COMMIT: sourceCommit, ZETTEL_EXPECTED_ARCH: process.env.ZETTEL_CANDIDATE_ARCH || arch(), ZETTEL_SMOKE_EVIDENCE: smokePath, ZETTEL_SMOKE_SCREENSHOT: join(output, `${name}.png`) },
      });
    } finally {
      try { evidence.smoke = JSON.parse(await readFile(smokePath, 'utf8')); }
      catch { evidence.smoke = { status: 'failed', error: 'Smoke process did not produce evidence' }; }
    }
    assert.equal(evidence.smoke.status, 'passed');
    evidence.buildProvenance = evidence.smoke.runtime.buildInfo;
    evidence.screenshot = { path: `verification/${name}.png`, sha256: createHash('sha256').update(await readFile(join(output, `${name}.png`))).digest('hex') };
    evidence.status = 'passed';
  } catch (error) {
    evidence.status = 'failed'; evidence.failedStage = stage; evidence.error = error instanceof Error ? error.message : String(error);
  } finally {
    try {
      if (mounted) await command('hdiutil', ['detach', mount]);
      if (uninstaller) {
        await command(uninstaller, ['/S', '/currentuser'], { timeout: 90000 });
        // NSIS may re-exec its uninstaller in TEMP and return before deletion completes.
        for (let attempt = 0; attempt < 100; attempt++) {
          if (!(await stat(uninstaller).catch(() => null))) break;
          await new Promise(resolveDelay => setTimeout(resolveDelay, 100));
        }
        assert.equal(await stat(uninstaller).catch(() => null), null, 'NSIS uninstall must finish before temporary cleanup');
        evidence.cleanup.nsisUninstall = 'passed';
      }
      if (helper) await command('sudo', ['-n', 'chmod', '0755', helper]);
      await rm(workspace, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
      evidence.cleanup.status = 'passed';
    } catch (error) { evidence.status = 'failed'; evidence.cleanup = { status: 'failed', error: error instanceof Error ? error.message : String(error), retainedPath: workspace }; }
    evidence.completedAt = new Date().toISOString();
    await writeFile(reportPath, JSON.stringify(evidence, null, 2) + '\n');
    console.log(`${evidence.status.toUpperCase()} ${name}: ${reportPath}`);
    if (evidence.status !== 'passed') { failures++; console.error(evidence.error || evidence.cleanup.error); }
  }
}
if (failures) process.exitCode = 1;

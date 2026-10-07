import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { _electron, type ElectronApplication } from 'playwright';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Explicit opt-in integration command. Never uses the user's workspace or profile.
const packagedExecutable = process.argv[2];
const executablePath: string = packagedExecutable ? resolve(packagedExecutable) : createRequire(import.meta.url)('electron');
const directory = mkdtempSync(join(tmpdir(), 'zettel-desktop-smoke-'));
const environment = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] =>
  typeof entry[1] === 'string' && !['ELECTRON_RUN_AS_NODE', 'NODE_OPTIONS', 'CHROME_DEVEL_SANDBOX', 'ELECTRON_DISABLE_SANDBOX'].includes(entry[0]) && !entry[0].startsWith('ZETTEL_AI_')));
const evidence: Record<string, unknown> = { schemaVersion: 1, status: 'running', startedAt: new Date().toISOString(), executable: executablePath, packaged: !!packagedExecutable, platform: process.platform, architecture: process.arch, checks: {} };
const checks = evidence.checks as Record<string, unknown>;
let app: ElectronApplication | undefined;
let pendingLaunch: Promise<ElectronApplication> | undefined;
let activeClient: Client | undefined;
let interrupted = false;
const launch = () => {
  if (interrupted) throw new Error('Verification was interrupted');
  const launching = _electron.launch({ executablePath, args: [...(packagedExecutable ? [] : [resolve('.')]), `--user-data-dir=${join(directory, 'profile')}`], cwd: directory,
    chromiumSandbox: true, env: { ...environment, ZETTEL_DATA_DIR: directory }, timeout: 30000 });
  pendingLaunch = launching;
  void launching.then(() => { pendingLaunch = undefined; }, () => { pendingLaunch = undefined; });
  return launching;
};
let interrupt!: (error: Error) => void;
const interruption = new Promise<never>((_, reject) => { interrupt = reject; });
const terminate = () => { interrupted = true; interrupt(new Error('Desktop verification interrupted by SIGTERM')); };
process.on('SIGTERM', terminate);
const watchdog = setTimeout(() => { interrupted = true; interrupt(new Error('Desktop smoke exceeded its 180-second deadline')); }, 180000);
let stage = 'launch';
async function bounded<T>(operation: Promise<T>, timeout: number, description: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([operation, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error(`${description} timed out`)), timeout); })]); }
  finally { clearTimeout(timer); }
}
async function quit() {
  if (!app) return;
  const closing = app;
  const child = closing.process();
  try {
    await bounded(closing.close(), 15000, 'Graceful application quit');
    assert.ok(child.exitCode !== null || child.signalCode !== null, 'Electron launch process must have exited');
    assert.equal(existsSync(join(directory, 'desktop-connection.json')), false, 'Graceful quit removes the service connection file');
    app = undefined;
  } catch (error) {
    if (child.pid) {
      if (process.platform === 'win32') spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' }).on('error', () => {});
      else { try { process.kill(-child.pid, 'SIGKILL'); } catch { child.kill('SIGKILL'); } }
    }
    await bounded(new Promise<void>(resolveExit => { if (child.exitCode !== null || child.signalCode !== null) resolveExit(); else child.once('exit', () => resolveExit()); }), 5000, 'Failed application cleanup').catch(() => {});
    app = undefined;
    throw error;
  }
}
async function runSmoke() {
  app = await launch(); let page = await app.firstWindow();
  app.context().setDefaultTimeout(15000);
  await page.getByRole('button', { name: 'New ticket' }).first().waitFor();
  const runtime = await app.evaluate(({ app: electronApp, BrowserWindow }) => {
    // Electron exposes this diagnostic at runtime but omits it from public typings.
    const contents = BrowserWindow.getAllWindows()[0].webContents as unknown as { getLastWebPreferences(): Record<string, unknown> };
    const prefs = contents.getLastWebPreferences();
    const fs = process.getBuiltinModule('fs');
    const path = process.getBuiltinModule('path');
    const buildInfoPath = path.join(electronApp.getAppPath(), 'dist-desktop', 'build-info.json');
    const buildInfo = fs.existsSync(buildInfoPath) ? JSON.parse(fs.readFileSync(buildInfoPath, 'utf8')) : null;
    const forbiddenFlags = ['no-sandbox', 'disable-setuid-sandbox', 'disable-seccomp-filter-sandbox', 'disable-namespace-sandbox', 'disable-web-security'];
    return { version: electronApp.getVersion(), packaged: electronApp.isPackaged, architecture: process.arch, electron: process.versions.electron, node: process.versions.node,
      resourcesPath: process.resourcesPath, buildInfo, sandboxDisablingFlags: forbiddenFlags.filter(flag => electronApp.commandLine.hasSwitch(flag)),
      preferences: { sandbox: prefs.sandbox, contextIsolation: prefs.contextIsolation, nodeIntegration: prefs.nodeIntegration, webSecurity: prefs.webSecurity } };
  });
  evidence.runtime = runtime;
  assert.equal(runtime.packaged, !!packagedExecutable);
  if (process.env.ZETTEL_EXPECTED_VERSION) assert.equal(runtime.version, process.env.ZETTEL_EXPECTED_VERSION);
  if (process.env.ZETTEL_EXPECTED_ARCH) assert.equal(runtime.architecture, process.env.ZETTEL_EXPECTED_ARCH);
  if (packagedExecutable) {
    assert.ok(runtime.buildInfo, 'Packaged app must contain its build provenance');
    assert.equal(runtime.buildInfo.version, runtime.version);
    assert.equal(typeof runtime.buildInfo.sourceCommit, 'string');
    assert.match(runtime.buildInfo.sourceCommit, /^[a-f0-9]{40}$/);
    assert.equal(typeof runtime.buildInfo.sourceDirty, 'boolean');
    if (process.env.ZETTEL_EXPECTED_SOURCE_COMMIT) assert.equal(runtime.buildInfo.sourceCommit, process.env.ZETTEL_EXPECTED_SOURCE_COMMIT);
    if (process.env.GITHUB_ACTIONS === 'true') assert.equal(runtime.buildInfo.sourceDirty, false, 'CI candidates must be built from a clean source tree');
    checks.embeddedBuildProvenance = true;
  }
  checks.runtimeMatchesRequestedMode = true;
  stage = 'renderer-isolation';
  assert.deepEqual(runtime.sandboxDisablingFlags, []);
  assert.deepEqual(runtime.preferences, { sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true });
  const bridge = await page.evaluate(async () => ({ keys: Object.keys(window.zettel || {}).sort(), requireType: typeof (window as unknown as { require?: unknown }).require, processType: typeof (window as unknown as { process?: unknown }).process, info: await window.zettel!.info() }));
  assert.deepEqual(bridge.keys, ['info', 'load', 'propose', 'save']);
  assert.equal(bridge.requireType, 'undefined'); assert.equal(bridge.processType, 'undefined');
  assert.equal(resolve(bridge.info.storagePath!), join(directory, 'workspace.sqlite')); assert.equal(bridge.info.aiConfigured, false);
  checks.rendererIsolation = true; checks.narrowPreload = true; checks.sandboxDisablingFlagsAbsent = true;
  stage = 'ui-create';
  await page.getByRole('button', { name: 'New ticket' }).first().click();
  await page.getByRole('dialog').getByLabel('Title', { exact: true }).fill('Desktop survives restart');
  await page.getByRole('dialog').getByRole('button', { name: 'Create ticket', exact: true }).click();
  await page.waitForFunction(async () => (await window.zettel!.load()).issues.some(issue => issue.title === 'Desktop survives restart'));
  const before = await page.evaluate(() => window.zettel!.load());
  assert.equal(before.issues[0].identifier, 'ZET-1'); checks.uiCreate = true;
  stage = 'navigation-boundary';
  const originalUrl = page.url();
  assert.equal(await page.evaluate(() => window.open('https://example.com') === null), true);
  await page.evaluate(() => { window.location.href = 'https://example.com'; });
  await page.waitForTimeout(200); assert.equal(page.url(), originalUrl);
  const navigationState = await app.evaluate(({ BrowserWindow }) => {
    const contents = BrowserWindow.getAllWindows()[0].webContents;
    return { url: contents.getURL(), loading: contents.isLoading() };
  });
  assert.deepEqual(navigationState, { url: originalUrl, loading: false });
  assert.equal(await page.evaluate(() => document.body.textContent?.includes('Desktop survives restart')), true);
  assert.equal(app.windows().length, 1); checks.blockedNavigationAndPopup = true;
  // Chromium canceled the foreign navigation, but CDP can leave Playwright's
  // pending-navigation bookkeeping active. Reload the proven local document
  // before further UI interaction; retain all boundary assertions above.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /ZET-1 Desktop survives restart/ }).waitFor();
  stage = 'single-instance-lifecycle';
  const connectionBeforeSecondLaunch = readFileSync(join(directory, 'desktop-connection.json'), 'utf8');
  if (process.platform === 'darwin') {
    const closed = page.waitForEvent('close');
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].close(); });
    await closed;
    assert.equal(app.windows().length, 0);
  }
  const secondary = spawn(executablePath, [...(packagedExecutable ? [] : [resolve('.')]), `--user-data-dir=${join(directory, 'profile')}`], {
    cwd: directory, env: { ...environment, ZETTEL_DATA_DIR: directory }, stdio: 'ignore',
  });
  try {
    const secondaryExit = await bounded(new Promise<number | null>((resolveExit, reject) => {
      secondary.once('error', reject); secondary.once('exit', code => resolveExit(code));
    }), 15000, 'Second launch exits after activating the existing instance');
    assert.equal(secondaryExit, 0);
  } finally { if (secondary.exitCode === null && secondary.signalCode === null) secondary.kill('SIGKILL'); }
  page = await app.firstWindow();
  await page.getByRole('button', { name: /ZET-1 Desktop survives restart/ }).waitFor();
  assert.equal(app.windows().length, 1);
  assert.equal(readFileSync(join(directory, 'desktop-connection.json'), 'utf8'), connectionBeforeSecondLaunch);
  checks.secondLaunchUsesExistingWorkspace = true;
  if (process.platform === 'darwin') checks.windowlessAppReopensOnSecondLaunch = true;
  stage = 'quit-and-restart';
  await quit(); checks.gracefulQuit = true;
  app = await launch(); app.context().setDefaultTimeout(15000); page = await app.firstWindow();
  await page.getByRole('button', { name: /ZET-1 Desktop survives restart/ }).waitFor();
  const restored = await page.evaluate(() => window.zettel!.load());
  assert.deepEqual(restored, before); checks.persistedAfterRestart = true;
  stage = 'bundled-mcp';
  const client = new Client({ name: 'desktop-bundle-verifier', version: '1.0.0' }); activeClient = client;
  const bridgePath = packagedExecutable ? join(runtime.resourcesPath, 'mcp.mjs') : resolve('dist-server/mcp.mjs');
  assert.ok(existsSync(bridgePath), 'The installed distribution must contain its own MCP bridge');
  try {
    await bounded(client.connect(new StdioClientTransport({ command: executablePath, args: [bridgePath], cwd: directory, env: { ...environment, ELECTRON_RUN_AS_NODE: '1', ZETTEL_CONNECTION_FILE: join(directory, 'desktop-connection.json') }, stderr: 'pipe' })), 20000, 'Bundled MCP handshake');
    const created = await client.callTool({ name: 'zettel_create_issue', arguments: { title: 'Packaged MCP uses the desktop workspace' } }, undefined, { timeout: 15000 });
    assert.ok(!created.isError);
    await page.reload();
    await page.getByRole('button', { name: /ZET-2 Packaged MCP uses the desktop workspace/ }).waitFor();
    checks.bundledMcpSharedStorage = true;
  } finally { await bounded(client.close(), 10000, 'MCP close'); activeClient = undefined; }
  stage = 'native-export';
  await page.getByRole('button', { name: 'Settings & backups' }).click();
  stage = 'documentation-handoff';
  await app.evaluate(({ shell }) => {
    const diagnostic = globalThis as unknown as { zettelExternalCalls: string[]; zettelOriginalOpenExternal: typeof shell.openExternal };
    diagnostic.zettelExternalCalls = []; diagnostic.zettelOriginalOpenExternal = shell.openExternal;
    shell.openExternal = async url => { diagnostic.zettelExternalCalls.push(url); };
  });
  await page.getByRole('link', { name: 'Local setup guide', exact: true }).click();
  await page.waitForTimeout(150);
  const documentationCalls = await app.evaluate(({ shell }) => {
    const diagnostic = globalThis as unknown as { zettelExternalCalls: string[]; zettelOriginalOpenExternal: typeof shell.openExternal };
    shell.openExternal = diagnostic.zettelOriginalOpenExternal;
    return diagnostic.zettelExternalCalls;
  });
  assert.deepEqual(documentationCalls, ['https://github.com/microyee-ai/zettel/blob/v0.1.0-alpha.2/docs/local-runtime.md']);
  assert.equal(app.windows().length, 1); checks.documentationNativeHandoff = true;
  stage = 'native-export';
  const backupPath = join(directory, 'verified-backup.json');
  // Exercise Electron's actual download; only the OS save-path selection is automated.
  await app.evaluate(({ session }, path) => {
    const diagnostic = globalThis as unknown as { zettelSmokeDownload?: string };
    diagnostic.zettelSmokeDownload = 'pending';
    session.defaultSession.once('will-download', (_event, item) => {
      item.setSavePath(path);
      item.once('done', (_downloadEvent, state) => { diagnostic.zettelSmokeDownload = state; });
    });
  }, backupPath);
  await page.getByRole('button', { name: 'Export backup', exact: true }).click();
  let downloadState = 'pending';
  for (let attempt = 0; attempt < 200 && downloadState === 'pending'; attempt++) {
    downloadState = await app.evaluate(() => (globalThis as unknown as { zettelSmokeDownload: string }).zettelSmokeDownload);
    if (downloadState === 'pending') await new Promise(resolveDelay => setTimeout(resolveDelay, 50));
  }
  assert.equal(downloadState, 'completed', 'Native Electron download must finish');
  const exported = JSON.parse(readFileSync(backupPath, 'utf8'));
  assert.equal(exported.issues.length, 2);
  const connection = JSON.parse(readFileSync(join(directory, 'desktop-connection.json'), 'utf8'));
  assert.ok(!readFileSync(backupPath, 'utf8').includes(connection.token)); checks.nativeExport = true; checks.exportExcludesServiceToken = true;
  stage = 'reset-and-restore';
  await page.getByRole('button', { name: 'Reset workspace', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset workspace', exact: true }).click();
  await page.waitForFunction(async () => (await window.zettel!.load()).issues.length === 0);
  await page.getByRole('button', { name: 'Settings & backups' }).click();
  await page.locator('input[type="file"]').setInputFiles(backupPath);
  await page.getByRole('dialog').getByRole('button', { name: 'Back up & restore' }).click();
  await page.waitForFunction(async () => (await window.zettel!.load()).issues.length === 2);
  const imported = await page.evaluate(() => window.zettel!.load());
  assert.deepEqual(imported.issues, exported.issues); checks.guiResetRestore = true;
  stage = 'restored-data-restart';
  await quit();
  app = await launch(); app.context().setDefaultTimeout(15000); page = await app.firstWindow();
  await page.getByRole('button', { name: /ZET-2 Packaged MCP uses the desktop workspace/ }).waitFor();
  assert.deepEqual(await page.evaluate(() => window.zettel!.load()), imported);
  checks.restoredDataSurvivesRestart = true;
  if (process.env.ZETTEL_SMOKE_SCREENSHOT) {
    mkdirSync(dirname(resolve(process.env.ZETTEL_SMOKE_SCREENSHOT)), { recursive: true });
    await page.screenshot({ path: process.env.ZETTEL_SMOKE_SCREENSHOT, fullPage: true });
    checks.renderedWorkspaceScreenshot = true;
  }
  stage = 'final-quit'; await quit();
}
try {
  await Promise.race([runSmoke(), interruption]);
  evidence.status = 'passed';
} catch (error) {
  evidence.status = 'failed'; evidence.failedStage = stage; evidence.error = error instanceof Error ? error.message : String(error);
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog);
  process.removeListener('SIGTERM', terminate);
  const cleanupErrors: string[] = [];
  const attemptCleanup = async (name: string, operation: () => Promise<void>) => {
    try { await operation(); } catch (error) { cleanupErrors.push(`${name}: ${error instanceof Error ? error.message : String(error)}`); }
  };
  await attemptCleanup('Pending launch', async () => { if (pendingLaunch) app = await bounded(pendingLaunch, 35000, 'Interrupted launch cleanup'); });
  await attemptCleanup('MCP', async () => { if (activeClient) await bounded(activeClient.close(), 10000, 'Interrupted MCP cleanup'); });
  // Always attempt Electron shutdown, including when MCP cleanup has failed.
  await attemptCleanup('Electron', quit);
  if (!cleanupErrors.length) await attemptCleanup('Disposable data', async () => { rmSync(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 }); });
  checks.disposableDataCleaned = cleanupErrors.length === 0;
  if (cleanupErrors.length) {
    evidence.status = 'failed'; evidence.cleanupErrors = cleanupErrors; evidence.retainedDataPath = directory; process.exitCode = 1;
  }
  evidence.completedAt = new Date().toISOString();
  if (process.env.ZETTEL_SMOKE_EVIDENCE) {
    mkdirSync(dirname(resolve(process.env.ZETTEL_SMOKE_EVIDENCE)), { recursive: true });
    writeFileSync(process.env.ZETTEL_SMOKE_EVIDENCE, JSON.stringify(evidence, null, 2) + '\n');
  }
  console.log(JSON.stringify(evidence, null, 2));
}

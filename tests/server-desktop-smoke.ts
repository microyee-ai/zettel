import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { _electron, type ElectronApplication } from 'playwright';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Explicit opt-in integration command. All writes use a disposable data directory.
const packagedExecutable = process.argv[2];
const executablePath = packagedExecutable ? resolve(packagedExecutable) : resolve('node_modules/electron/dist/Electron.app/Contents/MacOS/Electron');
const directory = mkdtempSync(join(tmpdir(), 'zettel-desktop-smoke-'));
const environment = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[0] !== 'ELECTRON_RUN_AS_NODE'));
const launch = () => _electron.launch({ executablePath, args: packagedExecutable ? [] : ['.'], cwd: process.cwd(), env: { ...environment, ZETTEL_DATA_DIR: directory }, timeout: 30000 });
let app: ElectronApplication | undefined;
try {
  app = await launch(); let page = await app.firstWindow();
  await page.getByRole('button', { name: 'New ticket' }).first().waitFor();
  const preferences = await app.evaluate(({ BrowserWindow }) => {
    // Electron exposes this diagnostic at runtime but omits it from public typings.
    const contents = BrowserWindow.getAllWindows()[0].webContents as unknown as { getLastWebPreferences(): Record<string, unknown> };
    const prefs = contents.getLastWebPreferences();
    return { sandbox: prefs.sandbox, contextIsolation: prefs.contextIsolation, nodeIntegration: prefs.nodeIntegration, webSecurity: prefs.webSecurity };
  });
  assert.deepEqual(preferences, { sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true });
  const bridge = await page.evaluate(async () => ({ keys: Object.keys(window.zettel || {}).sort(), requireType: typeof (window as unknown as { require?: unknown }).require, processType: typeof (window as unknown as { process?: unknown }).process, info: await window.zettel!.info() }));
  assert.deepEqual(bridge.keys, ['info', 'load', 'propose', 'save']);
  assert.equal(bridge.requireType, 'undefined'); assert.equal(bridge.processType, 'undefined');
  assert.ok(bridge.info.storagePath?.startsWith(directory)); assert.equal(bridge.info.aiConfigured, false);
  await page.getByRole('button', { name: 'New ticket' }).first().click();
  await page.getByRole('dialog').getByLabel('Title', { exact: true }).fill('Desktop survives restart');
  await page.getByRole('dialog').getByRole('button', { name: 'Create ticket', exact: true }).click();
  await page.waitForFunction(async () => (await window.zettel!.load()).issues.some(issue => issue.title === 'Desktop survives restart'));
  const before = await page.evaluate(() => window.zettel!.load());
  assert.equal(before.issues[0].identifier, 'ZET-1');
  const originalUrl = page.url();
  assert.equal(await page.evaluate(() => window.open('https://example.com') === null), true);
  await page.evaluate(() => { window.location.href = 'https://example.com'; });
  await page.waitForTimeout(150); assert.equal(page.url(), originalUrl);
  assert.equal((await app.windows()).length, 1);
  await app.close(); app = undefined;
  app = await launch(); page = await app.firstWindow();
  await page.getByRole('button', { name: /ZET-1 Desktop survives restart/ }).waitFor();
  const restored = await page.evaluate(() => window.zettel!.load());
  assert.equal(restored.issues[0].title, before.issues[0].title); assert.equal(restored.revision, before.revision);
  const client = new Client({ name: 'desktop-bundle-verifier', version: '1.0.0' });
  const bridgePath = packagedExecutable ? resolve(dirname(executablePath), '../Resources/mcp.mjs') : resolve('dist-server/mcp.mjs');
  try {
    await client.connect(new StdioClientTransport({ command: executablePath, args: [bridgePath], cwd: directory, env: { ...environment, ELECTRON_RUN_AS_NODE: '1', ZETTEL_CONNECTION_FILE: join(directory, 'desktop-connection.json') }, stderr: 'pipe' }));
    const created = await client.callTool({ name: 'zettel_create_issue', arguments: { title: 'Packaged MCP uses the desktop workspace' } });
    assert.ok(!created.isError);
    await page.reload();
    await page.getByRole('button', { name: /ZET-2 Packaged MCP uses the desktop workspace/ }).waitFor();
  } finally { await client.close(); }
  await page.getByRole('button', { name: 'Settings & backups' }).click();
  const backupPath = join(directory, 'verified-backup.json');
  // Exercise the actual Electron download, directing its native save prompt into
  // the disposable workspace. This does not claim manual save-dialog coverage.
  await app.evaluate(({ session }, path) => {
    session.defaultSession.once('will-download', (_event, item) => item.setSavePath(path));
  }, backupPath);
  await page.getByRole('button', { name: 'Export backup', exact: true }).click();
  for (let attempt = 0; attempt < 100 && !existsSync(backupPath); attempt++) await new Promise(resolve => setTimeout(resolve, 50));
  assert.ok(existsSync(backupPath), 'Native Electron backup download should create a file');
  const exported = JSON.parse(readFileSync(backupPath, 'utf8'));
  assert.equal(exported.issues.length, 2);
  assert.ok(!readFileSync(backupPath, 'utf8').includes('token'));
  await page.getByRole('button', { name: 'Reset workspace', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Reset workspace', exact: true }).click();
  await page.waitForFunction(async () => (await window.zettel!.load()).issues.length === 0);
  await page.getByRole('button', { name: 'Settings & backups' }).click();
  await page.locator('input[type="file"]').setInputFiles(backupPath);
  await page.getByRole('dialog').getByRole('button', { name: 'Back up & restore' }).click();
  await page.waitForFunction(async () => (await window.zettel!.load()).issues.length === 2);
  const imported = await page.evaluate(() => window.zettel!.load());
  assert.deepEqual(imported.issues, exported.issues);
  console.log(JSON.stringify({ executable: executablePath, packaged: !!packagedExecutable, rendererIsolation: preferences, narrowPreload: true, blockedNavigationAndPopup: true, uiCreate: true, persistedAfterRestart: true, bundledMcpSharedStorage: true, guiBackupRestore: true }));
} finally { await app?.close(); rmSync(directory, { recursive: true, force: true }); }

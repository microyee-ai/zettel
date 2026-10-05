import { app, BrowserWindow, dialog, ipcMain, type IpcMainInvokeEvent } from 'electron';
import { mkdirSync, writeFileSync, chmodSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { WorkspaceStore } from '../server/storage.js';
import { startLocalService } from '../server/http.js';
import { aiConfigFromEnv, proposeIssues } from '../server/ai.js';

app.setName('Zettel');
const singleInstance = app.requestSingleInstanceLock();
if (!singleInstance) app.quit();
let window: BrowserWindow | undefined;
let store: WorkspaceStore | undefined;
let service: Awaited<ReturnType<typeof startLocalService>> | undefined;
let connectionPath: string | undefined;
let quitting = false;

function checkSender(event: IpcMainInvokeEvent) {
  if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || !event.senderFrame.url.startsWith(`${service?.origin}/`)) throw new Error('Untrusted IPC sender');
}
async function start() {
  const dataDir = resolve(process.env.ZETTEL_DATA_DIR || resolve(homedir(), '.zettel'));
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  // Importing WorkspaceStore probes node:sqlite in the actual bundled Electron runtime.
  store = new WorkspaceStore(resolve(dataDir, 'workspace.sqlite'));
  const ai = aiConfigFromEnv();
  service = await startLocalService({ store, staticDir: resolve(__dirname, '../dist'), ai });
  connectionPath = resolve(dataDir, 'desktop-connection.json');
  writeFileSync(connectionPath, JSON.stringify({ origin: service.origin, token: service.token }), { mode: 0o600 });
  chmodSync(connectionPath, 0o600);
  ipcMain.handle('zettel:load', event => { checkSender(event); return store!.load(); });
  ipcMain.handle('zettel:save', (event, data: unknown, expectedRevision: number) => { checkSender(event); return store!.save(data, expectedRevision); });
  ipcMain.handle('zettel:propose', (event, prompt: unknown) => { checkSender(event); return proposeIssues(prompt, ai); });
  ipcMain.handle('zettel:info', event => { checkSender(event); return { aiConfigured: !!ai, storagePath: store!.path }; });
  const createWindow = () => {
    window = new BrowserWindow({ width: 1440, height: 940, minWidth: 920, minHeight: 640, title: 'Zettel', backgroundColor: '#111115',
      webPreferences: { preload: resolve(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true, webSecurity: true, devTools: !app.isPackaged },
    });
    window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
    window.webContents.session.setPermissionCheckHandler(() => false);
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', (event, url) => { if (!url.startsWith(`${service!.origin}/`)) event.preventDefault(); });
    window.webContents.on('will-attach-webview', event => event.preventDefault());
    void window.loadURL(`${service!.origin}/app`);
    window.on('closed', () => { window = undefined; });
  };
  createWindow();
  app.on('activate', () => { if (!window) createWindow(); });
  app.on('second-instance', () => { if (window) { if (window.isMinimized()) window.restore(); window.focus(); } });
}

if (singleInstance) {
  void app.whenReady().then(start).catch(error => { dialog.showErrorBox('Zettel could not start', error instanceof Error ? error.message : 'The local workspace failed to open. Existing data was not replaced.'); app.quit(); });
}
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', event => {
  if (quitting) return;
  quitting = true; event.preventDefault();
  void (async () => {
    try { await service?.close(); store?.close(); if (connectionPath) unlinkSync(connectionPath); }
    finally { app.quit(); }
  })();
});

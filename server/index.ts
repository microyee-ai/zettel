import { mkdirSync, writeFileSync, chmodSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { WorkspaceStore } from './storage.js';
import { startLocalService } from './http.js';
import { aiConfigFromEnv } from './ai.js';

const dataDir = resolve(process.env.ZETTEL_DATA_DIR || resolve(homedir(), '.zettel'));
mkdirSync(dataDir, { recursive: true, mode: 0o700 });
const port = Number(process.env.ZETTEL_PORT || 4589);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('ZETTEL_PORT must be 0–65535');
const store = new WorkspaceStore(resolve(dataDir, 'workspace.sqlite'));
const service = await startLocalService({ store, port, staticDir: resolve(process.env.ZETTEL_STATIC_DIR || 'dist'), ai: aiConfigFromEnv() });
const connectionPath = resolve(dataDir, 'connection.json');
writeFileSync(connectionPath, JSON.stringify({ origin: service.origin, token: service.token }), { mode: 0o600 });
chmodSync(connectionPath, 0o600);
console.error(`Zettel local workspace: ${service.origin}/app\nData: ${store.path}\nMCP connection file: ${connectionPath}`);
let stopping = false;
async function stop() { if (stopping) return; stopping = true; await service.close(); store.close(); try { unlinkSync(connectionPath); } catch {} }
process.on('SIGTERM', () => { void stop(); }); process.on('SIGINT', () => { void stop(); });

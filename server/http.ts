import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { z } from 'zod';
import { MAX_WORKSPACE_BYTES } from '../shared/schema.js';
import { RevisionConflict, WorkspaceStore } from './storage.js';
import { proposeIssues, type AiConfig } from './ai.js';

const saveSchema = z.object({ data: z.unknown(), expectedRevision: z.number().int().nonnegative() }).strict();
const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };
const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
export interface LocalServiceOptions { store: WorkspaceStore; port?: number; token?: string; staticDir?: string; ai?: AiConfig }
function json(res: ServerResponse, status: number, data: unknown) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
function authenticated(req: IncomingMessage, token: string) {
  const candidate = Buffer.from(req.headers.authorization?.replace(/^Bearer /, '') || '');
  const expected = Buffer.from(token);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
async function body(req: IncomingMessage) {
  if (!req.headers['content-type']?.startsWith('application/json')) throw new Error('Use application/json');
  let length = 0; const chunks: Buffer[] = [];
  for await (const chunk of req) {
    length += chunk.length;
    if (length > MAX_WORKSPACE_BYTES + 1024) throw new Error('Request exceeds the 5 MB limit');
    chunks.push(Buffer.from(chunk));
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}
export async function startLocalService(options: LocalServiceOptions) {
  const token = options.token || randomBytes(32).toString('hex');
  if (token.length < 32) throw new Error('Local service token must contain at least 32 characters.');
  let origin = '';
  const server = http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Content-Security-Policy', csp);
    try {
      const allowedHosts = [new URL(origin).host, new URL(origin.replace('127.0.0.1', 'localhost')).host];
      if (!allowedHosts.includes(req.headers.host || '')) return json(res, 403, { error: 'Invalid local Host' });
      const requestOrigin = `http://${req.headers.host}`;
      if (req.headers.origin && req.headers.origin !== requestOrigin) return json(res, 403, { error: 'Foreign Origin rejected' });
      if (req.headers['sec-fetch-site'] === 'cross-site') return json(res, 403, { error: 'Cross-site request rejected' });
      const url = new URL(req.url || '/', requestOrigin);
      if (req.method === 'GET' && url.pathname === '/api/health') return json(res, 200, { ok: true, schemaVersion: 1 });
      if (req.method === 'GET' && url.pathname === '/api/info') return json(res, 200, { mode: 'local', aiConfigured: !!options.ai });
      if (req.method === 'GET' && url.pathname === '/api/session') {
        if (req.headers['x-zettel-client'] !== 'browser') return json(res, 403, { error: 'Same-origin browser bootstrap required' });
        return json(res, 200, { token });
      }
      if (url.pathname.startsWith('/api/')) {
        if (!authenticated(req, token)) return json(res, 401, { error: 'Local service authorization required' });
        if (req.method === 'GET' && url.pathname === '/api/workspace') return json(res, 200, options.store.load());
        if (req.method === 'PUT' && url.pathname === '/api/workspace') {
          const input = saveSchema.parse(await body(req));
          return json(res, 200, options.store.save(input.data, input.expectedRevision));
        }
        if (req.method === 'POST' && url.pathname === '/api/ai/propose') {
          const input = z.object({ prompt: z.string() }).strict().parse(await body(req));
          if (!options.ai) return json(res, 503, { error: 'AI is not configured. Set ZETTEL_AI_API_KEY and ZETTEL_AI_MODEL on your local service.' });
          return json(res, 200, await proposeIssues(input.prompt, options.ai));
        }
        return json(res, 404, { error: 'Unknown API route' });
      }
      if (!options.staticDir || !['GET', 'HEAD'].includes(req.method || '')) return json(res, 404, { error: 'Not found' });
      const base = resolve(options.staticDir);
      const path = decodeURIComponent(url.pathname);
      let target = resolve(base, `.${path}`);
      if (target !== base && !target.startsWith(base + sep)) return json(res, 403, { error: 'Invalid asset path' });
      try { if ((await stat(target)).isDirectory()) target = resolve(target, 'index.html'); }
      catch { if (extname(target)) return json(res, 404, { error: 'Asset not found' }); target = resolve(base, 'index.html'); }
      const content = await readFile(target);
      res.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (res.headersSent) { res.end(); return; }
      if (error instanceof RevisionConflict) return json(res, 409, { error: error.message, code: 'revision_conflict' });
      const message = error instanceof z.ZodError ? error.issues.map(i => `${i.path.join('.')}: ${i.message}`).slice(0, 6).join('; ') : error instanceof Error ? error.message : 'Request failed';
      const safe = /ENOENT|SQLITE|SQL logic|database|fetch failed/i.test(message) ? 'Local operation failed. Check service availability and local configuration.' : message;
      json(res, 400, { error: safe });
    }
  });
  server.requestTimeout = 60000; server.headersTimeout = 10000;
  await new Promise<void>((resolveStart, reject) => { server.once('error', reject); server.listen(options.port ?? 0, '127.0.0.1', () => resolveStart()); });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Local server did not bind a port');
  origin = `http://127.0.0.1:${address.port}`;
  return { origin, token, server, close: () => new Promise<void>((resolveClose, reject) => server.close(error => error ? reject(error) : resolveClose())) };
}

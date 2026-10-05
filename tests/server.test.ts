import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request as httpRequest } from 'node:http';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createIssue, emptyWorkspace, parseWorkspace } from '../shared/schema.js';
import { RevisionConflict, WorkspaceStore } from '../server/storage.js';
import { startLocalService } from '../server/http.js';
import { aiConfigFromEnv, proposeIssues } from '../server/ai.js';

test('shared validation rejects corrupt relationships and dependency/parent cycles', () => {
  const data = emptyWorkspace();
  const first = createIssue(data, { title: 'First' }); data.issues.push(first);
  const second = createIssue(data, { title: 'Second' }); data.issues.push(second);
  first.blockedBy = [second.id]; second.blockedBy = [first.id];
  assert.throws(() => parseWorkspace(data), /Circular dependency/);
  first.blockedBy = []; second.blockedBy = [];
  first.parentId = second.id; second.parentId = first.id;
  assert.throws(() => parseWorkspace(data), /Circular parent/);
  first.parentId = ''; second.parentId = ''; first.projectId = 'missing';
  assert.throws(() => parseWorkspace(data), /Unknown project/);
  first.projectId = ''; second.identifier = first.identifier;
  assert.throws(() => parseWorkspace(data), /Duplicate issue identifier/);
  assert.throws(() => parseWorkspace({ ...emptyWorkspace(), schemaVersion: 2 }));
});

test('SQLite survives reopen, rejects stale writers and preserves data after invalid save', () => {
  const dir = mkdtempSync(join(tmpdir(), 'zettel-store-')); const file = join(dir, 'workspace.sqlite');
  let store = new WorkspaceStore(file);
  try {
    const initial = store.load(); initial.issues.push(createIssue(initial, { title: 'Ship a real release' }));
    const saved = store.save(initial, 0); assert.equal(saved.revision, 1);
    assert.throws(() => store.save(initial, 0), RevisionConflict);
    assert.throws(() => store.save({ ...saved, issues: [{ ...saved.issues[0], cycleId: 'missing' }] }, 1), /Unknown cycle/);
    assert.equal(store.load().revision, 1);
    store.close(); store = new WorkspaceStore(file);
    assert.equal(store.load().issues[0].title, 'Ship a real release');
    assert.deepEqual(parseWorkspace(JSON.parse(JSON.stringify(store.load()))), saved);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('ticket numbers survive deletions and oversized imported identifiers are rejected', () => {
  const store = new WorkspaceStore(':memory:');
  try {
    const data = store.load(); data.issues.push(createIssue(data, { title: 'One' })); data.issues.push(createIssue(data, { title: 'Two' }));
    const saved = store.save(data, 0); saved.issues.pop();
    const afterDelete = store.save(saved, 1);
    assert.equal(createIssue(afterDelete, { title: 'Three' }).identifier, 'ZET-3');
    const poisoned = structuredClone(afterDelete); poisoned.issues[0].identifier = `ZET-${'9'.repeat(400)}`;
    assert.throws(() => parseWorkspace(poisoned));
    const legacy = structuredClone(afterDelete); delete legacy.workspace.nextIssueNumber;
    assert.equal(store.save(legacy, 2).workspace.nextIssueNumber, 3);
  } finally { store.close(); }
});

test('two database connections serialize compare-and-swap writes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'zettel-cas-')); const file = join(dir, 'workspace.sqlite');
  const a = new WorkspaceStore(file); const b = new WorkspaceStore(file);
  try {
    const left = a.load(); const right = b.load(); left.workspace.name = 'Winning edit'; right.workspace.name = 'Stale edit';
    a.save(left, 0); assert.throws(() => b.save(right, 0), RevisionConflict); assert.equal(b.load().workspace.name, 'Winning edit');
  } finally { a.close(); b.close(); rmSync(dir, { recursive: true, force: true }); }
});

test('HTTP authenticates, enforces origin/host and returns conflicts without data loss', async () => {
  const store = new WorkspaceStore(':memory:'); const service = await startLocalService({ store });
  try {
    assert.equal((await fetch(`${service.origin}/api/workspace`)).status, 401);
    assert.equal((await fetch(`${service.origin}/api/workspace`, { headers: { Authorization: 'Bearer invalid' } })).status, 401);
    assert.equal((await fetch(`${service.origin}/api/session`)).status, 403);
    const session = await fetch(`${service.origin}/api/session`, { headers: { 'X-Zettel-Client': 'browser' } });
    assert.deepEqual(await session.json(), { token: service.token });
    assert.equal((await fetch(`${service.origin}/api/session`, { headers: { Origin: 'https://evil.example', 'X-Zettel-Client': 'browser' } })).status, 403);
    const badHostStatus = await new Promise<number | undefined>((resolve, reject) => {
      const request = httpRequest(`${service.origin}/api/info`, { headers: { Host: 'evil.example' } }, response => { response.resume(); resolve(response.statusCode); });
      request.on('error', reject); request.end();
    });
    assert.equal(badHostStatus, 403);
    assert.equal((await fetch(`${service.origin}/api/info`, { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status, 403);
    const headers = { Authorization: `Bearer ${service.token}`, 'Content-Type': 'application/json' };
    const data = await (await fetch(`${service.origin}/api/workspace`, { headers })).json();
    const results = await Promise.all([1, 2].map(() => fetch(`${service.origin}/api/workspace`, { method: 'PUT', headers, body: JSON.stringify({ data, expectedRevision: 0 }) })));
    assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
    assert.equal(store.load().revision, 1);
    assert.equal((await fetch(`${service.origin}/api/workspace`, { method: 'PUT', headers, body: '{invalid' })).status, 400);
    const oversized = await fetch(`${service.origin}/api/workspace`, { method: 'PUT', headers, body: JSON.stringify({ data: 'x'.repeat(5 * 1024 * 1024 + 2048), expectedRevision: 1 }) });
    assert.equal(oversized.status, 400); assert.equal(store.load().revision, 1);
    assert.equal((await fetch(`${service.origin}/api/ai/propose`, { method: 'POST', headers, body: JSON.stringify({ prompt: 'Plan the upcoming release' }) })).status, 503);
    const info = await (await fetch(`${service.origin}/api/info`)).json();
    assert.deepEqual(info, { mode: 'local', aiConfigured: false });
  } finally { await service.close(); store.close(); }
});

test('AI proposals are validated, use explicit settings and never mutate work', async () => {
  assert.equal(aiConfigFromEnv({}), undefined);
  assert.throws(() => aiConfigFromEnv({ ZETTEL_AI_API_KEY: 'private-key', ZETTEL_AI_MODEL: 'chosen-model', ZETTEL_AI_BASE_URL: 'http://remote.example/v1' }), /HTTPS/);
  const config = { key: 'private-key', baseUrl: 'https://provider.example/v1', model: 'chosen-model' };
  let call: RequestInit | undefined;
  const request: typeof fetch = async (_url, init) => { call = init; return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ issues: [{ title: 'Draft only', description: 'Acceptance: verify the release', priority: 'high' }] }) } }] })); };
  const result = await proposeIssues('Plan the upcoming release', config, request);
  assert.equal(result.issues[0].title, 'Draft only'); assert.equal(call?.redirect, 'error');
  assert.equal((call?.headers as Record<string, string>).Authorization, 'Bearer private-key');
  assert.ok(!JSON.stringify(result).includes('private-key'));
  await assert.rejects(() => proposeIssues('Plan the upcoming release', config, async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"issues":[{"title":"Bad","description":"","priority":"impossible"}]}' } }] }))), /invalid ticket proposal/);
});

test('real MCP stdio handshake reads and writes the same SQLite workspace', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'zettel-mcp-')); const store = new WorkspaceStore(join(dir, 'workspace.sqlite'));
  const service = await startLocalService({ store }); const connectionPath = join(dir, 'connection.json');
  writeFileSync(connectionPath, JSON.stringify({ origin: service.origin, token: service.token }), { mode: 0o600 });
  const env = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  const transport = new StdioClientTransport({ command: process.execPath, args: ['--import', 'tsx', 'server/mcp.ts'], env: { ...env, ZETTEL_CONNECTION_FILE: connectionPath }, stderr: 'pipe' });
  const client = new Client({ name: 'zettel-verifier', version: '1.0.0' });
  try {
    await client.connect(transport); const tools = await client.listTools();
    assert.ok(tools.tools.some(tool => tool.name === 'zettel_create_issue'));
    const create = await client.callTool({ name: 'zettel_create_issue', arguments: { title: 'Created through MCP', priority: 'high' } });
    assert.ok(!create.isError); assert.equal(store.load().issues[0].title, 'Created through MCP');
    const issue = store.load().issues[0];
    const update = await client.callTool({ name: 'zettel_update_issue', arguments: { id: issue.identifier, expectedUpdatedAt: issue.updatedAt, patch: { status: 'done' } } });
    assert.ok(!update.isError); assert.equal(store.load().issues[0].status, 'done');
    const bad = await client.callTool({ name: 'zettel_update_issue', arguments: { id: issue.identifier, expectedUpdatedAt: issue.updatedAt, patch: { projectId: 'unknown-project' } } });
    assert.equal(bad.isError, true); assert.equal(store.load().issues[0].status, 'done');
    assert.ok(store.load().activities.every(event => event.actor === 'MCP agent'));
    await client.close();
    const reader = new Client({ name: 'zettel-readonly-verifier', version: '1.0.0' });
    try {
      await reader.connect(new StdioClientTransport({ command: process.execPath, args: ['--import', 'tsx', 'server/mcp.ts'], env: { ...env, ZETTEL_CONNECTION_FILE: connectionPath, ZETTEL_MCP_READ_ONLY: '1' }, stderr: 'pipe' }));
      const readonlyTools = await reader.listTools();
      assert.deepEqual(readonlyTools.tools.map(tool => tool.name).sort(), ['zettel_get_issue', 'zettel_list_issues', 'zettel_list_projects']);
    } finally { await reader.close(); }
  } finally { await client.close(); await service.close(); store.close(); rmSync(dir, { recursive: true, force: true }); }
});

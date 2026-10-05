import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createIssue, issueSchema, parseWorkspace, projectSchema, ISSUE_PRIORITIES, ISSUE_STATUSES, type WorkspaceData } from '../shared/schema.js';

const connectionSchema = z.object({ origin: z.string().url(), token: z.string().min(32) }).strict();
const connectionPath = process.env.ZETTEL_CONNECTION_FILE || resolve(process.env.ZETTEL_DATA_DIR || resolve(homedir(), '.zettel'), 'connection.json');
function connection() {
  let config;
  try { config = connectionSchema.parse(JSON.parse(readFileSync(connectionPath, 'utf8'))); }
  catch { throw new Error('Start the Zettel local service first, or set ZETTEL_CONNECTION_FILE to the desktop connection file.'); }
  const url = new URL(config.origin);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('MCP only connects to an explicitly configured loopback service.');
  return config;
}
async function request(method: 'GET' | 'PUT', data?: WorkspaceData) {
  const config = connection();
  const response = await fetch(`${config.origin}/api/workspace`, { method, redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' }, body: data ? JSON.stringify({ data, expectedRevision: data.revision }) : undefined });
  if (!response.ok) {
    if (response.status === 409) throw new Error('Another client changed the workspace. Read the current issue and retry your intended edit.');
    throw new Error(`Local service returned HTTP ${response.status}. Check the service and connection file.`);
  }
  return parseWorkspace(await response.json());
}
function activity(data: WorkspaceData, action: string, issueId?: string) {
  data.activities.push({ id: crypto.randomUUID(), at: new Date().toISOString(), actor: 'MCP agent', action, ...(issueId ? { issueId } : {}) });
  data.activities = data.activities.slice(-20000);
}
function output(value: Record<string, unknown>) { return { content: [{ type: 'text' as const, text: JSON.stringify(value) }], structuredContent: value }; }
async function tool(action: () => Promise<Record<string, unknown>>) {
  try { return output(await action()); }
  catch (error) { return { isError: true, content: [{ type: 'text' as const, text: error instanceof Error ? error.message : 'Tool failed. Read the current state before retrying.' }] }; }
}
const readAnnotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const writeAnnotations = { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false };
const paging = { limit: z.number().int().min(1).max(100).default(30), offset: z.number().int().min(0).default(0) };
function page<T>(items: T[], offset: number, limit: number) { return { items: items.slice(offset, offset + limit), total: items.length, nextOffset: offset + limit < items.length ? offset + limit : null }; }
const server = new McpServer({ name: 'zettel-mcp-server', version: '0.1.0' });

server.registerTool('zettel_list_issues', { title: 'List Zettel tickets', description: 'List local tickets, optionally filter title/description/identifier, status or project. Returns paginated records and total.', inputSchema: z.object({ query: z.string().max(500).default(''), status: z.enum(ISSUE_STATUSES).optional(), projectId: z.string().optional(), ...paging }).strict(), annotations: readAnnotations }, params => tool(async () => {
  const data = await request('GET'); const query = params.query.toLowerCase();
  return { ...page(data.issues.filter(issue => (!params.status || issue.status === params.status) && (params.projectId === undefined || issue.projectId === params.projectId) && `${issue.identifier} ${issue.title} ${issue.description}`.toLowerCase().includes(query)), params.offset, params.limit), revision: data.revision };
}));
server.registerTool('zettel_get_issue', { title: 'Read a Zettel ticket', description: 'Read one ticket by stable ID or human identifier, including comments and dependencies.', inputSchema: z.object({ id: z.string().min(1).max(120) }).strict(), annotations: readAnnotations }, params => tool(async () => {
  const data = await request('GET'); const issue = data.issues.find(i => i.id === params.id || i.identifier === params.id);
  if (!issue) throw new Error('Ticket not found. Use zettel_list_issues to find its current ID.');
  return { issue, revision: data.revision };
}));
server.registerTool('zettel_list_projects', { title: 'List Zettel projects', description: 'Read local projects and their stable IDs for ticket assignment. Includes workspace revision for safe updates.', inputSchema: z.object(paging).strict(), annotations: readAnnotations }, params => tool(async () => { const data = await request('GET'); return { ...page(data.projects, params.offset, params.limit), revision: data.revision }; }));

if (process.env.ZETTEL_MCP_READ_ONLY !== '1') {
  server.registerTool('zettel_create_issue', { title: 'Create a Zettel ticket', description: 'Create a real ticket in the local workspace. Use only when the user requests the write; this is not a draft. Records MCP agent activity.', inputSchema: z.object({ title: z.string().min(1).max(500), description: z.string().max(64000).default(''), priority: z.enum(ISSUE_PRIORITIES).default('medium'), status: z.enum(ISSUE_STATUSES).default('todo'), projectId: z.string().default(''), cycleId: z.string().default(''), assignee: z.string().max(120).default(''), labels: z.array(z.string().min(1).max(80)).max(30).default([]) }).strict(), annotations: writeAnnotations }, params => tool(async () => {
    const data = await request('GET'); const issue = createIssue(data, params); data.issues.push(issue); activity(data, `Created ${issue.identifier}: ${issue.title}`, issue.id);
    const saved = await request('PUT', parseWorkspace(data)); return { issue, revision: saved.revision };
  }));
  server.registerTool('zettel_update_issue', { title: 'Update a Zettel ticket', description: 'Update selected ticket fields. Requires the updatedAt value from a recent read to reject stale edits. No deletion or shell execution.', inputSchema: z.object({ id: z.string().min(1), expectedUpdatedAt: z.string().datetime({ offset: true }), patch: issueSchema.omit({ id: true, identifier: true, createdAt: true, updatedAt: true, comments: true }).partial().strict() }).strict(), annotations: { ...writeAnnotations, idempotentHint: true } }, params => tool(async () => {
    const data = await request('GET'); const index = data.issues.findIndex(i => i.id === params.id || i.identifier === params.id);
    if (index < 0) throw new Error('Ticket not found.');
    if (data.issues[index].updatedAt !== params.expectedUpdatedAt) throw new Error('Ticket changed since your last read. Read it again before updating.');
    data.issues[index] = { ...data.issues[index], ...params.patch, updatedAt: new Date().toISOString() };
    activity(data, `Updated ${data.issues[index].identifier}`, data.issues[index].id);
    const saved = await request('PUT', parseWorkspace(data)); return { issue: saved.issues[index], revision: saved.revision };
  }));
  server.registerTool('zettel_create_project', { title: 'Create a Zettel project', description: 'Create a real local project with a stable ID, optional target date and description.', inputSchema: projectSchema.omit({ id: true }).extend({ description: z.string().max(64000).default(''), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#b798ff'), status: z.enum(['planned', 'active', 'completed']).default('planned'), targetDate: projectSchema.shape.targetDate.default('') }).strict(), annotations: writeAnnotations }, params => tool(async () => {
    const data = await request('GET'); const project = { ...params, id: crypto.randomUUID() }; data.projects.push(project); activity(data, `Created project: ${project.name}`);
    const saved = await request('PUT', parseWorkspace(data)); return { project, revision: saved.revision };
  }));
  server.registerTool('zettel_update_project', { title: 'Update a Zettel project', description: 'Update project fields using the workspace revision returned from a prior read to prevent stale project edits.', inputSchema: z.object({ id: z.string().min(1), expectedRevision: z.number().int().nonnegative(), patch: projectSchema.omit({ id: true }).partial().strict() }).strict(), annotations: { ...writeAnnotations, idempotentHint: true } }, params => tool(async () => {
    const data = await request('GET'); if (data.revision !== params.expectedRevision) throw new Error('Workspace changed. Read the current workspace before retrying.');
    const index = data.projects.findIndex(p => p.id === params.id); if (index < 0) throw new Error('Project not found.');
    data.projects[index] = { ...data.projects[index], ...params.patch }; activity(data, `Updated project: ${data.projects[index].name}`);
    const saved = await request('PUT', parseWorkspace(data)); return { project: saved.projects[index], revision: saved.revision };
  }));
}
await server.connect(new StdioServerTransport());

import { z } from 'zod';

export const ISSUE_STATUSES = ['backlog', 'todo', 'in_progress', 'in_review', 'done', 'canceled'] as const;
export const ISSUE_PRIORITIES = ['urgent', 'high', 'medium', 'low', 'none'] as const;
export type IssueStatus = typeof ISSUE_STATUSES[number];
export type IssuePriority = typeof ISSUE_PRIORITIES[number];
export const MAX_WORKSPACE_BYTES = 5 * 1024 * 1024;
const MAX_ISSUE_NUMBER = 999_999_999;
const id = z.string().min(1).max(120);
const ref = z.string().max(120);
const date = z.string().refine(value => {
  if (value === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, 'Use a valid YYYY-MM-DD date');
const timestamp = z.string().datetime({ offset: true });
const title = z.string().trim().min(1).max(500);
const body = z.string().max(64_000);
export const commentSchema = z.object({ id, body: body.min(1), author: z.string().min(1).max(120), createdAt: timestamp }).strict();
export const issueSchema = z.object({
  id, identifier: z.string().max(20).regex(/^[A-Z][A-Z0-9]{0,9}-[1-9]\d{0,8}$/), title, description: body,
  status: z.enum(ISSUE_STATUSES), priority: z.enum(ISSUE_PRIORITIES), projectId: ref, cycleId: ref,
  assignee: z.string().max(120), labels: z.array(z.string().min(1).max(80)).max(30),
  estimate: z.number().finite().min(0).max(1000), dueDate: date, parentId: ref,
  blockedBy: z.array(id).max(100), comments: z.array(commentSchema).max(2000),
  createdAt: timestamp, updatedAt: timestamp,
}).strict();
export const projectSchema = z.object({ id, name: title, description: body, color: z.string().regex(/^#[0-9a-fA-F]{6}$/), status: z.enum(['planned', 'active', 'completed']), targetDate: date }).strict();
export const cycleSchema = z.object({ id, name: title, startDate: date, endDate: date, goal: body }).strict();
export const noteSchema = z.object({ id, title, body, projectId: ref }).strict();
export const activitySchema = z.object({ id, at: timestamp, actor: z.string().min(1).max(120), action: z.string().min(1).max(1000), issueId: ref.optional() }).strict();
export const workspaceSchema = z.object({
  schemaVersion: z.literal(1), revision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER - 1),
  workspace: z.object({ id, name: title, key: z.string().regex(/^[A-Z][A-Z0-9]{0,9}$/), nextIssueNumber: z.number().int().min(1).max(MAX_ISSUE_NUMBER + 1).optional() }).strict(),
  projects: z.array(projectSchema).max(1000), issues: z.array(issueSchema).max(10000),
  cycles: z.array(cycleSchema).max(1000), notes: z.array(noteSchema).max(2000), activities: z.array(activitySchema).max(20000),
}).strict();
export type Issue = z.infer<typeof issueSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Cycle = z.infer<typeof cycleSchema>;
export type Note = z.infer<typeof noteSchema>;
export type WorkspaceData = z.infer<typeof workspaceSchema>;
export type Activity = z.infer<typeof activitySchema>;

function unique(values: string[], kind: string): Set<string> {
  const set = new Set(values);
  if (set.size !== values.length) throw new Error(`Duplicate ${kind}`);
  return set;
}

function acyclic(issues: Issue[], edges: (issue: Issue) => string[], label: string) {
  const map = new Map(issues.map(issue => [issue.id, issue]));
  const done = new Set<string>();
  for (const issue of issues) {
    const visiting = new Set<string>();
    const stack: [string, boolean][] = [[issue.id, false]];
    while (stack.length) {
      const [key, leaving] = stack.pop()!;
      if (leaving) { visiting.delete(key); done.add(key); continue; }
      if (done.has(key)) continue;
      if (visiting.has(key)) throw new Error(`Circular ${label} relationship`);
      visiting.add(key); stack.push([key, true]);
      for (const next of edges(map.get(key)!)) stack.push([next, false]);
    }
  }
}

export function parseWorkspace(input: unknown): WorkspaceData {
  if (new TextEncoder().encode(JSON.stringify(input)).byteLength > MAX_WORKSPACE_BYTES) throw new Error('Workspace exceeds the 5 MB limit');
  const data = workspaceSchema.parse(input);
  const projects = unique(data.projects.map(p => p.id), 'project ID');
  const issues = unique(data.issues.map(i => i.id), 'issue ID');
  const cycles = unique(data.cycles.map(c => c.id), 'cycle ID');
  unique(data.notes.map(n => n.id), 'note ID');
  unique(data.activities.map(a => a.id), 'activity ID');
  unique(data.issues.map(i => i.identifier), 'issue identifier');
  const checkRef = (value: string, target: Set<string>, kind: string) => {
    if (value && !target.has(value)) throw new Error(`Unknown ${kind}: ${value}`);
  };
  for (const issue of data.issues) {
    checkRef(issue.projectId, projects, 'project'); checkRef(issue.cycleId, cycles, 'cycle');
    checkRef(issue.parentId, issues, 'parent issue');
    unique(issue.blockedBy, 'dependency'); unique(issue.comments.map(c => c.id), 'comment ID');
    for (const dependency of issue.blockedBy) checkRef(dependency, issues, 'dependency');
  }
  for (const note of data.notes) checkRef(note.projectId, projects, 'note project');
  for (const cycle of data.cycles) if (cycle.startDate && cycle.endDate && cycle.endDate < cycle.startDate) throw new Error('Cycle end date precedes start date');
  // Activity remains readable when its former issue is deleted.
  acyclic(data.issues, issue => issue.parentId ? [issue.parentId] : [], 'parent');
  acyclic(data.issues, issue => issue.blockedBy, 'dependency');
  data.workspace.nextIssueNumber = Math.max(data.workspace.nextIssueNumber ?? 1, ...data.issues.map(issue => Number(issue.identifier.split('-').at(-1)) + 1));
  return data;
}

export function emptyWorkspace(): WorkspaceData {
  return { schemaVersion: 1, revision: 0, workspace: { id: crypto.randomUUID(), name: 'My workspace', key: 'ZET', nextIssueNumber: 1 }, projects: [], issues: [], cycles: [], notes: [], activities: [] };
}

/** Returns a new issue; callers append it and persist the complete validated snapshot. */
export function createIssue(data: WorkspaceData, input: Partial<Omit<Issue, 'id' | 'identifier' | 'createdAt' | 'updatedAt'>> & { title: string }): Issue {
  const next = Math.max(data.workspace.nextIssueNumber ?? 1, data.issues.reduce((max, issue) => Math.max(max, Number(issue.identifier.split('-').at(-1)) || 0), 0) + 1);
  if (!Number.isSafeInteger(next) || next > MAX_ISSUE_NUMBER) throw new Error('This workspace has exhausted its ticket numbering range. Export it and start a new workspace.');
  const now = new Date().toISOString();
  return issueSchema.parse({ id: crypto.randomUUID(), identifier: `${data.workspace.key}-${next}`,
    description: '', status: 'todo', priority: 'medium', projectId: '', cycleId: '', assignee: '', labels: [], estimate: 0,
    dueDate: '', parentId: '', blockedBy: [], comments: [], ...input, createdAt: now, updatedAt: now });
}

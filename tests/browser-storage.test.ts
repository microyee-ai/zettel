import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import Dexie from 'dexie';
import { browserAdapter, previousBrowserSnapshot } from '../src/data.js';
import { createIssue, emptyWorkspace, MAX_WORKSPACE_BYTES, parseWorkspace, type WorkspaceData } from '../shared/schema.js';

async function cleanWorkspace() {
  const current = await browserAdapter.load();
  return browserAdapter.save(emptyWorkspace(), current.revision);
}

test('browser cold initialization is atomic across concurrent loads', async () => {
  const [left, right] = await Promise.all([browserAdapter.load(), browserAdapter.load()]);
  assert.equal(left.workspace.id, right.workspace.id);
  assert.deepEqual(left, right);
});

test('browser data is committed to IndexedDB and readable from a reopened independent connection', async () => {
  const data = await cleanWorkspace();
  data.projects.push({ id: 'project', name: 'Delivery', description: 'Keep the context', color: '#123456', status: 'active', targetDate: '2026-12-01' });
  data.cycles.push({ id: 'cycle', name: 'First cycle', startDate: '2026-10-05', endDate: '2026-10-12', goal: 'Ship' });
  data.issues.push(createIssue(data, { title: 'Retain real work', projectId: 'project', cycleId: 'cycle' }));
  data.notes.push({ id: 'note', title: 'Specification', body: '<script>is just text</script>', projectId: 'project' });
  const saved = await browserAdapter.save(data, data.revision);
  const independent = new Dexie('zettel-workbench-v1');
  try {
    await independent.open();
    const persisted = await independent.table('workspace').get('main');
    assert.deepEqual(parseWorkspace(persisted.data), saved);
    independent.close();
    await independent.open();
    assert.equal((await independent.table('workspace').get('main')).data.issues[0].id, saved.issues[0].id);
  } finally { independent.close(); }
});

test('browser concurrent saves reject one stale writer without losing the winner', async () => {
  const base = await cleanWorkspace();
  const left = structuredClone(base); left.workspace.name = 'Left writer';
  const right = structuredClone(base); right.workspace.name = 'Right writer';
  const results = await Promise.allSettled([
    browserAdapter.save(left, base.revision),
    browserAdapter.save(right, base.revision),
  ]);
  const fulfilled = results.filter((result): result is PromiseFulfilledResult<WorkspaceData> => result.status === 'fulfilled');
  const rejected = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.match(String(rejected[0].reason), /changed in another tab/);
  assert.deepEqual(await browserAdapter.load(), fulfilled[0].value);
});

test('invalid browser imports leave both committed and recovery snapshots intact', async () => {
  const base = await cleanWorkspace();
  base.issues.push(createIssue(base, { title: 'Preserve this ticket' }));
  const saved = await browserAdapter.save(base, base.revision);
  const previous = await previousBrowserSnapshot();
  const dangling = structuredClone(saved); dangling.issues[0].projectId = 'absent';
  const duplicate = structuredClone(saved); duplicate.issues.push(structuredClone(duplicate.issues[0]));
  const invalidDate = structuredClone(saved); invalidDate.issues[0].dueDate = '2026-02-30';
  const invalidIdentifier = structuredClone(saved); invalidIdentifier.issues[0].identifier = `ZET-${'9'.repeat(400)}`;
  const candidates = [dangling, duplicate, invalidDate, invalidIdentifier, { ...saved, schemaVersion: 99 }];
  for (const candidate of candidates) {
    await assert.rejects(() => browserAdapter.save(candidate as WorkspaceData, saved.revision));
    assert.deepEqual(await browserAdapter.load(), saved);
    assert.deepEqual(await previousBrowserSnapshot(), previous);
  }
});

test('valid browser restore rebases revision and retains the replaced workspace for recovery', async () => {
  const before = await cleanWorkspace();
  const imported = emptyWorkspace(); imported.revision = 900;
  imported.workspace.name = 'Imported workspace';
  imported.issues.push(createIssue(imported, { title: 'Portable issue' }));
  const restored = await browserAdapter.save(parseWorkspace(JSON.parse(JSON.stringify(imported))), before.revision);
  assert.equal(restored.revision, before.revision + 1);
  assert.equal(restored.workspace.id, imported.workspace.id);
  assert.equal(restored.issues[0].id, imported.issues[0].id);
  assert.deepEqual(await previousBrowserSnapshot(), before);
  const recovered = await browserAdapter.save((await previousBrowserSnapshot())!, restored.revision);
  assert.equal(recovered.workspace.id, before.workspace.id);
  assert.deepEqual(recovered.issues, before.issues);
});

test('browser preserves ticket allocation across deletion and same-workspace older restore', async () => {
  const base = await cleanWorkspace();
  base.issues.push(createIssue(base, { title: 'First' }));
  const first = await browserAdapter.save(base, base.revision);
  const later = structuredClone(first);
  later.issues.push(createIssue(later, { title: 'Second' }));
  const second = await browserAdapter.save(later, first.revision);
  const deleted = await browserAdapter.save({ ...second, issues: second.issues.slice(0, 1) }, second.revision);
  assert.equal(createIssue(deleted, { title: 'Third' }).identifier, 'ZET-3');
  const restoredOld = await browserAdapter.save(first, deleted.revision);
  assert.equal(createIssue(restoredOld, { title: 'Still third' }).identifier, 'ZET-3');
});

test('browser transaction rollback preserves main and recovery when final storage write fails', async () => {
  const before = await cleanWorkspace();
  const recoveryBefore = await previousBrowserSnapshot();
  const next = structuredClone(before); next.workspace.name = 'simulate-full-disk';
  const original = IDBObjectStore.prototype.put;
  IDBObjectStore.prototype.put = function (value: unknown, key?: IDBValidKey) {
    const row = value as { id?: string; data?: WorkspaceData };
    if (row.id === 'main' && row.data?.workspace.name === 'simulate-full-disk') throw new DOMException('Simulated storage full', 'QuotaExceededError');
    return key === undefined ? original.call(this, value) : original.call(this, value, key);
  };
  try {
    await assert.rejects(() => browserAdapter.save(next, before.revision), /Simulated storage full/);
  } finally { IDBObjectStore.prototype.put = original; }
  assert.deepEqual(await browserAdapter.load(), before);
  assert.deepEqual(await previousBrowserSnapshot(), recoveryBefore);
});

test('browser refuses an import whose committed revision would exceed the workspace byte limit', async () => {
  let current = await cleanWorkspace();
  while (current.revision < 10) current = await browserAdapter.save(current, current.revision);
  const previous = await previousBrowserSnapshot();
  const boundary = emptyWorkspace();
  boundary.notes = Array.from({ length: 82 }, (_, index) => ({ id: `note-${index}`, title: 'Boundary', body: '', projectId: '' }));
  let remaining = MAX_WORKSPACE_BYTES - new TextEncoder().encode(JSON.stringify(boundary)).byteLength;
  for (const note of boundary.notes) {
    const length = Math.min(64_000, remaining);
    note.body = 'a'.repeat(length); remaining -= length;
  }
  assert.equal(remaining, 0);
  assert.equal(new TextEncoder().encode(JSON.stringify(boundary)).byteLength, MAX_WORKSPACE_BYTES);
  parseWorkspace(boundary);
  await assert.rejects(() => browserAdapter.save(boundary, current.revision), /5 MB limit/);
  assert.deepEqual(await browserAdapter.load(), current);
  assert.deepEqual(await previousBrowserSnapshot(), previous);
});

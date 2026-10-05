import Dexie, { type Table } from "dexie";
import {
  createIssue,
  emptyWorkspace,
  parseWorkspace,
  type WorkspaceData,
  type Issue,
} from "../shared/schema";

export type Proposal = {
  issues: Array<{
    title: string;
    description: string;
    priority?: Issue["priority"];
  }>;
};
export type RuntimeInfo = { aiConfigured: boolean; storagePath?: string };
export interface WorkspaceAdapter {
  mode: "browser" | "desktop" | "local";
  load(): Promise<WorkspaceData>;
  save(data: WorkspaceData, expectedRevision: number): Promise<WorkspaceData>;
  propose(prompt: string): Promise<Proposal>;
  info(): Promise<RuntimeInfo>;
}
declare global {
  interface Window {
    zettel?: Omit<WorkspaceAdapter, "mode">;
  }
}

class WorkbenchDB extends Dexie {
  workspace!: Table<{ id: string; data: WorkspaceData }>;
  constructor() {
    super("zettel-workbench-v1");
    this.version(1).stores({ workspace: "id" });
  }
}
const db = new WorkbenchDB();
export const browserAdapter: WorkspaceAdapter = {
  mode: "browser",
  async load() {
    return db.transaction("rw", db.workspace, async () => {
      const row = await db.workspace.get("main");
      if (row) return parseWorkspace(row.data);
      const data = emptyWorkspace();
      await db.workspace.add({ id: "main", data });
      return data;
    });
  },
  async save(data, expectedRevision) {
    const validated = parseWorkspace(data);
    return db.transaction("rw", db.workspace, async () => {
      const current = await db.workspace.get("main");
      if (current?.data.revision !== expectedRevision)
        throw new Error(
          "This workspace changed in another tab. Reload the workspace, then try again. Your open draft is still here.",
        );
      if (validated.workspace.id === current.data.workspace.id)
        validated.workspace.nextIssueNumber = Math.max(
          validated.workspace.nextIssueNumber ?? 1,
          current.data.workspace.nextIssueNumber ?? 1,
        );
      const next = parseWorkspace({
        ...validated,
        revision: expectedRevision + 1,
      });
      await db.workspace.put({ id: "recovery", data: current.data });
      await db.workspace.put({ id: "main", data: next });
      return next;
    });
  },
  async propose() {
    throw new Error(
      "AI planning is available in the local app with your own provider configured.",
    );
  },
  async info() {
    return { aiConfigured: false };
  },
};

export async function previousBrowserSnapshot(): Promise<
  WorkspaceData | undefined
> {
  const row = await db.workspace.get("recovery");
  return row ? parseWorkspace(row.data) : undefined;
}

export async function getAdapter(): Promise<WorkspaceAdapter> {
  if (window.zettel) return { ...window.zettel, mode: "desktop" };
  if (["127.0.0.1", "localhost"].includes(location.hostname)) {
    try {
      const response = await fetch("/api/session", {
        headers: { Accept: "application/json", "X-Zettel-Client": "browser" },
      });
      if (
        response.ok &&
        response.headers.get("content-type")?.includes("application/json")
      ) {
        const { token } = await response.json();
        if (typeof token === "string" && token.length > 20) {
          const request = async (
            path: string,
            method = "GET",
            body?: unknown,
          ) => {
            const res = await fetch(`/api/${path}`, {
              method,
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              ...(body ? { body: JSON.stringify(body) } : {}),
            });
            const result = await res.json();
            if (!res.ok)
              throw new Error(result.error || `Request failed (${res.status})`);
            return result;
          };
          return {
            mode: "local",
            load: () => request("workspace"),
            save: (data, expectedRevision) =>
              request("workspace", "PUT", { data, expectedRevision }),
            propose: (prompt) => request("ai/propose", "POST", { prompt }),
            info: () => request("info"),
          };
        }
      }
    } catch {
      /* A normal Vite development server has no local workspace service. */
    }
  }
  return browserAdapter;
}

export function exampleWorkspace(base: WorkspaceData): WorkspaceData {
  const day = (offset: number) => {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return date.toISOString().slice(0, 10);
  };
  const data = {
    ...base,
    workspace: { ...base.workspace, name: "Studio workspace" },
  };
  data.projects = [
    {
      id: "launch",
      name: "The next big thing",
      description: "Bring a thoughtful little product into the world.",
      color: "#635bdb",
      status: "active",
      targetDate: day(21),
    },
    {
      id: "website",
      name: "Studio website",
      description: "A new home for the things we make.",
      color: "#4e8b78",
      status: "planned",
      targetDate: day(35),
    },
  ];
  data.cycles = [
    {
      id: "cycle-1",
      name: "Make it real",
      startDate: day(-3),
      endDate: day(11),
      goal: "Turn the first useful workflow into something we can share.",
    },
  ];
  const examples: Array<Partial<Issue> & { title: string }> = [
    {
      title: "Map the first five minutes",
      status: "done",
      priority: "high",
      estimate: 3,
      labels: ["Discovery"],
      description:
        "Write down what a new user needs to do to reach their first useful result.",
    },
    {
      title: "Build the first complete workflow",
      status: "in_progress",
      priority: "high",
      estimate: 5,
      labels: ["Engineering"],
      dueDate: day(3),
      description:
        "Connect the happy path from a new idea to a completed piece of work.\n\nAcceptance criteria\n• Data survives a reload\n• Errors explain how to recover\n• The primary flow works on a narrow screen",
    },
    {
      title: "Write a useful getting-started guide",
      status: "todo",
      priority: "medium",
      estimate: 2,
      labels: ["Content"],
      dueDate: day(6),
    },
    {
      title: "Review the onboarding experience",
      status: "in_review",
      priority: "medium",
      estimate: 2,
      labels: ["Design"],
    },
    {
      title: "Make a short launch checklist",
      status: "backlog",
      priority: "low",
      estimate: 1,
      labels: ["Launch"],
    },
    {
      title: "Collect the studio’s latest work",
      status: "todo",
      priority: "low",
      projectId: "website",
      cycleId: "",
      estimate: 2,
      labels: ["Content"],
    },
  ];
  data.issues = [];
  for (const example of examples)
    data.issues.push(
      createIssue(data, {
        projectId: "launch",
        cycleId: "cycle-1",
        assignee: "You",
        ...example,
      }),
    );
  data.issues[2].blockedBy = [data.issues[1].id];
  data.notes = [
    {
      id: "brief",
      title: "A small, useful launch",
      projectId: "launch",
      body: "What are we making?\nA focused product that solves one daily frustration.\n\nWho is it for?\nPeople who would rather make things than manage things.\n\nHow will we know it works?\nA new user can finish the core workflow without our help.\n\nThis is an example workspace. Edit these tickets, or start with a blank workspace from Settings.",
    },
  ];
  return parseWorkspace(data);
}

export function downloadBackup(data: WorkspaceData) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `zettel-${new Date().toISOString().slice(0, 10)}-r${data.revision}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

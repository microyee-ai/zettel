import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDashed,
  CircleDot,
  Download,
  Filter,
  FolderKanban,
  Home,
  Inbox,
  LayoutGrid,
  List,
  LoaderCircle,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  createIssue,
  emptyWorkspace,
  parseWorkspace,
  ISSUE_STATUSES,
  type WorkspaceData,
  type Issue,
  type IssueStatus,
  type Project,
  type Cycle,
  type Note,
} from "../shared/schema";
import {
  downloadBackup,
  exampleWorkspace,
  getAdapter,
  previousBrowserSnapshot,
  type Proposal,
  type WorkspaceAdapter,
} from "./data";

const FeedbackContext = createContext({ error: "", reload: async () => {} });

const statusNames: Record<IssueStatus, string> = {
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In progress",
  in_review: "In review",
  done: "Done",
  canceled: "Canceled",
};
const priorities = ["urgent", "high", "medium", "low", "none"] as const;
const today = () =>
  `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;
const isOpen = (i: Issue) => i.status !== "done" && i.status !== "canceled";
const dateLabel = (value: string) =>
  value
    ? new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })
    : "No date";
const uid = () => crypto.randomUUID();
const message = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Try again.";

function StatusIcon({ status }: { status: IssueStatus }) {
  const Icon =
    status === "done"
      ? CheckCircle2
      : status === "in_progress"
        ? CircleDot
        : status === "in_review"
          ? CircleDashed
          : status === "backlog"
            ? CircleDashed
            : status === "canceled"
              ? X
              : Circle;
  return (
    <Icon
      size={16}
      className={`status-icon status-${status}`}
      aria-label={statusNames[status]}
    />
  );
}
function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const feedback = useContext(FeedbackContext);
  useEffect(() => {
    const dialog = ref.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={`modal ${wide ? "modal-wide" : ""}`}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
    >
      <header className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={19} />
        </button>
      </header>
      {feedback.error && (
        <div className="error-banner" role="alert">
          <span>
            {feedback.error} Your draft is still here. Copy any changes before
            closing and reopening it.
          </span>
          <button onClick={feedback.reload}>Reload workspace</button>
        </div>
      )}
      {children}
    </dialog>
  );
}
function Empty({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<WorkspaceData>();
  const [adapter, setAdapter] = useState<WorkspaceAdapter>();
  const [page, setPage] = useState("overview");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "board">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [edit, setEdit] = useState<Issue | null>(null);
  const [newIssue, setNewIssue] = useState(false);
  const [projectEdit, setProjectEdit] = useState<Project | null>(null);
  const [cycleEdit, setCycleEdit] = useState<Cycle | null>(null);
  const [noteEdit, setNoteEdit] = useState<Note | null>(null);
  const [ai, setAi] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importData, setImportData] = useState<WorkspaceData>();
  const searchRef = useRef<HTMLInputElement>(null);
  const draftRevision = useRef<number | undefined>(undefined);
  const modalOpen = !!(
    newIssue ||
    edit ||
    projectEdit ||
    cycleEdit ||
    noteEdit ||
    ai ||
    confirmReset ||
    importData
  );
  useEffect(() => {
    draftRevision.current = modalOpen ? data?.revision : undefined;
  }, [modalOpen]);
  useEffect(() => {
    getAdapter()
      .then(async (a) => {
        setAdapter(a);
        setData(await a.load());
        setAiConfigured((await a.info()).aiConfigured);
      })
      .catch((e) => setError(message(e)));
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const element = e.target as HTMLElement;
      if (
        ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName) ||
        element.isContentEditable ||
        document.querySelector("dialog[open]")
      )
        return;
      if (e.key.toLowerCase() === "c" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setNewIssue(true);
      }
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, []);
  const reload = async () => {
    try {
      if (adapter) {
        setData(await adapter.load());
        setError("");
        setToast("Workspace reloaded");
      }
    } catch (e) {
      setError(message(e));
    }
  };
  async function commit(next: WorkspaceData, action: string, issueId?: string) {
    if (!adapter || !data || busy) return false;
    setBusy(true);
    setError("");
    try {
      const activities = [
        ...next.activities,
        {
          id: uid(),
          at: new Date().toISOString(),
          actor: "You",
          action,
          ...(issueId ? { issueId } : {}),
        },
      ].slice(-10000);
      setData(
        await adapter.save(
          { ...next, activities },
          draftRevision.current ?? data.revision,
        ),
      );
      setToast(action);
      return true;
    } catch (e) {
      setError(message(e));
      return false;
    } finally {
      setBusy(false);
    }
  }
  const navigate = (next: string) => {
    setPage(next);
    setQuery("");
    setMobileMenu(false);
    setProjectFilter("all");
    setCycleFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
  };
  const filtered = useMemo(
    () =>
      data?.issues
        .filter(
          (issue) =>
            (!query ||
              `${issue.identifier} ${issue.title} ${issue.description} ${issue.labels.join(" ")} ${issue.assignee}`
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (statusFilter === "all" || issue.status === statusFilter) &&
            (priorityFilter === "all" || issue.priority === priorityFilter) &&
            (projectFilter === "all" || issue.projectId === projectFilter) &&
            (cycleFilter === "all" || issue.cycleId === cycleFilter),
        )
        .sort(
          (a, b) =>
            priorities.indexOf(a.priority) - priorities.indexOf(b.priority) ||
            b.updatedAt.localeCompare(a.updatedAt),
        ) ?? [],
    [data, query, statusFilter, priorityFilter, projectFilter, cycleFilter],
  );
  if (!data || !adapter)
    return (
      <div className="loading-screen">
        <img src="/brand/icon.svg" width="48" alt="" />
        <h2>
          {error ? "Your workspace could not open" : "Opening your workspace…"}
        </h2>
        {error && (
          <>
            <p role="alert">{error}</p>
            <button
              className="button primary"
              onClick={() => location.reload()}
            >
              Try again
            </button>
          </>
        )}
      </div>
    );
  const openIssues = data.issues.filter(isOpen);
  const done = data.issues.filter((i) => i.status === "done").length;
  const blocked = (i: Issue) =>
    i.blockedBy.some((id) =>
      data.issues.some((dep) => dep.id === id && isOpen(dep)),
    );
  const percent = (issues: Issue[]) =>
    issues.length
      ? Math.round(
          (issues.filter((i) => i.status === "done").length / issues.length) *
            100,
        )
      : 0;
  const showProject = (id: string) => {
    navigate("tickets");
    setProjectFilter(id);
  };
  const showCycle = (id: string) => {
    navigate("tickets");
    setCycleFilter(id);
  };
  const statusChange = (issue: Issue, status: IssueStatus) =>
    commit(
      {
        ...data,
        issues: data.issues.map((i) =>
          i.id === issue.id
            ? { ...i, status, updatedAt: new Date().toISOString() }
            : i,
        ),
      },
      `${issue.identifier} moved to ${statusNames[status].toLowerCase()}`,
      issue.id,
    );
  const startProject = () =>
    setProjectEdit({
      id: uid(),
      name: "",
      description: "",
      color: "#635bdb",
      status: "planned",
      targetDate: "",
    });
  const startCycle = () =>
    setCycleEdit({
      id: uid(),
      name: "",
      startDate: today(),
      endDate: "",
      goal: "",
    });
  const startNote = () =>
    setNoteEdit({ id: uid(), title: "", body: "", projectId: "" });
  const newButton = (
    <button className="button primary" onClick={() => setNewIssue(true)}>
      <Plus size={16} /> New ticket <kbd>C</kbd>
    </button>
  );
  const title =
    page === "overview"
      ? "Overview"
      : page === "tickets"
        ? "All tickets"
        : page === "insights"
          ? "Delivery"
          : page[0].toUpperCase() + page.slice(1);
  const issueRows = (issues: Issue[]) => (
    <div className="ticket-list">
      {issues.map((issue) => (
        <div className="ticket-row" key={issue.id}>
          <button className="issue-open" onClick={() => setEdit(issue)}>
            <StatusIcon status={issue.status} />
            <span className="ticket-id">{issue.identifier}</span>
            <span className="ticket-title">{issue.title}</span>
            {blocked(issue) && <span className="blocked-badge">Blocked</span>}
          </button>
          <div className="ticket-meta">
            <span
              className={`priority priority-${issue.priority}`}
              title={`${issue.priority} priority`}
            >
              {issue.priority === "urgent"
                ? "!!"
                : issue.priority === "high"
                  ? "▰"
                  : issue.priority === "medium"
                    ? "═"
                    : "−"}
            </span>
            <span className="row-label">{issue.labels[0]}</span>
            <span
              className={`due-date ${issue.dueDate && issue.dueDate < today() && isOpen(issue) ? "overdue" : ""}`}
            >
              {issue.dueDate ? dateLabel(issue.dueDate) : ""}
            </span>
            <select
              aria-label={`Status of ${issue.identifier}`}
              value={issue.status}
              disabled={busy}
              onChange={(e) =>
                void statusChange(issue, e.target.value as IssueStatus)
              }
            >
              {ISSUE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusNames[s]}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <FeedbackContext.Provider value={{ error, reload }}>
      <div className="workbench">
        <a className="skip-link" href="#workspace-content">
          Skip to workspace
        </a>
        <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
          <a className="app-brand" href="#" aria-label="Zettel home">
            <img src="/brand/icon.svg" alt="" />
            <span>zettel</span>
            <span className="preview-pill">Preview</span>
          </a>
          <button
            className="workspace-switch"
            onClick={() => navigate("settings")}
          >
            <span className="workspace-avatar">{data.workspace.name[0]}</span>
            <span>
              {data.workspace.name}
              <small>Your local workspace</small>
            </span>
            <ChevronDown size={14} />
          </button>
          <div className="sidebar-action">{newButton}</div>
          <nav aria-label="Workspace">
            <p className="nav-label">Workspace</p>
            {[
              ["overview", Home, "Overview"],
              ["tickets", Inbox, "All tickets"],
              ["projects", FolderKanban, "Projects"],
              ["cycles", CircleDashed, "Cycles"],
              ["notes", BookOpen, "Notes"],
              ["insights", BarChart3, "Delivery"],
            ].map(([id, Icon, label]) => {
              const Glyph = Icon as typeof Home;
              return (
                <button
                  key={id as string}
                  className={`nav-item ${page === id ? "active" : ""}`}
                  onClick={() => navigate(id as string)}
                >
                  <Glyph size={18} />
                  <span>{label as string}</span>
                  {id === "tickets" && (
                    <span className="nav-count">{openIssues.length}</span>
                  )}
                </button>
              );
            })}
          </nav>
          <div className="sidebar-projects">
            <p className="nav-label">
              Your projects{" "}
              <button
                className="icon-button"
                onClick={startProject}
                aria-label="New project"
              >
                <Plus size={14} />
              </button>
            </p>
            {data.projects.slice(0, 6).map((p) => (
              <button
                className="nav-item project-nav"
                key={p.id}
                onClick={() => showProject(p.id)}
              >
                <span className="project-dot" style={{ background: p.color }} />
                {p.name}
              </button>
            ))}
            {!data.projects.length && (
              <p className="muted sidebar-hint">Give your next idea a home.</p>
            )}
          </div>
          <div className="sidebar-bottom">
            <button className="ai-nav" onClick={() => setAi(true)}>
              <Sparkles size={18} />
              <span>
                Plan with AI<small>Your ideas, made actionable</small>
              </span>
              <Plus size={14} />
            </button>
            <button
              className={`nav-item ${page === "settings" ? "active" : ""}`}
              onClick={() => navigate("settings")}
            >
              <Settings size={18} />
              Settings & backups
            </button>
            <div className="storage-status">
              <span />{" "}
              {adapter.mode === "browser"
                ? "Saved in this browser"
                : "Saved on this computer"}
            </div>
          </div>
        </aside>
        <div className="app-body">
          <header className="app-topbar">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-menu"
                onClick={() => setMobileMenu(!mobileMenu)}
                aria-label="Toggle navigation"
              >
                <Menu size={20} />
              </button>
              <span>{data.workspace.name}</span>
              <span className="breadcrumb-slash">/</span>
              <strong>{title}</strong>
            </div>
            <div className="topbar-actions">
              <label className="search-field">
                <Search size={16} />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (page !== "tickets") setPage("tickets");
                  }}
                  placeholder="Search tickets"
                  aria-label="Search tickets"
                />
                <kbd>/</kbd>
              </label>
              <button
                className="icon-button"
                onClick={reload}
                aria-label="Reload workspace"
              >
                <RefreshCw size={16} />
              </button>
              <span className="avatar" title="Local user">
                Y
              </span>
            </div>
          </header>
          <main id="workspace-content" className="workspace-content">
            {error && (
              <div className="error-banner" role="alert">
                <span>{error}</span>
                <button onClick={reload}>Reload workspace</button>
                <button
                  className="icon-button"
                  onClick={() => setError("")}
                  aria-label="Dismiss error"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {data.revision === 0 && data.issues.length === 0 && (
              <div className="welcome-panel">
                <div className="welcome-art">
                  <img src="/brand/icon.svg" alt="" />
                </div>
                <div>
                  <span className="subtle-label">A fresh page</span>
                  <h1>Make room for your next idea.</h1>
                  <p>
                    Start with a clean workspace, or explore a small example
                    project. Everything stays{" "}
                    {adapter.mode === "browser"
                      ? "in this browser"
                      : "on this computer"}
                    .
                  </p>
                  <div className="button-row">
                    <button
                      className="button primary"
                      disabled={busy}
                      onClick={() =>
                        void commit(
                          {
                            ...data,
                            workspace: {
                              ...data.workspace,
                              name: "My workspace",
                            },
                          },
                          "Your workspace is ready",
                        )
                      }
                    >
                      Start fresh <Plus size={16} />
                    </button>
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() =>
                        void commit(
                          exampleWorkspace(data),
                          "Example workspace added",
                        )
                      }
                    >
                      Explore an example
                    </button>
                  </div>
                </div>
              </div>
            )}
            {page === "overview" && (
              <>
                <div className="page-heading">
                  <div>
                    <p className="subtle-label">
                      {new Date().toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <h1>Your work, in motion.</h1>
                    <p>A little structure for the things you want to make.</p>
                  </div>
                  <button className="button" onClick={() => setAi(true)}>
                    <Sparkles size={16} /> Plan with AI
                  </button>
                </div>
                <div className="stats-strip">
                  <div>
                    <span className="stat-symbol lilac">
                      <Inbox size={19} />
                    </span>
                    <div>
                      <strong>{openIssues.length}</strong>
                      <span>Open tickets</span>
                    </div>
                  </div>
                  <div>
                    <span className="stat-symbol blue">
                      <CircleDot size={19} />
                    </span>
                    <div>
                      <strong>
                        {
                          data.issues.filter((i) => i.status === "in_progress")
                            .length
                        }
                      </strong>
                      <span>In progress</span>
                    </div>
                  </div>
                  <div>
                    <span className="stat-symbol sage">
                      <CheckCircle2 size={19} />
                    </span>
                    <div>
                      <strong>{done}</strong>
                      <span>Completed</span>
                    </div>
                  </div>
                  <div>
                    <span className="stat-symbol peach">
                      <Target size={19} />
                    </span>
                    <div>
                      <strong>
                        {
                          data.projects.filter((p) => p.status === "active")
                            .length
                        }
                      </strong>
                      <span>Active projects</span>
                    </div>
                  </div>
                </div>
                <div className="overview-grid">
                  <section className="surface focus-section">
                    <div className="section-heading">
                      <h2>A good place to focus</h2>
                      <button
                        className="text-button"
                        onClick={() => navigate("tickets")}
                      >
                        All tickets <ArrowUpRight size={15} />
                      </button>
                    </div>
                    {openIssues.length ? (
                      issueRows(
                        [...openIssues]
                          .sort(
                            (a, b) =>
                              priorities.indexOf(a.priority) -
                              priorities.indexOf(b.priority),
                          )
                          .slice(0, 5),
                      )
                    ) : (
                      <Empty
                        icon={<CheckCircle2 />}
                        title="Clear head. Clear list."
                        text="Capture the next thing you want to move forward."
                        action={newButton}
                      />
                    )}
                  </section>
                  <section className="focus-note">
                    <div className="focus-note-icon">
                      <Sparkles size={21} />
                    </div>
                    <h2>
                      Big ideas start
                      <br />
                      with a small next step.
                    </h2>
                    <p>
                      Give your next project a name. Add one ticket. Take it
                      from there.
                    </p>
                    <button className="text-button" onClick={startProject}>
                      Create a project <Plus size={16} />
                    </button>
                    <div className="paper-corner" />
                  </section>
                </div>
                <div className="section-heading">
                  <h2>Projects taking shape</h2>
                  <button
                    className="text-button"
                    onClick={() => navigate("projects")}
                  >
                    View projects <ArrowUpRight size={15} />
                  </button>
                </div>
                <div className="project-grid">
                  {data.projects.slice(0, 3).map((project) => {
                    const issues = data.issues.filter(
                      (i) => i.projectId === project.id,
                    );
                    return (
                      <button
                        className="project-card"
                        key={project.id}
                        onClick={() => showProject(project.id)}
                      >
                        <div className="project-card-top">
                          <span
                            className="project-icon"
                            style={{
                              color: project.color,
                              background: `${project.color}15`,
                            }}
                          >
                            <FolderKanban size={21} />
                          </span>
                          <span className="tag">{project.status}</span>
                        </div>
                        <h3>{project.name}</h3>
                        <p>
                          {project.description ||
                            "Every project starts somewhere."}
                        </p>
                        <div className="progress-caption">
                          <span>
                            {issues.filter((i) => i.status === "done").length}{" "}
                            of {issues.length} tickets
                          </span>
                          <strong>{percent(issues)}%</strong>
                        </div>
                        <div className="progress-track">
                          <span
                            style={{
                              width: `${percent(issues)}%`,
                              background: project.color,
                            }}
                          />
                        </div>
                        <div className="project-footer">
                          <span>Target {dateLabel(project.targetDate)}</span>
                          <ArrowUpRight size={16} />
                        </div>
                      </button>
                    );
                  })}
                  <button className="new-project-card" onClick={startProject}>
                    <Plus size={23} />
                    <span>A home for your next idea</span>
                    <strong>New project</strong>
                  </button>
                </div>
              </>
            )}
            {page === "tickets" && (
              <>
                <div className="page-heading">
                  <div>
                    <h1>
                      {projectFilter !== "all"
                        ? data.projects.find((p) => p.id === projectFilter)
                            ?.name
                        : cycleFilter !== "all"
                          ? data.cycles.find((c) => c.id === cycleFilter)?.name
                          : "All tickets"}{" "}
                      <span className="heading-count">{filtered.length}</span>
                    </h1>
                    <p>From a passing thought to a finished thing.</p>
                  </div>
                  {newButton}
                </div>
                <div className="ticket-toolbar">
                  <div className="filter-group">
                    <Filter size={15} />
                    <select
                      aria-label="Filter status"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All statuses</option>
                      {ISSUE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {statusNames[s]}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter priority"
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                    >
                      <option value="all">All priorities</option>
                      {priorities.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter project"
                      value={projectFilter}
                      onChange={(e) => setProjectFilter(e.target.value)}
                    >
                      <option value="all">All projects</option>
                      <option value="">No project</option>
                      {data.projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Filter cycle"
                      value={cycleFilter}
                      onChange={(e) => setCycleFilter(e.target.value)}
                    >
                      <option value="all">All cycles</option>
                      <option value="">No cycle</option>
                      {data.cycles.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="view-toggle">
                    <button
                      className={view === "list" ? "selected" : ""}
                      onClick={() => setView("list")}
                      aria-label="List view"
                      aria-pressed={view === "list"}
                    >
                      <List size={17} />
                    </button>
                    <button
                      className={view === "board" ? "selected" : ""}
                      onClick={() => setView("board")}
                      aria-label="Board view"
                      aria-pressed={view === "board"}
                    >
                      <LayoutGrid size={17} />
                    </button>
                  </div>
                </div>
                {!filtered.length ? (
                  <Empty
                    icon={<Inbox />}
                    title={
                      query || statusFilter !== "all"
                        ? "No matching tickets"
                        : "Your next step belongs here"
                    }
                    text={
                      query
                        ? "Try another title, label, owner, or ticket number."
                        : "Capture a task, add a little context, and give it a place to go."
                    }
                    action={newButton}
                  />
                ) : view === "list" ? (
                  <div className="surface grouped-list">
                    {ISSUE_STATUSES.map((status) => {
                      const issues = filtered.filter(
                        (i) => i.status === status,
                      );
                      return (
                        issues.length > 0 && (
                          <section key={status}>
                            <div className="list-group-label">
                              <StatusIcon status={status} />
                              <h2>{statusNames[status]}</h2>
                              <span>{issues.length}</span>
                            </div>
                            {issueRows(issues)}
                          </section>
                        )
                      );
                    })}
                  </div>
                ) : (
                  <div className="kanban">
                    {ISSUE_STATUSES.filter(
                      (s) =>
                        s !== "canceled" ||
                        filtered.some((i) => i.status === s),
                    ).map((status) => (
                      <section className="kanban-column" key={status}>
                        <div className="list-group-label">
                          <StatusIcon status={status} />
                          <h2>{statusNames[status]}</h2>
                          <span>
                            {filtered.filter((i) => i.status === status).length}
                          </span>
                        </div>
                        {filtered
                          .filter((i) => i.status === status)
                          .map((issue) => (
                            <article className="kanban-card" key={issue.id}>
                              <button onClick={() => setEdit(issue)}>
                                <span className="ticket-id">
                                  {issue.identifier}
                                </span>
                                <h3>{issue.title}</h3>
                                <div className="kanban-tags">
                                  {issue.labels.map((l) => (
                                    <span className="tag" key={l}>
                                      {l}
                                    </span>
                                  ))}
                                  {blocked(issue) && (
                                    <span className="blocked-badge">
                                      Blocked
                                    </span>
                                  )}
                                </div>
                              </button>
                              <div className="kanban-bottom">
                                <span
                                  className={`priority priority-${issue.priority}`}
                                >
                                  {issue.priority}
                                </span>
                                <select
                                  aria-label={`Status of ${issue.identifier}`}
                                  value={issue.status}
                                  disabled={busy}
                                  onChange={(e) =>
                                    void statusChange(
                                      issue,
                                      e.target.value as IssueStatus,
                                    )
                                  }
                                >
                                  {ISSUE_STATUSES.map((s) => (
                                    <option key={s} value={s}>
                                      {statusNames[s]}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </article>
                          ))}
                      </section>
                    ))}
                  </div>
                )}
              </>
            )}
            {page === "projects" && (
              <>
                <div className="page-heading">
                  <div>
                    <h1>Projects</h1>
                    <p>Keep the big picture close to the next step.</p>
                  </div>
                  <button className="button primary" onClick={startProject}>
                    <Plus size={16} /> New project
                  </button>
                </div>
                {!data.projects.length ? (
                  <Empty
                    icon={<FolderKanban />}
                    title="Give an idea a home"
                    text="A project brings related tickets and notes together, with a clear target."
                    action={
                      <button className="button" onClick={startProject}>
                        Create your first project
                      </button>
                    }
                  />
                ) : (
                  <div className="surface project-table">
                    {data.projects.map((p) => {
                      const issues = data.issues.filter(
                        (i) => i.projectId === p.id,
                      );
                      return (
                        <div className="project-table-row" key={p.id}>
                          <button
                            className="project-title-cell"
                            onClick={() => showProject(p.id)}
                          >
                            <span
                              className="project-icon"
                              style={{
                                color: p.color,
                                background: `${p.color}15`,
                              }}
                            >
                              <FolderKanban size={20} />
                            </span>
                            <span>
                              <strong>{p.name}</strong>
                              <small>
                                {p.description || `${issues.length} tickets`}
                              </small>
                            </span>
                          </button>
                          <span className="tag">{p.status}</span>
                          <div className="table-progress">
                            <span>{percent(issues)}%</span>
                            <div className="progress-track">
                              <span
                                style={{
                                  width: `${percent(issues)}%`,
                                  background: p.color,
                                }}
                              />
                            </div>
                          </div>
                          <span className="muted">
                            {dateLabel(p.targetDate)}
                          </span>
                          <button
                            className="icon-button"
                            aria-label={`Edit ${p.name}`}
                            onClick={() => setProjectEdit(p)}
                          >
                            <MoreHorizontal size={19} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
            {page === "cycles" && (
              <>
                <div className="page-heading">
                  <div>
                    <h1>Cycles</h1>
                    <p>Choose a short horizon. Make steady progress.</p>
                  </div>
                  <button className="button primary" onClick={startCycle}>
                    <Plus size={16} /> New cycle
                  </button>
                </div>
                {!data.cycles.length ? (
                  <Empty
                    icon={<CircleDashed />}
                    title="Find your rhythm"
                    text="Plan a focused period of work with a goal and a start and end date."
                    action={
                      <button className="button" onClick={startCycle}>
                        Create a cycle
                      </button>
                    }
                  />
                ) : (
                  <div className="cycle-grid">
                    {data.cycles.map((c) => {
                      const issues = data.issues.filter(
                        (i) => i.cycleId === c.id,
                      );
                      const points = issues.reduce(
                        (sum, i) => sum + i.estimate,
                        0,
                      );
                      return (
                        <section className="surface cycle-card" key={c.id}>
                          <div className="section-heading">
                            <span className="tag">
                              {c.endDate && c.endDate < today()
                                ? "Past"
                                : c.startDate > today()
                                  ? "Upcoming"
                                  : "Current"}
                            </span>
                            <button
                              className="icon-button"
                              aria-label={`Edit ${c.name}`}
                              onClick={() => setCycleEdit(c)}
                            >
                              <MoreHorizontal size={18} />
                            </button>
                          </div>
                          <h2>{c.name}</h2>
                          <p>{c.goal || "One focused stretch of work."}</p>
                          <div className="cycle-dates">
                            {dateLabel(c.startDate)} <span>to</span>{" "}
                            {dateLabel(c.endDate)}
                          </div>
                          <div className="progress-caption">
                            <span>
                              {issues.filter((i) => i.status === "done").length}{" "}
                              / {issues.length} tickets · {points} points
                              planned
                            </span>
                            <strong>{percent(issues)}%</strong>
                          </div>
                          <div className="progress-track">
                            <span style={{ width: `${percent(issues)}%` }} />
                          </div>
                          <button
                            className="text-button"
                            onClick={() => showCycle(c.id)}
                          >
                            View cycle tickets <ArrowUpRight size={15} />
                          </button>
                        </section>
                      );
                    })}
                  </div>
                )}
              </>
            )}
            {page === "notes" && (
              <>
                <div className="page-heading">
                  <div>
                    <h1>Notes</h1>
                    <p>Keep the thinking next to the doing.</p>
                  </div>
                  <button className="button primary" onClick={startNote}>
                    <Plus size={16} /> New note
                  </button>
                </div>
                {!data.notes.length ? (
                  <Empty
                    icon={<BookOpen />}
                    title="A place for the context"
                    text="Write a project brief, capture decisions, or keep a release checklist."
                    action={
                      <button className="button" onClick={startNote}>
                        Write your first note
                      </button>
                    }
                  />
                ) : (
                  <div className="notes-grid">
                    {data.notes.map((n) => (
                      <button
                        className="note-card"
                        key={n.id}
                        onClick={() => setNoteEdit(n)}
                      >
                        <BookOpen size={20} />
                        <h2>{n.title}</h2>
                        <p>{n.body.slice(0, 200) || "Add your thoughts…"}</p>
                        <span className="tag">
                          {data.projects.find((p) => p.id === n.projectId)
                            ?.name || "Workspace note"}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {page === "insights" && (
              <>
                <div className="page-heading">
                  <div>
                    <h1>Delivery at a glance</h1>
                    <p>A clear view of the work you have today.</p>
                  </div>
                  <button
                    className="button"
                    onClick={() => downloadBackup(data)}
                  >
                    <Download size={16} /> Export workspace
                  </button>
                </div>
                <div className="delivery-grid">
                  <section className="surface delivery-card">
                    <h2>Work distribution</h2>
                    <p className="muted">Current ticket counts by status</p>
                    <div className="distribution">
                      {ISSUE_STATUSES.map((status) => {
                        const count = data.issues.filter(
                          (i) => i.status === status,
                        ).length;
                        return (
                          <div key={status}>
                            <span>
                              <StatusIcon status={status} />
                              {statusNames[status]}
                            </span>
                            <div className="progress-track">
                              <span
                                className={`bar-${status}`}
                                style={{
                                  width: `${data.issues.length ? (count / data.issues.length) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <strong>{count}</strong>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                  <section className="surface delivery-card">
                    <h2>Needs a little attention</h2>
                    <div className="attention-stat">
                      <strong>
                        {
                          openIssues.filter(
                            (i) => i.dueDate && i.dueDate < today(),
                          ).length
                        }
                      </strong>
                      <div>
                        Overdue tickets
                        <small>Open work with a due date before today</small>
                      </div>
                    </div>
                    <div className="attention-stat">
                      <strong>{openIssues.filter(blocked).length}</strong>
                      <div>
                        Blocked tickets
                        <small>Waiting on an open dependency</small>
                      </div>
                    </div>
                    <div className="attention-stat">
                      <strong>
                        {openIssues.reduce((sum, i) => sum + i.estimate, 0)}
                      </strong>
                      <div>
                        Points remaining
                        <small>Estimated effort on open tickets</small>
                      </div>
                    </div>
                  </section>
                </div>
                <section className="surface activity-section">
                  <div className="section-heading">
                    <h2>Workspace activity</h2>
                    <span className="muted">Recent changes</span>
                  </div>
                  {data.activities.length ? (
                    [...data.activities]
                      .reverse()
                      .slice(0, 20)
                      .map((a) => (
                        <div className="activity-row" key={a.id}>
                          <span className="activity-dot" />
                          <div>
                            <strong>{a.action}</strong>
                            <small>{a.actor}</small>
                          </div>
                          <time>{new Date(a.at).toLocaleString()}</time>
                        </div>
                      ))
                  ) : (
                    <p className="muted">Your changes will appear here.</p>
                  )}
                </section>
              </>
            )}
            {page === "settings" && (
              <>
                <div className="page-heading">
                  <div>
                    <h1>Make yourself at home.</h1>
                    <p>Your workspace, your data, your way of working.</p>
                  </div>
                </div>
                <div className="settings-grid">
                  <section className="surface settings-card">
                    <h2>Workspace</h2>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = new FormData(e.currentTarget);
                        await commit(
                          {
                            ...data,
                            workspace: {
                              ...data.workspace,
                              name: String(form.get("name")).trim(),
                              key: String(form.get("key")).trim().toUpperCase(),
                            },
                          },
                          "Workspace settings saved",
                        );
                      }}
                    >
                      <label>
                        Workspace name
                        <input
                          key={data.workspace.name}
                          name="name"
                          required
                          maxLength={80}
                          defaultValue={data.workspace.name}
                        />
                      </label>
                      <label>
                        Ticket prefix
                        <input
                          key={data.workspace.key}
                          name="key"
                          required
                          pattern="[A-Za-z][A-Za-z0-9]{0,9}"
                          maxLength={10}
                          defaultValue={data.workspace.key}
                        />
                      </label>
                      <p className="field-hint">
                        New tickets use this prefix. Existing ticket IDs stay
                        the same.
                      </p>
                      <button className="button primary" disabled={busy}>
                        Save settings
                      </button>
                    </form>
                  </section>
                  <section className="surface settings-card">
                    <h2>
                      <ShieldCheck size={19} /> Local by design
                    </h2>
                    <div className="storage-panel">
                      <strong>
                        {adapter.mode === "browser"
                          ? "Browser workspace"
                          : adapter.mode === "desktop"
                            ? "Desktop workspace"
                            : "Local server workspace"}
                      </strong>
                      <p>
                        {adapter.mode === "browser"
                          ? "Your work is stored in this browser on this device. Clearing site data will remove it. Export backups regularly."
                          : "Your work is stored in a SQLite database on this computer. Export a backup to move it to another device."}
                      </p>
                    </div>
                    <p className="field-hint">
                      Browser and desktop workspaces are separate. Use export
                      and import to move your work. Cloud sync and shared team
                      workspaces are planned.
                    </p>
                    <button
                      className="button"
                      onClick={() =>
                        void navigator.storage
                          ?.persist?.()
                          .then((granted) =>
                            setToast(
                              granted
                                ? "Persistent browser storage enabled"
                                : "Browser controls storage retention. Keep regular backups.",
                            ),
                          )
                      }
                    >
                      Request persistent browser storage
                    </button>
                  </section>
                  <section className="surface settings-card">
                    <h2>Backups & portability</h2>
                    <p>
                      Take your projects, tickets, notes, and activity with you
                      as a readable JSON file.
                    </p>
                    <div className="button-row">
                      <button
                        className="button"
                        onClick={() => downloadBackup(data)}
                      >
                        <Download size={16} /> Export backup
                      </button>
                      <label className="button file-button">
                        <Upload size={16} /> Import backup
                        <input
                          type="file"
                          accept=".json,application/json"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            e.target.value = "";
                            if (!file) return;
                            try {
                              if (file.size > 5 * 1024 * 1024)
                                throw new Error(
                                  "Choose a backup smaller than 5 MB.",
                                );
                              setImportData(
                                parseWorkspace(JSON.parse(await file.text())),
                              );
                            } catch (err) {
                              setError(
                                `Import could not be opened: ${message(err)}`,
                              );
                            }
                          }}
                        />
                      </label>
                    </div>
                    {adapter.mode === "browser" && (
                      <button
                        className="text-button"
                        onClick={async () => {
                          const previous = await previousBrowserSnapshot();
                          if (previous) downloadBackup(previous);
                          else setToast("No earlier snapshot exists yet.");
                        }}
                      >
                        Download previous saved snapshot
                      </button>
                    )}
                    <p className="field-hint">
                      Import is validated first. You can review before replacing
                      this workspace.
                    </p>
                  </section>
                  <section className="surface settings-card">
                    <h2>
                      <Sparkles size={19} /> AI & agents
                    </h2>
                    <p>
                      {aiConfigured
                        ? "Your local AI provider is configured. Prompts are sent only when you ask for a plan."
                        : "Connect your own AI provider in the local app. The web workspace works independently of AI."}
                    </p>
                    <p className="field-hint">
                      The local MCP server lets compatible AI clients list,
                      create, and update work. Configure access in your local
                      installation.
                    </p>
                    <button className="button" onClick={() => setAi(true)}>
                      Open AI planner
                    </button>
                    <a
                      className="text-button"
                      href="https://github.com/microyee-ai/zettel/blob/v0.1.0-alpha.1/docs/local-runtime.md"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Local setup guide <ArrowUpRight size={15} />
                    </a>
                  </section>
                  <section className="surface settings-card reset-card">
                    <h2>A clean page</h2>
                    <p>
                      Export your work before starting over. This replaces only
                      the workspace you are using now.
                    </p>
                    <button
                      className="button danger"
                      onClick={() => setConfirmReset(true)}
                    >
                      Reset workspace
                    </button>
                  </section>
                </div>
              </>
            )}
            <footer className="app-footer">
              <span>A little structure. A lot of progress.</span>
              <span>Zettel · Local preview</span>
            </footer>
          </main>
        </div>
        {toast && (
          <div className="toast" role="status">
            <Check size={16} />
            {toast}
          </div>
        )}
        {(newIssue || edit) && (
          <IssueEditor
            data={data}
            issue={
              edit ??
              createIssue(data, {
                title: "Untitled",
                projectId: projectFilter === "all" ? "" : projectFilter,
                cycleId: cycleFilter === "all" ? "" : cycleFilter,
              })
            }
            isNew={!edit}
            busy={busy}
            onClose={() => {
              setNewIssue(false);
              setEdit(null);
            }}
            onSave={async (issue) => {
              const next = {
                ...data,
                issues: edit
                  ? data.issues.map((i) => (i.id === issue.id ? issue : i))
                  : [...data.issues, issue],
              };
              if (
                await commit(
                  next,
                  `${issue.identifier} ${edit ? "updated" : "created"}`,
                  issue.id,
                )
              ) {
                setEdit(null);
                setNewIssue(false);
              }
            }}
            onDelete={async (issue) => {
              const next = {
                ...data,
                issues: data.issues
                  .filter((i) => i.id !== issue.id)
                  .map((i) => ({
                    ...i,
                    parentId: i.parentId === issue.id ? "" : i.parentId,
                    blockedBy: i.blockedBy.filter((id) => id !== issue.id),
                  })),
              };
              if (await commit(next, `${issue.identifier} deleted`, issue.id))
                setEdit(null);
            }}
          />
        )}
        {projectEdit && (
          <Modal
            title={
              data.projects.some((p) => p.id === projectEdit.id)
                ? "Edit project"
                : "A new project"
            }
            onClose={() => setProjectEdit(null)}
          >
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const projects = data.projects.some(
                  (p) => p.id === projectEdit.id,
                )
                  ? data.projects.map((p) =>
                      p.id === projectEdit.id ? projectEdit : p,
                    )
                  : [...data.projects, projectEdit];
                if (await commit({ ...data, projects }, "Project saved"))
                  setProjectEdit(null);
              }}
            >
              <label>
                Project name
                <input
                  autoFocus
                  required
                  maxLength={120}
                  value={projectEdit.name}
                  onChange={(e) =>
                    setProjectEdit({ ...projectEdit, name: e.target.value })
                  }
                  placeholder="What are you making?"
                />
              </label>
              <label>
                Description
                <textarea
                  value={projectEdit.description}
                  onChange={(e) =>
                    setProjectEdit({
                      ...projectEdit,
                      description: e.target.value,
                    })
                  }
                  placeholder="The outcome you want to create"
                />
              </label>
              <div className="form-grid">
                <label>
                  Status
                  <select
                    value={projectEdit.status}
                    onChange={(e) =>
                      setProjectEdit({
                        ...projectEdit,
                        status: e.target.value as Project["status"],
                      })
                    }
                  >
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
                <label>
                  Target date
                  <input
                    type="date"
                    value={projectEdit.targetDate}
                    onChange={(e) =>
                      setProjectEdit({
                        ...projectEdit,
                        targetDate: e.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  Project color
                  <input
                    type="color"
                    value={projectEdit.color}
                    onChange={(e) =>
                      setProjectEdit({ ...projectEdit, color: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button"
                  onClick={() => setProjectEdit(null)}
                >
                  Cancel
                </button>
                <button className="button primary" disabled={busy}>
                  Save project
                </button>
              </div>
            </form>
          </Modal>
        )}
        {cycleEdit && (
          <Modal title="Plan a cycle" onClose={() => setCycleEdit(null)}>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const cycles = data.cycles.some((c) => c.id === cycleEdit.id)
                  ? data.cycles.map((c) =>
                      c.id === cycleEdit.id ? cycleEdit : c,
                    )
                  : [...data.cycles, cycleEdit];
                if (await commit({ ...data, cycles }, "Cycle saved"))
                  setCycleEdit(null);
              }}
            >
              <label>
                Cycle name
                <input
                  autoFocus
                  required
                  value={cycleEdit.name}
                  onChange={(e) =>
                    setCycleEdit({ ...cycleEdit, name: e.target.value })
                  }
                  placeholder="A focused week"
                />
              </label>
              <label>
                Goal
                <textarea
                  value={cycleEdit.goal}
                  onChange={(e) =>
                    setCycleEdit({ ...cycleEdit, goal: e.target.value })
                  }
                />
              </label>
              <div className="form-grid">
                <label>
                  Start date
                  <input
                    required
                    type="date"
                    value={cycleEdit.startDate}
                    onChange={(e) =>
                      setCycleEdit({ ...cycleEdit, startDate: e.target.value })
                    }
                  />
                </label>
                <label>
                  End date
                  <input
                    required
                    min={cycleEdit.startDate}
                    type="date"
                    value={cycleEdit.endDate}
                    onChange={(e) =>
                      setCycleEdit({ ...cycleEdit, endDate: e.target.value })
                    }
                  />
                </label>
              </div>
              <div className="modal-actions">
                <button className="button primary" disabled={busy}>
                  Save cycle
                </button>
              </div>
            </form>
          </Modal>
        )}
        {noteEdit && (
          <Modal title="Project note" wide onClose={() => setNoteEdit(null)}>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const notes = data.notes.some((n) => n.id === noteEdit.id)
                  ? data.notes.map((n) => (n.id === noteEdit.id ? noteEdit : n))
                  : [...data.notes, noteEdit];
                if (await commit({ ...data, notes }, "Note saved"))
                  setNoteEdit(null);
              }}
            >
              <label>
                Title
                <input
                  required
                  value={noteEdit.title}
                  onChange={(e) =>
                    setNoteEdit({ ...noteEdit, title: e.target.value })
                  }
                  placeholder="A thought worth keeping"
                />
              </label>
              <label>
                Project
                <select
                  value={noteEdit.projectId}
                  onChange={(e) =>
                    setNoteEdit({ ...noteEdit, projectId: e.target.value })
                  }
                >
                  <option value="">Workspace note</option>
                  {data.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Note
                <textarea
                  className="note-editor"
                  value={noteEdit.body}
                  onChange={(e) =>
                    setNoteEdit({ ...noteEdit, body: e.target.value })
                  }
                  placeholder="Goals, decisions, a little context…"
                />
              </label>
              {noteEdit.projectId && (
                <div className="linked-work">
                  <h3>Linked project work</h3>
                  {data.issues
                    .filter((i) => i.projectId === noteEdit.projectId)
                    .map((i) => (
                      <div key={i.id}>
                        <StatusIcon status={i.status} />
                        <span>{i.identifier}</span>
                        {i.title}
                      </div>
                    ))}
                </div>
              )}
              <div className="modal-actions">
                <button className="button primary" disabled={busy}>
                  Save note
                </button>
              </div>
            </form>
          </Modal>
        )}
        {ai && (
          <AiPlanner
            adapter={adapter}
            configured={aiConfigured}
            busy={busy}
            onClose={() => setAi(false)}
            onApply={async (proposals) => {
              const next = structuredClone(data);
              for (const draft of proposals)
                next.issues.push(
                  createIssue(next, { ...draft, status: "backlog" }),
                );
              if (
                await commit(
                  next,
                  `${proposals.length} reviewed AI tickets created`,
                )
              ) {
                setAi(false);
                navigate("tickets");
              }
            }}
          />
        )}
        {confirmReset && (
          <Modal
            title="Start with a clean workspace?"
            onClose={() => setConfirmReset(false)}
          >
            <p>
              Your current workspace will be replaced. Save a backup first if
              you want to keep it.
            </p>
            <div className="modal-actions">
              <button className="button" onClick={() => downloadBackup(data)}>
                <Download size={16} /> Export first
              </button>
              <button
                className="button danger"
                disabled={busy}
                onClick={async () => {
                  if (await commit(emptyWorkspace(), "Workspace reset")) {
                    setConfirmReset(false);
                    navigate("overview");
                  }
                }}
              >
                Reset workspace
              </button>
            </div>
          </Modal>
        )}
        {importData && (
          <Modal
            title="Restore this workspace?"
            onClose={() => setImportData(undefined)}
          >
            <p>
              <strong>{importData.workspace.name}</strong> contains{" "}
              {importData.issues.length} tickets, {importData.projects.length}{" "}
              projects, and {importData.notes.length} notes.
            </p>
            <p>
              This replaces the current workspace. A backup of your current data
              will download before replacement.
            </p>
            <div className="modal-actions">
              <button
                className="button"
                onClick={() => setImportData(undefined)}
              >
                Cancel
              </button>
              <button
                className="button primary"
                disabled={busy}
                onClick={async () => {
                  downloadBackup(data);
                  if (
                    await commit(importData, "Workspace restored from backup")
                  ) {
                    setImportData(undefined);
                    navigate("overview");
                  }
                }}
              >
                Back up & restore
              </button>
            </div>
          </Modal>
        )}
      </div>
    </FeedbackContext.Provider>
  );
}

function IssueEditor({
  data,
  issue,
  isNew,
  busy,
  onClose,
  onSave,
  onDelete,
}: {
  data: WorkspaceData;
  issue: Issue;
  isNew: boolean;
  busy: boolean;
  onClose: () => void;
  onSave: (issue: Issue) => Promise<void>;
  onDelete: (issue: Issue) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Issue>(() => ({
    ...issue,
    title: isNew ? "" : issue.title,
  }));
  const [comment, setComment] = useState("");
  const [labels, setLabels] = useState(issue.labels.join(", "));
  const [deleting, setDeleting] = useState(false);
  const update = <K extends keyof Issue>(key: K, value: Issue[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));
  return (
    <Modal
      title={isNew ? "A new ticket" : issue.identifier}
      wide
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSave({
            ...draft,
            title: draft.title.trim(),
            labels: [
              ...new Set(
                labels
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              ),
            ],
            updatedAt: new Date().toISOString(),
            comments: comment.trim()
              ? [
                  ...draft.comments,
                  {
                    id: uid(),
                    body: comment.trim(),
                    author: "You",
                    createdAt: new Date().toISOString(),
                  },
                ]
              : draft.comments,
          });
        }}
      >
        <label className="ticket-title-input">
          Title
          <input
            autoFocus
            required
            maxLength={500}
            placeholder="What’s the next step?"
            value={draft.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </label>
        <label>
          Description & acceptance criteria
          <textarea
            rows={5}
            placeholder="Add context, a useful link, or what done looks like…"
            value={draft.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>
        <div className="form-grid three">
          <label>
            Status
            <select
              value={draft.status}
              onChange={(e) => update("status", e.target.value as IssueStatus)}
            >
              {ISSUE_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusNames[s]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Priority
            <select
              value={draft.priority}
              onChange={(e) =>
                update("priority", e.target.value as Issue["priority"])
              }
            >
              {priorities.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Assignee
            <input
              maxLength={120}
              placeholder="Unassigned"
              value={draft.assignee}
              onChange={(e) => update("assignee", e.target.value)}
            />
          </label>
          <label>
            Project
            <select
              value={draft.projectId}
              onChange={(e) => update("projectId", e.target.value)}
            >
              <option value="">No project</option>
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cycle
            <select
              value={draft.cycleId}
              onChange={(e) => update("cycleId", e.target.value)}
            >
              <option value="">No cycle</option>
              {data.cycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Due date
            <input
              type="date"
              value={draft.dueDate}
              onChange={(e) => update("dueDate", e.target.value)}
            />
          </label>
          <label>
            Estimate (points)
            <input
              type="number"
              min="0"
              max="1000"
              step="0.5"
              value={draft.estimate}
              onChange={(e) => update("estimate", Number(e.target.value))}
            />
          </label>
          <label>
            Parent ticket
            <select
              value={draft.parentId}
              onChange={(e) => update("parentId", e.target.value)}
            >
              <option value="">No parent</option>
              {data.issues
                .filter((i) => i.id !== draft.id)
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.identifier} {i.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Labels (comma separated)
            <input
              value={labels}
              onChange={(e) => setLabels(e.target.value)}
              placeholder="Design, Engineering"
            />
          </label>
        </div>
        <details
          className="dependency-details"
          open={draft.blockedBy.length > 0}
        >
          <summary>
            Dependencies{" "}
            {draft.blockedBy.length > 0 && `(${draft.blockedBy.length})`}
          </summary>
          <p className="field-hint">
            Select the tickets that must finish before this one.
          </p>
          <div className="dependency-options">
            {data.issues
              .filter((i) => i.id !== draft.id)
              .map((i) => (
                <label key={i.id}>
                  <input
                    type="checkbox"
                    checked={draft.blockedBy.includes(i.id)}
                    onChange={(e) =>
                      update(
                        "blockedBy",
                        e.target.checked
                          ? [...draft.blockedBy, i.id]
                          : draft.blockedBy.filter((id) => id !== i.id),
                      )
                    }
                  />
                  <span>
                    {i.identifier} · {i.title}
                  </span>
                </label>
              ))}
            {data.issues.length === 0 && (
              <p className="muted">
                Create another ticket to add a dependency.
              </p>
            )}
          </div>
        </details>
        {!isNew && (
          <section className="comments">
            <h3>Discussion</h3>
            {draft.comments.map((c) => (
              <article key={c.id}>
                <span className="avatar">{c.author[0]}</span>
                <div>
                  <strong>{c.author}</strong>
                  <time>{new Date(c.createdAt).toLocaleString()}</time>
                  <p>{c.body}</p>
                </div>
              </article>
            ))}
            <label>
              Add a comment
              <textarea
                rows={2}
                placeholder="An update, a question, a decision…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
          </section>
        )}
        <div className="modal-actions">
          {!isNew &&
            (deleting ? (
              <button
                type="button"
                className="button danger"
                disabled={busy}
                onClick={() => void onDelete(draft)}
              >
                Confirm delete
              </button>
            ) : (
              <button
                type="button"
                className="icon-button delete-ticket"
                aria-label="Delete ticket"
                onClick={() => setDeleting(true)}
              >
                <Trash2 size={17} />
              </button>
            ))}
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? "Saving…" : isNew ? "Create ticket" : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AiPlanner({
  adapter,
  configured,
  busy,
  onClose,
  onApply,
}: {
  adapter: WorkspaceAdapter;
  configured: boolean;
  busy: boolean;
  onClose: () => void;
  onApply: (issues: Proposal["issues"]) => Promise<void>;
}) {
  const [prompt, setPrompt] = useState("");
  const [proposal, setProposal] = useState<Proposal>();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function generate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await adapter.propose(prompt);
      setProposal(result);
      setSelected(new Set(result.issues.map((_, i) => i)));
    } catch (err) {
      setError(message(err));
    } finally {
      setLoading(false);
    }
  }
  return (
    <Modal title="A thought into a plan" wide onClose={onClose}>
      <div className="ai-intro">
        <span className="stat-symbol lilac">
          <Sparkles size={24} />
        </span>
        <p>
          Describe what you want to make. Review a set of small, actionable
          tickets before adding them to your backlog.
        </p>
      </div>
      {!configured ? (
        <div className="ai-setup">
          <h3>Bring your own AI</h3>
          <p>
            AI planning runs through your local Zettel app. Configure a provider
            there to keep your credentials off the public web.
          </p>
          <ol>
            <li>Install or build the local app.</li>
            <li>
              Set <code>ZETTEL_AI_BASE_URL</code>, <code>ZETTEL_AI_MODEL</code>,
              and <code>ZETTEL_AI_API_KEY</code> for the local process.
            </li>
            <li>Open its workspace and return to this planner.</li>
          </ol>
          <p>
            Regular tickets, projects, and notes work without an AI connection.
          </p>
          <a
            className="button"
            href="https://github.com/microyee-ai/zettel/blob/v0.1.0-alpha.1/docs/local-runtime.md"
            target="_blank"
            rel="noreferrer"
          >
            Read the local setup guide <ArrowUpRight size={15} />
          </a>
        </div>
      ) : (
        <>
          <form onSubmit={generate}>
            <label>
              Your idea
              <textarea
                required
                minLength={10}
                maxLength={12000}
                rows={5}
                placeholder="I’m launching a small product. Help me plan the onboarding, feedback loop, and release checklist…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </label>
            <p className="field-hint">
              Only this prompt is sent to your configured provider. Your
              workspace is not sent automatically. Provider usage may incur
              charges.
            </p>
            <button className="button primary" disabled={loading}>
              {loading ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Sparkles size={16} />
              )}
              {loading ? "Drafting your plan…" : "Generate a draft plan"}
            </button>
          </form>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {proposal && (
            <section className="proposal">
              <h3>Review your proposed tickets</h3>
              <p className="field-hint">
                Choose what to keep. Nothing is saved until you add it.
              </p>
              {proposal.issues.map((issue, index) => (
                <label className="proposal-row" key={index}>
                  <input
                    type="checkbox"
                    checked={selected.has(index)}
                    onChange={(e) =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (e.target.checked) next.add(index);
                        else next.delete(index);
                        return next;
                      })
                    }
                  />
                  <div>
                    <strong>{issue.title}</strong>
                    <p>{issue.description}</p>
                  </div>
                </label>
              ))}
              <div className="modal-actions">
                <button
                  className="button primary"
                  disabled={!selected.size || busy}
                  onClick={() =>
                    void onApply(
                      proposal.issues.filter((_, i) => selected.has(i)),
                    )
                  }
                >
                  Add {selected.size} tickets to backlog
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </Modal>
  );
}

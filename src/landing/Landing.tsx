import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  CircleCheck,
  CircleDashed,
  CircleDot,
  Code2,
  Command,
  Download,
  FileText,
  FolderKanban,
  HardDrive,
  Inbox,
  Layers,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Terminal,
} from "lucide-react";
import "./landing.css";

const repository = "https://github.com/microyee-ai/zettel";
const releaseTag = "v0.1.0-alpha.2";
const releaseUrl = `${repository}/releases/tag/${releaseTag}`;
const sourceGuide = `${repository}/blob/${releaseTag}/docs/local-runtime.md`;
const tickets = [
  {
    id: "ZET-24",
    title: "Design the first-run experience",
    status: "progress",
    priority: "High",
    project: "Workspace launch",
    label: "Design",
    description:
      "Make the first five minutes feel effortless. A clear starting point, a useful example, and a workspace that gets out of the way.",
  },
  {
    id: "ZET-23",
    title: "Connect tickets to project notes",
    status: "progress",
    priority: "Medium",
    project: "Workspace launch",
    label: "Product",
    description:
      "Keep the decisions behind the work close to the tickets. Link project notes directly from the workspace.",
  },
  {
    id: "ZET-22",
    title: "Add keyboard navigation",
    status: "todo",
    priority: "High",
    project: "Workspace launch",
    label: "Experience",
    description:
      "Move through the workspace with the keyboard. Make focus visible and keep common actions close.",
  },
  {
    id: "ZET-21",
    title: "Write the release checklist",
    status: "todo",
    priority: "Medium",
    project: "Workspace launch",
    label: "Release",
    description:
      "Collect the release checks, install instructions, and known limitations in one place before publishing.",
  },
  {
    id: "ZET-20",
    title: "Verify backup and restore",
    status: "done",
    priority: "High",
    project: "Workspace launch",
    label: "Engineering",
    description:
      "Export a workspace, restore it in a fresh session, and verify tickets, notes, and relationships.",
  },
  {
    id: "ZET-19",
    title: "Define the project milestones",
    status: "done",
    priority: "Medium",
    project: "Workspace launch",
    label: "Product",
    description:
      "Give the project a clear outcome and an achievable first cycle.",
  },
];
type SampleTicket = (typeof tickets)[number];

function Status({ status }: { status: string }) {
  const Icon =
    status === "done"
      ? CircleCheck
      : status === "progress"
        ? CircleDot
        : CircleDashed;
  return (
    <Icon
      size={15}
      className={`lp-status lp-status-${status}`}
      aria-hidden="true"
    />
  );
}
function Brand() {
  return (
    <span className="lp-brand">
      <img src="/brand/zettel-mark.svg" width="23" height="23" alt="" />
      <span>zettel</span>
    </span>
  );
}
function ProductPreview() {
  const [view, setView] = useState<"list" | "board">("list");
  const [selected, setSelected] = useState<SampleTicket>(tickets[0]);
  return (
    <div className="lp-preview" aria-label="Interactive sample workspace">
      <aside className="lp-preview-nav" aria-label="Sample navigation">
        <div className="lp-preview-brand">
          <img src="/brand/icon.svg" width="22" height="22" alt="" />
          <strong>Studio workspace</strong>
          <ChevronDown size={12} />
        </div>
        <div className="lp-preview-search">
          <Search size={14} />
          <span>Search</span>
          <kbd>/</kbd>
        </div>
        <span>
          <Inbox size={15} /> Overview
        </span>
        <span className="lp-preview-nav-active">
          <Layers size={15} /> Tickets <small>6</small>
        </span>
        <span>
          <FolderKanban size={15} /> Projects
        </span>
        <span>
          <CircleDashed size={15} /> Cycles
        </span>
        <span>
          <FileText size={15} /> Notes
        </span>
        <p>Projects</p>
        <span>
          <i className="lp-project-dot" /> Workspace launch
        </span>
        <div className="lp-preview-local">
          <HardDrive size={13} /> Local workspace
        </div>
      </aside>
      <div className="lp-preview-main">
        <div className="lp-preview-heading">
          <span>
            Workspace <span className="lp-slash">/</span>{" "}
            <strong>Tickets</strong>
          </span>
          <span className="lp-sample-label">Sample workspace</span>
        </div>
        <div className="lp-preview-toolbar">
          <span>
            <Layers size={14} /> All tickets <small>6</small>
          </span>
          <div className="lp-preview-view" aria-label="Sample ticket view">
            <button
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              aria-label="Preview list view"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setView("board")}
              aria-pressed={view === "board"}
              aria-label="Preview board view"
            >
              <LayoutGrid size={14} />
            </button>
          </div>
        </div>
        {view === "list" ? (
          <div className="lp-sample-list">
            <div className="lp-sample-group">
              <CircleDot size={13} />
              <span>Current cycle</span>
              <small>6 tickets</small>
            </div>
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                className={`lp-sample-row ${selected.id === ticket.id ? "is-selected" : ""}`}
                onClick={() => setSelected(ticket)}
                aria-pressed={selected.id === ticket.id}
              >
                <Status status={ticket.status} />
                <span className="lp-ticket-id">{ticket.id}</span>
                <span className="lp-ticket-title">{ticket.title}</span>
                <span className="lp-ticket-label">{ticket.label}</span>
                <span className="lp-mini-avatar">S</span>
              </button>
            ))}
            <div className="lp-preview-bottom">
              <Check size={12} />
              <span>All changes saved locally</span>
            </div>
          </div>
        ) : (
          <div className="lp-sample-board">
            {[
              { status: "todo", name: "To do" },
              { status: "progress", name: "In progress" },
              { status: "done", name: "Done" },
            ].map((column) => (
              <div key={column.status}>
                <div className="lp-sample-column-heading">
                  <Status status={column.status} />
                  {column.name}
                  <small>2</small>
                </div>
                {tickets
                  .filter((t) => t.status === column.status)
                  .map((ticket) => (
                    <button
                      key={ticket.id}
                      className={`lp-sample-card ${selected.id === ticket.id ? "is-selected" : ""}`}
                      onClick={() => setSelected(ticket)}
                      aria-pressed={selected.id === ticket.id}
                    >
                      <span className="lp-ticket-id">{ticket.id}</span>
                      <strong>{ticket.title}</strong>
                      <span className="lp-ticket-label">{ticket.label}</span>
                    </button>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <aside className="lp-preview-detail" aria-label="Sample ticket details">
        <div className="lp-detail-top">
          <span>{selected.id}</span>
          <MoreHorizontal size={17} />
        </div>
        <h3>{selected.title}</h3>
        <p>{selected.description}</p>
        <div className="lp-detail-properties">
          <span>Status</span>
          <strong>
            <Status status={selected.status} />
            {selected.status === "progress"
              ? "In progress"
              : selected.status === "done"
                ? "Done"
                : "To do"}
          </strong>
          <span>Priority</span>
          <strong>
            <span className="lp-priority-bars">▂▅▇</span>
            {selected.priority}
          </strong>
          <span>Project</span>
          <strong>
            <FolderKanban size={13} />
            Workspace launch
          </strong>
          <span>Cycle</span>
          <strong>
            <CircleDashed size={13} />
            Launch cycle
          </strong>
        </div>
        <div className="lp-detail-note">
          <FileText size={14} />
          <span>
            Project brief <ArrowUpRight size={12} />
          </span>
        </div>
        <div className="lp-detail-activity">
          <span className="lp-mini-avatar">S</span>
          <p>
            Sam moved this ticket to{" "}
            <strong>
              {selected.status === "progress"
                ? "In progress"
                : selected.status === "done"
                  ? "Done"
                  : "To do"}
            </strong>
            <small>Just now · sample activity</small>
          </p>
        </div>
      </aside>
    </div>
  );
}

export default function Landing({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="landing">
      <a className="lp-skip" href="#main-content">
        Skip to content
      </a>
      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <a href="#" aria-label="Zettel home">
            <Brand />
          </a>
          <nav aria-label="Main navigation">
            <a href="#product">Product</a>
            <a href="#local-first">Local first</a>
            <a href="#pricing">Pricing</a>
            <a href={repository} target="_blank" rel="noreferrer">
              GitHub <ArrowUpRight size={12} />
            </a>
          </nav>
          <button
            className="lp-button lp-button-small lp-button-light"
            onClick={onOpen}
          >
            Open workspace <ArrowRight size={13} />
          </button>
        </div>
      </header>
      <main id="main-content">
        <section
          className="lp-hero lp-container"
          aria-labelledby="hero-heading"
        >
          <a
            className="lp-release"
            href={releaseUrl}
            target="_blank"
            rel="noreferrer"
          >
            <span className="lp-release-dot" /> Zettel is in early preview{" "}
            <ArrowRight size={13} />
          </a>
          <h1 id="hero-heading">
            A sharper way
            <br />
            to move work forward.
          </h1>
          <div className="lp-hero-bottom">
            <p>
              Tickets, projects, and the context behind them.
              <br className="lp-desktop-break" /> One focused workspace. On your
              device. On your terms.
            </p>
            <div className="lp-hero-actions">
              <button className="lp-button lp-button-light" onClick={onOpen}>
                Start your workspace <ArrowRight size={15} />
              </button>
              <a className="lp-text-link" href="#downloads">
                Get desktop <Download size={14} />
              </a>
            </div>
          </div>
          <ProductPreview />
          <div className="lp-proof-line">
            <span>
              <HardDrive size={14} /> Local-first storage
            </span>
            <span>
              <Command size={14} /> Keyboard shortcuts
            </span>
            <span>
              <Terminal size={14} /> AI & MCP in local setups
            </span>
            <span>
              <Code2 size={14} /> Open source
            </span>
          </div>
        </section>

        <section
          className="lp-container lp-section"
          id="product"
          aria-labelledby="product-heading"
        >
          <div className="lp-section-intro">
            <div>
              <span className="lp-eyebrow">
                <Layers size={15} /> Built around the work
              </span>
              <h2 id="product-heading">
                Less overhead.
                <br />A clearer next step.
              </h2>
            </div>
            <p>
              Capture the idea. Give it a project. Keep the decisions close.
              Zettel brings the essential pieces together so you can follow the
              work through.
            </p>
          </div>
          <div className="lp-workflow-grid">
            <article>
              <span className="lp-feature-number">01</span>
              <h3>Capture with clarity.</h3>
              <p>
                Set priorities, link dependencies, and keep acceptance criteria
                with the ticket. Switch between a focused list and a board.
              </p>
              <div className="lp-feature-example">
                <CircleDot size={15} />
                <span className="lp-ticket-id">ZET-24</span>
                <strong>Design the first-run experience</strong>
              </div>
            </article>
            <article>
              <span className="lp-feature-number">02</span>
              <h3>Plan with perspective.</h3>
              <p>
                Organize tickets into projects and timeboxed cycles. See what is
                moving, what is blocked, and what is ready to ship.
              </p>
              <div className="lp-project-example">
                <span>
                  <FolderKanban size={15} /> Workspace launch
                </span>
                <div className="lp-progress-track">
                  <i />
                </div>
                <small>2 of 6 completed</small>
              </div>
            </article>
            <article>
              <span className="lp-feature-number">03</span>
              <h3>Keep the context.</h3>
              <p>
                Connect notes to projects and tickets. The thinking behind a
                decision belongs next to the work it changes.
              </p>
              <div className="lp-feature-example">
                <FileText size={15} />
                <strong>Launch brief</strong>
                <span className="lp-inline-muted">3 linked tickets</span>
              </div>
            </article>
          </div>
        </section>

        <section
          className="lp-container lp-section lp-local"
          id="local-first"
          aria-labelledby="local-heading"
        >
          <div className="lp-local-copy">
            <span className="lp-eyebrow">
              <HardDrive size={15} /> Local by design
            </span>
            <h2 id="local-heading">
              Your device.
              <br />
              Your workspace.
            </h2>
            <p>
              Start without an account. Your work is saved locally, with
              portable backups whenever you need them.
            </p>
            <a
              className="lp-text-link"
              href={sourceGuide}
              target="_blank"
              rel="noreferrer"
            >
              Explore the local setup <ArrowUpRight size={14} />
            </a>
            <p className="lp-boundary">
              Browser data stays in that browser. Desktop uses its own local
              store. Export backups regularly; devices do not sync
              automatically.
            </p>
          </div>
          <div
            className="lp-local-diagram"
            aria-label="Browser and desktop each keep a local workspace, with JSON export and import to move your data"
          >
            <div className="lp-diagram-header">
              <span>
                <span className="lp-release-dot" /> Local workspace
              </span>
              <span>Under your control</span>
            </div>
            <div className="lp-storage-node">
              <div className="lp-storage-icon">
                <img
                  src="/brand/zettel-mark.svg"
                  width="26"
                  height="26"
                  alt=""
                />
              </div>
              <strong>Your work</strong>
              <span>Tickets · projects · cycles · notes</span>
            </div>
            <div className="lp-diagram-connectors" aria-hidden="true">
              <span />
              <span />
            </div>
            <div className="lp-storage-options">
              <div>
                <HardDrive size={19} />
                <strong>On your device</strong>
                <span>Browser or desktop</span>
              </div>
              <div>
                <Download size={19} />
                <strong>Portable backups</strong>
                <span>Export and restore JSON</span>
              </div>
            </div>
            <div className="lp-diagram-footer">
              <Code2 size={14} /> Apache-2.0 source. Yours to build on.
            </div>
          </div>
        </section>

        <section
          className="lp-container lp-section lp-ai"
          aria-labelledby="ai-heading"
        >
          <div className="lp-section-intro">
            <div>
              <span className="lp-eyebrow">
                <Terminal size={15} /> For you and your tools
              </span>
              <h2 id="ai-heading">
                Move faster.
                <br />
                Keep the final say.
              </h2>
            </div>
            <p>
              Turn a rough idea into proposed tickets with your own AI provider.
              Review before creating. Connect an MCP client to work directly
              with your local workspace.
            </p>
          </div>
          <div className="lp-ai-panel">
            <div className="lp-ai-prompt">
              <div className="lp-panel-caption">
                <Command size={14} /> AI planner{" "}
                <span>Illustrative review flow</span>
              </div>
              <p>
                Plan a thoughtful first release.
                <br />
                <span>Keep it focused on the core workflow.</span>
              </p>
              <div className="lp-prompt-bottom">
                <span>Your provider · local setup</span>
                <ArrowRight size={16} />
              </div>
            </div>
            <div className="lp-ai-review">
              <div className="lp-panel-caption">
                <Layers size={14} /> Proposed tickets{" "}
                <span>Review before creating</span>
              </div>
              {[
                "Define the first complete workflow",
                "Verify backup and restore",
                "Prepare release notes",
              ].map((title, i) => (
                <div className="lp-proposal" key={title}>
                  <Check size={14} />
                  <span>{title}</span>
                  <small>{i === 0 ? "High" : "Medium"}</small>
                </div>
              ))}
              <div className="lp-prompt-bottom">
                <span>Nothing is created at the proposal step.</span>
                <span className="lp-review-label">3 suggestions</span>
              </div>
            </div>
          </div>
          <div className="lp-ai-footnote">
            <p>
              Local preview · Provider setup required · No included AI credits
            </p>
            <a
              className="lp-text-link"
              href={sourceGuide}
              target="_blank"
              rel="noreferrer"
            >
              AI & MCP setup <ArrowUpRight size={13} />
            </a>
          </div>
        </section>

        <section
          className="lp-container lp-section lp-pricing"
          id="pricing"
          aria-labelledby="pricing-heading"
        >
          <div className="lp-section-intro">
            <div>
              <span className="lp-eyebrow">Simple by choice</span>
              <h2 id="pricing-heading">
                Start free.
                <br />
                Build from here.
              </h2>
            </div>
            <p>
              The local workspace is available today. Official commercial
              desktop releases and hosted teams are the next chapters.
            </p>
          </div>
          <div className="lp-price-table">
            <article>
              <div>
                <h3>Local workspace</h3>
                <p>For your projects, at your pace.</p>
              </div>
              <div className="lp-plan-details">
                <span>Tickets, projects, cycles, and notes</span>
                <span>Local storage, import, and export</span>
                <span>Open source under Apache-2.0</span>
              </div>
              <div className="lp-price">
                <strong>Free</strong>
                <span>Available now</span>
                <button onClick={onOpen} className="lp-text-link">
                  Start your workspace <ArrowRight size={14} />
                </button>
              </div>
            </article>
            <article>
              <div>
                <h3>Desktop</h3>
                <p>A proposed official distribution.</p>
              </div>
              <div className="lp-plan-details">
                <span>Planned signed desktop releases</span>
                <span>Proposed updates and support</span>
                <span>Free source builds remain available</span>
              </div>
              <div className="lp-price">
                <strong>
                  $49 <small>one-time</small>
                </strong>
                <span>Proposed · No purchase available</span>
                <a href="#downloads" className="lp-text-link">
                  Preview availability <ArrowRight size={14} />
                </a>
              </div>
            </article>
            <article>
              <div>
                <h3>Teams</h3>
                <p>A shared place to move work forward.</p>
              </div>
              <div className="lp-plan-details">
                <span>Planned shared workspaces and sync</span>
                <span>Roles and team administration</span>
                <span>Managed hosting and backups</span>
              </div>
              <div className="lp-price">
                <strong className="lp-price-roadmap">On the roadmap</strong>
                <span>Pricing to be announced</span>
                <a
                  href={`${repository}/issues`}
                  className="lp-text-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  Follow development <ArrowUpRight size={14} />
                </a>
              </div>
            </article>
          </div>
        </section>

        <section
          className="lp-container lp-section lp-download"
          id="downloads"
          aria-labelledby="downloads-heading"
        >
          <div>
            <span className="lp-eyebrow">
              <Download size={15} /> Desktop preview
            </span>
            <h2 id="downloads-heading">A place on your desktop.</h2>
            <p>
              Try the macOS Apple Silicon alpha, or build Zettel from source for
              your own setup.
            </p>
          </div>
          <div className="lp-download-actions">
            <a
              className="lp-button lp-button-light"
              href={`${repository}/releases/download/${releaseTag}/Zettel-0.1.0-alpha.2-arm64-mac.zip`}
            >
              <Download size={16} /> Download for Mac <span>Apple Silicon</span>
            </a>
            <a
              className="lp-text-link"
              href={releaseUrl}
              target="_blank"
              rel="noreferrer"
            >
              Release notes & checksums <ArrowUpRight size={13} />
            </a>
            <p>
              v0.1.0-alpha.2 · Developer preview
              <br />
              Not Developer ID signed or notarized.
            </p>
            <a
              className="lp-text-link"
              href={sourceGuide}
              target="_blank"
              rel="noreferrer"
            >
              Build from source <ArrowUpRight size={13} />
            </a>
          </div>
        </section>

        <section className="lp-container lp-faq" aria-labelledby="faq-heading">
          <h2 id="faq-heading">A few useful details.</h2>
          <div>
            <details>
              <summary>
                Where does my work live?
                <Plus size={16} />
              </summary>
              <p>
                The web workspace stores data in this browser on this device.
                Desktop and localhost builds use their own local storage. Export
                a backup before clearing site data. There is no automatic
                cross-device sync.
              </p>
            </details>
            <details>
              <summary>
                Can I use this with a team today?
                <Plus size={16} />
              </summary>
              <p>
                The current workspace is for individual use. You can record
                assignees and organize team work, but shared accounts, real-time
                collaboration, permissions, and managed sync are still on the
                roadmap.
              </p>
            </details>
            <details>
              <summary>
                Is AI required?
                <Plus size={16} />
              </summary>
              <p>
                No. The core workspace works without AI. Optional planning
                requires your own provider in a local setup. The browser-only
                workspace does not send planner requests. MCP clients can read
                and make real changes to your local data through the configured
                tools.
              </p>
            </details>
            <details>
              <summary>
                How does paid desktop fit with open source?
                <Plus size={16} />
              </summary>
              <p>
                The source stays Apache-2.0. A future commercial offer would
                cover official signed distribution, updates, and support. The
                proposed price is not a live checkout or a restriction on your
                source-code rights. Final terms will be published before sales
                begin.
              </p>
            </details>
          </div>
        </section>
        <section className="lp-container lp-final">
          <h2>
            Your next project
            <br />
            starts here.
          </h2>
          <div>
            <button className="lp-button lp-button-light" onClick={onOpen}>
              Start your workspace <ArrowRight size={15} />
            </button>
            <p>No account. No setup. Just start.</p>
          </div>
        </section>
      </main>
      <footer className="lp-container lp-footer">
        <a href="#" aria-label="Zettel home">
          <Brand />
        </a>
        <span>Built for the work ahead.</span>
        <nav aria-label="Footer navigation">
          <a href={repository} target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href={`${repository}/issues`} target="_blank" rel="noreferrer">
            Roadmap
          </a>
          <a href={sourceGuide} target="_blank" rel="noreferrer">
            Documentation <ArrowUpRight size={12} />
          </a>
        </nav>
      </footer>
    </div>
  );
}

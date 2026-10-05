import { ArrowDown, ArrowRight, ArrowUpRight, BarChart3, Check, CheckCheck, ChevronDown, Circle, CircleCheck, CircleDashed, CircleDot, Code2, Command, Download, FileText, Flag, FolderKanban, HardDrive, Inbox, Laptop, Layers, ListTodo, LockKeyhole, MessageSquare, MoreHorizontal, Plus, Search, Settings2, Sparkles, Terminal, UserRound, UsersRound } from 'lucide-react';
import './landing.css';

const repository = 'https://github.com/microyee-ai/zettel';

function Brand({ light = false }: { light?: boolean }) {
  return <span className={`landing-brand${light ? ' landing-brand-light' : ''}`}><img src="/brand/zettel-mark.svg" width="34" height="34" alt="" /><span>zettel</span></span>;
}

const sampleColumns = [
  { name: 'To do', className: 'todo', tickets: [
    { id: 'ZET-12', title: 'Give new ideas a place to land', label: 'Product', color: 'violet', initials: 'AL', priority: 2 },
    { id: 'ZET-14', title: 'Write a launch story worth reading', label: 'Launch', color: 'peach', initials: 'JS', priority: 1 },
  ] },
  { name: 'In progress', className: 'progress', tickets: [
    { id: 'ZET-08', title: 'Make the first five minutes feel great', label: 'Experience', color: 'violet', initials: 'AL', priority: 3 },
    { id: 'ZET-11', title: 'Connect the little details', label: 'Engineering', color: 'blue', initials: 'MK', priority: 2 },
  ] },
  { name: 'Done', className: 'done', tickets: [
    { id: 'ZET-03', title: 'Find our visual direction', label: 'Design', color: 'sage', initials: 'JS', priority: 1 },
    { id: 'ZET-06', title: 'Set up the project workspace', label: 'Engineering', color: 'blue', initials: 'MK', priority: 1 },
  ] },
];

function Priority({ level }: { level: number }) {
  return <span className="landing-priority" aria-hidden="true">{[1, 2, 3].map(value => <i className={value <= level ? 'active' : ''} key={value} />)}</span>;
}

function WorkbenchPreview() {
  return <div className="landing-workbench-wrap">
    <div className="landing-workbench" role="img" aria-label="Sample Zettel workspace showing six product launch tickets in To do, In progress, and Done columns.">
      <div className="landing-window-chrome" aria-hidden="true"><div className="landing-window-dots"><i /><i /><i /></div><span><LockKeyhole size={10} /> Your workspace, your space</span><span className="landing-window-shortcut"><Command size={10} /> K</span></div>
      <div className="landing-preview-body" aria-hidden="true">
        <aside className="landing-preview-sidebar">
          <div className="landing-preview-workspace"><span className="landing-studio-icon">f.</span><span>Forma studio</span><ChevronDown size={11} /></div>
          <div className="landing-preview-search"><Search size={12} /><span>Search anything</span><span>⌘ K</span></div>
          <div className="landing-preview-nav"><span><Inbox size={13} /> Inbox <small>3</small></span><span><UserRound size={13} /> My work</span></div>
          <p className="landing-preview-nav-label">Workspace</p>
          <div className="landing-preview-nav"><span><FolderKanban size={13} /> Projects</span><span><Layers size={13} /> Cycles</span><span><FileText size={13} /> Notes</span></div>
          <p className="landing-preview-nav-label">Your projects <Plus size={10} /></p>
          <div className="landing-preview-nav"><span className="selected"><span className="landing-project-dot" /> Product launch</span><span><span className="landing-project-dot sage" /> Website refresh</span></div>
          <div className="landing-preview-sidebar-footer"><span className="landing-local-dot" /> Saved on this device <Settings2 size={11} /></div>
        </aside>
        <div className="landing-preview-main">
          <div className="landing-preview-breadcrumb"><span>Projects <span>/</span> Product launch</span><MoreHorizontal size={15} /></div>
          <div className="landing-preview-title"><div><span className="landing-preview-project-icon"><Flag size={17} /></span><h3>Product launch</h3><span className="landing-preview-active">In progress</span></div><p>Good ideas. A little focus. Something worth shipping.</p></div>
          <div className="landing-preview-toolbar"><div><span className="selected"><ListTodo size={12} /> Board</span><span><BarChart3 size={12} /> Overview</span></div><span className="landing-preview-add"><Plus size={12} /> New ticket</span></div>
          <div className="landing-preview-board">
            {sampleColumns.map(column => <div className={`landing-preview-column ${column.className}`} key={column.name}>
              <div className="landing-preview-column-title"><span>{column.className === 'done' ? <CircleCheck size={12} /> : column.className === 'progress' ? <CircleDot size={12} /> : <Circle size={12} />}{column.name}<small>2</small></span><Plus size={11} /></div>
              {column.tickets.map(ticket => <div className="landing-preview-ticket" key={ticket.id}><div className="landing-preview-ticket-meta"><span>{ticket.id}</span><MoreHorizontal size={12} /></div><p>{ticket.title}</p><span className={`landing-preview-label ${ticket.color}`}>{ticket.label}</span><div className="landing-preview-ticket-footer"><Priority level={ticket.priority} /><span className={`landing-preview-avatar avatar-${ticket.initials.toLowerCase()}`}>{ticket.initials}</span></div></div>)}
              <div className="landing-preview-add-ticket"><Plus size={11} /> Add ticket</div>
            </div>)}
          </div>
        </div>
      </div>
    </div>
    <div className="landing-preview-note"><span className="landing-note-check"><Check size={16} /></span><div>One less thing in your head.<span>One step closer to shipped.</span></div></div>
    <p className="landing-preview-caption">A sample workspace. Make yours your own.</p>
  </div>;
}

function TicketIllustration() {
  return <div className="landing-ticket-illustration" aria-hidden="true">
    <div className="landing-detail-top"><span><span className="landing-project-dot" /> Product launch <span>/</span> ZET-08</span><MoreHorizontal size={17} /></div>
    <h4>Make the first five minutes feel great</h4>
    <div className="landing-detail-properties"><span><CircleDot size={13} /> In progress</span><span><Priority level={3} /> High priority</span><span className="landing-preview-label violet">Experience</span></div>
    <p>A friendly first impression, a clear next step, and a workspace that feels like yours.</p>
    <div className="landing-detail-checklist"><span><Check size={13} /> Map the first-run experience</span><span><Check size={13} /> Write the welcome copy</span><span><span className="landing-empty-check" /> Add the finishing touches</span></div>
    <div className="landing-detail-footer"><span className="landing-preview-avatar avatar-al">AL</span><span>A little progress, every day.</span><MessageSquare size={14} /><span>2</span></div>
  </div>;
}

function ProjectIllustration() {
  return <div className="landing-project-illustration" aria-hidden="true">
    <div className="landing-project-illustration-heading"><span className="landing-preview-project-icon"><Flag size={20} /></span><MoreHorizontal size={18} /></div>
    <h4>Product launch</h4><p>From first idea to the first hello.</p>
    <div className="landing-project-illustration-progress"><span>Project progress</span><strong>2 of 6 done</strong></div>
    <div className="landing-project-progress-track"><span /></div>
    <div className="landing-project-mini-list"><span><CircleCheck size={15} /> Find our visual direction <Check size={13} /></span><span><CircleDot size={15} /> First-run experience <span className="landing-preview-avatar avatar-al">AL</span></span><span><CircleDashed size={15} /> Share it with the world <span className="landing-preview-avatar avatar-js">JS</span></span></div>
  </div>;
}

export default function Landing({ onOpen }: { onOpen: () => void }) {
  return <div className="landing">
    <a className="landing-skip-link" href="#main-content">Skip to content</a>
    <header className="landing-header landing-container">
      <a className="landing-home-link" href="#" aria-label="Zettel home"><Brand /></a>
      <nav className="landing-navigation" aria-label="Main navigation"><a href="#product">Product</a><a href="#local-first">Why local?</a><a href="#pricing">Pricing</a></nav>
      <div className="landing-header-actions"><a className="landing-github-link" href={repository} aria-label="Zettel source on GitHub" target="_blank" rel="noreferrer"><Code2 size={19} /></a><button className="landing-button landing-button-small landing-button-header" onClick={onOpen}>Open workspace <ArrowUpRight size={14} /></button></div>
    </header>

    <main id="main-content">
      <section className="landing-hero landing-container" aria-labelledby="hero-heading">
        <div className="landing-hero-copy">
          <div className="landing-release-label"><span className="landing-local-dot" /> A local-first home for your work</div>
          <h1 id="hero-heading">Less managing.<br />More making.</h1>
          <p className="landing-hero-description">A little structure for your next big thing. Bring your tickets, projects, and ideas together in a workspace that stays yours.</p>
          <div className="landing-hero-actions"><button className="landing-button landing-button-primary" onClick={onOpen}>Start your workspace <ArrowRight size={17} /></button><a className="landing-button landing-button-secondary" href="#downloads"><Download size={17} /> Get desktop</a></div>
          <p className="landing-hero-fineprint">Free to start. No account. Just you and your next idea.</p>
          <div className="landing-hero-ownership"><span><HardDrive size={15} /> Stored on your device</span><span><Code2 size={15} /> Open source</span></div>
        </div>
        <WorkbenchPreview />
      </section>

      <div className="landing-audience landing-container"><p>Small teams.<br /><strong>Big things ahead.</strong></p><div><span><Laptop size={21} /> Independent makers</span><span><UsersRound size={21} /> Growing teams</span><span><Sparkles size={21} /> Your next side project</span></div></div>

      <section className="landing-product landing-container landing-section" id="product" aria-labelledby="product-heading">
        <div className="landing-section-heading"><h2 id="product-heading">A clear head starts with<br />a clear workspace.</h2><p>Enough structure to keep things moving.<br />Enough room to work your own way.</p></div>
        <div className="landing-product-grid">
          <article className="landing-feature landing-feature-tickets"><div className="landing-feature-art"><TicketIllustration /></div><div className="landing-feature-copy"><span className="landing-feature-symbol"><ListTodo size={19} /></span><h3>Tickets, without the ceremony.</h3><p>Get the idea out of your head. Add the details, set a priority, and take it one step at a time.</p><div className="landing-feature-capabilities"><span>Statuses</span><span>Priorities</span><span>Labels</span><span>Dependencies</span></div></div></article>
          <article className="landing-feature landing-feature-projects"><div className="landing-feature-art"><ProjectIllustration /></div><div className="landing-feature-copy"><span className="landing-feature-symbol"><FolderKanban size={19} /></span><h3>See the bigger picture.</h3><p>Give every ticket a purpose. Group work into projects and follow the path from an idea to done.</p><div className="landing-feature-capabilities"><span>Projects</span><span>Cycles</span><span>Notes</span></div></div></article>
        </div>
        <div className="landing-workflow-line"><span><Search size={17} /> Find your focus</span><span><Layers size={17} /> Plan in cycles</span><span><FileText size={17} /> Keep context close</span><span><CheckCheck size={17} /> Enjoy the small wins</span></div>
      </section>

      <section className="landing-local-section" id="local-first" aria-labelledby="local-heading"><div className="landing-container landing-local-grid">
        <div className="landing-local-art" aria-hidden="true"><div className="landing-orbit landing-orbit-one" /><div className="landing-orbit landing-orbit-two" /><div className="landing-owned-ticket"><img src="/brand/zettel-mark.svg" width="75" height="75" alt="" /><span>Your ideas.<br />Your work.<br />Your space.</span><div><HardDrive size={14} /> Right here on your device.</div></div><span className="landing-local-art-badge"><LockKeyhole size={15} /> Yours to keep</span></div>
        <div className="landing-local-copy"><span className="landing-inline-label"><HardDrive size={16} /> Local first. You first.</span><h2 id="local-heading">Your work shouldn't<br />need a landlord.</h2><p>Start a workspace in your browser. Your tickets and projects are saved on this device, ready for you to pick up where you left off.</p><ul className="landing-check-list"><li><Check size={17} /><span><strong>Start without signing up.</strong> No account between you and your work.</span></li><li><Check size={17} /><span><strong>Take your work with you.</strong> Export a backup and move it between workspaces.</span></li><li><Check size={17} /><span><strong>Keep the choice.</strong> Open source, with a local service and desktop build for your own setup.</span></li></ul><p className="landing-storage-note">Browser work stays in this browser. Export backups regularly; clearing site data removes it. Devices do not sync automatically.</p></div>
      </div></section>

      <section className="landing-ai landing-container landing-section" aria-labelledby="ai-heading"><div className="landing-ai-copy"><span className="landing-inline-label"><Sparkles size={16} /> Optional AI, on your terms</span><h2 id="ai-heading">A little help.<br />With you in control.</h2><p>Turn an idea into a draft plan with your own AI provider in a local setup. Review the suggestions before creating tickets. Connect an MCP client to read and update your local work.</p><div className="landing-ai-availability"><span className="landing-planned-badge">Local preview</span><span>Provider setup required. No included AI credits.</span></div><a className="landing-text-link" href={`${repository}/blob/main/docs/local-runtime.md`} target="_blank" rel="noreferrer">Read the local setup guide <ArrowUpRight size={15} /></a></div><div className="landing-ai-preview" aria-label="Illustration of the optional local AI ticket review flow, not a live model response"><div className="landing-ai-preview-header"><Sparkles size={17} /><span>A starting point, not the final say.</span><span>Illustration</span></div><div className="landing-ai-prompt"><span className="landing-preview-avatar avatar-al">You</span><p>Help me turn this launch idea into a few clear next steps.</p></div><div className="landing-ai-reply"><span className="landing-ai-z"><img src="/brand/zettel-mark.svg" alt="" width="20" height="20" /></span><div><p>A plan you can make your own.</p><span>Review each suggestion before adding it.</span></div></div><div className="landing-ai-proposals"><div><span className="landing-proposal-check"><Check size={11} /></span><span>Define the first version</span><span>Product</span></div><div><span className="landing-proposal-check"><Check size={11} /></span><span>Build a welcoming first run</span><span>Design</span></div><div><span className="landing-proposal-check"><Check size={11} /></span><span>Plan the launch checklist</span><span>Launch</span></div></div><div className="landing-ai-preview-footer"><span><LockKeyhole size={12} /> Nothing happens without your review</span><span>Review 3 suggestions <ArrowRight size={12} /></span></div></div></section>

      <section className="landing-pricing landing-section" id="pricing" aria-labelledby="pricing-heading"><div className="landing-container"><div className="landing-pricing-heading"><h2 id="pricing-heading">Start small. Keep your options open.</h2><p>A free local workspace today. A considered path for what comes next.</p></div><div className="landing-pricing-grid">
        <article className="landing-price-card"><span className="landing-price-icon"><UserRound size={20} /></span><h3>For your next idea</h3><p className="landing-price-description">A place to focus and get moving.</p><div className="landing-price"><strong>Free</strong><span>Local workspace</span></div><ul className="landing-check-list"><li><Check size={16} /> Tickets, projects, cycles, and notes</li><li><Check size={16} /> Work saved in your browser</li><li><Check size={16} /> Import and export your data</li><li><Check size={16} /> Apache-2.0 source code</li></ul><button className="landing-button landing-button-secondary" onClick={onOpen}>Start your workspace <ArrowRight size={16} /></button><p className="landing-price-note">No account or payment details.</p></article>
        <article className="landing-price-card landing-price-desktop"><span className="landing-price-ribbon">Proposed desktop offer</span><span className="landing-price-icon"><Laptop size={20} /></span><h3>A home on your desktop</h3><p className="landing-price-description">Support the product you use.</p><div className="landing-price"><strong>$49</strong><span>One-time · proposed</span></div><ul className="landing-check-list"><li><Check size={16} /> Planned signed desktop releases</li><li><Check size={16} /> Proposed updates and support</li><li><Check size={16} /> Local storage and portable backups</li><li><Check size={16} /> Free source builds remain available</li></ul><a className="landing-button landing-button-primary" href="#downloads">See desktop availability <ArrowDown size={16} /></a><p className="landing-price-note">Pricing concept. No purchase available.</p></article>
        <article className="landing-price-card"><span className="landing-price-icon"><UsersRound size={20} /></span><h3>Room to grow together</h3><p className="landing-price-description">For a shared way of working.</p><div className="landing-price"><strong className="landing-price-planned">On the roadmap</strong><span>Hosted teams</span></div><ul className="landing-check-list landing-check-list-planned"><li><CircleDashed size={16} /> Shared workspaces and collaboration</li><li><CircleDashed size={16} /> Managed sync and backups</li><li><CircleDashed size={16} /> Roles and team administration</li><li><CircleDashed size={16} /> Optional hosted AI services</li></ul><a className="landing-button landing-button-secondary" href={`${repository}/issues`} target="_blank" rel="noreferrer">Explore the roadmap <ArrowUpRight size={16} /></a><p className="landing-price-note">Planned. Pricing not set.</p></article>
      </div><p className="landing-pricing-footnote">Your source-code rights stay yours. Paid offerings would cover official distribution and services, not restrict the Apache-2.0 license.</p></div></section>

      <section className="landing-downloads landing-container landing-section" id="downloads" aria-labelledby="downloads-heading"><div><span className="landing-inline-label"><Download size={16} /> Find your space</span><h2 id="downloads-heading">Open a tab.<br />Or make yourself at home.</h2><p>Get started in your browser, or build Zettel locally from source. The same idea: a calmer place for your work.</p></div><div className="landing-download-options"><div className="landing-download-option"><span className="landing-download-symbol"><Laptop size={23} /></span><div><h3>Web workspace</h3><p>Open in your browser. Saved on this device.</p></div><button onClick={onOpen} className="landing-button landing-button-small landing-button-primary">Open <ArrowUpRight size={14} /></button></div><div className="landing-download-option"><span className="landing-download-symbol"><Terminal size={23} /></span><div><h3>Desktop & localhost <span>Source build</span></h3><p>Build instructions and source on GitHub.</p></div><a href={repository} target="_blank" rel="noreferrer" className="landing-button landing-button-small landing-button-secondary" aria-label="View Zettel source and build instructions on GitHub">Source <ArrowUpRight size={14} /></a></div><p className="landing-download-note">Ready-to-install, signed desktop releases are not yet available. Source builds require developer tools. Check the repository for supported platforms and setup steps.</p></div></section>

      <section className="landing-faq landing-container" aria-labelledby="faq-heading"><h2 id="faq-heading">A few useful details.</h2><div className="landing-faq-list"><details><summary>Where does my work live?<Plus size={18} /></summary><p>The web workspace saves data in this browser on this device. It does not upload your tickets to a shared Zettel account or sync them to other devices. Use export to keep a backup, especially before clearing your browser data. Desktop and localhost builds use their own local storage.</p></details><details><summary>Can I use Zettel with my team today?<Plus size={18} /></summary><p>The current local workspace is designed for individual use. You can plan team work and record assignees, but shared accounts, real-time collaboration, permissions, and automatic sync are future work. Follow the public roadmap for progress.</p></details><details><summary>Do I need AI to use Zettel?<Plus size={18} /></summary><p>No. Tickets, projects, cycles, and notes work independently of an AI provider. Optional AI planning and MCP tools are available in local setups. AI planning requires your own configured provider; the browser-only workspace does not send planner requests. The illustration above shows the review flow, not a live model response. MCP tools make real changes when your configured client invokes a write tool.</p></details><details><summary>How does the desktop license fit with open source?<Plus size={18} /></summary><p>Zettel's source remains Apache-2.0. The proposed desktop price would support an official signed distribution, updates, and support. It is a pricing hypothesis, not an active purchase or a restriction on your open-source rights. Final terms and availability will be published before sales begin.</p></details></div></section>

      <section className="landing-final-cta landing-container"><div><h2>Make space for your next good thing.</h2><p>Start with one ticket. See where it takes you.</p></div><button className="landing-button landing-button-primary" onClick={onOpen}>Start your workspace <ArrowRight size={17} /></button></section>
    </main>

    <footer className="landing-footer landing-container"><div><a className="landing-home-link" href="#" aria-label="Zettel home"><Brand /></a><p>A little structure. A lot of possibility.</p></div><nav aria-label="Footer navigation"><a href="#product">Product</a><a href="#downloads">Desktop</a><a href={`${repository}/issues`} target="_blank" rel="noreferrer">Roadmap</a><a href={repository} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={12} /></a></nav><span>Made for the work that matters to you.</span></footer>
  </div>;
}

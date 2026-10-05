# Local runtime, desktop and MCP

Implementation snapshot: 2026-10-05. The Node/SQLite, HTTP, AI proposal and MCP contracts have automated integration coverage. A successful build does not establish desktop installation, signing, real-provider availability, hosted collaboration or enterprise readiness; those gates are tracked separately in [the delivery plan](delivery-plan.md).

## Run locally

Use Node 24 LTS (the repository `.nvmrc`) and install the pinned dependencies:

```sh
npm ci
npm run build
npm start
```

Open `http://127.0.0.1:4589/app`. The service serves the built app and API from one origin. It binds only `127.0.0.1`. A different machine cannot connect. `ZETTEL_PORT` changes the port; `0` requests an available port. `ZETTEL_STATIC_DIR` can point at an alternate built `dist` directory. The terminal prints the origin and storage path, never its bearer token.

Default files:

| File | Purpose |
| --- | --- |
| `~/.zettel/workspace.sqlite` | Local and desktop workspace database |
| `~/.zettel/workspace.sqlite-wal` / `-shm` | SQLite live journal/coordination files; do not delete while running |
| `~/.zettel/connection.json` | Standalone service connection, including a private token |
| `~/.zettel/desktop-connection.json` | Desktop service connection, including a private token |

Set `ZETTEL_DATA_DIR` before launch to use another directory. Each user should have a private directory. Database and connection files are created with owner-only permissions on supporting operating systems. Do not publish connection files or put them in a shared folder. Existing broader directory permissions are not automatically changed. There is no application encryption-at-rest claim.

The browser-only Vercel app uses a separate IndexedDB workspace. Desktop/localhost use SQLite. Transfer JSON using the app's export/import controls; there is no automatic cross-device or browser-to-desktop synchronization. Save conflicts require a reload before applying the intended edit again. A browser origin or port change creates a different browser storage context.

## Desktop development and packaging

```sh
npm run desktop
```

The build produces `dist-desktop/main.cjs` and `dist-desktop/preload.cjs`, plus standalone `dist-server/index.mjs` and `dist-server/mcp.mjs`. Electron serves packaged assets on a private available loopback port and opens `/app`. Its renderer is sandboxed and isolated; the preload exposes only `load`, `save`, `propose` and `info`. Desktop loads SQLite through its own bundled Node runtime. A user's system Node is unnecessary for the packaged GUI.

`npm run desktop:package` builds the configured macOS Apple Silicon ZIP. Do not infer Windows/Linux availability from their configuration entries. The verified preview is ad-hoc signed for file integrity, has no Developer ID identity, and is not notarized; Gatekeeper rejects it. Trusted distribution and automatic updates remain separate work. The release manifest records source revision, SHA-256 hashes, architecture and observed test results.

## Connect an MCP client

The packaged macOS app includes its MCP bridge and Node runtime. With Zettel installed at `/Applications/Zettel.app` and running, a client that accepts stdio MCP servers can use this configuration. Replace the connection-file path with your actual absolute home directory; JSON configuration does not expand `~`:

```json
{
  "mcpServers": {
    "zettel": {
      "command": "/Applications/Zettel.app/Contents/MacOS/Zettel",
      "args": ["/Applications/Zettel.app/Contents/Resources/mcp.mjs"],
      "env": {
        "ELECTRON_RUN_AS_NODE": "1",
        "ZETTEL_CONNECTION_FILE": "/Users/your-user/.zettel/desktop-connection.json"
      }
    }
  }
}
```

This packaged route was verified with the actual app binary and resource. It needs no separate Node installation or source checkout. For a source-based localhost service instead, start that service, build the bridge with `npm run desktop:build`, and use your Node 24 executable:

```json
{
  "mcpServers": {
    "zettel": {
      "command": "/absolute/path/to/node",
      "args": ["/absolute/path/to/zettel/dist-server/mcp.mjs"],
      "env": {
        "ZETTEL_CONNECTION_FILE": "/absolute/path/to/.zettel/connection.json"
      }
    }
  }
}
```

The bridge rereads the connection file for each operation, so a normal service restart rotates credentials without changing client arguments. The source-based route requires Node; the packaged route above reuses Electron's bundled runtime. Never put the bearer token in a command line or copied client snippet.

Available tools:

| Tool | Behavior |
| --- | --- |
| `zettel_list_issues` | Search/filter/page tickets; return current workspace revision |
| `zettel_get_issue` | Read by stable ID or identifier, including comments and relationships |
| `zettel_list_projects` | Page projects and return current revision |
| `zettel_create_issue` | Create a persisted ticket and record an MCP actor |
| `zettel_update_issue` | Update allowed fields after checking `expectedUpdatedAt` |
| `zettel_create_project` | Create a persisted project |
| `zettel_update_project` | Update fields after checking `expectedRevision` |

Examples of client requests: “List my high-priority release tickets”; “Create a ticket to verify backup restoration, with acceptance criteria”; “Read ZET-12, then move it to in review.” The current list tool supports text, status and project filtering; priority filtering requires the client to inspect returned records. Do not imply unsupported filters exist.

MCP write tools perform real changes. Their descriptions instruct clients to write only at user request; whether the client prompts for individual tool approval depends on that client's configuration. Set `ZETTEL_MCP_READ_ONLY=1` in the bridge environment to remove all write tools. Project-scoped credentials, remote OAuth, attachment access, arbitrary shell execution and hosted MCP are not implemented. Local ticket text cannot change this tool inventory. Conflicts return an actionable error rather than retrying a stale edit automatically.

## Optional AI planning

Normal ticket tracking needs no provider key. To enable proposals, start the service or desktop process with:

```sh
export ZETTEL_AI_BASE_URL=https://api.openai.com/v1
export ZETTEL_AI_MODEL=your-enabled-model-id
export ZETTEL_AI_API_KEY=your-provider-key
npm start
```

Use a secret-management method suitable for your workstation instead of committing keys. `BASE_URL` defaults to the OpenAI API endpoint; a model must be chosen explicitly. A compatible endpoint must support `POST /chat/completions`, JSON mode and `choices[].message.content`. Alternative endpoints require HTTPS, except explicitly configured loopback HTTP development providers. Redirects are rejected. The current adapter targets that compatibility contract, not every provider API. [OpenAI Chat API](https://developers.openai.com/api/reference/resources/chat)

The service sends the planning prompt submitted by the user; it does not automatically send the full workspace. The response must validate as at most 20 ticket proposals with bounded title, description and priority. The UI should display proposals for review before saving selected tickets. No provider key reaches the renderer, exported workspace or Vercel bundle. A 45-second deadline and bounded provider response protect local work from stalled/oversized replies. Provider errors never insert fallback or fabricated tickets. Automated tests use a stub provider; a real provider call needs separate evidence.

The web-only app cannot use local provider configuration. Open the localhost or desktop mode to enable BYOK AI. This is not a hosted AI subscription, included credits or an autonomous execution agent.

## Backup and recovery

Export a JSON backup regularly, especially before changing runtime or upgrading. Verify a restore into a disposable empty workspace before relying on that backup. Exports contain workspace records, not API keys or service tokens. Imports reject unsupported versions, invalid dates, duplicate IDs, missing references and cyclic relationships before replacing stored data.

Each successful SQLite save also stores the prior snapshot in the `recovery` table, retaining the last ten revisions. This is local short-term recovery, not an independent backup or tamper-proof audit. There is no recovery picker yet. An experienced operator can stop the service and inspect the SQLite file with a database tool to recover a previous JSON snapshot; keep an untouched file copy before doing so.

For a file-level backup, stop both the desktop and standalone service before copying the database and any remaining journal files together. Do not copy a live SQLite file alone and assume it is consistent. This initial schema has no prior released-version upgrade fixture; future migrations must supply one before a supported upgrade claim.

## Verification evidence

`node --experimental-sqlite --import tsx --test tests/server.test.ts` passed seven tests on the observed Node 22.12 development host: relational validation; reopen persistence and invalid-save preservation; ticket numbering after deletion and malicious import rejection; two-connection revision conflicts; HTTP token/Host/Origin controls; structured AI proposals with a stub provider; and an actual SDK stdio MCP handshake/create/update against the same SQLite store. Node 22.12 is only a test compatibility observation; the supported standalone minimum remains 22.13 and Node 24 is recommended.

`node scripts/build-desktop.mjs` generated all four runtime entries successfully. The bundled `dist-server/mcp.mjs` completed a real SDK handshake and created a persisted ticket while launched from an isolated temporary working directory, with no repository dependency resolution. The installed Electron 44.5.1 binary reported embedded Node 24.21.0 and successfully created, inserted and selected a `node:sqlite` row.

`node --import tsx tests/server-desktop-smoke.ts` then launched the development desktop with a disposable `ZETTEL_DATA_DIR`: a UI-created ticket survived quit/relaunch; runtime preferences reported sandbox/context isolation/web security enabled and Node integration disabled; renderer `require`/`process` were absent; only the four intended preload methods were exposed; external navigation and popup attempts were blocked. The Electron executable itself also launched the bundled stdio bridge, and its created ticket appeared after a GUI reload.

The final `Zettel-0.1.0-alpha.1-arm64-mac.zip`, built from runtime/build source at `f34b3c547e743b52323e436b8ab5ccef662c6141`, passed that same smoke test against its packaged executable, including the bundled MCP resource. Native Electron export, workspace reset, JSON import and exact restored ticket equality also passed. The test sets a temporary save path through Electron's real download event; it does not claim manual native save-dialog coverage. ZIP integrity and `codesign --verify --deep --strict` passed. `spctl` rejected the ad-hoc signed, unnotarized app as expected. The ZIP SHA-256 is `0c3361f6f27bcb9e8699cd5b6cce88d9ac83d7d303ce1337dbd07b4852addf4d`. The generated release manifest/checksum files are separate release assets. Trusted publisher distribution, other platforms, real AI provider use, hosted teams and payments still require their own evidence. See [ADR 0001](decisions/0001-local-first-runtime.md) for design constraints.

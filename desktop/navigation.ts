// Only the documentation links shipped in the workspace may leave the desktop
// window. Never hand arbitrary renderer URLs or custom schemes to the OS.
const documentation = new Set([
  'https://github.com/microyee-ai/zettel/blob/v0.1.0-alpha.2/docs/local-runtime.md',
]);

export function trustedDocumentationUrl(input: string): string | undefined {
  try {
    const url = new URL(input);
    if (url.username || url.password || url.search) return;
    const anchor = url.hash;
    url.hash = '';
    return documentation.has(url.href) ? url.href + anchor : undefined;
  } catch { return; }
}

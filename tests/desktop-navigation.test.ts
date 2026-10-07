import test from 'node:test';
import assert from 'node:assert/strict';
import { trustedDocumentationUrl } from '../desktop/navigation.js';

const guide = 'https://github.com/microyee-ai/zettel/blob/v0.1.0-alpha.2/docs/local-runtime.md';
test('desktop setup guide opens only the shipped HTTPS documentation URL', () => {
  assert.equal(trustedDocumentationUrl(guide), guide);
  assert.equal(trustedDocumentationUrl(`${guide}#mcp`), `${guide}#mcp`);
  for (const input of [
    'file:///etc/passwd', 'javascript:alert(1)', 'zettel://execute',
    'https://example.com', `${guide}?redirect=https://example.com`,
    guide.replace('github.com', 'github.com.evil.example'),
    guide.replace('github.com', 'username:password@github.com'),
    guide.replace('https:', 'http:'), guide.replace('/docs/', '/docs/../'),
    'https://github.com/microyee-ai/zettel/issues',
  ]) assert.equal(trustedDocumentationUrl(input), undefined, input);
});

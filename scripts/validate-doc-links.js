#!/usr/bin/env node

const fs = require('fs');

function getArgValue(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1 || idx === process.argv.length - 1) {
    return null;
  }
  return process.argv[idx + 1];
}

function readPrBodyFromEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath || !fs.existsSync(eventPath)) {
    return '';
  }

  try {
    const raw = fs.readFileSync(eventPath, 'utf8');
    const payload = JSON.parse(raw);
    return payload?.pull_request?.body || '';
  } catch {
    return '';
  }
}

const strict = process.argv.includes('--strict');
const fromEvent = process.argv.includes('--from-github-event');
const textArg = getArgValue('--text');
const body =
  textArg ?? process.env.PR_BODY ?? (fromEvent ? readPrBodyFromEvent() : '');

const hasDocPath = /docs\/specs\/[A-Za-z0-9_./-]+\.ya?ml\b/.test(body);
const hasNoDocsRationale = /No docs impact:\s*\S+/i.test(body);

if (hasDocPath || hasNoDocsRationale) {
  console.log('Documentation linkage check passed.');
  process.exit(0);
}

const message =
  'Missing docs linkage. Add at least one docs/specs/*.yaml path or include "No docs impact: <reason>" in PR body.';

if (strict) {
  console.error(message);
  process.exit(1);
}

console.warn(`${message} (advisory in non-strict mode)`);
process.exit(0);

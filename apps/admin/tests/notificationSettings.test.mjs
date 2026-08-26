import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(
  new URL('../src/lib/notificationSettings.ts', import.meta.url),
  'utf8',
);
const validationSource = source
  .replace("import { getAdminSupabaseClient } from './supabase';", '')
  .replace(/export async function loadAdminNotificationSettings[\s\S]*$/, '');
const compiled = ts.transpileModule(validationSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { parseRandomRemindersPerDay } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

test('accepts the supported random reminder count boundaries', () => {
  assert.equal(parseRandomRemindersPerDay(1), 1);
  assert.equal(parseRandomRemindersPerDay(8), 8);
});

test('rejects counts that could exceed delivery safeguards', () => {
  for (const value of [0, 9, 2.5, '3', Number.NaN]) {
    assert.throws(
      () => parseRandomRemindersPerDay(value),
      /integer from 1 through 8/,
    );
  }
});

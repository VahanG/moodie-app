const assert = require('node:assert/strict');
const test = require('node:test');

const {
  buildSql,
  loadAffirmations,
  parseCsv,
  sqlLiteral,
  summary,
} = require('./import-affirmation-catalog');

test('parses quoted commas and escaped quotes', () => {
  assert.deepEqual(parseCsv('a,b\n"one, two","say ""hi"""'), [
    ['a', 'b'],
    ['one, two', 'say "hi"'],
  ]);
});

test('loads all localized CSV affirmations', () => {
  const affirmations = loadAffirmations();

  assert.equal(affirmations.length, 500);
  assert.deepEqual(summary(affirmations), {
    source: 'Texts - Moodie Messages.csv',
    topics: {
      'motivation-focus': 130,
      'self-care': 130,
      'self-acceptance': 120,
      'mental-health': 120,
    },
    affirmations: 500,
    translations: 1000,
    affirmationImages: 0,
  });
});

test('builds an idempotent text-only catalog import', () => {
  const sql = buildSql(loadAffirmations());

  assert.match(sql, /on conflict \(id\) do update set/);
  assert.match(sql, /image_uri = null/);
  assert.match(sql, /on conflict \(affirmation_id, language_code\) do update set/);
  assert.match(sql, /imported_affirmations <> 500/);
  assert.equal((sql.match(/aaff0000-0000-4000-8000-/g) ?? []).length >= 3, true);
});

test('escapes apostrophes for PostgreSQL literals', () => {
  assert.equal(sqlLiteral("You don't stop."), "'You don''t stop.'");
});

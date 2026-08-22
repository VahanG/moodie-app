#!/usr/bin/env node

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const DEFAULT_SOURCE = path.resolve(
  __dirname,
  '..',
  'Texts - Moodie Messages.csv',
);

const EXPECTED_HEADERS = [
  'ID',
  'Theme',
  'English Message',
  'Armenian Message',
];

const TOPICS = {
  'Motivation & Focus': {
    id: 'motivation-focus',
    englishName: 'Motivation & Focus',
    armenianName: 'Մոտիվացիա և կենտրոնացում',
    imageSourceTopicId: 'focus',
    sortOrder: 100,
  },
  'Self-Care': {
    id: 'self-care',
    englishName: 'Self-Care',
    armenianName: 'Ինքնախնամք',
    imageSourceTopicId: 'selflove',
    sortOrder: 110,
  },
  'Self-Acceptance': {
    id: 'self-acceptance',
    englishName: 'Self-Acceptance',
    armenianName: 'Ինքնընդունում',
    imageSourceTopicId: 'selflove',
    sortOrder: 120,
  },
  'Mental Health': {
    id: 'mental-health',
    englishName: 'Mental Health',
    armenianName: 'Հոգեկան առողջություն',
    imageSourceTopicId: 'calm',
    sortOrder: 130,
  },
};

function parseCsv(source) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];

    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (quoted) {
    throw new Error('CSV contains an unterminated quoted field.');
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function loadAffirmations(sourcePath = DEFAULT_SOURCE) {
  const rows = parseCsv(fs.readFileSync(sourcePath, 'utf8'));
  const headers = rows.shift();

  if (JSON.stringify(headers) !== JSON.stringify(EXPECTED_HEADERS)) {
    throw new Error(`Unexpected CSV headers: ${JSON.stringify(headers)}`);
  }

  const seenIds = new Set();
  const affirmations = rows.map((columns, index) => {
    if (columns.length !== EXPECTED_HEADERS.length) {
      throw new Error(`CSV row ${index + 2} has ${columns.length} columns.`);
    }

    const [rawId, theme, englishText, armenianText] = columns;
    const sourceId = Number(rawId);

    if (!Number.isSafeInteger(sourceId) || sourceId <= 0) {
      throw new Error(`CSV row ${index + 2} has an invalid ID: ${rawId}`);
    }
    if (seenIds.has(sourceId)) {
      throw new Error(`CSV contains duplicate ID ${sourceId}.`);
    }
    if (!TOPICS[theme]) {
      throw new Error(`CSV row ${index + 2} has an unknown theme: ${theme}`);
    }
    if (!englishText.trim() || !armenianText.trim()) {
      throw new Error(`CSV row ${index + 2} has a blank translation.`);
    }

    seenIds.add(sourceId);
    return {
      sourceId,
      topicId: TOPICS[theme].id,
      englishText,
      armenianText,
    };
  });

  if (affirmations.length !== 500) {
    throw new Error(`Expected 500 affirmations, received ${affirmations.length}.`);
  }

  for (let sourceId = 1; sourceId <= affirmations.length; sourceId += 1) {
    if (!seenIds.has(sourceId)) {
      throw new Error(`CSV is missing ID ${sourceId}.`);
    }
  }

  return affirmations;
}

function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function buildSql(affirmations) {
  const topicRows = Object.values(TOPICS)
    .map(
      topic =>
        `  (${sqlLiteral(topic.id)}, ${sqlLiteral(
          topic.imageSourceTopicId,
        )}, ${topic.sortOrder})`,
    )
    .join(',\n');
  const topicTranslationRows = Object.values(TOPICS)
    .flatMap(topic => [
      `  (${sqlLiteral(topic.id)}, 'en', ${sqlLiteral(topic.englishName)})`,
      `  (${sqlLiteral(topic.id)}, 'hy', ${sqlLiteral(topic.armenianName)})`,
    ])
    .join(',\n');
  const affirmationRows = affirmations
    .map(
      affirmation =>
        `  (${affirmation.sourceId}, ${sqlLiteral(
          affirmation.topicId,
        )}, ${sqlLiteral(affirmation.englishText)}, ${sqlLiteral(
          affirmation.armenianText,
        )})`,
    )
    .join(',\n');

  return `begin;

insert into public.supported_languages
  (code, english_name, native_name, text_direction, sort_order, is_enabled, is_default)
values
  ('hy', 'Armenian', 'Հայերեն', 'ltr', 5, true, false)
on conflict (code) do update set
  english_name = excluded.english_name,
  native_name = excluded.native_name,
  text_direction = excluded.text_direction,
  is_enabled = true;

create temporary table moodie_import_topics (
  id text primary key,
  image_source_topic_id text not null,
  sort_order integer not null
) on commit drop;

insert into moodie_import_topics (id, image_source_topic_id, sort_order)
values
${topicRows};

insert into public.affirmation_topics
  (id, image_uri, sort_order, is_published)
select
  imported.id,
  source.image_uri,
  imported.sort_order,
  true
from moodie_import_topics imported
join public.affirmation_topics source
  on source.id = imported.image_source_topic_id
on conflict (id) do update set
  sort_order = excluded.sort_order,
  is_published = true;

insert into public.affirmation_topic_translations
  (topic_id, language_code, name)
values
${topicTranslationRows}
on conflict (topic_id, language_code) do update set
  name = excluded.name;

create temporary table moodie_import_affirmations (
  source_id integer primary key,
  topic_id text not null,
  english_text text not null,
  armenian_text text not null
) on commit drop;

insert into moodie_import_affirmations
  (source_id, topic_id, english_text, armenian_text)
values
${affirmationRows};

insert into public.affirmations
  (id, topic_id, image_uri, sort_order, is_published)
select
  ('aaff0000-0000-4000-8000-' || lpad(source_id::text, 12, '0'))::uuid,
  topic_id,
  null,
  source_id * 10,
  true
from moodie_import_affirmations
on conflict (id) do update set
  topic_id = excluded.topic_id,
  image_uri = null,
  sort_order = excluded.sort_order,
  is_published = true;

insert into public.affirmation_translations
  (affirmation_id, language_code, text)
select
  ('aaff0000-0000-4000-8000-' || lpad(source_id::text, 12, '0'))::uuid,
  translations.language_code,
  translations.text
from moodie_import_affirmations
cross join lateral (
  values
    ('en', english_text),
    ('hy', armenian_text)
) as translations(language_code, text)
on conflict (affirmation_id, language_code) do update set
  text = excluded.text;

do $verification$
declare
  imported_affirmations integer;
  imported_translations integer;
  imported_topics integer;
begin
  select count(*) into imported_affirmations
  from public.affirmations
  where id::text like 'aaff0000-0000-4000-8000-%'
    and image_uri is null
    and is_published;

  select count(*) into imported_translations
  from public.affirmation_translations
  where affirmation_id::text like 'aaff0000-0000-4000-8000-%'
    and language_code in ('en', 'hy');

  select count(*) into imported_topics
  from public.affirmation_topics
  where id in ('motivation-focus', 'self-care', 'self-acceptance', 'mental-health')
    and is_published;

  if imported_affirmations <> 500
    or imported_translations <> 1000
    or imported_topics <> 4 then
    raise exception
      'Affirmation catalog verification failed: topics %, affirmations %, translations %',
      imported_topics,
      imported_affirmations,
      imported_translations;
  end if;
end
$verification$;

commit;
`;
}

function summary(affirmations) {
  const topicCounts = affirmations.reduce((counts, affirmation) => {
    counts[affirmation.topicId] = (counts[affirmation.topicId] ?? 0) + 1;
    return counts;
  }, {});

  return {
    source: path.relative(process.cwd(), DEFAULT_SOURCE),
    topics: topicCounts,
    affirmations: affirmations.length,
    translations: affirmations.length * 2,
    affirmationImages: 0,
  };
}

function applyToLinkedProject(sql) {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'moodie-affirmations-'),
  );
  const sqlPath = path.join(temporaryDirectory, 'import.sql');

  try {
    fs.writeFileSync(sqlPath, sql, { encoding: 'utf8', mode: 0o600 });
    const result = spawnSync(
      'supabase',
      ['db', 'query', '--linked', '--file', sqlPath],
      { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' },
    );

    if (result.error) throw result.error;
    if (result.status !== 0) process.exitCode = result.status ?? 1;
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

function main(arguments_) {
  const affirmations = loadAffirmations();
  const sql = buildSql(affirmations);

  if (arguments_.includes('--sql')) {
    process.stdout.write(sql);
    return;
  }

  console.log(JSON.stringify(summary(affirmations), null, 2));

  if (arguments_.includes('--apply-linked')) {
    applyToLinkedProject(sql);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = {
  TOPICS,
  buildSql,
  loadAffirmations,
  parseCsv,
  sqlLiteral,
  summary,
};

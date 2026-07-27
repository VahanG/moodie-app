# Content Delivery

## Remote content lifecycle
1. Publish content payload in remote source.
2. Validate payload version and schema compatibility.
3. Download/cache in app.
4. Fallback to last-known-good content when offline.

## Affirmation content

Topics, affirmations, and selectable backgrounds are normalized Supabase
records. The admin workspace owns editorial CRUD and publication state.
Supporter clients read only published rows and cache a validated database
response. When neither the database nor a last-known-good cache is available,
the client shows a retryable unavailable state instead of bundled editorial
content.

## Multilingual delivery

Supported languages, app UI text overrides, and editorial translations follow
`docs/product/multilingual-content-spec.md`.

Language-neutral content rows keep publication, media, and ordering. Separate
translation rows hold all user-visible topic names, affirmation text, and
background tags. Supporter clients request one language at a time and omit
records with missing selected-language translations. Editorial content never
uses cross-language fallback, and last-known-good caches are scoped by
language code.

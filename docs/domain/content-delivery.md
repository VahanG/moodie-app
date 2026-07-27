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

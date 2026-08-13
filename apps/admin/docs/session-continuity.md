# Admin session continuity

The admin workspace verifies database-managed admin membership when a browser
session is first established or when the signed-in account changes.

Supabase can emit repeated authentication events for the same session when a
browser tab loses and regains focus or when its token refreshes. Once that user
has been verified, these events keep the mounted dashboard in place so the
selected admin section and any in-progress UI state are preserved.

A sign-out event still clears the verified identity. A later session, including
a new login by the same account, must pass admin verification again. Protected
data operations continue to rely on database RLS and are not authorized by the
dashboard's rendered state.

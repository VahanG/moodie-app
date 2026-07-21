---
name: perfect-docs-test-generator
description: Instructions for generating Playwright E2E tests from "Perfect Docs" YAML specifications.
---

# Perfect Docs Test Generator

Use this skill to generate high-quality Playwright E2E tests from the YAML files in `docs/specs/`.

## Input

- A YAML requirement specification from `docs/specs/*.yaml`.
- The `verification` block within each requirement.

## Output

- A Playwright test file (e.g., `tests/e2e/home_page.generated.spec.ts`).

## Rules

1. **Always** use `data-testid` selectors, but **reference them from a centralized `TEST_IDS` object** in `tests/e2e/support/test-ids.ts`.
2. **Standardize** actions and expectations based on the `verification` steps:
   - `goto`: `await page.goto(url)`
   - `click`: `await page.getByTestId(TEST_IDS.scope.selector).click()`
   - `type`: `await page.getByTestId(TEST_IDS.scope.selector).fill(value)`
   - `expect_visible`: `await expect(page.getByTestId(TEST_IDS.scope.selector)).toBeVisible()`
   - `expect_not_visible`: `await expect(page.getByTestId(TEST_IDS.scope.selector)).not.toBeVisible()`
   - `expect_url_match`: `await expect(page).toHaveURL(regex)`
   - `expect_count`: `await expect(page.getByTestId(selector)).toHaveCount(count)`
3. **Handle** custom actions:
   - `login`: Implement a helper to sign in with a test user.
   - `login_as_member`, `login_as_admin`, `login_as_captain`: Sign in with users having the specified roles for the relevant context.
4. **Mocking**: Use a Playwright fixture or a separate helper (e.g., `mockSupabase`) to ensure a predictable environment. **Ignore any existing mock helpers if they do not support the new schema.**
5. **Tags**: Tag each test with `[REQ: <ID>]` to map it back to the requirement.
6. **Independence**: Each test case must be independent and idempotent.

## Example Generator Output

```typescript
import { expect, test } from '@playwright/test'
import { setupTestEnvironment } from './support/setup'
import { TEST_IDS } from './support/test-ids'

test.beforeEach(async ({ page }) => {
  await setupTestEnvironment(page)
})

test('[REQ: HOME-1] home page exposes core navigation', async ({ page }) => {
  // Action: goto /
  await page.goto('/')

  // Expect: expect_visible [data-testid='app-header']
  await expect(page.getByTestId(TEST_IDS.common.appHeader)).toBeVisible()

  // Expect: expect_visible [data-testid='app-footer']
  await expect(page.getByTestId(TEST_IDS.common.appFooter)).toBeVisible()

  // Expect: expect_visible [data-testid='nav-questions']
  await expect(page.getByTestId(TEST_IDS.common.navQuestions)).toBeVisible()
})
```

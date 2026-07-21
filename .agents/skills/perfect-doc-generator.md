---
name: perfect-doc-generator
description: Instructions for interactively gathering requirements from a user and generating "Perfect Doc" YAML specifications.
---

# Perfect Docs Generator

Use this skill to guide a user from an initial idea to a complete, highly structured set of "Perfect Doc" YAML specifications. This process is crucial because "Perfect Docs" serve as the ultimate source of truth for generating code and tests in the system.

## Objective

Your goal is to fully understand the user's idea and translate it into machine-parsable, highly structured YAML files that will live in `docs/specs/`.

## Phase 1: Deep Planning Mode (Mandatory)

Before writing any YAML files, you MUST engage in a deep planning mode with the user.

1. **Ask Clarifying Questions:** Do not assume anything. Break down the user's idea and ask questions about the domain model, access control, user roles, feature requirements, and UI structure.
2. **Take Your Time:** This process should take as long as necessary. Ask as many questions and take as many turns as needed to have absolutely zero doubt about the system to be built.
3. **Verify Assumptions:** Even if you think a requirement is clear, state your assumption to the user and ask them to confirm it.
4. **Iterate:** After the user answers your initial questions, reflect on their answers. If new questions arise, ask them.
5. **Approval:** Only proceed to Phase 2 when both you and the user agree that the requirements are crystal clear and complete.

## Phase 2: Generating Perfect Docs

Once the requirements are fully gathered and confirmed, generate the "Perfect Doc" YAML files. The resulting files MUST be "super AI friendly"—highly structured, machine-parsable, and strictly mapped to system behavior.

### Output Files to Generate

Depending on the scope of the project, you should generate or update the following types of files in the `docs/specs/` directory:

1. **`domain_model.yaml`**: The single source of truth for the database schema.
   - Entities must use PascalCase.
   - Fields must use snake_case.
   - Include types, constraints (e.g., required, unique), and relationships.
2. **`access_control.yaml`**: The matrix defining roles and permissions.
3. **`components.yaml`**: Definitions for reusable UI components and their `data-testid` attributes.
4. **Feature Requirements (`<feature_name>.yaml`)**: Individual files for each major feature or page.

### Rules for Feature YAML Files

- Each requirement must have a unique ID (e.g., `FEAT-1`).
- Include human-readable context (Title, Description).
- Include clear Acceptance Criteria.
- **Verification Block:** This is critical. You must include a `verification` block detailing the steps an E2E test would take to verify the feature.
  - Every interactive UI element MUST use a `data-testid` selector (e.g., `selector: "[data-testid='submit-button']"`).
  - Use standard actions: `goto`, `click`, `type`, `expect_visible`, `expect_not_visible`, `expect_url_match`, `expect_count`.

## Example Feature Output

```yaml
requirements:
  - id: AUTH-1
    title: User Login
    description: Users must be able to log in with an email and password.
    priority: MUST
    acceptance_criteria:
      - Valid credentials grant access and redirect to the dashboard.
      - Invalid credentials show an error message.
    verification:
      test_id: login_success
      steps:
        - action: goto
          url: /login
        - action: type
          selector: "[data-testid='input-email']"
          value: 'test@example.com'
        - action: type
          selector: "[data-testid='input-password']"
          value: 'securepassword123'
        - action: click
          selector: "[data-testid='btn-login']"
        - action: expect_visible
          selector: "[data-testid='dashboard-header']"
        - action: expect_url_match
          regex: /dashboard
```

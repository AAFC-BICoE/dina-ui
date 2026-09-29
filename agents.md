# Agents.md

This file is used for AI tools to better understand our project and development preferences.

## What this is

DINA UI is the React/Next.js front end for AAFC-DINA, a biodiversity collections management system. It is a **static-export SPA** (`output: "export"` in `next.config.js`) that is served behind a Caddy reverse proxy (`packages/dina-ui/dev.Caddyfile`) which proxies `/api/<name>-api/*` to independent back-end microservices (objectstore-api, agent-api, user-api, seqdb-api, collection-api, loan-transaction-api, search-api, dina-export-api). This repo contains no back-end code — those services live in separate repositories. Local full-stack development is done via [dina-local-deployment](https://aafc-bicoe.github.io/dina-local-deployment/#_developer_environment_setup), not standalone in this repo.

## Yarn workspaces

This is a Yarn v1 workspace monorepo with three packages under `packages/`:

- **`dina-ui`** — the actual Next.js application (pages, components, page-level types, intl messages).
- **`common-ui`** — shared library of API-client hooks, Formik-connected form components, list/table components, etc. Consumed via the `common-ui` path alias (mapped to `packages/common-ui/lib/index.ts` in the root `tsconfig.json` and Jest config), not a built package.
- **`scripts`** — standalone ts-node scripts for intl CSV import/export and syncing doc versions.

Root `tsconfig.json` path aliases: `@dina-ui/*` → `packages/dina-ui/*`, `common-ui` → `packages/common-ui/lib/index.ts`, `packages/*` → `packages/*`. All type-checking is done from the repo root against every package at once — there is no per-package `tsc`.

## Commands

Run these from the repo root (not from inside a package):

- `npx jest [path]` — run Jest tests for a specific path.
- `npx tsc --noEmit` — type-check the whole repo.
- `yarn lint` / `yarn lint:fix` — run ESLint (optionally auto-fixing).
- `yarn` — install dependencies for all workspaces. Re-run after switching branches.
- `yarn workspace dina-ui build` — production static export build.

Do not run a full-repo `npx jest` (no path) — it's too resource-intensive. Run only the specific path(s) or suite(s) relevant to the change. The developer will report any test failures they hit elsewhere. For the same reason, don't use `yarn test` or `yarn test:coverage`: both run `tsc` followed by the full Jest suite.

A pre-commit hook (Husky) runs `sync-documentation-versions`, stages `docs/versions.adoc`, then runs `lint-staged` (ESLint --fix and Prettier on staged files).

## Architecture

### Data fetching and writes

All server communication goes through a JSON:API client (Kitsu) exposed via React context (`packages/common-ui/lib/api-client/ApiClientContext.tsx`) and consumed with the `useApiClient()` hook, which is also how tests inject mocked `get`/`save`/`bulkGet`.

- **Reads**: the `useQuery<T>({ path })` hook (see `docs/useQuery_hook_function.adoc`) fetches a single resource or list; `withResponse(query, renderFn)` is the standard helper for handling loading/error/success without manual if/else branching.
- **Writes**: the `save` function from `useApiClient()` takes an array of `{ resource, type }` operations plus `{ apiBaseUrl: "/xxx-api" }`, and submits them as a single JSON:API jsonpatch transaction (backed by crnk-operations on the back end) — all operations succeed or the whole transaction is rejected (see `docs/write_operations.adoc`).
- Each back-end service has its own `apiBaseUrl` prefix (`/objectstore-api`, `/agent-api`, `/collection-api`, `/seqdb-api`, `/loan-transaction-api`, `/user-api`, `/dina-export-api`), matching the Caddy routes.
- Elasticsearch-backed list/search pages exist alongside the JSON:API pages (see `QueryPage`, `useElasticSearchQuery`, `AutoSuggestTextField`'s `elasticSearchBackend`) for index-backed querying and autosuggest.

### Page/component structure

- **Pages** (`packages/dina-ui/pages`) — file path = route (Next.js routing). Pages compose one of the standard layouts and pull in feature components.
- **Page layouts** (`packages/dina-ui/components`) — `PageLayout` (base), `ViewPageLayout` (view/edit a single resource), `ListPageLayout` (JSON:API list w/ filtering+pagination), `QueryPage` (Elasticsearch-backed list), `EditPageLayout`.
- **Forms** — built with `DinaForm` (`packages/common-ui/lib/formik-connected/DinaForm.tsx`), a Formik wrapper adding API-integrated saving, error display, relationship/linked-resource handling, revision/conflict detection, and bulk editing. Form fields (`TextField`, `SelectField`, `ResourceSelectField`, `AutoSuggestTextField`, `FilterBuilderField`, etc.) all connect via a `name` prop that supports nested paths (e.g. `"group.name"`) and live in `packages/common-ui/lib/formik-connected/`.
- Field tooltips/labels come from intl messages keyed as `field_<fieldName>` / `field_<fieldName>_tooltip`, overridable per-field with `customName`.

### Reuse these helpers

Check for an existing helper before writing a new one. Common ones, all exported via `common-ui` unless noted:

- `withResponse(query, renderFn)` — render loading/error/success states for a `useQuery` result.
- `getPreferredMultilingualPair(pairs, valueKey, locale)` (`packages/common-ui/lib/table/multilingual-cells.tsx`) — picks the best translation from a multilingual _data_ field (e.g. `MultilingualTitle.titles`, `MultilingualDescription.descriptions` — arrays of `{ lang, <value> }` pairs on a resource, distinct from intl UI-text messages). It prefers the pair matching the current locale, falling back to the first non-blank one. `titleCell`/`descriptionCell` (table cell renderers) and dina-ui's `getDatasetTitle` (a plain-string getter for use outside a table, e.g. a page heading) are thin wrappers around it — don't reimplement the lookup.
- `mountWithAppContext(<Component />, { apiContext })` (`packages/common-ui/lib/test-util/mock-app-context.tsx`) — mount a component in tests with a mocked API context.
- `clearAndType()` — clear and type into a field in tests.

### Comments

Keep comments minimal — add one only when the code is complex enough to need it. Never add comments that reference the task, ticket, or chat (e.g. "fixed per request", "added for bug #1234").

### Internationalization

Uses `react-intl`. Never hard-code UI text — use `<DinaMessage id="..." />` or `useDinaIntl().formatMessage(...)`.

Message keys are typed: they must exist in an English messages file before a French/German translation can reference them. The English files are:

- `packages/dina-ui/intl/dina-ui-en.ts` and `packages/dina-ui/intl/seqdb-en.ts` (dina-ui)
- `packages/common-ui/lib/intl/common-ui-en.ts` (shared common-ui messages)

The matching `-fr.ts` / `-de.ts` files are `Partial<typeof ENGLISH_MESSAGES>`, and English is the runtime fallback for missing translations. When adding a new key, add it to the English file; only add French/German entries when a translation is provided.

### Auth

Keycloak-based auth, wired through `packages/common-ui/lib/account/` (`AccountProvider`, `AuthenticatedApiClientProvider`, `DevUserProvider` for local dev without Keycloak).

## Test-driven development

Where a change warrants tests, write or update the tests first (in existing test coverage), then implement the change. Ask the developer to review the tests before proceeding with the implementation. If no existing test coverage exists, ask the developer whether to create it or skip it. When running unattended (e.g. a background session), write the tests, then stop and report back for review rather than continuing to the implementation.

Tests are expected for new components, hooks, or utilities, and for bug fixes with a reproducible scenario. They can be skipped for intl/copy tweaks, styling changes, and renames.

### Testing conventions

Full guide with copy-pasteable patterns: `docs/creating_tests.adoc` (mock GET/bulkGet/save/patch shapes, dropdown/router mocking, hook testing). Highlights:

- Mount components with `mountWithAppContext(<Component />, { apiContext })`, passing a mocked `apiContext: { apiClient: { get }, save, bulkGet }` rather than hitting real network.
- Use `@testing-library/user-event`, always `await`ed, instead of `fireEvent` — `clearAndType()` (from `common-ui`) clears + types in one step for fields that may already have a value.
- Always resolve async assertions with `waitFor`/`findBy*`; never use a raw `setTimeout` sleep. Keep `userEvent.*` calls outside `waitFor` callbacks since the callback may retry.
- When a test's DOM structure is unclear, use `screen.logTestingPlaygroundURL()` to get an inspectable URL.
- Jest config (`jest.config.ts`) maps `.css`/`.scss` to `identity-obj-proxy`, aliases `common-ui` and `@dina-ui/*` the same as the app, and runs on `jsdom`.
- Don't end test names with "(regression test)" or include any brackets in them.

## Documentation

Developer docs live in `docs/` as AsciiDoc (`.adoc`) files, assembled by `docs/index.adoc` and built with `yarn docs`. Key guides include `creating_tests.adoc`, `running_tests.adoc`, `useQuery_hook_function.adoc`, `write_operations.adoc`, `intl.adoc`, `react_component_types.adoc`, and `dina_design_guidelines.adoc`.

After completing a task, review whether the change affects anything documented in `docs/` (e.g. a new or changed hook, component pattern, testing convention, command, or workflow). If it does, suggest the specific doc updates to the developer — which file, which section, and the proposed wording — rather than editing the docs automatically. If no docs are affected, say so briefly.

- A new `.adoc` file must also be added to `docs/index.adoc` with an `include::` directive to appear in the built docs.
- Don't edit `docs/versions.adoc` — it is regenerated by the pre-commit hook.
- If a change makes this file (`agents.md`) out of date, suggest an update to it as well.

## Git

### Do not auto-commit or auto-push

Do not commit or push changes automatically, even in background/worktree sessions. Always leave changes staged, unstaged, or stashed and let the developer commit/push themselves, unless they explicitly ask for a commit or push in that session.

### Commit messages

When generating a commit message (never run the commit command, just generate the message for the developer), use this format:

```text
[Commit title derived from the branch name]

- [Bullet list of changes made, one sentence maximum.]
```

Derive the title from the branch name by replacing the first dash with ` #`, the second with `-`, and the remaining dashes with spaces. For example, `Bug-81611-TypeError-displayed-when-calendar-box-year-list-is-clicked-to-expanded` becomes `Bug #81611 - TypeError displayed when calendar box year list is clicked to expanded`.

Example:

```text
Support #38811 - Object store page is not loading controlled vocabulary items properly

- Added missing controlledVocabularyId attributes to all the isControlledVocabulary set ManagedAttributeEditors.
- readOnlyViewMode prop is actually not needed, we can just determine which one to display based on the isControlledVocabulary.
```

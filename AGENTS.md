# Repository Guidelines

## Project Structure & Module Organization
- `src/` houses the TypeScript action, with `index.ts` orchestrating file detection and test selection, and helper modules like `get-changed-files.ts` and `get-affected-tests.ts`. Co-located specs (e.g., `get-affected-tests.test.ts`) validate behaviour.
- `fixtures/` provides sample repositories and dependency graphs for deterministic tests. Add new fixtures sparingly and document intent in comments.
- `dist/` is the compiled output from `pnpm build`; never edit it manually. `action.yaml` defines the GitHub Action metadata, while `logo/` stores branding assets for documentation.

## Build, Test, and Development Commands
- `pnpm install` ensures dependencies match `pnpm-lock.yaml`. Use Node 20+ as declared in `package.json`.
- `pnpm build` runs `ncc` to bundle `src/` into `dist/` and generates `licenses.txt`.
- `pnpm test` executes the Vitest suite; combine with `--watch` or `--runInBand` as needed.
- `pnpm typecheck` runs `tsc --noEmit` under the strict compiler settings from `tsconfig.json`.
- `pnpm lint` (oxlint) and `pnpm format:check` (Prettier) should both be clean before opening a PR. Run `pnpm format` only when you intend to commit formatting changes.

## Coding Style & Naming Conventions
- Rely on Prettier defaults (2-space indentation, semicolons, single quotes where inferred) and the repository `.editorconfig`. Avoid manual formatting.
- Use `camelCase` for variables/functions, `PascalCase` for classes/types, and suffix test doubles with `Mock` or `Stub` for clarity.
- Keep modules focused: public APIs live in `index.ts`; module-level helpers remain file-scoped unless reused.
- Guard GitHub Action outputs and inputs with explicit validation; surface actionable errors via `core.setFailed`.

## Testing Guidelines
- Write Vitest specs alongside source files with the naming pattern `*.test.ts`. Mirror the module API in your describe blocks (`describe('getAffectedTests', ...)`).
- Use fixtures to simulate large dependency graphs instead of hand-rolled inline data. When adding fixtures, encode minimal cases and reference them in test comments.
- New logic should have deterministic coverage; prefer `expect.hasAssertions()` when iterating, and avoid network calls in tests.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `docs:`, etc.); scope is optional but helpful (e.g., `feat(diff): add file glob filtering`).
- Each PR should explain the problem, outline the solution, and list local verification (`pnpm test`, `pnpm typecheck`). Link issues or discussions where applicable.
- Include screenshots or terminal snippets only when they convey CI impact or UX changes. Request reviewers for domain-specific modules touched.

## Security & Configuration Tips
- Never print the GitHub token; use `core.setSecret` if logging is unavoidable. Validate required inputs before calling external services.
- Update `action.yaml` and regenerate `dist/` together. Consumers rely on the bundled output—forgetting to rebuild is a common source of regressions.

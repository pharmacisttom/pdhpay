# Instructions for future coding agents

Before modifying code READ README.md, docs/TOMVIS-BLUEPRINT.md, docs/ARCHITECTURE.md, docs/DATABASE.md, docs/SECURITY.md and docs/API-STANDARD.md.

- Preserve the modular monolith and dependency direction. Core must never import business modules.
- No hard-coded secrets. Validate all external input and enforce authorization server-side.
- Preserve tenant isolation: resolve tenant from authenticated context, constrain every tenant read/write, and retain composite assignment foreign keys.
- Audit sensitive changes in the same transaction. Never put secrets in logs, audit records or API output.
- Avoid duplicate core services and unrelated changes.
- Never silently change the schema. Review and create migrations for every schema change.
- Never disable security controls to make a feature work.
- No production deployment, force-push, history deletion or real production credentials without explicit authorization.

Before completing work run npm run lint, npm run typecheck, npm test and npm run build. Report created/modified files, database and migration changes, security implications, tests executed, build status and unresolved issues. Skipped MySQL tests are not passing tests. Use TEST_DATABASE_URL only for a disposable database ending in _test.

Dependencies are pinned. Overrides for mariadb, mysql2 and deepmerge-ts address published advisories in Prisma's transitive dependencies; verify Prisma generation, migration and runtime tests before changing them.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

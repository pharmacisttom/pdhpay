# TOMVIS Core 0.1.0

Reusable, tenant-aware Next.js modular monolith. This repository contains platform capabilities only; WorkD and other product modules belong in future projects.

## Local setup
1. Install Node.js 22.17+ (or Node.js 24 LTS) and MySQL 8+.
2. Run `npm ci`.
3. Copy `.env.example` to `.env`. Use a dedicated local MySQL database and account. Supply AUTH_SECRET (at least 32 random characters) and TOTP_ENCRYPTION_KEY (32 random bytes encoded as base64). Generate local secrets with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`; never commit them.
4. Run `npm run db:generate` and `npm run db:migrate`.
5. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD, then run `npm run db:seed`. Seeding refuses production. Sign in using the SEED_ORGANIZATION slug (default tomvis-dev).
6. Run `npm run dev`; open http://localhost:3000.

Validation: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`. Database integration tests require a disposable MySQL database (see tests/README.md).

Read docs/TOMVIS-BLUEPRINT.md, ARCHITECTURE.md, DATABASE.md, SECURITY.md and API-STANDARD.md before changes. Deployment is manual; see docs/DEPLOYMENT.md. Password reset delivery is an injectable application port and must be configured by the host product before reset emails can be delivered.

Git workflow: protect main; integrate reviewed feature/auth, feature/2fa, feature/rbac, feature/audit and feature/settings branches into develop; release reviewed, tested versions to main. Never force-push shared branches or delete history. No automatic production deployment.

# Local XAMPP database — 2026-09-27

Configured at the user's request on XAMPP `127.0.0.1:3306`:

- Server: MariaDB 10.4.32 (user-selected local alternative to the planned MySQL 8).
- Database: `pdhpayment`, utf8mb4 / utf8mb4_unicode_ci.
- Configuration: ignored root `.env`, with randomly generated AUTH_SECRET and
  TOTP_ENCRYPTION_KEY. No secrets printed or copied into documentation.
- Applied `20260910000000_foundation` and `20260927000000_payment_foundation`; Prisma reports schema up to date.
- Verified through the actual Core Prisma client: 14 tables including
  `_prisma_migrations` initially. Phase 2 now has 22 tables, one development
  organization/user, five inactive payment points, one inactive dummy bank and
  nine roles. The development login uses SEED_ORGANIZATION, SEED_ADMIN_EMAIL and
  SEED_ADMIN_PASSWORD in the ignored `.env`; no credentials are printed here.

## Local account limitation

The attempt to provision `pdhpayment_app`@`localhost` created the account but
failed to grant database privileges with ER_NOT_KEYFILE. Read-only CHECK TABLE
confirmed that the existing server table `mysql.db` is marked crashed/corrupt.
The application does not use this incomplete account.

The development `.env` temporarily uses the existing local XAMPP root account
without a password. This is local development configuration, not a production
account setup. No repair, reset or changes to existing application databases were
performed. The MySQL 5.6 JHCIS service on port 3333 was not modified.

Before switching to a dedicated account, back up and separately repair the
XAMPP system privilege tables, then reset the newly created account's password,
grant only the required database permissions, and update `.env`. Separate
migration DDL privileges from runtime DML privileges for production.

## Validation scope

Migration deployment, migration status, actual Prisma connection and a read of
Organization succeeded. This is not the disposable cross-tenant integration
suite. Phase 2 additionally ran the full suite with TEST_DATABASE_URL targeting
the separate `pdhpayment_phase2_test` database: 39 tests passed, none skipped.
Do not point TEST_DATABASE_URL at the development database.

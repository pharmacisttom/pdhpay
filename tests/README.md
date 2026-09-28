# Tests

`npm test` runs crypto, validation, authorization and mocked route integration tests. `mysql.test.ts` is explicitly skipped unless TEST_DATABASE_URL is provided. This is not equivalent to a passing live database test.

For live isolation validation, create a disposable MySQL 8 database with a name ending in `_test`, migrate it using DATABASE_URL pointed there, and run tests with TEST_DATABASE_URL pointing to that same database. Never use production data. The test creates two uniquely named organizations, attempts cross-tenant access and assignment, and deletes its fixtures.

Manual E2E acceptance: seed a disposable organization, sign in, create a second tenant, verify forbidden list/update/role assignment requests, enable TOTP using an authenticator, sign out and complete the challenge, reject replay, consume a recovery code once, change/reset password and verify prior sessions are revoked. Test keyboard navigation and small-screen layout. Future Playwright tests should use isolated fixtures and product-owned reset delivery capture, never a production email provider.

import { randomBytes } from "node:crypto";
Object.assign(process.env, { NODE_ENV: "test" });
if (
  process.env.TEST_DATABASE_URL &&
  !new URL(process.env.TEST_DATABASE_URL).pathname.endsWith("_test")
)
  throw new Error(
    "TEST_DATABASE_URL must name a disposable database ending in _test.",
  );
process.env.AUTH_SECRET = randomBytes(32).toString("base64");
process.env.TOTP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
process.env.APP_URL = "http://localhost:3000";
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  "mysql://test:test@127.0.0.1:3306/tomvis_test";

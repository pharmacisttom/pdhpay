import "dotenv/config";
import { db } from "../src/core/database/client";
async function main() {
  const now = new Date();
  await db().$transaction([
    db().session.deleteMany({
      where: {
        OR: [{ expiresAt: { lt: now } }, { idleExpiresAt: { lt: now } }],
      },
    }),
    db().passwordReset.deleteMany({ where: { expiresAt: { lt: now } } }),
    db().rateLimit.deleteMany({ where: { expiresAt: { lt: now } } }),
    db().twoFactorCredential.deleteMany({
      where: { enabled: false, setupExpiresAt: { lt: now } },
    }),
  ]);
}
main()
  .catch(() => {
    console.error("Authentication cleanup failed.");
    process.exitCode = 1;
  })
  .finally(() => db().$disconnect());

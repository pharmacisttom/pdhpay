import fs from "fs";
import path from "path";
import { Client } from "ssh2";

const KEY_PATH = path.join(process.cwd(), ".ssh_keys", "id_ed25519_vps");
const SSH_HOST = "187.52.117.39";
const SSH_USER = "deploy";

function runRemoteCommand(conn: Client, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    conn.exec(command, (err, stream) => {
      if (err) return reject(err);

      let stdout = "";
      let stderr = "";

      stream.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      stream.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      stream.on("close", () => {
        resolve(stdout || stderr);
      });
    });
  });
}

async function checkPaymentPoints() {
  console.log("🔍 Checking VPS Payment Points, Bank Accounts & Organizations...");

  const conn = new Client();
  conn.on("ready", async () => {
    try {
      const dbUser = process.env.VPS_MYSQL_USER || "pdhpayment_user";
      const dbPass = process.env.VPS_MYSQL_PASSWORD || "Pdhpay@10832";

      console.log("\n========================================================");
      console.log("📌 Organizations:");
      console.log("========================================================");
      const orgs = await runRemoteCommand(conn, `mysql -u ${dbUser} -p'${dbPass}' -h 127.0.0.1 pdhpayment -e "SELECT id, slug, name, active FROM organization;"`);
      console.log(orgs.trim());

      console.log("\n========================================================");
      console.log("📌 Bank Accounts:");
      console.log("========================================================");
      const banks = await runRemoteCommand(conn, `mysql -u ${dbUser} -p'${dbPass}' -h 127.0.0.1 pdhpayment -e "SELECT id, accountNumber, accountName, active FROM bankaccount;"`);
      console.log(banks.trim());

      console.log("\n========================================================");
      console.log("📌 Payment Points:");
      console.log("========================================================");
      const points = await runRemoteCommand(conn, `mysql -u ${dbUser} -p'${dbPass}' -h 127.0.0.1 pdhpayment -e "SELECT id, name, qrToken, status, bankAccountId, organizationId, openTime, closeTime FROM paymentpoint;"`);
      console.log(points.trim());

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("❌ Error checking payment points:", msg);
    } finally {
      conn.end();
    }
  }).on("error", (err) => {
    console.error("❌ SSH Error:", err.message);
  }).connect({
    host: SSH_HOST,
    port: 22,
    username: SSH_USER,
    privateKey: fs.readFileSync(KEY_PATH),
  });
}

checkPaymentPoints();

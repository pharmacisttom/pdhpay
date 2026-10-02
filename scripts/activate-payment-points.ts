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

async function activatePaymentPointsOnVPS() {
  console.log("⚡ Activating Payment Points & Bank Accounts on VPS Database...");

  const conn = new Client();
  conn.on("ready", async () => {
    try {
      const dbUser = process.env.VPS_MYSQL_USER || "pdhpayment_user";
      const dbPass = process.env.VPS_MYSQL_PASSWORD || "";

      // 1. Activate Bank Accounts
      console.log("1️⃣ Activating Bank Accounts (active = 1)...");
      const bankResult = await runRemoteCommand(conn, `mysql -u ${dbUser} -p'${dbPass}' -h 127.0.0.1 pdhpayment -e "UPDATE bankaccount SET active = 1;"`);
      console.log(bankResult.trim() || "✅ Bank accounts activated!");

      // 2. Activate Payment Points
      console.log("2️⃣ Activating Payment Points (status = 'ACTIVE')...");
      const pointResult = await runRemoteCommand(conn, `mysql -u ${dbUser} -p'${dbPass}' -h 127.0.0.1 pdhpayment -e "UPDATE paymentpoint SET status = 'ACTIVE';"`);
      console.log(pointResult.trim() || "✅ Payment points activated!");

      // 3. Verify status
      console.log("\n========================================================");
      console.log("📌 Updated Payment Points Status:");
      console.log("========================================================");
      const points = await runRemoteCommand(conn, `mysql -u ${dbUser} -p'${dbPass}' -h 127.0.0.1 pdhpayment -e "SELECT id, name, code, status, bankAccountId FROM paymentpoint;"`);
      console.log(points.trim());

      console.log("\n========================================================");
      console.log("📌 Updated Bank Accounts Status:");
      console.log("========================================================");
      const banks = await runRemoteCommand(conn, `mysql -u ${dbUser} -p'${dbPass}' -h 127.0.0.1 pdhpayment -e "SELECT id, accountName, active FROM bankaccount;"`);
      console.log(banks.trim());

      console.log("\n🎉 ACTIVATION COMPLETED SUCCESSFULLY!");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("❌ Error activating payment points:", msg);
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

activatePaymentPointsOnVPS();

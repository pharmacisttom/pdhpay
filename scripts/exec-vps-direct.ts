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

async function runVPSDirectTasks() {
  console.log("🚀 Executing VPS Direct Tasks via SSH Connection...");

  const conn = new Client();
  conn.on("ready", async () => {
    console.log(`✅ Connected to VPS (${SSH_USER}@${SSH_HOST})`);

    try {
      // Task 1: Check MySQL Service Status & Port Binding
      console.log("\n========================================================");
      console.log("📌 Task 1: Checking MySQL Service & Listening Port...");
      console.log("========================================================");
      const statusOutput = await runRemoteCommand(conn, "systemctl is-active mysql || systemctl status mysql --no-pager -l | head -n 15");
      console.log("Service Status:", statusOutput.trim());

      const portOutput = await runRemoteCommand(conn, "ss -tlnp | grep 3306");
      console.log("Listening Port (ss -tlnp | grep 3306):\n", portOutput.trim());

      const dbUser = process.env.VPS_MYSQL_USER || "pdhpayment_user";
      const dbPass = process.env.VPS_MYSQL_PASSWORD || "";

      // Task 2: Test MySQL Direct Connection & Basic Info
      console.log("\n========================================================");
      console.log("📌 Task 2: Testing MySQL Direct Connection & Version...");
      console.log("========================================================");
      const connQueryCmd = `mysql -u ${dbUser} -p'${dbPass}' -h 127.0.0.1 -P 3306 pdhpayment -e "SELECT DATABASE(), VERSION(), NOW();"`;
      const connQueryResult = await runRemoteCommand(conn, connQueryCmd);
      console.log(connQueryResult.trim());

      // Task 3: Show All Tables in pdhpayment Database
      console.log("\n========================================================");
      console.log("📌 Task 3: Listing All Tables in 'pdhpayment'...");
      console.log("========================================================");
      const tablesQueryCmd = `mysql -u ${dbUser} -p'${dbPass}' -h 127.0.0.1 pdhpayment -e "SHOW TABLES;"`;
      const tablesQueryResult = await runRemoteCommand(conn, tablesQueryCmd);
      console.log(tablesQueryResult.trim());

      // Task 4: Test CRUD Operations (Create temporary table _vps_crud_test)
      console.log("\n========================================================");
      console.log("📌 Task 4: Testing CRUD Operations (INSERT, SELECT, UPDATE, DELETE)...");
      console.log("========================================================");

      const crudSql = `
        CREATE TABLE IF NOT EXISTS _vps_crud_test (
          id INT AUTO_INCREMENT PRIMARY KEY,
          test_key VARCHAR(50),
          test_val VARCHAR(100),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO _vps_crud_test (test_key, test_val) VALUES ('vps_test', 'initial_value');
        SELECT * FROM _vps_crud_test WHERE test_key='vps_test';
        UPDATE _vps_crud_test SET test_val='updated_value' WHERE test_key='vps_test';
        SELECT * FROM _vps_crud_test WHERE test_key='vps_test';
        DELETE FROM _vps_crud_test WHERE test_key='vps_test';
        SELECT COUNT(*) AS remaining_count FROM _vps_crud_test WHERE test_key='vps_test';
        DROP TABLE IF EXISTS _vps_crud_test;
      `;

      const crudQueryCmd = `mysql -u ${dbUser} -p'${dbPass}' -h 127.0.0.1 pdhpayment -e "${crudSql.replace(/\n/g, " ")}"`;
      const crudQueryResult = await runRemoteCommand(conn, crudQueryCmd);
      console.log(crudQueryResult.trim());

      console.log("\n========================================================");
      console.log("🎉 ALL VPS DIRECT TASKS COMPLETED SUCCESSFULLY!");
      console.log("========================================================");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("❌ Error executing remote task:", msg);
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

runVPSDirectTasks();

import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { Client } from "ssh2";

const SSH_HOST = process.env.VPS_SSH_HOST || "187.52.117.39";
const SSH_USER = process.env.VPS_SSH_USER || "deploy";
const SSH_PASS = process.env.VPS_SSH_PASSWORD || "";
const KEY_DIR = path.join(process.cwd(), ".ssh_keys");
const PRIVATE_KEY_PATH = path.join(KEY_DIR, "id_ed25519_vps");
const PUBLIC_KEY_PATH = path.join(KEY_DIR, "id_ed25519_vps.pub");

async function setupSSHKey() {
  console.log("🔑 [Task 5] Setting up SSH Key Pair authentication for VPS...");

  // 1. Generate local SSH key pair if not exists
  if (!fs.existsSync(KEY_DIR)) {
    fs.mkdirSync(KEY_DIR, { recursive: true });
  }

  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    console.log("📝 Generating new ed25519 SSH key pair locally...");
    execSync(`ssh-keygen -t ed25519 -N "" -f "${PRIVATE_KEY_PATH}"`, { stdio: "inherit" });
  } else {
    console.log("ℹ️  Existing SSH key pair found locally.");
  }

  const publicKey = fs.readFileSync(PUBLIC_KEY_PATH, "utf8").trim();

  // 2. Connect via password and add public key to ~/.ssh/authorized_keys on VPS
  console.log(`📡 Connecting to ${SSH_USER}@${SSH_HOST} to install SSH public key...`);

  const conn = new Client();
  conn.on("ready", () => {
    console.log("✅ Password auth succeeded. Installing key to ~/.ssh/authorized_keys...");

    const command = `mkdir -p ~/.ssh && chmod 700 ~/.ssh && grep -qF "${publicKey}" ~/.ssh/authorized_keys 2>/dev/null || echo "${publicKey}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`;

    conn.exec(command, (err, stream) => {
      if (err) {
        console.error("❌ Exec Error:", err.message);
        conn.end();
        return;
      }

      stream.on("close", (code: number) => {
        console.log(`✅ SSH Key installed successfully on VPS! (exit code: ${code})`);
        conn.end();

        // 3. Verify key-based authentication
        verifyKeyAuth();
      });
      stream.on("data", (data: Buffer) => console.log(data.toString()));
      stream.stderr.on("data", (data: Buffer) => console.error(data.toString()));
    });
  }).on("error", (err) => {
    console.error("❌ SSH Connect Error:", err.message);
  }).connect({
    host: SSH_HOST,
    port: 22,
    username: SSH_USER,
    password: SSH_PASS,
  });
}

function verifyKeyAuth() {
  console.log("\n🧪 Verifying passwordless SSH Key authentication...");
  const conn = new Client();
  conn.on("ready", () => {
    console.log("🎉 SUCCESS! Passwordless SSH Key authentication is fully working!");
    conn.end();
  }).on("error", (err) => {
    console.error("❌ SSH Key Auth Failed:", err.message);
  }).connect({
    host: SSH_HOST,
    port: 22,
    username: SSH_USER,
    privateKey: fs.readFileSync(PRIVATE_KEY_PATH),
  });
}

setupSSHKey();

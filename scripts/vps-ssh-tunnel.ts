import { Client } from "ssh2";
import net from "net";
import fs from "fs";
import path from "path";

const KEY_PATH = path.join(process.cwd(), ".ssh_keys", "id_ed25519_vps");
const hasPrivateKey = fs.existsSync(KEY_PATH);

const SSH_CONFIG: Record<string, unknown> = {
  host: process.env.VPS_SSH_HOST || "187.52.117.39",
  port: parseInt(process.env.VPS_SSH_PORT || "22", 10),
  username: process.env.VPS_SSH_USER || "deploy",
  keepaliveInterval: 10000,
  keepaliveCountMax: 3,
};

if (hasPrivateKey) {
  console.log("🔑 Using SSH Private Key authentication (.ssh_keys/id_ed25519_vps)...");
  SSH_CONFIG.privateKey = fs.readFileSync(KEY_PATH);
} else {
  console.log("🔑 Using Password authentication...");
  SSH_CONFIG.password = process.env.VPS_SSH_PASSWORD || "";
}

const LOCAL_PORT = parseInt(process.env.TUNNEL_LOCAL_PORT || "13306", 10);
const REMOTE_HOST = "127.0.0.1";
const REMOTE_PORT = 3306;

let sshClient: Client | null = null;
let isConnecting = false;

function connectSSH(): Promise<Client> {
  return new Promise((resolve, reject) => {
    if (isConnecting) return;
    isConnecting = true;

    console.log(`[SSH Tunnel] Connecting to SSH server ${SSH_CONFIG.username}@${SSH_CONFIG.host}:${SSH_CONFIG.port}...`);
    const conn = new Client();

    conn.on("ready", () => {
      console.log(`[SSH Tunnel] ✅ SSH connection established successfully to ${SSH_CONFIG.host}`);
      isConnecting = false;
      sshClient = conn;
      resolve(conn);
    });

    conn.on("error", (err) => {
      console.error(`[SSH Tunnel] ❌ SSH Error:`, err.message);
      isConnecting = false;
      sshClient = null;
      reject(err);
    });

    conn.on("end", () => {
      console.warn(`[SSH Tunnel] ⚠️ SSH connection ended. Reconnecting in 5 seconds...`);
      sshClient = null;
      setTimeout(connectSSH, 5000);
    });

    conn.on("close", () => {
      console.warn(`[SSH Tunnel] ⚠️ SSH connection closed. Reconnecting in 5 seconds...`);
      sshClient = null;
      setTimeout(connectSSH, 5000);
    });

    try {
      conn.connect(SSH_CONFIG);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`[SSH Tunnel] ❌ Exception during SSH connect:`, msg);
      isConnecting = false;
      reject(e);
    }
  });
}

async function startServer() {
  await connectSSH();

  const server = net.createServer((localSocket) => {
    if (!sshClient) {
      console.error(`[SSH Tunnel] ❌ Received connection on port ${LOCAL_PORT} but SSH tunnel is disconnected.`);
      localSocket.destroy();
      return;
    }

    const clientAddr = localSocket.remoteAddress || "127.0.0.1";
    const clientPort = localSocket.remotePort || 0;

    sshClient.forwardOut(clientAddr, clientPort, REMOTE_HOST, REMOTE_PORT, (err, stream) => {
      if (err) {
        console.error(`[SSH Tunnel] ❌ SSH forwardOut error:`, err.message);
        localSocket.destroy();
        return;
      }

      localSocket.pipe(stream).pipe(localSocket);

      stream.on("close", () => {
        localSocket.end();
      });

      localSocket.on("close", () => {
        stream.end();
      });

      localSocket.on("error", (err: Error) => {
        console.error(`[SSH Tunnel] ❌ Local socket error:`, err.message);
        stream.destroy();
      });

      stream.on("error", (err: Error) => {
        console.error(`[SSH Tunnel] ❌ SSH stream error:`, err.message);
        localSocket.destroy();
      });
    });
  });

  server.listen(LOCAL_PORT, "127.0.0.1", () => {
    console.log(`[SSH Tunnel] 🚀 Local SSH Tunnel active at 127.0.0.1:${LOCAL_PORT} -> VPS ${REMOTE_HOST}:${REMOTE_PORT}`);
  });

  server.on("error", (err) => {
    console.error(`[SSH Tunnel] ❌ Server Error on port ${LOCAL_PORT}:`, err.message);
  });
}

startServer().catch((err) => {
  console.error(`[SSH Tunnel] ❌ Fatal error starting tunnel:`, err);
});

"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export function TwoFactor({ enabled }: { enabled: boolean }) {
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [qr, setQr] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(enabled);
  const [busy, setBusy] = useState(false);
  async function send(action: string) {
    setBusy(true);
    setMessage("");
    try {
      const result = await (
        await fetch(`/api/v1/auth/2fa/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            action === "setup"
              ? { currentPassword: password }
              : action === "enable"
                ? { code }
                : { currentPassword: password, code },
          ),
        })
      ).json();
      if (!result.success) {
        setMessage(result.error.message);
        return;
      }
      if (result.data.qr) setQr(result.data.qr);
      if (result.data.recoveryCodes) {
        setCodes(result.data.recoveryCodes);
        setQr("");
        setActive(true);
      }
      if (action === "disable") {
        setActive(false);
        setCodes([]);
        setQr("");
      }
      setCode("");
      setMessage("Security settings updated.");
    } catch {
      setMessage("Unable to connect.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel">
      <h2>Two-factor authentication</h2>
      <p>{active ? "Enabled" : "Not enabled"}</p>
      <div className="form-stack">
        <label>
          Current password
          <Input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {!active && (
          <Button disabled={busy || !password} onClick={() => send("setup")}>
            Set up authenticator
          </Button>
        )}
        {qr && (
          <div>
            <p>Scan with your authenticator, then enter its six-digit code.</p>
            {/* Provisioning is an ephemeral data URL; never cached by an image optimizer. */}
            <Image
              unoptimized
              src={qr}
              alt="Authenticator provisioning QR code"
              width={220}
              height={220}
            />
          </div>
        )}
        <label>
          Authenticator or recovery code
          <Input
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </label>
        {qr && (
          <Button disabled={busy || !code} onClick={() => send("enable")}>
            Verify and enable
          </Button>
        )}
        {active && (
          <div className="actions">
            <Button
              disabled={busy || !code || !password}
              onClick={() => send("recovery")}
            >
              Regenerate recovery codes
            </Button>
            <Button
              variant="outline"
              disabled={busy || !code || !password}
              onClick={() => send("disable")}
            >
              Disable 2FA
            </Button>
          </div>
        )}
        {codes.length > 0 && (
          <div>
            <strong>Save these recovery codes now. Each works once.</strong>
            <pre className="recovery">{codes.join("\n")}</pre>
            <Button variant="outline" onClick={() => setCodes([])}>
              I have saved my codes
            </Button>
          </div>
        )}
        <p role="status">{message}</p>
      </div>
    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = { id: string; name: string };

export function RegistrationApproval({
  userId,
  roles,
}: {
  userId: string;
  roles: Role[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function approve() {
    if (!selected.length) return setMessage("กรุณาเลือกอย่างน้อยหนึ่งบทบาท");
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/v1/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE", roleIds: selected }),
      });
      const result = await response.json();
      if (!result.success) return setMessage(result.error.message);
      router.refresh();
    } catch {
      setMessage("ไม่สามารถเชื่อมต่อระบบได้");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="approval-box">
      <div className="role-options">
        {roles.map((role) => (
          <label key={role.id}>
            <input
              type="checkbox"
              checked={selected.includes(role.id)}
              onChange={(event) =>
                setSelected((current) =>
                  event.target.checked
                    ? [...current, role.id]
                    : current.filter((id) => id !== role.id),
                )
              }
            />{" "}
            {role.name}
          </label>
        ))}
      </div>
      <button
        className="button button-primary"
        type="button"
        disabled={busy}
        onClick={approve}
      >
        {busy ? "กำลังอนุมัติ…" : "กำหนดบทบาทและอนุมัติ"}
      </button>
      {message && (
        <p role="status" className="form-message">
          {message}
        </p>
      )}
    </div>
  );
}

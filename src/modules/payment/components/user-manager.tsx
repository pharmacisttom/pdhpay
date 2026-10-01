"use client";

import { useEffect, useState } from "react";
import { api, showError } from "./api";
import Swal from "sweetalert2";

type UserRole = {
  role: { id: string; name: string };
};

type PaymentPointAssignment = {
  point: { id: string; name: string; code: string };
};

type UserItem = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  roles: UserRole[];
  paymentAssignments: PaymentPointAssignment[];
};

type RoleItem = {
  id: string;
  name: string;
};

export function UserManager() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [availableRoles, setAvailableRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  const fetchUsers = () => {
    api<{ users: UserItem[]; availableRoles: RoleItem[] }>("users")
      .then((data) => {
        setUsers(data.users);
        setAvailableRoles(data.availableRoles);
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
        void showError(e);
      });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditRoles = (user: UserItem) => {
    setEditingUser(user);
    setSelectedRoleIds(user.roles.map((r) => r.role.id));
  };

  const toggleRole = (roleId: string) => {
    if (selectedRoleIds.includes(roleId)) {
      setSelectedRoleIds(selectedRoleIds.filter((id) => id !== roleId));
    } else {
      setSelectedRoleIds([...selectedRoleIds, roleId]);
    }
  };

  const handleSaveRoles = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || busy) return;
    setBusy(true);

    try {
      await api(`users/${editingUser.id}/roles`, "POST", {
        roleIds: selectedRoleIds,
      });
      await Swal.fire("บันทึกสำเร็จ", "ปรับปรุงสิทธิ์บทบาทผู้ใช้งานเรียบร้อย", "success");
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      void showError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section lang="th">
      <div className="page-head">
        <p className="eyebrow">การบริหารจัดการสิทธิ์ (RBAC)</p>
        <h1>จัดการผู้ใช้งานและบทบาท (Users & Roles)</h1>
        <p>กำหนดสิทธิ์การใช้งานและมอบหมายบทบาทหน้าที่แก่เจ้าหน้าที่การเงิน</p>
      </div>

      <section className="panel">
        {loading ? (
          <p>กำลังโหลดรายชื่อผู้ใช้งาน...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ชื่อ-นามสกุล / Display Name</th>
                  <th>อีเมล</th>
                  <th>บทบาทสิทธิ์ (Roles)</th>
                  <th>จุดรับชำระที่ได้รับมอบหมาย</th>
                  <th>สถานะ</th>
                  <th>จัดการสิทธิ์</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong>{u.displayName || `${u.firstName} ${u.lastName}`.trim() || u.email}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {u.roles.map((r) => (
                        <span key={r.role.id} className="badge" style={{ marginRight: "0.25rem" }}>
                          {r.role.name}
                        </span>
                      ))}
                      {!u.roles.length && <span className="text-muted">—</span>}
                    </td>
                    <td>
                      {u.paymentAssignments.map((pa) => (
                        <span key={pa.point.id} className="badge-secondary" style={{ marginRight: "0.25rem", padding: "0.2rem 0.5rem", borderRadius: "4px", fontSize: "0.8rem" }}>
                          {pa.point.name}
                        </span>
                      ))}
                      {!u.paymentAssignments.length && <span className="text-muted">—</span>}
                    </td>
                    <td>
                      <span className={`status-pill ${u.status === "ACTIVE" ? "ready" : "not-ready"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="button button-outline button-small"
                        onClick={() => openEditRoles(u)}
                      >
                        แก้ไขสิทธิ์ Roles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {editingUser && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>กำหนดบทบาทสิทธิ์: {editingUser.displayName || editingUser.email}</h2>
            <form onSubmit={handleSaveRoles}>
              <div className="form-group" style={{ margin: "1.5rem 0" }}>
                <label style={{ marginBottom: "1rem", display: "block" }}>
                  เลือกบทบาทที่ต้องการมอบหมาย:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {availableRoles.map((role) => (
                    <label key={role.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.includes(role.id)}
                        onChange={() => toggleRole(role.id)}
                      />
                      <strong>{role.name}</strong>
                    </label>
                  ))}
                </div>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setEditingUser(null)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={busy}
                >
                  {busy ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนสิทธิ์"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

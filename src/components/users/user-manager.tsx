"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Clock,
  Search,
  Edit3,
  Shield,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  X,
} from "lucide-react";

type Role = {
  id: string;
  name: string;
};

type UserItem = {
  id: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  status: "PENDING" | "ACTIVE" | "DISABLED";
  createdAt: string;
  roles: { roleId: string; role: { name: string } }[];
};

export function UserManager({
  initialData,
}: {
  initialData: Record<string, unknown>;
}) {
  const router = useRouter();
  const [users, setUsers] = useState<UserItem[]>(
    (initialData.items as UserItem[]) || []
  );
  const [roles, setRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [busy, setBusy] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [statusValue, setStatusValue] = useState<"PENDING" | "ACTIVE" | "DISABLED">("ACTIVE");

  useEffect(() => {
    fetch("/api/v1/roles")
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data?.items) {
          setRoles(result.data.items);
        }
      })
      .catch(() => {});
  }, []);

  const refreshUsers = async () => {
    try {
      const res = await fetch(`/api/v1/users?q=${encodeURIComponent(searchQuery)}`);
      const result = await res.json();
      if (result.success && result.data?.items) {
        setUsers(result.data.items);
      }
    } catch {
      // Keep existing users on failure
    }
  };

  const openAdd = () => {
    setEmail("");
    setDisplayName("");
    setFirstName("");
    setLastName("");
    setPassword("");
    setSelectedRoleIds([]);
    setStatusValue("ACTIVE");
    setShowAddModal(true);
  };

  const openEdit = (user: UserItem) => {
    setEditingUser(user);
    setEmail(user.email);
    setDisplayName(user.displayName);
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setSelectedRoleIds(user.roles.map((r) => r.roleId));
    setStatusValue(user.status);
    setShowEditModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    try {
      const res = await fetch("/api/v1/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          displayName,
          firstName,
          lastName,
          password,
          roleIds: selectedRoleIds,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "ไม่สามารถเพิ่มผู้ใช้งานได้");
      }

      await Swal.fire({
        title: "เพิ่มผู้ใช้งานสำเร็จ",
        text: `บัญชี ${displayName} ถูกเพิ่มเข้าสู่ระบบเรียบร้อยแล้ว`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setShowAddModal(false);
      refreshUsers();
      router.refresh();
    } catch (err) {
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || busy) return;
    setBusy(true);

    try {
      const res = await fetch(`/api/v1/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          firstName,
          lastName,
          status: statusValue,
          roleIds: selectedRoleIds,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "ไม่สามารถแก้ไขข้อมูลได้");
      }

      await Swal.fire({
        title: "บันทึกการแก้ไขสำเร็จ",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setShowEditModal(false);
      refreshUsers();
      router.refresh();
    } catch (err) {
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง",
        icon: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleStatus = async (user: UserItem, newStatus: "ACTIVE" | "DISABLED") => {
    const actionText = newStatus === "ACTIVE" ? "เปิดใช้งาน" : "ปิดใช้งาน";
    const result = await Swal.fire({
      title: `ยืนยัน${actionText}ผู้ใช้ "${user.displayName}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/v1/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || `ไม่สามารถ${actionText}ผู้ใช้ได้`);
      }

      await Swal.fire({
        title: `${actionText}เรียบร้อยแล้ว`,
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });

      refreshUsers();
      router.refresh();
    } catch (err) {
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err instanceof Error ? err.message : "กรุณาลองอีกครั้ง",
        icon: "error",
      });
    }
  };

  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId]
    );
  };

  // Filtering
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      statusFilter === "ALL" || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = users.filter((u) => u.status === "PENDING").length;
  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const disabledCount = users.filter((u) => u.status === "DISABLED").length;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-teal-600" />
            บุคลากรและจัดการสิทธิ์ผู้ใช้งาน
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            จัดการบัญชีผู้ใช้งาน อนุมัติการลงทะเบียน และกำหนดบทบาทสิทธิ์การเข้าถึงระบบ
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg font-semibold text-sm hover:bg-teal-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          เพิ่มบุคลากรใหม่
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">บุคลากรทั้งหมด</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{users.length}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">ใช้งานอยู่ (Active)</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">รออนุมัติ (Pending)</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">ปิดใช้งาน (Disabled)</p>
            <p className="text-2xl font-bold text-slate-400 mt-1">{disabledCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center">
            <UserX className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ หรืออีเมลผู้ใช้งาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "ทั้งหมด" },
            { id: "PENDING", label: `รออนุมัติ (${pendingCount})` },
            { id: "ACTIVE", label: `เปิดใช้งาน (${activeCount})` },
            { id: "DISABLED", label: `ปิดใช้งาน (${disabledCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? "bg-teal-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">ชื่อ - นามสกุล</th>
                <th className="py-3.5 px-4">อีเมล</th>
                <th className="py-3.5 px-4">บทบาทหน้าที่ (Roles)</th>
                <th className="py-3.5 px-4">สถานะ</th>
                <th className="py-3.5 px-4 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    ไม่พบข้อมูลผู้ใช้งานตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {u.displayName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-slate-400 italic">ยังไม่กำหนดบทบาท</span>
                        ) : (
                          u.roles.map((r) => (
                            <span
                              key={r.roleId}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-800 border border-teal-200"
                            >
                              <Shield className="w-3 h-3 text-teal-600" />
                              {r.role.name}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.status === "ACTIVE" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          เปิดใช้งาน
                        </span>
                      )}
                      {u.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          รออนุมัติ
                        </span>
                      )}
                      {u.status === "DISABLED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          ปิดใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => openEdit(u)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        แก้ไข
                      </button>
                      {u.status === "ACTIVE" ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u, "DISABLED")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded transition-colors"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          ปิดใช้งาน
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u, "ACTIVE")}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          เปิดใช้งาน
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                เพิ่มบุคลากรใหม่ในระบบ
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อที่แสดงในระบบ (Display Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นส. สมหญิง ใจดี"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  อีเมล (Email / Sign-in) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="เช่น user@pluakdaenghospital.go.th"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รหัสผ่านเริ่มต้น (ขั้นต่ำ 12 ตัวอักษร) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={12}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  กำหนดบทบาทหน้าที่ (Roles)
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {roles.map((r) => {
                    const checked = selectedRoleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        onClick={() => toggleRoleSelection(r.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                          checked
                            ? "bg-teal-50 border-teal-300 font-semibold text-teal-900"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span>{r.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  เพิ่มผู้ใช้งาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-600" />
                แก้ไขข้อมูลผู้ใช้งาน: {editingUser.email}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อที่แสดงในระบบ (Display Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานะบัญชี
                </label>
                <select
                  value={statusValue}
                  onChange={(e) => setStatusValue(e.target.value as "PENDING" | "ACTIVE" | "DISABLED")}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="ACTIVE">เปิดใช้งาน (ACTIVE)</option>
                  <option value="PENDING">รออนุมัติ (PENDING)</option>
                  <option value="DISABLED">ปิดใช้งาน (DISABLED)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  มอบหมายบทบาทหน้าที่ (Roles)
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {roles.map((r) => {
                    const checked = selectedRoleIds.includes(r.id);
                    return (
                      <label
                        key={r.id}
                        onClick={() => toggleRoleSelection(r.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                          checked
                            ? "bg-teal-50 border-teal-300 font-semibold text-teal-900"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {}}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span>{r.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="px-5 py-2 bg-teal-700 text-white rounded-lg text-sm font-semibold hover:bg-teal-800 disabled:opacity-50 flex items-center gap-2"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

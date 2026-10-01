"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  Shield,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  Users,
  Key,
  Loader2,
  X,
} from "lucide-react";

type RolePermissionItem = {
  permission: {
    name: string;
  };
};

type RoleItem = {
  id: string;
  name: string;
  permissions: RolePermissionItem[];
  _count?: {
    users: number;
  };
};

const permissionGroups = [
  {
    title: "💳 ระบบการเงิน & QR Payment",
    items: [
      { key: "payment.dashboard.read", label: "ดูแดชบอร์ดสรุปการเงิน" },
      { key: "payment.transaction.read", label: "ดูรายการโอนเงินทั้งหมด" },
      { key: "payment.transaction.verify", label: "อนุมัติสลิปโอนเงิน" },
      { key: "payment.transaction.reject", label: "ปฏิเสธสลิปโอนเงิน" },
      { key: "payment.receipt.create", label: "ออกใบเสร็จรับเงิน" },
      { key: "payment.point.read", label: "ดูรายการจุดรับชำระเงิน" },
      { key: "payment.point.create", label: "สร้างจุดรับชำระเงินใหม่" },
      { key: "payment.point.update", label: "แก้ไขจุดรับชำระเงิน" },
      { key: "payment.point.assign_staff", label: "มอบหมายเจ้าหน้าที่ประจำจุด" },
      { key: "payment.shift.open", label: "เปิดกะการรับชำระ" },
      { key: "payment.shift.close", label: "ปิดกะและกระทบยอดเงิน" },
      { key: "payment.report.read", label: "ดูรายงานการรับเงินประจำวัน" },
      { key: "payment.report.export", label: "ส่งออกข้อมูลไปยัง Excel/Sheets" },
      { key: "payment.admin.manage", label: "ตั้งค่าระบบการเงินระดับแอดมิน" },
    ],
  },
  {
    title: "👥 จัดการบุคลากร (Users)",
    items: [
      { key: "users.view", label: "ดูรายชื่อบุคลากร" },
      { key: "users.create", label: "เพิ่มบุคลากรใหม่" },
      { key: "users.update", label: "แก้ไขข้อมูลบุคลากร" },
      { key: "users.delete", label: "ปิดใช้งานบัญชีผู้ใช้" },
    ],
  },
  {
    title: "🛡️ จัดการบทบาทและสิทธิ์ (Roles)",
    items: [
      { key: "roles.view", label: "ดูรายการบทบาทสิทธิ์" },
      { key: "roles.create", label: "สร้างบทบาทใหม่" },
      { key: "roles.update", label: "แก้ไขสิทธิ์ในบทบาท" },
      { key: "roles.delete", label: "ลบบทบาท" },
    ],
  },
  {
    title: "⚙️ การตั้งค่าองค์กรและ Audit Log",
    items: [
      { key: "organizations.view", label: "ดูข้อมูลองค์กร" },
      { key: "organizations.update", label: "แก้ไขข้อมูลองค์กร" },
      { key: "settings.view", label: "ดูการตั้งค่าระบบ" },
      { key: "settings.update", label: "แก้ไขการตั้งค่าระบบ" },
      { key: "audit.view", label: "ดูประวัติการใช้งาน (Audit Logs)" },
    ],
  },
];

export function RoleManager({
  initialData,
}: {
  initialData: Record<string, unknown>;
}) {
  const router = useRouter();
  const [roles, setRoles] = useState<RoleItem[]>(
    (initialData.items as RoleItem[]) || []
  );

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null);

  const [roleName, setRoleName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const refreshRoles = async () => {
    try {
      const res = await fetch("/api/v1/roles");
      const result = await res.json();
      if (result.success && result.data?.items) {
        setRoles(result.data.items);
      }
    } catch {
      // Keep existing roles
    }
  };

  const openAdd = () => {
    setRoleName("");
    setSelectedPermissions([]);
    setShowAddModal(true);
  };

  const openEdit = (role: RoleItem) => {
    setEditingRole(role);
    setRoleName(role.name);
    setSelectedPermissions(role.permissions.map((p) => p.permission.name));
    setShowEditModal(true);
  };

  const togglePermission = (permKey: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permKey)
        ? prev.filter((k) => k !== permKey)
        : [...prev, permKey]
    );
  };

  const selectGroupAll = (groupKeys: string[]) => {
    const allSelected = groupKeys.every((k) => selectedPermissions.includes(k));
    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((k) => !groupKeys.includes(k)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...groupKeys])]);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    try {
      const res = await fetch("/api/v1/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roleName,
          permissions: selectedPermissions,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "ไม่สามารถเพิ่มบทบาทได้");
      }

      await Swal.fire({
        title: "สร้างบทบาทใหม่เรียบร้อยแล้ว",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setShowAddModal(false);
      refreshRoles();
      router.refresh();
    } catch (err) {
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err instanceof Error ? err.message : "กรุณาลองอีกครั้ง",
        icon: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || busy) return;
    setBusy(true);

    try {
      const res = await fetch(`/api/v1/roles/${editingRole.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: roleName,
          permissions: selectedPermissions,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "ไม่สามารถแก้ไขบทบาทได้");
      }

      await Swal.fire({
        title: "บันทึกการแก้ไขบทบาทสำเร็จ",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      setShowEditModal(false);
      refreshRoles();
      router.refresh();
    } catch (err) {
      await Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: err instanceof Error ? err.message : "กรุณาลองอีกครั้ง",
        icon: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteRole = async (role: RoleItem) => {
    const confirm = await Swal.fire({
      title: `ยืนยันลบบทบาท "${role.name}"?`,
      text: "การลบบทบาทจะไม่สามารถกู้คืนได้ และต้องไม่มีบุคลากรที่ถูกผูกกับบทบาทนี้อยู่",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยันลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#e11d48",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/v1/roles/${role.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.error?.message || "ไม่สามารถลบบทบาทได้");
      }

      await Swal.fire({
        title: "ลบบทบาทเรียบร้อยแล้ว",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });

      refreshRoles();
      router.refresh();
    } catch (err) {
      await Swal.fire({
        title: "ไม่สามารถลบได้",
        text: err instanceof Error ? err.message : "กรุณาลองอีกครั้ง",
        icon: "error",
      });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-7 h-7 text-teal-600" />
            การจัดการบทบาทและสิทธิ์การใช้งาน (Roles & Permissions)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            กำหนดกลุ่มสิทธิ์การใช้งานสำหรับทีมงาน เช่น การเงิน, ผู้ตรวจสอบสลิป, หรือผู้ดูแลระบบ
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-teal-700 text-white rounded-lg font-semibold text-sm hover:bg-teal-800 transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          สร้างบทบาทใหม่
        </button>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((r) => {
          const userCount = r._count?.users ?? 0;
          const isSystemRole = ["SUPER_ADMIN", "ORG_ADMIN"].includes(r.name);

          return (
            <div
              key={r.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{r.name}</h3>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        บุคลากรในบทบาทนี้: <strong>{userCount} คน</strong>
                      </span>
                    </div>
                  </div>
                  {isSystemRole && (
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                      System Role
                    </span>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-teal-600" />
                    สิทธิ์การใช้งานที่ได้รับ ({r.permissions.length} สิทธิ์):
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {r.permissions.map((p) => (
                      <span
                        key={p.permission.name}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono"
                      >
                        {p.permission.name}
                      </span>
                    ))}
                    {r.permissions.length === 0 && (
                      <span className="text-xs text-slate-400 italic">ไม่มีสิทธิ์ใดๆ</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  แก้ไขสิทธิ์
                </button>
                {!isSystemRole && userCount === 0 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRole(r)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    ลบ
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD ROLE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600" />
                สร้างบทบาทสิทธิ์การใช้งานใหม่ (Create Role)
              </h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อบทบาท (Role Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น FINANCE_STAFF, CASHIER, REPORT_VIEWER"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-700">
                  เลือกสิทธิ์การใช้งานที่อนุญาต (Permissions)
                </label>

                {permissionGroups.map((group) => {
                  const groupKeys = group.items.map((i) => i.key);
                  const isAllSelected = groupKeys.every((k) => selectedPermissions.includes(k));

                  return (
                    <div key={group.title} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-bold text-slate-800">{group.title}</h4>
                        <button
                          type="button"
                          onClick={() => selectGroupAll(groupKeys)}
                          className="text-[11px] font-semibold text-teal-700 hover:text-teal-900"
                        >
                          {isAllSelected ? "ยกเลิกเลือกหมวดนี้" : "เลือกทั้งหมดหมวดนี้"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.items.map((item) => {
                          const checked = selectedPermissions.includes(item.key);
                          return (
                            <label
                              key={item.key}
                              onClick={() => togglePermission(item.key)}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                checked
                                  ? "bg-teal-50 border-teal-300 font-semibold text-teal-900"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}}
                                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 mt-0.5"
                              />
                              <div>
                                <span>{item.label}</span>
                                <span className="block text-[10px] text-slate-400 font-mono">{item.key}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
                  สร้างบทบาท
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {showEditModal && editingRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-teal-600" />
                แก้ไขสิทธิ์ในบทบาท: {editingRole.name}
              </h2>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateRole} className="p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อบทบาท (Role Name) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-700">
                  ปรับแก้ไขสิทธิ์การใช้งาน (Permissions)
                </label>

                {permissionGroups.map((group) => {
                  const groupKeys = group.items.map((i) => i.key);
                  const isAllSelected = groupKeys.every((k) => selectedPermissions.includes(k));

                  return (
                    <div key={group.title} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <h4 className="text-xs font-bold text-slate-800">{group.title}</h4>
                        <button
                          type="button"
                          onClick={() => selectGroupAll(groupKeys)}
                          className="text-[11px] font-semibold text-teal-700 hover:text-teal-900"
                        >
                          {isAllSelected ? "ยกเลิกเลือกหมวดนี้" : "เลือกทั้งหมดหมวดนี้"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.items.map((item) => {
                          const checked = selectedPermissions.includes(item.key);
                          return (
                            <label
                              key={item.key}
                              onClick={() => togglePermission(item.key)}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                checked
                                  ? "bg-teal-50 border-teal-300 font-semibold text-teal-900"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => {}}
                                className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 mt-0.5"
                              />
                              <div>
                                <span>{item.label}</span>
                                <span className="block text-[10px] text-slate-400 font-mono">{item.key}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
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
                  บันทึกสิทธิ์
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

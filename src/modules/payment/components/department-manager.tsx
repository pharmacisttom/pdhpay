"use client";

import { useEffect, useState } from "react";
import { api, showError } from "./api";
import Swal from "sweetalert2";

type Department = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
};

export function DepartmentManager() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);

  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);

  const fetchDepartments = () => {
    api<Department[]>("departments")
      .then((data) => {
        setDepartments(data);
        setLoading(false);
      })
      .catch((e) => {
        setLoading(false);
        void showError(e);
      });
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openNew = () => {
    setEditing(null);
    setCode("");
    setName("");
    setDescription("");
    setActive(true);
    setShowModal(true);
  };

  const openEdit = (dep: Department) => {
    setEditing(dep);
    setCode(dep.code);
    setName(dep.name);
    setDescription(dep.description || "");
    setActive(dep.active);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);

    try {
      if (editing) {
        await api(`departments/${editing.id}`, "PATCH", {
          code,
          name,
          description: description || null,
          active,
        });
        await Swal.fire("บันทึกสำเร็จ", "แก้ไขข้อมูลแผนกเรียบร้อย", "success");
      } else {
        await api("departments", "POST", {
          code,
          name,
          description: description || null,
          active,
        });
        await Swal.fire("สร้างสำเร็จ", "เพิ่มแผนกใหม่เรียบร้อย", "success");
      }

      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      void showError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section lang="th">
      <div className="page-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p className="eyebrow">การบริหารจัดการระบบ</p>
          <h1>จัดการแผนก (Departments)</h1>
          <p>จัดการรายชื่อแผนกและรหัสอ้างอิงภายในโรงพยาบาลปลวกแดง</p>
        </div>
        <button type="button" className="button button-primary" onClick={openNew}>
          + เพิ่มแผนกใหม่
        </button>
      </div>

      <section className="panel">
        {loading ? (
          <p>กำลังโหลดรายชื่อแผนก...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>รหัสแผนก</th>
                  <th>ชื่อแผนก</th>
                  <th>รายละเอียด</th>
                  <th>สถานะ</th>
                  <th>การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dep) => (
                  <tr key={dep.id}>
                    <td><strong>{dep.code}</strong></td>
                    <td>{dep.name}</td>
                    <td>{dep.description || "—"}</td>
                    <td>
                      <span className={`status-pill ${dep.active ? "ready" : "not-ready"}`}>
                        {dep.active ? "ใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="button button-outline button-small"
                        onClick={() => openEdit(dep)}
                      >
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !departments.length && (
          <p className="text-muted text-center" style={{ padding: "2rem" }}>
            ยังไม่มีแผนกในระบบ กรุณากด &quot;+ เพิ่มแผนกใหม่&quot;
          </p>
        )}
      </section>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h2>{editing ? "แก้ไขแผนก" : "เพิ่มแผนกใหม่"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>รหัสแผนก (ภาษาอังกฤษ/ตัวเลข)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น OPD, ER, IPD, DENTAL"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                />
              </div>

              <div className="form-group">
                <label>ชื่อแผนก</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="เช่น แผนกผู้ป่วยนอก (OPD)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>รายละเอียด / คำอธิบายเพิ่มเติม</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                  />
                  เปิดใช้งานแผนกนี้
                </label>
              </div>

              <div className="step-actions">
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setShowModal(false)}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="button button-primary"
                  disabled={busy}
                >
                  {busy ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

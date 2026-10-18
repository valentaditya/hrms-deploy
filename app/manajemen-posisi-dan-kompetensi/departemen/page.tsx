"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Check, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import Pagination, { type PageSize } from "@/components/Pagination";
import PosisiKompetensiShell from "@/components/posisi-kompetensi/PosisiKompetensiShell";

type Department = {
  id: string;
  nama_departemen: string;
  created_at?: string;
};

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<PageSize>(10);

  const loadDepartments = async () => {
    try {
      const response = await fetch("/api/d1/departments");
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Gagal memuat departemen.");
      setDepartments(result.data || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat departemen.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    fetch("/api/d1/departments")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error?.message || "Gagal memuat departemen.");
        }
        return result.data || [];
      })
      .then((data) => {
        if (isMounted) setDepartments(data);
      })
      .catch((loadError: unknown) => {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat departemen.");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const pageSize = itemsPerPage === "all" ? Math.max(1, departments.length) : itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(departments.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const visibleDepartments = departments.slice((page - 1) * pageSize, page * pageSize);

  const resetForm = () => {
    setEditingDepartment(null);
    setName("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Nama departemen wajib diisi.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        editingDepartment ? `/api/d1/departments/${editingDepartment.id}` : "/api/d1/departments",
        {
          method: editingDepartment ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nama_departemen: cleanName }),
        }
      );
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Gagal menyimpan departemen.");
      setNotice(editingDepartment ? "Departemen berhasil diperbarui." : "Departemen berhasil ditambahkan.");
      resetForm();
      await loadDepartments();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan departemen.");
    } finally {
      setIsSaving(false);
    }
  };

  const startEditing = (department: Department) => {
    setEditingDepartment(department);
    setName(department.nama_departemen);
    setError("");
    setNotice("");
  };

  const handleDelete = async () => {
    if (!deletingDepartment) return;
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/d1/departments/${deletingDepartment.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error?.message || "Gagal menghapus departemen.");
      setNotice("Departemen berhasil dihapus.");
      setDeletingDepartment(null);
      await loadDepartments();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Gagal menghapus departemen.");
      setDeletingDepartment(null);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PosisiKompetensiShell>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#d9e2fc] pb-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#16834b]">Master Data</p>
            <h1 className="mt-1 text-2xl font-bold text-[#121b2e]">Tambah Departemen</h1>
            <p className="mt-1 text-sm text-[#4d5f81]">Kelola daftar departemen yang digunakan pada posisi pekerjaan.</p>
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#4d5f81]">
            <Building2 size={17} /> {departments.length} departemen
          </span>
        </div>

        {notice && (
          <div role="status" className="flex items-center gap-2 border border-[#bbf0d2] bg-[#eaf7f0] px-4 py-3 text-sm font-semibold text-[#16834b]">
            <Check size={16} /> {notice}
          </div>
        )}
        {error && (
          <div role="alert" className="border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm font-semibold text-[#b42318]">
            {error}
          </div>
        )}

        <section className="border-b border-[#becabd]/50 pb-6">
          <h2 className="text-sm font-bold text-[#121b2e]">
            {editingDepartment ? "Ubah Departemen" : "Tambah Departemen Baru"}
          </h2>
          <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-xs font-semibold text-[#4d5f81]">
              Nama Departemen
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                placeholder="Contoh: Human Capital & Culture"
                className="mt-1.5 w-full rounded-md border border-[#becabd]/70 bg-white px-3 py-2.5 text-sm text-[#121b2e] outline-none focus:border-[#069494]"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#16834b] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#006838] disabled:opacity-60"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : editingDepartment ? <Check size={16} /> : <Plus size={16} />}
                {editingDepartment ? "Simpan Perubahan" : "Tambah"}
              </button>
              {editingDepartment && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-2 rounded-md border border-[#becabd]/70 px-4 py-2.5 text-sm font-semibold text-[#4d5f81] hover:bg-[#f1f3ff]"
                >
                  <X size={16} /> Batal
                </button>
              )}
            </div>
          </form>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#121b2e]">Daftar Departemen</h2>
            <button
              type="button"
              onClick={() => {
                setError("");
                setIsLoading(true);
                void loadDepartments();
              }}
              disabled={isLoading}
              className="text-xs font-semibold text-[#006838] hover:underline disabled:opacity-50"
            >
              Muat ulang
            </button>
          </div>
          <div className="overflow-hidden rounded-lg border border-[#becabd]/50 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-[#f1f3ff] text-xs uppercase text-[#4d5f81]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Nama Departemen</th>
                    <th className="px-4 py-3 font-bold">Dibuat</th>
                    <th className="px-4 py-3 text-right font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#becabd]/30">
                  {isLoading ? (
                    <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-[#4d5f81]">Memuat departemen...</td></tr>
                  ) : departments.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-10 text-center text-sm text-[#4d5f81]">Belum ada departemen.</td></tr>
                  ) : visibleDepartments.map((department) => (
                    <tr key={department.id} className="hover:bg-[#f7f8ff]">
                      <td className="px-4 py-3 font-semibold text-[#121b2e]">{department.nama_departemen}</td>
                      <td className="px-4 py-3 text-xs text-[#4d5f81]">
                        {department.created_at ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(department.created_at)) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => startEditing(department)}
                            title={`Ubah ${department.nama_departemen}`}
                            aria-label={`Ubah ${department.nama_departemen}`}
                            className="grid size-8 place-items-center rounded text-[#1e3765] hover:bg-[#d9e2fc]"
                          ><Pencil size={15} /></button>
                          <button
                            type="button"
                            onClick={() => setDeletingDepartment(department)}
                            title={`Hapus ${department.nama_departemen}`}
                            aria-label={`Hapus ${department.nama_departemen}`}
                            className="grid size-8 place-items-center rounded text-[#b42318] hover:bg-[#fff1f2]"
                          ><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-[#becabd]/35 px-4 py-3 text-xs text-[#4d5f81] sm:flex-row sm:items-center sm:justify-between">
              <span>Menampilkan <b className="text-[#121b2e]">{departments.length ? (page - 1) * pageSize + 1 : 0}–{Math.min(page * pageSize, departments.length)}</b> dari <b className="text-[#121b2e]">{departments.length}</b> departemen</span>
              {departments.length > 0 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage} pageSize={itemsPerPage} onPageSizeChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }} />}
            </div>
          </div>
        </section>
      </div>

      {deletingDepartment && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f2342]/45 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-department-title" className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <h2 id="delete-department-title" className="text-base font-bold text-[#121b2e]">Hapus departemen?</h2>
            <p className="mt-2 text-sm text-[#4d5f81]">
              Departemen <strong className="text-[#121b2e]">{deletingDepartment.nama_departemen}</strong> akan dihapus. Departemen yang masih digunakan posisi tidak dapat dihapus.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setDeletingDepartment(null)} className="rounded-md px-4 py-2 text-sm font-semibold text-[#4d5f81] hover:bg-[#f1f3ff]">Batal</button>
              <button type="button" onClick={() => void handleDelete()} disabled={isSaving} className="inline-flex items-center gap-2 rounded-md bg-[#b42318] px-4 py-2 text-sm font-bold text-white hover:bg-[#911c14] disabled:opacity-60">
                {isSaving && <Loader2 size={15} className="animate-spin" />} Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </PosisiKompetensiShell>
  );
}
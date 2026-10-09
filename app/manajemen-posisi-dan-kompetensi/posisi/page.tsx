"use client";

import { useState, useMemo, useEffect, FormEvent } from "react";
import { Pagination } from "@/components/Pagination";
import PosisiKompetensiShell, {
  usePosisiKompetensiRole,
} from "@/components/posisi-kompetensi/PosisiKompetensiShell";
import {
  Briefcase,
  CheckCircle2,
  Download,
  Edit2,
  Eye,
  Filter,
  Plus,
  Search,
  Trash2,
  X,
  AlertCircle,
  Building2,
  Award,
  Loader2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import ExportPositionsModal from "@/components/posisi-kompetensi/ExportPositionsModal";

export interface PositionItem {
  id: string;
  nama_posisi?: string;
  name?: string;
  departemen?: string;
  department?: string;
  deskripsi_posisi?: string;
  deskripsi?: string;
  status_posisi?: "Active" | "Inactive";
  status?: string;
  created_at?: string;
  position_code?: string;
  job_code?: string;
  location?: string;
}

function getNamaPosisi(pos: PositionItem) {
  return pos.nama_posisi || pos.name || "";
}
function getDepartemen(pos: PositionItem) {
  return pos.departemen || pos.department || "";
}
function getDeskripsi(pos: PositionItem) {
  return pos.deskripsi_posisi || pos.deskripsi || "";
}
function getStatus(pos: PositionItem): "Active" | "Inactive" {
  return (pos.status_posisi || pos.status || "Active") as "Active" | "Inactive";
}

function getJobCode(pos: PositionItem) {
  return pos.job_code || "";
}

function getLokasi(pos: PositionItem) {
  return pos.location || "";
}

export const DEPARTMENTS = [
  "Finance, Accounting & Tax",
  "Human Capital & Culture",
  "Commercial & Customer Success",
] as const;

function PosisiContent() {
  const { viewRole } = usePosisiKompetensiRole();
  const [positions, setPositions] = useState<PositionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<string>("");

  const hasActiveFilters = Boolean(
    search.trim() !== "" || departmentFilter !== "ALL" || statusFilter !== "ALL"
  );

  const handleResetFilter = () => {
    setSearch("");
    setDepartmentFilter("ALL");
    setStatusFilter("ALL");
    setCurrentPage(1);
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [viewItem, setViewItem] = useState<PositionItem | null>(null);
  const [editItem, setEditItem] = useState<PositionItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [bulkStatusTarget, setBulkStatusTarget] = useState<"Active" | "Inactive" | null>(null);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const fetchPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/d1/positions?limit=100");
      const json = await res.json();
      if (json.success) {
        setPositions(json.data.positions || []);
      } else {
        setError(json.error?.message || "Gagal memuat data posisi.");
      }
    } catch {
      setError("Tidak dapat terhubung ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const filteredPositions = useMemo(() => {
    return positions.filter((pos) => {
      const nama = getNamaPosisi(pos).toLowerCase();
      const kode = getJobCode(pos).toLowerCase();
      const lokasi = getLokasi(pos).toLowerCase();
      const matchSearch =
        !search.trim() ||
        nama.includes(search.toLowerCase()) ||
        kode.includes(search.toLowerCase()) ||
        lokasi.includes(search.toLowerCase());

      const matchDept =
        departmentFilter === "ALL" || getDepartemen(pos) === departmentFilter;
      const matchStatus =
        statusFilter === "ALL" || getStatus(pos) === statusFilter;
      return matchSearch && matchDept && matchStatus;
      
    });
  }, [positions, search, departmentFilter, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, departmentFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPositions.length / 10));
  const page = Math.min(currentPage, totalPages);
  const pagePositions = filteredPositions.slice((page - 1) * 10, page * 10);

  const allPageSelected =
    pagePositions.length > 0 &&
    pagePositions.every((p) => selectedIds.includes(p.id));
  const somePageSelected =
    pagePositions.some((p) => selectedIds.includes(p.id)) && !allPageSelected;

  const handleToggleSelectAllPage = () => {
    const pageIds = pagePositions.map((p) => p.id);
    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectAllFiltered = () => {
    const allFilteredIds = filteredPositions.map((p) => p.id);
    if (selectedIds.length === allFilteredIds.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allFilteredIds);
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCreatePosition = async (body: Record<string, string | undefined>) => {
    try {
      const payload = {
        ...body,
        job_code: body.job_code || `JP-${Math.floor(1000 + Math.random() * 9000)}`,
        lokasi: body.lokasi || "HQ - Menara MTH",
        status_posisi: "Active",
      };

      const res = await fetch("/api/d1/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        await fetchPositions();
        setIsAddOpen(false);
        showNotification(`Posisi "${body.nama_posisi}" berhasil ditambahkan.`);
      } else {
        showNotification(`Error: ${json.error?.message}`);
      }
    } catch {
      showNotification("Gagal menambahkan posisi.");
    }
  };

  const handleUpdatePosition = async (id: string, body: Record<string, string | undefined>) => {
    try {
      const res = await fetch(`/api/d1/positions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        await fetchPositions();
        setEditItem(null);
        showNotification(`Posisi berhasil diperbarui.`);
      } else {
        showNotification(`Error: ${json.error?.message}`);
      }
    } catch {
      showNotification("Gagal memperbarui posisi.");
    }
  };

  const handleDeletePosition = async (id: string) => {
    setIsDeleting(true);
    try {
      const target = positions.find((p) => p.id === id);
      const res = await fetch(`/api/d1/positions/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        await fetchPositions();
        setDeleteId(null);
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        if (target) showNotification(`Posisi "${getNamaPosisi(target)}" berhasil dihapus.`);
      } else {
        showNotification(`Error: ${json.error?.message}`);
      }
    } catch {
      showNotification("Gagal menghapus posisi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/d1/positions/${id}`, { method: "DELETE" })
        )
      );
      await fetchPositions();
      const count = selectedIds.length;
      setSelectedIds([]);
      setIsBulkDeleteOpen(false);
      showNotification(`${count} posisi terpilih berhasil dihapus.`);
    } catch {
      showNotification("Sebagian atau seluruh posisi gagal dihapus.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkUpdateStatus = async (status: "Active" | "Inactive") => {
    setIsBulkUpdating(true);
    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/d1/positions/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status_posisi: status }),
          })
        )
      );
      await fetchPositions();
      const count = selectedIds.length;
      setSelectedIds([]);
      setBulkStatusTarget(null);
      showNotification(
        `Status ${count} posisi terpilih berhasil diubah menjadi ${status}.`
      );
    } catch {
      showNotification("Sebagian atau seluruh status posisi gagal diperbarui.");
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const activeCount = positions.filter((p) => getStatus(p) === "Active").length;
  const deptSet = new Set(positions.map(getDepartemen).filter(Boolean));

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#0f2342] px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <CheckCircle2 size={17} className="text-[#77d8cd]" />
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#d9e2fc] pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#121b2e]">
            Daftar Posisi Pekerjaan 
          </h1>
          <p className="mt-1 text-sm text-[#4d5f81]">
            Kelola data posisi jabatan, struktur departemen, dan tingkat hirarki di PT Andima Transportindo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#becabd]/80 bg-white px-4 py-2.5 text-xs font-semibold text-[#121b2e] shadow-sm transition hover:bg-[#f7f8ff] hover:border-[#1e3765]/40"
          >
            <Download size={15} className="text-[#1e3765]" />
            Download
          </button>
          {viewRole === "manager" ? (
            <button
              onClick={() => setIsAddOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#16834b] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#006838]"
            >
              <Plus size={16} /> Tambah Posisi Baru
            </button>
          ) : (
            <span className="rounded-lg bg-[#f1f3ff] px-3 py-2 text-xs font-semibold text-[#4d5f81]">
              👁️ Mode Baca Saja
            </span>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#becabd]/45 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4d5f81]">Total Posisi</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#f1f3ff] text-[#1e3765]">
              <Briefcase size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#121b2e]">{positions.length}</p>
        </div>
        <div className="rounded-xl border border-[#becabd]/45 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4d5f81]">Posisi Aktif</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#eaf7f0] text-[#16834b]">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#16834b]">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-[#becabd]/45 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4d5f81]">Departemen</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#f1f3ff] text-[#069494]">
              <Building2 size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#121b2e]">{deptSet.size}</p>
        </div>
        <div className="rounded-xl border border-[#becabd]/45 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4d5f81]">Posisi Inaktif</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#fff1f2] text-[#d64545]">
              <Award size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#d64545]">{positions.length - activeCount}</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#becabd]/45 bg-white p-3.5 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Search Input with Dynamic Clear (X) Button */}
        <div className="relative flex-1 min-w-[260px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4d5f81]/70 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama posisi, lokasi..."
            className="w-full rounded-lg border border-[#becabd]/60 bg-[#f7f8ff] py-2 pl-9 pr-8 text-xs font-medium text-[#121b2e] outline-none transition focus:border-[#069494] focus:bg-white placeholder:text-[#4d5f81]/70"
          />
          {search.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full text-[#4d5f81] hover:bg-[#d9e2fc] hover:text-[#121b2e] transition"
              title="Hapus teks pencarian"
              aria-label="Hapus teks pencarian"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Reset Action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Departemen Dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#becabd]/60 bg-[#f7f8ff] px-3 py-2 text-xs text-[#4d5f81] transition focus-within:border-[#069494] focus-within:bg-white">
            <Filter size={13} className="text-[#4d5f81]/80 shrink-0" />
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-semibold text-[#1e3765] outline-none cursor-pointer"
            >
              <option value="ALL">Semua Departemen</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 rounded-lg border border-[#becabd]/60 bg-[#f7f8ff] px-3 py-2 text-xs text-[#4d5f81] transition focus-within:border-[#069494] focus-within:bg-white">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-semibold text-[#1e3765] outline-none cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Reset Filter Button */}
          <button
            type="button"
            onClick={handleResetFilter}
            disabled={!hasActiveFilters}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition ${
              hasActiveFilters
                ? "border-[#d64545]/30 bg-[#fff1f2] text-[#d64545] hover:bg-[#ffe4e6] hover:border-[#d64545]/50 cursor-pointer shadow-sm"
                : "border-[#becabd]/50 bg-[#f7f8ff] text-[#4d5f81]/50 cursor-not-allowed opacity-60"
            }`}
            title={hasActiveFilters ? "Reset semua filter dan pencarian" : "Tidak ada filter aktif"}
          >
            <RotateCcw size={13} />
            Reset Filter
          </button>
        </div>
      </div>

      {/* Multi-Select Action Banner */}
      {selectedIds.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#16834b]/30 bg-[#eaf7f0] px-4 py-3 text-xs text-[#121b2e] shadow-sm">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex size-6 items-center justify-center rounded-full bg-[#16834b] text-white font-bold text-[11px]">
              {selectedIds.length}
            </span>
            <span className="font-semibold text-[#121b2e]">posisi terpilih</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {viewRole === "manager" && (
              <>
                <button
                  type="button"
                  onClick={() => setBulkStatusTarget("Active")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#16834b] px-3 py-1.5 font-bold text-white shadow-sm transition hover:bg-[#006838]"
                  title="Ubah status terpilih menjadi Active"
                >
                  <CheckCircle2 size={13} />
                  Active Status
                </button>
                <button
                  type="button"
                  onClick={() => setBulkStatusTarget("Inactive")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#53657b] px-3 py-1.5 font-bold text-white shadow-sm transition hover:bg-[#394960]"
                  title="Ubah status terpilih menjadi Inactive"
                >
                  <XCircle size={13} />
                  Inactive Status
                </button>
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#d64545] px-3 py-1.5 font-bold text-white shadow-sm transition hover:bg-[#b91c1c]"
                >
                  <Trash2 size={13} />
                  Hapus Terpilih ({selectedIds.length})
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-lg border border-[#becabd]/60 bg-white px-3 py-1.5 font-semibold text-[#4d5f81] hover:bg-[#f7f8ff]"
            >
              Batalkan Pilihan
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[#becabd]/45 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#4d5f81]">
            <Loader2 size={20} className="animate-spin" /> Memuat data posisi...
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#d64545]">
            <AlertCircle size={18} /> {error}
          </div>
        ) : (
          <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#becabd]/35 bg-[#f7f8ff] text-[11px] font-bold uppercase tracking-wider text-[#4d5f81]">
                <tr>
                  <th className="px-4 py-3.5 text-center w-12" title="Pilih Semua di Halaman Ini">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = somePageSelected;
                        }}
                        onChange={handleToggleSelectAllPage}
                        className="size-4 rounded border-[#becabd] text-[#16834b] focus:ring-[#16834b] cursor-pointer accent-[#16834b]"
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3.5 ">Kode / Nama Posisi</th>
                  <th className="px-4 py-3.5">Departemen</th>
                  <th className="px-4 py-3.5 ">Lokasi</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#becabd]/25">
                {pagePositions.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  return (
                    <tr
                      key={item.id}
                      className={`transition ${
                        isSelected ? "bg-[#eaf7f0]/60" : "hover:bg-[#f7f8ff]"
                      }`}
                    >
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleRow(item.id)}
                            className="size-4 rounded border-[#becabd] text-[#16834b] focus:ring-[#16834b] cursor-pointer accent-[#16834b]"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-[#121b2e]">{getNamaPosisi(item)}</p>
                        <p className="text-[10px] text-[#4d5f81]">{getJobCode(item)}</p>
                      </td>
                      <td className="max-w-[240px] truncate px-4 py-3.5 text-[#3f4940]" title={getDepartemen(item)}>
                        {getDepartemen(item)}
                      </td>
                      <td className="px-4 py-3.5 ">
                        <p className="text-[10px] text-[#4d5f81]">{getLokasi(item)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                            getStatus(item) === "Active"
                              ? "border-[#bbf0d2] bg-[#eaf7f0] text-[#16834b]"
                              : "border-[#fecaca] bg-[#fff1f2] text-[#d64545]"
                          }`}
                        >
                          <span className="size-1.5 rounded-full bg-current" />
                          {getStatus(item)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setViewItem(item)}
                            className="rounded p-1.5 text-[#4d5f81] transition hover:bg-[#f1f3ff] hover:text-[#1e3765]"
                            title="Lihat Detail"
                          >
                            <Eye size={15} />
                          </button>
                          {viewRole === "manager" && (
                            <>
                              <button
                                onClick={() => setEditItem(item)}
                                className="rounded p-1.5 text-[#4d5f81] transition hover:bg-[#f1f3ff] hover:text-[#069494]"
                                title="Edit Posisi"
                              >
                                <Edit2 size={15} />
                              </button>
                              <button
                                onClick={() => setDeleteId(item.id)}
                                className="rounded p-1.5 text-[#4d5f81] transition hover:bg-[#fff1f2] hover:text-[#d64545]"
                                title="Hapus Posisi"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredPositions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#4d5f81]">
                      Tidak ada data posisi yang sesuai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-[#becabd]/35 px-4 py-3 text-xs text-[#4d5f81] sm:flex-row sm:items-center sm:justify-between">
            <span>Menampilkan <b className="text-[#121b2e]">{filteredPositions.length ? (page - 1) * 10 + 1 : 0}–{Math.min(page * 10, filteredPositions.length)}</b> dari <b className="text-[#121b2e]">{filteredPositions.length}</b> posisi</span>
            {filteredPositions.length > 0 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage} />}
          </div>
          </>
        )}
      </div>

      {/* Modal: Tambah */}
      {isAddOpen && (
        <PositionFormModal
          title="Tambah Posisi Baru"
          isEdit={false}
          onClose={() => setIsAddOpen(false)}
          onSubmit={(vals) => handleCreatePosition(vals)}
        />
      )}

      {/* Modal: Edit */}
      {editItem && (
        <PositionFormModal
          title="Edit Posisi"
          isEdit={true}
          initialValues={{
            nama_posisi: getNamaPosisi(editItem),
            departemen: getDepartemen(editItem),
            deskripsi: getDeskripsi(editItem),
            status_posisi: getStatus(editItem),
            job_code: getJobCode(editItem),
            lokasi: getLokasi(editItem) || "HQ - Menara MTH",
          }}
          onClose={() => setEditItem(null)}
          onSubmit={(vals) => handleUpdatePosition(editItem.id, vals)}
        />
      )}

      {/* Modal: View Detail */}
      {viewItem && (
        <PositionDetailModal item={viewItem} onClose={() => setViewItem(null)} />
      )}

      {/* Modal: Konfirmasi Hapus Satuan */}
      {deleteId && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f2342]/45 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#d64545]">
              <AlertCircle size={24} />
              <h3 className="text-base font-bold text-[#121b2e]">Konfirmasi Hapus Posisi</h3>
            </div>
            <p className="text-xs text-[#4d5f81] leading-relaxed">
              Apakah Anda yakin ingin menghapus data posisi ini secara permanen? Data yang dihapus tidak dapat dipulihkan kembali.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg px-4 py-2 text-xs font-bold text-[#4d5f81] hover:bg-[#f1f3ff]"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeletePosition(deleteId)}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#d64545] px-4 py-2 text-xs font-bold text-white hover:bg-[#b91c1c] disabled:opacity-50"
              >
                {isDeleting && <Loader2 size={14} className="animate-spin" />}
                Hapus Posisi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Hapus Massal (Bulk Delete) */}
      {isBulkDeleteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f2342]/45 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#d64545]">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#fff1f2] text-[#d64545]">
                <AlertCircle size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#121b2e]">Konfirmasi Hapus Massal</h3>
                <p className="text-xs text-[#4d5f81]">
                  Menghapus <b className="text-[#d64545]">{selectedIds.length} posisi</b> secara permanen.
                </p>
              </div>
            </div>

            {/* List of positions to delete */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#4d5f81]">
                Daftar Posisi yang Dihapus ({selectedIds.length})
              </label>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-[#becabd]/40 bg-[#f7f8ff] p-2 divide-y divide-[#becabd]/20 space-y-1">
                {positions
                  .filter((p) => selectedIds.includes(p.id))
                  .map((pos) => (
                    <div key={pos.id} className="flex items-center justify-between py-1.5 px-2 text-xs">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold text-[#121b2e] truncate">
                          {getNamaPosisi(pos)}
                        </span>
                        <span className="text-[11px] text-[#4d5f81] truncate">
                          {getJobCode(pos) ? `${getJobCode(pos)} • ` : ""}{getDepartemen(pos)}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          getStatus(pos) === "Active"
                            ? "bg-[#eaf7f0] text-[#16834b]"
                            : "bg-[#fff1f2] text-[#d64545]"
                        }`}
                      >
                        <span className="size-1 rounded-full bg-current" />
                        {getStatus(pos)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <p className="text-xs text-[#d64545] font-medium leading-relaxed">
              Apakah Anda yakin ingin menghapus data posisi terpilih di atas? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2fc]">
              <button
                type="button"
                onClick={() => setIsBulkDeleteOpen(false)}
                className="rounded-lg px-4 py-2 text-xs font-bold text-[#4d5f81] hover:bg-[#f1f3ff]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#d64545] px-4 py-2 text-xs font-bold text-white hover:bg-[#b91c1c] disabled:opacity-50"
              >
                {isBulkDeleting && <Loader2 size={14} className="animate-spin" />}
                Hapus {selectedIds.length} Posisi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Ubah Status Massal (Bulk Status Update) */}
      {bulkStatusTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f2342]/45 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                  bulkStatusTarget === "Active"
                    ? "bg-[#eaf7f0] text-[#16834b]"
                    : "bg-[#f1f3ff] text-[#53657b]"
                }`}
              >
                {bulkStatusTarget === "Active" ? (
                  <CheckCircle2 size={22} />
                ) : (
                  <XCircle size={22} />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-[#121b2e]">
                  Konfirmasi Ubah Status ke {bulkStatusTarget}
                </h3>
                <p className="text-xs text-[#4d5f81]">
                  Anda akan mengubah status <b className="text-[#121b2e]">{selectedIds.length} posisi terpilih</b> menjadi{" "}
                  <b className={bulkStatusTarget === "Active" ? "text-[#16834b]" : "text-[#53657b]"}>
                    {bulkStatusTarget}
                  </b>.
                </p>
              </div>
            </div>

            {/* List of positions */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-[#4d5f81]">
                Daftar Posisi Terpilih ({selectedIds.length})
              </label>
              <div className="max-h-52 overflow-y-auto rounded-lg border border-[#becabd]/40 bg-[#f7f8ff] p-2 divide-y divide-[#becabd]/20 space-y-1">
                {positions
                  .filter((p) => selectedIds.includes(p.id))
                  .map((pos) => (
                    <div key={pos.id} className="flex items-center justify-between py-1.5 px-2 text-xs">
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="font-bold text-[#121b2e] truncate">
                          {getNamaPosisi(pos)}
                        </span>
                        <span className="text-[11px] text-[#4d5f81] truncate">
                          {getJobCode(pos) ? `${getJobCode(pos)} • ` : ""}{getDepartemen(pos)}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          getStatus(pos) === "Active"
                            ? "bg-[#eaf7f0] text-[#16834b]"
                            : "bg-[#fff1f2] text-[#d64545]"
                        }`}
                      >
                        <span className="size-1 rounded-full bg-current" />
                        {getStatus(pos)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <p className="text-xs text-[#4d5f81] leading-relaxed">
              Apakah Anda yakin ingin mengubah status seluruh posisi di atas menjadi{" "}
              <b className={bulkStatusTarget === "Active" ? "text-[#16834b]" : "text-[#53657b]"}>
                {bulkStatusTarget}
              </b>?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#d9e2fc]">
              <button
                type="button"
                disabled={isBulkUpdating}
                onClick={() => setBulkStatusTarget(null)}
                className="rounded-lg px-4 py-2 text-xs font-bold text-[#4d5f81] hover:bg-[#f1f3ff] disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleBulkUpdateStatus(bulkStatusTarget)}
                disabled={isBulkUpdating}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 ${
                  bulkStatusTarget === "Active"
                    ? "bg-[#16834b] hover:bg-[#006838]"
                    : "bg-[#53657b] hover:bg-[#394960]"
                }`}
              >
                {isBulkUpdating && <Loader2 size={14} className="animate-spin" />}
                Ya, Ubah ke {bulkStatusTarget}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Export / Download */}
      {isExportOpen && (
        <ExportPositionsModal
          allPositions={positions}
          filteredPositions={filteredPositions}
          onClose={() => setIsExportOpen(false)}
          onSuccessToast={showNotification}
        />
      )}
    </div>
  );
}

function PositionFormModal({
  title,
  isEdit = false,
  initialValues,
  onClose,
  onSubmit,
}: {
  title: string;
  isEdit?: boolean;
  initialValues?: {
    nama_posisi?: string;
    departemen?: string;
    deskripsi?: string;
    job_code?: string;
    status_posisi?: "Active" | "Inactive";
    lokasi?: string;
  };
  onClose: () => void;
  onSubmit: (vals: Record<string, string | undefined>) => void;
}) {
  const [jobCode] = useState(initialValues?.job_code || "");
  const [namaPosisi, setNamaPosisi] = useState(initialValues?.nama_posisi || "");
  const [departemen, setDepartemen] = useState(initialValues?.departemen || DEPARTMENTS[0]);
  const [deskripsi, setDeskripsi] = useState(initialValues?.deskripsi || "");
  const [statusPosisi, setStatusPosisi] = useState<"Active" | "Inactive">(
    initialValues?.status_posisi || "Active"
  );
  const [lokasi] = useState(initialValues?.lokasi || "HQ - Menara MTH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ nama_posisi?: string; deskripsi?: string }>({});

  const validate = () => {
    const errs: { nama_posisi?: string; deskripsi?: string } = {};
    if (!namaPosisi.trim() || namaPosisi.trim().length < 3 || namaPosisi.trim().length > 100) {
      errs.nama_posisi = "Nama posisi wajib diisi antara 3 - 100 karakter.";
    }
    if (deskripsi && deskripsi.length > 500) {
      errs.deskripsi = "Deskripsi tidak boleh melebihi 500 karakter.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    await onSubmit({
      ...(isEdit && jobCode ? { job_code: jobCode } : {}),
      nama_posisi: namaPosisi.trim(),
      departemen,
      deskripsi_posisi: deskripsi.trim() || undefined,
      status_posisi: isEdit ? statusPosisi : "Active",
      lokasi: lokasi || "HQ - Menara MTH",
    });
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f2342]/45 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#d9e2fc] px-6 py-4">
          <h2 className="text-base font-bold text-[#121b2e]">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-[#4d5f81] hover:bg-[#f1f3ff]">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6 text-xs">
          {isEdit && (
            <div>
              <label className="block font-bold text-[#3f4940] mb-1">
                Kode Posisi
              </label>
              <input
                type="text"
                value={jobCode}
                disabled
                className="w-full rounded-lg border border-[#becabd]/60 bg-[#f1f3ff] px-3 py-2.5 text-[#4d5f81] font-semibold cursor-not-allowed outline-none"
              />
            </div>
          )}
          <div>
            <label className="block font-bold text-[#3f4940] mb-1">
              Nama Posisi <span className="text-[#d64545]">*</span>
            </label>
            <input
              type="text"
              value={namaPosisi}
              onChange={(e) => setNamaPosisi(e.target.value)}
              placeholder="Contoh: Financial Analyst"
              className={`w-full rounded-lg border bg-white px-3 py-2.5 outline-none focus:border-[#069494] ${
                errors.nama_posisi ? "border-[#d64545]" : "border-[#becabd]/60"
              }`}
            />
            {errors.nama_posisi && (
              <p className="mt-1 text-[11px] font-semibold text-[#d64545]">{errors.nama_posisi}</p>
            )}
          </div>
          <div>
            <label className="block font-bold text-[#3f4940] mb-1">
              Departemen <span className="text-[#d64545]">*</span>
            </label>
            <select
              value={departemen}
              onChange={(e) => setDepartemen(e.target.value)}
              className="w-full rounded-lg border border-[#becabd]/60 bg-white px-3 py-2.5 outline-none focus:border-[#069494]"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-[#3f4940] mb-1">
              Lokasi
            </label>
            <input
              type="text"
              value={lokasi}
              disabled
              className="w-full rounded-lg border border-[#becabd]/60 bg-[#f1f3ff] px-3 py-2.5 text-[#4d5f81] cursor-not-allowed outline-none font-medium"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-[#3f4940]">Deskripsi Posisi</label>
              <span className="text-[10px] text-[#4d5f81]">{deskripsi.length}/500</span>
            </div>
            <textarea
              value={deskripsi}
              onChange={(e) => setDeskripsi(e.target.value)}
              rows={3}
              placeholder="Jelaskan peran utama dan tanggung jawab posisi..."
              className={`w-full resize-none rounded-lg border bg-white p-3 outline-none focus:border-[#069494] ${
                errors.deskripsi ? "border-[#d64545]" : "border-[#becabd]/60"
              }`}
            />
            {errors.deskripsi && (
              <p className="mt-1 text-[11px] font-semibold text-[#d64545]">{errors.deskripsi}</p>
            )}
          </div>
          {isEdit && (
            <div>
              <label className="block font-bold text-[#3f4940] mb-1">Status Posisi</label>
              <div className="flex gap-4">
                {(["Active", "Inactive"] as const).map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer font-medium text-[#121b2e]">
                    <input
                      type="radio"
                      name="status"
                      value={s}
                      checked={statusPosisi === s}
                      onChange={() => setStatusPosisi(s)}
                      className={s === "Active" ? "accent-[#16834b]" : "accent-[#d64545]"}
                    />
                    {s}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 border-t border-[#d9e2fc] pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-xs font-bold text-[#4d5f81] hover:bg-[#f1f3ff]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[#16834b] px-4 py-2 text-xs font-bold text-white hover:bg-[#006838] disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              Simpan Posisi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PositionDetailModal({ item, onClose }: { item: PositionItem; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f2342]/45 p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden space-y-4">
        <div className="flex items-center justify-between bg-[#1e3765] px-6 py-4 text-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#77d8cd]">Kode Posisi</p>
            <h2 className="text-base font-bold text-white">{getJobCode(item) || "-"}</h2>
          </div>
          <button onClick={onClose} className="rounded p-1 text-[#d9e2fc] hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4 text-xs text-[#3f4940]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d5f81]">Nama Posisi</span>
            <p className="font-bold text-[#121b2e] text-sm">{getNamaPosisi(item) || "-"}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d5f81]">Departemen</span>
            <p className="font-semibold text-[#121b2e]">{getDepartemen(item)}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d5f81]">Lokasi</span>
            <p className="font-semibold text-[#121b2e]">{getLokasi(item) || "-"}</p>
          </div>
          <div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d5f81]">Status</span>
              <div className="mt-1">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                    getStatus(item) === "Active"
                      ? "border-[#bbf0d2] bg-[#eaf7f0] text-[#16834b]"
                      : "border-[#fecaca] bg-[#fff1f2] text-[#d64545]"
                  }`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  {getStatus(item)}
                </span>
              </div>
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d5f81]">Deskripsi Posisi</span>
            <p className="mt-1 leading-relaxed bg-[#f7f8ff] p-3 rounded-lg border border-[#becabd]/35">
              {getDeskripsi(item) || "Tidak ada deskripsi rinci yang tersedia."}
            </p>
          </div>
        </div>
        <div className="bg-[#f7f8ff] px-6 py-3 border-t border-[#d9e2fc] flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#1e3765] px-4 py-2 text-xs font-bold text-white hover:bg-[#0f2342]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PosisiPage() {
  return (
    <PosisiKompetensiShell>
      <PosisiContent />
    </PosisiKompetensiShell>
  );
}

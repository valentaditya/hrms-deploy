"use client";

import { useState, useEffect, useMemo } from "react";
import Pagination, { type PageSize } from "@/components/Pagination";
import PosisiKompetensiShell from "@/components/posisi-kompetensi/PosisiKompetensiShell";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Filter,
  Search,
  Users,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  TrendingUp,
  TrendingDown,
  X,
  Target,
  Sparkles,
  BarChart3,
  SlidersHorizontal,
} from "lucide-react";
import ExportGapModal from "@/components/posisi-kompetensi/ExportGapModal";

export type GapStatusType = "Under Perform" | "Perform" | "Good Perform";

export interface KpiIndicatorItem {
  id: string;
  kpi_name: string;
  target: number;
  weight: number;
  daily_value: number;
  gap: number;
  weighted_score: number;
  status: GapStatusType;
}

export interface GapItem {
  id: string;
  employee_id: string;
  employee_name: string;
  avatar_initials: string;
  position_id: string;
  position_name: string;
  department: string;
  total_weight: number;       // Total Bobot dari Definisi KPI
  kpi_position_score: number; // Nilai KPI Posisi (Real dari Definisi KPI)
  kpi_daily_score: number;    // Nilai KPI Harian
  gap: number;                // Nilai KPI Harian - Nilai KPI Posisi
  status: GapStatusType;      // Under Perform (< 0), Perform (= 0), Good Perform (> 0)
  indicators: KpiIndicatorItem[];
}

interface PositionOption {
  id: string;
  nama_posisi?: string;
  name?: string;
  departemen?: string;
  department?: string;
  status_posisi?: string;
}

interface RawKpiDef {
  id?: string;
  position_id: string;
  kpi_name?: string;
  nama_kpi?: string;
  kpi_target?: string;
  target_kpi?: string;
  kpi_weight?: number;
  bobot_kpi?: number;
}

const SIMULATED_EMPLOYEE_NAMES = [
  "Budi Santoso",
  "Siti Rahmawati",
  "Ahmad Fauzi",
  "Dewi Lestari",
  "Rian Hidayat",
  "Maya Anggraini",
  "Hendro Wijaya",
  "Indah Permata",
  "Bambang Setiawan",
  "Citra Kirana",
  "Dimas Prasetyo",
  "Eka Putri",
  "Fajar Nugraha",
  "Gita Savitri",
  "Hadi Pranoto",
  "Ika Wulandari",
  "Joko Susilo",
  "Kartika Sari",
  "Lukman Hakim",
];

export function calculateGapStatus(gap: number): GapStatusType {
  const rounded = Math.round(gap * 10) / 10;
  if (rounded < 0) return "Under Perform";
  if (rounded === 0) return "Perform";
  return "Good Perform";
}

function getInitials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function StatusBadge({ status }: { status: GapStatusType }) {
  if (status === "Good Perform") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#bbf0d2] bg-[#eaf7f0] px-2.5 py-1 text-[11px] font-bold text-[#16834b]">
        <span className="size-1.5 rounded-full bg-[#16834b]" />
        Good Perform
      </span>
    );
  }
  if (status === "Perform") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#99f6e4] bg-[#e6fffa] px-2.5 py-1 text-[11px] font-bold text-[#069494]">
        <span className="size-1.5 rounded-full bg-[#069494]" />
        Perform
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#fecaca] bg-[#fff1f2] px-2.5 py-1 text-[11px] font-bold text-[#d64545]">
      <span className="size-1.5 rounded-full bg-[#d64545]" />
      Under Perform
    </span>
  );
}

function GapBadge({ gap }: { gap: number }) {
  const isPositive = gap > 0;
  const isZero = gap === 0;

  return (
    <span
      className={`inline-flex items-center justify-center min-w-[42px] px-2 py-0.5 rounded-full font-extrabold text-xs transition ${
        isPositive
          ? "bg-[#eaf7f0] text-[#16834b] border border-[#bbf0d2]"
          : isZero
          ? "bg-[#e6fffa] text-[#069494] border border-[#99f6e4]"
          : "bg-[#fff1f2] text-[#d64545] border border-[#fecaca]"
      }`}
    >
      {isPositive ? `+${gap}` : gap}
    </span>
  );
}

function GapAnalysisContent() {
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [kpiDefinitions, setKpiDefinitions] = useState<RawKpiDef[]>([]);
  const [tableData, setTableData] = useState<GapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<PageSize>(10);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [toast, setToast] = useState<string>("");

  // Modal Detail State (for "Show" Action)
  const [detailItem, setDetailItem] = useState<GapItem | null>(null);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  // Generate dataset strictly for positions that exist in "Definisi KPI & Total Bobot"
  const buildGapDataset = (
    posList: PositionOption[],
    kpis: RawKpiDef[],
    randomSeed = 0
  ): GapItem[] => {
    // 1. Group KPI definitions by position_id
    const kpiByPos: Record<string, RawKpiDef[]> = {};
    for (const kpi of kpis) {
      if (!kpi.position_id) continue;
      if (!kpiByPos[kpi.position_id]) {
        kpiByPos[kpi.position_id] = [];
      }
      kpiByPos[kpi.position_id].push(kpi);
    }

    // 2. Map position id to position data
    const posMap: Record<string, PositionOption> = {};
    for (const pos of posList) {
      posMap[pos.id] = pos;
    }

    // 3. STRICT RULE: Hanya posisi yang terdaftar di "Definisi KPI & Total Bobot" (posKpis.length > 0)
    // Semua yang ada di Definisi KPI dan Total Bobot harus ada di table, jangan yang tidak ada.
    const positionsWithKpi = Object.keys(kpiByPos)
      .map((posId) => {
        const found = posMap[posId];
        return (
          found || {
            id: posId,
            nama_posisi: "Posisi Jabatan",
            departemen: "Operasional",
          }
        );
      })
      .filter((p) => Boolean(p.nama_posisi || p.name));

    const items: GapItem[] = [];

    // Predetermined delta patterns to guarantee a balanced mix of Under Perform, Perform, and Good Perform
    const deltaPatterns = [
      4, -5, 0, 7, -8, 0, -3, 5, 0, -6, 8, 0, 3, -10, 0, 6, -4, 2, 0,
    ];

    positionsWithKpi.forEach((pos, idx) => {
      const posKpis = kpiByPos[pos.id] || [];
      const posName = pos.nama_posisi || pos.name || "Posisi";
      const posDept = pos.departemen || pos.department || "Operasional";

      // Calculate Total Bobot from real KPI definitions
      const totalWeight = posKpis.reduce(
        (sum, k) => sum + Number(k.kpi_weight ?? k.bobot_kpi ?? 0),
        0
      );

      // Calculate Real KPI Position Score (Target) based on weighted average of definitions
      let positionKpiTarget = 85;
      if (posKpis.length > 0) {
        let weightedSum = 0;
        let sumWeights = 0;

        for (const k of posKpis) {
          const rawTarget = parseFloat(k.kpi_target || k.target_kpi || "85");
          const target = Number.isFinite(rawTarget) ? rawTarget : 85;
          const weight = Number(k.kpi_weight ?? k.bobot_kpi ?? 0);
          weightedSum += target * weight;
          sumWeights += weight;
        }

        if (sumWeights > 0) {
          positionKpiTarget = Math.round((weightedSum / sumWeights) * 10) / 10;
        } else {
          const simpleAvg =
            posKpis.reduce(
              (acc, k) =>
                acc + (parseFloat(k.kpi_target || k.target_kpi || "85") || 85),
              0
            ) / posKpis.length;
          positionKpiTarget = Math.round(simpleAvg * 10) / 10;
        }
      }

      // Pick a simulated employee name
      const empName = SIMULATED_EMPLOYEE_NAMES[idx % SIMULATED_EMPLOYEE_NAMES.length];
      const empId = `EMP-${String(101 + idx).padStart(4, "0")}`;

      // Pick intentional delta for gap
      const patternDelta =
        deltaPatterns[(idx + randomSeed) % deltaPatterns.length];

      // Build KPI indicators with simulated daily values
      const indicatorList: KpiIndicatorItem[] = posKpis.map((k, kIdx) => {
        const name = k.kpi_name || k.nama_kpi || `Indikator KPI #${kIdx + 1}`;
        const rawTarget = parseFloat(k.kpi_target || k.target_kpi || "85");
        const target = Number.isFinite(rawTarget) ? rawTarget : positionKpiTarget;
        const weight = Number(k.kpi_weight ?? k.bobot_kpi ?? Math.round(100 / posKpis.length));

        // Slight realistic variation per indicator while remaining anchored to patternDelta
        const indicatorOffset =
          (kIdx % 3 === 0 ? 0 : kIdx % 3 === 1 ? 1 : -1) +
          (patternDelta > 0 ? 1 : patternDelta < 0 ? -1 : 0);

        const indDaily = Math.max(
          40,
          Math.min(100, Math.round(target + patternDelta + (kIdx === 0 ? 0 : indicatorOffset)))
        );
        const indGap = indDaily - target;
        const indWeighted = Math.round((indDaily * (weight / 100)) * 10) / 10;
        const indStatus = calculateGapStatus(indGap);

        return {
          id: k.id || `kpi-${pos.id}-${kIdx}`,
          kpi_name: name,
          target: target,
          weight: weight,
          daily_value: indDaily,
          gap: indGap,
          weighted_score: indWeighted,
          status: indStatus,
        };
      });

      // Compute composite daily score from indicators
      let sumDailyWeighted = 0;
      let sumIndWeights = 0;
      for (const ind of indicatorList) {
        sumDailyWeighted += ind.daily_value * ind.weight;
        sumIndWeights += ind.weight;
      }

      const dailyScore =
        sumIndWeights > 0
          ? Math.round((sumDailyWeighted / sumIndWeights) * 10) / 10
          : Math.max(50, Math.min(100, positionKpiTarget + patternDelta));

      const overallGap = Math.round((dailyScore - positionKpiTarget) * 10) / 10;
      const status = calculateGapStatus(overallGap);

      items.push({
        id: `gap-${empId}-${pos.id}`,
        employee_id: empId,
        employee_name: empName,
        avatar_initials: getInitials(empName),
        position_id: pos.id,
        position_name: posName,
        department: posDept,
        total_weight: totalWeight,
        kpi_position_score: positionKpiTarget,
        kpi_daily_score: dailyScore,
        gap: overallGap,
        status: status,
        indicators: indicatorList,
      });
    });

    return items;
  };

  // Fetch real positions and real KPI definitions on load
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [posRes, kpiRes] = await Promise.all([
        fetch("/api/d1/positions?limit=100"),
        fetch("/api/d1/kpi"),
      ]);

      const posJson = await posRes.json();
      const kpiJson = await kpiRes.json();

      if (!posJson.success) {
        throw new Error(posJson.error?.message || "Gagal memuat posisi.");
      }

      const loadedPositions: PositionOption[] = posJson.data?.positions || [];
      const loadedKpis: RawKpiDef[] = kpiJson.success ? kpiJson.data || [] : [];

      setPositions(loadedPositions);
      setKpiDefinitions(loadedKpis);

      const generated = buildGapDataset(loadedPositions, loadedKpis, 0);
      setTableData(generated);
    } catch (err: any) {
      setError(err?.message || "Gagal memuat data dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Refresh simulated daily values
  const handleRefreshSimulation = () => {
    const seed = Math.floor(Math.random() * 100) + 1;
    const refreshed = buildGapDataset(positions, kpiDefinitions, seed);
    setTableData(refreshed);
    showNotification("Simulasi data harian berhasil diperbarui.");
  };

  const departments = useMemo(
    () =>
      Array.from(
        new Set(
          tableData.map((item) => item.department).filter(Boolean)
        )
      ),
    [tableData]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tableData.filter((item) => {
      const matchSearch =
        !query ||
        item.employee_name.toLowerCase().includes(query) ||
        item.employee_id.toLowerCase().includes(query) ||
        item.position_name.toLowerCase().includes(query) ||
        item.department.toLowerCase().includes(query);

      const matchDept =
        selectedDept === "ALL" || item.department === selectedDept;

      const matchStatus =
        selectedStatus === "ALL" || item.status === selectedStatus;

      return matchSearch && matchDept && matchStatus;
    });
  }, [tableData, search, selectedDept, selectedStatus]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDept, selectedStatus]);

  const pageSize = itemsPerPage === "all" ? Math.max(1, filteredItems.length) : itemsPerPage;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const page = Math.min(currentPage, totalPages);
  const pageItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  // Summary Metrics
  const totalEmployees = filteredItems.length;
  const countGood = filteredItems.filter((i) => i.status === "Good Perform").length;
  const countPerform = filteredItems.filter((i) => i.status === "Perform").length;
  const countUnder = filteredItems.filter((i) => i.status === "Under Perform").length;

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg bg-[#0f2342] px-4 py-3 text-sm font-semibold text-white shadow-xl animate-in fade-in duration-200">
          <CheckCircle2 size={17} className="text-[#77d8cd]" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-[#d9e2fc] pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#121b2e]">
            Analisis Kesenjangan Kinerja KPI (Gap Analysis)
          </h1>
          <p className="mt-1 text-sm text-[#4d5f81]">
            Matriks evaluasi gap capaian harian untuk seluruh posisi yang terdaftar pada menu Definisi KPI & Total Bobot.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefreshSimulation}
            disabled={loading || tableData.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#becabd]/80 bg-white px-3.5 py-2.5 text-xs font-semibold text-[#1e3765] shadow-sm transition hover:bg-[#f7f8ff] hover:border-[#1e3765]/40 disabled:opacity-50"
            title="Acak ulang nilai simulasi KPI harian"
          >
            <RefreshCw size={14} className="text-[#069494]" />
            Simulasi Data Harian
          </button>
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            disabled={loading || tableData.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1e3765] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f2342] disabled:opacity-50"
            title="Download Laporan Gap Analysis"
          >
            <Download size={15} />
            Download Laporan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#becabd]/45 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4d5f81]">Total Posisi / Karyawan</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#f1f3ff] text-[#1e3765]">
              <Users size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#121b2e]">{totalEmployees}</p>
          <p className="mt-0.5 text-[11px] text-[#4d5f81]">Terdaftar di Definisi KPI & Total Bobot</p>
        </div>

        <div className="rounded-xl border border-[#becabd]/45 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4d5f81]">Good Perform (Gap &gt; 0)</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#eaf7f0] text-[#16834b]">
              <TrendingUp size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#16834b]">{countGood}</p>
          <p className="mt-0.5 text-[11px] text-[#16834b]/80">Capaian harian melampaui target posisi</p>
        </div>

        <div className="rounded-xl border border-[#becabd]/45 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4d5f81]">Perform (Gap = 0)</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#e6fffa] text-[#069494]">
              <Target size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#069494]">{countPerform}</p>
          <p className="mt-0.5 text-[11px] text-[#069494]/80">Capaian tepat sesuai target posisi</p>
        </div>

        <div className="rounded-xl border border-[#becabd]/45 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#4d5f81]">Under Perform (Gap &lt; 0)</span>
            <span className="grid size-8 place-items-center rounded-lg bg-[#fff1f2] text-[#d64545]">
              <TrendingDown size={16} />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-[#d64545]">{countUnder}</p>
          <p className="mt-0.5 text-[11px] text-[#d64545]/80">Capaian berada di bawah target posisi</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#becabd]/45 bg-white p-4 shadow-sm md:flex-row md:items-center text-xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-3 text-[#4d5f81]/70" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama karyawan, NIK, posisi kompetensi, atau departemen..."
            className="w-full rounded-lg border border-[#becabd]/60 bg-[#f7f8ff] py-2 pl-9 pr-3 outline-none focus:border-[#069494]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-[#becabd]/60 bg-[#f7f8ff] px-2.5 py-1.5 text-[#4d5f81]">
            <Filter size={14} />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="bg-transparent font-semibold text-[#1e3765] outline-none"
            >
              <option value="ALL">Semua Departemen</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-[#becabd]/60 bg-[#f7f8ff] px-2.5 py-1.5 text-[#4d5f81]">
            <BarChart3 size={14} />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent font-semibold text-[#1e3765] outline-none"
            >
              <option value="ALL">Semua Status</option>
              <option value="Good Perform">Good Perform (Gap &gt; 0)</option>
              <option value="Perform">Perform (Gap = 0)</option>
              <option value="Under Perform">Under Perform (Gap &lt; 0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-[#fff1f2] border border-[#fecaca] px-4 py-3 text-xs font-semibold text-[#d64545]">
          <AlertCircle size={15} /> {error}
        </div>
      )}

      {/* Main Gap Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#becabd]/45 bg-white py-16 text-sm text-[#4d5f81]">
          <Loader2 size={24} className="animate-spin text-[#1e3765]" />
          <p>Memuat data posisi dan definisi KPI...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#becabd]/45 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#becabd]/35 bg-[#f7f8ff] text-[11px] font-bold uppercase tracking-wider text-[#4d5f81]">
                <tr>
                  <th className="px-4 py-3.5">Karyawan</th>
                  <th className="px-4 py-3.5">Posisi Kompetensi</th>
                  <th className="px-4 py-3.5 text-center">Nilai KPI Posisi (Definisi KPI)</th>
                  <th className="px-4 py-3.5 text-center">Nilai KPI Harian</th>
                  <th className="px-4 py-3.5 text-center">Gap</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#becabd]/25">
                {pageItems.map((item) => (
                  <tr key={item.id} className="transition hover:bg-[#f7f8ff]">
                    {/* Karyawan */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1e3765] text-xs font-bold text-white shadow-xs">
                          {item.avatar_initials}
                        </div>
                        <div>
                          <p className="font-bold text-[#121b2e]">{item.employee_name}</p>
                          <p className="text-[10px] text-[#4d5f81]">{item.employee_id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Posisi Kompetensi (Data Real dari Definisi KPI) */}
                    <td className="px-4 py-3.5">
                      <p className="font-bold text-[#1e3765]">{item.position_name}</p>
                      <p className="text-[10px] text-[#4d5f81]">
                        {item.department} · <span className="font-semibold text-[#1e3765]">{item.indicators.length} Indikator KPI ({item.total_weight}%)</span>
                      </p>
                    </td>

                    {/* Nilai KPI Posisi (Data Real dari Definisi KPI) */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-extrabold text-[#1e3765] text-sm">
                        {item.kpi_position_score}
                      </span>
                      <p className="text-[9.5px] text-[#4d5f81]">Definisi KPI ({item.total_weight}%)</p>
                    </td>

                    {/* Nilai KPI Harian */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="font-extrabold text-[#121b2e] text-sm">
                        {item.kpi_daily_score}
                      </span>
                      <p className="text-[9.5px] text-[#4d5f81]">Capaian Harian</p>
                    </td>

                    {/* Gap (Nilai Harian - Nilai Posisi) */}
                    <td className="px-4 py-3.5 text-center">
                      <GapBadge gap={item.gap} />
                    </td>

                    {/* Status (Under Perform, Perform, Good Perform) */}
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={item.status} />
                    </td>

                    {/* Action (Show detail) */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => setDetailItem(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#becabd]/80 bg-white px-3 py-1.5 text-xs font-bold text-[#1e3765] shadow-xs transition hover:bg-[#1e3765] hover:text-white hover:border-[#1e3765]"
                        title="Tampilkan rincian indikator kinerja"
                      >
                        <Eye size={13} />
                        <span>Show</span>
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-[#4d5f81]">
                      Tidak ada data evaluasi gap KPI yang cocok dengan filter atau pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="flex flex-col gap-3 border-t border-[#becabd]/35 px-4 py-3 text-xs text-[#4d5f81] sm:flex-row sm:items-center sm:justify-between">
            <span>
              Menampilkan{" "}
              <b className="text-[#121b2e]">
                {filteredItems.length ? (page - 1) * pageSize + 1 : 0}–
                {Math.min(page * pageSize, filteredItems.length)}
              </b>{" "}
              dari <b className="text-[#121b2e]">{filteredItems.length}</b> data
            </span>
            {filteredItems.length > 0 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={itemsPerPage}
                onPageSizeChange={(size) => { setItemsPerPage(size); setCurrentPage(1); }}
              />
            )}
          </div>
        </div>
      )}

      {/* Show Action Detail Modal */}
      {detailItem && (
        <KpiDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
        />
      )}

      {/* Export / Download Modal */}
      {isExportOpen && (
        <ExportGapModal
          allGaps={tableData}
          filteredGaps={filteredItems}
          onClose={() => setIsExportOpen(false)}
          onSuccessToast={showNotification}
        />
      )}
    </div>
  );
}

// Modal Rincian Indikator Kinerja ("Show" Action)
function KpiDetailModal({
  item,
  onClose,
}: {
  item: GapItem;
  onClose: () => void;
}) {
  const [indicators, setIndicators] = useState<KpiIndicatorItem[]>(item.indicators);
  const [indicatorPage, setIndicatorPage] = useState(1);
  const [indicatorPageSize, setIndicatorPageSize] = useState<PageSize>(10);
  const indicatorPageLength = indicatorPageSize === "all" ? Math.max(1, indicators.length) : indicatorPageSize;
  const indicatorTotalPages = Math.max(1, Math.ceil(indicators.length / indicatorPageLength));
  const resolvedIndicatorPage = Math.min(indicatorPage, indicatorTotalPages);
  const visibleIndicators = indicators.slice(
    (resolvedIndicatorPage - 1) * indicatorPageLength,
    resolvedIndicatorPage * indicatorPageLength
  );

  // Compute live totals if simulated
  const totalTarget = useMemo(() => {
    if (indicators.length === 0) return item.kpi_position_score;
    const weighted = indicators.reduce((acc, ind) => acc + (ind.target * (ind.weight / 100)), 0);
    return Math.round(weighted * 10) / 10;
  }, [indicators, item.kpi_position_score]);

  const totalDaily = useMemo(() => {
    if (indicators.length === 0) return item.kpi_daily_score;
    const weighted = indicators.reduce((acc, ind) => acc + (ind.daily_value * (ind.weight / 100)), 0);
    return Math.round(weighted * 10) / 10;
  }, [indicators, item.kpi_daily_score]);

  const totalWeight = useMemo(() => {
    return indicators.reduce((acc, ind) => acc + ind.weight, 0);
  }, [indicators]);

  const totalGap = Math.round((totalDaily - totalTarget) * 10) / 10;
  const overallStatus = calculateGapStatus(totalGap);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f2342]/55 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#becabd]/40 text-xs">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#d9e2fc] bg-[#0f2342] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-white/10 text-[#77d8cd]">
              <BarChart3 size={19} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">
                  Rincian Indikator Kinerja (KPI Breakdown)
                </h2>
              </div>
              <p className="text-[11px] text-[#d9e2fc]/80 mt-0.5">
                Karyawan: <b>{item.employee_name}</b> ({item.employee_id}) · Posisi: <b>{item.position_name}</b> ({item.department})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#d9e2fc] hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Quick Summary Banner */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[#becabd]/45 bg-[#f7f8ff] p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d5f81]">
                Nilai KPI Posisi (Target)
              </span>
              <p className="mt-1 text-lg font-extrabold text-[#1e3765]">
                {totalTarget}
              </p>
            </div>

            <div className="rounded-xl border border-[#becabd]/45 bg-[#f7f8ff] p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d5f81]">
                Nilai KPI Harian (Aktual)
              </span>
              <p className="mt-1 text-lg font-extrabold text-[#121b2e]">
                {totalDaily}
              </p>
            </div>

            <div className="rounded-xl border border-[#becabd]/45 bg-[#f7f8ff] p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d5f81]">
                Gap Keseluruhan
              </span>
              <div className="mt-1">
                <GapBadge gap={totalGap} />
              </div>
            </div>

            <div className="rounded-xl border border-[#becabd]/45 bg-[#f7f8ff] p-3 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#4d5f81]">
                Status Performa
              </span>
              <div className="mt-1">
                <StatusBadge status={overallStatus} />
              </div>
            </div>
          </div>

          {/* Indicators Table ("di jejerin terus di total") */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-bold text-[#121b2e] flex items-center gap-1.5">
                <Target size={15} className="text-[#069494]" />
                Daftar Lengkap Indikator Kinerja & Capaian Harian:
              </p>
              <span className="text-[11px] text-[#4d5f81]">
                Total {indicators.length} Indikator Kinerja
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#becabd]/45 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#becabd]/35 bg-[#f7f8ff] text-[11px] font-bold uppercase tracking-wider text-[#4d5f81]">
                    <tr>
                      <th className="px-3.5 py-3 text-center">No</th>
                      <th className="px-3.5 py-3">Indikator Kinerja (KPI)</th>
                      <th className="px-3.5 py-3 text-center">Target Posisi</th>
                      <th className="px-3.5 py-3 text-center">Bobot</th>
                      <th className="px-3.5 py-3 text-center">Nilai Harian</th>
                      <th className="px-3.5 py-3 text-center">Gap (Δ)</th>
                      <th className="px-3.5 py-3 text-center">Skor Berbobot</th>
                      <th className="px-3.5 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#becabd]/25">
                    {visibleIndicators.map((ind, idx) => (
                      <tr key={ind.id} className="transition hover:bg-[#f8faff]">
                        <td className="px-3.5 py-3 text-center font-bold text-[#4d5f81]">
                          {(resolvedIndicatorPage - 1) * indicatorPageLength + idx + 1}
                        </td>
                        <td className="px-3.5 py-3">
                          <p className="font-bold text-[#121b2e]">{ind.kpi_name}</p>
                          <p className="text-[10px] text-[#4d5f81]">Indikator capaian kerja harian</p>
                        </td>
                        <td className="px-3.5 py-3 text-center font-semibold text-[#1e3765]">
                          {ind.target}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <span className="inline-flex rounded-md bg-[#f1f3ff] px-2 py-0.5 font-bold text-[#1e3765]">
                            {ind.weight}%
                          </span>
                        </td>
                        <td className="px-3.5 py-3 text-center font-bold text-[#121b2e]">
                          {ind.daily_value}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <GapBadge gap={ind.gap} />
                        </td>
                        <td className="px-3.5 py-3 text-center font-bold text-[#1e3765]">
                          {ind.weighted_score.toFixed(1)}
                        </td>
                        <td className="px-3.5 py-3 text-center">
                          <StatusBadge status={ind.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Total Row di Jejerin & Ditotal */}
                  <tfoot className="border-t-2 border-[#1e3765] bg-[#edf2fb] font-extrabold text-xs text-[#121b2e]">
                    <tr>
                      <td colSpan={2} className="px-3.5 py-3.5 text-[#1e3765] uppercase tracking-wider">
                        TOTAL AKUMULASI / RATA-RATA TERTIMBANG
                      </td>
                      <td className="px-3.5 py-3.5 text-center text-[#1e3765]">
                        {totalTarget}
                      </td>
                      <td className="px-3.5 py-3.5 text-center">
                        <span className="inline-flex rounded-md bg-[#1e3765] px-2 py-0.5 text-white">
                          {totalWeight}%
                        </span>
                      </td>
                      <td className="px-3.5 py-3.5 text-center text-[#121b2e]">
                        {totalDaily}
                      </td>
                      <td className="px-3.5 py-3.5 text-center">
                        <GapBadge gap={totalGap} />
                      </td>
                      <td className="px-3.5 py-3.5 text-center text-[#1e3765]">
                        {totalDaily.toFixed(1)}
                      </td>
                      <td className="px-3.5 py-3.5 text-center">
                        <StatusBadge status={overallStatus} />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {indicators.length > 0 && (
                <div className="flex flex-col gap-3 border-t border-[#becabd]/35 px-3.5 py-3 text-xs text-[#4d5f81] sm:flex-row sm:items-center sm:justify-between">
                  <span>Menampilkan <b className="text-[#121b2e]">{(resolvedIndicatorPage - 1) * indicatorPageLength + 1}–{Math.min(resolvedIndicatorPage * indicatorPageLength, indicators.length)}</b> dari <b className="text-[#121b2e]">{indicators.length}</b> indikator</span>
                  <Pagination
                    currentPage={resolvedIndicatorPage}
                    totalPages={indicatorTotalPages}
                    onPageChange={setIndicatorPage}
                    pageSize={indicatorPageSize}
                    onPageSizeChange={(size) => { setIndicatorPageSize(size); setIndicatorPage(1); }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footnote Explanation */}
          <div className="rounded-xl border border-[#becabd]/40 bg-[#f7f8ff] p-3 text-[11px] leading-relaxed text-[#4d5f81]">
            <p className="font-bold text-[#1e3765] mb-0.5">Catatan Perhitungan Gap & Status KPI:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>
                <b>Nilai Gap (Δ)</b> = Nilai KPI Harian dikurangi Nilai Target Posisi.
              </li>
              <li>
                <b>Under Perform:</b> Gap bernilai negatif (&lt; 0), capaian kerja harian belum mencapai target yang ditetapkan.
              </li>
              <li>
                <b>Perform:</b> Gap bernilai 0, capaian kerja harian tepat memenuhi standar target posisi.
              </li>
              <li>
                <b>Good Perform:</b> Gap bernilai positif (&gt; 0), capaian kerja harian melampaui target posisi.
              </li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#d9e2fc] bg-[#f7f8ff] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#1e3765] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0f2342] transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GapAnalysisPage() {
  return (
    <PosisiKompetensiShell>
      <GapAnalysisContent />
    </PosisiKompetensiShell>
  );
}

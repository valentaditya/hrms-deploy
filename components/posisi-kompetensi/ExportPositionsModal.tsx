"use client";

import { useState } from "react";
import {
  X,
  FileText,
  FileSpreadsheet,
  FileCode,
  Download,
  CheckCircle2,
  Filter,
  ShieldCheck,
} from "lucide-react";
import { PositionItem } from "@/app/manajemen-posisi-dan-kompetensi/posisi/page";
import {
  exportPositionsToCSV,
  exportPositionsToExcel,
  exportPositionsToPDF,
} from "@/utils/exportPositions";

interface ExportPositionsModalProps {
  allPositions: PositionItem[];
  filteredPositions: PositionItem[];
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

type ExportFormat = "pdf" | "excel" | "csv";
type ExportScope = "filtered" | "all";

export default function ExportPositionsModal({
  allPositions,
  filteredPositions,
  onClose,
  onSuccessToast,
}: ExportPositionsModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [scope, setScope] = useState<ExportScope>(
    filteredPositions.length < allPositions.length ? "filtered" : "all"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const targetData = scope === "filtered" ? filteredPositions : allPositions;
  const activeCount = targetData.filter(
    (p) => (p.status_posisi || p.status || "Active") === "Active"
  ).length;

  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      if (selectedFormat === "pdf") {
        exportPositionsToPDF(targetData);
        onSuccessToast?.("File PDF (.pdf) laporan posisi berhasil diunduh.");
      } else if (selectedFormat === "excel") {
        exportPositionsToExcel(targetData, "Laporan_Posisi_Andima");
        onSuccessToast?.("File Excel (.xlsx) laporan posisi berhasil diunduh.");
      } else if (selectedFormat === "csv") {
        exportPositionsToCSV(targetData, "Laporan_Posisi_Andima");
        onSuccessToast?.("File CSV (.csv) data posisi berhasil diunduh.");
      }
      onClose();
    } catch {
      alert("Terjadi kesalahan saat memproses unduhan data.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatOptions = [
    {
      id: "pdf" as ExportFormat,
      title: "Dokumen PDF (Siap Cetak)",
      badge: "Rekomendasi Owner",
      description: "Format laporan eksekutif formal dengan kop resmi PT Andima Transportindo & kolom persetujuan.",
      icon: <FileText size={24} className="text-[#d64545]" />,
      bg: "bg-red-50 border-red-200 text-red-700",
      activeBorder: "border-[#d64545] ring-2 ring-[#d64545]/20 bg-red-50/50",
    },
    {
      id: "excel" as ExportFormat,
      title: "Microsoft Excel (.xlsx)",
      badge: "Lengkap & Terstruktur",
      description: "Tabel spreadsheet format OpenXML (.xlsx) dengan kolom rapi dan ringkasan metrik.",
      icon: <FileSpreadsheet size={24} className="text-[#16834b]" />,
      bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      activeBorder: "border-[#16834b] ring-2 ring-[#16834b]/20 bg-emerald-50/50",
    },
    {
      id: "csv" as ExportFormat,
      title: "File Data CSV (.csv)",
      badge: "Universal",
      description: "Format data mentah berstandar RFC-4180 (UTF-8 BOM), siap untuk analisis atau integrasi data.",
      icon: <FileCode size={24} className="text-[#1e3765]" />,
      bg: "bg-blue-50 border-blue-200 text-blue-700",
      activeBorder: "border-[#1e3765] ring-2 ring-[#1e3765]/20 bg-blue-50/50",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f2342]/45 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-[#becabd]/40">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#d9e2fc] bg-[#f7f8ff] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-lg bg-[#1e3765] text-white">
              <Download size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#121b2e]">Download Laporan Posisi</h2>
              <p className="text-[11px] text-[#4d5f81]">
                Pilih format berkas untuk laporan eksekutif
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#4d5f81] hover:bg-[#e4ebff] hover:text-[#121b2e] transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Format Selection */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4d5f81] mb-2.5">
              1. Pilih Format Berkas
            </label>
            <div className="space-y-2.5">
              {formatOptions.map((fmt) => {
                const isSelected = selectedFormat === fmt.id;
                return (
                  <div
                    key={fmt.id}
                    onClick={() => setSelectedFormat(fmt.id)}
                    className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? fmt.activeBorder
                        : "border-[#becabd]/50 bg-white hover:border-[#becabd] hover:bg-[#fafbff]"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{fmt.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#121b2e] text-xs">
                          {fmt.title}
                        </span>
                        {/* <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${fmt.bg}`}
                        >
                          {fmt.badge}
                        </span> */}
                      </div>
                      <p className="text-[11px] text-[#4d5f81] mt-1 leading-relaxed">
                        {fmt.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scope Selection */}
          {/* <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#4d5f81] mb-2">
              2. Cakupan Data
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setScope("all")}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${
                  scope === "all"
                    ? "border-[#1e3765] bg-[#1e3765]/5 font-bold text-[#1e3765]"
                    : "border-[#becabd]/50 bg-white text-[#4d5f81] hover:bg-[#fafbff]"
                }`}
              >
                <div
                  className={`size-4 rounded-full border grid place-items-center ${
                    scope === "all"
                      ? "border-[#1e3765] bg-[#1e3765] text-white"
                      : "border-[#becabd]"
                  }`}
                >
                  {scope === "all" && <CheckCircle2 size={12} />}
                </div>
                <div>
                  <div className="text-xs">Semua Posisi</div>
                  <div className="text-[10px] text-[#4d5f81]/80 font-normal">
                    {allPositions.length} data posisi
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setScope("filtered")}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition ${
                  scope === "filtered"
                    ? "border-[#1e3765] bg-[#1e3765]/5 font-bold text-[#1e3765]"
                    : "border-[#becabd]/50 bg-white text-[#4d5f81] hover:bg-[#fafbff]"
                }`}
              >
                <div
                  className={`size-4 rounded-full border grid place-items-center ${
                    scope === "filtered"
                      ? "border-[#1e3765] bg-[#1e3765] text-white"
                      : "border-[#becabd]"
                  }`}
                >
                  {scope === "filtered" && <CheckCircle2 size={12} />}
                </div>
                <div>
                  <div className="text-xs flex items-center gap-1">
                    <Filter size={11} /> Data Filter
                  </div>
                  <div className="text-[10px] text-[#4d5f81]/80 font-normal">
                    {filteredPositions.length} data sesuai filter
                  </div>
                </div>
              </button>
            </div>
          </div> */}

          {/* Owner Quick Summary Note */}
          {/* <div className="rounded-xl border border-[#becabd]/40 bg-[#f7f8ff] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#069494] shrink-0" />
              <div>
                <span className="font-bold text-[#121b2e] block">Ringkasan Dokumen</span>
                <span className="text-[10px] text-[#4d5f81]">
                  {targetData.length} Posisi ({activeCount} Aktif, {targetData.length - activeCount} Inaktif)
                </span>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-white border border-[#becabd]/50 text-[#1e3765] px-2.5 py-1 rounded-md">
              PT Andima
            </span>
          </div> */}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-[#d9e2fc] bg-[#f7f8ff] px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-xs font-bold text-[#4d5f81] hover:bg-[#e4ebff] hover:text-[#121b2e] transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={isProcessing || targetData.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1e3765] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0f2342] transition disabled:opacity-50"
          >
            <Download size={15} />
            {isProcessing
              ? "Menyiapkan..."
              : `Download ${selectedFormat.toUpperCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

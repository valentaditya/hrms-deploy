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
import { GapItem } from "@/app/manajemen-posisi-dan-kompetensi/gap-analysis/page";
import {
  exportGapToCSV,
  exportGapToExcel,
  exportGapToPDF,
} from "@/utils/exportGapAnalysis";

interface ExportGapModalProps {
  allGaps: GapItem[];
  filteredGaps: GapItem[];
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

type ExportFormat = "pdf" | "excel" | "csv";
type ExportScope = "filtered" | "all";

export default function ExportGapModal({
  allGaps,
  filteredGaps,
  onClose,
  onSuccessToast,
}: ExportGapModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [scope, setScope] = useState<ExportScope>(
    filteredGaps.length < allGaps.length ? "filtered" : "all"
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const targetData = scope === "filtered" ? filteredGaps : allGaps;
  const totalKompeten = targetData.filter((i) => i.gap >= 0).length;

  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      if (selectedFormat === "pdf") {
        exportGapToPDF(targetData);
        onSuccessToast?.("File PDF (.pdf) gap analysis berhasil diunduh.");
      } else if (selectedFormat === "excel") {
        exportGapToExcel(targetData, "Laporan_Gap_Kompetensi_Andima");
        onSuccessToast?.("File Excel (.xlsx) gap analysis berhasil diunduh.");
      } else if (selectedFormat === "csv") {
        exportGapToCSV(targetData, "Laporan_Gap_Kompetensi_Andima");
        onSuccessToast?.("File CSV (.csv) gap analysis berhasil diunduh.");
      }
      onClose();
    } catch {
      alert("Terjadi kesalahan saat memproses unduhan analisis kesenjangan.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatOptions = [
    {
      id: "pdf" as ExportFormat,
      title: "Dokumen PDF (Siap Cetak)",
      badge: "Rekomendasi Owner",
      description: "Format landscape eksekutif formal dengan kop resmi PT Andima Transportindo, matriks gap, dan rekomendasi.",
      icon: <FileText size={24} className="text-[#d64545]" />,
      bg: "bg-red-50 border-red-200 text-red-700",
      activeBorder: "border-[#d64545] ring-2 ring-[#d64545]/20 bg-red-50/50",
    },
    {
      id: "excel" as ExportFormat,
      title: "Microsoft Excel (.xlsx)",
      badge: "Lengkap & Terstruktur",
      description: "Tabel spreadsheet OpenXML (.xlsx) dengan kolom standar, level aktual, selisih gap, dan tindak lanjut.",
      icon: <FileSpreadsheet size={24} className="text-[#16834b]" />,
      bg: "bg-emerald-50 border-emerald-200 text-emerald-700",
      activeBorder: "border-[#16834b] ring-2 ring-[#16834b]/20 bg-emerald-50/50",
    },
    {
      id: "csv" as ExportFormat,
      title: "File Data CSV (.csv)",
      badge: "Universal",
      description: "Format data teks terpisah koma (RFC-4180 UTF-8 BOM) untuk analisis spreadsheet atau integrasi HCIS.",
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
              <h2 className="text-sm font-bold text-[#121b2e]">Download Laporan Gap Analysis</h2>
              <p className="text-[11px] text-[#4d5f81]">
                Pilih format berkas untuk laporan kesenjangan kompetensi
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
                        <span
                          className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${fmt.bg}`}
                        >
                          {fmt.badge}
                        </span>
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

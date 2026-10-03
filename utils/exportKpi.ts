import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { PositionKpiGroup, KpiRow } from "@/app/manajemen-posisi-dan-kompetensi/kpi/page";

function getFormattedDate() {
  const now = new Date();
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(now);
}

function getShortDate() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export interface FlattenedKpiItem {
  no: number;
  position_id: string;
  positionName: string;
  department: string;
  kpi_name: string;
  kpi_target: string;
  kpi_weight: number;
}

function flattenKpiData(groups: PositionKpiGroup[]): FlattenedKpiItem[] {
  const items: FlattenedKpiItem[] = [];
  let no = 1;
  groups.forEach((g) => {
    g.kpis.forEach((k: KpiRow) => {
      items.push({
        no: no++,
        position_id: g.position_id,
        positionName: g.positionName,
        department: g.department,
        kpi_name: k.kpi_name || k.nama_kpi || "-",
        kpi_target: k.kpi_target || k.target_kpi || "-",
        kpi_weight: Number(k.kpi_weight ?? k.bobot_kpi ?? 0),
      });
    });
  });
  return items;
}

/**
 * 1. Export KPI as CSV (RFC-4180 with UTF-8 BOM)
 */
export function exportKpiToCSV(groups: PositionKpiGroup[], filenamePrefix = "Laporan_Definisi_KPI_Andima") {
  const flattened = flattenKpiData(groups);
  const headers = ["No", "Nama Posisi", "Departemen", "Nama KPI / Indikator", "Target KPI", "Bobot (%)"];

  const escapeCSV = (value: string | number | undefined | null) => {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const rows = flattened.map((item) => [
    item.no,
    escapeCSV(item.positionName),
    escapeCSV(item.department),
    escapeCSV(item.kpi_name),
    escapeCSV(item.kpi_target),
    item.kpi_weight,
  ]);

  const csvContent = "\uFEFF" + [
    headers.join(","),
    ...rows.map((r) => r.join(",")),
  ].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filenamePrefix}_${getShortDate()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 2. Export KPI as Microsoft Excel (.xlsx)
 */
export function exportKpiToExcel(groups: PositionKpiGroup[], filenamePrefix = "Laporan_Definisi_KPI_Andima") {
  const flattened = flattenKpiData(groups);
  const totalKpi = flattened.length;
  const deptCount = new Set(groups.map((g) => g.department).filter(Boolean)).size;

  const worksheetData: (string | number)[][] = [
    ["PT ANDIMA TRANSPORTINDO"],
    ["LAPORAN DEFINISI KPI & BOBOT INDIKATOR KINERJA POSISI"],
    [`Dicetak pada: ${getFormattedDate()} | Dokumen Internal Manajemen`],
    [],
    ["Ringkasan Eksekutif:"],
    ["Total Posisi Terdefinisi", groups.length, "Total Indikator KPI", totalKpi, "Total Departemen", deptCount],
    [],
    ["No", "Nama Posisi", "Departemen", "Indikator / Nama KPI", "Target Kinerja", "Bobot (%)"],
  ];

  flattened.forEach((item) => {
    worksheetData.push([
      item.no,
      item.positionName,
      item.department,
      item.kpi_name,
      item.kpi_target,
      `${item.kpi_weight}%`,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  worksheet["!cols"] = [
    { wch: 6 },   // No
    { wch: 30 },  // Nama Posisi
    { wch: 42 },  // Departemen
    { wch: 38 },  // Nama KPI
    { wch: 32 },  // Target Kinerja
    { wch: 14 },  // Bobot (%)
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Definisi KPI");

  XLSX.writeFile(workbook, `${filenamePrefix}_${getShortDate()}.xlsx`);
}

/**
 * 3. Export KPI as PDF (.pdf) directly
 */
export function exportKpiToPDF(groups: PositionKpiGroup[], filenamePrefix = "Laporan_Definisi_KPI_Andima") {
  const flattened = flattenKpiData(groups);
  const totalKpi = flattened.length;
  const deptCount = new Set(groups.map((g) => g.department).filter(Boolean)).size;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Left Bar Accent
  doc.setFillColor(30, 55, 101); // #1E3765
  doc.rect(14, 12, 3.5, 18, "F");

  // Company Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(30, 55, 101);
  doc.text("PT ANDIMA TRANSPORTINDO", 21, 17);

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Human Resource & Capital Management System", 21, 22.5);
  doc.text("Dokumen Resmi • Laporan Definisi KPI & Indikator Kinerja", 21, 27);

  // Header Right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 55, 101);
  doc.text("EXECUTIVE REPORT", pageWidth - 14, 17, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak: ${getFormattedDate()}`, pageWidth - 14, 23, { align: "right" });

  // Divider Line
  doc.setDrawColor(217, 226, 252);
  doc.setLineWidth(0.4);
  doc.line(14, 33, pageWidth - 14, 33);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(18, 27, 46);
  doc.text("Laporan Definisi KPI Berdasarkan Posisi Jabatan", 14, 40);

  // KPI Summary Cards
  const cardY = 44;
  const cardWidth = (pageWidth - 28 - 6) / 3;
  const cardHeight = 13;

  const metrics = [
    { label: "TOTAL POSISI TERDEFINISI", value: String(groups.length), color: [18, 27, 46] },
    { label: "TOTAL INDIKATOR KPI", value: String(totalKpi), color: [22, 131, 75] },
    { label: "DEPARTEMEN", value: String(deptCount), color: [6, 148, 148] },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * (cardWidth + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label, x + 3, cardY + 4);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.value, x + 3, cardY + 10.5);
  });

  const tableRows = flattened.map((item) => [
    item.no,
    item.positionName,
    item.department,
    item.kpi_name,
    item.kpi_target,
    `${item.kpi_weight}%`,
  ]);

  autoTable(doc, {
    startY: 61,
    head: [["No", "Nama Posisi", "Departemen", "Indikator / Nama KPI", "Target Kinerja", "Bobot"]],
    body: tableRows,
    theme: "grid",
    headStyles: {
      fillColor: [30, 55, 101],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "left",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [18, 27, 46],
      cellPadding: 2.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: "center" },
      1: { cellWidth: 36, fontStyle: "bold" },
      2: { cellWidth: 42 },
      3: { cellWidth: 40 },
      4: { cellWidth: 38 },
      5: { cellWidth: 15, halign: "center", fontStyle: "bold" },
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  // @ts-expect-error autoTable adds lastAutoTable to doc
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 180;
  const pageHeight = doc.internal.pageSize.getHeight();

  let sigY = finalY + 12;
  if (sigY + 30 > pageHeight - 15) {
    doc.addPage();
    sigY = 20;
  }

  const sigBoxWidth = 55;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(77, 95, 129);
  doc.text("Disiapkan Oleh,", 20, sigY);
  doc.setDrawColor(180, 190, 205);
  doc.line(20, sigY + 16, 20 + sigBoxWidth, sigY + 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 27, 46);
  doc.text("Human Capital Department", 20, sigY + 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(77, 95, 129);
  doc.text("Mengetahui & Menyetujui,", pageWidth - 20 - sigBoxWidth, sigY);
  doc.setDrawColor(180, 190, 205);
  doc.line(pageWidth - 20 - sigBoxWidth, sigY + 16, pageWidth - 20, sigY + 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 27, 46);
  doc.text("Direksi / Executive Owner", pageWidth - 20 - sigBoxWidth, sigY + 20);

  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `PT Andima Transportindo • Halaman ${i} dari ${totalPages}`,
      14,
      pageHeight - 8
    );
    doc.text("Dokumen Resmi", pageWidth - 14, pageHeight - 8, { align: "right" });
  }

  doc.save(`${filenamePrefix}_${getShortDate()}.pdf`);
}

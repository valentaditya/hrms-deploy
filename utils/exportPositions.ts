/**
 * Export utilities for Position & Competency Management
 * Tailored for Owner / Executive Reporting
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { PositionItem } from "@/app/manajemen-posisi-dan-kompetensi/posisi/page";

function getNamaPosisi(pos: PositionItem) {
  return pos.nama_posisi || pos.name || "-";
}

function getDepartemen(pos: PositionItem) {
  return pos.departemen || pos.department || "-";
}

function getDeskripsi(pos: PositionItem) {
  return pos.deskripsi_posisi || pos.deskripsi || "-";
}

function getStatus(pos: PositionItem): "Active" | "Inactive" {
  return (pos.status_posisi || pos.status || "Active") as "Active" | "Inactive";
}

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

/**
 * 1. Export as CSV (RFC-4180 with UTF-8 BOM for Microsoft Excel compatibility)
 */
export function exportPositionsToCSV(data: PositionItem[], filenamePrefix = "Laporan_Posisi_Andima") {
  const headers = ["No", "Kode Posisi", "Nama Posisi", "Departemen", "Status", "Deskripsi Posisi"];

  const escapeCSV = (value: string | undefined | null) => {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const rows = data.map((pos, index) => [
    index + 1,
    escapeCSV(pos.position_code || pos.id),
    escapeCSV(getNamaPosisi(pos)),
    escapeCSV(getDepartemen(pos)),
    escapeCSV(getStatus(pos)),
    escapeCSV(getDeskripsi(pos)),
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
 * 2. Export as genuine Microsoft Excel (.xlsx) using SheetJS XLSX
 */
export function exportPositionsToExcel(data: PositionItem[], filenamePrefix = "Laporan_Posisi_Andima") {
  const activeCount = data.filter((p) => getStatus(p) === "Active").length;
  const deptCount = new Set(data.map(getDepartemen).filter(Boolean)).size;

  const worksheetData: (string | number)[][] = [
    ["PT ANDIMA TRANSPORTINDO"],
    ["LAPORAN EKSEKUTIF DAFTAR STRUKTUR POSISI DAN JABATAN"],
    [`Dicetak pada: ${getFormattedDate()} | Dokumen Internal Manajemen`],
    [],
    ["Ringkasan Eksekutif:"],
    ["Total Posisi", data.length, "Posisi Aktif", activeCount, "Total Departemen", deptCount],
    [],
    ["No", "Kode Posisi", "Nama Posisi", "Departemen", "Status", "Deskripsi Posisi"],
  ];

  data.forEach((pos, idx) => {
    worksheetData.push([
      idx + 1,
      pos.position_code || pos.id || "-",
      getNamaPosisi(pos),
      getDepartemen(pos),
      getStatus(pos),
      getDeskripsi(pos),
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Column width settings
  worksheet["!cols"] = [
    { wch: 6 },   // No
    { wch: 18 },  // Kode Posisi
    { wch: 32 },  // Nama Posisi
    { wch: 45 },  // Departemen
    { wch: 14 },  // Status
    { wch: 55 },  // Deskripsi Posisi
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Posisi");

  XLSX.writeFile(workbook, `${filenamePrefix}_${getShortDate()}.xlsx`);
}

/**
 * 3. Export as PDF (.pdf) file directly using jsPDF + autoTable
 */
export function exportPositionsToPDF(data: PositionItem[], filenamePrefix = "Laporan_Posisi_Andima") {
  const activeCount = data.filter((p) => getStatus(p) === "Active").length;
  const inactiveCount = data.length - activeCount;
  const deptCount = new Set(data.map(getDepartemen).filter(Boolean)).size;

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

  // Company Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("Human Resource & Capital Management System", 21, 22.5);
  doc.text("Dokumen Resmi & Terbatas • Executive Owner Report", 21, 27);

  // Header Right Metadata
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

  // Report Section Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(18, 27, 46);
  doc.text("Laporan Struktur & Daftar Posisi Jabatan", 14, 40);

  // Summary Cards
  const cardY = 44;
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cardHeight = 13;

  const metrics = [
    { label: "TOTAL POSISI", value: String(data.length), color: [18, 27, 46] },
    { label: "POSISI AKTIF", value: String(activeCount), color: [22, 131, 75] },
    { label: "POSISI NON-AKTIF", value: String(inactiveCount), color: [214, 69, 69] },
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

  // Table Data
  const tableRows = data.map((pos, idx) => [
    idx + 1,
    pos.position_code || pos.id || "-",
    getNamaPosisi(pos),
    getDepartemen(pos),
    getStatus(pos),
    getDeskripsi(pos),
  ]);

  autoTable(doc, {
    startY: 61,
    head: [["No", "Kode Posisi", "Nama Posisi", "Departemen", "Status", "Deskripsi Posisi"]],
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
      1: { cellWidth: 26 },
      2: { cellWidth: 38, fontStyle: "bold" },
      3: { cellWidth: 42 },
      4: { cellWidth: 18, halign: "center" },
      5: { cellWidth: "auto" },
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === "body" && dataCell.column.index === 4) {
        const val = dataCell.cell.raw;
        if (val === "Active") {
          dataCell.cell.styles.textColor = [22, 131, 75];
          dataCell.cell.styles.fontStyle = "bold";
        } else {
          dataCell.cell.styles.textColor = [214, 69, 69];
          dataCell.cell.styles.fontStyle = "bold";
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  // Signature Block & Footer
  // @ts-expect-error autoTable adds lastAutoTable to doc
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : 180;
  const pageHeight = doc.internal.pageSize.getHeight();

  let sigY = finalY + 12;
  if (sigY + 30 > pageHeight - 15) {
    doc.addPage();
    sigY = 20;
  }

  const sigBoxWidth = 55;
  // Left Sig
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(77, 95, 129);
  doc.text("Disiapkan Oleh,", 20, sigY);
  doc.setDrawColor(180, 190, 205);
  doc.line(20, sigY + 16, 20 + sigBoxWidth, sigY + 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 27, 46);
  doc.text("Human Capital Department", 20, sigY + 20);

  // Right Sig
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(77, 95, 129);
  doc.text("Mengetahui & Menyetujui,", pageWidth - 20 - sigBoxWidth, sigY);
  doc.setDrawColor(180, 190, 205);
  doc.line(pageWidth - 20 - sigBoxWidth, sigY + 16, pageWidth - 20, sigY + 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 27, 46);
  doc.text("Direksi / Executive Owner", pageWidth - 20 - sigBoxWidth, sigY + 20);

  // Page Numbers on all pages
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

  // Save file directly
  doc.save(`${filenamePrefix}_${getShortDate()}.pdf`);
}

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { GapItem } from "@/app/manajemen-posisi-dan-kompetensi/gap-analysis/page";

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
 * 1. Export Gap Analysis as CSV (RFC-4180 with UTF-8 BOM)
 */
export function exportGapToCSV(data: GapItem[], filenamePrefix = "Laporan_Gap_Kompetensi_Andima") {
  const headers = [
    "No",
    "ID Karyawan",
    "Nama Karyawan",
    "Posisi Target",
    "Nama Kompetensi",
    "Kategori",
    "Standar (Required)",
    "Aktual (Current)",
    "Gap",
    "Status Gap",
    "Rekomendasi Tindakan",
  ];

  const escapeCSV = (value: string | number | undefined | null) => {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value).replace(/"/g, '""');
    return `"${stringValue}"`;
  };

  const rows = data.map((item, idx) => [
    idx + 1,
    escapeCSV(item.employee_id),
    escapeCSV(item.employee_name),
    escapeCSV(item.position_name),
    escapeCSV(item.competency_name),
    escapeCSV(item.category),
    item.level_required,
    item.level_current,
    item.gap,
    escapeCSV(item.gap_status),
    escapeCSV(item.recommendation),
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
 * 2. Export Gap Analysis as Microsoft Excel (.xlsx)
 */
export function exportGapToExcel(data: GapItem[], filenamePrefix = "Laporan_Gap_Kompetensi_Andima") {
  const totalKompeten = data.filter((i) => i.gap >= 0).length;
  const totalSedang = data.filter((i) => i.gap === -1).length;
  const totalSignifikan = data.filter((i) => i.gap <= -2).length;

  const worksheetData: (string | number)[][] = [
    ["PT ANDIMA TRANSPORTINDO"],
    ["LAPORAN MATRIKS ANALISIS KESENJANGAN KOMPETENSI (GAP ANALYSIS)"],
    [`Dicetak pada: ${getFormattedDate()} | Dokumen Internal Manajemen`],
    [],
    ["Ringkasan Eksekutif:"],
    [
      "Total Matriks",
      data.length,
      "Kompeten (Gap >= 0)",
      totalKompeten,
      "Gap Sedang (Gap = -1)",
      totalSedang,
      "Gap Signifikan (Gap <= -2)",
      totalSignifikan,
    ],
    [],
    [
      "No",
      "Nama Karyawan",
      "Posisi Target",
      "Kompetensi",
      "Kategori",
      "Standar (Req)",
      "Aktual (Cur)",
      "Gap",
      "Status",
      "Rekomendasi Tindak Lanjut",
    ],
  ];

  data.forEach((item, idx) => {
    worksheetData.push([
      idx + 1,
      item.employee_name,
      item.position_name,
      item.competency_name,
      item.category,
      item.level_required,
      item.level_current,
      item.gap,
      item.gap_status,
      item.recommendation,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  worksheet["!cols"] = [
    { wch: 6 },   // No
    { wch: 22 },  // Karyawan
    { wch: 28 },  // Posisi
    { wch: 30 },  // Kompetensi
    { wch: 16 },  // Kategori
    { wch: 14 },  // Standar
    { wch: 14 },  // Aktual
    { wch: 8 },   // Gap
    { wch: 16 },  // Status
    { wch: 45 },  // Rekomendasi
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Gap Analysis");

  XLSX.writeFile(workbook, `${filenamePrefix}_${getShortDate()}.xlsx`);
}

/**
 * 3. Export Gap Analysis as PDF (.pdf) directly
 */
export function exportGapToPDF(data: GapItem[], filenamePrefix = "Laporan_Gap_Kompetensi_Andima") {
  const totalKompeten = data.filter((i) => i.gap >= 0).length;
  const totalSedang = data.filter((i) => i.gap === -1).length;
  const totalSignifikan = data.filter((i) => i.gap <= -2).length;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Left Bar Accent
  doc.setFillColor(30, 55, 101);
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
  doc.text("Laporan Analisis Kesenjangan Kompetensi • Executive Owner Report", 21, 27);

  // Header Right
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(30, 55, 101);
  doc.text("EXECUTIVE REPORT", pageWidth - 14, 17, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dicetak: ${getFormattedDate()}`, pageWidth - 14, 23, { align: "right" });

  // Divider
  doc.setDrawColor(217, 226, 252);
  doc.setLineWidth(0.4);
  doc.line(14, 33, pageWidth - 14, 33);

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(18, 27, 46);
  doc.text("Matriks Hasil Evaluasi & Gap Analysis Kompetensi Karyawan", 14, 40);

  // Summary Cards
  const cardY = 44;
  const cardWidth = (pageWidth - 28 - 9) / 4;
  const cardHeight = 13;

  const metrics = [
    { label: "TOTAL MATRIKS", value: String(data.length), color: [18, 27, 46] },
    { label: "KOMPETEN (GAP >= 0)", value: String(totalKompeten), color: [22, 131, 75] },
    { label: "GAP SEDANG (GAP -1)", value: String(totalSedang), color: [183, 121, 31] },
    { label: "GAP SIGNIFIKAN (<= -2)", value: String(totalSignifikan), color: [214, 69, 69] },
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

  const tableRows = data.map((item, idx) => [
    idx + 1,
    item.employee_name,
    item.position_name,
    item.competency_name,
    item.category,
    item.level_required,
    item.level_current,
    item.gap >= 0 ? `+${item.gap}` : String(item.gap),
    item.gap_status,
    item.recommendation,
  ]);

  autoTable(doc, {
    startY: 61,
    head: [
      [
        "No",
        "Nama Karyawan",
        "Posisi Target",
        "Kompetensi",
        "Kategori",
        "Req",
        "Cur",
        "Gap",
        "Status",
        "Rekomendasi",
      ],
    ],
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
      1: { cellWidth: 32, fontStyle: "bold" },
      2: { cellWidth: 35 },
      3: { cellWidth: 38 },
      4: { cellWidth: 20 },
      5: { cellWidth: 12, halign: "center" },
      6: { cellWidth: 12, halign: "center" },
      7: { cellWidth: 12, halign: "center", fontStyle: "bold" },
      8: { cellWidth: 24, halign: "center" },
      9: { cellWidth: "auto" },
    },
    didParseCell: (dataCell) => {
      if (dataCell.section === "body" && dataCell.column.index === 7) {
        const rawVal = Number(dataCell.cell.raw);
        if (rawVal >= 0) {
          dataCell.cell.styles.textColor = [22, 131, 75];
        } else if (rawVal === -1) {
          dataCell.cell.styles.textColor = [183, 121, 31];
        } else {
          dataCell.cell.styles.textColor = [214, 69, 69];
        }
      }
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

  const sigBoxWidth = 60;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(77, 95, 129);
  doc.text("Disiapkan Oleh,", 20, sigY);
  doc.setDrawColor(180, 190, 205);
  doc.line(20, sigY + 16, 20 + sigBoxWidth, sigY + 16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(18, 27, 46);
  doc.text("Assessor / HC Department", 20, sigY + 20);

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

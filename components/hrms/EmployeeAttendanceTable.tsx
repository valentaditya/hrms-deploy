"use client";

import { useState } from "react";
import Pagination from "@/components/Pagination";
import HrmsStatusPill from "@/components/hrms/HrmsStatusPill";
import type { EmployeeAttendance } from "@/types/employee";

const ITEMS_PER_PAGE = 10;

function formatDate(value: string | null) {
  if (!value) return "Belum tersedia";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) return "Belum tersedia";
  return value.match(/(\d{2}:\d{2})/)?.[1] ?? value;
}

export default function EmployeeAttendanceTable({ attendances }: { attendances: EmployeeAttendance[] }) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(attendances.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const pageAttendances = attendances.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="overflow-hidden rounded-lg border border-[#D9E2FC]/70">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-[#D9E2FC] text-xs font-bold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-3">Date</th>
              <th className="px-3 py-3">Clock In</th>
              <th className="px-3 py-3">Clock Out</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D9E2FC]/60 text-slate-700">
            {pageAttendances.map((attendance, index) => (
              <tr key={`${attendance.date ?? "attendance"}-${(page - 1) * ITEMS_PER_PAGE + index}`}>
                <td className="px-3 py-3 font-medium">{formatDate(attendance.date)}</td>
                <td className="px-3 py-3">{formatTime(attendance.clock_in)}</td>
                <td className="px-3 py-3">{formatTime(attendance.clock_out)}</td>
                <td className="px-3 py-3"><HrmsStatusPill value={attendance.status} /></td>
                <td className="px-3 py-3">{attendance.notes || "Belum tersedia"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 border-t border-[#D9E2FC]/70 px-3 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Menampilkan <b className="text-[#121B2E]">{(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, attendances.length)}</b> dari <b className="text-[#121B2E]">{attendances.length}</b> data</span>
        {attendances.length > 0 && <Pagination currentPage={page} totalPages={totalPages} onPageChange={setCurrentPage} />}
      </div>
    </div>
  );
}
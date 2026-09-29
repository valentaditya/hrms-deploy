"use client";

import React, { useState } from "react";
import Pagination from "./Pagination";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  width?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface CustomTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string | number;
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectChange?: (selectedIds: (string | number)[]) => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  showPagination?: boolean;
  className?: string;
}

function formatCellValue(value: unknown): React.ReactNode {
  if (typeof value === "string" || typeof value === "number") return value;
  return "-";
}

export function CustomTable<T extends { id?: string | number }>({
  columns,
  data,
  keyExtractor = (item, index) => item.id ?? index,
  selectable = false,
  selectedIds = [],
  onSelectChange,
  currentPage = 1,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  showPagination = true,
  className = "",
}: CustomTableProps<T>) {
  const [internalSelected, setInternalSelected] = useState<(string | number)[]>(selectedIds);
  const resolvedTotalItems = totalItems ?? data.length;
  const pageSize = Math.max(1, itemsPerPage);
  const resolvedTotalPages = totalPages ?? Math.max(1, Math.ceil(resolvedTotalItems / pageSize));
  const resolvedCurrentPage = Math.min(Math.max(1, currentPage), resolvedTotalPages);
  const pageStart = (resolvedCurrentPage - 1) * pageSize;
  const pageData = data.slice(pageStart, pageStart + pageSize);
  const currentSelected = onSelectChange ? selectedIds : internalSelected;
  const pageIds = pageData.map((item, index) => keyExtractor(item, pageStart + index));

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.checked
      ? [...new Set([...currentSelected, ...pageIds])]
      : currentSelected.filter((id) => !pageIds.includes(id));

    if (onSelectChange) onSelectChange(next);
    else setInternalSelected(next);
  };

  const handleSelectRow = (id: string | number) => {
    const next = currentSelected.includes(id)
      ? currentSelected.filter((item) => item !== id)
      : [...currentSelected, id];

    if (onSelectChange) onSelectChange(next);
    else setInternalSelected(next);
  };

  const isAllSelected = pageIds.length > 0 && pageIds.every((id) => currentSelected.includes(id));

  return (
    <div className={`w-full bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden font-sans ${className}`}>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-slate-200">
              {selectable && (
                <th className="w-12 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded text-[#0F172A] accent-[#0F172A] cursor-pointer"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width }}
                  className={`px-5 py-3.5 text-xs font-bold text-slate-600 uppercase tracking-wider ${
                    column.align === "center"
                      ? "text-center"
                      : column.align === "right"
                        ? "text-right"
                        : "text-left"
                  }`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-6 py-10 text-center text-slate-400 font-medium">
                  Tidak ada data ditemukan
                </td>
              </tr>
            ) : (
              pageData.map((row, index) => {
                const id = keyExtractor(row, pageStart + index);
                const isSelected = currentSelected.includes(id);

                return (
                  <tr key={id} className={`transition-colors duration-100 hover:bg-slate-50/90 ${isSelected ? "bg-slate-50/70" : "bg-white"}`}>
                    {selectable && (
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(id)}
                          className="w-4 h-4 rounded text-[#0F172A] accent-[#0F172A] cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-5 py-3.5 text-slate-800 ${
                          column.align === "center"
                            ? "text-center"
                            : column.align === "right"
                              ? "text-right"
                              : "text-left"
                        }`}
                      >
                        {column.render
                          ? column.render(row, pageStart + index)
                          : formatCellValue(row[column.key as keyof T])}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-[#FAFBFD] border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <span className="font-semibold text-slate-800">{resolvedTotalItems > 0 ? pageStart + 1 : 0}</span> sampai{" "}
          <span className="font-semibold text-slate-800">{Math.min(pageStart + pageSize, resolvedTotalItems)}</span> dari{" "}
          <span className="font-semibold text-slate-800">{resolvedTotalItems}</span> data
        </div>
        {showPagination && (
          <Pagination
            currentPage={resolvedCurrentPage}
            totalPages={resolvedTotalPages}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </div>
  );
}

export default CustomTable;

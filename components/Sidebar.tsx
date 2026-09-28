"use client";

import {
  Award,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function SidebarItem({
  icon,
  label,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  suffix?: React.ReactNode;
}) {
  return (
    <button className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-white/10">
      <span className="flex items-center gap-3">
        {icon}
        {label}
      </span>
      {suffix}
    </button>
  );
}

import Link from "next/link";
import { usePathname } from "next/navigation";

function SidebarSubItem({
  label,
  active = false,
  href,
}: {
  label: string;
  active?: boolean;
  href?: string;
}) {
  const content = (
    <>
      <span
        className={`size-1.5 rounded-full ${
          active ? "bg-[#069494]" : "bg-[#d9e2fc]/40"
        }`}
      />
      {label}
    </>
  );

  const className = `mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition ${
    active
      ? "bg-[#b0c6d4] font-bold text-[#1e3765]"
      : "text-[#d9e2fc] hover:bg-white/10"
  }`;

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <button className={className}>{content}</button>;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [isHrmsOpen, setIsHrmsOpen] = useState(true);
  const [isPosKompetensiOpen, setIsPosKompetensiOpen] = useState(true);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[#0f2342] px-4 py-5 text-[#d9e2fc] shadow-lg transition-transform lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center gap-3 px-2">
        <div className="grid size-9 place-items-center rounded-lg bg-[#069494] shadow-sm">
          <BriefcaseBusiness size={19} className="text-white" />
        </div>
        <div>
          <p className="text-xl font-bold tracking-[-0.5px] text-white">
            ANDIMA
          </p>
          <p className="text-xs text-[#d9e2fc]/80">Logistics Suite</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto rounded p-1 text-[#d9e2fc] lg:hidden"
          aria-label="Tutup navigasi"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="mt-8 space-y-1.5 text-sm font-semibold overflow-y-auto">
        <SidebarItem icon={<LayoutDashboard size={16} />} label="Dashboard" />
        <SidebarItem icon={<BriefcaseBusiness size={16} />} label="POS" />
        <SidebarItem
          icon={<UsersRound size={16} />}
          label="CRM"
          suffix={<ChevronRight size={15} />}
        />
        <div>
          <button
            onClick={() => setIsHrmsOpen((value) => !value)}
            className="flex w-full items-center justify-between rounded-lg bg-[#069494] px-3 py-2.5 text-white shadow-sm"
          >
            <span className="flex items-center gap-3">
              <ClipboardList size={17} /> HRMS
            </span>
            <ChevronDown
              size={16}
              className={isHrmsOpen ? "rotate-0" : "-rotate-90"}
            />
          </button>
          {isHrmsOpen && (
            <div className="ml-5 mt-2 border-l border-[#d9e2fc]/20 pl-3">
              <SidebarSubItem label="Employee Profile" href="/employees" active={pathname === "/employees"} />
              <SidebarSubItem label="Attendance & Productivity" />
              <SidebarSubItem label="Feedback & Reward" />
              <SidebarSubItem label="Employee Report & Ticket" href="/employee-report-ticket" active={pathname === "/employee-report-ticket"} />
            </div>
          )}
        </div>

        <div>
          <button
            onClick={() => setIsPosKompetensiOpen((value) => !value)}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition hover:bg-white/10"
          >
            <span className="flex items-center gap-3">
              <Award size={17} /> Manajemen Posisi & Kompetensi
            </span>
            <ChevronDown
              size={16}
              className={isPosKompetensiOpen ? "rotate-0" : "-rotate-90"}
            />
          </button>
          {isPosKompetensiOpen && (
            <div className="ml-5 mt-2 border-l border-[#d9e2fc]/20 pl-3">
              <SidebarSubItem label="Daftar Posisi Pekerjaan" href="/manajemen-posisi-dan-kompetensi/posisi" active={pathname === "/manajemen-posisi-dan-kompetensi/posisi"} />
              <SidebarSubItem label="Definisi KPI" href="/manajemen-posisi-dan-kompetensi/kpi" active={pathname === "/manajemen-posisi-dan-kompetensi/kpi"} />
              <SidebarSubItem label="Analisis Kesenjangan (Gap Analysis)" href="/manajemen-posisi-dan-kompetensi/gap-analysis" active={pathname === "/manajemen-posisi-dan-kompetensi/gap-analysis"} />
              <SidebarSubItem label="Laporan & Ekspor" href="/manajemen-posisi-dan-kompetensi/laporan" active={pathname === "/manajemen-posisi-dan-kompetensi/laporan"} />
            </div>
          )}
        </div>

        <SidebarItem
          icon={<ShieldCheck size={16} />}
          label="MID"
          suffix={<ChevronRight size={15} />}
        />
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-lg border border-[#d9e2fc]/15 bg-[#1e3765] p-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-white">
            <CircleHelp size={14} className="text-[#77d8cd]" /> Customer Support
          </div>
          <p className="mt-1 text-[10px] text-[#d9e2fc]/80">
            24/7 Operations Line
          </p>
        </div>
        <SidebarItem icon={<Settings size={15} />} label="Settings" />
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          <span className="grid size-7 place-items-center rounded-full bg-[#16834b] text-[10px] font-bold text-white">
            NN
          </span>
          <div>
            <p className="text-xs font-bold text-white">Nick Nelson</p>
            <p className="text-[10px] text-[#d9e2fc]/75">Web Developer</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

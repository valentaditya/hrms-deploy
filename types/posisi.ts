export interface PositionItem {
  id: string;
  nama_posisi?: string;
  name?: string;
  id_departments?: string;
  d1_departments?: { id: string; nama_departemen: string } | null;
  departemen?: string;
  department?: string;
  deskripsi_posisi?: string;
  deskripsi?: string;
  status_posisi?: "Active" | "Inactive" | "Deleted";
  status?: string;
  created_at?: string;
  position_code?: string;
  job_code?: string;
  location?: string;
}

export interface PositionItem {
  id: string;
  nama_posisi?: string;
  name?: string;
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

import { NextResponse } from 'next/server';
import { getSupabaseApiClient } from '@/utils/supabase/api';

type DepartmentContext = { params: Promise<{ department_id: string }> };

export async function PUT(request: Request, { params }: DepartmentContext) {
  try {
    const supabase = getSupabaseApiClient();
    const { department_id } = await params;
    const body = await request.json();
    const namaDepartemen = body.nama_departemen;

    if (typeof namaDepartemen !== 'string' || !namaDepartemen.trim() || namaDepartemen.trim().length > 100) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Nama departemen wajib diisi maksimal 100 karakter' } },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('d1_departments')
      .update({ nama_departemen: namaDepartemen.trim() })
      .eq('id', department_id)
      .select('id, nama_departemen, created_at')
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: { code: 'CONFLICT', message: 'Nama departemen sudah digunakan' } },
          { status: 409 }
        );
      }
      throw error;
    }
    if (!data) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Departemen tidak ditemukan' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Terjadi kesalahan internal',
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: DepartmentContext) {
  try {
    const supabase = getSupabaseApiClient();
    const { department_id } = await params;
    const { count, error: usageError } = await supabase
      .from('d1_job_positions')
      .select('id', { count: 'exact', head: true })
      .eq('id_departments', department_id);

    if (usageError) throw usageError;
    if ((count || 0) > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DEPARTMENT_IN_USE',
            message: 'Departemen masih digunakan oleh posisi. Pindahkan posisi tersebut sebelum menghapus departemen.',
          },
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from('d1_departments')
      .delete()
      .eq('id', department_id)
      .select('id')
      .maybeSingle();

    if (error) {
      if (error.code === '23503') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DEPARTMENT_IN_USE',
              message: 'Departemen masih digunakan. Pindahkan data terkait sebelum menghapusnya.',
            },
          },
          { status: 409 }
        );
      }
      throw error;
    }
    if (!data) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Departemen tidak ditemukan' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Departemen berhasil dihapus' });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: err instanceof Error ? err.message : 'Terjadi kesalahan internal',
        },
      },
      { status: 500 }
    );
  }
}
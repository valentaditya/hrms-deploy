import { NextResponse } from 'next/server';
import { getSupabaseApiClient } from '@/utils/supabase/api';

export async function GET() {
  try {
    const supabase = getSupabaseApiClient();
    const { data, error } = await supabase
      .from('d1_departments')
      .select('id, nama_departemen, created_at')
      .order('nama_departemen', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data: data || [] });
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

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseApiClient();
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
      .insert({ nama_departemen: namaDepartemen.trim() })
      .select('id, nama_departemen, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: { code: 'CONFLICT', message: 'Nama departemen sudah digunakan' } },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
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
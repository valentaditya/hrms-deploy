import { NextResponse } from 'next/server';
import { getSupabaseApiClient } from '@/utils/supabase/api';

export async function GET(request: Request, { params }: { params: Promise<{ position_id: string }> }) {
  try {
    const supabase = getSupabaseApiClient();
    const { position_id } = await params;

    const { data, error } = await supabase
      .from('d1_position_competency_map')
      .select(`
        competency_id,
        minimum_level,
        is_required,
        d1_competencies ( competency_name )
      `)
      .eq('position_id', position_id);

    if (error) throw error;

    // Formatting data agar sesuai dengan struktur respons FR-D1-005
    const formattedData = (data || []).map((item: any) => ({
      competency_id: item.competency_id,
      competency_name: item.d1_competencies?.competency_name || null,
      minimum_level: item.minimum_level,
      is_required: item.is_required
    }));

    return NextResponse.json({
      success: true,
      data: formattedData
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ position_id: string }> }) {
  try {
    const supabase = getSupabaseApiClient();
    const { position_id } = await params;
    const body = await request.json();

    if (!body.competency_id || body.minimum_level === undefined) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'competency_id dan minimum_level wajib diisi' }
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('d1_position_competency_map')
      .insert([{
        position_id: position_id,
        competency_id: body.competency_id,
        minimum_level: body.minimum_level,
        is_required: body.is_required !== undefined ? body.is_required : true
      }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({
          success: false,
          error: { code: 'CONFLICT', message: 'Kompetensi ini sudah menjadi persyaratan posisi ini' }
        }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Competency added successfully',
      data: data
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ position_id: string }> }) {
  try {
    const supabase = getSupabaseApiClient();
    const { position_id } = await params;
    const body = await request.json();
    const updatePayload: Record<string, string> = {};

    const namaPosisi = body.nama_posisi ?? body.name ?? body.title;
    const departemen = body.departemen ?? body.department;
    const deskripsi = body.deskripsi_posisi ?? body.deskripsi ?? body.description;
    const statusPosisi = body.status_posisi ?? body.status;
    const lokasi = body.lokasi ?? body.location ?? body.site;
    const jobCode = body.job_code ?? body.position_code;

    if (namaPosisi !== undefined) {
      if (typeof namaPosisi !== 'string' || namaPosisi.trim().length < 3 || namaPosisi.trim().length > 100) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Nama posisi wajib diisi antara 3 - 100 karakter' }
        }, { status: 400 });
      }
      updatePayload.nama_posisi = namaPosisi.trim();
    }
    if (departemen !== undefined) {
      if (typeof departemen !== 'string' || !departemen.trim()) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Departemen wajib diisi' }
        }, { status: 400 });
      }
      updatePayload.departemen = departemen.trim();
    }
    if (deskripsi !== undefined) {
      if (typeof deskripsi !== 'string' || deskripsi.length > 500) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Deskripsi tidak boleh melebihi 500 karakter' }
        }, { status: 400 });
      }
      updatePayload.deskripsi_posisi = deskripsi.trim();
    }
    if (statusPosisi !== undefined) {
      if (statusPosisi !== 'Active' && statusPosisi !== 'Inactive') {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Status posisi tidak valid' }
        }, { status: 400 });
      }
      updatePayload.status_posisi = statusPosisi;
    }
    if (lokasi !== undefined) {
      if (typeof lokasi !== 'string' || !lokasi.trim()) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Lokasi wajib diisi' }
        }, { status: 400 });
      }
      updatePayload.location = lokasi.trim();
    }
    if (jobCode !== undefined) {
      if (typeof jobCode !== 'string' || !jobCode.trim()) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Kode posisi wajib diisi' }
        }, { status: 400 });
      }
      updatePayload.job_code = jobCode.trim();
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Tidak ada data posisi untuk diperbarui' }
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('d1_job_positions')
      .update(updatePayload)
      .eq('id', position_id)
      .select()
      .maybeSingle();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({
          success: false,
          error: { code: 'CONFLICT', message: 'Posisi dengan nama/kode ini sudah ada' }
        }, { status: 409 });
      }
      throw error;
    }
    if (!data) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Posisi tidak ditemukan' }
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Position updated successfully', data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ position_id: string }> }) {
  try {
    const supabase = getSupabaseApiClient();
    const { position_id } = await params;

    // Remove relations first to maintain referential integrity
    try {
      await supabase.from('d1_position_competency_map').delete().eq('position_id', position_id);
    } catch (_) {}
    try {
      await supabase.from('d1_position_certifications').delete().eq('position_id', position_id);
    } catch (_) {}
    try {
      await supabase.from('d1_kpi_definitions').delete().eq('position_id', position_id);
    } catch (_) {}

    const { data, error } = await supabase
      .from('d1_job_positions')
      .delete()
      .eq('id', position_id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return NextResponse.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Posisi tidak ditemukan' }
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Position deleted successfully', data });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

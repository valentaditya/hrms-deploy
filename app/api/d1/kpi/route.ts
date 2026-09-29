import { NextResponse } from 'next/server';
import { getSupabaseApiClient } from '@/utils/supabase/api';

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseApiClient();
    const { searchParams } = new URL(request.url);
    const positionId = searchParams.get('position_id');

    let query = supabase.from('d1_kpi_definitions').select('*');
    if (positionId) {
      query = query.eq('position_id', positionId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || []
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseApiClient();
    const body = await request.json();
    
    let kpiList: any[] = [];
    const positionId = body.position_id;

    if (Array.isArray(body)) {
      kpiList = body;
    } else if (Array.isArray(body.kpis)) {
      kpiList = body.kpis;
    } else {
      kpiList = [body];
    }

    if (kpiList.length === 0) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Daftar KPI (kpis) tidak boleh kosong' }
      }, { status: 400 });
    }

    if (typeof positionId !== 'string' || !positionId.trim()) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Posisi wajib dipilih' }
      }, { status: 400 });
    }

    const kpiPayload: { position_id: string; kpi_name: string; kpi_target: string; kpi_weight: number }[] = [];
    for (const [index, kpi] of kpiList.entries()) {
      const name = kpi?.kpi_name ?? kpi?.name ?? kpi?.title;
      const target = kpi?.kpi_target ?? kpi?.target;
      const weight = Number(kpi?.kpi_weight ?? kpi?.weight);

      if (typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Nama KPI pada baris ${index + 1} wajib diisi` }
        }, { status: 400 });
      }
      if (typeof target !== 'string' || !target.trim()) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Target KPI pada baris ${index + 1} wajib diisi` }
        }, { status: 400 });
      }
      if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Bobot KPI pada baris ${index + 1} harus lebih dari 0% dan maksimal 100%` }
        }, { status: 400 });
      }

      kpiPayload.push({
        position_id: kpi.position_id || positionId,
        kpi_name: name.trim(),
        kpi_target: target.trim(),
        kpi_weight: weight,
      });
    }

    const totalWeight = kpiPayload.reduce((sum, kpi) => sum + kpi.kpi_weight, 0);
    if (body.validate_total_weight !== false && totalWeight !== 100) {
      return NextResponse.json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Total bobot KPI harus 100%. Saat ini: ${totalWeight}%` }
      }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('d1_kpi_definitions')
      .insert(kpiPayload)
      .select();

    if (error) {
      if (error.code === '23514' && error.message.includes('kpi_name_check')) {
        return NextResponse.json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Nama KPI tidak memenuhi aturan database. Periksa kembali nama KPI yang diisi.' }
        }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'KPI definitions created successfully',
      data: data
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

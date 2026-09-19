import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { ContentStatus } from '@/types/database';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { phase, approvedBy } = await req.json();

    if (!phase) {
      return NextResponse.json({ error: 'Fase approval harus disertakan secara spesifik' }, { status: 400 });
    }

    const content = dbStore.getContent(id);
    if (!content) {
      return NextResponse.json({ error: 'Konten tidak ditemukan' }, { status: 404 });
    }

    const approval = dbStore.approveContent(id, phase as ContentStatus, approvedBy || 'admin');
    return NextResponse.json({
      success: true,
      message: `Fase ${phase} berhasil disetujui`,
      approval,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

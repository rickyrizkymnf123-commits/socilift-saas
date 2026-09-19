import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const content = dbStore.getContent(id);
    if (!content) return NextResponse.json({ error: 'Content not found' }, { status: 404 });
    const approvals = dbStore.getApprovals(id);
    const comments = dbStore.getComments(id);
    const metric = dbStore.getMetricByContent(id);

    return NextResponse.json({ content, approvals, comments, metric });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const existing = dbStore.getContent(id);
    if (!existing) return NextResponse.json({ error: 'Content not found' }, { status: 404 });

    // Enforce Bug Fix #2: Status transition rule
    // If updating status to 'published', require approval for scheduled/take_konten or admin role
    if (body.status === 'published' && existing.status !== 'published') {
      const approvals = dbStore.getApprovals(id);
      const isApproved = approvals.some(a => a.phase === 'scheduled' || a.phase === 'editing' || a.phase === 'published');
      const userRole = body.userRole || 'creator';
      if (!isApproved && userRole !== 'dashboard_admin' && userRole !== 'manager') {
        return NextResponse.json({
          error: 'Konten belum disetujui untuk dipublikasikan. Minta approval fase terlebih dahulu.',
        }, { status: 403 });
      }
    }

    const updated = dbStore.updateContent(id, body);
    return NextResponse.json({ success: true, content: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    dbStore.deleteContent(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

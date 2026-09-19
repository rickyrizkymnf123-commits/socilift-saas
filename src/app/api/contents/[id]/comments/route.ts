import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const comments = dbStore.getComments(id);
    return NextResponse.json({ comments });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { body, userId } = await req.json();

    if (!body || !body.trim()) {
      return NextResponse.json({ error: 'Komentar tidak boleh kosong' }, { status: 400 });
    }

    const comment = dbStore.addComment({
      id: 'comm-' + Date.now(),
      content_id: id,
      user_id: userId || 'a0000000-0000-0000-0000-000000000001',
      body: body.trim(),
      resolved: false,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, comment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { commentId, resolvedBy } = await req.json();
    if (!commentId) return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    const resolved = dbStore.resolveComment(commentId, resolvedBy || 'admin');
    return NextResponse.json({ success: true, comment: resolved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

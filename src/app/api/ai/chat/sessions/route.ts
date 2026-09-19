import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { AIChatSession } from '@/types/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId') || undefined;
    const sessions = dbStore.getChatSessions(brandId);
    return NextResponse.json({ sessions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { brand_id, user_id, title } = await req.json();
    if (!brand_id) return NextResponse.json({ error: 'brand_id required' }, { status: 400 });

    const newSession: AIChatSession = {
      id: 'sess-' + Date.now(),
      brand_id,
      user_id: user_id || null,
      title: title || 'Percakapan Baru',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_message_at: new Date().toISOString(),
    };

    const created = dbStore.createChatSession(newSession);
    return NextResponse.json({ success: true, session: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

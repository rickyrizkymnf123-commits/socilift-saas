import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { Content } from '@/types/database';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brand_id, items, created_by } = body;

    if (!brand_id) {
      return NextResponse.json({ error: 'brand_id is required' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'items array cannot be empty' }, { status: 400 });
    }

    const now = new Date();
    const createdList: Content[] = items.map((item: any, index: number) => {
      const id = `c-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`;
      return {
        id,
        brand_id,
        title: String(item.title || 'Untitled Content').trim(),
        platform: item.platform || 'TikTok',
        format: item.format || 'Video',
        pillar: item.pillar || null,
        funnel: item.funnel || null,
        objective: item.objective || null,
        status: item.status || 'ideation',
        scheduled_date: item.scheduled_date || null,
        cart_title: item.cart_title || null,
        content_reference_url: item.content_reference_url || null,
        hook: item.hook || '',
        hook_visual: item.hook_visual || '',
        script: item.script || '',
        body_visual: item.body_visual || '',
        cta: item.cta || '',
        cta_visual: item.cta_visual || '',
        caption: item.caption || '',
        drive_link: item.drive_link || null,
        notes: item.notes || '',
        duration_slides: item.duration_slides || '',
        ai_prompt: item.ai_prompt || null,
        gcal_event_id: null,
        created_by: created_by || null,
        created_at: new Date(now.getTime() - index * 1000).toISOString(),
        updated_at: new Date(now.getTime() - index * 1000).toISOString(),
      };
    });

    const result = dbStore.bulkCreateContents(createdList);
    return NextResponse.json({ success: true, count: result.length, contents: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

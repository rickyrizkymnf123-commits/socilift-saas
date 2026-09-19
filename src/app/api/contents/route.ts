import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { Content } from '@/types/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId') || undefined;
    const contents = dbStore.getContents(brandId);
    return NextResponse.json({ contents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.title || !body.brand_id || !body.platform) {
      return NextResponse.json({ error: 'Title, brand, and platform are required' }, { status: 400 });
    }

    const newContent: Content = {
      id: 'c-' + Date.now(),
      brand_id: body.brand_id,
      title: body.title,
      platform: body.platform,
      format: body.format || 'Video',
      pillar: body.pillar || null,
      funnel: body.funnel || null,
      objective: body.objective || null,
      status: body.status || 'ideation',
      scheduled_date: body.scheduled_date || null,
      cart_title: body.cart_title || null,
      content_reference_url: body.content_reference_url || null,
      hook: body.hook || '',
      hook_visual: body.hook_visual || '',
      script: body.script || '',
      body_visual: body.body_visual || '',
      cta: body.cta || '',
      cta_visual: body.cta_visual || '',
      caption: body.caption || '',
      drive_link: body.drive_link || null,
      notes: body.notes || '',
      duration_slides: body.duration_slides || '',
      ai_prompt: body.ai_prompt || null,
      gcal_event_id: null,
      created_by: body.created_by || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = dbStore.createContent(newContent);
    return NextResponse.json({ success: true, content: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

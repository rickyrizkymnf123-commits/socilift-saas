import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { BacklogItem, Content } from '@/types/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId') || undefined;
    const items = dbStore.getBacklogItems(brandId);
    return NextResponse.json({ items });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.concept || !body.brand_id || !body.platform) {
      return NextResponse.json({ error: 'Concept, brand, and platform are required' }, { status: 400 });
    }

    const newItem: BacklogItem = {
      id: 'k-' + Date.now(),
      brand_id: body.brand_id,
      concept: body.concept,
      platform: body.platform,
      notes: body.notes || '',
      created_by: body.created_by || null,
      created_at: new Date().toISOString(),
    };

    const created = dbStore.createBacklogItem(newItem);
    return NextResponse.json({ success: true, item: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    const updated = dbStore.updateBacklogItem(body.id, {
      concept: body.concept,
      platform: body.platform,
      notes: body.notes,
    });
    return NextResponse.json({ success: true, item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    dbStore.deleteBacklogItem(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

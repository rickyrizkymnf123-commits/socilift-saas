import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { Goal } from '@/types/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId') || undefined;
    const goals = dbStore.getGoals(brandId);
    return NextResponse.json({ goals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.brand_id || !body.platform || !body.metric || !body.target || !body.deadline) {
      return NextResponse.json({ error: 'Brand, platform, metric, target, and deadline are required' }, { status: 400 });
    }

    const newGoal: Goal = {
      id: 'g-' + Date.now(),
      brand_id: body.brand_id,
      platform: body.platform,
      metric: body.metric,
      target: Number(body.target),
      baseline_current: Number(body.baseline_current) || 0,
      metric_baseline_value: Number(body.metric_baseline_value) || Number(body.baseline_current) || 0,
      metric_baseline_at: new Date().toISOString(),
      deadline: body.deadline,
      status: body.status || 'Active',
      created_at: new Date().toISOString(),
    };

    const created = dbStore.createGoal(newGoal);
    return NextResponse.json({ success: true, goal: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
    const updated = dbStore.updateGoal(id, updates);
    return NextResponse.json({ success: true, goal: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Goal ID required' }, { status: 400 });
    dbStore.deleteGoal(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

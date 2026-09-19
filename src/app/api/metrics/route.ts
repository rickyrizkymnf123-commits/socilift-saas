import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { PlatformCode } from '@/types/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId') || undefined;
    const platform = searchParams.get('platform') as PlatformCode | undefined;
    const metrics = dbStore.getMetrics(brandId, platform);
    return NextResponse.json({ metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.content_id || !body.brand_id || !body.platform || !body.date_logged) {
      return NextResponse.json({
        error: 'content_id, brand_id, platform, and date_logged are required',
      }, { status: 400 });
    }

    // Bug Fix #5: recalc_metric_fields trigger is strictly applied by saveMetric,
    // client-provided calculated fields are overwritten by the single source of truth formula.
    const saved = dbStore.saveMetric(body);
    return NextResponse.json({ success: true, metric: saved });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

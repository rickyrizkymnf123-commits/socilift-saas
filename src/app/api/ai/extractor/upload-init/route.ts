import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { AIExtractorJob } from '@/types/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId') || undefined;
    const jobs = dbStore.getExtractorJobs(brandId);
    return NextResponse.json({ jobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.brand_id || !body.file_name || !body.platform || !body.date_logged) {
      return NextResponse.json({ error: 'Data upload tidak lengkap' }, { status: 400 });
    }

    const newJob: AIExtractorJob = {
      id: 'job-' + Date.now(),
      brand_id: body.brand_id,
      user_id: body.user_id || null,
      file_name: body.file_name,
      file_mime_type: body.file_mime_type || 'image/png',
      file_size: body.file_size || 1024 * 50,
      file_base64: body.file_base64 || null,
      platform: body.platform,
      date_logged: body.date_logged,
      storage_path: 'uploads/' + body.file_name,
      status: 'queued',
      progress: 10,
      warnings: [],
      imported_metric_ids: [],
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const created = dbStore.createExtractorJob(newJob);
    return NextResponse.json({ success: true, job: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

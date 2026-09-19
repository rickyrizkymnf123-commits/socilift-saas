import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function POST(req: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const { content_id, metricData } = await req.json();

    const job = dbStore.getExtractorJob(jobId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    if (!content_id) {
      return NextResponse.json({ error: 'Target Konten harus dipilih untuk impor' }, { status: 400 });
    }

    const savedMetric = dbStore.saveMetric({
      ...metricData,
      content_id,
      brand_id: job.brand_id,
      platform: job.platform,
      date_logged: job.date_logged,
    });

    const updatedJob = dbStore.updateExtractorJob(jobId, {
      status: 'imported',
      imported_at: new Date().toISOString(),
      imported_metric_ids: [savedMetric.id],
    });

    return NextResponse.json({ success: true, metric: savedMetric, job: updatedJob });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

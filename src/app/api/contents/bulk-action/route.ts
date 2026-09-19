import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { ContentStatus } from '@/types/database';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ids, status } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array cannot be empty' }, { status: 400 });
    }

    if (action === 'delete') {
      const deletedCount = dbStore.bulkDeleteContents(ids);
      return NextResponse.json({ success: true, count: deletedCount, action: 'delete' });
    }

    if (action === 'status') {
      if (!status) {
        return NextResponse.json({ error: 'status is required for status action' }, { status: 400 });
      }
      const updatedCount = dbStore.bulkUpdateContentStatus(ids, status as ContentStatus);
      return NextResponse.json({ success: true, count: updatedCount, action: 'status' });
    }

    return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

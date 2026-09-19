import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const org = dbStore.getOrganizations()[0];
    const notifications = dbStore.getNotifications(org?.id);
    const reads = userId ? dbStore.getNotificationReads(userId) : [];
    const readIds = new Set(reads.map(r => r.notification_id));

    const result = notifications.map(n => ({
      ...n,
      is_read: readIds.has(n.id),
    }));

    return NextResponse.json({ notifications: result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { notificationId, userId } = await req.json();
    if (notificationId && userId) {
      dbStore.markNotificationRead(notificationId, userId);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

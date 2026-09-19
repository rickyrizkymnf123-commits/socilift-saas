import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { SubscriptionTier } from '@/types/database';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userIds, tier, days, isFree, mode, notes } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Pilih setidaknya 1 pengguna' }, { status: 400 });
    }

    const result = dbStore.bulkManageSubscriptions(
      userIds,
      (tier as SubscriptionTier) || 'pro',
      Number(days) || 30,
      Boolean(isFree),
      mode || 'smart',
      notes || ''
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { OrgRole, SubscriptionTier } from '@/types/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const role = searchParams.get('role') || undefined;
    const subscription = searchParams.get('subscription') || undefined;
    const tier = searchParams.get('tier') || undefined;
    const status = searchParams.get('status') || undefined;

    const result = dbStore.getAdminUsersList({
      search,
      role,
      subscription,
      tier,
      status,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, role, tier, days, isFree, notes } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email yang valid wajib diisi' }, { status: 400 });
    }

    const result = dbStore.bulkInviteUsers(
      [email],
      (role as OrgRole) || 'creator',
      (tier as SubscriptionTier) || 'pro',
      Number(days) || 30,
      Boolean(isFree),
      notes || ''
    );

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { OrgRole, SubscriptionTier } from '@/types/database';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { emails, role, tier, days, isFree, notes } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Daftar email wajib diisi' }, { status: 400 });
    }

    const result = dbStore.bulkInviteUsers(
      emails,
      (role as OrgRole) || 'creator',
      (tier as SubscriptionTier) || 'pro',
      Number(days) || 30,
      Boolean(isFree),
      notes || ''
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

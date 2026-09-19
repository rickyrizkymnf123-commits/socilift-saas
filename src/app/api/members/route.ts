import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { OrgRole } from '@/types/database';

export async function GET() {
  try {
    const org = dbStore.getOrganizations()[0];
    const members = dbStore.getMembers(org?.id);
    return NextResponse.json({ members });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const org = dbStore.getOrganizations()[0];
    let profile = dbStore.getProfileByEmail(email);
    if (!profile) {
      profile = dbStore.createProfile({
        id: 'u-' + Date.now(),
        email,
        display_name: email.split('@')[0],
        created_at: new Date().toISOString(),
      });
    }

    const member = dbStore.addMember({
      org_id: org.id,
      user_id: profile.id,
      role: (role as OrgRole) || 'creator',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      member: { ...member, profile },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, role } = await req.json();
    const org = dbStore.getOrganizations()[0];
    const updated = dbStore.updateMemberRole(org.id, userId, role as OrgRole);
    return NextResponse.json({ success: true, member: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

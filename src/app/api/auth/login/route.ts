import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    let user = dbStore.getProfileByEmail(email);
    if (!user) {
      // Auto register for local dev testing if not exists
      user = dbStore.createProfile({
        id: 'u-' + Date.now(),
        email,
        display_name: email.split('@')[0],
        created_at: new Date().toISOString(),
      });
      const org = dbStore.getOrganizations()[0];
      if (org) {
        dbStore.addMember({
          org_id: org.id,
          user_id: user.id,
          role: 'creator',
          created_at: new Date().toISOString(),
        });
      }
    }

    const cookieStore = await cookies();
    cookieStore.set('socilift_user_email', user.email, {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

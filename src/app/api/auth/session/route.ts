import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const userEmail = cookieStore.get('socilift_user_email')?.value || 'rickyrizkymnf123@gmail.com';

    let user = dbStore.getProfileByEmail(userEmail);
    if (!user) {
      user = dbStore.getProfiles()[0];
    }

    const orgs = dbStore.getOrganizations();
    const org = orgs[0];
    const members = dbStore.getMembers(org.id);
    const member = members.find(m => m.user_id === user.id);
    const role = member?.role || 'dashboard_admin';
    const brands = dbStore.getBrands(org.id);

    return NextResponse.json({
      user,
      org,
      brands,
      role,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

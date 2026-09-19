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
    const nowIso = new Date().toISOString();
    const isAdminUser = email.toLowerCase() === 'rickyrizkymnf123@gmail.com';

    if (!user) {
      // Auto register with dedicated isolated workspace
      const newUserId = 'u-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      user = dbStore.createProfile({
        id: newUserId,
        email: email.toLowerCase(),
        display_name: email.split('@')[0],
        created_at: nowIso,
      });

      const userOrg = {
        id: 'org-' + user.id,
        name: `${user.display_name || email.split('@')[0]}'s Workspace`,
        owner_id: user.id,
        created_at: nowIso,
      };
      dbStore.createOrganization(userOrg);

      dbStore.addMember({
        org_id: userOrg.id,
        user_id: user.id,
        role: isAdminUser ? 'dashboard_admin' : 'creator',
        created_at: nowIso,
      });

      // Dedicated isolated brand for this user
      dbStore.createBrand({
        id: 'brand-' + user.id,
        org_id: userOrg.id,
        name: `${user.display_name || email.split('@')[0]} Studio`,
        color: '#3B82F6',
        pillars: ['Edukasi & Tips', 'Inspirasi', 'Promosi Produk'],
        funnels: ['TOFU (Top of Funnel)', 'MOFU (Middle of Funnel)', 'BOFU (Bottom of Funnel)'],
        objectives: ['Brand Awareness', 'Engagement', 'Sales'],
        details: {
          niche: 'Kreator Konten',
          toneOfVoice: 'Casual & Menarik',
          targetAudience: 'Audiens Media Sosial',
        },
        created_by: user.id,
        created_at: nowIso,
      });

      // Default subscription
      dbStore.saveUserSubscription(user.id, {
        tier: isAdminUser ? 'pro' : 'basic',
        status: 'active',
        is_free_access: isAdminUser,
        start_date: nowIso,
        end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        notes: isAdminUser ? 'Super Admin' : 'Free Basic User',
      });
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

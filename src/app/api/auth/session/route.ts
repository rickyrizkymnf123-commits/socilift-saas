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

    const allMembers = dbStore.getUserMemberships(user.id);
    let org = null;
    let role = user.email.toLowerCase() === 'rickyrizkymnf123@gmail.com' ? 'dashboard_admin' : 'creator';

    if (allMembers.length > 0) {
      org = dbStore.getOrganization(allMembers[0].org_id);
      role = allMembers[0].role;
    }

    if (!org) {
      // Find or create user's personal organization
      const nowIso = new Date().toISOString();
      const isAdmin = user.email.toLowerCase() === 'rickyrizkymnf123@gmail.com';
      org = {
        id: 'org-' + user.id,
        name: `${user.display_name || user.email.split('@')[0]}'s Workspace`,
        owner_id: user.id,
        created_at: nowIso,
      };
      dbStore.createOrganization(org);
      dbStore.addMember({
        org_id: org.id,
        user_id: user.id,
        role: isAdmin ? 'dashboard_admin' : 'creator',
        created_at: nowIso,
      });
      role = isAdmin ? 'dashboard_admin' : 'creator';
    }

    let brands = dbStore.getBrands(org.id);
    if (brands.length === 0) {
      const newBrand = {
        id: 'brand-' + user.id,
        org_id: org.id,
        name: `${user.display_name || user.email.split('@')[0]} Studio`,
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
        created_at: new Date().toISOString(),
      };
      dbStore.createBrand(newBrand);
      brands = [newBrand];
    }

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

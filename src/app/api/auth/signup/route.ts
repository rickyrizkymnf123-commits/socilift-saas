import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';

export async function POST(req: Request) {
  try {
    const { email, name, password } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const displayName = name ? name.trim() : cleanEmail.split('@')[0];
    const isAdminUser = cleanEmail === 'rickyrizkymnf123@gmail.com';

    let user = dbStore.getProfileByEmail(cleanEmail);
    const nowIso = new Date().toISOString();

    if (user) {
      if (user.is_approved === false && !isAdminUser) {
        return NextResponse.json({
          success: true,
          message: 'Pendaftaran Anda sedang menunggu persetujuan Admin.',
          is_approved: false,
          email: user.email
        });
      }
      return NextResponse.json({
        error: 'Email sudah terdaftar. Silakan langsung login.',
        already_registered: true
      }, { status: 400 });
    }

    // Create new profile with pending approval (unless super admin)
    const newUserId = 'u-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
    user = dbStore.createProfile({
      id: newUserId,
      email: cleanEmail,
      display_name: displayName,
      is_approved: isAdminUser ? true : false,
      created_at: nowIso,
    });

    const userOrg = {
      id: 'org-' + user.id,
      name: `${displayName}'s Workspace`,
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
      name: `${displayName} Studio`,
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
      notes: isAdminUser ? 'Super Admin' : 'Pendaftaran Baru (Basic Tier)',
    });

    return NextResponse.json({
      success: true,
      message: isAdminUser 
        ? 'Akun Super Admin berhasil dibuat.' 
        : 'Pendaftaran Berhasil! Pendaftaran Anda sedang menunggu persetujuan Admin.',
      is_approved: user.is_approved,
      email: user.email
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

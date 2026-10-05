import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/db/store';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const isAdminUser = cleanEmail === 'rickyrizkymnf123@gmail.com';
    let user = dbStore.getProfileByEmail(cleanEmail);

    if (!user) {
      // If user doesn't exist, check if it's admin or prompt to register
      if (isAdminUser) {
        const nowIso = new Date().toISOString();
        user = dbStore.createProfile({
          id: 'a0000000-0000-0000-0000-000000000001',
          email: cleanEmail,
          display_name: 'Ricky Rizky (Admin)',
          is_approved: true,
          created_at: nowIso,
        });
      } else {
        return NextResponse.json({
          error: 'Akun belum terdaftar. Silakan lakukan pendaftaran terlebih dahulu.',
          not_found: true
        }, { status: 404 });
      }
    }

    // Check if user is approved by admin
    if (user.is_approved === false && !isAdminUser) {
      return NextResponse.json({
        error: 'Sorry, kamu masih belum di-approve, menunggu persetujuan dari admin',
        is_approved: false,
        email: user.email
      }, { status: 403 });
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

-- =====================================================================
-- Socilift SaaS — Seed Data
-- =====================================================================

-- 1. Insert Dashboard Admin into auth.users (if running on Supabase with Gotrue)
-- Test Admin ID: 'a0000000-0000-0000-0000-000000000001'
-- Creator ID: 'c0000000-0000-0000-0000-000000000001'

insert into profiles (id, email, display_name)
values 
  ('a0000000-0000-0000-0000-000000000001', 'admin@socilift.local', 'Admin Socilift'),
  ('c0000000-0000-0000-0000-000000000001', 'creator@socilift.local', 'Creator Pro')
on conflict (id) do nothing;

-- 2. Organization
insert into organizations (id, name, owner_id)
values 
  ('o0000000-0000-0000-0000-000000000001', 'Socilift Media Agency', 'a0000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- 3. Org Members
insert into organization_members (org_id, user_id, role)
values 
  ('o0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'dashboard_admin'),
  ('o0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'creator')
on conflict (org_id, user_id) do nothing;

-- 4. Brands
insert into brands (
  id, org_id, name, color, pillars, funnels, objectives, details, created_by
) values (
  'b0000000-0000-0000-0000-000000000001',
  'o0000000-0000-0000-0000-000000000001',
  'Brand Utama (Socilift Studio)',
  '#2563EB',
  array['Edukasi & Tutorial', 'Behind The Scene', 'Product Review', 'Entertainment / Relatable'],
  array['TOFU (Top of Funnel)', 'MOFU (Middle of Funnel)', 'BOFU (Bottom of Funnel)'],
  array['Brand Awareness', 'Lead Generation', 'Engagement', 'Sales & Conversion'],
  '{"niche": "Social Media Marketing & Creator Growth", "productServiceDesc": "Platform otomasi konten dan strategi media sosial berbasis AI", "targetAudience": "Content Creator, Social Media Specialist, Brand Owner", "brandPositioning": "Modern, Praktis, High-Conversion", "toneOfVoice": "Enerjik, Edukatif, Santai tapi Profesional", "mainOffer": "Subscription Socilift Plus AI", "usp": "All-in-one planner dengan AI hook and metrics tracking otomatis"}'::jsonb,
  'a0000000-0000-0000-0000-000000000001'
) on conflict (id) do nothing;

-- 5. Goals
insert into goals (id, brand_id, platform, metric, target, baseline_current, deadline, status)
values
  ('g0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'IG', 'Followers', 50000, 38500, now() + interval '30 days', 'Active'),
  ('g0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'TikTok', 'Views', 500000, 320000, now() + interval '45 days', 'Active'),
  ('g0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'YouTube', 'Subscribers', 10000, 6800, now() + interval '60 days', 'Active')
on conflict (id) do nothing;

-- 6. Initial Contents
insert into contents (
  id, brand_id, title, platform, format, pillar, funnel, objective, status, scheduled_date,
  hook, hook_visual, script, body_visual, cta, cta_visual, caption, created_by
) values
(
  'c1000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  '3 Rumus Hook FYP TikTok yang Jarang Dibongkar',
  'TikTok',
  'Video',
  'Edukasi & Tutorial',
  'TOFU (Top of Funnel)',
  'Brand Awareness',
  'published',
  now() - interval '2 days',
  'Stop scrolling! Ini alasan kenapa video kamu stuck di 200 views...',
  'Wajah kaget sambil nunjuk grafik analytics merah',
  'Bukan algoritma yang jahat, tapi detik 0 sampai 3 kamu ngebosenin. Gunakan 3 teknik ini: 1. Curiositiy Gap, 2. Negative Hook, 3. Pattern Interrupt.',
  'Tampilan b-roll screen recording editing CapCut & script breakdown',
  'Komen "HOOK" buat dapetin 50 template gratis!',
  'Teks di layar beranimasi mengarahkan ke kolom komentar',
  'Simpan konten ini sebelum hilang dari feed kamu! #tipscreator #algoritma #kontenkeren',
  'a0000000-0000-0000-0000-000000000001'
),
(
  'c1000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'Strategi Kalender Konten 30 Hari Tanpa Burnout',
  'IG',
  'Carousel',
  'Edukasi & Tutorial',
  'MOFU (Middle of Funnel)',
  'Engagement',
  'scheduled',
  now() + interval '1 day',
  'Cara bikin 30 konten dalam 1 hari kerja (tanpa mikir tiap pagi)',
  'Cover carousel aesthetic: Desain kalender minimalis',
  'Slide 1: Problem overthinking ide. Slide 2: Pilar konten. Slide 3: Format matrix. Slide 4: Batching production. Slide 5: Template checklist.',
  'Infografis step-by-step',
  'Save postingan ini untuk persiapan jadwal bulan depan!',
  'Panah menunjuk ikon bookmark Instagram',
  'Swipe left sampai habis untuk panduan praktisnya 👉 #socialmediatips #contentplanner',
  'a0000000-0000-0000-0000-000000000001'
),
(
  'c1000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000001',
  'Review Tool AI Terbaru Buat Copywriting Video',
  'YouTube',
  'Video',
  'Product Review',
  'BOFU (Bottom of Funnel)',
  'Sales & Conversion',
  'scripting',
  now() + interval '3 days',
  'Apakah tool AI ini beneran bisa gantiin copywriter professional?',
  'Presenter memegang mikrofon dekat laptop',
  'Hari ini kita test live generate 5 variasi naskah jualan menggunakan Socilift AI...',
  'Split screen teks script vs acting presenter',
  'Coba gratis melalui link di deskripsi video!',
  'Box callout mengarah ke deskripsi',
  'Tonton video lengkapnya di YouTube Socilift Studio.',
  'c0000000-0000-0000-0000-000000000001'
)
on conflict (id) do nothing;

-- 7. Initial Metrics for published content
insert into metrics (
  content_id, brand_id, platform, date_logged,
  views, impressions, likes, comments, shares, saves, reposts,
  clicks, thru_plays, three_second_watch_time, watch_time,
  interactions, profile_activity, new_followers, full_watch_views, skipped_views
) values (
  'c1000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000001',
  'TikTok',
  current_date - 1,
  45200, 58900, 3420, 185, 412, 1280, 95,
  820, 21500, 39400, 420000,
  5392, 640, 210, 15400, 4800
) on conflict (content_id, brand_id, platform, date_logged) do nothing;

-- 8. Backlog items
insert into backlog_items (id, brand_id, concept, platform, notes, created_by)
values
  ('k0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Mitos vs Fakta Shadowban Instagram 2026', 'IG', 'Eksperimen akun baru tanpa hashtag vs banyak hashtag', 'a0000000-0000-0000-0000-000000000001'),
  ('k0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Reaction Konten Iklan Ramadhan Viral', 'TikTok', 'Bedah teknik storytelling emosional vs hard sell', 'c0000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- 9. Notifications
insert into notifications (id, org_id, title, message, type, force_popup)
values (
  'n0000000-0000-0000-0000-000000000001',
  'o0000000-0000-0000-0000-000000000001',
  'Selamat Datang di Socilift SaaS Rebuild!',
  'Sistem content planner modern Anda siap digunakan. Atur pilar brand, goal platform, dan nikmati integrasi AI hook generator.',
  'feature_update',
  false
) on conflict (id) do nothing;

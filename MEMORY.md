# Workspace Memory - Socilift Plus SaaS

## User Preferences & Critical Guidelines
- **Conversation Logging**: Wajib selalu mencatat interaksi ke `CONVERSATION_LOG.md` di root workspace.
- **Memory Management**: Wajib selalu memelihara kesinambungan memori di `MEMORY.md` dan `GEMINI.md`.
- **UI Design System**:
  - Desain harus modern, clean, dan profesional.
  - Tipografi harus memiliki kontras tinggi dan ketebalan yang tegas (font-bold/black, tidak boleh washed-out atau abu-abu pucat di atas latar putih).
  - Wajib mendukung **Dual Mode**: **Light Mode** dan **Dark Mode** yang dapat diganti via toggle di topbar.
  - **Zero Fake Dummy Data**: Semua data harus mencerminkan workflow kreator/agensi media sosial riil (TikTok hooks, Instagram carousels, YouTube scripts, metrik real, funnel TOFU/MOFU/BOFU).

## Project Architecture
- **Framework**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4.
- **Database/Persistence**: Local JSON data store (`data/socilift_db.json`) dengan parity trigger Postgres (`recalc_metric_fields()`) dan Supabase migration script (`supabase/migrations/0001_init.sql`).
- **AI Integration**: Google Gemini API via `/api/ai/chat` dan `/api/gemini-settings`.
- **Testing**: `test-api.mjs` menguji 5 bug classes kritis.

## Test & Admin Credentials
- Primary Super Admin: `rickyrizkymnf123@gmail.com` / `Permatasari11` (Enterprise Lifetime)
- Creator: `creator@socilift.local` / `password123` (Pro Tier)

## Dashboard, Calendar, Kanban & Admin Customization
- 4 KPI cards memiliki dropdown panah bawah (`⌄`) untuk modal "Ganti Metrik" (15 pilihan metrik) dengan simpan otomatis di `localStorage`.
- Tren performa mendukung multi-variabel (Impressions, Likes, Shares, Clicks, GMV, Click Rate, Hook Rate, Hold Rate, Avg Watch Time, New Followers) + tombol Reset.
- Filter periode mendukung: Hari Ini, Kemarin, 7 Hari Terakhir, 30 Hari Terakhir, Bulan Ini, Bulan Lalu, dan Custom (date range modal).
- **Kalender Konten**: Klik pada kotak tanggal manapun langsung membuka modal `+ Konten Baru` dengan auto pre-fill tanggal posting dan status `scheduled`.
- **Kanban Board**: Drag and drop 2 arah mulus, kartu dari kolom manapun dapat digeser kembali ke `Backlog Ide`. Klik pada kartu manapun langsung membuka studio edit konten/ide seketika.
- **Admin User & Subscription Suite (`/admin/users`)**:
  - Ringkasan KPI akun (Total, Aktif, Trial/Pending, Kedaluwarsa).
  - Floating Bulk Action Bar (muncul saat checkbox user dicentang).
  - Undang Massal (Bulk Invite) dengan custom tier, role, durasi hari, dan Lifetime toggle.
  - Kelola Langganan Massal (Bulk Subscription) dengan Smart Extension (+30, +60, +90, +365d) vs Reset dari Hari Ini.
  - Hapus Massal (Bulk Delete) dengan dialog konfirmasi keamanan.
  - Quick Extend (+30d) instan per user dan edit modal mandiri.

## 5 Fitur Inti yang Telah Dimaksimalkan (19 Sep 2026)
1. **Real CSV & Excel Export + Bulk Content Importer (`/content` & `/report`)**:
   - `src/lib/csv-helper.ts`: Utilitas RFC 4180 dengan UTF-8 BOM encoding.
   - Ekspor tabel pivot `/report` dan database `/content` ke file `.csv` asli.
   - Bulk CSV Importer di `/content` dengan drag & drop upload, validasi kolom, pratinjau data, dan batch save ke `POST /api/contents/bulk`.
   - Multi-Select Bulk Actions di `/content` dengan floating action bar untuk ubah status massal, hapus massal, dan export terpilih.
2. **Interactive Drag-and-Drop Calendar & .ICS Download (`/calendar`)**:
   - Drag and drop kartu antar tanggal untuk reschedule cepat dengan `PUT /api/contents/[id]`.
   - Filter Platform & Status di toolbar atas kalender.
   - `src/lib/ical-helper.ts`: Generator `.ics` (iCalendar standard) untuk sync ke Google/Apple Calendar.
3. **Socilift AI Assistant dengan Brand Context Penuh & 1-Klik Action (`/socilift-ai`)**:
   - Injeksi parameter brand (Niche, Target Audience, Tone, USP, Pilar, Funnel) ke Gemini prompt.
   - Tombol 1-klik di bawah respons AI: `[+ Ke Kanban Backlog]`, `[+ Buat Konten]`, dan `[Salin]`.
4. **AI Metrics Extractor dengan Bulk Upload & Auto-Match (`/ai-extractor`)**:
   - Multi-screenshot upload (1-10 file sekaligus) dengan antrean batch processing.
   - AI OCR title detection dan auto-matching cerdas dengan judul konten di database.
5. **Socilift AI Typography & Thinking Indicator (`/socilift-ai`)**:
   - Parser markdown murni (`parseInlineFormatting`) mengubah simbol `**`, `*`, `###`, `1.`, `-` menjadi elemen visual bersih dengan ketebalan teks tegas tanpa simbol karakter mentah.
   - Animated thinking bubble dengan 3-dot bounce, pulse avatar, dan rotating sparkles saat AI merumuskan jawaban.

## Production Deployment & Infrastructure (19 Sep 2026)
- **Live Production URL**: `https://socilift-saas.vercel.app`
- **GitHub Repo**: `https://github.com/rickyrizkymnf123-commits/socilift-saas` (branch: `main`)
- **Supabase Project**: `socilift-saas` (`pytmquulcvkkqzsfvlwz`) Region: `ap-southeast-1` (Isolated from `tools-sakti`).
- **Vercel Team**: `team_rJcdVvmqpKTfIFC5UGcIaLQR` (Project: `socilift-saas`).
- **Super Admin Login**: `rickyrizkymnf123@gmail.com` / `Permatasari11` (Enterprise Lifetime).

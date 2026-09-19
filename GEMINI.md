# Gemini Assistant Guide - Socilift Plus SaaS

## Overview
Socilift Plus adalah aplikasi SaaS pengelolaan dan perencanaan konten media sosial all-in-one yang dibangun ulang dari spreadsheet Google Apps Script menjadi web app modern berbasis Next.js App Router, Tailwind CSS, Supabase DB & Auth, dan Google Gemini AI.

## Key Rules & Directives
1. **Pencegahan Data Palsu (Zero Fake Dummy Data)**:
   Selalu gunakan data realistis agensi kreator Indonesia (contoh: Niche "Creator Growth & Digital Marketing", pilar "Edukasi & Tutorial", script naskah dengan Hook, Body, Visual, CTA, dan metrik riil).
2. **Kualitas Tampilan UI & Dual Mode**:
   Setiap komponen wajib menyertakan styling untuk Light Mode dan Dark Mode (`dark:` classes). Font label harus tegas (`font-bold text-slate-900 dark:text-white`), border input jelas (`border-slate-300 dark:border-slate-700`), dan dilarang menggunakan teks abu-abu pudar di latar terang.
3. **Pencatatan Berkelanjutan**:
   Selalu perbarui `CONVERSATION_LOG.md` dan `MEMORY.md` setelah setiap sesi pengembangan.

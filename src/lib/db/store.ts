import fs from 'fs';
import path from 'path';
import {
  Profile,
  Organization,
  OrganizationMember,
  Brand,
  Content,
  ContentApproval,
  ContentComment,
  BacklogItem,
  Goal,
  Metric,
  ActivityLog,
  Notification,
  NotificationRead,
  AIExtractorJob,
  AIChatSession,
  AIChatMessage,
  AIUsageLog,
  GeminiSettings,
  OrgRole,
  ContentStatus,
  PlatformCode,
  SubscriptionTier,
  SubscriptionStatus,
  UserSubscription,
  UserInvitation,
  UserAdminListItem,
} from '@/types/database';

export interface DatabaseState {
  profiles: Profile[];
  organizations: Organization[];
  organization_members: OrganizationMember[];
  user_subscriptions: UserSubscription[];
  user_invitations: UserInvitation[];
  brands: Brand[];
  contents: Content[];
  content_approvals: ContentApproval[];
  content_comments: ContentComment[];
  backlog_items: BacklogItem[];
  goals: Goal[];
  metrics: Metric[];
  activity_logs: ActivityLog[];
  notifications: Notification[];
  notification_reads: NotificationRead[];
  ai_extractor_jobs: AIExtractorJob[];
  ai_chat_sessions: AIChatSession[];
  ai_chat_messages: AIChatMessage[];
  ai_usage_logs: AIUsageLog[];
  gemini_settings: GeminiSettings[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'socilift_db.json');

// Exact parity with Postgres recalc_metric_fields() trigger
export function recalcMetricFields(m: Partial<Metric>): Partial<Metric> {
  const updated = { ...m };
  const views = Number(m.views) || 0;
  const impressions = Number(m.impressions) || 0;

  if (views > 0) {
    const interactions = m.interactions !== undefined && m.interactions !== null
      ? Number(m.interactions)
      : (Number(m.likes) || 0) + (Number(m.comments) || 0) + (Number(m.shares) || 0) + (Number(m.saves) || 0) + (Number(m.reposts) || 0);
    updated.engagement = Math.round((interactions / views) * 10000) / 100;
  } else {
    updated.engagement = null;
  }

  if (views > 0 && m.watch_time !== undefined && m.watch_time !== null) {
    updated.avg_watch_time = Math.round((Number(m.watch_time) / views) * 100) / 100;
  } else {
    updated.avg_watch_time = null;
  }

  if (impressions > 0 && m.clicks !== undefined && m.clicks !== null) {
    updated.click_rate = Math.round((Number(m.clicks) / impressions) * 10000) / 100;
  } else {
    updated.click_rate = null;
  }

  if (impressions > 0 && m.three_second_watch_time !== undefined && m.three_second_watch_time !== null) {
    updated.hook_rate = Math.round((Number(m.three_second_watch_time) / impressions) * 10000) / 100;
  } else {
    updated.hook_rate = null;
  }

  if (impressions > 0 && m.thru_plays !== undefined && m.thru_plays !== null) {
    updated.hold_rate = Math.round((Number(m.thru_plays) / impressions) * 10000) / 100;
  } else {
    updated.hold_rate = null;
  }

  if (views > 0 && m.full_watch_views !== undefined && m.full_watch_views !== null) {
    updated.watched_full_video_pct = Math.round((Number(m.full_watch_views) / views) * 10000) / 100;
  } else {
    updated.watched_full_video_pct = null;
  }

  if (views > 0 && m.skipped_views !== undefined && m.skipped_views !== null) {
    updated.skip_rate = Math.round((Number(m.skipped_views) / views) * 10000) / 100;
  } else {
    updated.skip_rate = null;
  }

  if (views > 0 && m.reels_skipped_views !== undefined && m.reels_skipped_views !== null) {
    updated.avg_reels_skip_rate = Math.round((Number(m.reels_skipped_views) / views) * 10000) / 100;
  } else {
    updated.avg_reels_skip_rate = null;
  }

  return updated;
}

function getInitialData(): DatabaseState {
  const now = new Date();
  const isoNow = now.toISOString();

  const adminProfile: Profile = {
    id: 'a0000000-0000-0000-0000-000000000001',
    email: 'rickyrizkymnf123@gmail.com',
    display_name: 'Ricky Rizky (Admin)',
    created_at: isoNow,
  };

  const creatorProfile: Profile = {
    id: 'c0000000-0000-0000-0000-000000000001',
    email: 'creator@socilift.local',
    display_name: 'Creator Pro',
    created_at: isoNow,
  };

  const org: Organization = {
    id: 'o0000000-0000-0000-0000-000000000001',
    name: 'Socilift Media Agency',
    owner_id: adminProfile.id,
    created_at: isoNow,
  };

  const members: OrganizationMember[] = [
    {
      org_id: org.id,
      user_id: adminProfile.id,
      role: 'dashboard_admin',
      created_at: isoNow,
      profile: adminProfile,
    },
    {
      org_id: org.id,
      user_id: creatorProfile.id,
      role: 'creator',
      created_at: isoNow,
      profile: creatorProfile,
    },
  ];

  const brand: Brand = {
    id: 'b0000000-0000-0000-0000-000000000001',
    org_id: org.id,
    name: 'Brand Utama (Socilift Studio)',
    color: '#2563EB',
    pillars: ['Edukasi & Tutorial', 'Behind The Scene', 'Product Review', 'Entertainment / Relatable'],
    funnels: ['TOFU (Top of Funnel)', 'MOFU (Middle of Funnel)', 'BOFU (Bottom of Funnel)'],
    objectives: ['Brand Awareness', 'Lead Generation', 'Engagement', 'Sales & Conversion'],
    details: {
      niche: 'Social Media Marketing & Creator Growth',
      productServiceDesc: 'Platform otomasi konten dan strategi media sosial berbasis AI',
      targetAudience: 'Content Creator, Social Media Specialist, Brand Owner',
      brandPositioning: 'Modern, Praktis, High-Conversion',
      toneOfVoice: 'Enerjik, Edukatif, Santai tapi Profesional',
      mainOffer: 'Subscription Socilift Plus AI',
      usp: 'All-in-one planner dengan AI hook and metrics tracking otomatis',
    },
    created_by: adminProfile.id,
    created_at: isoNow,
  };

  const sampleContents: Content[] = [
    {
      id: 'c1000000-0000-0000-0000-000000000001',
      brand_id: brand.id,
      title: '3 Rumus Hook FYP TikTok yang Jarang Dibongkar',
      platform: 'TikTok',
      format: 'Video',
      pillar: 'Edukasi & Tutorial',
      funnel: 'TOFU (Top of Funnel)',
      objective: 'Brand Awareness',
      status: 'published',
      scheduled_date: new Date(Date.now() - 2 * 86400000).toISOString(),
      cart_title: 'Socilift Plus Template Kit',
      content_reference_url: 'https://tiktok.com',
      hook: 'Stop scrolling! Ini alasan kenapa video kamu stuck di 200 views...',
      hook_visual: 'Wajah kaget sambil nunjuk grafik analytics merah di layar smartphone',
      script: 'Bukan algoritma yang jahat, tapi detik 0 sampai 3 kamu ngebosenin. Gunakan 3 teknik ini: 1. Curiosity Gap, 2. Negative Hook, 3. Pattern Interrupt.',
      body_visual: 'Tampilan b-roll screen recording editing CapCut & script breakdown',
      cta: 'Komen "HOOK" buat dapetin 50 template gratis!',
      cta_visual: 'Teks di layar beranimasi mengarahkan ke kolom komentar',
      caption: 'Simpan konten ini sebelum hilang dari feed kamu! #tipscreator #algoritma #kontenkeren',
      drive_link: 'https://drive.google.com',
      notes: 'Gunakan audio trending lo-fi beat',
      duration_slides: '45s',
      ai_prompt: 'Buatkan hook video edukasi tiktok tentang algoritma',
      gcal_event_id: null,
      created_by: adminProfile.id,
      created_at: isoNow,
      updated_at: isoNow,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000002',
      brand_id: brand.id,
      title: 'Strategi Kalender Konten 30 Hari Tanpa Burnout',
      platform: 'IG',
      format: 'Carousel',
      pillar: 'Edukasi & Tutorial',
      funnel: 'MOFU (Middle of Funnel)',
      objective: 'Engagement',
      status: 'scheduled',
      scheduled_date: new Date(Date.now() + 1 * 86400000).toISOString(),
      cart_title: 'Content Planner Pro',
      content_reference_url: 'https://instagram.com',
      hook: 'Cara bikin 30 konten dalam 1 hari kerja (tanpa mikir tiap pagi)',
      hook_visual: 'Cover carousel aesthetic: Desain kalender minimalis',
      script: 'Slide 1: Problem overthinking ide. Slide 2: Pilar konten. Slide 3: Format matrix. Slide 4: Batching production. Slide 5: Template checklist.',
      body_visual: 'Infografis step-by-step dan template clean layout',
      cta: 'Save postingan ini untuk persiapan jadwal bulan depan!',
      cta_visual: 'Panah menunjuk ikon bookmark Instagram',
      caption: 'Swipe left sampai habis untuk panduan praktisnya 👉 #socialmediatips #contentplanner',
      drive_link: 'https://drive.google.com',
      notes: 'Pastikan font cover mudah dibaca di explore grid',
      duration_slides: '7 slides',
      ai_prompt: 'Buatkan carousel strategi konten 30 hari',
      gcal_event_id: null,
      created_by: adminProfile.id,
      created_at: isoNow,
      updated_at: isoNow,
    },
    {
      id: 'c1000000-0000-0000-0000-000000000003',
      brand_id: brand.id,
      title: 'Review Tool AI Terbaru Buat Copywriting Video',
      platform: 'YouTube',
      format: 'Video',
      pillar: 'Product Review',
      funnel: 'BOFU (Bottom of Funnel)',
      objective: 'Sales & Conversion',
      status: 'scripting',
      scheduled_date: new Date(Date.now() + 3 * 86400000).toISOString(),
      cart_title: 'AI Scriptwriter Bundle',
      content_reference_url: 'https://youtube.com',
      hook: 'Apakah tool AI ini beneran bisa gantiin copywriter professional?',
      hook_visual: 'Presenter memegang mikrofon dekat laptop dengan ekspresi penasaran',
      script: 'Hari ini kita test live generate 5 variasi naskah jualan menggunakan Socilift AI...',
      body_visual: 'Split screen teks script vs acting presenter',
      cta: 'Coba gratis melalui link di deskripsi video!',
      cta_visual: 'Box callout mengarah ke deskripsi',
      caption: 'Tonton video lengkapnya di YouTube Socilift Studio.',
      drive_link: 'https://drive.google.com',
      notes: 'Siapkan link affiliate di deskripsi',
      duration_slides: '8 mins',
      ai_prompt: 'Review tool copywriting AI',
      gcal_event_id: null,
      created_by: creatorProfile.id,
      created_at: isoNow,
      updated_at: isoNow,
    },
  ];

  const sampleApprovals: ContentApproval[] = [
    {
      id: 'app00000-0000-0000-0000-000000000001',
      content_id: sampleContents[0].id,
      phase: 'scheduled',
      approved_by: adminProfile.id,
      approved_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ];

  const sampleGoals: Goal[] = [
    {
      id: 'g0000000-0000-0000-0000-000000000001',
      brand_id: brand.id,
      platform: 'IG',
      metric: 'Followers',
      target: 50000,
      baseline_current: 38500,
      metric_baseline_value: 35000,
      metric_baseline_at: isoNow,
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      status: 'Active',
      created_at: isoNow,
    },
    {
      id: 'g0000000-0000-0000-0000-000000000002',
      brand_id: brand.id,
      platform: 'TikTok',
      metric: 'Views',
      target: 500000,
      baseline_current: 320000,
      metric_baseline_value: 100000,
      metric_baseline_at: isoNow,
      deadline: new Date(Date.now() + 45 * 86400000).toISOString().split('T')[0],
      status: 'Active',
      created_at: isoNow,
    },
    {
      id: 'g0000000-0000-0000-0000-000000000003',
      brand_id: brand.id,
      platform: 'YouTube',
      metric: 'Subscribers',
      target: 10000,
      baseline_current: 6800,
      metric_baseline_value: 5000,
      metric_baseline_at: isoNow,
      deadline: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0],
      status: 'Active',
      created_at: isoNow,
    },
  ];

  const rawMetric: Metric = {
    id: 'm0000000-0000-0000-0000-000000000001',
    content_id: sampleContents[0].id,
    brand_id: brand.id,
    platform: 'TikTok',
    date_logged: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    views: 45200,
    impressions: 58900,
    likes: 3420,
    comments: 185,
    shares: 412,
    saves: 1280,
    reposts: 95,
    clicks: 820,
    thru_plays: 21500,
    three_second_watch_time: 39400,
    watch_time: 420000,
    interactions: 5392,
    profile_activity: 640,
    new_followers: 210,
    full_watch_views: 15400,
    skipped_views: 4800,
    retention_0s: 100,
    retention_5s: 78,
    retention_10s: 62,
    retention_15s: 50,
    retention_30s: 38,
    retention_45s: 29,
    gender_pct: { male: 42, female: 58 },
    age_pct: { '18-24': 48, '25-34': 36, '35+': 16 },
    location: { Jakarta: 45, Surabaya: 25, Bandung: 18, Lainnya: 12 },
    created_at: isoNow,
  };

  const calculatedMetric = recalcMetricFields(rawMetric) as Metric;

  const sampleBacklog: BacklogItem[] = [
    {
      id: 'k0000000-0000-0000-0000-000000000001',
      brand_id: brand.id,
      concept: 'Mitos vs Fakta Shadowban Instagram 2026',
      platform: 'IG',
      notes: 'Eksperimen akun baru tanpa hashtag vs banyak hashtag',
      created_by: adminProfile.id,
      created_at: isoNow,
    },
    {
      id: 'k0000000-0000-0000-0000-000000000002',
      brand_id: brand.id,
      concept: 'Reaction Konten Iklan Ramadhan Viral',
      platform: 'TikTok',
      notes: 'Bedah teknik storytelling emosional vs hard sell',
      created_by: creatorProfile.id,
      created_at: isoNow,
    },
  ];

  const sampleNotifications: Notification[] = [
    {
      id: 'n0000000-0000-0000-0000-000000000001',
      org_id: org.id,
      title: 'Selamat Datang di Socilift SaaS Rebuild!',
      message: 'Sistem content planner modern Anda siap digunakan. Atur pilar brand, goal platform, dan nikmati integrasi AI hook generator.',
      type: 'feature_update',
      force_popup: false,
      created_at: isoNow,
      updated_at: isoNow,
    },
  ];

  const sampleSubscriptions: UserSubscription[] = [
    {
      id: 'sub-admin',
      user_id: adminProfile.id,
      tier: 'enterprise',
      status: 'active',
      is_free_access: true,
      start_date: isoNow,
      end_date: new Date(Date.now() + 3650 * 86400000).toISOString(),
      notes: 'Super Admin Lifetime Enterprise Access',
      created_at: isoNow,
      updated_at: isoNow,
    },
    {
      id: 'sub-creator',
      user_id: creatorProfile.id,
      tier: 'pro',
      status: 'active',
      is_free_access: false,
      start_date: isoNow,
      end_date: new Date(Date.now() + 30 * 86400000).toISOString(),
      notes: 'Paket Pro Bulanan Creator Plus',
      created_at: isoNow,
      updated_at: isoNow,
    },
  ];

  const sampleGeminiSettings: GeminiSettings = {
    org_id: org.id,
    api_key_encrypted: null,
    selected_model: 'gemini-2.5-flash',
    status: 'Not Connected',
    last_tested_at: null,
    updated_at: isoNow,
  };

  return {
    profiles: [adminProfile, creatorProfile],
    organizations: [org],
    organization_members: members,
    user_subscriptions: sampleSubscriptions,
    user_invitations: [],
    brands: [brand],
    contents: [],
    content_approvals: [],
    content_comments: [],
    backlog_items: [],
    goals: [],
    metrics: [],
    activity_logs: [],
    notifications: [],
    notification_reads: [],
    ai_extractor_jobs: [],
    ai_chat_sessions: [],
    ai_chat_messages: [],
    ai_usage_logs: [],
    gemini_settings: [sampleGeminiSettings],
  };
}

class LocalDBStore {
  private data: DatabaseState;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseState {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed: DatabaseState = JSON.parse(fileContent);
        // Ensure arrays exist for schema compatibility
        if (!parsed.user_subscriptions || parsed.user_subscriptions.length === 0) {
          const initial = getInitialData();
          parsed.user_subscriptions = initial.user_subscriptions;
        }
        if (!parsed.user_invitations) {
          const initial = getInitialData();
          parsed.user_invitations = initial.user_invitations;
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Could not read socilift_db.json, initializing new store', e);
    }
    const initial = getInitialData();
    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseState) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save socilift_db.json', e);
    }
  }

  private persist() {
    this.saveData(this.data);
  }

  // --- Profiles & Auth ---
  getProfiles() { return this.data.profiles; }
  getProfile(id: string) { return this.data.profiles.find(p => p.id === id); }
  getProfileByEmail(email: string) { return this.data.profiles.find(p => p.email.toLowerCase() === email.toLowerCase()); }
  createProfile(profile: Profile) {
    this.data.profiles.push(profile);
    this.persist();
    return profile;
  }

  // --- Organizations & Members ---
  getOrganizations() { return this.data.organizations; }
  getOrganization(id: string) { return this.data.organizations.find(o => o.id === id); }
  getMembers(orgId: string) {
    return this.data.organization_members
      .filter(m => m.org_id === orgId)
      .map(m => ({ ...m, profile: this.getProfile(m.user_id) }));
  }
  addMember(member: OrganizationMember) {
    this.data.organization_members.push(member);
    this.persist();
    return member;
  }
  updateMemberRole(orgId: string, userId: string, role: OrgRole) {
    const mem = this.data.organization_members.find(m => m.org_id === orgId && m.user_id === userId);
    if (mem) {
      mem.role = role;
      this.persist();
    }
    return mem;
  }

  // --- Brands ---
  getBrands(orgId?: string) {
    return orgId ? this.data.brands.filter(b => b.org_id === orgId) : this.data.brands;
  }
  getBrand(id: string) { return this.data.brands.find(b => b.id === id); }
  createBrand(brand: Brand) {
    this.data.brands.push(brand);
    this.persist();
    return brand;
  }
  updateBrand(id: string, updates: Partial<Brand>) {
    const idx = this.data.brands.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.data.brands[idx] = { ...this.data.brands[idx], ...updates };
      this.persist();
      return this.data.brands[idx];
    }
    return null;
  }

  // --- Contents ---
  getContents(brandId?: string) {
    let list = this.data.contents;
    if (brandId) list = list.filter(c => c.brand_id === brandId);
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }
  getContent(id: string) { return this.data.contents.find(c => c.id === id); }
  createContent(content: Content) {
    this.data.contents.push(content);
    this.persist();
    return content;
  }
  updateContent(id: string, updates: Partial<Content>) {
    const idx = this.data.contents.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.contents[idx] = {
        ...this.data.contents[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.persist();
      return this.data.contents[idx];
    }
    return null;
  }
  deleteContent(id: string) {
    this.data.contents = this.data.contents.filter(c => c.id !== id);
    this.persist();
    return true;
  }
  bulkCreateContents(newContents: Content[]) {
    this.data.contents.unshift(...newContents);
    this.persist();
    return newContents;
  }
  bulkDeleteContents(ids: string[]) {
    const set = new Set(ids);
    const prevCount = this.data.contents.length;
    this.data.contents = this.data.contents.filter(c => !set.has(c.id));
    this.persist();
    return prevCount - this.data.contents.length;
  }
  bulkUpdateContentStatus(ids: string[], status: ContentStatus) {
    const set = new Set(ids);
    let updatedCount = 0;
    const nowIso = new Date().toISOString();
    this.data.contents.forEach(c => {
      if (set.has(c.id)) {
        c.status = status;
        c.updated_at = nowIso;
        updatedCount++;
      }
    });
    this.persist();
    return updatedCount;
  }

  // --- Approvals (Bug Fix #1 & #2) ---
  getApprovals(contentId: string) {
    return this.data.content_approvals.filter(a => a.content_id === contentId);
  }
  approveContent(contentId: string, phase: ContentStatus, approvedBy: string) {
    const existing = this.data.content_approvals.find(a => a.content_id === contentId && a.phase === phase);
    if (existing) return existing;
    const approval: ContentApproval = {
      id: 'app-' + Date.now(),
      content_id: contentId,
      phase,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
    };
    this.data.content_approvals.push(approval);
    this.persist();
    return approval;
  }

  // --- Comments ---
  getComments(contentId: string) {
    return this.data.content_comments
      .filter(c => c.content_id === contentId)
      .map(c => ({
        ...c,
        user_email: this.getProfile(c.user_id)?.email || 'User',
      }))
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
  addComment(comment: ContentComment) {
    this.data.content_comments.push(comment);
    this.persist();
    return comment;
  }
  resolveComment(commentId: string, resolvedBy: string) {
    const comment = this.data.content_comments.find(c => c.id === commentId);
    if (comment) {
      comment.resolved = true;
      comment.resolved_by = resolvedBy;
      comment.resolved_at = new Date().toISOString();
      this.persist();
    }
    return comment;
  }

  // --- Backlog Items ---
  getBacklogItems(brandId?: string) {
    return brandId ? this.data.backlog_items.filter(b => b.brand_id === brandId) : this.data.backlog_items;
  }
  createBacklogItem(item: BacklogItem) {
    this.data.backlog_items.push(item);
    this.persist();
    return item;
  }
  updateBacklogItem(id: string, updates: Partial<BacklogItem>) {
    const idx = this.data.backlog_items.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.data.backlog_items[idx] = {
        ...this.data.backlog_items[idx],
        ...updates,
      };
      this.persist();
      return this.data.backlog_items[idx];
    }
    return null;
  }
  deleteBacklogItem(id: string) {
    this.data.backlog_items = this.data.backlog_items.filter(b => b.id !== id);
    this.persist();
    return true;
  }

  // --- Goals ---
  getGoals(brandId?: string) {
    return brandId ? this.data.goals.filter(g => g.brand_id === brandId) : this.data.goals;
  }
  createGoal(goal: Goal) {
    this.data.goals.push(goal);
    this.persist();
    return goal;
  }
  updateGoal(id: string, updates: Partial<Goal>) {
    const idx = this.data.goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      this.data.goals[idx] = { ...this.data.goals[idx], ...updates };
      this.persist();
      return this.data.goals[idx];
    }
    return null;
  }
  deleteGoal(id: string) {
    this.data.goals = this.data.goals.filter(g => g.id !== id);
    this.persist();
    return true;
  }

  // --- Metrics (Trigger Recalculation strictly executed here) ---
  getMetrics(brandId?: string, platform?: PlatformCode) {
    let list = this.data.metrics;
    if (brandId) list = list.filter(m => m.brand_id === brandId);
    if (platform) list = list.filter(m => m.platform === platform);
    return list.sort((a, b) => new Date(b.date_logged).getTime() - new Date(a.date_logged).getTime());
  }
  getMetricByContent(contentId: string) {
    return this.data.metrics.find(m => m.content_id === contentId);
  }
  saveMetric(metric: Partial<Metric> & { content_id: string; brand_id: string; platform: PlatformCode; date_logged: string }) {
    // Strictly recompute calculated fields using the exact Postgres trigger formula
    const calculated = recalcMetricFields(metric);
    const existingIdx = this.data.metrics.findIndex(
      m => m.content_id === metric.content_id &&
           m.brand_id === metric.brand_id &&
           m.platform === metric.platform &&
           m.date_logged === metric.date_logged
    );

    if (existingIdx !== -1) {
      this.data.metrics[existingIdx] = {
        ...this.data.metrics[existingIdx],
        ...calculated,
      } as Metric;
      this.persist();
      return this.data.metrics[existingIdx];
    } else {
      const newRow = {
        id: metric.id || 'm-' + Date.now(),
        created_at: new Date().toISOString(),
        ...calculated,
      } as Metric;
      this.data.metrics.push(newRow);
      this.persist();
      return newRow;
    }
  }

  // --- Notifications ---
  getNotifications(orgId?: string) {
    return this.data.notifications.filter(n => !n.org_id || (orgId && n.org_id === orgId));
  }
  getNotificationReads(userId: string) {
    return this.data.notification_reads.filter(r => r.user_id === userId);
  }
  markNotificationRead(notificationId: string, userId: string) {
    if (!this.data.notification_reads.some(r => r.notification_id === notificationId && r.user_id === userId)) {
      this.data.notification_reads.push({
        notification_id: notificationId,
        user_id: userId,
        read_at: new Date().toISOString(),
      });
      this.persist();
    }
  }

  // --- AI Extractor Jobs ---
  getExtractorJobs(brandId?: string) {
    return brandId ? this.data.ai_extractor_jobs.filter(j => j.brand_id === brandId) : this.data.ai_extractor_jobs;
  }
  getExtractorJob(id: string) {
    return this.data.ai_extractor_jobs.find(j => j.id === id);
  }
  createExtractorJob(job: AIExtractorJob) {
    this.data.ai_extractor_jobs.push(job);
    this.persist();
    return job;
  }
  updateExtractorJob(id: string, updates: Partial<AIExtractorJob>) {
    const idx = this.data.ai_extractor_jobs.findIndex(j => j.id === id);
    if (idx !== -1) {
      this.data.ai_extractor_jobs[idx] = {
        ...this.data.ai_extractor_jobs[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      this.persist();
      return this.data.ai_extractor_jobs[idx];
    }
    return null;
  }

  // --- AI Chat Sessions & Messages ---
  getChatSessions(brandId?: string) {
    return (brandId ? this.data.ai_chat_sessions.filter(s => s.brand_id === brandId) : this.data.ai_chat_sessions)
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  }
  getChatSession(id: string) {
    return this.data.ai_chat_sessions.find(s => s.id === id);
  }
  createChatSession(session: AIChatSession) {
    this.data.ai_chat_sessions.push(session);
    this.persist();
    return session;
  }
  getChatMessages(sessionId: string) {
    return this.data.ai_chat_messages
      .filter(m => m.session_id === sessionId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
  addChatMessage(msg: AIChatMessage) {
    this.data.ai_chat_messages.push(msg);
    const sess = this.data.ai_chat_sessions.find(s => s.id === msg.session_id);
    if (sess) {
      sess.last_message_at = msg.created_at;
      sess.updated_at = msg.created_at;
    }
    this.persist();
    return msg;
  }

  // --- AI Usage Logs ---
  logAIUsage(log: AIUsageLog) {
    this.data.ai_usage_logs.push(log);
    this.persist();
    return log;
  }

  // --- Gemini Settings ---
  getGeminiSettings(orgId: string) {
    return this.data.gemini_settings.find(s => s.org_id === orgId) || null;
  }
  saveGeminiSettings(settings: GeminiSettings) {
    const idx = this.data.gemini_settings.findIndex(s => s.org_id === settings.org_id);
    if (idx !== -1) {
      this.data.gemini_settings[idx] = {
        ...this.data.gemini_settings[idx],
        ...settings,
        updated_at: new Date().toISOString(),
      };
      this.persist();
      return this.data.gemini_settings[idx];
    } else {
      this.data.gemini_settings.push(settings);
      this.persist();
      return settings;
    }
  }

  // --- Admin User & Subscription Management Suite ---
  getUserSubscription(userId: string): UserSubscription | null {
    return this.data.user_subscriptions.find(s => s.user_id === userId) || null;
  }

  saveUserSubscription(userId: string, data: Partial<UserSubscription>): UserSubscription {
    const existingIdx = this.data.user_subscriptions.findIndex(s => s.user_id === userId);
    const nowIso = new Date().toISOString();

    if (existingIdx !== -1) {
      this.data.user_subscriptions[existingIdx] = {
        ...this.data.user_subscriptions[existingIdx],
        ...data,
        updated_at: nowIso,
      };
      this.persist();
      return this.data.user_subscriptions[existingIdx];
    } else {
      const newSub: UserSubscription = {
        id: data.id || 'sub-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        user_id: userId,
        tier: data.tier || 'pro',
        status: data.status || 'active',
        is_free_access: data.is_free_access || false,
        start_date: data.start_date || nowIso,
        end_date: data.end_date || new Date(Date.now() + 30 * 86400000).toISOString(),
        notes: data.notes || '',
        created_at: nowIso,
        updated_at: nowIso,
      };
      this.data.user_subscriptions.push(newSub);
      this.persist();
      return newSub;
    }
  }

  quickExtendSubscription(userId: string, days: number): UserSubscription {
    const existing = this.getUserSubscription(userId);
    const now = new Date();
    let newEndDate: Date;

    if (existing && new Date(existing.end_date) > now && existing.status === 'active') {
      newEndDate = new Date(new Date(existing.end_date).getTime() + days * 86400000);
    } else {
      newEndDate = new Date(now.getTime() + days * 86400000);
    }

    return this.saveUserSubscription(userId, {
      status: 'active',
      end_date: newEndDate.toISOString(),
      updated_at: now.toISOString(),
    });
  }

  getAdminUsersList(options?: {
    search?: string;
    role?: string;
    subscription?: string;
    tier?: string;
    status?: string;
  }): {
    users: UserAdminListItem[];
    stats: {
      total: number;
      active: number;
      trial: number;
      expired: number;
      admins: number;
    };
  } {
    const org = this.data.organizations[0] || { id: 'o0000000-0000-0000-0000-000000000001' };
    const now = new Date();

    // 1. Map registered users
    const registeredList: UserAdminListItem[] = this.data.profiles.map(profile => {
      const member = this.data.organization_members.find(m => m.user_id === profile.id);
      const sub = this.data.user_subscriptions.find(s => s.user_id === profile.id) || null;

      // Auto check status if date expired
      let calculatedSub = sub;
      if (sub && !sub.is_free_access) {
        const isExp = new Date(sub.end_date) < now;
        if (isExp && sub.status === 'active') {
          calculatedSub = { ...sub, status: 'expired' };
        }
      }

      return {
        id: profile.id,
        email: profile.email,
        display_name: profile.display_name || profile.email.split('@')[0],
        role: member?.role || 'creator',
        org_id: member?.org_id || org.id,
        is_registered: true,
        is_approved: profile.is_approved !== false,
        created_at: profile.created_at,
        last_active: profile.created_at,
        subscription: calculatedSub,
        invitation: null,
        brandsCount: this.data.brands.length,
      };
    });

    // 2. Map pending invitations
    const pendingList: UserAdminListItem[] = (this.data.user_invitations || [])
      .filter(inv => inv.status === 'pending')
      .map(inv => ({
        id: inv.id,
        email: inv.email,
        display_name: inv.email.split('@')[0] + ' (Pending)',
        role: inv.role,
        org_id: inv.org_id,
        is_registered: false,
        is_approved: false,
        created_at: inv.created_at,
        last_active: null,
        subscription: {
          id: 'sub-' + inv.id,
          user_id: inv.id,
          tier: inv.tier,
          status: 'trial',
          is_free_access: false,
          start_date: inv.created_at,
          end_date: new Date(new Date(inv.created_at).getTime() + 7 * 86400000).toISOString(),
          notes: inv.notes || 'Pending Invitation',
          created_at: inv.created_at,
          updated_at: inv.created_at,
        },
        invitation: inv,
        brandsCount: 0,
      }));

    const allCombined = [...registeredList, ...pendingList];

    // Compute stats
    const stats = {
      total: allCombined.length,
      active: allCombined.filter(u => u.subscription?.status === 'active' || u.subscription?.is_free_access).length,
      trial: allCombined.filter(u => u.subscription?.status === 'trial' || !u.is_registered).length,
      expired: allCombined.filter(u => u.subscription?.status === 'expired').length,
      admins: allCombined.filter(u => u.role === 'dashboard_admin').length,
    };

    // Apply filtering
    let filtered = allCombined;

    if (options?.search) {
      const q = options.search.toLowerCase();
      filtered = filtered.filter(u =>
        u.email.toLowerCase().includes(q) ||
        (u.display_name && u.display_name.toLowerCase().includes(q)) ||
        (u.subscription?.notes && u.subscription.notes.toLowerCase().includes(q))
      );
    }

    if (options?.role && options.role !== 'all') {
      filtered = filtered.filter(u => u.role === options.role);
    }

    if (options?.status && options.status !== 'all') {
      if (options.status === 'registered') filtered = filtered.filter(u => u.is_registered);
      if (options.status === 'pending') filtered = filtered.filter(u => !u.is_registered);
    }

    if (options?.subscription && options.subscription !== 'all') {
      if (options.subscription === 'active') {
        filtered = filtered.filter(u => u.subscription?.status === 'active' || u.subscription?.is_free_access);
      } else if (options.subscription === 'expired') {
        filtered = filtered.filter(u => u.subscription?.status === 'expired');
      } else if (options.subscription === 'trial') {
        filtered = filtered.filter(u => u.subscription?.status === 'trial');
      } else if (options.subscription === 'lifetime') {
        filtered = filtered.filter(u => u.subscription?.is_free_access);
      } else if (options.subscription === 'none') {
        filtered = filtered.filter(u => !u.subscription);
      }
    }

    if (options?.tier && options.tier !== 'all') {
      filtered = filtered.filter(u => u.subscription?.tier === options.tier);
    }

    // Sort by created date desc
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { users: filtered, stats };
  }

  bulkDeleteUsers(userIds: string[]): { success: boolean; deletedCount: number } {
    const idSet = new Set(userIds);

    // Filter profiles
    const initialProfileCount = this.data.profiles.length;
    this.data.profiles = this.data.profiles.filter(p => !idSet.has(p.id));
    const deletedProfiles = initialProfileCount - this.data.profiles.length;

    // Filter members
    this.data.organization_members = this.data.organization_members.filter(m => !idSet.has(m.user_id));

    // Filter subscriptions
    this.data.user_subscriptions = this.data.user_subscriptions.filter(s => !idSet.has(s.user_id));

    // Filter invitations
    const initialInvCount = (this.data.user_invitations || []).length;
    this.data.user_invitations = (this.data.user_invitations || []).filter(i => !idSet.has(i.id) && !idSet.has(i.email));
    const deletedInvs = initialInvCount - this.data.user_invitations.length;

    this.persist();
    return { success: true, deletedCount: deletedProfiles + deletedInvs };
  }

  bulkInviteUsers(
    emails: string[],
    role: OrgRole = 'creator',
    tier: SubscriptionTier = 'pro',
    days: number = 30,
    isFree: boolean = false,
    notes: string = '',
    orgId?: string,
    invitedBy?: string
  ): { success: boolean; createdCount: number; existingCount: number } {
    const org = orgId || this.data.organizations[0]?.id || 'o0000000-0000-0000-0000-000000000001';
    let createdCount = 0;
    let existingCount = 0;
    const nowIso = new Date().toISOString();
    const endIso = isFree ? new Date(Date.now() + 3650 * 86400000).toISOString() : new Date(Date.now() + days * 86400000).toISOString();

    if (!this.data.user_invitations) this.data.user_invitations = [];

    emails.forEach(rawEmail => {
      const email = rawEmail.trim().toLowerCase();
      if (!email || !email.includes('@')) return;

      // Check if profile already exists
      const existingProfile = this.data.profiles.find(p => p.email.toLowerCase() === email);
      if (existingProfile) {
        existingCount++;
        // Update subscription for existing user
        this.saveUserSubscription(existingProfile.id, {
          tier,
          status: 'active',
          is_free_access: isFree,
          end_date: endIso,
          notes: notes || 'Bulk Invited / Assigned Plan',
        });
        return;
      }

      // Check if invitation already exists
      const existingInv = this.data.user_invitations.find(i => i.email.toLowerCase() === email && i.status === 'pending');
      if (existingInv) {
        existingInv.role = role;
        existingInv.tier = tier;
        existingInv.notes = notes;
        existingCount++;
        return;
      }

      // Create new user profile + member + subscription immediately so they can login directly
      const newUserId = 'u-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
      const newProfile: Profile = {
        id: newUserId,
        email,
        display_name: email.split('@')[0],
        is_approved: true,
        created_at: nowIso,
      };
      this.data.profiles.push(newProfile);

      this.data.organization_members.push({
        org_id: org,
        user_id: newUserId,
        role,
        created_at: nowIso,
        profile: newProfile,
      });

      this.data.user_subscriptions.push({
        id: 'sub-' + newUserId,
        user_id: newUserId,
        tier,
        status: 'active',
        is_free_access: isFree,
        start_date: nowIso,
        end_date: endIso,
        notes: notes || 'Bulk Invited via Admin Suite',
        created_at: nowIso,
        updated_at: nowIso,
      });

      createdCount++;
    });

    this.persist();
    return { success: true, createdCount, existingCount };
  }

  bulkManageSubscriptions(
    userIds: string[],
    tier: SubscriptionTier = 'pro',
    days: number = 30,
    isFree: boolean = false,
    mode: 'smart' | 'now' = 'smart',
    notes: string = ''
  ): { success: boolean; updatedCount: number } {
    let updatedCount = 0;
    const now = new Date();

    userIds.forEach(userId => {
      const existing = this.getUserSubscription(userId);
      let newEndDate: Date;

      if (isFree) {
        newEndDate = new Date(now.getTime() + 3650 * 86400000);
      } else if (mode === 'smart' && existing && new Date(existing.end_date) > now && existing.status === 'active') {
        newEndDate = new Date(new Date(existing.end_date).getTime() + days * 86400000);
      } else {
        newEndDate = new Date(now.getTime() + days * 86400000);
      }

      this.saveUserSubscription(userId, {
        tier,
        status: 'active',
        is_free_access: isFree,
        start_date: existing?.start_date || now.toISOString(),
        end_date: newEndDate.toISOString(),
        notes: notes || (existing?.notes ? `${existing.notes} | Bulk Updated (+${days}d)` : `Bulk Updated (+${days}d)`),
      });

      updatedCount++;
    });

    this.persist();
    return { success: true, updatedCount };
  }

  updateAdminUser(userId: string, data: { name?: string; role?: OrgRole; is_approved?: boolean }) {
    const profile = this.data.profiles.find(p => p.id === userId);
    if (profile) {
      if (data.name !== undefined) profile.display_name = data.name;
      if (data.is_approved !== undefined) profile.is_approved = data.is_approved;
    }

    if (data.role) {
      const member = this.data.organization_members.find(m => m.user_id === userId);
      if (member) {
        member.role = data.role;
      }
    }

    this.persist();
    return { profile };
  }

  deleteAdminUser(userId: string) {
    return this.bulkDeleteUsers([userId]);
  }
}

// Global singleton
export const dbStore = new LocalDBStore();

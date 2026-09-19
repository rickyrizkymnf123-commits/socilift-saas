export type OrgRole = 'dashboard_admin' | 'manager' | 'creator' | 'view_only';
export type PlatformCode = 'IG' | 'TikTok' | 'YouTube' | 'FB' | 'X' | 'Threads';
export type ContentStatus = 'ideation' | 'scripting' | 'take_konten' | 'editing' | 'scheduled' | 'published';
export type AIJobStatus = 'queued' | 'uploading' | 'file_processing' | 'extracting' | 'validating' | 'ready_to_review' | 'imported' | 'failed';
export type NotificationType = 'info' | 'warning' | 'maintenance' | 'feature_update' | 'critical';

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'agency' | 'enterprise';
export type SubscriptionStatus = 'active' | 'expired' | 'trial' | 'cancelled';

export interface UserSubscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  is_free_access: boolean;
  start_date: string;
  end_date: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserInvitation {
  id: string;
  org_id: string;
  email: string;
  role: OrgRole;
  tier: SubscriptionTier;
  invited_by?: string | null;
  status: 'pending' | 'accepted' | 'expired';
  notes?: string | null;
  created_at: string;
  accepted_at?: string | null;
}

export interface UserAdminListItem {
  id: string;
  email: string;
  display_name: string | null;
  role: OrgRole;
  org_id: string;
  is_registered: boolean;
  is_approved: boolean;
  created_at: string;
  last_active?: string | null;
  subscription: UserSubscription | null;
  invitation: UserInvitation | null;
  brandsCount?: number;
}

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  is_approved?: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface OrganizationMember {
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
  profile?: Profile;
}

export interface Brand {
  id: string;
  org_id: string;
  name: string;
  color: string;
  pillars: string[];
  funnels: string[];
  objectives: string[];
  details: {
    niche?: string;
    productServiceDesc?: string;
    targetAudience?: string;
    brandPositioning?: string;
    toneOfVoice?: string;
    mainOffer?: string;
    usp?: string;
    [key: string]: any;
  };
  created_by?: string | null;
  created_at: string;
}

export interface UserBrandAccess {
  user_id: string;
  brand_id: string;
}

export interface UserPlatformAccess {
  user_id: string;
  org_id: string;
  platform: PlatformCode;
}

export interface Content {
  id: string;
  brand_id: string;
  title: string;
  platform: PlatformCode;
  format?: string | null;
  pillar?: string | null;
  funnel?: string | null;
  objective?: string | null;
  status: ContentStatus;
  scheduled_date?: string | null;
  cart_title?: string | null;
  content_reference_url?: string | null;
  hook?: string | null;
  hook_visual?: string | null;
  script?: string | null;
  body_visual?: string | null;
  cta?: string | null;
  cta_visual?: string | null;
  caption?: string | null;
  drive_link?: string | null;
  notes?: string | null;
  duration_slides?: string | null;
  ai_prompt?: string | null;
  gcal_event_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentApproval {
  id: string;
  content_id: string;
  phase: ContentStatus;
  approved_by: string;
  approved_at: string;
}

export interface ContentComment {
  id: string;
  content_id: string;
  user_id: string;
  body: string;
  resolved: boolean;
  resolved_by?: string | null;
  resolved_at?: string | null;
  created_at: string;
  user_email?: string;
}

export interface BacklogItem {
  id: string;
  brand_id: string;
  concept: string;
  platform: PlatformCode;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
}

export interface Goal {
  id: string;
  brand_id: string;
  platform: PlatformCode;
  metric: string;
  target: number;
  baseline_current: number;
  metric_baseline_value: number;
  metric_baseline_at?: string | null;
  deadline: string;
  status: string;
  created_at: string;
}

export interface Metric {
  id: string;
  content_id: string;
  brand_id: string;
  platform: PlatformCode;
  date_logged: string;

  views?: number | null;
  impressions?: number | null;
  likes?: number | null;
  comments?: number | null;
  shares?: number | null;
  reposts?: number | null;
  saves?: number | null;
  clicks?: number | null;
  thru_plays?: number | null;
  three_second_watch_time?: number | null;
  purchase_value?: number | null;
  views_followers?: number | null;
  views_non_followers?: number | null;
  watch_time?: number | null;
  interactions?: number | null;
  profile_activity?: number | null;
  new_followers?: number | null;
  full_watch_views?: number | null;
  skipped_views?: number | null;
  reels_skipped_views?: number | null;

  retention_0s?: number | null;
  retention_5s?: number | null;
  retention_10s?: number | null;
  retention_15s?: number | null;
  retention_30s?: number | null;
  retention_45s?: number | null;
  retention_60s?: number | null;
  retention_80s?: number | null;
  retention_100s?: number | null;
  retention_120s?: number | null;

  gender_pct?: Record<string, number> | null;
  age_pct?: Record<string, number> | null;
  location?: Record<string, any> | null;

  subscribers?: number | null;
  video_views?: number | null;
  total_viewers?: number | null;
  total_play_time?: number | null;
  profile_views?: number | null;
  post_views?: number | null;

  created_at: string;

  // Stored calculated columns (computed strictly by trigger)
  engagement?: number | null;
  avg_watch_time?: number | null;
  click_rate?: number | null;
  hook_rate?: number | null;
  hold_rate?: number | null;
  watched_full_video_pct?: number | null;
  skip_rate?: number | null;
  avg_reels_skip_rate?: number | null;
}

export interface ActivityLog {
  id: string;
  brand_id: string;
  user_id?: string | null;
  action: string;
  meta?: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  org_id?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  force_popup: boolean;
  action_label?: string | null;
  action_url?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationRead {
  notification_id: string;
  user_id: string;
  read_at: string;
}

export interface AIExtractorJob {
  id: string;
  brand_id: string;
  user_id?: string | null;
  file_name: string;
  file_mime_type: string;
  file_size: number;
  platform: PlatformCode;
  date_logged: string;
  storage_path?: string | null;
  file_base64?: string | null;
  gemini_file_uri?: string | null;
  gemini_file_name?: string | null;
  status: AIJobStatus;
  progress: number;
  error_message?: string | null;
  warnings: any[];
  result?: {
    extractedRows?: Partial<Metric>[];
    extractionSummary?: string;
    confidence?: number;
    [key: string]: any;
  } | null;
  imported_metric_ids: string[];
  retry_count: number;
  created_at: string;
  updated_at: string;
  imported_at?: string | null;
}

export interface AIChatSession {
  id: string;
  brand_id: string;
  user_id?: string | null;
  title: string;
  main_topic?: string | null;
  platform?: PlatformCode | null;
  funnel?: string | null;
  objective?: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
}

export interface AIChatMessage {
  id: string;
  session_id: string;
  brand_id: string;
  role: 'user' | 'assistant';
  message_text: string;
  message_type: string;
  intent_tag?: string | null;
  context_tags?: string | null;
  draft?: {
    hook?: string;
    hook_visual?: string;
    script?: string;
    body_visual?: string;
    cta?: string;
    cta_visual?: string;
    caption?: string;
    [key: string]: any;
  } | null;
  created_at: string;
}

export interface AIUsageLog {
  id: string;
  brand_id?: string | null;
  user_id?: string | null;
  feature_source: string;
  model_name?: string | null;
  request_type?: string | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  status: string;
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
}

export interface GeminiSettings {
  org_id: string;
  api_key_encrypted?: string | null;
  selected_model: string;
  status: string;
  last_tested_at?: string | null;
  updated_at: string;
}

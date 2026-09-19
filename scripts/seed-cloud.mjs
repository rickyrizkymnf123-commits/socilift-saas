import https from 'https';

const userId = '8fe10e50-5f96-486a-97ce-72bf9988c9b7';
const orgId = '11111111-1111-1111-1111-111111111111';
const brandId = '22222222-2222-2222-2222-222222222222';

const sql = `
-- Create Org
insert into public.organizations (id, name, owner_id)
values ('${orgId}', 'Socilift Agency', '${userId}')
on conflict (id) do nothing;

-- Create Org Member
insert into public.organization_members (org_id, user_id, role)
values ('${orgId}', '${userId}', 'dashboard_admin')
on conflict (org_id, user_id) do nothing;

-- Create Brand
insert into public.brands (id, org_id, name, color, pillars, funnels, objectives, details, created_by)
values (
  '${brandId}',
  '${orgId}',
  'Brand Utama (Socilift Studio)',
  '#2563EB',
  array['Education', 'Storytelling', 'Promotion', 'Behind the Scenes'],
  array['TOFU', 'MOFU', 'BOFU'],
  array['Brand Awareness', 'Lead Generation', 'Conversion'],
  '{"niche": "Content Creator Growth and SaaS", "targetAudience": "Digital Creators and Social Media Managers", "toneOfVoice": "Professional, Actionable, Inspiring", "usp": "All-in-One Content Engine with AI Naskah and Calendar"}'::jsonb,
  '${userId}'
)
on conflict (id) do nothing;

-- Create Subscription
insert into public.user_subscriptions (user_id, tier, status, is_free_access, start_date, end_date, notes)
values ('${userId}', 'enterprise', 'active', true, now(), now() + interval '100 years', 'Super Admin Enterprise Lifetime Access')
on conflict (user_id) do update set
  tier = 'enterprise',
  status = 'active',
  is_free_access = true,
  end_date = now() + interval '100 years',
  notes = 'Super Admin Enterprise Lifetime Access';
`;

const payload = JSON.stringify({ query: sql });
const req = https.request({
  hostname: 'api.supabase.com',
  path: '/v1/projects/pytmquulcvkkqzsfvlwz/database/query',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sbp_v0_a87a63237a36cd2df40c17e210d6a95aa00c0c6d',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Seed result:', res.statusCode, body));
});
req.write(payload);
req.end();

-- ─────────────────────────────────────────────────────────────────────────
-- Services marketplace — Phase 1 schema
--
-- Tables introduced:
--   services                 — admin-managed catalogue (replaces hardcoded lib)
--   service_orders           — the lifecycle from quote-request → completed
--   service_order_messages   — threaded chat between user and ops
--   service_order_events     — timeline log shown to the user
--   service_reviews          — post-completion 4-axis review
--   platform_config          — single-row config (platform fee %, etc.)
--
-- The old service_quote_requests table (migration 010) is dropped; it had no
-- rows yet and is replaced by service_orders which carries both the original
-- request fields *and* the full quote/payment/delivery lifecycle on a single
-- row (status drives the UI).
-- ─────────────────────────────────────────────────────────────────────────

drop table if exists public.service_quote_requests;

-- ── services catalogue ───────────────────────────────────────────────────
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  tag text not null,
  title text not null,
  description text not null default '',
  about text not null default '',
  included jsonb not null default '[]'::jsonb,
  packages jsonb not null default '[]'::jsonb,
  price_starting int not null default 0,
  price_to int,
  price_suffix text,
  rating_avg real not null default 0,
  reviews_count int not null default 0,
  quote_sla_hours int not null default 24,
  booked_this_month int not null default 0,
  delivery_days text not null default '',
  payment_split text not null default '50/50',
  hero_gradient text not null default 'from-violet-500 via-fuchsia-500 to-pink-500',
  accent text not null default 'bg-slate-100 text-slate-600',
  icon_name text not null default 'Sparkles',
  is_active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_active_order_idx on public.services (is_active, display_order, created_at desc);
create index if not exists services_tag_idx on public.services (tag);

alter table public.services enable row level security;

drop policy if exists "services_read_public" on public.services;
create policy "services_read_public"
  on public.services for select
  using (is_active = true);

-- Writes go through service-role edge functions; no policy needed.

-- ── service_orders ───────────────────────────────────────────────────────
-- Sequence + helper for human-friendly order numbers like SVC-2026-0042.
create sequence if not exists service_orders_seq;

create or replace function public.generate_service_order_number()
returns text language plpgsql as $$
declare
  yr int := extract(year from now())::int;
  n int := nextval('service_orders_seq');
begin
  return 'SVC-' || yr || '-' || lpad(n::text, 4, '0');
end;
$$;

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default public.generate_service_order_number(),

  -- Catalogue snapshot — denormalised so renaming a service doesn't change
  -- the historical order title shown to the user.
  service_id uuid references public.services(id) on delete set null,
  service_slug text,
  service_title text,

  -- Requester
  user_id uuid not null references auth.users(id) on delete cascade,
  user_role text,

  -- Lifecycle:
  --   pending_quote        — user submitted, admin hasn't quoted yet
  --   quoted               — admin sent a quote, awaiting user
  --   counter_offered      — user sent a counter price; admin's turn
  --   declined             — admin rejected OR user declined
  --   expired              — quote_valid_until passed without action
  --   paid_advance         — user paid 50% advance (Stripe)
  --   in_progress          — admin acknowledged + working
  --   draft_ready          — admin delivered watermarked draft
  --   revision_requested   — user asked for changes
  --   paid_final           — final 50% paid; awaiting file delivery
  --   completed            — admin delivered final files; order closed
  status text not null default 'pending_quote',

  -- Request fields (from the influencer-side form)
  description text not null default '',
  asset_url text,
  scope text,
  desired_delivery_date date,
  budget_range text,
  style_references text,
  notes text,

  -- Quote response (admin)
  quoted_amount int,
  platform_fee_amount int,
  total_amount int,
  quote_message text,
  quote_valid_until timestamptz,
  quoted_delivery_date date,
  quoted_turnaround_days int,
  revisions_allowed int default 2,
  revisions_used int not null default 0,
  final_formats text,

  -- Counter-offer (user → admin)
  counter_amount int,
  counter_message text,

  -- Payment (Stripe one-time payments)
  advance_pct int not null default 50,
  advance_paid boolean not null default false,
  advance_paid_at timestamptz,
  advance_stripe_session_id text,
  final_paid boolean not null default false,
  final_paid_at timestamptz,
  final_stripe_session_id text,

  -- Deliverables
  draft_url text,
  draft_note text,
  final_files jsonb not null default '[]'::jsonb,  -- [{name, size, url}]
  completed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_orders_user_idx on public.service_orders (user_id, created_at desc);
create index if not exists service_orders_service_idx on public.service_orders (service_id, created_at desc);
create index if not exists service_orders_status_idx on public.service_orders (status);

alter table public.service_orders enable row level security;

drop policy if exists "service_orders_select_own" on public.service_orders;
create policy "service_orders_select_own"
  on public.service_orders for select
  using (auth.uid() = user_id);

drop policy if exists "service_orders_insert_own" on public.service_orders;
create policy "service_orders_insert_own"
  on public.service_orders for insert
  with check (auth.uid() = user_id);

-- All admin-side writes (status transitions, quote response, draft upload,
-- final files) go through service-role edge functions. Users can update
-- only a narrow set of columns themselves (currently nothing — they go
-- through edge functions too, for status transitions like counter_offered).

-- ── service_order_messages ───────────────────────────────────────────────
create table if not exists public.service_order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  sender_role text not null,  -- 'influencer' | 'brand' | 'admin' | 'system'
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists service_order_messages_order_idx on public.service_order_messages (order_id, created_at);

alter table public.service_order_messages enable row level security;

drop policy if exists "service_order_messages_read_own_orders" on public.service_order_messages;
create policy "service_order_messages_read_own_orders"
  on public.service_order_messages for select
  using (
    exists (
      select 1 from public.service_orders so
      where so.id = service_order_messages.order_id and so.user_id = auth.uid()
    )
  );

drop policy if exists "service_order_messages_insert_own_orders" on public.service_order_messages;
create policy "service_order_messages_insert_own_orders"
  on public.service_order_messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.service_orders so
      where so.id = service_order_messages.order_id and so.user_id = auth.uid()
    )
  );

-- ── service_order_events (timeline log) ──────────────────────────────────
create table if not exists public.service_order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.service_orders(id) on delete cascade,
  type text not null,
  label text not null,
  meta jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists service_order_events_order_idx on public.service_order_events (order_id, occurred_at);

alter table public.service_order_events enable row level security;

drop policy if exists "service_order_events_read_own_orders" on public.service_order_events;
create policy "service_order_events_read_own_orders"
  on public.service_order_events for select
  using (
    exists (
      select 1 from public.service_orders so
      where so.id = service_order_events.order_id and so.user_id = auth.uid()
    )
  );

-- Writes are admin/system-only via service role.

-- ── service_reviews ──────────────────────────────────────────────────────
create table if not exists public.service_reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique not null references public.service_orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  overall int not null check (overall between 1 and 5),
  quality int check (quality between 1 and 5),
  communication int check (communication between 1 and 5),
  on_time_delivery int check (on_time_delivery between 1 and 5),
  value_for_money int check (value_for_money between 1 and 5),
  text text,
  created_at timestamptz not null default now()
);

create index if not exists service_reviews_service_idx on public.service_reviews (service_id, created_at desc);

alter table public.service_reviews enable row level security;

drop policy if exists "service_reviews_read_public" on public.service_reviews;
create policy "service_reviews_read_public"
  on public.service_reviews for select
  using (true);

drop policy if exists "service_reviews_insert_own" on public.service_reviews;
create policy "service_reviews_insert_own"
  on public.service_reviews for insert
  with check (auth.uid() = user_id);

-- ── platform_config ──────────────────────────────────────────────────────
-- Single-row config table. We don't enforce a constraint that there's only
-- one row; instead each setting lives on its own key. Currently only the
-- platform-fee percent is needed.
create table if not exists public.platform_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table public.platform_config enable row level security;

drop policy if exists "platform_config_read_public" on public.platform_config;
create policy "platform_config_read_public"
  on public.platform_config for select
  using (true);

-- Writes via service role.

insert into public.platform_config (key, value)
values ('service_platform_fee_pct', '15')
on conflict (key) do nothing;

-- ── seed services from the previously-hardcoded lib ──────────────────────
insert into public.services (
  slug, tag, title, description, about, included, packages,
  price_starting, price_to, price_suffix,
  rating_avg, reviews_count, quote_sla_hours, booked_this_month,
  delivery_days, payment_split, hero_gradient, accent, icon_name, display_order
) values
  (
    'aesthetic-reel', 'CONTENT', 'Aesthetic Reel Production — Pro Video Editing',
    'Cinematic Reel edits from your raw footage — trending audio, dynamic captions, brand-tuned color',
    'High-quality cinematic Instagram Reels and YouTube edits crafted from your raw footage. We add trending audio, smooth transitions, dynamic captions, and brand-appropriate color grading. Final files delivered in 9:16 format optimized for Instagram (with thumbnail) and 16:9 for YouTube — whichever you need.',
    '[
      "Full edit of provided raw footage",
      "Trending audio licensing & sync",
      "Dynamic captions with custom typography",
      "Color grading to match brand tone",
      "Custom thumbnail design",
      "Up to 2 revision rounds",
      "Final files in 4K and Instagram-optimized formats"
    ]'::jsonb,
    '[
      {"name": "Basic Reel", "spec": "15-30 sec, 1 revision", "price": 2500},
      {"name": "Standard Reel", "spec": "30-60 sec, 2 revisions", "price": 4500},
      {"name": "Premium Reel Bundle", "spec": "3 reels, unlimited revisions", "price": 9000}
    ]'::jsonb,
    2500, 6000, null,
    4.9, 124, 4, 47,
    '3-7 d', '50/50',
    'from-violet-500 via-fuchsia-500 to-pink-500',
    'bg-rose-100 text-rose-600',
    'Film', 1
  ),
  (
    'social-media-management', 'MANAGEMENT', 'Social Media Page Management',
    'Full-service handling of your Instagram & Facebook page — posting, engagement, growth',
    'We run your brand''s day-to-day social presence so you don''t have to. Content calendar, post creation, scheduling, DM replies, comment moderation, and monthly performance reports. We treat your page like our own.',
    '[
      "Content calendar planning",
      "Post & Reel creation (8/mo on Starter)",
      "Daily DM & comment moderation",
      "Hashtag and audience strategy",
      "Engagement boosts during peak hours",
      "Monthly analytics report",
      "Quarterly strategy review call"
    ]'::jsonb,
    '[
      {"name": "Starter", "spec": "8 posts / month, 1 platform", "price": 8000},
      {"name": "Growth", "spec": "16 posts / month, 2 platforms", "price": 14000},
      {"name": "Premium", "spec": "Daily posting, 3 platforms + ads liaison", "price": 20000}
    ]'::jsonb,
    8000, 20000, '/mo',
    4.9, 67, 6, 12,
    'Ongoing', 'Monthly',
    'from-indigo-500 via-violet-500 to-fuchsia-500',
    'bg-violet-100 text-violet-600',
    'Instagram', 2
  ),
  (
    'meta-ads', 'ADS', 'Meta Ads Campaign Management',
    'Set up, run & optimize Instagram + Facebook ad campaigns for maximum ROAS',
    'We architect, launch and continuously optimize your Instagram and Facebook ad campaigns. Audience research, creative testing, bid strategy and weekly performance reports — focused entirely on driving ROAS rather than vanity metrics.',
    '[
      "Audience research & lookalike modelling",
      "Ad creative (3 variants per campaign)",
      "Campaign setup in Ads Manager",
      "Daily bid + budget optimization",
      "Weekly performance report",
      "Pixel & Conversions API verification",
      "Slack/WhatsApp updates"
    ]'::jsonb,
    '[
      {"name": "Single campaign", "spec": "₹25K – ₹1L ad spend managed", "price": 10000},
      {"name": "Always-on", "spec": "Up to ₹3L/mo ad spend", "price": 18000},
      {"name": "Performance retainer", "spec": "₹3L+/mo, full funnel", "price": 30000}
    ]'::jsonb,
    10000, 30000, null,
    4.8, 54, 6, 19,
    'Setup in 3 d', '50/50',
    'from-orange-500 via-rose-500 to-pink-500',
    'bg-orange-100 text-orange-600',
    'Target', 3
  ),
  (
    'graphic-design', 'DESIGN', 'Graphic Designing & Branding',
    'Logos, brand kits, social designs, thumbnails & visual identity',
    'Identity systems, social media collateral, thumbnails and digital ads — built by designers who specialize in creator-first brands. We deliver source files plus an asset library so your team can reuse them.',
    '[
      "Up to 3 concept rounds",
      "Source files (Figma + PDF/PNG/JPG)",
      "Color palette & typography spec",
      "Asset library on Google Drive",
      "Two rounds of refinement",
      "Commercial usage rights"
    ]'::jsonb,
    '[
      {"name": "Single design", "spec": "1 design, 2 revisions", "price": 2000},
      {"name": "10-pack", "spec": "10 social media designs", "price": 12000},
      {"name": "Full brand kit", "spec": "Logo + guidelines + 20 templates", "price": 25000}
    ]'::jsonb,
    2000, 25000, null,
    4.9, 112, 6, 34,
    '2-5 d', '50/50',
    'from-emerald-500 via-teal-500 to-cyan-500',
    'bg-emerald-100 text-emerald-600',
    'Palette', 4
  ),
  (
    'brand-audit', 'STRATEGY', 'Personal Brand Audit & Content Roadmap',
    'Audit of your presence + 30-day content roadmap with hooks & ideas',
    'A deep-dive into your current social presence — what''s working, what''s not, where the opportunities are — followed by a 30-day content roadmap with specific hooks, formats and posting cadence. Built around your goals (followers, leads, brand deals).',
    '[
      "Audit deck (~30 slides)",
      "Audience persona breakdown",
      "Competitor benchmark (5 creators)",
      "30-day content calendar",
      "Hook library (50+ ideas)",
      "60-minute strategy call"
    ]'::jsonb,
    '[
      {"name": "Audit", "spec": "Audit deck only", "price": 2500},
      {"name": "Audit + Roadmap", "spec": "Audit + 30-day plan", "price": 6000},
      {"name": "Quarterly retainer", "spec": "Audit + 90-day plan + monthly calls", "price": 10000}
    ]'::jsonb,
    2500, 10000, null,
    5.0, 210, 12, 28,
    '5-7 d', '100% upfront',
    'from-amber-500 via-orange-500 to-rose-500',
    'bg-amber-100 text-amber-600',
    'LineChart', 5
  ),
  (
    'product-photography', 'CONTENT', 'Product Photography & Videography',
    'Professional product shoots — studio-quality photos & videos for your brand',
    'Studio shoots with our network of product photographers across Mumbai, Delhi and Bangalore. Lifestyle and pack-shot setups, editing and rights bundled.',
    '[
      "Shoot brief + moodboard sign-off",
      "Studio + photographer + stylist",
      "Edited final images (10-30 depending on package)",
      "Square + 9:16 + 16:9 crops",
      "Commercial usage rights",
      "One round of edit revisions"
    ]'::jsonb,
    '[
      {"name": "Basic", "spec": "10 product shots, 1 setup", "price": 5000},
      {"name": "Lifestyle", "spec": "20 shots + 3 setups", "price": 12000},
      {"name": "Campaign", "spec": "30 shots + reel + setups", "price": 25000}
    ]'::jsonb,
    5000, 25000, null,
    4.9, 142, 6, 23,
    '5-10 d', '50/50',
    'from-pink-500 via-rose-500 to-orange-500',
    'bg-rose-100 text-rose-600',
    'Camera', 6
  ),
  (
    'content-writing', 'WRITING', 'Content Writing & Captions',
    'Hooks, captions, scripts and blog content tailored to your brand voice',
    'Captions that stop the scroll, scripts that perform, blogs that rank. We work from your brand tone-of-voice doc (or build one with you on the first call).',
    '[
      "Tone-of-voice alignment",
      "SEO research for blog work",
      "Two revision rounds",
      "Hook library bundled free",
      "Hashtag suggestions"
    ]'::jsonb,
    '[
      {"name": "Captions pack", "spec": "10 captions + hooks", "price": 1500},
      {"name": "Script pack", "spec": "5 reel/video scripts", "price": 4000},
      {"name": "Blog bundle", "spec": "4 SEO blogs, 1000 words each", "price": 12000}
    ]'::jsonb,
    1500, 12000, null,
    4.8, 89, 6, 18,
    '2-5 d', '100% upfront',
    'from-sky-500 via-blue-500 to-indigo-500',
    'bg-sky-100 text-sky-600',
    'PenSquare', 7
  ),
  (
    'influencer-marketing', 'MARKETING', 'Influencer Marketing Campaigns',
    'End-to-end campaign management with vetted creators in your niche',
    'We shortlist, contract and manage creator campaigns end-to-end — briefing, content approvals, posting schedule, performance tracking and final reporting in one place.',
    '[
      "Creator shortlist (10-15 vetted profiles)",
      "Brief deck + brand guidelines",
      "Negotiation & contracts",
      "Content review + approval flow",
      "Performance tracking (reach, ER, CPM)",
      "Final wrap report"
    ]'::jsonb,
    '[
      {"name": "Pilot", "spec": "3 nano creators, 1 reel each", "price": 15000},
      {"name": "Standard", "spec": "10 micro creators, multi-deliverable", "price": 60000},
      {"name": "Full campaign", "spec": "25+ creators, integrated launch", "price": 100000}
    ]'::jsonb,
    15000, 100000, null,
    4.9, 47, 12, 9,
    '3-6 weeks', 'Milestones',
    'from-fuchsia-500 via-pink-500 to-rose-500',
    'bg-pink-100 text-pink-600',
    'Megaphone', 8
  ),
  (
    'podcast-production', 'AUDIO', 'Podcast Editing & Production',
    'Editing, mastering, episode artwork & distribution support',
    'Send us raw recordings, get back broadcast-quality episodes — noise removal, leveling, mastering, intro/outro splicing, chapter markers and ready-to-publish files for Spotify and Apple Podcasts.',
    '[
      "Noise removal & leveling",
      "Mastering to broadcast standard",
      "Intro / outro splicing",
      "Episode artwork",
      "Chapter markers",
      "Show notes + transcript"
    ]'::jsonb,
    '[
      {"name": "Single episode", "spec": "Up to 60 min", "price": 3500},
      {"name": "Series", "spec": "4 episodes / month", "price": 10000},
      {"name": "Full production", "spec": "8 episodes + distribution support", "price": 15000}
    ]'::jsonb,
    3500, 15000, null,
    4.8, 38, 12, 11,
    '3-5 d', '50/50',
    'from-indigo-500 via-blue-500 to-cyan-500',
    'bg-indigo-100 text-indigo-600',
    'Mic', 9
  )
on conflict (slug) do nothing;

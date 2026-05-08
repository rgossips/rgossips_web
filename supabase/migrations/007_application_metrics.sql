-- Per-application Instagram metrics, cached after the influencer's live links
-- are posted. Refreshed by the refresh-application-metrics edge function.
--
-- Shape of `metrics` (jsonb):
--   {
--     "reach":        12345,            -- summed across submission links
--     "likes":        890,
--     "comments":     45,
--     "saves":        20,
--     "shares":       12,
--     "interactions": 967,              -- likes + comments + saves + shares (or total_interactions when available)
--     "engagement":   7.83,             -- (interactions / reach) * 100, rounded to 2dp
--     "perLink": [                      -- one entry per matched link
--       { "url": "...", "media_id": "...", "media_product_type": "REELS",
--         "reach": 12000, "likes": 850, "comments": 40, "saves": 18, "shares": 12, "interactions": 920 }
--     ],
--     "errors": ["unmatched permalink: https://..."]   -- non-fatal, optional
--   }

alter table public.campaign_applications
  add column if not exists metrics jsonb,
  add column if not exists metrics_refreshed_at timestamptz;

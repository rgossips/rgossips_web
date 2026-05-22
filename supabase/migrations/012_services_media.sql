-- Media columns on services: a single featured/hero image (overrides the
-- gradient placeholder when present) and an ordered gallery that mixes
-- uploaded images and pasted video URLs.
--
-- gallery shape (jsonb array):
--   [
--     { "type": "image", "url": "https://...", "caption": "" },
--     { "type": "video", "url": "https://youtu.be/...", "caption": "Behind the scenes" }
--   ]

alter table public.services
  add column if not exists featured_image_url text,
  add column if not exists gallery jsonb not null default '[]'::jsonb;

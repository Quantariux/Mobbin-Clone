-- Per-screen metadata captured by the crawler: the page's own title and
-- meta description power the "Description" panel in the screen modal.
-- Run once in the Supabase SQL editor.

alter table screens add column if not exists title text;
alter table screens add column if not exists description text;
alter table screens add column if not exists page_url text;

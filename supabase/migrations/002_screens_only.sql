-- Screens-only cleanup: the app no longer uses UI elements or flows.
-- Run in the Supabase SQL editor AFTER deploying the screens-only frontend.
-- Safe to run once; drops the four now-unused tables and their policies.

drop table if exists screen_ui_elements;
drop table if exists flow_screens;
drop table if exists ui_elements;
drop table if exists flows;

-- Maintenance requests are assigned to a member who owns getting them done.
-- New requests default to Ryan Mccarty; existing rows are backfilled with the
-- same default by this ALTER.
--
-- The name is spelled to match profiles.full_name exactly ("Mccarty", not
-- "McCarty") — assignments are validated against the roster, and the run log,
-- profile pages and check history all key off that same spelling.
alter table maintenance_requests
  add column assigned_to text default 'Ryan Mccarty';

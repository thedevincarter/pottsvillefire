-- Corrects the assignee spelling seeded by maintenance-requests-assignment.sql.
-- The roster row is "Ryan Mccarty", and assignments are validated against
-- profiles.full_name, so "Ryan McCarty" matched nobody.
update maintenance_requests
  set assigned_to = 'Ryan Mccarty'
  where assigned_to = 'Ryan McCarty';

alter table maintenance_requests
  alter column assigned_to set default 'Ryan Mccarty';

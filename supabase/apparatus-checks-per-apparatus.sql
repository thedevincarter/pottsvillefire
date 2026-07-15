-- Add apparatus_id to check_items to make checklists per-apparatus
alter table check_items add column apparatus_id uuid references apparatus(id);

-- If you have existing check_items, you'll need to assign them to an apparatus
-- or delete them and recreate per-apparatus.

-- Make apparatus_id required going forward
-- (run this after assigning existing rows, or if table is empty)
alter table check_items alter column apparatus_id set not null;

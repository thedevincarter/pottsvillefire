-- Allow checklist items to nest one level: an item with children becomes a
-- section header and is not itself pass/fail — only leaf items are answered.
alter table check_items
  add column parent_id uuid references check_items(id) on delete cascade;

-- Speeds up the per-apparatus checklist reads, which now also group by parent.
create index check_items_parent_id_idx on check_items (parent_id);

-- Rework training fields: drop the single "type" in favor of a richer set.
alter table trainings drop column if exists type;

alter table trainings add column total_hours numeric;
alter table trainings add column subjects text[] not null default '{}';
alter table trainings add column automatic_aid boolean not null default false;
alter table trainings add column day_night text; -- 'Day' | 'Night' | null
alter table trainings add column sub_groups text[] not null default '{}';
alter table trainings add column instructors text;
alter table trainings add column additional_departments text;

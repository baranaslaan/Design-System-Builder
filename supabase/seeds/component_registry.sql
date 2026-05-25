-- One-time seed for the Adoption analytics "available components" list.
-- Run AFTER signing in. auth.uid() resolves to the calling user.
-- Adjust the list to match your actual design system surface.
--
-- Studio: Authentication → log in as the target user → SQL Editor → paste → Run.

insert into public.component_registry (user_id, component_name, source, category) values
  (auth.uid(), 'Button',     'design-system', 'forms'),
  (auth.uid(), 'Card',       'design-system', 'layout'),
  (auth.uid(), 'Input',      'design-system', 'forms'),
  (auth.uid(), 'Badge',      'design-system', 'feedback'),
  (auth.uid(), 'Alert',      'design-system', 'feedback'),
  (auth.uid(), 'Tooltip',    'design-system', 'overlay'),
  (auth.uid(), 'Modal',      'design-system', 'overlay'),
  (auth.uid(), 'Tabs',       'design-system', 'navigation'),
  (auth.uid(), 'Accordion',  'design-system', 'disclosure'),
  (auth.uid(), 'Avatar',     'design-system', 'media'),
  (auth.uid(), 'Progress',   'design-system', 'feedback'),
  (auth.uid(), 'Toast',      'design-system', 'feedback'),
  (auth.uid(), 'Select',     'design-system', 'forms'),
  (auth.uid(), 'Checkbox',   'design-system', 'forms'),
  (auth.uid(), 'Switch',     'design-system', 'forms')
on conflict (user_id, component_name, source) do nothing;

-- Optional: a few starter snapshots so the Adoption trend chart isn't empty.
-- Comment out if you'd rather build history organically from real scans.
insert into public.adoption_snapshots (user_id, taken_at, rate, used_count, available_count) values
  (auth.uid(), current_date - 6, 0.30, 4, 15),
  (auth.uid(), current_date - 4, 0.45, 6, 15),
  (auth.uid(), current_date - 2, 0.55, 8, 15),
  (auth.uid(), current_date,     0.66, 10, 15)
on conflict do nothing;

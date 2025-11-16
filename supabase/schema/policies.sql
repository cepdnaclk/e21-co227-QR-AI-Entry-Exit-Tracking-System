-- This policy allows both anonymous and authenticated users
-- to perform ALL operations (SELECT, INSERT, UPDATE, DELETE)
-- on the public.EntryExitLog table. The USING and WITH CHECK
-- expressions are set to TRUE, meaning no row-level restrictions
-- are applied. This effectively makes the table fully open.

alter policy "Allow all operations on EntryExitLog"
on "public"."EntryExitLog"
to anon, authenticated
using (
  true
)
with check (
  true
);


-- This policy allows ALL roles (public) to INSERT new rows
-- into the public.EntryExitLog table. The WITH CHECK expression
-- is set to TRUE, meaning any insert is allowed without restriction.
-- No SELECT, UPDATE, or DELETE permissions are granted by this policy.

alter policy "Allow everyone to insert logs"
on "public"."EntryExitLog"
to public
with check (
  true
);

-- This policy allows ALL roles (public) to SELECT/view rows
-- from the public.EntryExitLog table. The USING expression is
-- set to TRUE, meaning every row is visible to everyone.
-- No INSERT, UPDATE, or DELETE permissions are granted by this policy.

alter policy "Allow everyone to view logs"
on "public"."EntryExitLog"
to public
using (
  true
);

-- Allow anyone (any authenticated or anonymous user) to insert rows into public.BUILDING
alter policy "Allow everyone to insert buildings"
on "public"."BUILDING"
to public
with check (
  true
);


-- Allow anyone (any authenticated or anonymous user) to update rows in public.BUILDING
alter policy "Allow everyone to update buildings"
on "public"."BUILDING"
to public
using (
  true
) with check (
  true
);

-- Allow anyone (any authenticated or anonymous user) to view rows in public.BUILDING
alter policy "Allow everyone to view buildings"
on "public"."BUILDING"
to public
using (
  true
);

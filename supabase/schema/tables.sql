-- This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.BUILDING (
  building_id text NOT NULL,
  dept_name text NOT NULL,
  total_count bigint NOT NULL DEFAULT '0'::bigint,
  count_per_day bigint NOT NULL DEFAULT '0'::bigint,
  CONSTRAINT BUILDING_pkey PRIMARY KEY (building_id)
);

CREATE TABLE public.EntryExitLog (
  tag_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  building_id text NOT NULL DEFAULT ''''''' ''''''::text'::text,
  entry_time timestamp without time zone NOT NULL DEFAULT now(),
  exit_time timestamp without time zone,
  direction text,
  CONSTRAINT EntryExitLog_pkey PRIMARY KEY (tag_id, building_id, entry_time)
);
-- ============================================================================
-- EduTicket · Database schema
-- Postgres / Supabase — run this in the project's SQL Editor.
-- Order: this file first, then 02_seed.sql
-- ============================================================================

create extension if not exists pgcrypto; -- for gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Sessions: a single one for now (16/10/2026, capacity 30). The table exists
-- so a second session can be opened without touching the code if demand calls
-- for it.
-- ---------------------------------------------------------------------------
create table if not exists sessions (
  id         uuid primary key default gen_random_uuid(),
  name       text        not null,
  starts_at  timestamptz not null,
  capacity   integer     not null check (capacity > 0),
  active     boolean     not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Seats: all 30 are created up front. Registering = claiming one.
-- This is what makes exceeding the capacity impossible (see claim_seat).
-- ---------------------------------------------------------------------------
create table if not exists seats (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid    not null references sessions (id) on delete cascade,
  number     integer not null,
  taken      boolean not null default false,
  unique (session_id, number)
);

-- Partial index: only free seats are indexed, which is all we ever search for.
create index if not exists seats_free_idx on seats (session_id, number) where not taken;

-- ---------------------------------------------------------------------------
-- Attendees
-- ---------------------------------------------------------------------------
do $$ begin
  create type grade_t as enum ('8vo', '9no', '10mo');
exception when duplicate_object then null;
end $$;

create table if not exists attendees (
  id            uuid primary key default gen_random_uuid(),
  first_names   text    not null,
  last_names    text    not null,
  grade         grade_t not null,
  section       text    not null,
  session_id    uuid    not null references sessions (id) on delete cascade,
  seat_id       uuid    not null unique references seats (id),
  ticket_code   text    not null unique,
  created_at    timestamptz not null default now(),
  checked_in_at timestamptz            -- set when the QR is scanned at the door
);

-- One person, one ticket: registering twice returns the same one.
create unique index if not exists attendees_no_duplicates_idx
  on attendees (session_id, lower(first_names), lower(last_names), grade, section);

-- ---------------------------------------------------------------------------
-- Book catalogue (editable from the admin panel, no code changes needed)
-- ---------------------------------------------------------------------------
create table if not exists books (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  author      text,
  synopsis    text,
  cover_url   text,
  trailer_url text,
  presenter   text,
  copies      integer not null default 1 check (copies >= 0),
  accent      text    not null default 'gold' check (accent in ('gold', 'abyss', 'magenta')),
  sort_order  integer not null default 0
);

-- ---------------------------------------------------------------------------
-- Book loans
-- ---------------------------------------------------------------------------
do $$ begin
  create type loan_status as enum ('requested', 'delivered', 'returned');
exception when duplicate_object then null;
end $$;

create table if not exists loans (
  id           uuid primary key default gen_random_uuid(),
  attendee_id  uuid not null references attendees (id) on delete cascade,
  book_id      uuid not null references books (id),
  status       loan_status not null default 'requested',
  requested_at timestamptz not null default now(),
  delivered_at timestamptz,
  returned_at  timestamptz,
  note         text,
  unique (attendee_id, book_id)
);

-- ---------------------------------------------------------------------------
-- Waiting list: for whoever arrives once the seats are gone
-- ---------------------------------------------------------------------------
create table if not exists waitlist (
  id          uuid primary key default gen_random_uuid(),
  first_names text    not null,
  last_names  text    not null,
  grade       grade_t not null,
  section     text    not null,
  session_id  uuid    not null references sessions (id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- ============================================================================
-- The key function: claim a seat atomically.
--
-- Why a function instead of "count, then compare": if two people submit the
-- form in the same second, counting first and deciding afterwards lets both
-- through. Here UPDATE ... FOR UPDATE SKIP LOCKED locks the row, so a seat can
-- only ever be handed out once.
--
-- Returns 0 rows when the session is full.
-- ============================================================================
create or replace function claim_seat(
  p_session_id  uuid,
  p_first_names text,
  p_last_names  text,
  p_grade       grade_t,
  p_section     text
)
returns table (ticket text, seat_number integer, already_existed boolean)
language plpgsql
as $$
declare
  v_seat_id uuid;
  v_number  integer;
  v_ticket  text;
  v_first   text := btrim(p_first_names);
  v_last    text := btrim(p_last_names);
  v_section text := upper(btrim(p_section));
begin
  -- 1) Already registered? Hand back the very same ticket.
  select a.ticket_code, s.number
    into v_ticket, v_number
    from attendees a
    join seats s on s.id = a.seat_id
   where a.session_id = p_session_id
     and lower(a.first_names) = lower(v_first)
     and lower(a.last_names)  = lower(v_last)
     and a.grade   = p_grade
     and a.section = v_section;

  if found then
    return query select v_ticket, v_number, true;
    return;
  end if;

  -- 2) Take the first free seat. The lock prevents double assignment.
  update seats s
     set taken = true
   where s.id = (
           select s2.id
             from seats s2
            where s2.session_id = p_session_id
              and not s2.taken
            order by s2.number
            limit 1
            for update skip locked
         )
  returning s.id, s.number into v_seat_id, v_number;

  -- No free seat: the session is full, return 0 rows.
  if v_seat_id is null then
    return;
  end if;

  -- 3) Human-readable code: ET-9B-14 (grade + section + seat number)
  v_ticket := 'ET-'
              || regexp_replace(p_grade::text, '\D', '', 'g')
              || v_section
              || '-'
              || lpad(v_number::text, 2, '0');

  insert into attendees (first_names, last_names, grade, section, session_id, seat_id, ticket_code)
  values (v_first, v_last, p_grade, v_section, p_session_id, v_seat_id, v_ticket);

  return query select v_ticket, v_number, false;
end;
$$;

-- ============================================================================
-- Security: RLS enabled and NO policies.
--
-- Effect: the public (anon) key can read and write NOTHING. The whole app goes
-- in through the service role key from the Next.js server, which bypasses RLS.
-- That way nobody can pull the attendee list from the browser console.
-- ============================================================================
alter table sessions  enable row level security;
alter table seats     enable row level security;
alter table attendees enable row level security;
alter table books     enable row level security;
alter table loans     enable row level security;
alter table waitlist  enable row level security;

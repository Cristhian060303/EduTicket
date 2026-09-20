-- ============================================================================
-- EduTicket · Migration 03 — unguessable ticket links
--
-- Run this in the Supabase SQL Editor if 01_schema.sql was already applied.
-- On a fresh install 01_schema.sql already includes everything here, and this
-- file is a harmless no-op.
--
-- Why: the readable code (ET-9B-14) is grade + section + seat number, so it
-- can be guessed by counting. Anyone could walk ET-8A-01 … ET-10D-30 and read
-- the name of every attendee, who are minors. The ticket page is therefore
-- addressed by a random token, while the readable code stays on the ticket
-- for calling out at the door.
-- ============================================================================

-- 16 random hex characters: 64 bits, not worth guessing.
alter table attendees
  add column if not exists token text not null default encode(gen_random_bytes(8), 'hex');

create unique index if not exists attendees_token_idx on attendees (token);

-- Updated version of the function: it now also returns the token.
--
-- It has to be dropped first: Postgres refuses to change the return type of an
-- existing function with CREATE OR REPLACE ("cannot change return type of
-- existing function"), and adding `token` to the returned row is exactly that.
-- Dropping a function does not touch any data.
drop function if exists claim_seat(uuid, text, text, grade_t, text);

create or replace function claim_seat(
  p_session_id  uuid,
  p_first_names text,
  p_last_names  text,
  p_grade       grade_t,
  p_section     text
)
returns table (ticket text, token text, seat_number integer, already_existed boolean)
language plpgsql
as $$
declare
  v_seat_id uuid;
  v_number  integer;
  v_ticket  text;
  v_token   text;
  v_first   text := btrim(p_first_names);
  v_last    text := btrim(p_last_names);
  v_section text := upper(btrim(p_section));
begin
  -- 1) Already registered? Hand back the very same ticket.
  select a.ticket_code, a.token, s.number
    into v_ticket, v_token, v_number
    from attendees a
    join seats s on s.id = a.seat_id
   where a.session_id = p_session_id
     and lower(a.first_names) = lower(v_first)
     and lower(a.last_names)  = lower(v_last)
     and a.grade   = p_grade
     and a.section = v_section;

  if found then
    return query select v_ticket, v_token, v_number, true;
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

  v_token := encode(gen_random_bytes(8), 'hex');

  insert into attendees (first_names, last_names, grade, section, session_id, seat_id, ticket_code, token)
  values (v_first, v_last, p_grade, v_section, p_session_id, v_seat_id, v_ticket, v_token);

  return query select v_ticket, v_token, v_number, false;
end;
$$;

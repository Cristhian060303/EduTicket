-- ============================================================================
-- EduTicket · Clearing attendee data
--
-- Run in the Supabase SQL Editor. Pick ONE of the two blocks below.
--
-- Two moments call for this:
--   1. Wiping test registrations before the event.
--   2. Deleting the students' personal data once the event is over and every
--      book has come back — the project promised to keep nothing afterwards.
--
-- It never touches the catalogue or the session: the seats are freed, not
-- deleted, so registration keeps working straight away.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- OPTION A — wipe everything (test reset / post-event cleanup)
-- ---------------------------------------------------------------------------

begin;

-- Loans point at attendees with ON DELETE CASCADE, so they go with them.
delete from attendees;
delete from waitlist;

-- Free every seat: deleting an attendee does not release their seat by itself.
update seats set taken = false where taken;

commit;

-- ---------------------------------------------------------------------------
-- OPTION B — remove a single person (they cancelled, or a typo in the name)
-- Replace the name, uncomment, and run instead of option A.
-- ---------------------------------------------------------------------------

-- begin;
--
-- update seats
--    set taken = false
--  where id in (
--    select seat_id from attendees
--     where lower(first_names) = lower('Ana María')
--       and lower(last_names)  = lower('Pérez Chávez')
--  );
--
-- delete from attendees
--  where lower(first_names) = lower('Ana María')
--    and lower(last_names)  = lower('Pérez Chávez');
--
-- commit;

-- ---------------------------------------------------------------------------
-- Check the result
-- ---------------------------------------------------------------------------
select (select count(*) from attendees)                   as attendees,
       (select count(*) from waitlist)                    as waitlist,
       (select count(*) from seats where not taken)       as seats_free,
       (select count(*) from seats)                       as seats_total;

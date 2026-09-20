-- ============================================================================
-- EduTicket · Seed data
-- Run AFTER 01_schema.sql. Safe to run again: it won't duplicate anything.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- The single session: Friday 16 October 2026, 07:00 (Ecuador, UTC-5)
-- ---------------------------------------------------------------------------
insert into sessions (name, starts_at, capacity)
select 'Zona Literaria — 16 de octubre', timestamptz '2026-10-16 07:00:00-05', 30
where not exists (select 1 from sessions);

-- ---------------------------------------------------------------------------
-- The 30 seats for that session (skipped if they already exist)
-- ---------------------------------------------------------------------------
insert into seats (session_id, number)
select s.id, n
  from sessions s
 cross join generate_series(1, s.capacity) as n
 where not exists (
   select 1 from seats seat where seat.session_id = s.id and seat.number = n
 );

-- ---------------------------------------------------------------------------
-- Catalogue
-- The empty fields (presenter, trailer_url, the dinosaur cover) get filled in
-- from the admin panel once the team hands them over.
-- ---------------------------------------------------------------------------
insert into books (slug, title, author, synopsis, cover_url, accent, sort_order, copies)
values
  (
    'veinte-mil-leguas',
    'Veinte mil leguas de viaje submarino',
    'Jules Verne',
    'Un profesor, su criado y un arponero acaban prisioneros del Nautilus, el submarino del enigmático capitán Nemo. Bajo la superficie los espera un mundo de bosques de coral, ciudades hundidas y criaturas que nadie ha visto jamás.',
    '/covers/veinte-mil-leguas.jpg',
    'abyss',
    1,
    1
  ),
  (
    'el-hobbit',
    'El Hobbit',
    'J.R.R. Tolkien',
    'Bilbo Bolsón vivía tranquilo en su agujero hobbit hasta que un mago y trece enanos lo arrastraron a recuperar un tesoro custodiado por el dragón Smaug. Volvió siendo otro, y con un anillo en el bolsillo.',
    '/covers/el-hobbit.jpg',
    'gold',
    2,
    1
  ),
  (
    'enciclopedia-dinosaurios',
    'Enciclopedia de dinosaurios',
    'Edición por confirmar',
    'Ciento sesenta millones de años de historia en un solo volumen: desde el Triásico hasta el asteroide que lo cambió todo, con las criaturas que dominaron el planeta mucho antes que nosotros.',
    null,
    'magenta',
    3,
    1
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Quick sanity check
-- ---------------------------------------------------------------------------
select s.name,
       s.capacity,
       count(seat.*)                             as seats_created,
       count(seat.*) filter (where not seat.taken) as seats_free,
       (select count(*) from books)              as books_loaded
  from sessions s
  left join seats seat on seat.session_id = s.id
 group by s.id, s.name, s.capacity;

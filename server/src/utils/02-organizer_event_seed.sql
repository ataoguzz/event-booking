ALTER TABLE events
  ADD CONSTRAINT events_title_start_key UNIQUE (title, start_at);

CREATE OR REPLACE FUNCTION seed_organizer(
    p_email        TEXT,
    p_password     TEXT,
    p_display_name TEXT,
    p_bio          TEXT,
    p_avatar_url   TEXT)
RETURNS BIGINT LANGUAGE plpgsql AS
$$
DECLARE acct_id BIGINT;
BEGIN
  INSERT INTO accounts (email, password_hash, role)
  VALUES (p_email, p_password, 'organizer')
  ON CONFLICT (email) DO UPDATE
  SET password_hash = EXCLUDED.password_hash
  RETURNING account_id INTO acct_id;

  INSERT INTO organizers (account_id, display_name, bio, avatar_url)
  VALUES (acct_id, p_display_name, p_bio, p_avatar_url)
  ON CONFLICT (account_id) DO UPDATE
  SET display_name = EXCLUDED.display_name,
      bio          = EXCLUDED.bio,
      avatar_url   = EXCLUDED.avatar_url;

  RETURN acct_id;
END $$;


SELECT seed_organizer('stageco@example.com'  ,'hashed','StageCo Live'           ,'Large-scale concerts and festivals', 'https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png');
SELECT seed_organizer('capital@example.com'  ,'hashed','Capital Events'         ,'Open-air classical & family shows', 'https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png');
SELECT seed_organizer('bluenote@example.com' ,'hashed','Blue Note Presents'     ,'Legendary jazz nights worldwide', 'https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png');
SELECT seed_organizer('olympia@example.com'  ,'hashed','Olympia Prod'           ,'Iconic Parisian venue producers', 'https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png');
SELECT seed_organizer('oldvic@example.com'   ,'hashed','Old Vic Theatre'        ,'Classic and contemporary plays', 'https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png');
SELECT seed_organizer('elb@example.com'      ,'hashed','Elbphilharmonie Studio' ,'Chamber and avant-garde series', 'https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png');

DROP FUNCTION seed_organizer;

CREATE OR REPLACE FUNCTION seed_event(
    p_org_email TEXT,
    p_venue_name TEXT,
    p_category event_category_enum,
    p_title TEXT,
    p_desc TEXT,
    p_rules TEXT,
    p_start TIMESTAMPTZ,
    p_end   TIMESTAMPTZ,
    p_base  NUMERIC,
    p_status event_status_enum DEFAULT 'PUBLISHED',
    p_hero  TEXT DEFAULT NULL)
RETURNS BIGINT LANGUAGE plpgsql AS
$$
DECLARE ev BIGINT;
BEGIN
  INSERT INTO events (
      organizer_account_id,
      venue_id,
      category, title, description, rules,
      start_at, end_at,
      status, base_price,
      hero_image_url)
  SELECT o.account_id,
         v.venue_id,
         p_category, p_title, p_desc, p_rules,
         p_start, p_end,
         p_status, p_base,
         p_hero
  FROM   organizers o
  JOIN   venues     v ON v.name = p_venue_name
  WHERE  o.account_id =
         (SELECT account_id FROM accounts WHERE email = p_org_email)
  ON CONFLICT (title, start_at) DO NOTHING
  RETURNING event_id INTO ev;

  IF ev IS NULL THEN
     SELECT event_id
     INTO   ev
     FROM   events
     WHERE  title = p_title AND start_at = p_start;
  END IF;

  RETURN ev;
END $$;

CREATE OR REPLACE FUNCTION add_image(p_event_id BIGINT, p_url TEXT)
RETURNS VOID LANGUAGE plpgsql AS
$$
BEGIN
  INSERT INTO event_images(event_id, url)
  VALUES (p_event_id, p_url)
  ON CONFLICT DO NOTHING;
END $$;



\set dome_event   :'"Arctic Monkeys Live"'          
SELECT seed_event('stageco@example.com',
                  'Sinan Erdem Dome',
                  'CONCERT',
                  'Arctic Monkeys Live',
                  'Global indie-rock tour stop in Istanbul.',
                  'No professional cameras, bags < 30×30 cm.',
                  '2025-09-15 20:00+03',
                  '2025-09-15 23:00+03',
                  500,
                  'PUBLISHED',
                  'https://upload.wikimedia.org/wikipedia/commons/0/04/Arctic_Monkeys_-_Orange_Stage_-_Roskilde_Festival_2014.jpg') AS dome_eid  \gset

SELECT add_image(:'dome_eid', 'https://upload.wikimedia.org/wikipedia/commons/0/04/Arctic_Monkeys_-_Orange_Stage_-_Roskilde_Festival_2014.jpg');



SELECT seed_event('stageco@example.com',
                  'Volkswagen Arena',
                  'STANDUP',
                  'Cem Yılmaz Live',
                  'Turkey’s most famous comedian returns.',
                  '18+ event • no video recording.',
                  '2025-06-05 20:30+03',
                  '2025-06-05 22:30+03',
                  350,
                  'PUBLISHED',
                  'https://m.media-amazon.com/images/S/pv-target-images/d16059d71544a67bfad0f965d1b7e03c09524fda979ff36dfbcda40e20c8de3c._SX1080_FMjpg_.jpg') AS standup_eid  \gset

SELECT add_image(:'standup_eid', 'https://m.media-amazon.com/images/S/pv-target-images/d16059d71544a67bfad0f965d1b7e03c09524fda979ff36dfbcda40e20c8de3c._SX1080_FMjpg_.jpg');


SELECT seed_event('capital@example.com',
                  'Ankara Spor Salonu',
                  'SPORTS',
                  'FIBA EuroBasket Qualifier',
                  'National basketball team home game.',
                  'Turkey jerseys encouraged.',
                  '2025-11-12 19:00+03',
                  '2025-11-12 21:30+03',
                  250,
                  'PUBLISHED',
                  'https://cdnuploads.aa.com.tr/uploads/Contents/2020/01/23/thumbs_b_c_71c1fef68b9fc9f77a955794d31cf9e4.jpg?v=165715') AS euro_eid  \gset

SELECT add_image(:'euro_eid', 'https://cdnuploads.aa.com.tr/uploads/Contents/2020/01/23/thumbs_b_c_71c1fef68b9fc9f77a955794d31cf9e4.jpg?v=165715');



SELECT seed_event('capital@example.com',
                  'Kültürpark Açıkhava',
                  'CONCERT',
                  'Izmir Symphony Open-Air',
                  'Classical favourites under the stars.',
                  'No glass bottles.',
                  '2025-08-02 21:00+03',
                  '2025-08-02 23:00+03',
                  200,
                  'PUBLISHED',
                  'https://www.denizbank.com/medium/GalleryImage-Image-69-2x.vsf') AS sym_eid  \gset

SELECT add_image(:'sym_eid', 'https://www.denizbank.com/medium/GalleryImage-Image-69-2x.vsf');



SELECT seed_event('stageco@example.com',
                  'İstanbul Park Festival Grounds',
                  'FESTIVAL',
                  'Urban Sound Festival',
                  'Two stages • 20 acts • street-food bazaar.',
                  'No outside food or drinks.',
                  '2025-07-10 14:00+03',
                  '2025-07-12 02:00+03',
                  750,
                  'PUBLISHED',
                  'https://www.pausedergi.com/wp-content/uploads/2024/05/p-40.jpg') AS usf_eid  \gset

SELECT add_image(:'usf_eid', 'https://www.pausedergi.com/wp-content/uploads/2024/05/p-40.jpg');




SELECT seed_event('bluenote@example.com',
                  'Blue Note Jazz Club',
                  'CONCERT',
                  'Herbie Hancock Quartet',
                  'An intimate set with the jazz legend.',
                  'Two-drink minimum.',
                  '2025-08-20 19:30-04',
                  '2025-08-20 22:00-04',
                  120,
                  'PUBLISHED',
                  'https://qtxasset.com/quartz/qcloud1/media/image/New%20Morning%20%C2%A9LEOFAVREAU-14.jpg?VersionId=GfScVyaE04XjqoEn7kSIthaCBWzdFoL4') AS hh_eid  \gset

SELECT add_image(:'hh_eid', 'https://qtxasset.com/quartz/qcloud1/media/image/New%20Morning%20%C2%A9LEOFAVREAU-14.jpg?VersionId=GfScVyaE04XjqoEn7kSIthaCBWzdFoL4');



-- L’Olympia
SELECT seed_event('olympia@example.com',
                  'L''Olympia',
                  'CONCERT',
                  'French Pop Evening',
                  'A night of contemporary chanson hits.',
                  'Bags subject to search.',
                  '2025-10-01 20:00+02',
                  '2025-10-01 22:30+02',
                  90,
                  'PUBLISHED',
                  'https://www.voilah.sg/wp-content/uploads/2020/10/WhatsApp-Image-2020-10-08-at-3.56.18-PM-650x511.jpeg') AS pop_eid  \gset

SELECT add_image(:'pop_eid', 'https://www.voilah.sg/wp-content/uploads/2020/10/WhatsApp-Image-2020-10-08-at-3.56.18-PM-650x511.jpeg');



SELECT seed_event('oldvic@example.com',
                  'The Old Vic',
                  'THEATER',
                  'Hamlet',
                  'Shakespeare’s masterpiece in modern staging.',
                  'Latecomers seated during first interval.',
                  '2025-09-05 19:00+01',
                  '2025-09-05 22:15+01',
                  65,
                  'PUBLISHED',
                  'https://theartsdesk.com/sites/default/files/styles/mast_image_landscape/public/mastimages/54e18e61193ec51e66c99052eae28775.jpg?itok=8lUCapSA') AS ham_eid  \gset

SELECT add_image(:'ham_eid', 'https://theartsdesk.com/sites/default/files/styles/mast_image_landscape/public/mastimages/54e18e61193ec51e66c99052eae28775.jpg?itok=8lUCapSA');




SELECT seed_event('elb@example.com',
                  'Elbphilharmonie Kaistudio',
                  'CONCERT',
                  'Chopin by Candlelight',
                  'Solo piano recital (Op. 28 Preludes).',
                  'No applause between movements.',
                  '2025-06-18 20:00+02',
                  '2025-06-18 21:30+02',
                  55,
                  'PUBLISHED',
                  'https://img.jakpost.net/c/2020/01/03/2020_01_03_84294_1578035367._large.jpg') AS chop_eid  \gset

SELECT add_image(:'chop_eid', 'https://img.jakpost.net/c/2020/01/03/2020_01_03_84294_1578035367._large.jpg');



DROP FUNCTION add_image;
DROP FUNCTION seed_event;





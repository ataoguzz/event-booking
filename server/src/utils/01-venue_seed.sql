ALTER TABLE venues
  ADD CONSTRAINT venues_name_key UNIQUE (name);

INSERT INTO facilities (name) VALUES
  ('Parking'),
  ('Wheelchair Access'),
  ('Restaurant'),
  ('Bar'),
  ('Wi-Fi'),
  ('Public Transport Nearby'),
  ('ATM')
ON CONFLICT (name) DO NOTHING;

\set seat_map_b64 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNjAwIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzBiMTEyMCIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBmb250LXNpemU9IjQ4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+U2VhdCBNYXA8L3RleHQ+PC9zdmc+'
\set ga_map_b64 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNjAwIj48ZGVmcz48c3R5bGU+LnR7Zm9udC1zaXplOjQ4cHg7ZmlsbDojZmZmO308L3N0eWxlPjwvZGVmcz48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzBiMTEyMCIvPjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiBjbGFzcz0idCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSI+R2VuZXJhbCBBZG1pc3Npb248L3RleHQ+PC9zdmc+'

INSERT INTO venues (name, address, city, capacity, map_image_url, is_seated)
VALUES

('Sinan Erdem Dome',
 'Olimpiyatköy Yolu, Ataköy 4-5-6. Kısım, Bakırköy',
 'Istanbul', 0, :'seat_map_b64', TRUE),
('Volkswagen Arena',
 'Kuzey Çevre Yolu, Huzur Mah. Maslak Ayazağa Cad. No:4',
 'Istanbul', 0, :'seat_map_b64', TRUE),
('Ankara Spor Salonu',
 'Cumhuriyet Cad. No:4, Ulus',
 'Ankara', 0, :'seat_map_b64', TRUE),
('Kültürpark Açıkhava',
 'Kültürpark, Montrö Kapısı, Lozan Cad.',
 'Izmir', 0, :'seat_map_b64', TRUE),
('Nilüfer Açıkhava',
 'Balat Mah. Akpınar Cad. No:17, Nilüfer',
 'Bursa', 0, :'seat_map_b64', TRUE),


('İstanbul Park Festival Grounds',
 'Akfırat Bulv. No:1, Tuzla',
 'Istanbul', 40000, :'ga_map_b64', FALSE),
('SALT Galata',
 'Bankalar Cd. No:11, Karaköy',
 'Istanbul', 800, :'ga_map_b64', FALSE),


('Blue Note Jazz Club',
 '131 W 3rd St.',
 'New York', 0, :'seat_map_b64', TRUE),
('L''Olympia',
 '28 Bd des Capucines',
 'Paris', 0, :'seat_map_b64', TRUE),
('The Old Vic',
 'The Cut, Lambeth',
 'London', 0, :'seat_map_b64', TRUE),
('Elbphilharmonie Kaistudio',
 'Platz der Deutschen Einheit 1',
 'Hamburg', 0, :'seat_map_b64', TRUE),


('Rijksmuseum Garden',
 'Museumstraat 1',
 'Amsterdam', 500, :'ga_map_b64', FALSE)
ON CONFLICT (name) DO NOTHING;


CREATE OR REPLACE FUNCTION link_fac(v_name TEXT, f_list TEXT[])
RETURNS VOID LANGUAGE plpgsql AS
$$
DECLARE
  v_id BIGINT;  
  f_id INT;
  fac TEXT;
BEGIN
  SELECT venue_id INTO v_id FROM venues WHERE name = v_name;
  FOREACH fac IN ARRAY f_list LOOP
    SELECT facility_id INTO f_id FROM facilities WHERE name = fac;
    INSERT INTO venue_facilities (venue_id, facility_id)
    VALUES (v_id, f_id) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;



SELECT link_fac('Sinan Erdem Dome',
                ARRAY['Parking','Wheelchair Access','Public Transport Nearby','ATM']);

SELECT link_fac('Volkswagen Arena',
                ARRAY['Parking','Wheelchair Access','Bar','Wi-Fi']);

SELECT link_fac('Ankara Spor Salonu',
                ARRAY['Parking','Wheelchair Access','Public Transport Nearby']);

SELECT link_fac('Kültürpark Açıkhava',
                ARRAY['Wheelchair Access','Wi-Fi','Restaurant']);

SELECT link_fac('Nilüfer Açıkhava',
                ARRAY['Parking','Wheelchair Access','Wi-Fi','Bar']);

SELECT link_fac('İstanbul Park Festival Grounds',
                ARRAY['Parking','Public Transport Nearby','Wi-Fi']);

SELECT link_fac('SALT Galata',
                ARRAY['Wheelchair Access','Wi-Fi','Restaurant']);

SELECT link_fac('Blue Note Jazz Club',
                ARRAY['Bar','Wi-Fi','Restaurant']);

SELECT link_fac('L''Olympia',
                ARRAY['Wheelchair Access','Bar','Restaurant','Public Transport Nearby','Wi-Fi']);

SELECT link_fac('The Old Vic',
                ARRAY['Wheelchair Access','Bar','Restaurant','Public Transport Nearby']);

SELECT link_fac('Elbphilharmonie Kaistudio',
                ARRAY['Wheelchair Access','Bar','Wi-Fi']);

SELECT link_fac('Rijksmuseum Garden',
                ARRAY['Wi-Fi','Public Transport Nearby','Restaurant']);

DROP FUNCTION link_fac;


DO $$
DECLARE
  v RECORD;  r INT;  s INT;
BEGIN
FOR v IN SELECT venue_id, name FROM venues WHERE is_seated LOOP

  /* choose per-venue geometry & tier split */
  IF v.name = 'Sinan Erdem Dome' THEN         -- 15 × 24  (360)
    FOR r IN 1..15 LOOP
      FOR s IN 1..24 LOOP
        INSERT INTO seats (venue_id, section, row_label, seat_number, tier)
        VALUES (v.venue_id,'Parter',chr(64+r),s::TEXT,
                CASE WHEN r<=3 THEN 'VIP'
                     WHEN r<=8 THEN 'Premium' ELSE 'Regular' END)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

  ELSIF v.name = 'Volkswagen Arena' THEN      -- 10 × 15  (150)
    FOR r IN 1..10 LOOP
      FOR s IN 1..15 LOOP
        INSERT INTO seats (venue_id, section, row_label, seat_number, tier)
        VALUES (v.venue_id,'Main',chr(64+r),s::TEXT,
                CASE WHEN r<=2 THEN 'VIP'
                     WHEN r<=6 THEN 'Premium' ELSE 'Regular' END)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

  ELSIF v.name = 'Ankara Spor Salonu' THEN    -- 12 × 18  (216)
    FOR r IN 1..12 LOOP
      FOR s IN 1..18 LOOP
        INSERT INTO seats (venue_id, section, row_label, seat_number, tier)
        VALUES (v.venue_id,'Tribün',chr(64+r),s::TEXT,
                CASE WHEN r<=3 THEN 'VIP'
                     WHEN r<=7 THEN 'Premium' ELSE 'Regular' END)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

  ELSIF v.name = 'Kültürpark Açıkhava' THEN   --  8 × 14  (112)
    FOR r IN 1..8 LOOP
      FOR s IN 1..14 LOOP
        INSERT INTO seats (venue_id, section, row_label, seat_number, tier)
        VALUES (v.venue_id,'Ana',chr(64+r),s::TEXT,
                CASE WHEN r<=2 THEN 'VIP' ELSE 'Regular' END)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

  ELSIF v.name = 'Nilüfer Açıkhava' THEN      --  8 × 12   (96)
    FOR r IN 1..8 LOOP
      FOR s IN 1..12 LOOP
        INSERT INTO seats (venue_id, section, row_label, seat_number, tier)
        VALUES (v.venue_id,'Ana',chr(64+r),s::TEXT,
                CASE WHEN r<=2 THEN 'VIP' ELSE 'Regular' END)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

  ELSIF v.name = 'Blue Note Jazz Club' THEN   --  6 ×  8   (48)
    FOR r IN 1..6 LOOP
      FOR s IN 1..8 LOOP
        INSERT INTO seats (venue_id, section, row_label, seat_number, tier)
        VALUES (v.venue_id,'Floor',chr(64+r),s::TEXT,
                CASE WHEN r<=1 THEN 'VIP' ELSE 'Regular' END)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

  ELSIF v.name = 'L''Olympia' THEN            -- 10 × 12  (120)
    FOR r IN 1..10 LOOP
      FOR s IN 1..12 LOOP
        INSERT INTO seats (venue_id, section, row_label, seat_number, tier)
        VALUES (v.venue_id,'Orchestra',chr(64+r),s::TEXT,
                CASE WHEN r<=2 THEN 'VIP'
                     WHEN r<=6 THEN 'Premium' ELSE 'Regular' END)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

  ELSIF v.name = 'The Old Vic' THEN           -- 12 × 14  (168)
    FOR r IN 1..12 LOOP
      FOR s IN 1..14 LOOP
        INSERT INTO seats (venue_id, section, row_label, seat_number, tier)
        VALUES (v.venue_id,'Stalls',chr(64+r),s::TEXT,
                CASE WHEN r<=2 THEN 'VIP'
                     WHEN r<=5 THEN 'Premium' ELSE 'Regular' END)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

  ELSIF v.name = 'Elbphilharmonie Kaistudio' THEN  -- 6 × 10  (60)
    FOR r IN 1..6 LOOP
      FOR s IN 1..10 LOOP
        INSERT INTO seats (venue_id, section, row_label, seat_number, tier)
        VALUES (v.venue_id,'Floor',chr(64+r),s::TEXT,
                CASE WHEN r<=1 THEN 'VIP' ELSE 'Regular' END)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END LOOP;

  END IF;
END LOOP;
END $$;


WITH seat_counts AS (
  SELECT venue_id, COUNT(*) AS seats
  FROM   seats
  GROUP  BY venue_id
)
UPDATE venues v
SET    capacity = sc.seats
FROM   seat_counts sc
WHERE  v.venue_id = sc.venue_id
  AND  v.is_seated = TRUE;

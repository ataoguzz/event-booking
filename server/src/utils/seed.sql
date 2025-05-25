-- Insert facilities
INSERT INTO facilities (name) VALUES
    ('Parking'),
    ('Wheelchair Access'),
    ('Food Court'),
    ('VIP Lounge'),
    ('Wi-Fi'),
    ('Air Conditioning');

-- Insert venues
INSERT INTO venues (name, address, city, capacity, map_image_url) VALUES
    ('Grand Arena', '123 Main Street', 'New York', 5000, 'https://example.com/grand-arena.jpg'),
    ('Tech Conference Center', '456 Innovation Drive', 'San Francisco', 2000, 'https://example.com/tech-center.jpg'),
    ('Music Hall', '789 Melody Lane', 'Nashville', 3000, 'https://example.com/music-hall.jpg'),
    ('Sports Complex', '321 Stadium Road', 'Chicago', 15000, 'https://example.com/sports-complex.jpg');

-- Add facilities to venues
INSERT INTO venue_facilities (venue_id, facility_id)
SELECT v.venue_id, f.facility_id
FROM venues v
CROSS JOIN facilities f;

-- Insert organizer account
INSERT INTO accounts (email, password_hash, role) VALUES
    ('organizer@example.com', '$2b$10$K7LbXqNJf0K9K5Y7Y5Y5Y.Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y', 'organizer');

-- Insert organizer profile
INSERT INTO organizers (account_id, display_name, bio, avg_rating) VALUES
    (currval('accounts_account_id_seq'), 'Event Masters', 'Premier event organizer with years of experience', 4.8);

-- Insert events
INSERT INTO events (
    organizer_account_id,
    venue_id,
    category,
    title,
    description,
    rules,
    start_at,
    end_at,
    status,
    base_price,
    hero_image_url
) VALUES
    (
        currval('accounts_account_id_seq'),
        (SELECT venue_id FROM venues WHERE name = 'Grand Arena'),
        'CONCERT',
        'Summer Music Festival 2024',
        'Join us for the biggest music festival of the summer! Featuring top artists from around the world.',
        'No outside food or drinks. No recording devices.',
        '2024-07-15 18:00:00',
        '2024-07-15 23:00:00',
        'PUBLISHED',
        99.99,
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3'
    ),
    (
        currval('accounts_account_id_seq'),
        (SELECT venue_id FROM venues WHERE name = 'Tech Conference Center'),
        'CONFERENCE',
        'Future Tech Summit',
        'Explore the latest innovations in AI, blockchain, and quantum computing.',
        'Professional dress code required. Laptops welcome.',
        '2024-06-20 09:00:00',
        '2024-06-21 17:00:00',
        'PUBLISHED',
        299.99,
        'https://images.unsplash.com/photo-1505373877841-8d25f7d46678'
    ),
    (
        currval('accounts_account_id_seq'),
        (SELECT venue_id FROM venues WHERE name = 'Sports Complex'),
        'SPORTS',
        'Championship Boxing Night',
        'Witness the ultimate showdown between world champions!',
        'No weapons allowed. Security check required.',
        '2024-08-10 20:00:00',
        '2024-08-10 23:00:00',
        'PUBLISHED',
        149.99,
        'https://images.unsplash.com/photo-1544117519-31a4b719223d'
    ),
    (
        currval('accounts_account_id_seq'),
        (SELECT venue_id FROM venues WHERE name = 'Music Hall'),
        'STANDUP',
        'Comedy Night Extravaganza',
        'A night of non-stop laughter with the best comedians in town!',
        'No heckling. 18+ only.',
        '2024-05-25 19:30:00',
        '2024-05-25 22:30:00',
        'PUBLISHED',
        49.99,
        'https://images.unsplash.com/photo-1585699324551-f6c309eedeca'
    ); 
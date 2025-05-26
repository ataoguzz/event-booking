CREATE TYPE user_role_enum AS ENUM ('attendee', 'organizer', 'admin');
CREATE TYPE tx_type_enum AS ENUM ('TOP_UP', 'TICKET_PURCHASE');
CREATE TYPE venue_request_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE event_category_enum AS ENUM ('CONCERT', 'THEATER', 'SPORTS', 'STANDUP', 'CONFERENCE', 'WORKSHOP', 'FESTIVAL', 'OTHER');
CREATE TYPE event_status_enum AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
CREATE TYPE ticket_status_enum AS ENUM ('AVAILABLE', 'PURCHASED');
CREATE TYPE promo_discount_type_enum AS ENUM ('PERCENT', 'FIXED');


CREATE TABLE accounts (
    account_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'attendee',
    password_reset_token TEXT NULL,
    password_reset_expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendees (
    account_id BIGINT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    following_count INT DEFAULT 0 CHECK (following_count >= 0),
    balance NUMERIC(10, 2) DEFAULT 0.00 CHECK (balance >= 0),
    CONSTRAINT fk_account
        FOREIGN KEY(account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE organizers (
    account_id BIGINT PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    bio TEXT,
    avatar_url TEXT DEFAULT 'https://meyersroman.com/wp-content/uploads/2024/08/Blank-Avatar-Placeholder.png',
    avg_rating NUMERIC(2, 1) DEFAULT 0.0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
    followers_count INT DEFAULT 0 CHECK (followers_count >= 0),
    CONSTRAINT fk_account
        FOREIGN KEY(account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE admins (
    account_id BIGINT PRIMARY KEY,
    CONSTRAINT fk_account
        FOREIGN KEY(account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);


CREATE TABLE transactions (
    tx_id BIGSERIAL PRIMARY KEY,
    attendee_account_id BIGINT NOT NULL,
    tx_type tx_type_enum NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_attendee_account
        FOREIGN KEY(attendee_account_id)
        REFERENCES attendees(account_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);


CREATE TABLE venues (
    venue_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    capacity INT CHECK (capacity >= 0),
    is_seated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE facilities (
    facility_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE venue_facilities (
    venue_id BIGINT NOT NULL,
    facility_id INT NOT NULL,
    PRIMARY KEY (venue_id, facility_id),
    CONSTRAINT fk_venue
        FOREIGN KEY(venue_id)
        REFERENCES venues(venue_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_facility
        FOREIGN KEY(facility_id)
        REFERENCES facilities(facility_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE seats (
    seat_id BIGSERIAL PRIMARY KEY,
    venue_id BIGINT NOT NULL,
    section VARCHAR(50),
    row_label VARCHAR(10),
    seat_number VARCHAR(10),
    UNIQUE (venue_id, section, row_label, seat_number),
    CONSTRAINT fk_venue
        FOREIGN KEY(venue_id)
        REFERENCES venues(venue_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- In your 00-schema.sql, find and replace the CREATE TABLE venue_requests

DROP TABLE IF EXISTS venue_requests; -- If it exists, to ensure clean slate with new columns
CREATE TABLE venue_requests (
                                request_id BIGSERIAL PRIMARY KEY,
                                organizer_account_id BIGINT NOT NULL,
                                name TEXT NOT NULL,                       -- Venue Name
                                address TEXT NULL,                        -- Full address
                                city TEXT,
                                capacity TEXT,                            -- Organizer's estimated capacity (still TEXT)
                                is_seated BOOLEAN NULL DEFAULT FALSE,     -- Is it a seated venue?
                                requested_layout_rows INT NULL,           -- For seated: number of rows requested
                                requested_layout_cols INT NULL,           -- For seated: number of seats per row requested
                                notes TEXT,                               -- General notes about the venue or layout
                                status venue_request_status_enum DEFAULT 'PENDING',
                                admin_account_id BIGINT NULL,
                                decision_at TIMESTAMPTZ NULL,
                                created_at TIMESTAMPTZ DEFAULT NOW(),
                                updated_at TIMESTAMPTZ DEFAULT NOW(),
                                CONSTRAINT fk_organizer_venue_request -- Renamed constraint for clarity
                                    FOREIGN KEY(organizer_account_id)
                                        REFERENCES organizers(account_id)
                                        ON DELETE RESTRICT ON UPDATE CASCADE,
                                CONSTRAINT fk_admin_venue_request -- Renamed constraint
                                    FOREIGN KEY(admin_account_id)
                                        REFERENCES admins(account_id)
                                        ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX idx_venue_requests_organizer_id ON venue_requests(organizer_account_id);
CREATE INDEX idx_venue_requests_status ON venue_requests(status);

CREATE TABLE events (
    event_id BIGSERIAL PRIMARY KEY,
    organizer_account_id BIGINT NOT NULL,
    venue_id BIGINT NOT NULL,
    category event_category_enum NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    rules TEXT,
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    status event_status_enum DEFAULT 'DRAFT',
    base_price NUMERIC(10, 2) CHECK (base_price >= 0),
    tickets_sold INT DEFAULT 0 CHECK (tickets_sold >= 0),
    hero_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_organizer
        FOREIGN KEY(organizer_account_id)
        REFERENCES organizers(account_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_venue
        FOREIGN KEY(venue_id)
        REFERENCES venues(venue_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CHECK (end_at > start_at)
);


CREATE TABLE event_images (
    image_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    url TEXT NOT NULL,
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE event_ticket_tiers (
    tier_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    tier_name VARCHAR(100) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    quantity INT NOT NULL CHECK (quantity > 0),
    description TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_event_for_tier
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE (event_id, tier_name)
);


CREATE TABLE tickets (
    ticket_id            BIGSERIAL PRIMARY KEY,
    event_id             BIGINT  NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    tier_id              BIGINT  NULL     REFERENCES event_ticket_tiers(tier_id) ON DELETE SET NULL,
    seat_id              BIGINT  NULL     REFERENCES seats(seat_id)   ON DELETE RESTRICT,
    tx_id                BIGINT  NULL     REFERENCES transactions(tx_id),
    attendee_account_id  BIGINT  NULL     REFERENCES attendees(account_id) ON DELETE SET NULL,
    price_at_purchase    NUMERIC(10,2),
    guest_full_name      VARCHAR(100),
    guest_email          VARCHAR(255),
    qr_token             UUID DEFAULT gen_random_uuid() UNIQUE,
    pdf_url              TEXT,
    status               ticket_status_enum DEFAULT 'AVAILABLE',
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (event_id, seat_id)
);

CREATE TABLE promo_codes (
    promo_code_id SERIAL PRIMARY KEY,
    event_id BIGINT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    discount_type promo_discount_type_enum NOT NULL,
    discount_value NUMERIC(10, 2) NOT NULL,
    usage_limit INT CHECK (usage_limit > 0),
    usage_count INT DEFAULT 0 CHECK (usage_count >= 0),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CHECK (usage_count <= usage_limit),
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date),
    CHECK ( (discount_type = 'PERCENT' AND discount_value BETWEEN 0 AND 100) OR (discount_type = 'FIXED' AND discount_value > 0) )
);

CREATE TABLE promo_redemptions (
    redemption_id BIGSERIAL PRIMARY KEY,
    promo_code_id INT NOT NULL,
    tx_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (promo_code_id, tx_id),
    UNIQUE (promo_code_id, account_id),
    CONSTRAINT fk_promo_code
        FOREIGN KEY(promo_code_id)
        REFERENCES promo_codes(promo_code_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_transaction
        FOREIGN KEY(tx_id)
        REFERENCES transactions(tx_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_account
        FOREIGN KEY(account_id)
        REFERENCES accounts(account_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);


CREATE TABLE reviews (
    review_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    account_id BIGINT NOT NULL,
    stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (event_id, account_id),
    CONSTRAINT fk_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_account
        FOREIGN KEY(account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE follows (
    follower_account_id BIGINT NOT NULL,
    organizer_account_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_account_id, organizer_account_id),
    CONSTRAINT fk_follower_account
        FOREIGN KEY(follower_account_id)
        REFERENCES accounts(account_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_organizer
        FOREIGN KEY(organizer_account_id)
        REFERENCES organizers(account_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);


-- VIEWS

CREATE VIEW venue_cities AS
SELECT DISTINCT city
FROM   venues
WHERE  city IS NOT NULL
ORDER  BY city;

CREATE VIEW followed_organizer_events AS
SELECT 
    f.follower_account_id,
    e.event_id,
    e.title,
    e.category::TEXT AS category,
    e.start_at,
    e.end_at,
    e.status::TEXT AS status,
    e.base_price,
    e.hero_image_url AS cover_url,
    e.tickets_sold,
    v.name AS venue_name,
    v.city AS venue_city,
    o.account_id AS organizer_account_id,
    o.display_name AS organizer_name,
    o.avatar_url AS organizer_avatar_url,
    o.avg_rating AS organizer_rating
FROM follows f
JOIN organizers o ON o.account_id = f.organizer_account_id
JOIN events e ON e.organizer_account_id = o.account_id
JOIN venues v ON v.venue_id = e.venue_id
WHERE e.status = 'PUBLISHED'
  AND e.end_at >= NOW()
ORDER BY e.start_at ASC;

CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_tickets_tx_id ON tickets(tx_id);
CREATE INDEX idx_transactions_attendee_account_id_created_at ON transactions(attendee_account_id, created_at DESC);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_tickets_event_status ON tickets(event_id, status);
CREATE INDEX idx_event_ticket_tiers_event_id ON event_ticket_tiers(event_id);
CREATE UNIQUE INDEX idx_tickets_unique_assigned_seat ON tickets (event_id, seat_id) WHERE seat_id IS NOT NULL;
CREATE TYPE user_role_enum AS ENUM ('attendee', 'organizer', 'admin');
CREATE TYPE tx_type_enum AS ENUM ('TOP_UP', 'TICKET_PURCHASE');
CREATE TYPE venue_request_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE event_category_enum AS ENUM ('CONCERT', 'THEATER', 'SPORTS', 'STANDUP', 'CONFERENCE', 'WORKSHOP', 'FESTIVAL', 'OTHER');
CREATE TYPE event_status_enum AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
CREATE TYPE ticket_status_enum AS ENUM ('AVAILABLE', 'CONFIRMED', 'CANCELLED', 'USED');
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
    map_image_url TEXT,
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
    tier VARCHAR(50),
    UNIQUE (venue_id, section, row_label, seat_number),
    CONSTRAINT fk_venue
        FOREIGN KEY(venue_id)
        REFERENCES venues(venue_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE venue_requests (
    request_id BIGSERIAL PRIMARY KEY,
    organizer_account_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    city TEXT,
    capacity TEXT,
    notes TEXT,
    status venue_request_status_enum DEFAULT 'PENDING',
    admin_account_id BIGINT NULL,
    decision_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_organizer
        FOREIGN KEY(organizer_account_id)
        REFERENCES organizers(account_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_admin
        FOREIGN KEY(admin_account_id)
        REFERENCES admins(account_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);


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
    view_count INT DEFAULT 0 CHECK (view_count >= 0),
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
                                    tier_name VARCHAR(100) NOT NULL, -- e.g., "Early Bird", "VIP", "General Admission - Phase 1"
                                    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
                                    quantity INT NOT NULL CHECK (quantity > 0),    -- Number of tickets available for this tier
                                    description TEXT NULL,                         -- Optional description for the tier
                                    created_at TIMESTAMPTZ DEFAULT NOW(),
                                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                                    CONSTRAINT fk_event_for_tier
                                        FOREIGN KEY(event_id)
                                            REFERENCES events(event_id)
                                            ON DELETE CASCADE ON UPDATE CASCADE,
                                    UNIQUE (event_id, tier_name) -- An event shouldn't have two tiers with the exact same name
);

CREATE INDEX idx_event_ticket_tiers_event_id ON event_ticket_tiers(event_id);


CREATE TABLE tickets (
                         ticket_id BIGSERIAL PRIMARY KEY,
                         event_id BIGINT NOT NULL,
                         tier_id BIGINT NULL,                  -- Foreign key to event_ticket_tiers
                         seat_id BIGINT NULL,                  -- Can be NULL if not assigned to a specific seat yet, or for GA tiers
                         tx_id BIGINT NULL,                    -- NULL until the ticket is part of a purchase transaction
                         price_at_purchase NUMERIC(10,2) NULL, -- The price this ticket was actually sold for
                         attendee_account_id BIGINT NULL,      -- The account that purchased/owns the ticket
                         guest_full_name VARCHAR(100) NULL,    -- If purchased for a guest
                         guest_email VARCHAR(255) NULL,        -- If purchased for a guest
                         qr_token UUID DEFAULT gen_random_uuid() UNIQUE,
                         pdf_url TEXT NULL,
                         status ticket_status_enum DEFAULT 'AVAILABLE', -- Default for pre-generated tickets
                         created_at TIMESTAMPTZ DEFAULT NOW(),          -- When the ticket record was created (event creation time)
                         updated_at TIMESTAMPTZ DEFAULT NOW(),          -- When it was last updated (e.g., purchased, used)

                         CONSTRAINT fk_event_for_ticket
                             FOREIGN KEY(event_id)
                                 REFERENCES events(event_id)
                                 ON DELETE CASCADE ON UPDATE CASCADE, -- Changed from RESTRICT to CASCADE for event deletion
                         CONSTRAINT fk_tier_for_ticket
                             FOREIGN KEY(tier_id)
                                 REFERENCES event_ticket_tiers(tier_id)
                                 ON DELETE SET NULL ON UPDATE CASCADE, -- If a tier is deleted, tickets might become tier-less or handle differently
                         CONSTRAINT fk_seat_for_ticket -- Only applies if seat_id is NOT NULL
                             FOREIGN KEY(seat_id)
                                 REFERENCES seats(seat_id)
                                 ON DELETE RESTRICT ON UPDATE CASCADE,
                         CONSTRAINT fk_transaction_for_ticket -- Only applies if tx_id is NOT NULL
                             FOREIGN KEY(tx_id)
                                 REFERENCES transactions(tx_id)
                                 ON DELETE RESTRICT ON UPDATE CASCADE,
                         CONSTRAINT fk_attendee_for_ticket -- Only applies if attendee_account_id is NOT NULL
                             FOREIGN KEY(attendee_account_id)
                                 REFERENCES attendees(account_id)
                                 ON DELETE SET NULL ON UPDATE CASCADE
);

-- Index for tickets belonging to an event and tier
CREATE INDEX idx_tickets_event_tier ON tickets(event_id, tier_id);
-- Partial unique index for assigned seats (if you still want to enforce unique seat per event)
CREATE UNIQUE INDEX idx_tickets_unique_assigned_seat ON tickets (event_id, seat_id) WHERE seat_id IS NOT NULL;

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

CREATE INDEX idx_accounts_email ON accounts(email);
CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_tickets_tx_id ON tickets(tx_id);
CREATE INDEX idx_transactions_attendee_account_id_created_at ON transactions(attendee_account_id, created_at DESC);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
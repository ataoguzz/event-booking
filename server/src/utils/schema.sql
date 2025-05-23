CREATE TYPE user_role_enum AS ENUM ('attendee', 'organizer', 'admin');
CREATE TYPE tx_type_enum AS ENUM ('TOP_UP', 'TICKET_PURCHASE');
CREATE TYPE venue_request_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE event_category_enum AS ENUM ('CONCERT', 'THEATER', 'SPORTS', 'STANDUP', 'CONFERENCE', 'WORKSHOP', 'FESTIVAL', 'OTHER');
CREATE TYPE event_status_enum AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED');
CREATE TYPE ticket_status_enum AS ENUM ('CONFIRMED', 'CANCELLED', 'USED');
CREATE TYPE promo_discount_type_enum AS ENUM ('PERCENT', 'FIXED');

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    role user_role_enum NOT NULL DEFAULT 'attendee',
    avatar_url TEXT,
    password_reset_token TEXT NULL,
    password_reset_expires_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wallets (
    wallet_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    balance NUMERIC(10, 2) DEFAULT 0.00 CHECK (balance >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE transactions (
    tx_id BIGSERIAL PRIMARY KEY,
    wallet_id BIGINT NOT NULL,
    tx_type tx_type_enum NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_wallet
        FOREIGN KEY(wallet_id)
        REFERENCES wallets(wallet_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE organizer_profiles (
    organizer_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    display_name VARCHAR(255),
    bio TEXT,
    avg_rating NUMERIC(2, 1) DEFAULT 0.0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
    followers_count INT DEFAULT 0 CHECK (followers_count >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE admin_profiles (
    admin_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE venues (
    venue_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    capacity INT CHECK (capacity > 0),
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
    organizer_id BIGINT NOT NULL,
    name TEXT NOT NULL,
    city TEXT,
    capacity TEXT,
    notes TEXT,
    status venue_request_status_enum DEFAULT 'PENDING',
    admin_id BIGINT NULL,
    decision_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_organizer
        FOREIGN KEY(organizer_id)
        REFERENCES organizer_profiles(organizer_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_admin
        FOREIGN KEY(admin_id)
        REFERENCES admin_profiles(admin_id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE events (
    event_id BIGSERIAL PRIMARY KEY,
    organizer_id BIGINT NOT NULL,
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
    avg_rating NUMERIC(2, 1) DEFAULT 0.0 CHECK (avg_rating >= 0 AND avg_rating <= 5),
    hero_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_organizer
        FOREIGN KEY(organizer_id)
        REFERENCES organizer_profiles(organizer_id)
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

CREATE TABLE seat_pricing (
    event_id BIGINT NOT NULL,
    tier VARCHAR(50) NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    PRIMARY KEY (event_id, tier),
    CONSTRAINT fk_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE tickets (
    ticket_id BIGSERIAL PRIMARY KEY,
    tx_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    guest_first_name VARCHAR(100),
    guest_last_name VARCHAR(100),
    guest_email VARCHAR(255) NULL,
    qr_token UUID DEFAULT gen_random_uuid() UNIQUE,
    pdf_url TEXT,
    status ticket_status_enum DEFAULT 'CONFIRMED',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (event_id, seat_id),
    CONSTRAINT fk_transaction
        FOREIGN KEY(tx_id)
        REFERENCES transactions(tx_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_seat
        FOREIGN KEY(seat_id)
        REFERENCES seats(seat_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
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
    user_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (promo_code_id, tx_id),
    UNIQUE (promo_code_id, user_id),
    CONSTRAINT fk_promo_code
        FOREIGN KEY(promo_code_id)
        REFERENCES promo_codes(promo_code_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_transaction
        FOREIGN KEY(tx_id)
        REFERENCES transactions(tx_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
        ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE reviews (
    review_id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    stars SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
    body TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (event_id, user_id),
    CONSTRAINT fk_event
        FOREIGN KEY(event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE follows (
    follower_id BIGINT NOT NULL,
    organizer_id BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, organizer_id),
    CONSTRAINT fk_follower
        FOREIGN KEY(follower_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_organizer_profile
        FOREIGN KEY(organizer_id)
        REFERENCES organizer_profiles(organizer_id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_events_start_at ON events(start_at);
CREATE INDEX idx_events_city ON venues(city);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_tickets_user_event ON tickets(tx_id, event_id);
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id, created_at DESC);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_users_email ON users(email);
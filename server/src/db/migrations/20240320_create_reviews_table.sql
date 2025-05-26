-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(event_id),
    ticket_id INTEGER NOT NULL REFERENCES tickets(ticket_id),
    attendee_account_id INTEGER NOT NULL REFERENCES accounts(account_id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ticket_id), -- One review per ticket
    CHECK (rating >= 1 AND rating <= 5)
);

-- Add average_rating column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2);

-- Create function to update event average rating
CREATE OR REPLACE FUNCTION update_event_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE events
    SET average_rating = (
        SELECT ROUND(AVG(rating)::numeric, 2)
        FROM reviews
        WHERE event_id = NEW.event_id
    )
    WHERE event_id = NEW.event_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update average rating on review changes
CREATE TRIGGER update_event_rating
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_event_average_rating(); 
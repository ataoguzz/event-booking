-- Add average_rating column to organizers table
ALTER TABLE organizers
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2);

-- Create function to update organizer average rating
CREATE OR REPLACE FUNCTION update_organizer_average_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the organizer's average rating whenever an event's rating changes
    UPDATE organizers o
    SET average_rating = (
        SELECT ROUND(AVG(e.average_rating)::numeric, 2)
        FROM events e
        WHERE e.organizer_account_id = (
            SELECT organizer_account_id 
            FROM events 
            WHERE event_id = NEW.event_id
        )
        AND e.average_rating IS NOT NULL
    )
    WHERE o.account_id = (
        SELECT organizer_account_id 
        FROM events 
        WHERE event_id = NEW.event_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update organizer rating when event ratings change
CREATE TRIGGER update_organizer_rating
AFTER UPDATE OF average_rating ON events
FOR EACH ROW
WHEN (OLD.average_rating IS DISTINCT FROM NEW.average_rating)
EXECUTE FUNCTION update_organizer_average_rating();

-- Update existing organizer ratings
UPDATE organizers o
SET average_rating = (
    SELECT ROUND(AVG(e.average_rating)::numeric, 2)
    FROM events e
    WHERE e.organizer_account_id = o.account_id
    AND e.average_rating IS NOT NULL
); 
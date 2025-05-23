-- 0. ENUM types
CREATE TYPE promo_discount_type AS ENUM ('Percentage', 'Flat');
CREATE TYPE payment_method      AS ENUM ('Credit Card', 'Wallet');

-- 1. Users
CREATE TABLE "User" (
    userID      SERIAL PRIMARY KEY,
    email       VARCHAR(255)    NOT NULL UNIQUE,
    password    VARCHAR(255)    NOT NULL,
    phoneNumber VARCHAR(20)
);

-- 2. Administrator
CREATE TABLE Administrator (
    userID          INT PRIMARY KEY
                     REFERENCES "User"(userID) ON DELETE CASCADE,
    permissionLevel INT NOT NULL
);

-- 3. Organizer
CREATE TABLE Organizer (
    userID           INT PRIMARY KEY
                      REFERENCES "User"(userID) ON DELETE CASCADE,
    organizationName VARCHAR(255) NOT NULL UNIQUE,
    averageRating    NUMERIC(2,1) DEFAULT 0.0,
    website          VARCHAR(255)
);

-- 4. Attendee
CREATE TABLE Attendee (
    userID        INT PRIMARY KEY
                   REFERENCES "User"(userID) ON DELETE CASCADE,
    fullName      VARCHAR(100) NOT NULL,
    balance       NUMERIC(10,2) DEFAULT 0.00,
    date_of_birth DATE        NOT NULL,
    age           INT
);

-- 5. Venue
CREATE TABLE Venue (
    venueID SERIAL PRIMARY KEY,
    name    VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    capacity INT
);

-- 6. Facility
CREATE TABLE Facility (
    facilityID   SERIAL PRIMARY KEY,
    facilityType VARCHAR(100),
    description  VARCHAR(255),
    venueID      INT NOT NULL
                 REFERENCES Venue(venueID) ON DELETE CASCADE
);

-- 7. Seat
CREATE TABLE Seat (
    seatNumber   INT,
    seatSection  VARCHAR(10),
    venueID      INT,
    PRIMARY KEY (seatNumber, seatSection, venueID),
    FOREIGN KEY (venueID) REFERENCES Venue(venueID) ON DELETE CASCADE
);

-- 8. Event
CREATE TABLE Event (
    eventID      SERIAL PRIMARY KEY,
    title        VARCHAR(255)    NOT NULL,
    description  VARCHAR(1000),
    category     VARCHAR(100),
    startDate    DATE            NOT NULL,
    endDate      DATE            NOT NULL,
    duration     NUMERIC(4,2),
    venueID      INT             NOT NULL
                 REFERENCES Venue(venueID)    ON DELETE RESTRICT,
    organizerID  INT             NOT NULL
                 REFERENCES Organizer(userID) ON DELETE RESTRICT,
    CHECK (startDate <= endDate)
);

-- 9. EventImage
CREATE TABLE EventImage (
    eventID   INT   REFERENCES Event(eventID) ON DELETE CASCADE,
    imageData BYTEA NOT NULL,
    PRIMARY KEY (eventID, imageData)
);

-- 10. EventRule
CREATE TABLE EventRule (
    eventID INT   REFERENCES Event(eventID) ON DELETE CASCADE,
    rule    VARCHAR(100),
    PRIMARY KEY (eventID, rule)
);

-- 11. PromoCode
CREATE TABLE PromoCode (
    promoID        SERIAL PRIMARY KEY,
    code           VARCHAR(50)             NOT NULL UNIQUE,
    discountType   promo_discount_type     NOT NULL,
    discountAmount INT                    NOT NULL CHECK (discountAmount >= 0),
    validUntil     TIMESTAMP,
    remainingUsage INT
);

-- 12. HasPromotion
CREATE TABLE HasPromotion (
    eventID INT REFERENCES Event(eventID)     ON DELETE CASCADE,
    promoID INT REFERENCES PromoCode(promoID) ON DELETE CASCADE,
    PRIMARY KEY (eventID, promoID)
);

-- 13. Booking
CREATE TABLE Booking (
    bookingID     SERIAL PRIMARY KEY,
    bookingDate   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    totalAmount   NUMERIC(10,2) NOT NULL,
    paymentMethod payment_method   NOT NULL,
    attendeeID    INT               NOT NULL
                  REFERENCES Attendee(userID) ON DELETE CASCADE
);

-- 14. Ticket
CREATE TABLE Ticket (
    ticketID    SERIAL PRIMARY KEY,
    type        VARCHAR(50),
    price       NUMERIC(10,2) NOT NULL,
    guestName   VARCHAR(100),
    qr          BYTEA,
    eventID     INT NOT NULL
                REFERENCES Event(eventID)   ON DELETE CASCADE,
    bookingID   INT NOT NULL
                REFERENCES Booking(bookingID) ON DELETE CASCADE,
    seatNumber  INT,
    seatSection VARCHAR(10),
    venueID     INT,
    FOREIGN KEY (seatNumber, seatSection, venueID)
      REFERENCES Seat(seatNumber, seatSection, venueID) ON DELETE RESTRICT
);

-- 15. Review
CREATE TABLE Review (
    eventID    INT                    REFERENCES Event(eventID)    ON DELETE CASCADE,
    attendeeID INT                    REFERENCES Attendee(userID) ON DELETE CASCADE,
    rating     NUMERIC(2,1)           NOT NULL CHECK (rating BETWEEN 0 AND 10),
    comment    VARCHAR(1000),
    postedDate TIMESTAMP              NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (eventID, attendeeID)
);

-- 16. Post
CREATE TABLE Post (
    postID      SERIAL PRIMARY KEY,
    text        VARCHAR(1000),
    image       BYTEA,
    postDate    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    organizerID INT      NOT NULL
                REFERENCES Organizer(userID) ON DELETE CASCADE
);

-- 17. Follows
CREATE TABLE Follows (
    organizerID INT      REFERENCES Organizer(userID) ON DELETE CASCADE,
    attendeeID  INT      REFERENCES Attendee(userID)  ON DELETE CASCADE,
    followDate  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (organizerID, attendeeID)
);

-- 18. Report
CREATE TABLE Report (
    reportID       SERIAL PRIMARY KEY,
    reportType     VARCHAR(100),
    reportContent  VARCHAR(5000),
    generationTime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    administratorID INT
      REFERENCES Administrator(userID) ON DELETE SET NULL
);

-- 19. Views
CREATE VIEW OrganizerEvents AS
SELECT e.*, ei.imageData
FROM Event e
JOIN Organizer o   ON e.organizerID = o.userID
LEFT JOIN EventImage ei ON e.eventID = ei.eventID;

CREATE VIEW AttendeeBookings AS
SELECT b.bookingID,
       b.bookingDate,
       b.totalAmount,
       t.ticketID,
       t.type    AS ticketType,
       t.price,
       e.title   AS eventTitle,
       e.startDate
FROM Booking b
JOIN Ticket  t ON b.bookingID = t.bookingID
JOIN Event   e ON t.eventID   = e.eventID
WHERE b.attendeeID = /* your_attendee_id_here */;

CREATE VIEW EventAvailability AS
SELECT s.venueID,
       s.seatSection,
       s.seatNumber,
       e.eventID,
       e.title,
       CASE WHEN t.ticketID IS NULL THEN 'available' ELSE 'booked' END AS status
FROM Seat s
CROSS JOIN Event e
LEFT JOIN Ticket t
  ON s.seatNumber  = t.seatNumber
 AND s.seatSection = t.seatSection
 AND s.venueID     = t.venueID
 AND t.eventID     = e.eventID;

-- 20. Trigger: deduct wallet balance
CREATE FUNCTION deduct_wallet_balance() RETURNS trigger AS $$
BEGIN
  IF NEW.paymentMethod = 'Wallet' THEN
    UPDATE Attendee
       SET balance = balance - NEW.totalAmount
     WHERE userID = NEW.attendeeID
       AND balance >= NEW.totalAmount;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deduct_wallet_balance
  BEFORE INSERT ON Booking
  FOR EACH ROW
  EXECUTE FUNCTION deduct_wallet_balance();

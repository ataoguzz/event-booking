-- 1. Users
CREATE TABLE User (
                      userID INT AUTO_INCREMENT PRIMARY KEY,
                      email VARCHAR(255) NOT NULL UNIQUE,
                      password VARCHAR(255) NOT NULL,
                      phoneNumber VARCHAR(20)
);

-- 2. Administrator
CREATE TABLE Administrator (
                               userID INT PRIMARY KEY,
                               permissionLevel INT NOT NULL,
                               FOREIGN KEY (userID)
                                   REFERENCES User(userID)
                                   ON DELETE CASCADE
);

-- 3. Organizer
CREATE TABLE Organizer (
                           userID INT PRIMARY KEY,
                           organizationName VARCHAR(255) NOT NULL UNIQUE,
                           averageRating NUMERIC(2,1) DEFAULT 0.0,
                           website VARCHAR(255),
                           FOREIGN KEY (userID)
                               REFERENCES User(userID)
                               ON DELETE CASCADE
);

-- 4. Attendee
CREATE TABLE Attendee (
                          userID INT PRIMARY KEY,
                          fullName VARCHAR(100) NOT NULL,
                          balance NUMERIC(10,2) DEFAULT 0.00,
                          date_of_birth DATE NOT NULL,
    -- age can be derived from date_of_birth; consider removing for normalization
                          age INT,
                          FOREIGN KEY (userID)
                              REFERENCES User(userID)
                              ON DELETE CASCADE
);

-- 5. Venue
CREATE TABLE Venue (
                       venueID INT AUTO_INCREMENT PRIMARY KEY,
                       name VARCHAR(100) NOT NULL,
                       address VARCHAR(255),
                       capacity INT
);

-- 6. Facility
CREATE TABLE Facility (
                          facilityID INT AUTO_INCREMENT PRIMARY KEY,
                          facilityType VARCHAR(100),
                          description VARCHAR(255),
                          venueID INT NOT NULL,
                          FOREIGN KEY (venueID)
                              REFERENCES Venue(venueID)
                              ON DELETE CASCADE
);

-- 7. Seat
CREATE TABLE Seat (
                      seatNumber INT,
                      seatSection VARCHAR(10),
                      venueID INT,
                      PRIMARY KEY (seatNumber, seatSection, venueID),
                      FOREIGN KEY (venueID)
                          REFERENCES Venue(venueID)
                          ON DELETE CASCADE
);

-- 8. Event
CREATE TABLE Event (
                       eventID INT AUTO_INCREMENT PRIMARY KEY,
                       title VARCHAR(255) NOT NULL,
                       description VARCHAR(1000),
                       category VARCHAR(100),
                       startDate DATE NOT NULL,
                       endDate DATE NOT NULL,
                       CHECK (startDate <= endDate),
                       duration NUMERIC(4,2),
                       venueID INT NOT NULL,
                       organizerID INT NOT NULL,
                       FOREIGN KEY (venueID)
                           REFERENCES Venue(venueID)
                           ON DELETE RESTRICT,
                       FOREIGN KEY (organizerID)
                           REFERENCES Organizer(userID)
                           ON DELETE RESTRICT
);

-- 9. EventImage
CREATE TABLE EventImage (
                            eventID INT,
                            imageData BLOB,
                            PRIMARY KEY (eventID, imageData),
                            FOREIGN KEY (eventID)
                                REFERENCES Event(eventID)
                                ON DELETE CASCADE
);

-- 10. EventRule
CREATE TABLE EventRule (
                           eventID INT,
                           rule VARCHAR(100),
                           PRIMARY KEY (eventID, rule),
                           FOREIGN KEY (eventID)
                               REFERENCES Event(eventID)
                               ON DELETE CASCADE
);

-- 11. PromoCode
CREATE TABLE PromoCode (
                           promoID INT AUTO_INCREMENT PRIMARY KEY,
                           code VARCHAR(50) NOT NULL UNIQUE,
                           discountType ENUM('Percentage','Flat') NOT NULL,
                           discountAmount INT NOT NULL CHECK(discountAmount >= 0),
                           validUntil DATETIME,
                           remainingUsage INT DEFAULT NULL
);

-- 12. Event–Promo join
CREATE TABLE HasPromotion (
                              eventID INT,
                              promoID INT,
                              PRIMARY KEY (eventID, promoID),
                              FOREIGN KEY (eventID)
                                  REFERENCES Event(eventID)
                                  ON DELETE CASCADE,
                              FOREIGN KEY (promoID)
                                  REFERENCES PromoCode(promoID)
                                  ON DELETE CASCADE
);

-- 13. Booking (must come before Ticket)
CREATE TABLE Booking (
                         bookingID INT AUTO_INCREMENT PRIMARY KEY,
                         bookingDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         totalAmount NUMERIC(10,2) NOT NULL,
                         paymentMethod ENUM('Credit Card','Wallet') NOT NULL,
                         attendeeID INT NOT NULL,
                         FOREIGN KEY (attendeeID)
                             REFERENCES Attendee(userID)
                             ON DELETE CASCADE
);

-- 14. Ticket
CREATE TABLE Ticket (
                        ticketID INT AUTO_INCREMENT PRIMARY KEY,
                        type VARCHAR(50),
                        price NUMERIC(10,2) NOT NULL,
                        guestName VARCHAR(100),
                        qr BLOB,
                        eventID INT NOT NULL,
                        bookingID INT NOT NULL,
                        seatNumber INT,
                        seatSection VARCHAR(10),
                        venueID INT,
                        FOREIGN KEY (eventID)
                            REFERENCES Event(eventID)
                            ON DELETE CASCADE,
                        FOREIGN KEY (bookingID)
                            REFERENCES Booking(bookingID)
                            ON DELETE CASCADE,
                        FOREIGN KEY (seatNumber, seatSection, venueID)
                            REFERENCES Seat(seatNumber, seatSection, venueID)
                            ON DELETE RESTRICT
);

-- 15. Combined Review table (one review per attendee/event)
CREATE TABLE Review (
                        eventID INT NOT NULL,
                        attendeeID INT NOT NULL,
                        rating NUMERIC(2,1) NOT NULL CHECK(rating BETWEEN 0 AND 10),
                        comment VARCHAR(1000),
                        postedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        PRIMARY KEY (eventID, attendeeID),
                        FOREIGN KEY (eventID)
                            REFERENCES Event(eventID)
                            ON DELETE CASCADE,
                        FOREIGN KEY (attendeeID)
                            REFERENCES Attendee(userID)
                            ON DELETE CASCADE
);

-- 16. Post
CREATE TABLE Post (
                      postID INT AUTO_INCREMENT PRIMARY KEY,
                      text VARCHAR(1000),
                      image BLOB,
                      postDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                      organizerID INT NOT NULL,
                      FOREIGN KEY (organizerID)
                          REFERENCES Organizer(userID)
                          ON DELETE CASCADE
);

-- 17. Follows
CREATE TABLE Follows (
                         organizerID INT,
                         attendeeID INT,
                         followDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                         PRIMARY KEY (organizerID, attendeeID),
                         FOREIGN KEY (organizerID)
                             REFERENCES Organizer(userID)
                             ON DELETE CASCADE,
                         FOREIGN KEY (attendeeID)
                             REFERENCES Attendee(userID)
                             ON DELETE CASCADE
);

-- 18. Report
CREATE TABLE Report (
                        reportID INT AUTO_INCREMENT PRIMARY KEY,
                        reportType VARCHAR(100),
                        reportContent VARCHAR(5000),
                        generationTime DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        administratorID INT NOT NULL,
                        FOREIGN KEY (administratorID)
                            REFERENCES Administrator(userID)
                            ON DELETE SET NULL
);

-- 19. Views
CREATE VIEW OrganizerEvents AS
SELECT e.*, ei.imageData
FROM Event e
         JOIN Organizer o ON e.organizerID = o.userID
         LEFT JOIN EventImage ei ON e.eventID = ei.eventID;

CREATE VIEW AttendeeBookings AS
SELECT b.bookingID, b.bookingDate, b.totalAmount,
       t.ticketID, t.type AS ticketType, t.price,
       e.title AS eventTitle, e.startDate
FROM Booking b
         JOIN Ticket t ON b.bookingID = t.bookingID
         JOIN Event e ON t.eventID = e.eventID
WHERE b.attendeeID = /* :logged_in_userID */;

CREATE VIEW EventAvailability AS
SELECT s.venueID, s.seatSection, s.seatNumber,
       e.eventID, e.title,
       CASE WHEN t.ticketID IS NULL THEN 'available' ELSE 'booked' END AS status
FROM Seat s
         CROSS JOIN Event e
         LEFT JOIN Ticket t
                   ON s.seatNumber = t.seatNumber
                       AND s.seatSection = t.seatSection
                       AND s.venueID   = t.venueID
                       AND t.eventID   = e.eventID;

-- 20. Triggers
DELIMITER $$
CREATE TRIGGER deduct_wallet_balance
    BEFORE INSERT ON Booking
    FOR EACH ROW
BEGIN
    IF NEW.paymentMethod = 'Wallet' THEN
    UPDATE Attendee
    SET balance = balance - NEW.totalAmount
    WHERE userID = NEW.attendeeID
      AND balance >= NEW.totalAmount;
    IF ROW_COUNT() = 0 THEN
      SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient wallet balance';
END IF;
END IF;
END$$
DELIMITER ;


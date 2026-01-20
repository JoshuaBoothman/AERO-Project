-- Add columns for extra adult pricing to campsites
ALTER TABLE campsites
ADD extra_adult_price_per_night DECIMAL(10, 2) DEFAULT 0,
    extra_adult_full_event_price DECIMAL(10, 2) DEFAULT 0;

-- Add columns for guest counts to campsite_bookings
ALTER TABLE campsite_bookings
ADD number_of_adults INT DEFAULT 1,
    number_of_children INT DEFAULT 0;

-- Docker MySQL init (runs once on first container boot).
-- Creates the payments table plus a minimal bookings table so the payment
-- service can mirror confirmations. The app's real bookings live in Supabase;
-- this table is optional and just prevents missing-table errors.

CREATE TABLE IF NOT EXISTS bookings (
  id            VARCHAR(64) PRIMARY KEY,
  status        VARCHAR(20) DEFAULT 'pending',
  service_fee_paid BOOLEAN DEFAULT FALSE,
  payment_id    VARCHAR(40) NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id            VARCHAR(40) PRIMARY KEY,
  booking_id    VARCHAR(64),
  hostel_id     VARCHAR(64),
  user_id       VARCHAR(64),
  amount        DECIMAL(12,2) NOT NULL,
  currency      VARCHAR(8) DEFAULT 'TZS',
  network       ENUM('mpesa','tigo','airtel','halopesa') DEFAULT 'mpesa',
  phone         VARCHAR(20),
  status        ENUM('pending','completed','failed','cancelled') DEFAULT 'pending',
  provider      VARCHAR(40) DEFAULT 'mock',
  external_ref  VARCHAR(120),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payments_status (status),
  INDEX idx_payments_booking (booking_id),
  INDEX idx_payments_external (external_ref)
);

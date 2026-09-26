CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(40) PRIMARY KEY,
  booking_id BIGINT,
  hostel_id BIGINT,
  user_id BIGINT,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) DEFAULT 'TZS',
  network ENUM('mpesa','tigo','airtel','halopesa') DEFAULT 'mpesa',
  phone VARCHAR(20),
  status ENUM('pending','completed','failed','cancelled') DEFAULT 'pending',
  provider VARCHAR(40) DEFAULT 'azampay',
  external_ref VARCHAR(120),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payments_status (status),
  INDEX idx_payments_booking (booking_id),
  INDEX idx_payments_user (user_id),
  INDEX idx_payments_external (external_ref)
);
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS service_fee_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_id VARCHAR(40) NULL;

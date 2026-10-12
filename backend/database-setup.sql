CREATE DATABASE IF NOT EXISTS vehicle_rental
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;
USE vehicle_rental;

CREATE TABLE IF NOT EXISTS vehicles (
  id BIGINT NOT NULL AUTO_INCREMENT,
  vehicle_number VARCHAR(24) NOT NULL,
  brand VARCHAR(80) NOT NULL,
  model VARCHAR(80) NOT NULL,
  vehicle_type VARCHAR(40) NOT NULL,
  color VARCHAR(40) NOT NULL,
  daily_rental_price DECIMAL(10,2) NOT NULL,
  availability_status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
  image_url VARCHAR(1000),
  PRIMARY KEY (id),
  CONSTRAINT uk_vehicle_number UNIQUE (vehicle_number),
  CONSTRAINT chk_vehicle_daily_price CHECK (daily_rental_price > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customers (
  id BIGINT NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  phone VARCHAR(32) NOT NULL,
  address VARCHAR(240) NOT NULL,
  driving_license_number VARCHAR(64) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_customer_email UNIQUE (email),
  CONSTRAINT uk_customer_phone UNIQUE (phone),
  CONSTRAINT uk_customer_license UNIQUE (driving_license_number)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS customer_accounts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  customer_id BIGINT NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT uk_customer_account_customer UNIQUE (customer_id),
  CONSTRAINT fk_account_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT NOT NULL AUTO_INCREMENT,
  customer_id BIGINT NOT NULL,
  vehicle_id BIGINT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  actual_return_date DATE,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  booking_status VARCHAR(20) NOT NULL DEFAULT 'BOOKED',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  INDEX idx_booking_vehicle_dates (vehicle_id, start_date, end_date),
  INDEX idx_booking_status (booking_status),
  CONSTRAINT chk_booking_dates CHECK (end_date > start_date),
  CONSTRAINT chk_booking_status CHECK (booking_status IN ('BOOKED', 'ACTIVE', 'COMPLETED', 'CANCELLED'))
) ENGINE=InnoDB;

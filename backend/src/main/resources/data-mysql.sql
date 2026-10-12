INSERT INTO customers (id, full_name, email, phone, address, driving_license_number)
VALUES
  (1, 'Aarav Mehta', 'aarav.mehta@example.com', '+91 98765 43210', 'Pune, Maharashtra', 'MH1420110001234'),
  (2, 'Maya Iyer', 'maya.iyer@example.com', '+91 91234 56780', 'Bengaluru, Karnataka', 'KA0320210005678'),
  (3, 'Kabir Shah', 'kabir.shah@example.com', '+91 99887 76655', 'Mumbai, Maharashtra', 'MH0120190002345')
ON DUPLICATE KEY UPDATE id = VALUES(id);

INSERT INTO vehicles (vehicle_number, brand, model, vehicle_type, color, daily_rental_price, availability_status, image_url)
VALUES
  ('MH12AB1234', 'Toyota', 'Innova Crysta', 'SUV', 'Pearl White', 4200.00, 'AVAILABLE', NULL),
  ('KA03CD5678', 'Hyundai', 'Creta', 'SUV', 'Titan Grey', 3200.00, 'AVAILABLE', NULL),
  ('MH01EF9012', 'Honda', 'City', 'Sedan', 'Radiant Red', 2600.00, 'AVAILABLE', NULL),
  ('MH14GH3456', 'Tata', 'Nexon EV', 'Electric', 'Ocean Blue', 3500.00, 'AVAILABLE', NULL),
  ('KA05JK7890', 'Maruti Suzuki', 'Swift', 'Hatchback', 'Arctic White', 1800.00, 'AVAILABLE', NULL),
  ('MH02WX2468', 'Honda', 'Amaze', 'Sedan', 'Metallic Silver', 2300.00, 'AVAILABLE', NULL),
  ('KA51YZ1357', 'Mahindra', 'XUV700', 'SUV', 'Everest White', 5200.00, 'AVAILABLE', NULL),
  ('MH14QX8642', 'Maruti Suzuki', 'Baleno', 'Hatchback', 'Nexa Blue', 2200.00, 'AVAILABLE', NULL),
  ('DL8CST6789', 'Tata', 'Tiago EV', 'Electric', 'Tropical Mist', 2500.00, 'AVAILABLE', NULL),
  ('MH01EV7521', 'Kia', 'Carens', 'SUV', 'Sparkling Silver', 3700.00, 'AVAILABLE', NULL)
ON DUPLICATE KEY UPDATE vehicle_number = vehicle_number;

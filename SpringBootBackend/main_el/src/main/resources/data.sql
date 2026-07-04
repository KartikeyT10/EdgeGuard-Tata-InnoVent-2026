-- Seed data for EdgeGuard demo vehicles
-- These match the initial mock vehicles in Dashboard.tsx

INSERT INTO vehicles (id, type, transmission, mileage_km, status, engine_rpm, lube_oil_pressure, fuel_pressure, coolant_pressure, lube_oil_temp, coolant_temp, engine_status, last_updated)
VALUES ('V001', 'Sedan', 'Automatic', 50000, 'completed', 2500, 45, 55, 15, 190, 195, 'Normal', CURRENT_DATE());

INSERT INTO vehicles (id, type, transmission, mileage_km, status, engine_rpm, lube_oil_pressure, fuel_pressure, coolant_pressure, lube_oil_temp, coolant_temp, engine_status, last_updated)
VALUES ('V002', 'SUV', 'Manual', 75000, 'processing', 3200, 42, 52, 16, 195, 200, 'Warning', CURRENT_DATE());

INSERT INTO vehicles (id, type, transmission, mileage_km, status, engine_rpm, lube_oil_pressure, fuel_pressure, coolant_pressure, lube_oil_temp, coolant_temp, engine_status, last_updated)
VALUES ('V003', 'Truck', 'Manual', 120000, 'failed', 3800, 38, 48, 18, 205, 210, 'Critical', CURRENT_DATE());

CREATE TABLE vehicles (
    entry_no int auto_increment primary key,
    id VARCHAR(10),
    type VARCHAR(50),
    transmission VARCHAR(50),
    mileage_km INT,
    status VARCHAR(50),
    engine_rpm INT,
    lube_oil_pressure INT,
    fuel_pressure INT,
    coolant_pressure INT,
    lube_oil_temp INT,
    coolant_temp INT,
    engine_status VARCHAR(50),
    last_updated DATE
);

-- Seed data for EdgeGuard demo vehicles
INSERT INTO vehicles (id, type, transmission, mileage_km, status, engine_rpm, lube_oil_pressure, fuel_pressure, coolant_pressure, lube_oil_temp, coolant_temp, engine_status, last_updated)
VALUES ('V001', 'Sedan', 'Automatic', 50000, 'completed', 2500, 45, 55, 15, 190, 195, 'Normal', CURDATE());

INSERT INTO vehicles (id, type, transmission, mileage_km, status, engine_rpm, lube_oil_pressure, fuel_pressure, coolant_pressure, lube_oil_temp, coolant_temp, engine_status, last_updated)
VALUES ('V002', 'SUV', 'Manual', 75000, 'processing', 3200, 42, 52, 16, 195, 200, 'Warning', CURDATE());

INSERT INTO vehicles (id, type, transmission, mileage_km, status, engine_rpm, lube_oil_pressure, fuel_pressure, coolant_pressure, lube_oil_temp, coolant_temp, engine_status, last_updated)
VALUES ('V003', 'Truck', 'Manual', 120000, 'failed', 3800, 38, 48, 18, 205, 210, 'Critical', CURDATE());

package com.example.main_el.repo;

import com.example.main_el.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, String> {
    List<Vehicle> findAllById(String vehicleId);

    @Query("SELECT v FROM Vehicle v WHERE v.id = :vehicleId ORDER BY v.lastUpdated DESC")
    List<Vehicle> findLatestByVehicleId(String vehicleId);

}
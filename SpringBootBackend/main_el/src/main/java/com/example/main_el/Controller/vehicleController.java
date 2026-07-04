package com.example.main_el.Controller;

import com.example.main_el.DTO.PredictionRequest;
import com.example.main_el.DTO.PredictionRequest1;
import com.example.main_el.DTO.PredictionResponse;
import com.example.main_el.DTO.PredictionResponse1;
import com.example.main_el.DTO.VehicleRequest;
import com.example.main_el.Service.VehicleService;
import com.example.main_el.model.Vehicle;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin
@RequestMapping("/api")
public class vehicleController {

    @Autowired
    private VehicleService vehicleService;

    @PostMapping("/response")
    public ResponseEntity<PredictionResponse1> predict(@RequestBody PredictionRequest1 request) {
        PredictionResponse1 response = vehicleService.getResponse(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/vehicles")
    public List<Vehicle> getVehiclesById(@RequestBody VehicleRequest request) {
        return vehicleService.getVehiclesById(request.getVehicleId());
    }

    @PostMapping("/predict")
    public ResponseEntity<PredictionResponse> predict(@RequestBody PredictionRequest request) {
        // Save the request
        vehicleService.saveRequest(request);

        // Get the prediction probability
        double probability = vehicleService.getPrediction(request);

        // Fetch all vehicle sensor data for the vehicle ID
        String vehicleId = request.getId();
        List<Vehicle> vehicles = vehicleService.findAllByVehicleId(vehicleId);

        if (vehicles.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        // Compute estimatedMaintenanceDate from probability
        String estimatedMaintenanceDate = computeMaintenanceDate(probability);

        // Create the response object with probability, sensor data, and estimated date
        PredictionResponse response = new PredictionResponse(probability, vehicles, estimatedMaintenanceDate);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/report")
    public Optional<Vehicle> getLatestVehicleById(@RequestBody VehicleRequest request) {
        return vehicleService.getLatestVehicleById(request.getVehicleId());
    }

    /**
     * Compute an estimated maintenance date based on the prediction probability.
     * Higher probability = sooner maintenance needed.
     */
    private String computeMaintenanceDate(double probability) {
        LocalDate now = LocalDate.now();
        LocalDate maintenanceDate;

        if (probability >= 0.85) {
            // 1-7 days (Urgent)
            maintenanceDate = now.plusDays(3);
        } else if (probability >= 0.75) {
            // 1-3 months
            maintenanceDate = now.plusMonths(1);
        } else if (probability >= 0.55) {
            // 3-6 months
            maintenanceDate = now.plusMonths(4);
        } else {
            // 6-12 months
            maintenanceDate = now.plusMonths(9);
        }

        return maintenanceDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }
}
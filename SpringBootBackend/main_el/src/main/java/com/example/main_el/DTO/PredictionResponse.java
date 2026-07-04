package com.example.main_el.DTO;

import com.example.main_el.model.Vehicle;

import java.util.List;

public class PredictionResponse {
    private double probability;
    private List<Vehicle> vehicles;
    private String estimatedMaintenanceDate;

    // Constructor
    public PredictionResponse(double probability, List<Vehicle> vehicles) {
        this.probability = probability;
        this.vehicles = vehicles;
    }

    public PredictionResponse(double probability, List<Vehicle> vehicles, String estimatedMaintenanceDate) {
        this.probability = probability;
        this.vehicles = vehicles;
        this.estimatedMaintenanceDate = estimatedMaintenanceDate;
    }

    // Getters and Setters
    public double getProbability() {
        return probability;
    }

    public void setProbability(double probability) {
        this.probability = probability;
    }

    public List<Vehicle> getVehicles() {
        return vehicles;
    }

    public void setVehicles(List<Vehicle> vehicles) {
        this.vehicles = vehicles;
    }

    public String getEstimatedMaintenanceDate() {
        return estimatedMaintenanceDate;
    }

    public void setEstimatedMaintenanceDate(String estimatedMaintenanceDate) {
        this.estimatedMaintenanceDate = estimatedMaintenanceDate;
    }
}
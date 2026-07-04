package com.example.main_el.DTO;

import java.util.Date;

public class PredictionRequest {
    private String id;
    private String type;
    private String transmission;
    private int mileageKm;
    private String status;
    private int engineRpm;
    private int lubeOilPressure;
    private int fuelPressure;
    private int coolantPressure;
    private int lubeOilTemp;
    private int coolantTemp;
    private String engineStatus;
    private Date lastUpdated;
    private int temperatureDifference;

    public int getTemperatureDifference() {
        return temperatureDifference;
    }

    public void setTemperatureDifference(int temperatureDifference) {
        this.temperatureDifference = temperatureDifference;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTransmission() { return transmission; }
    public void setTransmission(String transmission) { this.transmission = transmission; }

    public int getMileageKm() { return mileageKm; }
    public void setMileageKm(int mileageKm) { this.mileageKm = mileageKm; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getEngineRpm() { return engineRpm; }
    public void setEngineRpm(int engineRpm) { this.engineRpm = engineRpm; }

    public int getLubeOilPressure() { return lubeOilPressure; }
    public void setLubeOilPressure(int lubeOilPressure) { this.lubeOilPressure = lubeOilPressure; }

    public int getFuelPressure() { return fuelPressure; }
    public void setFuelPressure(int fuelPressure) { this.fuelPressure = fuelPressure; }

    public int getCoolantPressure() { return coolantPressure; }
    public void setCoolantPressure(int coolantPressure) { this.coolantPressure = coolantPressure; }

    public int getLubeOilTemp() { return lubeOilTemp; }
    public void setLubeOilTemp(int lubeOilTemp) { this.lubeOilTemp = lubeOilTemp; }

    public int getCoolantTemp() { return coolantTemp; }
    public void setCoolantTemp(int coolantTemp) { this.coolantTemp = coolantTemp; }

    public String getEngineStatus() { return engineStatus; }
    public void setEngineStatus(String engineStatus) { this.engineStatus = engineStatus; }

    public Date getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Date lastUpdated) { this.lastUpdated = lastUpdated; }
}
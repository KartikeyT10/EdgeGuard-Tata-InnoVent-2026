export interface Vehicle {
  id: string;
  type: string;
  transmission: 'Automatic' | 'Manual';
  mileage: number;
  status: 'completed' | 'processing' | 'failed';
  lastUpdated: string;
  sensorData: {
    engineRPM: number;
    lubeOilPressure: number;
    fuelPressure: number;
    coolantPressure: number;
    lubeOilTemp: number;
    coolantTemp: number;
    engineStatus: 'Normal' | 'Warning' | 'Critical';
  };
  predictions: {
    maintenanceProbability: number;
    estimatedMaintenanceDate: string;
    partFailureProbability: number;
  };
}

export interface Report {
  id: string;
  title: string;
  date: string;
  downloadUrl: string;
}
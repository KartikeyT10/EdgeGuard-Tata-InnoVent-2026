import React, { useState, useEffect } from 'react';
import { Car, Thermometer, Gauge, AlertTriangle, Plus, X } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Vehicle } from '../types';





const initialMockVehicles: Vehicle[] = [
  {
    id: 'V001',
    type: 'Sedan',
    transmission: 'Automatic',
    mileage: 50000,
    status: 'completed',
    lastUpdated: '2024-03-10',
    sensorData: {
      engineRPM: 2500,
      lubeOilPressure: 45,
      fuelPressure: 55,
      coolantPressure: 15,
      lubeOilTemp: 190,
      coolantTemp: 195,
      engineStatus: 'Normal'
    },
    predictions: {
      maintenanceProbability: 35,
      estimatedMaintenanceDate: '2024-03-25',
      partFailureProbability: 35
    }
  },
  {
    id: 'V002',
    type: 'SUV',
    transmission: 'Manual',
    mileage: 75000,
    status: 'processing',
    lastUpdated: '2024-03-11',
    sensorData: {
      engineRPM: 3200,
      lubeOilPressure: 42,
      fuelPressure: 52,
      coolantPressure: 16,
      lubeOilTemp: 195,
      coolantTemp: 200,
      engineStatus: 'Warning'
    },
    predictions: {
      maintenanceProbability: 75,
      estimatedMaintenanceDate: '2024-03-20',
      partFailureProbability: 75
    }
  },
  {
    id: 'V003',
    type: 'Truck',
    transmission: 'Manual',
    mileage: 120000,
    status: 'failed',
    lastUpdated: '2024-03-11',
    sensorData: {
      engineRPM: 3800,
      lubeOilPressure: 38,
      fuelPressure: 48,
      coolantPressure: 18,
      lubeOilTemp: 205,
      coolantTemp: 210,
      engineStatus: 'Critical'
    },
    predictions: {
      maintenanceProbability: 90,
      estimatedMaintenanceDate: '2024-03-15',
      partFailureProbability: 90
    }
  }
];



const initialFormData = {
  id: '',
  type: '',
  transmission: 'Automatic' as const,
  mileage: 0,
  status: 'completed' as const,
  sensorData: {
    engineRPM: 0,
    lubeOilPressure: 0,
    fuelPressure: 0,
    coolantPressure: 0,
    lubeOilTemp: 0,
    coolantTemp: 0,
    engineStatus: 'Normal' as const
  }
};

// Function to determine engine status based on sensor values
const determineEngineStatus = (sensorData: typeof initialFormData.sensorData) => {
  const { engineRPM, lubeOilTemp, coolantTemp } = sensorData;
  if (engineRPM > 3500 || lubeOilTemp > 200 || coolantTemp > 205) {
    return 'Critical';
  } else if (engineRPM > 3000 || lubeOilTemp > 190 || coolantTemp > 195) {
    return 'Warning';
  }
  return 'Normal';
};

export function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialMockVehicles);
  const [showForm, setShowForm] = useState(false);

  // Load form data from local storage or use default values
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('formData');
    return savedData ? JSON.parse(savedData) : initialFormData;
  });
 
  


  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('formData', JSON.stringify(formData));
  }, [formData]);
  function getEstimatedMaintenance(probability: number): string {
    probability = probability/100
    if (probability >= 0.85) {
      return "1–7 days (Urgent Action Required)";
    } else if (probability >= 0.75) {
      return "1–3 months (Schedule Maintenance Soon)";
    } else if (probability >= 0.55) {
      return "3–6 months (Routine Maintenance)";
    } else {
      return "6–12 months (Regular Maintenance)";
    }
  }

  // Handle input changes (supports nested sensorData updates)
const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value } = e.target;
            if (name.includes('.')) {
              const [parent, child] = name.split('.') as ['sensorData', keyof typeof initialFormData.sensorData];
              setFormData((prev: typeof initialFormData) => ({
                ...prev,
                [parent]: {
                  ...prev[parent],
                  [child]: value
                }
              }));
            } else {
              setFormData((prev: typeof initialFormData) => ({
                ...prev,
                [name]: value
              }));
            }
        };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    // Convert sensor values to numbers and determine engine status
    const sensorData = {
      ...formData.sensorData,
      engineRPM: Number(formData.sensorData.engineRPM),
      lubeOilPressure: Number(formData.sensorData.lubeOilPressure),
      fuelPressure: Number(formData.sensorData.fuelPressure),
      coolantPressure: Number(formData.sensorData.coolantPressure),
      lubeOilTemp: Number(formData.sensorData.lubeOilTemp),
      coolantTemp: Number(formData.sensorData.coolantTemp),
      engineStatus: determineEngineStatus(formData.sensorData)
    };
    const sensorData1 = {
      id: formData.id,
      type: formData.type,
      transmission: formData.transmission,
      mileageKm: Number(formData.mileage),
      status: formData.status,
      engineRpm: Number(formData.sensorData.engineRPM),
      lubeOilPressure: Number(formData.sensorData.lubeOilPressure),
      fuelPressure: Number(formData.sensorData.fuelPressure),
      coolantPressure: Number(formData.sensorData.coolantPressure),
      lubeOilTemp: Number(formData.sensorData.lubeOilTemp),
      coolantTemp: Number(formData.sensorData.coolantTemp),
      temperatureDifference: Number(formData.sensorData.coolantTemp) - Number(formData.sensorData.lubeOilTemp),
      engineStatus: determineEngineStatus(formData.sensorData)
  };
    // Create the newVehicle object with initial dummy values for maintenance predictions
    const newVehicle: Vehicle = {
      id: formData.id,
      type: formData.type,
      transmission: formData.transmission,
      mileage: Number(formData.mileage),
      status: formData.status,
      lastUpdated: new Date().toISOString().split('T')[0],
      sensorData,
      predictions: {
        maintenanceProbability: Math.floor(Math.random() * 100),
        estimatedMaintenanceDate: new Date(Date.now() + Math.random() * 12096e5).toISOString().split('T')[0],
        partFailureProbability: Math.floor(Math.random() * 100)
      }
    };


  
    // Update the vehicles state with the new vehicle (initial data before response)
    setVehicles(prev => [...prev, newVehicle]);
  
    // Reset form data and hide the form
    setFormData(initialFormData);
    setShowForm(false);
  
    try {
      // Send the data to the backend via POST request
      const response = await fetch('http://localhost:8080/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sensorData1), // Send the newVehicle object as the request body
      });
  
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
      const result = await response.json();
      console.log('Vehicle added successfully:', result);

      // Update the predictions with the received data
      const updatedVehicle = {
        ...newVehicle,
        predictions: {
          maintenanceProbability: Math.floor(result.probability*100),
          estimatedMaintenanceDate: result.estimatedMaintenanceDate || new Date(Date.now() + Math.random() * 12096e5).toISOString().split('T')[0],
          partFailureProbability: Math.floor(result.probability*100)
        }
      };
  
      // Update the vehicle state with the updated values
      setVehicles(prev => 
        prev.map(vehicle => 
          vehicle.id === newVehicle.id ? updatedVehicle : vehicle
        )
      );
  
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Predictive Maintenance Dashboard</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} />
          Add Vehicle
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Vehicle</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle ID</label>
                  <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vehicle Type</label>
                  <input
                    type="text"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Transmission</label>
                  <select
                    name="transmission"
                    value={formData.transmission}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mileage (km)</label>
                  <input
                    type="number"
                    name="mileage"
                    value={formData.mileage}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Engine RPM</label>
                  <input
                    type="number"
                    name="sensorData.engineRPM"
                    value={formData.sensorData.engineRPM}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lube Oil Pressure (PSI)</label>
                  <input
                    type="number"
                    name="sensorData.lubeOilPressure"
                    value={formData.sensorData.lubeOilPressure}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fuel Pressure (PSI)</label>
                  <input
                    type="number"
                    name="sensorData.fuelPressure"
                    value={formData.sensorData.fuelPressure}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Coolant Pressure (PSI)</label>
                  <input
                    type="number"
                    name="sensorData.coolantPressure"
                    value={formData.sensorData.coolantPressure}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lube Oil Temperature (°F)</label>
                  <input
                    type="number"
                    name="sensorData.lubeOilTemp"
                    value={formData.sensorData.lubeOilTemp}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Coolant Temperature (°F)</label>
                  <input
                    type="number"
                    name="sensorData.coolantTemp"
                    value={formData.sensorData.coolantTemp}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Add Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Vehicles"
          value={vehicles.length}
          icon={<Car size={24} />}
        />
        <StatCard
          title="Avg Maintenance Probability"
          value={`${Math.round(vehicles.reduce((acc, v) => acc + v.predictions.maintenanceProbability, 0) / vehicles.length)}%`}
          icon={<AlertTriangle size={24} />}
        />
        <StatCard
          title="Critical Alerts"
          value={vehicles.filter(v => v.sensorData.engineStatus === 'Critical').length}
          icon={<Thermometer size={24} />}
        />
        <StatCard
          title="Avg Part Failure Risk"
          value={`${Math.round(vehicles.reduce((acc, v) => acc + v.predictions.partFailureProbability, 0) / vehicles.length)}%`}
          icon={<Gauge size={24} />}
        />
      </div>
      <div className="flex justify-center bg-gray-100 dark:bg-gray-900 p-2">
  <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 max-h-[calc(100vh-100px)] overflow-auto">
    <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Maintenance Predictions</h2>
    <div className="space-y-1">
      {vehicles.map((vehicle) => (
        <div key={vehicle.id} className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium text-gray-900 dark:text-white">Vehicle {vehicle.id}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold
              ${vehicle.predictions.maintenanceProbability > 70 ? 'bg-red-100 text-red-800' :
                vehicle.predictions.maintenanceProbability > 30 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'}`}>
              {vehicle.predictions.maintenanceProbability}% Risk
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300">
            <p>Estimated Maintenance: {getEstimatedMaintenance(vehicle.predictions.maintenanceProbability)}</p>
            <p>Part Failure Risk: {vehicle.predictions.maintenanceProbability}%</p>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

    

      
      

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <h2 className="text-lg font-semibold p-6 text-gray-900 dark:text-white">Vehicle Details</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transmission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mileage (km)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Engine RPM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lube Oil Press.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Fuel Press.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Coolant Press.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lube Oil Temp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Coolant Temp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Engine Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{vehicle.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{vehicle.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{vehicle.transmission}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{vehicle.mileage.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${vehicle.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        vehicle.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {vehicle.sensorData.engineRPM} RPM
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {vehicle.sensorData.lubeOilPressure} PSI
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {vehicle.sensorData.fuelPressure} PSI
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {vehicle.sensorData.coolantPressure} PSI
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {vehicle.sensorData.lubeOilTemp}°F
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {vehicle.sensorData.coolantTemp}°F
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${vehicle.sensorData.engineStatus === 'Normal' ? 'bg-green-100 text-green-800' : 
                        vehicle.sensorData.engineStatus === 'Warning' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {vehicle.sensorData.engineStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{vehicle.lastUpdated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
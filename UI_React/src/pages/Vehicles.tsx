import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


const initialFormData1: Record<string, string> = {
    id:'',
    confidence:'',
};

interface Vehicle {
    id: string;
    type: string;
    transmission: string;
    mileageKm: number;
    status: string;
    engineRpm: number;
    lubeOilPressure: number;
    fuelPressure: number;
    coolantPressure: number;
    lubeOilTemp: number;
    coolantTemp: number;
    engineStatus: string;
    lastUpdated: string;
  }
  
  

export function Vehicless() {

    const [formData1, setFormData1] = useState<Record<string, string>>(initialFormData1);
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData1(prev => ({
            ...prev,
            [name]: value
        }));
    };

        const [chartData, setChartData] = useState<any[]>([]);
        const [loading, setLoading] = useState(false);
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
      
        // Function to fetch and transform the API data
        const handleFetchData = async () => {
          setLoading(true); // Optionally set a loading state
          const vid = {
            vehicleId: formData1.id
        }
          try {
            const response = await fetch('http://localhost:8080/api/vehicles', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              // Replace this with your actual payload
              body: JSON.stringify(vid),
            });
      
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
      
            const result = await response.json();
            console.log('Vehicle added successfully:', result);
      
            // Transform the API response into the desired chart data format.
            // Adjust the mapping based on your API response structure.
            const transformedData = result.map((vehicle: Vehicle) => ({
                time: vehicle.lastUpdated,       // Using lastUpdated for the x-axis
                engineRPM: vehicle.engineRpm,      // Y-axis value for Engine RPM
                fuelPressure: vehicle.fuelPressure, // Y-axis value for Fuel Pressure
                temperature: vehicle.lubeOilTemp, 
                pressure: vehicle.coolantPressure ,  
                lubeOilPressure:vehicle.lubeOilPressure, 
                coolantTemp:vehicle.coolantTemp       // Using lastUpdated for the x-axis
                   // Y-axis value for Engine RPM
                 // Y-axis value for Fuel Pressure
              }));
              
      
            // Update state to reflect the new chart data.
            setChartData(transformedData);
          } catch (error) {
            console.error('Error fetching vehicle data:', error);
          } finally {
            setLoading(false); // Reset the loading state
          }
        };
      
  
    return (
        <div className="p-6 space-y-8">
          {/* Heading */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Analyze Particular Vehicle Data</h1>
      
          {/* Vehicle ID Input Form */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Enter Vehicle ID</h4>
            <div className="space-y-6">
              <input
                type="text"
                name="id"
                value={formData1.id}
                onChange={handleInputChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 p-4 text-lg"
                placeholder="Enter Vehicle ID"
                required
              />
              <input
                type="number"
                name="confidence"
                value={formData1.confidence}
                onChange={handleInputChange}
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 p-4 text-lg"
                placeholder="Enter Confidence %"
                required
              />
              <button
                type="submit"
                onClick={handleFetchData}
                className="w-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition duration-300 font-semibold text-lg"
              >
                Get Vehicle Details
              </button>
            </div>
          </div>
      
          {/* Centered Sensor Data Trends Section */}
          <div className="flex justify-center items-center my-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-10 w-full max-w-4xl">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Sensor Data Trends</h2>
              
              {/* Line Chart */}
              <div className="h-[400px] bg-gray-100 dark:bg-gray-700 rounded-lg">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="engineRPM" stroke="#3B82F6" name="Engine RPM" />
                    <Line type="monotone" dataKey="fuelPressure" stroke="#10B981" name="Fuel Pressure (PSI)" />
                    <Line type="monotone" dataKey="pressure" stroke="#EF4444" name="Pressure (°F)" />
                    <Line type="monotone" dataKey="lubeOilTemp" stroke="#F59E0B" name="Lube Oil Temp (°F)" />
                    <Line type="monotone" dataKey="lubeOilPressure" stroke="#8B5CF6" name="Lube Oil Pressure (PSI)" />
                    <Line type="monotone" dataKey="coolantTemp" stroke="#14B8A6" name="Coolant Temp (°F)" />

                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
      
          {/* Vehicle Status Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex justify-between items-center mb-4">
            <div>
              <span className="text-xl font-medium text-gray-900 dark:text-white">Vehicle ID: {formData1.id}</span>
            </div>
            <div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold
                  ${parseFloat(formData1.confidence) > 70 ? 'bg-red-100 text-red-800' :
                    parseFloat(formData1.confidence) > 30 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'}`}
              >
                {formData1.confidence}% Risk
              </span>
            </div>
          </div>
      
          {/* Vehicle Details Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
              <p className="font-medium text-gray-900 dark:text-white">Estimated Maintenance: {getEstimatedMaintenance(parseFloat(formData1.confidence))}</p>
              <p className="font-medium text-gray-900 dark:text-white">Part Failure Risk: {formData1.confidence} %</p>
            </div>
          </div>
        </div>
      );
      
      
}      
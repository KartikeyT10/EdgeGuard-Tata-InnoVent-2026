import React, { useState } from 'react';
import { Download } from 'lucide-react';

interface Report {
  id: string;
  title: string;
  date: string;
  downloadUrl: string;
  content: string;
}

interface VehicleDetails {
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

interface ReportRequest {
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
  confidenceValue: number;
}

interface ApiResponse {
  rawResponse: string;
}

export function Reports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState('');
  const [confidenceValue, setConfidenceValue] = useState(85);

  const formatMarkdown = (markdown: string): string => {
    return markdown
      .replace(/### (.*?)\n/g, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      .replace(/#### (.*?)\n/g, '<h2 class="text-xl font-semibold mt-4 mb-3">$1</h2>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/- /g, '• ')
      .split('\n')
      .map(line => 
        line.trim() ? `<p class="my-2">${line}</p>` : ''
      )
      .join('');
  };

  const prepareReportRequest = (vehicleDetails: VehicleDetails): ReportRequest => {
    const { 
      type, transmission, mileageKm, status, engineRpm,
      lubeOilPressure, fuelPressure, coolantPressure,
      lubeOilTemp, coolantTemp
    } = vehicleDetails;

    return {
      type,
      transmission,
      mileageKm,
      status,
      engineRpm,
      lubeOilPressure,
      fuelPressure,
      coolantPressure,
      lubeOilTemp,
      coolantTemp,
      confidenceValue
    };
  };

  const generateReport = async () => {
    if (!vehicleId.trim()) {
      setError('Please enter a vehicle ID.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get vehicle details
      const vehicleResponse = await fetch('http://localhost:8080/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicleId })
      });
      
      if (!vehicleResponse.ok) {
        throw new Error('Failed to fetch vehicle details');
      }
      
      const vehicleDetails: VehicleDetails = await vehicleResponse.json();
      const reportRequest = prepareReportRequest(vehicleDetails);

      // Generate report
      const reportResponse = await fetch('http://localhost:8080/api/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportRequest),
      });

      if (!reportResponse.ok) {
        throw new Error('Failed to generate report');
      }

      const data: ApiResponse = await reportResponse.json();
      const formattedContent = formatMarkdown(data.rawResponse);

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Vehicle Analysis Report - ${vehicleId}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 800px; 
              margin: 2rem auto; 
              padding: 0 1rem;
              line-height: 1.6;
              color: #333;
            }
            h1 { 
              color: #1a365d;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 0.5rem;
            }
            h2 { 
              color: #2563eb;
              margin-top: 2rem;
            }
            .metadata { 
              background: #f8fafc;
              padding: 1.5rem;
              border-radius: 0.5rem;
              margin: 1rem 0;
              border: 1px solid #e2e8f0;
            }
            p { margin: 0.75rem 0; }
            strong { color: #1a365d; }
            .content {
              background: white;
              padding: 2rem;
              border-radius: 0.5rem;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <h1>Vehicle Analysis Report</h1>
          <div class="metadata">
            <p><strong>Vehicle ID:</strong> ${vehicleId}</p>
            <p><strong>Confidence Value:</strong> ${confidenceValue}%</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div class="content">
            ${formattedContent}
          </div>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const newReport: Report = {
        id: Date.now().toString(),
        title: `Vehicle Analysis Report - ${vehicleId}`,
        date: new Date().toLocaleDateString(),
        downloadUrl: URL.createObjectURL(blob),
        content: data.rawResponse
      };

      setReports(prev => [...prev, newReport]);
      setVehicleId('');
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError('Failed to generate report. Please check the vehicle ID and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Vehicle Analysis Reports
        </h1>

        <div className="flex gap-4 items-end mb-6">
          <div className="flex-1">
            <label 
              htmlFor="vehicleId" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Vehicle ID
            </label>
            <input
              id="vehicleId"
              type="text"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              placeholder="Enter vehicle ID..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 
                       dark:text-white"
            />
          </div>
          <div className="flex-1">
            <label 
              htmlFor="confidenceValue" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Confidence Value (%)
            </label>
            <input
              id="confidenceValue"
              type="number"
              min="0"
              max="100"
              value={confidenceValue}
              onChange={(e) => setConfidenceValue(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                       focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 
                       dark:text-white"
            />
          </div>
          <button
            onClick={generateReport}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 
                     focus:outline-none focus:ring disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Generating Report...' : 'Generate Report'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 
                         dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {reports.length > 0 && (
          <div className="mt-6 space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {report.date}
                    </p>
                  </div>
                  <a
                    href={report.downloadUrl}
                    download={`vehicle-report-${vehicleId}.html`}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-600"
                  >
                    <Download size={20} />
                    <span>Download HTML Report</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Reports;
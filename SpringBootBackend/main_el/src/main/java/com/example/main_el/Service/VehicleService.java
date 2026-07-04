package com.example.main_el.Service;

import com.example.main_el.DTO.PredictionRequest;
import com.google.gson.JsonArray;
import com.example.main_el.DTO.PredictionRequest1;
import com.example.main_el.DTO.PredictionResponse1;
import com.example.main_el.model.Vehicle;
import com.example.main_el.repo.VehicleRepository;
import com.google.gson.JsonObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class VehicleService {
    private static final String PYTHON_SERVICE_URL = "http://127.0.0.1:5000/predict";
    private final RestTemplate restTemplate = new RestTemplate();
    @Autowired
    private VehicleRepository repo;

    private static final String API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

    @Value("${groq.api.key:}")
    private String apiKey;


    public PredictionResponse1 getResponse(PredictionRequest1 request) {
        try {
            // Generate the prompt based on the request object
            String prompt = createPrompt(request);

            // Construct the JSON payload
            JsonObject requestBody = new JsonObject();
            requestBody.addProperty("model", "llama-3.3-70b-versatile");
            requestBody.addProperty("temperature", 1);
            requestBody.addProperty("max_completion_tokens", 1024);



            // Add messages
            JsonArray messages = new JsonArray();
            JsonObject userMessage = new JsonObject();
            userMessage.addProperty("role", "user");
            userMessage.addProperty("content", prompt);
            messages.add(userMessage);

            requestBody.add("messages", messages);

            // Send the HTTP request to the Groq model API
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(API_ENDPOINT))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody.toString()))
                    .build();

            // Send request and handle the response
            HttpResponse<String> response = client.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            // Check if the request was successful
            if (response.statusCode() == 200) {
                // Create the PredictionResponse1 object
                PredictionResponse1 predictionResponse = new PredictionResponse1();
                predictionResponse.setRawResponse(extractResponseFromJson(response.body()));

                return predictionResponse;
            } else {
                throw new RuntimeException("Groq API Error: " + response.body());
            }

        } catch (Exception e) {
            throw new RuntimeException("Error calling Groq model: " + e.getMessage(), e);
        }
    }

    private String extractResponseFromJson(String responseBody) {
        JsonObject responseJson = new com.google.gson.JsonParser().parse(responseBody).getAsJsonObject();
        return responseJson.get("choices")
                .getAsJsonArray()
                .get(0)
                .getAsJsonObject()
                .get("message")
                .getAsJsonObject()
                .get("content")
                .getAsString();
    }

    // Create the prompt based on the given request data
    private String createPrompt(PredictionRequest1 request) {
        if (request.getQuery() != null && !request.getQuery().trim().isEmpty()) {
            return "You are EdgeGuard, an in-vehicle AI copilot speaking directly to a driver through "
                    + "voice while they are driving. Your response will be converted to speech and heard, "
                    + "not read — the driver cannot see a screen right now. Follow these rules strictly:\n\n"
                    + "1. SPEAK IN PLAIN SPOKEN SENTENCES ONLY. Never use markdown, bullet points, "
                    + "asterisks, numbered lists, headers, or any text formatting. Write exactly as a "
                    + "calm human passenger would say it out loud.\n"
                    + "2. LEAD WITH THE ANSWER, NOT THE EXPLANATION. The first sentence must directly "
                    + "answer the driver's question or state the most urgent fact. Reasoning and detail "
                    + "come after, only if needed.\n"
                    + "3. KEEP IT SHORT. Two to three sentences maximum for normal questions. One sentence "
                    + "if the situation is urgent or safety-critical. A driver cannot process a long "
                    + "answer while focused on the road.\n"
                    + "4. USE NATURAL, CONVERSATIONAL LANGUAGE. No technical jargon, no sensor names like "
                    + "\"PID\" or \"OBD-II,\" no percentages with decimals, no raw numbers unless the driver "
                    + "specifically needs a number to make a decision (e.g. \"you have about 40 kilometers "
                    + "before you should stop,\" not \"risk score is 73.4 out of 100\").\n"
                    + "5. NEVER cause alarm disproportionate to the actual risk. Match your tone to "
                    + "severity:\n"
                    + "   - Normal: calm, brief, reassuring. Example: \"Everything looks fine, no issues "
                    + "right now.\"\n"
                    + "   - Caution: clear but not alarming. Example: \"Your brake pads are wearing down. "
                    + "It's fine for now, but get them checked soon.\"\n"
                    + "   - Critical/urgent: direct, calm, actionable, no hedging. Example: \"Your engine is "
                    + "overheating. Pull over safely as soon as you can.\"\n"
                    + "6. ALWAYS END WITH A CLEAR NEXT STEP if there is any issue at all — what the driver "
                    + "should do, not just what is wrong. Never leave a problem unresolved without "
                    + "guidance.\n"
                    + "7. NEVER ask the driver a clarifying question mid-drive unless absolutely "
                    + "necessary. Make a reasonable assumption and answer directly instead of "
                    + "requesting more input, since the driver's attention should stay on the road, not "
                    + "on a back-and-forth conversation.\n"
                    + "8. If asked something outside vehicle health and safety (weather, navigation, "
                    + "general chat), answer briefly and naturally, then gently steer back: mention you "
                    + "are best suited to vehicle status and safety questions.\n"
                    + "9. Do not repeat the driver's question back to them. Do not say phrases like \"great "
                    + "question\" or \"I understand you're asking about.\" Just answer.\n"
                    + "10. Ground every answer in the live sensor data provided below. Never invent sensor "
                    + "values. If a value is not provided, say you do not have that reading right now "
                    + "rather than guessing.\n\n"
                    + "Current vehicle telemetry:\n"
                    + "{\n"
                    + "  \"engineTemperature\": \"" + request.getCoolantTemp() + "°C\",\n"
                    + "  \"engineRpm\": \"" + request.getEngineRpm() + "\",\n"
                    + "  \"brakePadWear\": \"" + request.getLubeOilTemp() + "%\",\n"
                    + "  \"tyrePressure\": \"" + request.getCoolantPressure() + " PSI\",\n"
                    + "  \"batteryVoltage\": \"" + request.getLubeOilPressure() + " V\"\n"
                    + "}\n\n"
                    + "Current risk assessment:\n"
                    + "Edge Risk Score: " + request.getConfidenceValue() + "/100\n\n"
                    + "Driver's Question:\n"
                    + "\"" + request.getQuery() + "\"";
        }

        return "You are tasked with generating a detailed engine health report based on the following sensor data. "
                + "The data represents various parameters that influence the engine's condition, and you are required to provide a comprehensive analysis.\n\n"
                + "### Sensor Data:\n"
                + "Type: \"" + request.getType() + "\"\n"
                + "Transmission: \"" + request.getTransmission() + "\"\n"
                + "Mileage (km): " + request.getMileageKm() + "\n"
                + "Status: \"" + request.getStatus() + "\"\n"
                + "Engine RPM: " + request.getEngineRpm() + "\n"
                + "Lube Oil Pressure: " + request.getLubeOilPressure() + "\n"
                + "Fuel Pressure: " + request.getFuelPressure() + "\n"
                + "Coolant Pressure: " + request.getCoolantPressure() + "\n"
                + "Lube Oil Temperature: " + request.getLubeOilTemp() + "\n"
                + "Coolant Temperature: " + request.getCoolantTemp() + "\n\n"
                + "### Confidence Value:\n"
                + "Engine Breakdown Possibility: " + request.getConfidenceValue() + "%\n\n"
                + "### Estimated Maintenance Timeline Based on Confidence:\n"
                + (request.getConfidenceValue() >= 85 ? "1–7 days (Urgent Action Required). Immediate maintenance is necessary to prevent costly breakdowns." :
                request.getConfidenceValue() >= 75 ? "1–3 months (Schedule Maintenance Soon). The vehicle is operational but requires attention soon." :
                        request.getConfidenceValue() >= 55 ? "3–6 months (Routine Maintenance). Preventive measures should be taken within this period." :
                                "6–12 months (Regular Maintenance). The vehicle is in good condition, and maintenance can follow the standard schedule.") + "\n\n"
                + "Please generate a structured report containing the following:\n"
                + "1. Overall Engine Health Summary\n"
                + "2. Sensor Data Analysis\n"
                + "3. Confidence Level Explanation\n"
                + "4. Potential Issues and Diagnostics\n"
                + "5. Maintenance Recommendations\n"
                + "6. Performance Trends\n"
                + "7. Alerts or Warnings"
                ;
    }



    public double getPrediction(PredictionRequest request) {
        try {
            // Compute temperatureDifference if not already set
            if (request.getTemperatureDifference() == 0) {
                request.setTemperatureDifference(request.getCoolantTemp() - request.getLubeOilTemp());
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            ObjectMapper objectMapper = new ObjectMapper();
            String requestBody = objectMapper.writeValueAsString(request);

            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.exchange(PYTHON_SERVICE_URL, HttpMethod.POST, entity, Map.class);

            Map<String, Object> resultMap = response.getBody();

            // Directly cast the value to Double, assuming it's a single value
            return ((Number) resultMap.get("probability")).doubleValue();
        } catch (Exception e) {
            throw new RuntimeException("Failed to fetch prediction from Python service", e);
        }
    }

    public void saveRequest(PredictionRequest request) {
        // Convert the PredictionRequest to the Vehicle entity
        Vehicle vehicle = new Vehicle();
        vehicle.setId(request.getId());
        vehicle.setType(request.getType());
        vehicle.setTransmission(request.getTransmission());
        vehicle.setMileageKm(request.getMileageKm());
        vehicle.setStatus(request.getStatus());
        vehicle.setEngineRpm(request.getEngineRpm());
        vehicle.setLubeOilPressure(request.getLubeOilPressure());
        vehicle.setFuelPressure(request.getFuelPressure());
        vehicle.setCoolantPressure(request.getCoolantPressure());
        vehicle.setLubeOilTemp(request.getLubeOilTemp());
        vehicle.setCoolantTemp(request.getCoolantTemp());
        vehicle.setEngineStatus(request.getEngineStatus());
        vehicle.setLastUpdated(LocalDate.now());

        // Save the request as a vehicle entry to the database
        repo.save(vehicle);
    }



    public List<Vehicle> findAllByVehicleId(String vehicleId) {        // Find all entries for the vehicle ID
        return repo.findAllById(vehicleId);
    }


    public List<Vehicle> getVehiclesById(String vehicleId) {
        return repo.findAllById(vehicleId);  // Fetching from repository
    }

    public Optional<Vehicle> getLatestVehicleById(String vehicleId) {
        List<Vehicle> latestVehicles = repo.findLatestByVehicleId(vehicleId);
        if (latestVehicles != null && !latestVehicles.isEmpty()) {
            return Optional.of(latestVehicles.get(0));  // Return the first (most recent) vehicle
        }
        return Optional.empty();  // Return empty if no vehicles are found
    }

}
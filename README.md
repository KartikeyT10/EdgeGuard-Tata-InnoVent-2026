# EdgeGuard — AI-at-the-Edge Vehicle Health Copilot

### **Tata InnoVent 2026 Innovation Challenge Entry**
**Created by Team Hidden Layer:**
*   **Harshit Arora**
*   **Kartikey Tiwari**
*   **Piyush Bhatia**
*   **Bhavit Arora**

---

## 1. Executive Summary (The Simple Pitch)
Imagine you are driving down a remote mountain pass or through a long highway tunnel with no cellular network, and your engine warning light starts flashing. Most modern "connected cars" lose their smart assistant features when offline, leaving you in the dark about whether it is safe to keep driving.

**EdgeGuard solves this.** It is a hybrid, split-intelligence vehicle health copilot:
1.  **At the Edge (Offline Safety):** High-frequency telemetry safety algorithms run **100% locally** inside the vehicle's onboard computer (ECU). It continuously scans engine temp, battery, brakes, tyres, and vibrations to estimate safety risks and time-to-failure in real time, with zero dependency on the internet.
2.  **In the Cloud (Smart Assistant):** When cellular network is available, it dynamically syncs OBD-II status packets to a cloud dashboard and uses a conversational Large Language Model (LLM) powered by **Llama 3.3 via the Groq API** as an interactive voice assistant. The driver can simply ask questions out loud (*"Why is my warning light on?"* or *"Can I make it another 40 kilometers?"*), and the assistant responds in plain, conversational speech, taking the exact live telemetry values into account.

---

## 2. System Architecture

Below is the end-to-end data flow showing how telemetry originates at the edge, triggers real-time predictive risk scoring, and integrates with the cloud LLM copilot:

```mermaid
graph TD
    %% Styling
    classDef edgeNode fill:#e0f2fe,stroke:#0ea5e9,stroke-width:2px,color:#0369a1;
    classDef backendNode fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#14532d;
    classDef cloudNode fill:#faf5ff,stroke:#a855f7,stroke-width:2px,color:#581c87;
    
    %% Edge Layer
    subgraph Edge Layer (In-Vehicle Console)
        UI[React Infotainment Screen]:::edgeNode
        LocalEngine[Local Edge Risk Engine]:::edgeNode
        VoiceSim[Voice Sim Input Panel]:::edgeNode
    end
    
    %% Backend Layer
    subgraph Core Backend Layer (Spring Boot API)
        SB[Spring Boot Core REST Service]:::backendNode
        H2[(In-Memory H2 Database)]:::backendNode
        Datasql[data.sql Seed Loader]:::backendNode
    end

    %% Cloud/ML Layer
    subgraph Cloud & ML Intelligence
        Flask[Python Flask ML Service]:::cloudNode
        TabNet[TabNet Predictive Model]:::cloudNode
        Groq[Groq LLM API Llama 3.3]:::cloudNode
    end

    %% Flow Directions
    UI -->|OBD-II Streams| LocalEngine
    LocalEngine -->|Real-time Scoring| UI
    VoiceSim -->|Prompt Query + Telemetry| SB
    
    SB <-->|SQL Data Persist & Seed| H2
    Datasql -->|Pre-populate V001-V003| H2
    
    SB -->|Calculate Temp Difference| Flask
    Flask <-->|Run Inference on hhmodel.pkl| TabNet
    Flask -->|Probability Score| SB
    
    SB -->|Construct Dynamic Context Prompt| Groq
    Groq -->|Plain-Text Voice Response| SB
    SB -->|API Response| UI
    
    class UI,LocalEngine,VoiceSim edgeNode;
    class SB,H2,Datasql backendNode;
    class Flask,TabNet,Groq cloudNode;
```

---

## 3. Product USPs & Innovation Highlights

*   **Zero-Latency Edge Autonomy:** Safety monitoring algorithms run directly in the vehicle. Even if cellular connectivity is completely lost, the dashboard and local risk analysis remain fully active.
*   **Natural Conversational Feedback (No Distraction):** Drivers never look at screens. The AI Copilot follows strict spoken verbal rules (plain sentences, zero technical jargon, leading with immediate answers, matching tone severity, and providing actionable next steps).
*   **Predictive Deep Learning (TabNet):** Powered by a TabNet neural network model trained on high-dimension telemetry (coolant temp, lube oil pressure, coolant pressure, vibration, RPM), predicting failure windows before hardware fails.
*   **Preloaded H2 Database Context:** The backend database starts preloaded with realistic test vehicles (`V001` - `V003`), allowing evaluators to immediately pull up health trends.

---

## 4. Technical Stack

*   **Frontend (Cockpit UI):** React 18, Vite, TypeScript, Lucide-React, Recharts, Tailwind CSS. Custom responsive design themed like a modern Tata Nexon EV infotainment display.
*   **Backend (Core Gateway):** Spring Boot 3.4.2, Java 21+, Tomcat, Hibernate JPA, H2 Database. Runs cors-enabled endpoints for telemetry archiving, health status checks, and LLM orchestration.
*   **Machine Learning (Inference API):** Python 3.13, Flask, Joblib, NumPy, Scikit-Learn. Features a smart version-migration loader for pickled models (`hhmodel.pkl`) with a deterministic mathematical fallback engine to guarantee 100% demo reliability.

---

## 5. Quick Start & Execution Order

To run the complete system end-to-end, start the three services in the following order:

### **Step 1: Start the ML Inference Service (Flask)**
1.  Navigate to the directory:
    ```bash
    cd TabNetModel
    ```
2.  Install Python dependencies:
    ```bash
    py -m pip install flask joblib numpy scikit-learn
    ```
3.  Run the server:
    ```bash
    py app.py
    ```
    *The model service will start on Port `5000`.*

### **Step 2: Start the Core Backend (Spring Boot)**
1.  Navigate to the directory:
    ```bash
    cd SpringBootBackend/main_el
    ```
2.  Configure your Groq API Key in `src/main/resources/application.properties` (pre-filled with the active presentation key):
    ```properties
    groq.api.key=YOUR_GROQ_API_KEY_HERE
    ```
3.  Run the Maven wrapper task:
    ```bash
    ./mvnw spring-boot:run
    ```
    *The core API service will start on Port `8080` (pre-loaded with seed database records).*

### **Step 3: Start the Infotainment UI (React)**
1.  Navigate to the directory:
    ```bash
    cd UI_React
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Launch the Vite dev server:
    ```bash
    npm run dev
    ```
    *Open your browser and visit **`http://localhost:5173/`** to view the live dashboard.*

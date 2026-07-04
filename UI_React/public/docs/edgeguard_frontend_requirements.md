# EdgeGuard Frontend Requirements Brief

Source: `C:\Users\tiwar\Downloads\EdgeGuard_Tata_InnoVent_2026.pdf`

## Project Summary

EdgeGuard is a Tata InnoVent 2026 proof of concept for "AI at the Edge Solutions for Automotive." It demonstrates a lightweight vehicle-edge AI agent that reads live vehicle telemetry, predicts failures, explains hazards in plain language, and offers a driver copilot chat experience.

The key story is split architecture: urgent vehicle safety decisions happen locally at the edge with no cloud round trip, while richer natural-language reasoning and longer-term analytics can sync to a cloud/fleet layer.

## Problems To Address

- Vehicle faults such as overheating, brake wear, and tyre pressure loss are detected too late.
- Dashboard warning lights are cryptic and do not explain severity or urgency.
- Fleet operators need aggregated vehicle health signals for predictive maintenance scheduling.

## Primary Demo Experience

Build a single-screen live dashboard as the centerpiece of the demo. It should feel like a vehicle health command center, not a marketing page.

Required dashboard modules:

- Live sensor gauges/cards for engine temperature, RPM, brake pad wear, tyre pressure, battery voltage, vibration, and speed.
- Live Chart.js graphs for important sensor trends.
- Color-coded risk meter with green, yellow, and red states.
- Scrolling predictive-maintenance alert feed.
- Driver copilot chat that answers questions based on current sensor readings.
- Fault scenario controls for live demo injection.
- Fleet/ADAS bonus card showing anonymized alert sync to a fleet-level dashboard.

## Sensor Simulator

The frontend should simulate realistic real-time vehicle sensor streams using JavaScript timers.

Required sensor fields:

- Engine temperature
- RPM
- Brake pad wear percentage
- Tyre pressure
- Battery voltage
- Vibration
- Speed

Required injectable fault scenarios:

- Engine overheating
- Critical brake wear
- Tyre pressure drop

Preferred realism strategy:

- Best: base curves on public vehicle/engine datasets such as Kaggle/UCI vehicle sensor data, engine health datasets, or NASA Turbofan predictive maintenance patterns.
- Good: format simulated data as OBD-II/CAN-bus-style messages.
- Fastest: rule-based random simulation with realistic ranges.

## Edge Risk Engine

Implement local threshold/rule-based logic in JavaScript. It should continuously compute a live risk score from the current sensor window and trigger urgent alerts immediately.

Expected behavior:

- Normal readings keep the risk meter green.
- Degrading readings move the meter into warning/yellow.
- Critical readings move the meter into red and create high-priority alerts.
- Risk logic must work locally even if copilot/cloud calls are unavailable.

## Copilot Layer

The document specifies a Claude API copilot layer using Anthropic `/v1/messages`.

Expected behavior:

- Ingest current sensor state every few seconds or on demand.
- Detect anomalies and explain likely causes.
- Predict rough time-to-failure when possible.
- Answer driver/judge questions in natural language.
- Persona: a clear, practical "mechanic copilot."

Example demo questions:

- Why is it warning me?
- Is it safe to drive 50km?
- What should I check first?

## Architecture

Flow:

1. Simulated vehicle sensors generate live telemetry.
2. Local Edge Risk Engine performs instant threshold scoring and alerts.
3. Claude copilot layer provides anomaly reasoning and natural-language explanations.
4. Dashboard, charts, alert feed, and chat consume both outputs.
5. Optional fleet/ADAS card shows anonymized alert sync for connected vehicle analytics.

## Suggested Tech Stack

- Frontend: HTML, CSS, JavaScript, or React.
- Charts: Chart.js.
- Simulation: JavaScript `setInterval`.
- Edge risk logic: local JavaScript threshold/rule engine.
- Copilot: Claude API via Anthropic `/v1/messages`.
- Hosting: local laptop, Netlify, or Vercel.

## Frontend Priorities

- The dashboard must be visually impressive and usable during a live pitch.
- The strongest demo moment is the judge chatting with an AI that understands real-time vehicle context.
- The interface should make the edge-vs-cloud story obvious without needing long explanation.
- Fault injection controls should be easy to trigger live.
- Include fallback/canned responses or a backup mode in case API latency occurs.
- Prepare a 60-90 second screen recording as a demo backup.

## One-Day Build Plan

- First 3 hours: build dashboard scaffold and fake sensor data foundation.
- Next 4-5 hours: polish UI/charts while integrating Claude and local risk logic.
- Last 2-3 hours: integrate, test end-to-end, fix demo bugs, rehearse the pitch.

## Pitch Framing To Preserve

EdgeGuard runs a lightweight risk-scoring model directly on the vehicle edge unit, so critical alerts do not require a cloud round trip. Cloud LLM reasoning is used for deeper contextual explanation and driver interaction. The current prototype uses simulated telemetry, but production integration would connect to OBD-II/CAN-bus data through the vehicle ECU or hardware such as a Raspberry Pi.


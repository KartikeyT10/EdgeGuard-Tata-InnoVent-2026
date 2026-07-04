import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react';

import {
  Activity,
  AlertTriangle,
  BatteryCharging,
  Clock3,
  CloudOff,
  Disc3,
  FileText,
  Gauge,
  Mail,
  MessageSquare,
  Mic,
  RadioTower,
  RefreshCcw,
  Send,
  Sparkles,
  Thermometer,
  UserRound,
  Zap,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import jsPDF from 'jspdf';

type SensorState = {
  temp: number;
  rpm: number;
  brake: number;
  tyre: number;
  battery: number;
  vibration: number;
  speed: number;
};

type FaultKey = 'overheat' | 'tyre' | 'brake' | 'battery';
type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

type AlertItem = {
  id: string;
  time: string;
  severity: Severity;
  title: string;
  description: string;
};

type HistoryPoint = SensorState & {
  tick: number;
  risk: number;
};

type DriverKey = keyof SensorState;

type DominantDriver = {
  key: DriverKey;
  label: string;
  value: number;
  unit: string;
  risk: number;
  action: string;
};

const initialSensors: SensorState = {
  temp: 86,
  rpm: 1850,
  brake: 38,
  tyre: 32,
  battery: 12.6,
  vibration: 0.18,
  speed: 72,
};

const faultLabels: Record<FaultKey, string> = {
  overheat: 'Engine Overheating',
  tyre: 'Tyre Pressure Drop',
  brake: 'Brake Wear Critical',
  battery: 'Battery Drain',
};


const sensorMeta: Record<DriverKey, { label: string; unit: string; action: string }> = {
  temp: { label: 'Engine overheating', unit: 'C', action: 'Reduce load, pull over, and let the engine cool.' },
  rpm: { label: 'High RPM stress', unit: 'RPM', action: 'Ease throttle and avoid sustained high revs.' },
  brake: { label: 'Brake wear', unit: '%', action: 'Avoid highway speeds and inspect brake pads immediately.' },
  tyre: { label: 'Tyre pressure loss', unit: 'PSI', action: 'Slow down and inspect tyre pressure at the next safe stop.' },
  battery: { label: 'Battery drain', unit: 'V', action: 'Check charging system and avoid shutting off the vehicle unnecessarily.' },
  vibration: { label: 'Vibration anomaly', unit: 'g', action: 'Inspect wheel balance, brakes, or bearing condition.' },
  speed: { label: 'Speed risk', unit: 'km/h', action: 'Reduce speed until telemetry returns to safe range.' },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const nowStamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
const uid = () => Math.random().toString(36).slice(2);

function sensorRisk(sensors: SensorState) {
  const tempRisk = clamp(((sensors.temp - 92) / 28) * 100, 0, 100);
  const rpmRisk = clamp(((sensors.rpm - 3300) / 1700) * 100, 0, 100);
  const brakeRisk = clamp(((sensors.brake - 55) / 40) * 100, 0, 100);
  const tyreRisk = clamp(((30 - sensors.tyre) / 13) * 100, 0, 100);
  const batteryRisk = clamp(((12.1 - sensors.battery) / 1.8) * 100, 0, 100);
  const vibrationRisk = clamp(((sensors.vibration - 0.32) / 0.55) * 100, 0, 100);
  const speedRisk = clamp(((sensors.speed - 110) / 40) * 100, 0, 100);

  const weightedRisk =
    tempRisk * 0.22 +
    brakeRisk * 0.24 +
    tyreRisk * 0.18 +
    batteryRisk * 0.12 +
    vibrationRisk * 0.12 +
    rpmRisk * 0.08 +
    speedRisk * 0.04;
  const dominantRisk = Math.max(tempRisk, rpmRisk, brakeRisk, tyreRisk, batteryRisk, vibrationRisk, speedRisk);
  const risk = Math.round(Math.max(weightedRisk, dominantRisk * 0.92));

  return {
    risk: clamp(risk, 0, 100),
    parts: { tempRisk, rpmRisk, brakeRisk, tyreRisk, batteryRisk, vibrationRisk, speedRisk },
  };
}

function dominantRiskDriver(sensors: SensorState, parts: ReturnType<typeof sensorRisk>['parts']): DominantDriver {
  const candidates: Array<[DriverKey, number]> = [
    ['temp', parts.tempRisk],
    ['rpm', parts.rpmRisk],
    ['brake', parts.brakeRisk],
    ['tyre', parts.tyreRisk],
    ['battery', parts.batteryRisk],
    ['vibration', parts.vibrationRisk],
    ['speed', parts.speedRisk],
  ];
  const [key, risk] = candidates.sort((a, b) => b[1] - a[1])[0];
  return {
    key,
    label: sensorMeta[key].label,
    value: sensors[key],
    unit: sensorMeta[key].unit,
    risk,
    action: sensorMeta[key].action,
  };
}

function riskLevel(risk: number): Severity {
  if (risk >= 70) return 'CRITICAL';
  if (risk >= 25) return 'WARNING';
  return 'INFO';
}

function nextSensors(current: SensorState, activeFaults: Record<FaultKey, boolean>): SensorState {
  const noise = (size: number) => (Math.random() - 0.5) * size;
  return {
    temp: clamp(current.temp + noise(1.6) + (activeFaults.overheat ? 3.2 : (86 - current.temp) * 0.04), 72, 126),
    rpm: clamp(current.rpm + noise(130) + (activeFaults.overheat ? 35 : 0), 850, 5200),
    brake: clamp(current.brake + noise(0.35) + (activeFaults.brake ? 3.6 : 0.02), 22, 98),
    tyre: clamp(current.tyre + noise(0.18) + (activeFaults.tyre ? -1.25 : (32 - current.tyre) * 0.03), 14, 36),
    battery: clamp(current.battery + noise(0.05) + (activeFaults.battery ? -0.18 : (12.6 - current.battery) * 0.04), 9.6, 13.1),
    vibration: clamp(current.vibration + noise(0.035) + (activeFaults.brake || activeFaults.tyre ? 0.025 : (0.18 - current.vibration) * 0.08), 0.08, 0.95),
    speed: clamp(current.speed + noise(6) + (activeFaults.tyre || activeFaults.brake ? -1.2 : 0.3), 0, 135),
  };
}

function buildAlerts(sensors: SensorState, risk: number): AlertItem[] {
  const alerts: AlertItem[] = [];
  const push = (severity: Severity, title: string, description: string) => {
    alerts.push({ id: uid(), time: nowStamp(), severity, title, description });
  };

  if (sensors.temp > 112) push('CRITICAL', 'Engine thermal runaway', 'Temperature exceeds safe edge threshold. Pull over and cool the engine.');
  else if (sensors.temp > 98) push('WARNING', 'Engine temperature rising', 'Cooling trend is abnormal; monitor coolant and load.');

  if (sensors.brake > 82) push('CRITICAL', 'Brake pad wear critical', 'Brake wear is near failure range. Avoid highway driving.');
  else if (sensors.brake > 62) push('WARNING', 'Brake service due', 'Pad wear is degrading faster than normal.');

  if (sensors.tyre < 20) push('CRITICAL', 'Tyre pressure unsafe', 'Detected rapid pressure loss. Reduce speed immediately.');
  else if (sensors.tyre < 28) push('WARNING', 'Tyre pressure dropping', 'Pressure is below recommended range.');

  if (sensors.battery < 10.8) push('CRITICAL', 'Battery voltage unstable', 'Voltage may not support restart or ECU stability.');
  else if (sensors.battery < 11.8) push('WARNING', 'Battery drain detected', 'Voltage trend indicates charging system stress.');

  if (sensors.vibration > 0.62) push('WARNING', 'Vibration anomaly', 'Possible wheel, brake, or bearing imbalance detected.');
  if (risk < 25 && alerts.length === 0) push('INFO', 'Edge scan normal', 'All local telemetry remains within expected OBD-II style ranges.');

  return alerts;
}

function estimateFailureWindow(sensors: SensorState, risk: number) {
  if (risk >= 70) return 'Immediate inspection required';
  if (sensors.brake > 70) return 'Brake failure risk in ~35-50 min at current wear trend';
  if (sensors.temp > 102) return 'Overheat risk in ~12-20 min if load continues';
  if (sensors.tyre < 26) return 'Tyre pressure unsafe in ~15-25 min if leak continues';
  if (sensors.battery < 11.6) return 'Battery restart risk in ~20-40 min';
  if (risk >= 25) return 'Service attention recommended within this trip';
  return 'No near-term failure signature';
}

function scenarioStatus(activeFaults: Record<FaultKey, boolean>, sensors: SensorState, risk: number) {
  const active = (Object.keys(activeFaults) as FaultKey[]).filter((fault) => activeFaults[fault]);
  if (active.length === 0) return { label: 'Normal monitoring', failure: estimateFailureWindow(sensors, risk) };
  return {
    label: active.map((fault) => faultLabels[fault]).join(' + '),
    failure: estimateFailureWindow(sensors, risk),
  };
}

function verdictFor(severity: Severity, driver: DominantDriver) {
  if (severity === 'CRITICAL') {
    return {
      status: 'DANGER',
      issue: driver.label,
      action: driver.action,
    };
  }
  if (severity === 'WARNING') {
    return {
      status: 'CAUTION',
      issue: driver.label,
      action: driver.action,
    };
  }
  return {
    status: 'SAFE',
    issue: 'No dominant fault signature',
    action: 'Continue monitoring local edge telemetry.',
  };
}

function recommendedAction(alert: AlertItem) {
  if (alert.title.toLowerCase().includes('engine')) return 'Recommended action: reduce load and stop safely if temperature keeps rising.';
  if (alert.title.toLowerCase().includes('brake')) return 'Recommended action: avoid high speed and inspect brake pads.';
  if (alert.title.toLowerCase().includes('tyre')) return 'Recommended action: slow down and inspect tyre pressure.';
  if (alert.title.toLowerCase().includes('battery')) return 'Recommended action: check charging voltage before shutting down.';
  if (alert.title.toLowerCase().includes('vibration')) return 'Recommended action: inspect wheel/brake imbalance.';
  return 'Recommended action: keep monitoring telemetry.';
}

function mechanicReply(question: string, sensors: SensorState, risk: number, alerts: AlertItem[]) {
  const level = riskLevel(risk);
  const topAlert = alerts.find((alert) => alert.severity === 'CRITICAL') ?? alerts[0];
  const q = question.toLowerCase();
  const failureWindow = estimateFailureWindow(sensors, risk);

  if (q.includes('50') || q.includes('safe') || q.includes('drive')) {
    if (level === 'CRITICAL') {
      return `No. Current edge risk is ${risk}/100. ${topAlert?.description ?? 'A critical sensor is outside the safe range'} ${failureWindow}. Stop safely and inspect before continuing.`;
    }
    if (level === 'WARNING') {
      return `Short low-speed movement may be possible, but I would not commit to 50 km. Risk is ${risk}/100, with temp ${Math.round(sensors.temp)} C, brake wear ${Math.round(sensors.brake)}%, and tyre pressure ${sensors.tyre.toFixed(1)} PSI. ${failureWindow}.`;
    }
    return `Yes, the local edge scan looks stable for now. Risk is ${risk}/100, tyre pressure is ${sensors.tyre.toFixed(1)} PSI, brake wear is ${Math.round(sensors.brake)}%, and battery is ${sensors.battery.toFixed(1)} V.`;
  }

  if (q.includes('why') || q.includes('warning')) {
    return topAlert
      ? `The warning is triggered by ${topAlert.title.toLowerCase()}. Current readings: ${Math.round(sensors.temp)} C engine temp, ${Math.round(sensors.brake)}% brake wear, ${sensors.tyre.toFixed(1)} PSI tyre pressure, ${sensors.battery.toFixed(1)} V battery. ${failureWindow}.`
      : `There is no major warning right now. The edge model is continuously checking temperature, brakes, tyre pressure, battery, vibration, RPM, and speed.`;
  }

  if (q.includes('first') || q.includes('do')) {
    if (sensors.brake > 70) return 'First action: reduce speed and inspect brakes. Brake wear is the dominant risk contributor, so avoid long downhill or highway driving.';
    if (sensors.temp > 100) return 'First action: reduce load, stop in a safe place, and let the engine cool. Check coolant level only when safe.';
    if (sensors.tyre < 27) return 'First action: slow down and inspect tyre pressure. A continuing pressure drop can become unsafe quickly.';
    return 'First action: keep monitoring. No urgent failure signature is active, but continue watching trend changes over the next few minutes.';
  }

  return `Mechanic copilot summary: edge risk is ${risk}/100 (${level}). Temp ${Math.round(sensors.temp)} C, RPM ${Math.round(sensors.rpm)}, brake wear ${Math.round(sensors.brake)}%, tyre ${sensors.tyre.toFixed(1)} PSI, battery ${sensors.battery.toFixed(1)} V, vibration ${sensors.vibration.toFixed(2)} g. ${failureWindow}.`;
}

function GaugeCard({
  icon,
  label,
  value,
  unit,
  min,
  max,
  risk,
}: {
  icon: JSX.Element;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  risk: number;
}) {
  const pct = clamp(((value - min) / (max - min)) * 100, 0, 100);
  const circumference = 2 * Math.PI * 46;
  const stroke = circumference - (pct / 100) * circumference;
  const tone = risk >= 70 ? 'critical' : risk >= 35 ? 'warning' : 'good';

  return (
    <section className={`gauge-card ${tone}`}>
      <div className="card-topline">
        <span className="icon-chip">{icon}</span>
        <span>{label}</span>
      </div>
      <div className="gauge-wrap" aria-label={`${label} ${value.toFixed(1)} ${unit}`}>
        <svg viewBox="0 0 120 120" role="img">
          <circle className="gauge-track" cx="60" cy="60" r="46" />
          <circle
            className="gauge-progress"
            cx="60"
            cy="60"
            r="46"
            strokeDasharray={circumference}
            strokeDashoffset={stroke}
          />
        </svg>
        <div className="gauge-value">
          <strong>{unit === 'RPM' ? Math.round(value) : value.toFixed(unit === 'g' || unit === 'V' || unit === 'PSI' ? 1 : 0)}</strong>
          <span>{unit}</span>
        </div>
      </div>
      <div className="range-row">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </section>
  );
}

function RiskRadial({ risk, severity }: { risk: number; severity: Severity }) {
  return (
    <div
      className={`risk-radial ${severity.toLowerCase()}`}
      style={{ '--risk': `${risk * 3.6}deg` } as CSSProperties}
      aria-label={`Composite edge risk ${risk} out of 100`}
    >
      <div>
        <span>Risk</span>
        <strong>{risk}</strong>
        <small>{severity}</small>
      </div>
    </div>
  );
}

function Sparkline({ points, color = '#0f6bff' }: { points: number[]; color?: string }) {
  const values = points.length ? points : [0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coords = values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100;
      const y = 44 - ((value - min) / span) * 38;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg className="sparkline" viewBox="0 0 100 48" preserveAspectRatio="none" role="img">
      <polyline points={coords} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}



function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [ambientLight, setAmbientLight] = useState(450); // 450 lux default
  const [locale, setLocale] = useState<'metric' | 'imperial'>('metric');
  const [cloudConnected, setCloudConnected] = useState<boolean>(true);
  const [clusterMode, setClusterMode] = useState<'cluster' | 'engineer'>('cluster');
  const [voiceListening, setVoiceListening] = useState<boolean>(false);
  const [voiceNotification, setVoiceNotification] = useState<string | null>(null);
  const [sensors, setSensors] = useState<SensorState>(initialSensors);
  const [tick, setTick] = useState(0);
  const [activeFaults, setActiveFaults] = useState<Record<FaultKey, boolean>>({
    overheat: false,
    tyre: false,
    brake: false,
    battery: false,
  });
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: uid(), time: nowStamp(), severity: 'INFO', title: 'Edge scan online', description: 'Local telemetry engine is running without backend dependency.' },
  ]);
  const [demoRunning, setDemoRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'report'>('dashboard');
  const [history, setHistory] = useState<HistoryPoint[]>([{ ...initialSensors, risk: 0, tick: 0 }]);
  const lastAutoMessageRisk = useRef(0);
  const demoTimers = useRef<number[]>([]);

  const riskInfo = useMemo(() => sensorRisk(sensors), [sensors]);
  const severity = riskLevel(riskInfo.risk);
  const dominantDriver = useMemo(() => dominantRiskDriver(sensors, riskInfo.parts), [riskInfo.parts, sensors]);
  const failureWindow = estimateFailureWindow(sensors, riskInfo.risk);
  const scenario = scenarioStatus(activeFaults, sensors, riskInfo.risk);
  const verdict = verdictFor(severity, dominantDriver);
  const estimatedSafeRange = useMemo(() => {
    if (sensors.brake > 85) return "Next 40 km";
    if (sensors.brake > 65) return "Next 380 km";
    if (sensors.temp > 105) return "Cooling fault: Stop safely";
    if (sensors.tyre < 22) return "Stop vehicle immediately";
    if (sensors.tyre < 26) return "Inflation service: ~80 km";
    return "Next 4,200 km";
  }, [sensors]);
  const driverTrend = history.slice(-24).map((point) => point[dominantDriver.key]);
  const alertTimeline = alerts.slice(0, 18).reverse();
  const obdPacket = useMemo(
    () => ({
      id: 'EDGEGUARD-01',
      ts: nowStamp(),
      pid: {
        '05_engine_temp_c': Math.round(sensors.temp),
        '0c_rpm': Math.round(sensors.rpm),
        'brake_wear_pct': Math.round(sensors.brake),
        'tyre_pressure_psi': Number(sensors.tyre.toFixed(1)),
        'battery_v': Number(sensors.battery.toFixed(1)),
        'vibration_g': Number(sensors.vibration.toFixed(2)),
        '0d_speed_kmh': Math.round(sensors.speed),
      },
      edgeRisk: riskInfo.risk,
      state: severity,
    }),
    [riskInfo.risk, sensors, severity],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);


  useEffect(() => {
    return () => {
      demoTimers.current.forEach((timerId) => window.clearTimeout(timerId));
    };
  }, []);


  useEffect(() => {
    const timer = window.setInterval(() => {
      setSensors((current) => {
        const updated = nextSensors(current, activeFaults);
        const risk = sensorRisk(updated).risk;
        setTick((currentTick) => {
          const nextTick = currentTick + 1;
          setHistory((items) => [...items.slice(-34), { ...updated, risk, tick: nextTick }]);
          return nextTick;
        });

        const newAlerts = buildAlerts(updated, risk);
        setAlerts((items) => [...newAlerts, ...items].slice(0, 18));



        if (risk < 20) lastAutoMessageRisk.current = risk;
        return updated;
      });
    }, 1400);

    return () => window.clearInterval(timer);
  }, [activeFaults]);

  const toggleFault = (fault: FaultKey) => {
    setActiveFaults((faults) => ({ ...faults, [fault]: !faults[fault] }));
  };

  const resetDemo = () => {
    demoTimers.current.forEach((timerId) => window.clearTimeout(timerId));
    demoTimers.current = [];
    setDemoRunning(false);
    setActiveFaults({ overheat: false, tyre: false, brake: false, battery: false });
    setSensors(initialSensors);
    setAmbientLight(450);
    setTheme('light');
    setVoiceNotification(null);
    setHistory([{ ...initialSensors, risk: 0, tick }]);
    setAlerts([{ id: uid(), time: nowStamp(), severity: 'INFO', title: 'Demo reset', description: 'All simulated telemetry returned to stable baseline.' }]);
  };

  const runDemoScript = () => {
    resetDemo();
    setDemoRunning(true);

    const steps: Array<[number, () => void]> = [
      [900, () => setActiveFaults((faults) => ({ ...faults, overheat: true }))],
      [7200, () => setActiveFaults((faults) => ({ ...faults, brake: true }))],
      [12800, () => setActiveFaults((faults) => ({ ...faults, tyre: true }))],
      [19000, () => setDemoRunning(false)],
    ];

    demoTimers.current = steps.map(([delay, action]) => window.setTimeout(action, delay));
  };

  const downloadDiagnosticPdf = () => {
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 42;
    let y = 48;

    const addLine = (text: string, size = 10, style: 'normal' | 'bold' = 'normal') => {
      pdf.setFont('helvetica', style);
      pdf.setFontSize(size);
      const lines = pdf.splitTextToSize(text, pageWidth - margin * 2);
      lines.forEach((line: string) => {
        if (y > 760) {
          pdf.addPage();
          y = 48;
        }
        pdf.text(line, margin, y);
        y += size + 6;
      });
    };

    const addSection = (title: string) => {
      y += 10;
      addLine(title, 14, 'bold');
      pdf.setDrawColor(15, 107, 255);
      pdf.line(margin, y - 8, pageWidth - margin, y - 8);
      y += 4;
    };

    pdf.setTextColor(15, 32, 51);
    addLine('EdgeGuard Vehicle Diagnostic Report', 20, 'bold');
    addLine(`Generated: ${new Date().toLocaleString()}`, 10);
    addLine(`Vehicle: ${obdPacket.id} | Risk: ${riskInfo.risk}/100 | State: ${severity}`, 11, 'bold');

    addSection('Overall Situation');
    reportSections.forEach(([label, value]) => addLine(`${label}: ${value}`, 10));

    addSection('Live Sensor Snapshot');
    addLine(`Engine Temperature: ${Math.round(sensors.temp)} C`);
    addLine(`RPM: ${Math.round(sensors.rpm)}`);
    addLine(`Brake Wear: ${Math.round(sensors.brake)}%`);
    addLine(`Tyre Pressure: ${sensors.tyre.toFixed(1)} PSI`);
    addLine(`Battery Voltage: ${sensors.battery.toFixed(1)} V`);
    addLine(`Vibration: ${sensors.vibration.toFixed(2)} g`);
    addLine(`Speed: ${Math.round(sensors.speed)} km/h`);

    addSection('Problems And Recommended Actions');
    alerts.slice(0, 8).forEach((alert, index) => {
      addLine(`${index + 1}. [${alert.severity}] ${alert.title} (${alert.time})`, 10, 'bold');
      addLine(alert.description);
      addLine(recommendedAction(alert));
      y += 4;
    });

    addSection('OBD-II Style Edge Packet');
    addLine(JSON.stringify(obdPacket, null, 2), 8);

    addSection('Architecture Note');
    addLine('Local edge alerts continue to work without cloud reasoning. Cloud copilot responses are optional explanatory guidance layered on top of the local risk engine.');

    pdf.save(`edgeguard-diagnostic-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const carSystemState = {
    ENG: sensors.temp > 112 ? 'CRIT' : sensors.temp > 98 ? 'WARN' : 'OK',
    BAT: sensors.battery < 10.8 ? 'CRIT' : sensors.battery < 11.8 ? 'WARN' : 'OK',
    BRK: sensors.brake > 82 ? 'CRIT' : sensors.brake > 62 ? 'WARN' : 'OK',
    TYR: sensors.tyre < 20 ? 'CRIT' : sensors.tyre < 28 ? 'WARN' : 'OK',
  };

  const reportSections = [
    ['Current verdict', `${verdict.status} - ${verdict.issue}`],
    ['Primary recommendation', verdict.action],
    ['Estimated failure window', failureWindow],
    ['Active scenario', scenario.label],
    ['Dominant trend', `${dominantDriver.label}: ${dominantDriver.value.toFixed(dominantDriver.unit === 'RPM' ? 0 : 1)} ${dominantDriver.unit}`],
  ];
  const tickerItems = ['LIVE EDGE TELEMETRY', 'OBD-II STREAM ACTIVE', 'LOCAL RISK ENGINE', 'CLOUD COPILOT OPTIONAL'];

  return (
    <main className="app-shell">
      <div className="intel-strip" aria-label="Telemetry ticker">
        <div className="ticker-track">
          <div className="ticker-content">
            {tickerItems.map((item) => (
              <span key={item}><span className="live-dot" /> {item}</span>
            ))}
          </div>
          <div className="ticker-content" aria-hidden="true">
            {tickerItems.map((item) => (
              <span key={`${item}-dup`}><span className="live-dot" /> {item}</span>
            ))}
          </div>
        </div>
      </div>

      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <img src="/logo.png" alt="EdgeGuard Logo" className="brand-logo-img" />
            <div>
              <strong>EdgeGuard</strong>
            </div>
          </div>

          {/* Persistent Warning Telltales Row */}
          <div className="telltales-row" aria-label="ISO 2575 Warning telltales">
            <div 
              className={`telltale engine ${sensors.temp > 95 || activeFaults.overheat ? (sensors.temp > 105 ? 'critical' : 'warning') : 'off'}`} 
              title="Engine Temperature warning telltale"
            >
              <Thermometer size={18} />
            </div>
            <div 
              className={`telltale battery ${sensors.battery < 11.5 || sensors.battery > 14.8 || activeFaults.battery ? 'critical' : 'off'}`} 
              title="Battery charging warning telltale"
            >
              <BatteryCharging size={18} />
            </div>
            <div 
              className={`telltale brake ${sensors.brake > 80 || activeFaults.brake ? (sensors.brake > 90 ? 'critical' : 'warning') : 'off'}`} 
              title="Braking system telltale"
            >
              <Disc3 size={18} />
            </div>
            <div 
              className={`telltale tyre ${sensors.tyre < 26 || sensors.tyre > 40 || activeFaults.tyre ? (sensors.tyre < 20 ? 'critical' : 'warning') : 'off'}`} 
              title="Low tyre pressure warning telltale"
            >
              <Gauge size={18} />
            </div>
            {!cloudConnected && (
              <div className="telltale cloud warning blinking" title="Cloud Sync Offline indicator">
                <CloudOff size={18} />
              </div>
            )}
          </div>

        </div>

        <div className="topbar-status" aria-label="EdgeGuard runtime status">
          <span className={`tab-indicator ${activeTab}`} />
          <button className={activeTab === 'dashboard' ? 'active' : ''} type="button" onClick={() => setActiveTab('dashboard')}>
            <Gauge size={16} /> Live View
          </button>
          <button className={activeTab === 'report' ? 'active' : ''} type="button" onClick={() => setActiveTab('report')}>
            <FileText size={16} /> Diagnostic Report
          </button>
        </div>

        <div className="topbar-actions">
          <div className="user-profile-badge">
            <div className="profile-avatar"><UserRound size={17} /></div>
            <div className="profile-info">
              <strong>Driver EV-014</strong>
              <span>TATA Nexon EV</span>
            </div>
          </div>
        </div>
      </header>

      {activeTab === 'dashboard' ? (
      <>
      <section className="status-ribbon">
        <span><AlertTriangle size={16} /> {alerts.filter((alert) => alert.severity === 'CRITICAL').length} critical alerts</span>
        <span>{Object.values(activeFaults).filter(Boolean).length} injected fault scenarios active</span>
        <span>Risk state: {severity}</span>
      </section>

      <section className="architecture-strip" aria-label="Driver assistant info">
        <div className="architecture-card edge-engine">
          <span>ESTIMATED SAFE RANGE</span>
          <strong>{estimatedSafeRange}</strong>
          <p>Wear-trend forecasting predicts remaining distance before recommended parts maintenance is required.</p>
        </div>
        <div className="architecture-card cloud-copilot">
          <span>EDGE INTEGRITY SHIELD</span>
          <strong>Monitoring continuously · Works offline</strong>
          <p>Local browser-based processing guarantees that your critical protection remains active even inside tunnels or remote areas with no internet connection.</p>
        </div>
      </section>

      <section className="vehicle-diagnostics-panel">
        {/* Left Column: Vehicle Brand Card & Schematic Image */}
        <div className="vehicle-stage-col">
          <div className="vehicle-stage-title vehicle-brand-card">
            <img src="/car-illustration.svg" alt="EdgeGuard vehicle" className="vehicle-image" />
            <div>
              <strong>TATA Nexon EV</strong>
              <div className="vehicle-meta">
                <span>Bluetooth: Connected</span>
                <span className={`headlight-tag ${ambientLight < 150 ? 'on' : 'off'}`}>
                  {ambientLight < 150 ? '🌙 Headlights: ON' : '☀️ Headlights: OFF'}
                </span>
              </div>
            </div>
          </div>
          <div className="vehicle-image-container">
            <img src="/car-diagnostics.jpg" alt="Vehicle diagnostics" className="vehicle-stage-img" />
          </div>
          <div className="vehicle-status-console">
            <div className={carSystemState.ENG.toLowerCase()}>
              <span className="console-icon-label"><Thermometer size={14} /> ENGINE:</span>
              <strong>{carSystemState.ENG}</strong>
            </div>
            <div className={carSystemState.BAT.toLowerCase()}>
              <span className="console-icon-label"><BatteryCharging size={14} /> BATTERY:</span>
              <strong>{carSystemState.BAT}</strong>
            </div>
            <div className={carSystemState.BRK.toLowerCase()}>
              <span className="console-icon-label"><Disc3 size={14} /> BRAKE:</span>
              <strong>{carSystemState.BRK}</strong>
            </div>
            <div className={carSystemState.TYR.toLowerCase()}>
              <span className="console-icon-label"><Gauge size={14} /> TYRES:</span>
              <strong>{carSystemState.TYR}</strong>
            </div>
          </div>
        </div>

        {/* Center: Dominant Speed & Risk Hub (Glanceability Safe Zone) */}
        <div className="dominant-cluster-hub">
          <div className="digital-speedometer">
            <span className="speed-label">SPEED</span>
            <strong className="speed-number">
              {locale === 'metric' ? Math.round(sensors.speed) : Math.round(sensors.speed * 0.621371)}
            </strong>
            <span className="speed-unit">{locale === 'metric' ? 'km/h' : 'mph'}</span>
          </div>

          <div className={`composite-risk-radial-card ${severity.toLowerCase()}`}>
            <RiskRadial risk={riskInfo.risk} severity={severity} />
            <div className="radial-meta">
              <span>Risk Score</span>
              <strong>{riskInfo.risk} / 100</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Instant Verdict */}
        <div className={`risk-panel compact ${severity.toLowerCase()}`}>
          <div className="verdict-card">
            <span>Instant safety verdict</span>
            <strong>{verdict.status}</strong>
            <p>{verdict.issue}</p>
            <small>{verdict.action}</small>
          </div>
        </div>
      </section>

      <section className="gauge-grid">
        <GaugeCard icon={<Thermometer size={18} />} label="Engine Temperature" value={locale === 'metric' ? sensors.temp : Math.round(sensors.temp * 1.8 + 32)} unit={locale === 'metric' ? '°C' : '°F'} min={locale === 'metric' ? 70 : Math.round(70 * 1.8 + 32)} max={locale === 'metric' ? 125 : Math.round(125 * 1.8 + 32)} risk={riskInfo.parts.tempRisk} />
        <GaugeCard icon={<Activity size={18} />} label="Engine RPM" value={sensors.rpm} unit="RPM" min={800} max={5200} risk={riskInfo.parts.rpmRisk} />
        <GaugeCard icon={<BatteryCharging size={18} />} label="Battery Voltage" value={sensors.battery} unit="V" min={9.5} max={13.2} risk={riskInfo.parts.batteryRisk} />
        <GaugeCard icon={<Gauge size={18} />} label="Tyre Pressure" value={locale === 'metric' ? Number((sensors.tyre * 0.0689476).toFixed(1)) : sensors.tyre} unit={locale === 'metric' ? 'Bar' : 'PSI'} min={locale === 'metric' ? 1.0 : 14} max={locale === 'metric' ? 2.5 : 36} risk={riskInfo.parts.tyreRisk} />
        <GaugeCard icon={<Disc3 size={18} />} label="Brake Pad Wear" value={sensors.brake} unit="%" min={20} max={100} risk={riskInfo.parts.brakeRisk} />
        <GaugeCard icon={<Zap size={18} />} label="Vibration Level" value={sensors.vibration} unit="g" min={0.05} max={0.95} risk={riskInfo.parts.vibrationRisk} />
      </section>

      <section className="speed-row">
        <div>
          <span>Vehicle speed</span>
          <strong>{locale === 'metric' ? `${Math.round(sensors.speed)} km/h` : `${Math.round(sensors.speed * 0.621371)} mph`}</strong>
        </div>
        <div>
          <span>Edge processing</span>
          <strong>100% local</strong>
        </div>
        <div>
          <span>Telemetry format</span>
          <strong>OBD-II style JSON</strong>
        </div>
      </section>

      {clusterMode === 'engineer' && (
        <>
          <section className="spotlight-grid">
            <article className={`panel trend-spotlight ${severity.toLowerCase()}`}>
              <div className="panel-heading">
                <div>
                  <h2>Trend Spotlight</h2>
                  <p>Dominant risk: {dominantDriver.label}</p>
                </div>
                <span className="badge">{Math.round(dominantDriver.risk)} risk</span>
              </div>
              <div className="trend-body">
                <div>
                  <span>{dominantDriver.label}</span>
                  <strong>
                    {dominantDriver.unit === 'RPM' ? Math.round(dominantDriver.value) : dominantDriver.value.toFixed(dominantDriver.unit === 'g' || dominantDriver.unit === 'V' || dominantDriver.unit === 'PSI' ? 1 : 0)}
                    <small>{dominantDriver.unit}</small>
                  </strong>
                  <p>{dominantDriver.action}</p>
                </div>
                <Sparkline points={driverTrend} color={severity === 'CRITICAL' ? '#ef4444' : severity === 'WARNING' ? '#f59e0b' : '#0f6bff'} />
              </div>
            </article>

            <article className="panel severity-timeline-panel">
              <div className="panel-heading">
                <div>
                  <h2>Alert Severity Timeline</h2>
                  <p>Last minute edge events</p>
                </div>
                <Clock3 size={20} />
              </div>
              <div className="severity-timeline">
                {alertTimeline.map((alert) => (
                  <span key={alert.id} className={alert.severity.toLowerCase()} title={`${alert.time} ${alert.title}`} />
                ))}
              </div>
              <div className="timeline-legend">
                <span><i className="info" /> INFO</span>
                <span><i className="warning" /> WARNING</span>
                <span><i className="critical" /> CRITICAL</span>
              </div>
            </article>
          </section>

          <section className="main-grid">
            <article className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <h2>Live Sensor Trends</h2>
                  <p>Rolling edge window, refreshed every 1.4 seconds</p>
                </div>
                <span className="badge">last 60s</span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                  <XAxis dataKey="tick" stroke="var(--muted)" tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted)" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12 }} />
                  <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={3} dot={false} name="Risk" />
                  <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} dot={false} name="Temp C" />
                  <Line type="monotone" dataKey="tyre" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Tyre PSI" />
                  <Line type="monotone" dataKey="brake" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Brake %" />
                </LineChart>
              </ResponsiveContainer>
            </article>

            <article className="panel edge-panel">
              <div className="panel-heading">
                <div>
                  <h2>Edge AI Analysis</h2>
                  <p>Local inference packet and failure window</p>
                </div>
                <Gauge size={22} />
              </div>
              <div className="analysis-stack">
                <div className={`analysis-callout ${severity.toLowerCase()}`}>
                  <span>Time-to-failure estimate</span>
                  <strong>{failureWindow}</strong>
                </div>
                <div className="obd-card">
                  <div>
                    <span>Edge agent is producing OBD-II style telemetry</span>
                    <strong>CAN 0x7DF - {obdPacket.id}</strong>
                  </div>
                  <pre>{JSON.stringify(obdPacket, null, 2)}</pre>
                </div>
              </div>
            </article>
          </section>
        </>
      )}

      <section className="lower-grid" style={{ gridTemplateColumns: clusterMode === 'cluster' ? '1fr' : undefined }}>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <h2>Predictive Alert Feed</h2>
              <p>Generated locally by threshold and trend analysis</p>
            </div>
            <MessageSquare size={20} />
          </div>
          <div className="alert-list">
            {alerts.map((alert) => (
              <div className={`alert-item ${alert.severity.toLowerCase()}`} key={alert.id}>
                <div className="alert-row">
                  <span className="alert-time">{alert.time}</span>
                  <span className="alert-badge">{alert.severity}</span>
                </div>
                <strong><AlertTriangle size={16} /> {alert.title}</strong>
                <p>{alert.description}</p>
                <small>{recommendedAction(alert)}</small>
              </div>
            ))}
          </div>
        </article>

        {clusterMode === 'engineer' && (
          <article className="panel">
            <div className="panel-heading">
              <div>
                <h2>Fleet / ADAS Sync</h2>
                <p>Anonymized cloud view after edge decisions</p>
              </div>
              <RadioTower size={20} />
            </div>
            <div className="fleet-stats">
              <div><span>Vehicles monitored</span><strong>3</strong></div>
              <div><span>Critical</span><strong>{severity === 'CRITICAL' ? 1 : 0}</strong></div>
              <div><span>Avg risk</span><strong>{Math.round((riskInfo.risk + 31 + 18) / 3)}</strong></div>
            </div>
            <div className="fleet-map" aria-label="Connected fleet status grid">
              <span className={`vehicle-dot ${severity.toLowerCase()}`}>EV-014</span>
              <span className="vehicle-dot info">ICE-221</span>
              <span className="vehicle-dot info">CV-088</span>
            </div>
            <div className="sync-line">
              <RadioTower size={16} />
              <span>Last edge alert synced: {alerts[0]?.title ?? 'No alerts yet'} at {alerts[0]?.time ?? nowStamp()}</span>
            </div>
            <div className="fleet-table">
              {[
                ['TATA-EV-014', severity, riskInfo.risk],
                ['TATA-ICE-221', 'INFO', 31],
                ['TATA-CV-088', 'INFO', 18],
              ].map(([id, state, score]) => (
                <div key={id}>
                  <span>{id}</span>
                  <span className={`fleet-badge ${String(state).toLowerCase()}`}>{String(state)}</span>
                  <strong>{String(score)}</strong>
                </div>
              ))}
            </div>
          </article>
        )}
      </section>

      <section className="fault-panel">
        <div>
          <span className="eyebrow">Live demo controls</span>
          <h2>Inject fault scenarios</h2>
          <div className={`scenario-pill ${severity.toLowerCase()}`}>
            Scenario active: {scenario.label} - {scenario.failure}
          </div>
        </div>

        <div className="light-sensor-simulator">
          <div className="sensor-header">
            <span>Ambient Light Sensor</span>
            <strong>{ambientLight} lux</strong>
          </div>
          <input
            type="range"
            min="10"
            max="800"
            value={ambientLight}
            onChange={(e) => {
              const lux = Number(e.target.value);
              setAmbientLight(lux);
              setTheme(lux < 150 ? 'dark' : 'light');
            }}
            className="lux-slider"
            aria-label="Simulated ambient light sensor"
          />
          <div className="headlight-status">
            <span>Headlights (Auto):</span>
            <span className={`status-badge ${ambientLight < 150 ? 'active' : ''}`}>
              {ambientLight < 150 ? '🌙 ON (Night Mode)' : '☀️ OFF (Day Mode)'}
            </span>
          </div>
        </div>

        <div className="fault-actions">
          {(Object.keys(faultLabels) as FaultKey[]).map((fault) => (
            <button className={activeFaults[fault] ? 'active' : ''} type="button" key={fault} onClick={() => toggleFault(fault)}>
              <AlertTriangle size={17} />
              {faultLabels[fault]}
            </button>
          ))}
          <button className={demoRunning ? 'active' : ''} type="button" onClick={runDemoScript}>
            <Sparkles size={17} />
            Run Demo Script
          </button>
          <button className="reset" type="button" onClick={resetDemo}><RefreshCcw size={17} /> Reset All</button>
        </div>
      </section>
      </>
      ) : (
        <section className="report-page">
          <div className="report-hero panel">
            <div>
              <span className="eyebrow">Generated diagnostic report</span>
              <h1>Vehicle Health Report</h1>
              <p>Generated from current live telemetry, local edge alerts, failure estimates, and copilot recommendations.</p>
            </div>
            <div className="report-actions">
              <RiskRadial risk={riskInfo.risk} severity={severity} />
              <button type="button" className="download-report" onClick={downloadDiagnosticPdf}>
                <FileText size={18} />
                Download PDF
              </button>
            </div>
          </div>

          <div className="report-grid">
            <article className="panel report-summary">
              <div className="panel-heading">
                <div>
                  <h2>Overall Situation</h2>
                  <p>Driver-readable summary</p>
                </div>
                <FileText size={22} />
              </div>
              {reportSections.map(([label, value]) => (
                <div className="report-row" key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </article>

            <article className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Sensor Snapshot</h2>
                  <p>Current live readings</p>
                </div>
                <Gauge size={22} />
              </div>
              <div className="report-sensors">
                <div><span>Engine Temp</span><strong>{Math.round(sensors.temp)} C</strong></div>
                <div><span>RPM</span><strong>{Math.round(sensors.rpm)}</strong></div>
                <div><span>Brake Wear</span><strong>{Math.round(sensors.brake)}%</strong></div>
                <div><span>Tyre Pressure</span><strong>{sensors.tyre.toFixed(1)} PSI</strong></div>
                <div><span>Battery</span><strong>{sensors.battery.toFixed(1)} V</strong></div>
                <div><span>Vibration</span><strong>{sensors.vibration.toFixed(2)} g</strong></div>
              </div>
            </article>

            <article className="panel report-wide">
              <div className="panel-heading">
                <div>
                  <h2>Problems And Recommended Actions</h2>
                  <p>Priority list generated from local edge alerts</p>
                </div>
                <AlertTriangle size={22} />
              </div>
              <div className="report-alerts">
                {alerts.slice(0, 6).map((alert) => (
                  <div className={`alert-item ${alert.severity.toLowerCase()}`} key={alert.id}>
                    <div className="alert-row">
                      <span className="alert-time">{alert.time}</span>
                      <span className="alert-badge">{alert.severity}</span>
                    </div>
                    <strong><AlertTriangle size={16} /> {alert.title}</strong>
                    <p>{alert.description}</p>
                    <small>{recommendedAction(alert)}</small>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      )}

      <footer className="site-footer">
        <div className="footer-brand">
          <img src="/logo.png" alt="EdgeGuard Logo" className="footer-logo-img" />
          <div>
            <strong>EdgeGuard</strong>
            <p>AI clarity for connected vehicles, with local edge safety and optional cloud reasoning.</p>
          </div>
        </div>

        <div className="footer-links">
          <div>
            <h3>Platform</h3>
            <a href="#dashboard">Dashboard</a>
            <a href="#reports">Reports</a>
            <a href="#analytics">Analytics</a>
          </div>
          <div>
            <h3>Workspace</h3>
            <a href="#live">Live Console</a>
            <a href="#demo">Demo Workspace</a>
            <a href="#actions">AI Actions</a>
          </div>
          <div>
            <h3>Company</h3>
            <a href="#profile">Profile</a>
            <a href="#about">About</a>
            <a href="#press">Press</a>
          </div>
          <div>
            <h3>Artifacts</h3>
            <a href="file:///c:/Users/harsh/Downloads/EdgeGuard-Tata-InnoVent-2026-main/EdgeGuard-Tata-InnoVent-2026-main/SpringBootBackend" target="_blank" rel="noreferrer">Spring Boot Backend ↗</a>
            <a href="file:///c:/Users/harsh/Downloads/EdgeGuard-Tata-InnoVent-2026-main/EdgeGuard-Tata-InnoVent-2026-main/TabNetModel" target="_blank" rel="noreferrer">TabNet Model ↗</a>
            <a href="file:///c:/Users/harsh/Downloads/EdgeGuard-Tata-InnoVent-2026-main/EdgeGuard-Tata-InnoVent-2026-main/DataBase" target="_blank" rel="noreferrer">MySQL DB Schema ↗</a>
          </div>
          <div>
            <h3>Resources</h3>
            <a href="/AutomotiveFaultDetection.pdf" target="_blank" rel="noreferrer">Automotive Brief (PDF)</a>
            <a href="/docs/EdgeGuard_Tata_InnoVent_2026.pdf" target="_blank" rel="noreferrer">Project Overview (PDF)</a>
            <a href="/docs/EdgeGuard_gap_analysis.txt" target="_blank" rel="noreferrer">Gap Analysis Docs</a>
            <a href="/docs/edgeguard_frontend_requirements.md" target="_blank" rel="noreferrer">Frontend Tech Requirements</a>
          </div>
        </div>

        <div className="footer-connect">
          <h3>Connect</h3>
          <div className="social-icons">
            <button type="button" aria-label="GitHub"><Mail size={16} /></button>
            <button type="button" aria-label="Twitter"><MessageSquare size={16} /></button>
            <button type="button" aria-label="LinkedIn"><RadioTower size={16} /></button>
            <button type="button" aria-label="Email"><Send size={16} /></button>
          </div>
          <div className="footer-badge">Built for Tata InnoVent</div>
        </div>
      </footer>



      {/* Simulated Steering Wheel Controls Grip */}
      {/* Voice Notification Banner HUD */}
      {voiceNotification && (
        <div className={`voice-hud-toast ${voiceListening ? 'listening' : ''}`}>
          <Mic size={18} />
          <span>{voiceNotification}</span>
        </div>
      )}

      {/* Simulated Steering Wheel Controls Grip */}
      <div className="steering-wheel-ctrl" aria-label="Simulated steering wheel controls">
        <div className="grip-header">
          <span>STEERING CONTROLS</span>
        </div>
        <div className="grip-buttons">
          <button 
            type="button" 
            onClick={() => setActiveTab(activeTab === 'dashboard' ? 'report' : 'dashboard')} 
            title="Toggle View Mode (Dashboard/Report)"
          >
            <span>VIEW ({activeTab === 'dashboard' ? 'Report' : 'Dash'})</span>
          </button>
          <button 
            type="button" 
            onClick={() => setClusterMode(clusterMode === 'cluster' ? 'engineer' : 'cluster')} 
            title="Toggle Dashboard Detail Level"
          >
            <span>MODE ({clusterMode === 'cluster' ? 'Driver' : 'Eng'})</span>
          </button>
          <button 
            type="button" 
            onClick={() => setLocale(locale === 'metric' ? 'imperial' : 'metric')} 
            title="Toggle Metric/Imperial Units"
          >
            <span>UNITS ({locale === 'metric' ? 'Met' : 'Imp'})</span>
          </button>
          <button 
            type="button" 
            onClick={() => setCloudConnected(!cloudConnected)} 
            title="Toggle Cloud Connection"
            className={cloudConnected ? 'online-btn' : 'offline-btn'}
          >
            <span>CLOUD ({cloudConnected ? 'On' : 'Off'})</span>
          </button>
          <button 
            type="button" 
            className={voiceListening ? 'listening' : ''}
            onClick={async () => {
              if (voiceListening) return;
              
              const defaultQuestions = [
                "Is the vehicle safe to drive?",
                "Why is my edge risk score high?",
                "How long can I drive with the current brakes?",
                "What should be my immediate maintenance action?"
              ];
              const randomDefault = defaultQuestions[Math.floor(Math.random() * defaultQuestions.length)];
              
              const query = window.prompt("Ask Copilot a question while driving:", randomDefault);
              if (query === null) return;
              
              setVoiceListening(true);
              setVoiceNotification(`🗣️ You: "${query}"`);
              
              try {
                // Send current dashboard metrics to backend /api/response
                const payload = {
                  type: 'Tata Nexon EV',
                  transmission: 'Automatic',
                  mileageKm: 4200,
                  status: 'completed',
                  engineRpm: Math.round(sensors.rpm),
                  lubeOilPressure: Math.round(sensors.battery), // Map battery to lubeOilPressure
                  fuelPressure: Math.round(sensors.vibration * 100), // Map vibration to fuelPressure
                  coolantPressure: Math.round(sensors.tyre), // Map tyre to coolantPressure
                  lubeOilTemp: Math.round(sensors.brake), // Map brake to lubeOilTemp
                  coolantTemp: Math.round(sensors.temp), // Map temp to coolantTemp
                  confidenceValue: riskInfo.risk,
                  query: query
                };
                
                const response = await fetch('http://localhost:8080/api/response', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(payload),
                });
                
                if (!response.ok) {
                  throw new Error('Backend response error');
                }
                
                const result = await response.json();
                const reply = result.rawResponse;
                
                setVoiceNotification(`🎙️ Copilot: "${reply}"`);
                window.setTimeout(() => {
                  setVoiceNotification(null);
                  setVoiceListening(false);
                }, 9000);
                
              } catch (error) {
                console.error('LLM connection failed, using local offline model:', error);
                const localResponse = mechanicReply(query, sensors, riskInfo.risk, alerts);
                setVoiceNotification(`🎙️ Copilot (Offline): "${localResponse}"`);
                window.setTimeout(() => {
                  setVoiceNotification(null);
                  setVoiceListening(false);
                }, 7500);
              }
            }} 
            title="Trigger Voice Command Simulator"
          >
            <Mic size={14} />
            <span>VOICE SIM</span>
          </button>
          <button 
            type="button" 
            className="ctrl-danger"
            onClick={resetDemo} 
            title="Emergency Reset Telemetry"
          >
            <span>RESET ALL</span>
          </button>
        </div>
      </div>
    </main>
  );
}

export default App;

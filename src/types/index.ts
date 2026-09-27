export type WellId = 'BW-17' | 'BW-21' | 'BW-24' | 'BW-31';

export type NavPage = 
  | 'overview' 
  | 'twin' 
  | 'css' 
  | 'srp' 
  | 'integrated'
  | 'forecast'
  | 'risk' 
  | 'whatif' 
  | 'history' 
  | 'ai'
  | 'analysis'
  | 'field'
  | 'users'
  | 'settings';

export type OverallRisk = 'Low' | 'Moderate' | 'High';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface CalculatedValues {
  reservoirTemperature: number;
  oilViscosity: number;
  production: number;
  pumpEfficiency: number;
  rodLoad: number;
  rodLoadKN: number;
  pumpFillage: number;
  sor: number;
  energyPerBarrel: number;
  rodFloatingRisk: RiskLevel;
  rodFloatingRiskPct: number;
  impactLoadingRisk: RiskLevel;
  impactLoadingRiskPct: number;
  rodFailureRisk: RiskLevel;
  rodFailureRiskPct: number;
  pumpUnsettingRisk: RiskLevel;
  pumpUnsettingRiskPct: number;
  overallRisk: RiskLevel;
  overallRiskScore: number;
  riskFactors: RiskFactorDetail[];
}

export interface ReservoirData {
  depthM: number;
  temperatureC: number;
  pressureBar: number;
  viscosityCp: number;
  payThicknessM: number;
  porosityPct: number;
  apiGravity: number;
  coolingRateCPerDay: number;
}

export interface SRPParameters {
  strokeLengthIn: number;
  spm: number;
  vfdHz: number;
  rodDiameterIn: number;
  pumpDepthM: number;
  motorPowerKw: number;
}

export interface CSSParameters {
  cycleNumber: number;
  steamVolumeM3: number;
  injectionPressureBar: number;
  soakHours: number;
  cutoffBopd: number;
  steamQualityPct: number;
  phase: 'Production' | 'Injection' | 'Soaking';
  injectionStatus: 'Completed' | 'In Progress' | 'Scheduled';
  soakStatus: 'Completed' | 'In Progress' | 'Scheduled';
}

export interface HistoricalRecord {
  date: string;
  productionBopd: number;
  reservoirTempC: number;
  steamVolumeM3: number;
  spm: number;
  pumpEfficiencyPct: number;
  sor: number;
  rodLoadPct: number;
  rodLoadKN: number;
  viscosityCp: number;
}

export interface MaintenanceEvent {
  id: string;
  date: string;
  wellId: WellId;
  event: string;
  type: 'Rod Failure' | 'Pump Unsetting' | 'Rod Floating' | 'Workover' | 'Inspection';
  operatingCondition: string;
  contributingFactors: string;
  severity: 'Low' | 'Moderate' | 'High';
  status: 'Resolved' | 'Closed' | 'Under Observation';
}

export interface RiskFactorDetail {
  name: string;
  value: string;
  level: 'Normal' | 'Elevated' | 'High' | 'Critical';
  isWarning: boolean;
  description: string;
}

export interface AlertItem {
  id: string;
  title: string;
  severity: 'Low' | 'Medium' | 'High';
  timestamp: string;
  parameter: string;
  value: string;
}

/**
 * Standardized WellState model representing the active well telemetry,
 * operational settings, physical derivatives, and risk profiles.
 */
export interface WellState {
  wellId: WellId;
  field: string;
  status: 'Online' | 'Standby' | 'Maintenance';
  dataSource: string; // e.g. 'Simulated Telemetry · Current Model State'

  // Reservoir
  productionBOPD: number;
  reservoirTemperatureC: number;
  reservoirPressureBar: number;
  viscosityCp: number;

  // CSS parameters
  steamVolumeM3: number;
  injectionPressureBar: number;
  soakTimeHours: number;
  productionCutoffBOPD: number;
  cssCycleNumber: number;
  cssPhase: 'Production' | 'Injection' | 'Soaking';
  lastSteamInjection: string;
  lastSoakDuration: string;

  // SRP parameters
  strokeLengthIn: number;
  spm: number;
  vfdFrequencyHz: number;

  // Performance & Mechanics
  pumpEfficiencyPct: number;
  pumpFillagePct: number;
  rodLoadKN: number;
  rodLoadPct: number;
  sor: number;
  energyKWhPerBbl: number;

  // Equipment Risks
  rodFloatingRiskPct: number;
  impactLoadingRiskPct: number;
  rodFailureRiskPct: number;
  pumpUnsettingRiskPct: number;
  overallRisk: OverallRisk;
  overallRiskScore: number; // 0 - 100
  overallScore: number;     // alias for overallRiskScore

  // Trends & Dynamics
  temperatureTrend: number; // °C / day
  productionTrend: number;  // % change over recent log
  lastCSSCycle: number;

  // Visual & Advisory
  alerts: AlertItem[];
  riskFactors: RiskFactorDetail[];
  twinInsight: string;
}

export interface WellBaseline {
  id: WellId;
  name: string;
  field: string;
  status: 'Online' | 'Standby' | 'Maintenance';
  lastUpdated: string;
  reservoir: ReservoirData;
  srp: SRPParameters;
  css: CSSParameters;
  historical: HistoricalRecord[];
  alerts: AlertItem[];
  twinInsight: string;
}

export interface ActiveParameters {
  steamVolume: number;
  injectionPressure: number;
  soakTime: number;
  productionCutoff: number;
  strokeLength: number;
  spm: number;
  vfdFrequency: number;
}

export interface CSSOptimizationScenario {
  steamVolumeM3: number;
  injectionPressureBar: number;
  soakHours: number;
  cutoffBopd: number;
  productionBOPD: number;
  sor: number;
  energyKWhPerBbl: number;
  prodDeltaPct: string;
  sorDeltaPct: string;
  energyDeltaPct: string;
  rationale: string;
}

export interface SRPOptimizationScenario {
  strokeLengthIn: number;
  spm: number;
  vfdHz: number;
  pumpEfficiencyPct: number;
  rodLoadPct: number;
  rodLoadKN: number;
  productionBOPD: number;
  productionBopd: number;
  rodFloatingRisk: string;
  energyKWhPerBbl: number;
  overallRisk: OverallRisk;
}

export interface IntegratedOptimizationScenario {
  current: {
    reservoirTempC: number;
    viscosityCp: number;
    productionBOPD: number;
    pumpEfficiencyPct: number;
    rodLoadKN: number;
    rodLoadPct?: number;
    rodFloatingRiskPct?: number;
    rodFloatingRiskLevel?: string;
    sor: number;
    energyKWhPerBbl: number;
    overallRisk: OverallRisk;
  };
  recommendedCSS: {
    steamVolumeM3: number;
    injectionPressureBar: number;
    soakHours: number;
    cutoffBopd: number;
  };
  recommendedSRP: {
    strokeLengthIn: number;
    spm: number;
    vfdHz: number;
  };
  expectedResult: {
    productionBOPD: number;
    productionDelta: number;
    reservoirTempC: number;
    viscosityCp: number;
    pumpEfficiencyPct: number;
    rodLoadKN: number;
    rodLoadPct?: number;
    rodFloatingRiskPct?: number;
    rodFloatRiskLevel?: string;
    sor: number;
    energyKWhPerBbl: number;
    overallRisk: OverallRisk;
    costIndexDeltaPct: number;
  };
  rationale: string;
}

export interface WhatIfInputs {
  steamVolumeM3: number;
  injectionPressureBar: number;
  soakHours: number;
  strokeLengthIn: number;
  spm: number;
  vfdHz: number;
}

export interface WhatIfComparison {
  currentProduction: number;
  simulatedProduction: number;
  currentSor: number;
  simulatedSor: number;
  currentEfficiency: number;
  simulatedEfficiency: number;
  currentEnergy: number;
  simulatedEnergy: number;
  currentRodLoad: number;
  simulatedRodLoad: number;
  currentFailureRisk: OverallRisk | RiskLevel | string;
  simulatedFailureRisk: OverallRisk | RiskLevel | string;
  trajectory: { day: string; current: number; simulated: number }[];
}

export interface StructuredAIAnalysis {
  title: string;
  wellId: WellId;
  analysis: string;
  observations: string[];
  supportingData: { label: string; value: string }[];
  implication: string;
}

export interface ForecastPoint {
  day: number;
  date: string;
  tempC: number;
  tempLower: number;
  tempUpper: number;
  viscosityCp: number;
  productionBopd: number;
  prodLower: number;
  prodUpper: number;
  efficiencyPct: number;
  mobilityIndex: number;
}

export type UserRole = 
  | 'Administrator' 
  | 'Field Engineer' 
  | 'Production Engineer' 
  | 'Maintenance Engineer' 
  | 'Viewer';

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  status: 'Active' | 'Disabled';
  lastLogin: string;
  email?: string;
  avatarInitials: string;
  password?: string;
}

export type LanguageCode = 'en' | 'hi' | 'raj' | 'gu' | 'pa' | 'mr';

export interface RodRemainingLife {
  estimatedRemainingDays: number;
  estimatedOperatingHours: number;
  rodFailureRiskPct: number;
  condition: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  estimatedInspectionDays: number;
  healthScore: number;
  drivers: {
    name: string;
    level: 'Low' | 'Moderate' | 'High';
    description: string;
  }[];
  maintenanceWindow: {
    inspectionDays: number;
    action: string;
    reasons: string[];
  };
  historicalTrend: { day: string; remainingDays: number; riskThreshold: number }[];
  equipmentHealth: {
    rodString: { healthPct: number; status: 'Healthy' | 'Warning' | 'Critical'; trend: string; factor: string };
    pump: { healthPct: number; status: 'Healthy' | 'Warning' | 'Critical'; trend: string; factor: string };
    surfaceUnit: { healthPct: number; status: 'Healthy' | 'Warning' | 'Critical'; trend: string; factor: string };
    vfd: { healthPct: number; status: 'Healthy' | 'Warning' | 'Critical'; trend: string; factor: string };
  };
}

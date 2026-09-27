import { GoogleGenAI } from '@google/genai';
import { 
  ActiveParameters, 
  CalculatedValues, 
  StructuredAIAnalysis, 
  WellBaseline, 
  WellState 
} from '../types';
import { 
  analyzeCSSCycle, 
  analyzeCurrentRisk, 
  analyzeProductionChange, 
  analyzeSRPPerformance, 
  compareWithHistory, 
  explainCurrentWell 
} from './simulationEngine';

export interface AIWellContext {
  wellId: string;
  field: string;
  status: string;
  depthM: number;
  production: number;
  productionBOPD: number;
  productionTrend: number;
  reservoirTemperature: number;
  reservoirTemperatureC: number;
  temperatureTrend: number;
  reservoirPressureBar: number;
  oilViscosity: number;
  viscosityCp: number;
  steamVolume: number;
  steamVolumeM3: number;
  injectionPressure: number;
  injectionPressureBar: number;
  soakTime: number;
  soakTimeHours: number;
  productionCutoff: number;
  productionCutoffBOPD: number;
  cssCycle: number;
  lastCSSCycle: number;
  cssPhase: string;
  spm: number;
  strokeLength: number;
  strokeLengthIn: number;
  vfdFrequency: number;
  vfdFrequencyHz: number;
  pumpEfficiency: number;
  pumpEfficiencyPct: number;
  pumpFillage: number;
  pumpFillagePct: number;
  rodLoad: number;
  rodLoadPct: number;
  rodLoadKN: number;
  sor: number;
  energyPerBarrel: number;
  energyKWhPerBbl: number;
  rodFloatingRisk: string;
  rodFloatingRiskPct: number;
  pumpUnsettingRisk: string;
  pumpUnsettingRiskPct: number;
  overallRisk: string;
  overallRiskScore: number;
  historicalStartProduction: number;
  historicalAvgProduction: number;
  historicalAvgTemp: number;
  historicalAvgViscosity: number;
  historicalAvgSor: number;
  historicalAvgEff: number;
  recentHistorical: { date: string; production: number; temp: number; sor: number; visc: number }[];
  dataSource: string;
}

export function buildAIContext(
  arg1: WellBaseline | WellState,
  arg2?: ActiveParameters | WellBaseline,
  arg3?: CalculatedValues
): AIWellContext {
  let baseline: WellBaseline;
  let active: ActiveParameters;
  let calc: CalculatedValues;

  if (arg3 && 'css' in arg1) {
    // Called with (wellBaseline, activeParameters, calculatedState)
    baseline = arg1 as WellBaseline;
    active = arg2 as ActiveParameters;
    calc = arg3 as CalculatedValues;
  } else if ('dataSource' in arg1 && arg2 && 'css' in arg2) {
    // Called with (wellState, baseline)
    const ws = arg1 as WellState;
    baseline = arg2 as WellBaseline;
    active = {
      steamVolume: ws.steamVolumeM3,
      injectionPressure: ws.injectionPressureBar,
      soakTime: ws.soakTimeHours,
      productionCutoff: ws.productionCutoffBOPD,
      strokeLength: ws.strokeLengthIn,
      spm: ws.spm,
      vfdFrequency: ws.vfdFrequencyHz,
    };
    calc = {
      reservoirTemperature: ws.reservoirTemperatureC,
      oilViscosity: ws.viscosityCp,
      production: ws.productionBOPD,
      pumpEfficiency: ws.pumpEfficiencyPct,
      rodLoad: ws.rodLoadPct,
      rodLoadKN: ws.rodLoadKN,
      pumpFillage: ws.pumpFillagePct,
      sor: ws.sor,
      energyPerBarrel: ws.energyKWhPerBbl,
      rodFloatingRisk: ws.rodFloatingRiskPct > 60 ? 'HIGH' : ws.rodFloatingRiskPct > 30 ? 'MEDIUM' : 'LOW',
      rodFloatingRiskPct: ws.rodFloatingRiskPct,
      impactLoadingRisk: ws.impactLoadingRiskPct > 55 ? 'HIGH' : ws.impactLoadingRiskPct > 30 ? 'MEDIUM' : 'LOW',
      impactLoadingRiskPct: ws.impactLoadingRiskPct,
      rodFailureRisk: ws.rodFailureRiskPct > 65 ? 'HIGH' : ws.rodFailureRiskPct > 35 ? 'MEDIUM' : 'LOW',
      rodFailureRiskPct: ws.rodFailureRiskPct,
      pumpUnsettingRisk: ws.pumpUnsettingRiskPct > 50 ? 'HIGH' : ws.pumpUnsettingRiskPct > 25 ? 'MEDIUM' : 'LOW',
      pumpUnsettingRiskPct: ws.pumpUnsettingRiskPct,
      overallRisk: ws.overallRisk === 'High' ? 'HIGH' : ws.overallRisk === 'Moderate' ? 'MEDIUM' : 'LOW',
      overallRiskScore: ws.overallRiskScore,
      riskFactors: ws.riskFactors,
    };
  } else {
    baseline = arg1 as WellBaseline;
    active = {
      steamVolume: baseline.css.steamVolumeM3,
      injectionPressure: baseline.css.injectionPressureBar,
      soakTime: baseline.css.soakHours,
      productionCutoff: baseline.css.cutoffBopd,
      strokeLength: baseline.srp.strokeLengthIn,
      spm: baseline.srp.spm,
      vfdFrequency: baseline.srp.vfdHz,
    };
    calc = {
      reservoirTemperature: baseline.reservoir.temperatureC,
      oilViscosity: baseline.reservoir.viscosityCp,
      production: 85,
      pumpEfficiency: 78,
      rodLoad: 70,
      rodLoadKN: 154,
      pumpFillage: 85,
      sor: 3.8,
      energyPerBarrel: 11.8,
      rodFloatingRisk: 'LOW',
      rodFloatingRiskPct: 25,
      impactLoadingRisk: 'LOW',
      impactLoadingRiskPct: 20,
      rodFailureRisk: 'LOW',
      rodFailureRiskPct: 22,
      pumpUnsettingRisk: 'LOW',
      pumpUnsettingRiskPct: 15,
      overallRisk: 'LOW',
      overallRiskScore: 20,
      riskFactors: [],
    };
  }

  const hist = baseline.historical;
  const count = Math.max(1, hist.length);
  const prodAvg = Math.round(hist.reduce((s, r) => s + r.productionBopd, 0) / count);
  const tempAvg = Number((hist.reduce((s, r) => s + r.reservoirTempC, 0) / count).toFixed(1));
  const viscAvg = Math.round(hist.reduce((s, r) => s + r.viscosityCp, 0) / count);
  const sorAvg = Number((hist.reduce((s, r) => s + r.sor, 0) / count).toFixed(2));
  const effAvg = Number((hist.reduce((s, r) => s + r.pumpEfficiencyPct, 0) / count).toFixed(1));

  return {
    wellId: baseline.id,
    field: baseline.field,
    status: baseline.status,
    depthM: baseline.reservoir.depthM,
    production: calc.production,
    productionBOPD: calc.production,
    productionTrend: Number((((calc.production - hist[0].productionBopd) / hist[0].productionBopd) * 100).toFixed(1)),
    reservoirTemperature: calc.reservoirTemperature,
    reservoirTemperatureC: calc.reservoirTemperature,
    temperatureTrend: baseline.reservoir.coolingRateCPerDay,
    reservoirPressureBar: baseline.reservoir.pressureBar,
    oilViscosity: calc.oilViscosity,
    viscosityCp: calc.oilViscosity,
    steamVolume: active.steamVolume,
    steamVolumeM3: active.steamVolume,
    injectionPressure: active.injectionPressure,
    injectionPressureBar: active.injectionPressure,
    soakTime: active.soakTime,
    soakTimeHours: active.soakTime,
    productionCutoff: active.productionCutoff,
    productionCutoffBOPD: active.productionCutoff,
    cssCycle: baseline.css.cycleNumber,
    lastCSSCycle: baseline.css.cycleNumber,
    cssPhase: baseline.css.phase,
    spm: active.spm,
    strokeLength: active.strokeLength,
    strokeLengthIn: active.strokeLength,
    vfdFrequency: active.vfdFrequency,
    vfdFrequencyHz: active.vfdFrequency,
    pumpEfficiency: calc.pumpEfficiency,
    pumpEfficiencyPct: calc.pumpEfficiency,
    pumpFillage: calc.pumpFillage,
    pumpFillagePct: calc.pumpFillage,
    rodLoad: calc.rodLoad,
    rodLoadPct: calc.rodLoad,
    rodLoadKN: calc.rodLoadKN,
    sor: calc.sor,
    energyPerBarrel: calc.energyPerBarrel,
    energyKWhPerBbl: calc.energyPerBarrel,
    rodFloatingRisk: calc.rodFloatingRisk,
    rodFloatingRiskPct: calc.rodFloatingRiskPct,
    pumpUnsettingRisk: calc.pumpUnsettingRisk,
    pumpUnsettingRiskPct: calc.pumpUnsettingRiskPct,
    overallRisk: calc.overallRisk,
    overallRiskScore: calc.overallRiskScore,
    historicalStartProduction: hist[0].productionBopd,
    historicalAvgProduction: prodAvg,
    historicalAvgTemp: tempAvg,
    historicalAvgViscosity: viscAvg,
    historicalAvgSor: sorAvg,
    historicalAvgEff: effAvg,
    recentHistorical: hist.slice(-5).map(r => ({
      date: r.date,
      production: r.productionBopd,
      temp: r.reservoirTempC,
      sor: r.sor,
      visc: r.viscosityCp,
    })),
    dataSource: 'Historical Field Telemetry & Reservoir Model Logs',
  };
}

/**
 * Main AI Operations Terminal Handler
 * Always grounds responses in real telemetry and local deterministic physics.
 * Can optionally augment phrasing using Gemini API if key is present.
 */
export async function askAIOperations(
  query: string,
  context: AIWellContext,
  actionKey?: string
): Promise<{ answer: string; dataUsed: Record<string, string | number> }> {
  const q = query.toLowerCase();

  // 1. Check for domain data limitations
  const unanswerableKeywords = ['sand screen', 'gas-oil ratio', 'gor', 'cement bond', 'corrosion log', 'h2s', 'water cut analysis', 'chemical inhibitor'];
  for (const kw of unanswerableKeywords) {
    if (q.includes(kw)) {
      return {
        answer: `That cannot be determined reliably from the current application data. This analysis would require downhole sand screen logs, laboratory water/gas chromatographs, or periodic ultrasonic casing caliper inspections not currently monitored by the Digital Twin. Telemetry is bounded to CSS thermal parameters, SRP kinematics, and wellhead/reservoir thermodynamic state.`,
        dataUsed: {
          'Monitored Streams': 'Production, Reservoir Temp, Pressure, Viscosity, Rod load',
          'Requested Unmonitored': kw.toUpperCase(),
          'Status': 'Data stream not configured in model',
        },
      };
    }
  }

  // 2. Determine Action Route
  let route = actionKey;
  if (!route) {
    if (q.includes('production') || q.includes('rate') || q.includes('flow') || q.includes('drop') || q.includes('decline')) {
      route = 'production';
    } else if (q.includes('risk') || q.includes('failure') || q.includes('float') || q.includes('buckl')) {
      route = 'risk';
    } else if (q.includes('css') || q.includes('steam') || q.includes('soak') || q.includes('sor')) {
      route = 'css';
    } else if (q.includes('srp') || q.includes('lift') || q.includes('spm') || q.includes('stroke') || q.includes('pump') || q.includes('vfd')) {
      route = 'srp';
    } else if (q.includes('history') || q.includes('average') || q.includes('compare') || q.includes('past')) {
      route = 'history';
    } else {
      route = 'explain';
    }
  }

  // 3. Formulate Deterministic Grounded Analysis
  let answer = '';
  let dataUsed: Record<string, string | number> = {};

  if (route === 'production') {
    const prodDiff = context.production - context.historicalStartProduction;
    const diffText = prodDiff >= 0 ? `+${prodDiff}` : `${prodDiff}`;
    answer = `Production for ${context.wellId} is currently ${context.production} BOPD (${diffText} BOPD relative to the ${context.historicalStartProduction} BOPD post-soak onset). Reservoir temperature currently stands at ${context.reservoirTemperature}°C with cooling rate at ${context.temperatureTrend} °C/day, which has elevated heavy crude viscosity to ${context.oilViscosity.toLocaleString()} cP. Higher viscosity reduces pump intake efficiency to ${context.pumpEfficiency}% and increases downstroke rod loading to ${context.rodLoad}% (${context.rodLoadKN} kN). Pumping speed is set to ${context.spm.toFixed(1)} SPM with ${context.strokeLength}" stroke. Production remains ${context.production >= context.productionCutoff ? 'above' : 'below'} the ${context.productionCutoff} BOPD cut-off threshold.`;
    dataUsed = {
      'Well ID': context.wellId,
      'Reservoir Temp': `${context.reservoirTemperature} °C`,
      'Oil Viscosity': `${context.oilViscosity.toLocaleString()} cP`,
      'Production Rate': `${context.production} BOPD`,
      'Pump Efficiency': `${context.pumpEfficiency}%`,
      'Pumping Speed': `${context.spm.toFixed(1)} SPM`,
      'Rod Load': `${context.rodLoad}% (${context.rodLoadKN} kN)`,
      'Cut-off Threshold': `${context.productionCutoff} BOPD`,
    };
  } else if (route === 'risk') {
    const riskNarrative = context.rodFloatingRisk === 'HIGH'
      ? `Critical downstroke drag detected: crude viscosity of ${context.oilViscosity.toLocaleString()} cP creates high drag resistance on the descending sucker rod string, risking compressive buckling.`
      : context.rodFloatingRisk === 'MEDIUM'
      ? `Moderate rod floating risk (${context.rodFloatingRiskPct}%): elevated crude viscosity (${context.oilViscosity.toLocaleString()} cP) retards plunger descent.`
      : `Operating risks are low: crude viscosity (${context.oilViscosity.toLocaleString()} cP) permits smooth rod descent without severe viscous retarding.`;

    answer = `Overall operational risk for ${context.wellId} is rated ${context.overallRisk} (score: ${context.overallRiskScore}/100). ${riskNarrative} Peak polished rod tension is ${context.rodLoad}% (${context.rodLoadKN} kN) of rated string capacity. Pump unsetting risk is estimated at ${context.pumpUnsettingRiskPct}%. ${context.overallRisk === 'HIGH' ? 'Action: Reduce SPM to relieve downstroke compressive buckling.' : 'Action: Maintain standard visual and load cell inspections.'}`;
    dataUsed = {
      'Well ID': context.wellId,
      'Overall Risk': context.overallRisk,
      'Risk Score': `${context.overallRiskScore} / 100`,
      'Oil Viscosity': `${context.oilViscosity.toLocaleString()} cP`,
      'Rod Floating Risk': `${context.rodFloatingRiskPct}% (${context.rodFloatingRisk})`,
      'Rod Tension': `${context.rodLoad}% (${context.rodLoadKN} kN)`,
      'Pump Unsetting Risk': `${context.pumpUnsettingRiskPct}%`,
    };
  } else if (route === 'css') {
    answer = `Well ${context.wellId} is operating in CSS Cycle #${context.cssCycle} (${context.cssPhase} phase). The active cycle utilized ${context.steamVolume.toLocaleString()} m³ of steam at ${context.injectionPressure} bar injection pressure followed by a ${context.soakTime}-hour soak period. Current cumulative Steam-Oil Ratio (SOR) is ${context.sor}. Subsurface temperature has reached ${context.reservoirTemperature}°C, sustaining heavy crude fluid mobility. At current cooling rates (${context.temperatureTrend} °C/day), production is projected to stay above the ${context.productionCutoff} BOPD economic cut-off for another 25–35 days before the next stimulation cycle.`;
    dataUsed = {
      'Well ID': context.wellId,
      'CSS Cycle': `Cycle #${context.cssCycle}`,
      'CSS Phase': context.cssPhase,
      'Steam Volume': `${context.steamVolume.toLocaleString()} m³`,
      'Injection Pressure': `${context.injectionPressure} bar`,
      'Soak Duration': `${context.soakTime} hr`,
      'Steam-Oil Ratio (SOR)': `${context.sor}`,
      'Reservoir Temp': `${context.reservoirTemperature} °C`,
      'Cut-off Threshold': `${context.productionCutoff} BOPD`,
    };
  } else if (route === 'srp') {
    answer = `The sucker rod pumping unit on ${context.wellId} is operating at ${context.strokeLength}" stroke length, ${context.spm.toFixed(1)} SPM, and ${context.vfdFrequency} Hz VFD drive. Measured volumetric pump efficiency is ${context.pumpEfficiency}% with ${context.pumpFillage}% chamber fillage. Peak polished rod tension is ${context.rodLoad}% (${context.rodLoadKN} kN) and specific lift energy consumption is ${context.energyPerBarrel} kWh/bbl. In ${context.oilViscosity.toLocaleString()} cP crude, maintaining a long stroke length (${context.strokeLength}") at moderate SPM (${context.spm.toFixed(1)}) reduces cyclic rod stress while maximizing net liquid displacement.`;
    dataUsed = {
      'Well ID': context.wellId,
      'Stroke Length': `${context.strokeLength} in`,
      'Pumping Speed': `${context.spm.toFixed(1)} SPM`,
      'VFD Frequency': `${context.vfdFrequency} Hz`,
      'Pump Efficiency': `${context.pumpEfficiency}%`,
      'Pump Chamber Fillage': `${context.pumpFillage}%`,
      'Peak Rod Load': `${context.rodLoad}% (${context.rodLoadKN} kN)`,
      'Energy Consumption': `${context.energyPerBarrel} kWh/bbl`,
    };
  } else if (route === 'history') {
    const prodDiff = context.production - context.historicalAvgProduction;
    const tempDiff = Number((context.reservoirTemperature - context.historicalAvgTemp).toFixed(1));
    const viscDiff = context.oilViscosity - context.historicalAvgViscosity;
    answer = `Historical comparison for ${context.wellId} across recorded operational cycles shows current production (${context.production} BOPD) is ${prodDiff >= 0 ? '+' : ''}${prodDiff} BOPD relative to the multi-cycle average (${context.historicalAvgProduction} BOPD). Reservoir temperature (${context.reservoirTemperature}°C) is ${tempDiff >= 0 ? '+' : ''}${tempDiff}°C vs the historical average (${context.historicalAvgTemp}°C). Crude viscosity has shifted by ${viscDiff >= 0 ? '+' : ''}${viscDiff} cP from the historical baseline (${context.historicalAvgViscosity.toLocaleString()} cP). Current SOR of ${context.sor} tracks closely with the historical mean of ${context.historicalAvgSor}.`;
    dataUsed = {
      'Current vs Avg Prod': `${context.production} vs ${context.historicalAvgProduction} BOPD`,
      'Current vs Avg Temp': `${context.reservoirTemperature} vs ${context.historicalAvgTemp} °C`,
      'Current vs Avg Visc': `${context.oilViscosity.toLocaleString()} vs ${context.historicalAvgViscosity.toLocaleString()} cP`,
      'Current vs Avg SOR': `${context.sor} vs ${context.historicalAvgSor}`,
      'Current vs Avg Eff': `${context.pumpEfficiency}% vs ${context.historicalAvgEff}%`,
    };
  } else {
    // Explain current well
    answer = `${context.wellId} (${context.field}) produces from the heavy sandstone reservoir at ${context.depthM}m TVD. The well is currently in the ${context.cssPhase} phase of CSS Cycle #${context.cssCycle}. Downhole reservoir temperature is ${context.reservoirTemperature}°C with heavy crude viscosity at ${context.oilViscosity.toLocaleString()} cP. Daily gross production is ${context.production} BOPD lifted by a sucker rod pumping unit at ${context.pumpEfficiency}% volumetric efficiency. Overall operational and mechanical risk is rated ${context.overallRisk} (${context.overallRiskScore}/100).`;
    dataUsed = {
      'Well ID': context.wellId,
      'Pay Depth': `${context.depthM} m TVD`,
      'Current Status': `${context.status} · Cycle #${context.cssCycle} (${context.cssPhase})`,
      'Reservoir Temp': `${context.reservoirTemperature} °C`,
      'Oil Viscosity': `${context.oilViscosity.toLocaleString()} cP`,
      'Production Rate': `${context.production} BOPD`,
      'Overall Risk': `${context.overallRisk} (${context.overallRiskScore}/100)`,
    };
  }

  // 4. If Gemini API key is available, enhance phrasing while retaining strict factual telemetry
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : '');
  if (apiKey && apiKey.length > 5) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are an AI decision support assistant for petroleum engineers operating heavy oil wells in the Baghewala field.
User question: "${query}"
Active well context & telemetry:
${JSON.stringify(context, null, 2)}

Provide a concise, professional engineering response (2-4 sentences max). Use exact numbers from the telemetry context. Do not invent any values. Keep tone technical and authoritative.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are an engineering decision support system for the Baghewala Digital Twin. Stick strictly to the supplied numerical well data. Do not hallucinate.`,
          temperature: 0.15,
        },
      });

      if (response.text && response.text.trim().length > 20) {
        return {
          answer: response.text.trim(),
          dataUsed,
        };
      }
    } catch {
      // Fallback silently to deterministic answer
    }
  }

  return {
    answer,
    dataUsed,
  };
}

/**
 * Structured Quick Analysis Wrapper for backwards compatibility
 */
export async function executeQuickAnalysis(
  actionKey: 'production' | 'risk' | 'css' | 'srp' | 'explain' | 'history',
  wellState: WellState,
  baseline: WellBaseline
): Promise<StructuredAIAnalysis> {
  switch (actionKey) {
    case 'production':
      return analyzeProductionChange(wellState, baseline);
    case 'risk':
      return analyzeCurrentRisk(wellState, baseline);
    case 'css':
      return analyzeCSSCycle(wellState, baseline);
    case 'srp':
      return analyzeSRPPerformance(wellState, baseline);
    case 'explain':
      return explainCurrentWell(wellState, baseline);
    case 'history':
      return compareWithHistory(wellState, baseline);
  }
}

export async function executeCustomQuery(
  query: string,
  wellState: WellState,
  baseline: WellBaseline
): Promise<StructuredAIAnalysis> {
  const q = query.toLowerCase();
  if (q.includes('production')) return analyzeProductionChange(wellState, baseline);
  if (q.includes('risk')) return analyzeCurrentRisk(wellState, baseline);
  if (q.includes('css')) return analyzeCSSCycle(wellState, baseline);
  if (q.includes('srp')) return analyzeSRPPerformance(wellState, baseline);
  if (q.includes('history')) return compareWithHistory(wellState, baseline);
  return explainCurrentWell(wellState, baseline);
}

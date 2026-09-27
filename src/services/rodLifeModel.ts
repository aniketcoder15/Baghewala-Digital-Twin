import { ActiveParameters, RodRemainingLife, WellBaseline, WellState } from '../types';

/**
 * Calculates deterministic Rod Remaining Life and Equipment Health
 * based on live kinematics, thermal conditions, and operating stress.
 */
export function calculateRodRemainingLife(
  baseline: WellBaseline,
  activeParams: ActiveParameters,
  wellState: WellState
): RodRemainingLife {
  const { rodLoadPct, pumpFillagePct, viscosityCp, reservoirTemperatureC, spm, strokeLength, vfdFrequency } = {
    rodLoadPct: wellState.rodLoadPct || 72,
    pumpFillagePct: wellState.pumpFillagePct || 84,
    viscosityCp: wellState.viscosityCp || 4850,
    reservoirTemperatureC: wellState.reservoirTemperatureC || 58,
    spm: activeParams.spm,
    strokeLength: activeParams.strokeLength,
    vfdFrequency: activeParams.vfdFrequency,
  };

  // 1. Penalties Calculation (Weighted Engineering Model)
  // Base health = 100
  let healthScore = 100;

  // A. Load stress penalty (Rod Load %): Normal < 70%
  const loadStressPenalty = Math.max(0, (rodLoadPct - 65) * 1.4);
  healthScore -= loadStressPenalty;

  // B. Rod float / viscous drag penalty (v_rod ~ spm * strokeLength, drag ~ viscosity * v)
  const floatIndex = (viscosityCp / 4500) * ((spm * strokeLength) / (6.8 * 80));
  const rodFloatPenalty = Math.max(0, (floatIndex - 0.9) * 22);
  healthScore -= rodFloatPenalty;

  // C. Impact loading / fluid pound penalty (low pump fillage with higher SPM)
  const fillageDeficit = Math.max(0, 92 - pumpFillagePct);
  const impactLoadingPenalty = (fillageDeficit / 10) * (spm / 6.0) * 4.2;
  healthScore -= impactLoadingPenalty;

  // D. High operating cycles penalty (SPM > 6.5 accelerates stress reversal cycles)
  const highCyclePenalty = Math.max(0, (spm - 6.2) * 5.5);
  healthScore -= highCyclePenalty;

  // E. Thermal cooling penalty (Cooling below 55°C increases wellhead drag & paraffin precipitation)
  const thermalPenalty = reservoirTemperatureC < 55 ? (55 - reservoirTemperatureC) * 1.1 : 0;
  healthScore -= thermalPenalty;

  // Clamp health score 12 to 96
  healthScore = Math.round(Math.max(12, Math.min(96, healthScore)));

  // 2. Map Health Score to Estimated Remaining Life
  let estimatedRemainingDays = 42;
  let condition: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  let failureRiskPct = 18;

  if (healthScore > 85) {
    condition = 'LOW';
    // 90 to 180 days
    estimatedRemainingDays = Math.round(90 + ((healthScore - 85) / 11) * 75);
    failureRiskPct = Math.round(100 - healthScore * 0.95);
  } else if (healthScore >= 70) {
    condition = 'LOW';
    // 45 to 90 days
    estimatedRemainingDays = Math.round(45 + ((healthScore - 70) / 15) * 45);
    failureRiskPct = Math.round(15 + ((85 - healthScore) / 15) * 12);
  } else if (healthScore >= 50) {
    condition = 'MEDIUM';
    // 20 to 45 days
    estimatedRemainingDays = Math.round(20 + ((healthScore - 50) / 20) * 25);
    failureRiskPct = Math.round(28 + ((70 - healthScore) / 20) * 20);
  } else if (healthScore >= 30) {
    condition = 'HIGH';
    // 7 to 20 days
    estimatedRemainingDays = Math.round(7 + ((healthScore - 30) / 20) * 13);
    failureRiskPct = Math.round(48 + ((50 - healthScore) / 20) * 27);
  } else {
    condition = 'CRITICAL';
    // < 7 days
    estimatedRemainingDays = Math.max(3, Math.round(3 + (healthScore / 30) * 4));
    failureRiskPct = Math.round(75 + ((30 - healthScore) / 30) * 20);
  }

  const estimatedOperatingHours = estimatedRemainingDays * 24;
  const estimatedInspectionDays = Math.max(3, Math.round(estimatedRemainingDays * 0.28));

  // 3. Risk Drivers
  const dynamicLoadingLevel = rodLoadPct > 78 ? 'High' : rodLoadPct > 70 ? 'Moderate' : 'Low';
  const floatTendencyLevel = floatIndex > 1.25 ? 'High' : floatIndex > 0.95 ? 'Moderate' : 'Low';
  const fillageVariationLevel = pumpFillagePct < 75 ? 'High' : pumpFillagePct < 85 ? 'Moderate' : 'Low';
  const cyclesLevel = spm > 7.5 ? 'High' : spm > 6.0 ? 'Moderate' : 'Low';
  const thermalLevel = reservoirTemperatureC < 50 ? 'High' : reservoirTemperatureC < 60 ? 'Moderate' : 'Low';

  const drivers = [
    {
      name: 'High dynamic loading',
      level: dynamicLoadingLevel as 'Low' | 'Moderate' | 'High',
      description: `Peak rod load at ${rodLoadPct}% of API yield tension.`,
    },
    {
      name: 'Rod float tendency',
      level: floatTendencyLevel as 'Low' | 'Moderate' | 'High',
      description: `Float index ${floatIndex.toFixed(2)} under ${viscosityCp.toLocaleString()} cP crude.`,
    },
    {
      name: 'Pump fillage variation',
      level: fillageVariationLevel as 'Low' | 'Moderate' | 'High',
      description: `Fluid intake fillage currently at ${pumpFillagePct}%.`,
    },
    {
      name: 'High operating cycles',
      level: cyclesLevel as 'Low' | 'Moderate' | 'High',
      description: `Pumping speed set to ${spm.toFixed(1)} SPM with ${strokeLength}" stroke.`,
    },
    {
      name: 'Thermal condition',
      level: thermalLevel as 'Low' | 'Moderate' | 'High',
      description: `Reservoir temperature at ${reservoirTemperatureC}°C.`,
    },
  ];

  // 4. Maintenance Reasons
  const reasons: string[] = [];
  if (dynamicLoadingLevel !== 'Low') reasons.push('Elevated cyclic rod tensile loading');
  if (fillageVariationLevel !== 'Low') reasons.push('Fluctuations in pump barrel fillage');
  if (cyclesLevel !== 'Low') reasons.push('High mechanical stress frequency at current SPM');
  if (floatTendencyLevel !== 'Low') reasons.push('Downstroke compression and buoyant drag risk');
  if (thermalLevel !== 'Low') reasons.push('Thermal dissipation increasing heavy oil viscosity');
  if (reasons.length === 0) reasons.push('Standard prophylactic preventative maintenance schedule');

  // 5. Historical Trend Data for Chart
  const historicalTrend = [
    { day: 'Day -30', remainingDays: Math.min(140, estimatedRemainingDays + 28), riskThreshold: 20 },
    { day: 'Day -25', remainingDays: Math.min(130, estimatedRemainingDays + 23), riskThreshold: 20 },
    { day: 'Day -20', remainingDays: Math.min(120, estimatedRemainingDays + 18), riskThreshold: 20 },
    { day: 'Day -15', remainingDays: Math.min(110, estimatedRemainingDays + 14), riskThreshold: 20 },
    { day: 'Day -10', remainingDays: Math.min(95, estimatedRemainingDays + 9), riskThreshold: 20 },
    { day: 'Day -5', remainingDays: Math.min(85, estimatedRemainingDays + 5), riskThreshold: 20 },
    { day: 'Current', remainingDays: estimatedRemainingDays, riskThreshold: 20 },
  ];

  // 6. Equipment Health Component Subsystems
  const rodHealthPct = Math.min(98, Math.max(25, healthScore));
  const pumpHealthPct = Math.min(98, Math.max(30, Math.round(pumpFillagePct * 0.65 + wellState.pumpEfficiencyPct * 0.35)));
  const surfaceUnitHealthPct = Math.min(96, Math.max(40, Math.round(98 - (spm / 10) * 10 - (rodLoadPct > 75 ? (rodLoadPct - 75) * 0.8 : 0))));
  const vfdHealthPct = Math.min(99, Math.max(50, Math.round(95 - Math.abs(vfdFrequency - 45) * 0.3)));

  return {
    estimatedRemainingDays,
    estimatedOperatingHours,
    rodFailureRiskPct: failureRiskPct,
    condition,
    estimatedInspectionDays,
    healthScore,
    drivers,
    maintenanceWindow: {
      inspectionDays: estimatedInspectionDays,
      action:
        condition === 'CRITICAL' || condition === 'HIGH'
          ? 'Initiate emergency inspection of rod string, couplings, and stuffing box alignment.'
          : 'Inspect rod string and surface load pattern during the next planned maintenance window.',
      reasons,
    },
    historicalTrend,
    equipmentHealth: {
      rodString: {
        healthPct: rodHealthPct,
        status: rodHealthPct > 75 ? 'Healthy' : rodHealthPct > 50 ? 'Warning' : 'Critical',
        trend: rodHealthPct > 75 ? '+0.4%' : '-1.2%',
        factor: dynamicLoadingLevel === 'High' ? 'Goodman stress boundary' : 'Normal fatigue cycling',
      },
      pump: {
        healthPct: pumpHealthPct,
        status: pumpHealthPct > 75 ? 'Healthy' : pumpHealthPct > 50 ? 'Warning' : 'Critical',
        trend: pumpHealthPct > 75 ? '+0.1%' : '-0.8%',
        factor: pumpFillagePct < 80 ? 'Fluid pound risk' : 'Tight plunger clearance',
      },
      surfaceUnit: {
        healthPct: surfaceUnitHealthPct,
        status: surfaceUnitHealthPct > 75 ? 'Healthy' : surfaceUnitHealthPct > 50 ? 'Warning' : 'Critical',
        trend: '+0.0%',
        factor: 'Gearbox lubrication & beam balance',
      },
      vfd: {
        healthPct: vfdHealthPct,
        status: vfdHealthPct > 75 ? 'Healthy' : vfdHealthPct > 50 ? 'Warning' : 'Critical',
        trend: '+0.2%',
        factor: 'Harmonic load & inverter thermal balance',
      },
    },
  };
}

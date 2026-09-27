import React, { createContext, useContext, useState, useMemo } from 'react';
import { 
  ActiveParameters, 
  CalculatedValues,
  WellBaseline, 
  WellId, 
  WellState 
} from '../types';
import { INITIAL_WELLS } from '../data/wellsData';
import { computeWellState } from '../services/simulationEngine';

interface WellContextValue {
  selectedWellId: WellId;
  setSelectedWellId: (id: WellId) => void;
  wellBaseline: WellBaseline;
  activeParameters: ActiveParameters;
  wellState: WellState;
  calculatedState: CalculatedValues;
  allWells: Record<string, WellBaseline>;
  updateActiveParameters: (params: Partial<ActiveParameters>) => void;
  resetToBaseline: () => void;
  saveScenario: () => void;
  isScenarioModified: boolean;
  hasSavedScenario: boolean;
  lastSavedAt: string | null;
}

const WellContext = createContext<WellContextValue | undefined>(undefined);

function getBaselineParameters(well: WellBaseline): ActiveParameters {
  return {
    steamVolume: well.css.steamVolumeM3,
    injectionPressure: well.css.injectionPressureBar,
    soakTime: well.css.soakHours,
    productionCutoff: well.css.cutoffBopd,
    strokeLength: well.srp.strokeLengthIn,
    spm: well.srp.spm,
    vfdFrequency: well.srp.vfdHz,
  };
}

export const WellProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to BW-31 as highlighted in the engineering brief
  const [selectedWellId, setSelectedWellId] = useState<WellId>('BW-31');

  // Load saved scenarios from localStorage if present
  const [allParameters, setAllParameters] = useState<Record<WellId, ActiveParameters>>(() => {
    const initial: Record<string, ActiveParameters> = {};
    for (const [id, well] of Object.entries(INITIAL_WELLS)) {
      initial[id] = getBaselineParameters(well);
    }

    try {
      const stored = localStorage.getItem('baghewala_saved_scenarios');
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...initial, ...parsed };
      }
    } catch {
      // ignore
    }
    return initial as Record<WellId, ActiveParameters>;
  });

  const [savedFlags, setSavedFlags] = useState<Record<WellId, boolean>>({
    'BW-17': false,
    'BW-21': false,
    'BW-24': false,
    'BW-31': false,
  });

  const [lastSavedTimes, setLastSavedTimes] = useState<Record<WellId, string | null>>({
    'BW-17': null,
    'BW-21': null,
    'BW-24': null,
    'BW-31': null,
  });

  // Current active well baseline data
  const wellBaseline = INITIAL_WELLS[selectedWellId] || INITIAL_WELLS['BW-31'];
  const activeParameters = allParameters[selectedWellId] || getBaselineParameters(wellBaseline);

  // Compute calculated state centrally from active parameters and baseline
  const wellState = useMemo(() => {
    return computeWellState(wellBaseline, activeParameters);
  }, [wellBaseline, activeParameters]);

  const calculatedState: CalculatedValues = useMemo(() => {
    const rodFloatLevel = wellState.rodFloatingRiskPct > 60 ? 'HIGH' : wellState.rodFloatingRiskPct > 30 ? 'MEDIUM' : 'LOW';
    const impactLoadLevel = wellState.impactLoadingRiskPct > 55 ? 'HIGH' : wellState.impactLoadingRiskPct > 30 ? 'MEDIUM' : 'LOW';
    const rodFailLevel = wellState.rodFailureRiskPct > 65 ? 'HIGH' : wellState.rodFailureRiskPct > 35 ? 'MEDIUM' : 'LOW';
    const pumpUnsetLevel = wellState.pumpUnsettingRiskPct > 50 ? 'HIGH' : wellState.pumpUnsettingRiskPct > 25 ? 'MEDIUM' : 'LOW';
    const overallRiskLevel = wellState.overallRisk === 'High' ? 'HIGH' : wellState.overallRisk === 'Moderate' ? 'MEDIUM' : 'LOW';

    return {
      reservoirTemperature: wellState.reservoirTemperatureC,
      oilViscosity: wellState.viscosityCp,
      production: wellState.productionBOPD,
      pumpEfficiency: wellState.pumpEfficiencyPct,
      rodLoad: wellState.rodLoadPct,
      rodLoadKN: wellState.rodLoadKN,
      pumpFillage: wellState.pumpFillagePct,
      sor: wellState.sor,
      energyPerBarrel: wellState.energyKWhPerBbl,
      rodFloatingRisk: rodFloatLevel,
      rodFloatingRiskPct: wellState.rodFloatingRiskPct,
      impactLoadingRisk: impactLoadLevel,
      impactLoadingRiskPct: wellState.impactLoadingRiskPct,
      rodFailureRisk: rodFailLevel,
      rodFailureRiskPct: wellState.rodFailureRiskPct,
      pumpUnsettingRisk: pumpUnsetLevel,
      pumpUnsettingRiskPct: wellState.pumpUnsettingRiskPct,
      overallRisk: overallRiskLevel,
      overallRiskScore: wellState.overallScore,
      riskFactors: wellState.riskFactors,
    };
  }, [wellState]);

  // Check if scenario is modified from baseline
  const baselineParams = useMemo(() => getBaselineParameters(wellBaseline), [wellBaseline]);
  const isScenarioModified = useMemo(() => {
    return (
      activeParameters.steamVolume !== baselineParams.steamVolume ||
      activeParameters.injectionPressure !== baselineParams.injectionPressure ||
      activeParameters.soakTime !== baselineParams.soakTime ||
      activeParameters.productionCutoff !== baselineParams.productionCutoff ||
      activeParameters.strokeLength !== baselineParams.strokeLength ||
      activeParameters.spm !== baselineParams.spm ||
      activeParameters.vfdFrequency !== baselineParams.vfdFrequency
    );
  }, [activeParameters, baselineParams]);

  const updateActiveParameters = (partial: Partial<ActiveParameters>) => {
    setAllParameters(prev => {
      const current = prev[selectedWellId] || getBaselineParameters(wellBaseline);
      const updated = { ...current, ...partial };
      return {
        ...prev,
        [selectedWellId]: updated,
      };
    });
  };

  const resetToBaseline = () => {
    const base = getBaselineParameters(wellBaseline);
    setAllParameters(prev => ({
      ...prev,
      [selectedWellId]: base,
    }));
    setSavedFlags(prev => ({ ...prev, [selectedWellId]: false }));
  };

  const saveScenario = () => {
    try {
      localStorage.setItem('baghewala_saved_scenarios', JSON.stringify(allParameters));
      setSavedFlags(prev => ({ ...prev, [selectedWellId]: true }));
      setLastSavedTimes(prev => ({ ...prev, [selectedWellId]: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }));
    } catch (e) {
      console.warn('Could not save scenario to localStorage', e);
    }
  };

  return (
    <WellContext.Provider
      value={{
        selectedWellId,
        setSelectedWellId,
        wellBaseline,
        activeParameters,
        wellState,
        calculatedState,
        allWells: INITIAL_WELLS,
        updateActiveParameters,
        resetToBaseline,
        saveScenario,
        isScenarioModified,
        hasSavedScenario: !!savedFlags[selectedWellId],
        lastSavedAt: lastSavedTimes[selectedWellId],
      }}
    >
      {children}
    </WellContext.Provider>
  );
};

export const useWell = () => {
  const context = useContext(WellContext);
  if (!context) {
    throw new Error('useWell must be used within a WellProvider');
  }
  return context;
};

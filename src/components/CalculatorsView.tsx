import React, { useMemo, useState } from 'react';
import { AlertTriangle, Bookmark, Calculator, CheckCircle2, Info } from 'lucide-react';
import {
  CalculationResult,
  UnitSystem,
  calculateBendAllowance,
  calculateCentreOfGravity,
  calculateCircumferenceAndRoll,
  calculateCylinderVolume,
  calculateLoadWeight,
  calculateMechanicalAdvantage,
  calculatePipeWeight,
  calculatePlateWeight,
  calculateReevingSystem,
  calculateRightTriangle,
  calculateSlingTension,
  calculateTankCapacity,
  calculateThermalExpansion,
  calculateWeldVolume,
  convertUnits,
} from '../utils/calculations';
import { GlossaryLink } from './GlossaryDrawer';
import { TechnicalDiagram } from './TechnicalDiagrams';

type CalcId =
  | 'sling_tension'
  | 'centre_of_gravity'
  | 'mechanical_advantage'
  | 'reeving_system'
  | 'load_weight'
  | 'plate_weight'
  | 'pipe_weight'
  | 'cylinder_volume'
  | 'tank_capacity'
  | 'circumference_roll'
  | 'bend_allowance'
  | 'thermal_expansion'
  | 'right_triangle'
  | 'weld_volume'
  | 'unit_conversions';

const CALCULATOR_MENU: { id: CalcId; label: string; group: 'Rigging' | 'Vessel & Layout' | 'Trade Math & Weld' }[] = [
  { id: 'sling_tension', label: 'Sling Tension & Angle', group: 'Rigging' },
  { id: 'centre_of_gravity', label: 'Centre of Gravity & Pick Load', group: 'Rigging' },
  { id: 'mechanical_advantage', label: 'Block & Tackle / Line Pull', group: 'Rigging' },
  { id: 'reeving_system', label: 'Reeving & Parts of Line', group: 'Rigging' },
  { id: 'load_weight', label: 'Composite Load Weight', group: 'Rigging' },
  { id: 'plate_weight', label: 'Steel Plate Weight', group: 'Vessel & Layout' },
  { id: 'pipe_weight', label: 'Pipe Weight (Empty & Full)', group: 'Vessel & Layout' },
  { id: 'cylinder_volume', label: 'Cylinder Volume & Surface', group: 'Vessel & Layout' },
  { id: 'tank_capacity', label: 'Tank Capacity (Flat / 2:1 Head)', group: 'Vessel & Layout' },
  { id: 'circumference_roll', label: 'Mean Diameter & Roll Stretch', group: 'Vessel & Layout' },
  { id: 'bend_allowance', label: 'Bend Allowance & Setback', group: 'Trade Math & Weld' },
  { id: 'thermal_expansion', label: 'Thermal Expansion (ΔL)', group: 'Trade Math & Weld' },
  { id: 'right_triangle', label: 'Right Triangle & Offsets', group: 'Trade Math & Weld' },
  { id: 'weld_volume', label: 'Weld Metal & Rod Volume', group: 'Trade Math & Weld' },
  { id: 'unit_conversions', label: 'Imperial / Metric Converter', group: 'Trade Math & Weld' },
];

interface CalculatorsViewProps {
  bookmarkedFormulas: string[];
  onToggleBookmarkFormula: (formulaId: string) => void;
  onOpenGlossary?: (entryId: string) => void;
  onOpenRiggingSim?: () => void;
}

export const CalculatorsView: React.FC<CalculatorsViewProps> = ({
  bookmarkedFormulas,
  onToggleBookmarkFormula,
  onOpenGlossary,
  onOpenRiggingSim,
}) => {
  const [activeCalc, setActiveCalc] = useState<CalcId>('sling_tension');
  const [unit, setUnit] = useState<UnitSystem>('imperial');

  // Shared flexible numeric states
  const [loadWeight, setLoadWeight] = useState<string>('12000');
  const [numLegs, setNumLegs] = useState<1 | 2 | 3 | 4>(2);
  const [effLegs, setEffLegs] = useState<number>(2);
  const [angleDeg, setAngleDeg] = useState<string>('45');

  const [cgD1, setCgD1] = useState<string>('5');
  const [cgD2, setCgD2] = useState<string>('10');

  const [partsOfLine, setPartsOfLine] = useState<string>('4');
  const [numSheaves, setNumSheaves] = useState<string>('4');
  const [frictionPct, setFrictionPct] = useState<string>('5');
  const [singleLineWll, setSingleLineWll] = useState<string>('6500');

  const [volVal, setVolVal] = useState<string>('18.5');
  const [material, setMaterial] = useState<'carbon_steel' | 'stainless_steel' | 'aluminum' | 'cast_iron' | 'water'>('carbon_steel');

  const [plateL, setPlateL] = useState<string>('96');
  const [plateW, setPlateW] = useState<string>('48');
  const [plateT, setPlateT] = useState<string>('0.5');

  const [pipeOd, setPipeOd] = useState<string>('12.75');
  const [pipeWall, setPipeWall] = useState<string>('0.375');
  const [pipeLen, setPipeLen] = useState<string>('20');

  const [cylDiam, setCylDiam] = useState<string>('8');
  const [cylHeight, setCylHeight] = useState<string>('16');
  const [headType, setHeadType] = useState<'flat' | 'ellipsoidal_2to1'>('ellipsoidal_2to1');

  const [rollDiamType, setRollDiamType] = useState<'OD' | 'ID'>('OD');
  const [rollDiam, setRollDiam] = useState<string>('48');
  const [rollThick, setRollThick] = useState<string>('0.5');

  const [bendR, setBendR] = useState<string>('0.5');
  const [bendT, setBendT] = useState<string>('0.25');
  const [bendAng, setBendAng] = useState<string>('90');
  const [kFactor, setKFactor] = useState<string>('0.4');

  const [thermLen, setThermLen] = useState<string>('100');
  const [thermDeltaT, setThermDeltaT] = useState<string>('300');
  const [thermMat, setThermMat] = useState<'carbon_steel' | 'stainless_304' | 'chrome_moly'>('carbon_steel');

  const [triRun, setTriRun] = useState<string>('24');
  const [triRise, setTriRise] = useState<string>('18');

  const [weldJoint, setWeldJoint] = useState<'fillet' | 'single_v_groove'>('fillet');
  const [weldSize, setWeldSize] = useState<string>('0.375');
  const [weldLen, setWeldLen] = useState<string>('25');
  const [weldGap, setWeldGap] = useState<string>('0.125');
  const [weldAngle, setWeldAngle] = useState<string>('60');

  const [convValue, setConvValue] = useState<string>('12.5');
  const [convType, setConvType] = useState<
    | 'in_to_mm'
    | 'mm_to_in'
    | 'ft_to_m'
    | 'm_to_ft'
    | 'lb_to_kg'
    | 'kg_to_lb'
    | 'psi_to_kpa'
    | 'kpa_to_psi'
    | 'f_to_c'
    | 'c_to_f'
    | 'usgal_to_l'
    | 'l_to_usgal'
  >('in_to_mm');

  const result: CalculationResult = useMemo(() => {
    const n = (v: string) => Number(v);
    switch (activeCalc) {
      case 'sling_tension':
        return calculateSlingTension({
          loadWeight: n(loadWeight),
          numLegs,
          effectiveLegs: numLegs >= 3 ? effLegs : numLegs,
          horizontalAngleDeg: n(angleDeg),
          unit,
        });
      case 'centre_of_gravity':
        return calculateCentreOfGravity({
          totalWeight: n(loadWeight),
          distFromLeftToCG: n(cgD1),
          distFromRightToCG: n(cgD2),
          unit,
        });
      case 'mechanical_advantage':
        return calculateMechanicalAdvantage({
          loadWeight: n(loadWeight),
          partsOfLine: n(partsOfLine),
          numSheaves: n(numSheaves),
          frictionPerSheavePct: n(frictionPct),
          unit,
        });
      case 'reeving_system':
        return calculateReevingSystem({
          totalLoad: n(loadWeight),
          singleLineWLL: n(singleLineWll),
          frictionPerSheavePct: n(frictionPct),
          unit,
        });
      case 'load_weight':
        return calculateLoadWeight({
          volumeValue: n(volVal),
          material,
          unit,
        });
      case 'plate_weight':
        return calculatePlateWeight({
          length: n(plateL),
          width: n(plateW),
          thickness: n(plateT),
          material: material === 'stainless_steel' || material === 'aluminum' ? material : 'carbon_steel',
          unit,
        });
      case 'pipe_weight':
        return calculatePipeWeight({
          od: n(pipeOd),
          wallThickness: n(pipeWall),
          length: n(pipeLen),
          unit,
        });
      case 'cylinder_volume':
        return calculateCylinderVolume({
          diameter: n(cylDiam),
          heightOrLength: n(cylHeight),
          unit,
        });
      case 'tank_capacity':
        return calculateTankCapacity({
          diameter: n(cylDiam),
          shellLengthOrHeight: n(cylHeight),
          headType,
          unit,
        });
      case 'circumference_roll':
        return calculateCircumferenceAndRoll({
          diameterType: rollDiamType,
          diameterValue: n(rollDiam),
          plateThickness: n(rollThick),
          unit,
        });
      case 'bend_allowance':
        return calculateBendAllowance({
          insideBendRadius: n(bendR),
          thickness: n(bendT),
          bendAngleDeg: n(bendAng),
          kFactor: n(kFactor),
          unit,
        });
      case 'thermal_expansion':
        return calculateThermalExpansion({
          length: n(thermLen),
          deltaTemp: n(thermDeltaT),
          material: thermMat,
          unit,
        });
      case 'right_triangle':
        return calculateRightTriangle({
          run: n(triRun),
          rise: n(triRise),
          unit,
        });
      case 'weld_volume':
        return calculateWeldVolume({
          jointType: weldJoint,
          legOrThickness: n(weldSize),
          weldLength: n(weldLen),
          rootGap: n(weldGap),
          includedAngleDeg: n(weldAngle),
          unit,
        });
      case 'unit_conversions':
        return convertUnits({
          value: n(convValue),
          conversionType: convType,
        });
    }
  }, [
    activeCalc, unit, loadWeight, numLegs, effLegs, angleDeg, cgD1, cgD2,
    partsOfLine, numSheaves, frictionPct, singleLineWll, volVal, material,
    plateL, plateW, plateT, pipeOd, pipeWall, pipeLen, cylDiam, cylHeight,
    headType, rollDiamType, rollDiam, rollThick, bendR, bendT, bendAng,
    kFactor, thermLen, thermDeltaT, thermMat, triRun, triRise, weldJoint,
    weldSize, weldLen, weldGap, weldAngle, convValue, convType,
  ]);

  const inputClass =
    'w-full bg-[#0A111A] border border-[#2A394A] rounded-md px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-400 tabular-nums';
  const labelClass = 'block text-xs font-medium text-slate-300 mb-1.5';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#2A394A]">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wide">Rigging & Trade Math Calculators</h1>
          <p className="text-sm text-slate-400 mt-1">
            Step-by-step educational solvers with unit switching, input validation, and safety checks.
            {onOpenGlossary && (
              <span className="ml-2 text-xs text-slate-300">
                Quick terms:{' '}
                <GlossaryLink termIdOrName="wll" onOpenGlossary={onOpenGlossary} />
                {' · '}
                <GlossaryLink termIdOrName="sling-angle" label="Sling Angle" onOpenGlossary={onOpenGlossary} />
                {' · '}
                <GlossaryLink termIdOrName="centre-of-gravity" label="CG" onOpenGlossary={onOpenGlossary} />
                {' · '}
                <GlossaryLink termIdOrName="mechanical-advantage" label="MA" onOpenGlossary={onOpenGlossary} />
                {' · '}
                <GlossaryLink termIdOrName="mean-diameter" label="Mean Dia" onOpenGlossary={onOpenGlossary} />
              </span>
            )}
          </p>
        </div>

        {/* Imperial / Metric Switch */}
        <div className="flex items-center gap-1 p-1 bg-[#111B27] border border-[#2A394A] rounded-lg">
          <button
            type="button"
            onClick={() => setUnit('imperial')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              unit === 'imperial' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Imperial (in / ft / lb)
          </button>
          <button
            type="button"
            onClick={() => setUnit('metric')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              unit === 'metric' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
            }`}
          >
            Metric (mm / m / kg)
          </button>
        </div>
      </div>

      {/* Calculator Selector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 bg-[#111B27] border border-[#2A394A] rounded-lg p-3 space-y-4">
          {(['Rigging', 'Vessel & Layout', 'Trade Math & Weld'] as const).map((group) => (
            <div key={group}>
              <p className="text-xs font-mono text-slate-400 px-2 pb-1.5">{group}</p>
              <div className="space-y-1">
                {CALCULATOR_MENU.filter((c) => c.group === group).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCalc(c.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between ${
                      activeCalc === c.id
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 font-medium'
                        : 'text-slate-300 hover:bg-[#182433] border border-transparent'
                    }`}
                  >
                    <span className="truncate">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Active Calculator Stage */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[#111B27] border border-[#2A394A] rounded-lg p-5 space-y-5">
            <div className="flex items-center justify-between gap-4 border-b border-[#2A394A] pb-3">
              <div className="flex items-center gap-2.5">
                <Calculator className="w-5 h-5 text-amber-400 shrink-0" />
                <h2 className="text-xl font-bold text-white">
                  {CALCULATOR_MENU.find((c) => c.id === activeCalc)?.label}
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {unit === 'imperial' ? 'IMPERIAL UNITS' : 'SI METRIC UNITS'}
              </span>
            </div>

            {/* Dynamic Inputs per Calculator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {activeCalc === 'sling_tension' && (
                <>
                  <div>
                    <label className={labelClass}>Total Load Weight ({unit === 'imperial' ? 'lb' : 'kg'})</label>
                    <input type="number" className={inputClass} value={loadWeight} onChange={(e) => setLoadWeight(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Horizontal Sling Angle θ (degrees, 1°–90°)</label>
                    <input type="number" className={inputClass} value={angleDeg} onChange={(e) => setAngleDeg(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Total Sling Legs</label>
                    <select
                      className={inputClass}
                      value={numLegs}
                      onChange={(e) => {
                        const val = Number(e.target.value) as 1 | 2 | 3 | 4;
                        setNumLegs(val);
                        setEffLegs(val >= 3 ? 2 : val);
                      }}
                    >
                      <option value={1}>1-Leg Vertical</option>
                      <option value={2}>2-Leg Bridle</option>
                      <option value={3}>3-Leg Bridle</option>
                      <option value={4}>4-Leg Bridle</option>
                    </select>
                  </div>
                  {numLegs >= 3 && (
                    <div>
                      <label className={labelClass}>Effective Load-Bearing Legs</label>
                      <select className={inputClass} value={effLegs} onChange={(e) => setEffLegs(Number(e.target.value))}>
                        <option value={2}>2 Effective Legs (Standard Rigid Load)</option>
                        <option value={3}>3 Effective Legs (Equalizer / Non-Rigid)</option>
                        {numLegs === 4 && <option value={4}>4 Effective Legs (Engineered Equalized Only)</option>}
                      </select>
                    </div>
                  )}
                </>
              )}

              {activeCalc === 'centre_of_gravity' && (
                <>
                  <div>
                    <label className={labelClass}>Total Load Weight ({unit === 'imperial' ? 'lb' : 'kg'})</label>
                    <input type="number" className={inputClass} value={loadWeight} onChange={(e) => setLoadWeight(e.target.value)} />
                  </div>
                  <div className="hidden sm:block" />
                  <div>
                    <label className={labelClass}>Distance Left Pick to CG, d₁ ({unit === 'imperial' ? 'ft' : 'm'})</label>
                    <input type="number" className={inputClass} value={cgD1} onChange={(e) => setCgD1(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Distance Right Pick to CG, d₂ ({unit === 'imperial' ? 'ft' : 'm'})</label>
                    <input type="number" className={inputClass} value={cgD2} onChange={(e) => setCgD2(e.target.value)} />
                  </div>
                </>
              )}

              {activeCalc === 'mechanical_advantage' && (
                <>
                  <div>
                    <label className={labelClass}>Total Load Weight ({unit === 'imperial' ? 'lb' : 'kg'})</label>
                    <input type="number" className={inputClass} value={loadWeight} onChange={(e) => setLoadWeight(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Parts of Line Supporting Load</label>
                    <input type="number" className={inputClass} value={partsOfLine} onChange={(e) => setPartsOfLine(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Active Sheaves (incl. Lead Sheave)</label>
                    <input type="number" className={inputClass} value={numSheaves} onChange={(e) => setNumSheaves(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Friction per Sheave (%)</label>
                    <input type="number" className={inputClass} value={frictionPct} onChange={(e) => setFrictionPct(e.target.value)} />
                  </div>
                </>
              )}

              {activeCalc === 'reeving_system' && (
                <>
                  <div>
                    <label className={labelClass}>Total Load to Hoist ({unit === 'imperial' ? 'lb' : 'kg'})</label>
                    <input type="number" className={inputClass} value={loadWeight} onChange={(e) => setLoadWeight(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Single-Line Rope/Winch WLL ({unit === 'imperial' ? 'lb' : 'kg'})</label>
                    <input type="number" className={inputClass} value={singleLineWll} onChange={(e) => setSingleLineWll(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Sheave Friction Allowance (% per sheave)</label>
                    <input type="number" className={inputClass} value={frictionPct} onChange={(e) => setFrictionPct(e.target.value)} />
                  </div>
                </>
              )}

              {activeCalc === 'load_weight' && (
                <>
                  <div>
                    <label className={labelClass}>Solid Volume ({unit === 'imperial' ? 'ft³' : 'm³'})</label>
                    <input type="number" className={inputClass} value={volVal} onChange={(e) => setVolVal(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Material</label>
                    <select className={inputClass} value={material} onChange={(e) => setMaterial(e.target.value as typeof material)}>
                      <option value="carbon_steel">Carbon Steel (490 lb/ft³ · 7,850 kg/m³)</option>
                      <option value="stainless_steel">304/316 Stainless (501 lb/ft³ · 8,030 kg/m³)</option>
                      <option value="aluminum">Aluminum (169 lb/ft³ · 2,700 kg/m³)</option>
                      <option value="cast_iron">Cast Iron (450 lb/ft³ · 7,200 kg/m³)</option>
                      <option value="water">Water (62.4 lb/ft³ · 1,000 kg/m³)</option>
                    </select>
                  </div>
                </>
              )}

              {activeCalc === 'plate_weight' && (
                <>
                  <div>
                    <label className={labelClass}>Plate Length ({unit === 'imperial' ? 'in' : 'mm'})</label>
                    <input type="number" className={inputClass} value={plateL} onChange={(e) => setPlateL(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Plate Width ({unit === 'imperial' ? 'in' : 'mm'})</label>
                    <input type="number" className={inputClass} value={plateW} onChange={(e) => setPlateW(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Thickness ({unit === 'imperial' ? 'in' : 'mm'})</label>
                    <input type="number" step="0.0625" className={inputClass} value={plateT} onChange={(e) => setPlateT(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Alloy</label>
                    <select className={inputClass} value={material} onChange={(e) => setMaterial(e.target.value as typeof material)}>
                      <option value="carbon_steel">Carbon Steel (SA-516 / A36)</option>
                      <option value="stainless_steel">Stainless Steel (304 / 316)</option>
                      <option value="aluminum">Aluminum Alloy</option>
                    </select>
                  </div>
                </>
              )}

              {activeCalc === 'pipe_weight' && (
                <>
                  <div>
                    <label className={labelClass}>Outside Diameter OD ({unit === 'imperial' ? 'in' : 'mm'})</label>
                    <input type="number" step="0.125" className={inputClass} value={pipeOd} onChange={(e) => setPipeOd(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Wall Thickness ({unit === 'imperial' ? 'in' : 'mm'})</label>
                    <input type="number" step="0.01" className={inputClass} value={pipeWall} onChange={(e) => setPipeWall(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Total Pipe Length ({unit === 'imperial' ? 'ft' : 'm'})</label>
                    <input type="number" className={inputClass} value={pipeLen} onChange={(e) => setPipeLen(e.target.value)} />
                  </div>
                </>
              )}

              {(activeCalc === 'cylinder_volume' || activeCalc === 'tank_capacity') && (
                <>
                  <div>
                    <label className={labelClass}>Inside Diameter ({unit === 'imperial' ? 'ft' : 'm'})</label>
                    <input type="number" className={inputClass} value={cylDiam} onChange={(e) => setCylDiam(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Straight Shell Height / Length ({unit === 'imperial' ? 'ft' : 'm'})</label>
                    <input type="number" className={inputClass} value={cylHeight} onChange={(e) => setCylHeight(e.target.value)} />
                  </div>
                  {activeCalc === 'tank_capacity' && (
                    <div>
                      <label className={labelClass}>Head Configuration</label>
                      <select className={inputClass} value={headType} onChange={(e) => setHeadType(e.target.value as typeof headType)}>
                        <option value="ellipsoidal_2to1">Two 2:1 Ellipsoidal Heads</option>
                        <option value="flat">Flat Ends / Vertical Open Top</option>
                      </select>
                    </div>
                  )}
                </>
              )}

              {activeCalc === 'circumference_roll' && (
                <>
                  <div>
                    <label className={labelClass}>Specified Diameter Type</label>
                    <select className={inputClass} value={rollDiamType} onChange={(e) => setRollDiamType(e.target.value as 'OD' | 'ID')}>
                      <option value="OD">Outside Diameter (OD)</option>
                      <option value="ID">Inside Diameter (ID)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Target Diameter ({unit === 'imperial' ? 'in' : 'mm'})</label>
                    <input type="number" className={inputClass} value={rollDiam} onChange={(e) => setRollDiam(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Plate Thickness ({unit === 'imperial' ? 'in' : 'mm'})</label>
                    <input type="number" step="0.0625" className={inputClass} value={rollThick} onChange={(e) => setRollThick(e.target.value)} />
                  </div>
                </>
              )}

              {activeCalc === 'bend_allowance' && (
                <>
                  <div>
                    <label className={labelClass}>Inside Bend Radius ({unit === 'imperial' ? 'in' : 'mm'})</label>
                    <input type="number" step="0.0625" className={inputClass} value={bendR} onChange={(e) => setBendR(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Plate Thickness ({unit === 'imperial' ? 'in' : 'mm'})</label>
                    <input type="number" step="0.0625" className={inputClass} value={bendT} onChange={(e) => setBendT(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Bend Angle (degrees)</label>
                    <input type="number" className={inputClass} value={bendAng} onChange={(e) => setBendAng(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>K-Factor (0.33–0.50)</label>
                    <input type="number" step="0.01" className={inputClass} value={kFactor} onChange={(e) => setKFactor(e.target.value)} />
                  </div>
                </>
              )}

              {activeCalc === 'thermal_expansion' && (
                <>
                  <div>
                    <label className={labelClass}>Original Pipe / Beam Length ({unit === 'imperial' ? 'ft' : 'm'})</label>
                    <input type="number" className={inputClass} value={thermLen} onChange={(e) => setThermLen(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Temperature Change ΔT ({unit === 'imperial' ? '°F' : '°C'})</label>
                    <input type="number" className={inputClass} value={thermDeltaT} onChange={(e) => setThermDeltaT(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Steel Grade</label>
                    <select className={inputClass} value={thermMat} onChange={(e) => setThermMat(e.target.value as typeof thermMat)}>
                      <option value="carbon_steel">Carbon Steel</option>
                      <option value="stainless_304">304 Stainless Steel</option>
                      <option value="chrome_moly">Chrome-Moly (P11 / P22)</option>
                    </select>
                  </div>
                </>
              )}

              {activeCalc === 'right_triangle' && (
                <>
                  <div>
                    <label className={labelClass}>Run (Horizontal Leg, {unit === 'imperial' ? 'in' : 'mm'})</label>
                    <input type="number" className={inputClass} value={triRun} onChange={(e) => setTriRun(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Rise / Offset (Vertical Leg, {unit === 'imperial' ? 'in' : 'mm'})</label>
                    <input type="number" className={inputClass} value={triRise} onChange={(e) => setTriRise(e.target.value)} />
                  </div>
                </>
              )}

              {activeCalc === 'weld_volume' && (
                <>
                  <div>
                    <label className={labelClass}>Joint Type</label>
                    <select className={inputClass} value={weldJoint} onChange={(e) => setWeldJoint(e.target.value as typeof weldJoint)}>
                      <option value="fillet">Fillet Weld (Equal Leg)</option>
                      <option value="single_v_groove">Single-V Groove Butt</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      {weldJoint === 'fillet' ? 'Fillet Leg Size' : 'Plate Thickness'} ({unit === 'imperial' ? 'in' : 'mm'})
                    </label>
                    <input type="number" step="0.0625" className={inputClass} value={weldSize} onChange={(e) => setWeldSize(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Total Weld Length ({unit === 'imperial' ? 'ft' : 'm'})</label>
                    <input type="number" className={inputClass} value={weldLen} onChange={(e) => setWeldLen(e.target.value)} />
                  </div>
                  {weldJoint === 'single_v_groove' && (
                    <>
                      <div>
                        <label className={labelClass}>Root Gap ({unit === 'imperial' ? 'in' : 'mm'})</label>
                        <input type="number" step="0.0625" className={inputClass} value={weldGap} onChange={(e) => setWeldGap(e.target.value)} />
                      </div>
                      <div>
                        <label className={labelClass}>Included Groove Angle (deg)</label>
                        <input type="number" className={inputClass} value={weldAngle} onChange={(e) => setWeldAngle(e.target.value)} />
                      </div>
                    </>
                  )}
                </>
              )}

              {activeCalc === 'unit_conversions' && (
                <>
                  <div>
                    <label className={labelClass}>Input Value</label>
                    <input type="number" className={inputClass} value={convValue} onChange={(e) => setConvValue(e.target.value)} />
                  </div>
                  <div>
                    <label className={labelClass}>Conversion Direction</label>
                    <select className={inputClass} value={convType} onChange={(e) => setConvType(e.target.value as typeof convType)}>
                      <option value="in_to_mm">Inches → Millimetres</option>
                      <option value="mm_to_in">Millimetres → Inches</option>
                      <option value="ft_to_m">Feet → Metres</option>
                      <option value="m_to_ft">Metres → Feet</option>
                      <option value="lb_to_kg">Pounds → Kilograms</option>
                      <option value="kg_to_lb">Kilograms → Pounds</option>
                      <option value="psi_to_kpa">PSI → Kilopascals (kPa)</option>
                      <option value="kpa_to_psi">Kilopascals (kPa) → PSI</option>
                      <option value="f_to_c">Fahrenheit (°F) → Celsius (°C)</option>
                      <option value="c_to_f">Celsius (°C) → Fahrenheit (°F)</option>
                      <option value="usgal_to_l">US Gallons → Litres</option>
                      <option value="l_to_usgal">Litres → US Gallons</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Validation / Error / Warnings */}
            {!result.valid && result.error && (
              <div className="p-3.5 rounded-md bg-red-950/50 border border-red-700/60 text-red-200 text-sm flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <span>{result.error}</span>
              </div>
            )}

            {result.warnings.map((w, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-md bg-amber-950/40 border border-amber-600/60 text-amber-200 text-sm flex items-start gap-2.5"
              >
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span>{w}</span>
              </div>
            ))}

            {/* Validated Output Readout */}
            {result.valid && (
              <div className="space-y-4 pt-2">
                <div className="bg-[#0A111A] border border-[#2A394A] rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-mono text-slate-400">{result.primaryLabel}</p>
                    <p className="text-3xl font-bold font-mono text-amber-400 tabular-nums mt-1">
                      {result.primaryValue}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {onOpenRiggingSim && (
                      <button
                        type="button"
                        onClick={onOpenRiggingSim}
                        className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs whitespace-nowrap"
                      >
                        Test in 3D Rigging Lab →
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleBookmarkFormula(`calc-${activeCalc}`)}
                      className={`px-3 py-1.5 rounded border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                        bookmarkedFormulas.includes(`calc-${activeCalc}`)
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'border-[#2A394A] text-slate-300 hover:bg-[#182433]'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      {bookmarkedFormulas.includes(`calc-${activeCalc}`) ? 'Bookmarked' : 'Bookmark Formula'}
                    </button>
                  </div>
                </div>

                {/* Secondary Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.secondaryMetrics.map((m) => (
                    <div key={m.label} className="bg-[#0D1622] border border-[#2A394A] rounded-md p-3">
                      <p className="text-xs text-slate-400">{m.label}</p>
                      <p className="text-sm font-mono font-semibold text-slate-100 tabular-nums mt-1">{m.value}</p>
                    </div>
                  ))}
                </div>

                {/* Formula, Steps, Assumptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="bg-[#0D1622] border border-[#2A394A] rounded-md p-4 space-y-2.5">
                    <p className="text-xs font-mono text-amber-400">GOVERNING FORMULA</p>
                    <p className="text-sm font-mono text-white bg-[#0A111A] px-3 py-2 rounded border border-[#1E293B]">
                      {result.formula}
                    </p>
                    <p className="text-xs font-mono text-slate-400 pt-1">STEP-BY-STEP WORK</p>
                    <ul className="space-y-1.5 text-xs font-mono text-slate-300">
                      {result.steps.map((s, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-[#0D1622] border border-[#2A394A] rounded-md p-4 space-y-2.5">
                    <p className="text-xs font-mono text-sky-400">ASSUMPTIONS & UNITS</p>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {result.assumptions.map((a, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t border-[#1E293B] flex items-start gap-2 text-xs text-slate-400">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{result.safetyNotice}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contextual Interactive Diagram for Rigging Calculators */}
          {(activeCalc === 'sling_tension' || activeCalc === 'reeving_system' || activeCalc === 'mechanical_advantage') && (
            <TechnicalDiagram
              diagramId={activeCalc === 'sling_tension' ? 'sling-angles' : 'block-and-tackle'}
              caption="Interactive visual companion — adjust angles or parts of line above the canvas to verify load forces."
            />
          )}
        </div>
      </div>
    </div>
  );
};

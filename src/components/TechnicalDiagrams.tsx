import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Info } from 'lucide-react';
import { DiagramId } from '../types/academy';

interface TechnicalDiagramProps {
  diagramId: DiagramId;
  title?: string;
  caption?: string;
}

export const DIAGRAM_LABELS: Record<DiagramId, string> = {
  'welding-positions': '1G, 2G, 3G & 4G Groove & Fillet Positions',
  'welding-processes': 'SMAW, FCAW, GMAW & GTAW Process Circuits',
  'welding-joints': 'Five Basic Weld Joint Types & Groove Anatomy',
  'welding-symbols': 'Interactive AWS A2.4 / CSA W59 Welding Symbols',
  'sling-angles': 'Sling Angle Geometry & Tension Vectors',
  'lifting-arrangements': 'Two-Leg, Four-Leg, Choker & Basket Hitches',
  'block-and-tackle': 'Block-and-Tackle & Reeving Parts of Line',
  'crane-components': 'Crane Components & Load Radius Geometry',
  'pressure-vessel': 'ASME Pressure Vessel & Saddle Components',
  'boiler-types': 'Fire-Tube vs. Water-Tube Boiler Cross-Section',
  'heat-exchanger': 'Shell-and-Tube Heat Exchanger Internals',
  'tank-construction': 'Aboveground Storage Tank Erection Anatomy',
  'orthographic-projection': 'Third-Angle Orthographic Projection Views',
  'isometric-drawing': 'Isometric Piping & 3D Rolling Offset Axes',
  'plate-layout': 'Parallel-Line & Radial-Line Plate Layout',
};

export const TechnicalDiagram: React.FC<TechnicalDiagramProps> = ({ diagramId, title, caption }) => {
  const [zoom, setZoom] = useState<number>(1);
  const [activeSubMode, setActiveSubMode] = useState<string>('default');
  const [selectedCallout, setSelectedCallout] = useState<string | null>(null);

  // Specific interactive states
  const [slingAngle, setSlingAngle] = useState<number>(45);
  const [reevingParts, setReevingParts] = useState<number>(4);
  const [symbolSide, setSymbolSide] = useState<'arrow' | 'other' | 'both'>('arrow');
  const [symbolType, setSymbolType] = useState<'fillet' | 'vgroove' | 'bevel'>('fillet');
  const [symbolAllAround, setSymbolAllAround] = useState<boolean>(true);
  const [symbolField, setSymbolField] = useState<boolean>(false);

  const handleZoomIn = () => setZoom((z) => Math.min(1.6, Number((z + 0.2).toFixed(1))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.8, Number((z - 0.2).toFixed(1))));
  const handleReset = () => {
    setZoom(1);
    setSelectedCallout(null);
  };

  const renderSvgContent = () => {
    switch (diagramId) {
      case 'sling-angles': {
        const rad = (slingAngle * Math.PI) / 180;
        const halfSpread = 120;
        const height = Math.max(35, Math.min(180, halfSpread * Math.tan(rad)));
        const hookY = 230 - height;
        const laf = (1 / Math.sin(rad)).toFixed(2);
        const tensionPct = Math.round((50 / Math.sin(rad)) * 10) / 10;
        const danger = slingAngle < 30;
        const warn = slingAngle >= 30 && slingAngle < 45;
        const strokeCol = danger ? '#EF4444' : warn ? '#F59E0B' : '#38BDF8';

        return (
          <g>
            {/* Grid */}
            <text x="20" y="26" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
              SYMMETRICAL 2-LEG BRIDLE · ANGLE θ = {slingAngle}° · LAF = {laf}×
            </text>
            {/* Hook */}
            <circle cx="250" cy={hookY - 12} r="10" fill="none" stroke="#FACC15" strokeWidth="3" />
            <path d={`M 250 ${hookY - 22} L 250 18`} stroke="#94A3B8" strokeWidth="2.5" strokeDasharray="4 3" />
            {/* Slings */}
            <line x1="250" y1={hookY} x2="130" y2="230" stroke={strokeCol} strokeWidth="4" />
            <line x1="250" y1={hookY} x2="370" y2="230" stroke={strokeCol} strokeWidth="4" />
            {/* Vertical Height Reference */}
            <line x1="250" y1={hookY} x2="250" y2="230" stroke="#64748B" strokeWidth="1.5" strokeDasharray="5 4" />
            <text x="256" y={(hookY + 230) / 2} fill="#CBD5E1" fontSize="11" fontFamily="JetBrains Mono">
              H (Vertical)
            </text>
            {/* Load Beam */}
            <rect x="95" y="230" width="310" height="44" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="2" />
            <circle cx="130" cy="230" r="5" fill="#FACC15" />
            <circle cx="370" cy="230" r="5" fill="#FACC15" />
            <text x="250" y="257" textAnchor="middle" fill="#F8FAFC" fontSize="13" fontWeight="600">
              TOTAL LOAD = 100% (50% Vertical Share / Leg)
            </text>
            {/* Angle Arc */}
            <path d="M 162 230 A 32 32 0 0 0 153 207" fill="none" stroke="#FACC15" strokeWidth="2" />
            <text x="168" y="218" fill="#FACC15" fontSize="12" fontFamily="JetBrains Mono">
              {slingAngle}°
            </text>
            {/* Tension Readout Box */}
            <rect x="385" y="42" width="195" height="92" rx="4" fill="#0F172A" stroke={strokeCol} strokeWidth="1.5" />
            <text x="397" y="64" fill="#94A3B8" fontSize="11" fontFamily="JetBrains Mono">
              TENSION PER LEG
            </text>
            <text x="397" y="90" fill={strokeCol} fontSize="20" fontWeight="700" fontFamily="JetBrains Mono">
              {tensionPct}% of Load
            </text>
            <text x="397" y="114" fill="#CBD5E1" fontSize="11" fontFamily="JetBrains Mono">
              {danger ? 'HAZARD: Below 30° min' : warn ? 'CAUTION: Below 45°' : 'PREFERRED RANGE'}
            </text>
          </g>
        );
      }

      case 'lifting-arrangements': {
        const mode = activeSubMode === 'default' ? '4leg' : activeSubMode;
        return (
          <g>
            <text x="20" y="26" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
              {mode === '4leg'
                ? 'RIGID 4-LEG BRIDLE (DESIGN FOR 2 EFFECTIVE LEGS)'
                : mode === 'choker'
                ? 'SINGLE CHOKER HITCH (~75% VERTICAL WLL @ ≥120° CHOKE)'
                : 'TRUE BASKET HITCH (200% VERTICAL WLL WHEN LEGS VERTICAL & D/d OK)'}
            </text>
            <circle cx="300" cy="48" r="10" fill="none" stroke="#FACC15" strokeWidth="3" />
            {mode === '4leg' && (
              <>
                <line x1="300" y1="58" x2="140" y2="195" stroke="#38BDF8" strokeWidth="3.5" />
                <line x1="300" y1="58" x2="460" y2="195" stroke="#38BDF8" strokeWidth="3.5" />
                <line x1="300" y1="58" x2="190" y2="175" stroke="#64748B" strokeWidth="2.5" strokeDasharray="5 3" />
                <line x1="300" y1="58" x2="410" y2="175" stroke="#64748B" strokeWidth="2.5" strokeDasharray="5 3" />
                <polygon points="120,195 480,195 430,172 170,172" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                <rect x="120" y="195" width="360" height="45" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                <text x="300" y="222" textAnchor="middle" fill="#F8FAFC" fontSize="12">
                  Rigid Steel Skid — Solid Blue Legs Carry Load if Opposite Diagonal Slacks
                </text>
              </>
            )}
            {mode === 'choker' && (
              <>
                <line x1="300" y1="58" x2="300" y2="148" stroke="#38BDF8" strokeWidth="4" />
                <circle cx="300" cy="155" r="8" fill="none" stroke="#FACC15" strokeWidth="2.5" />
                <circle cx="300" cy="205" r="46" fill="#1E293B" stroke="#475569" strokeWidth="2.5" />
                <circle cx="300" cy="205" r="36" fill="none" stroke="#38BDF8" strokeWidth="3.5" />
                <text x="300" y="210" textAnchor="middle" fill="#F8FAFC" fontSize="12" fontFamily="JetBrains Mono">
                  PIPE OD
                </text>
                <text x="365" y="155" fill="#F59E0B" fontSize="11" fontFamily="JetBrains Mono">
                  Choke Angle ≥ 120°
                </text>
              </>
            )}
            {mode === 'basket' && (
              <>
                <line x1="255" y1="62" x2="255" y2="205" stroke="#22C55E" strokeWidth="4" />
                <line x1="345" y1="62" x2="345" y2="205" stroke="#22C55E" strokeWidth="4" />
                <path d="M 290 54 L 255 62 M 310 54 L 345 62" stroke="#22C55E" strokeWidth="4" />
                <path d="M 255 205 A 45 45 0 0 0 345 205" fill="none" stroke="#22C55E" strokeWidth="4" />
                <circle cx="300" cy="205" r="42" fill="#1E293B" stroke="#475569" strokeWidth="2" />
                <text x="300" y="209" textAnchor="middle" fill="#F8FAFC" fontSize="12" fontFamily="JetBrains Mono">
                  D/d Check
                </text>
              </>
            )}
          </g>
        );
      }

      case 'block-and-tackle': {
        const parts = reevingParts;
        const xStart = 210;
        const spacing = 28;
        return (
          <g>
            <text x="20" y="26" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
              REEVING DIAGRAM · {parts} PARTS OF LINE · BECKET ON {parts % 2 === 0 ? 'UPPER BLOCK' : 'LOWER BLOCK'}
            </text>
            {/* Upper Fixed Block */}
            <rect x="180" y="45" width={parts * spacing + 40} height="42" rx="6" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
            <text x="190" y="70" fill="#CBD5E1" fontSize="11" fontFamily="JetBrains Mono">
              UPPER BLOCK
            </text>
            {/* Lower Traveling Block */}
            <rect x="180" y="195" width={parts * spacing + 40} height="42" rx="6" fill="#1E293B" stroke="#FACC15" strokeWidth="2" />
            <text x="190" y="220" fill="#FACC15" fontSize="11" fontFamily="JetBrains Mono">
              LOWER BLOCK
            </text>
            {/* Supporting Parts of Line */}
            {Array.from({ length: parts }).map((_, idx) => {
              const x = xStart + idx * spacing;
              return (
                <g key={idx}>
                  <line x1={x} y1="87" x2={x} y2="195" stroke="#38BDF8" strokeWidth="3" />
                  <circle cx={x} cy="78" r="6" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
                  <circle cx={x} cy="204" r="6" fill="#0F172A" stroke="#FACC15" strokeWidth="1.5" />
                </g>
              );
            })}
            {/* Lead Line to Winch */}
            <line x1={xStart + (parts - 1) * spacing + 14} y1="68" x2="520" y2="135" stroke="#F59E0B" strokeWidth="3.5" />
            <rect x="515" y="120" width="60" height="44" rx="4" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
            <text x="545" y="147" textAnchor="middle" fill="#FACC15" fontSize="11" fontFamily="JetBrains Mono">
              WINCH
            </text>
            {/* Hook & Load */}
            <line x1="255" y1="237" x2="255" y2="258" stroke="#FACC15" strokeWidth="3" />
            <rect x="200" y="258" width="110" height="28" rx="3" fill="#0F172A" stroke="#475569" strokeWidth="1.5" />
            <text x="255" y="276" textAnchor="middle" fill="#F8FAFC" fontSize="11" fontFamily="JetBrains Mono">
              LOAD (W)
            </text>
          </g>
        );
      }

      case 'crane-components':
        return (
          <g>
            <text x="20" y="26" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
              MOBILE CRANE GEOMETRY · TIPPING AXIS vs. LOAD RADIUS
            </text>
            {/* Ground */}
            <line x1="20" y1="260" x2="580" y2="260" stroke="#475569" strokeWidth="2" />
            {/* Outriggers */}
            <rect x="90" y="246" width="38" height="14" fill="#FACC15" />
            <rect x="225" y="246" width="38" height="14" fill="#FACC15" />
            {/* Carrier & Turntable */}
            <rect x="105" y="220" width="145" height="26" rx="3" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
            <rect x="135" y="190" width="80" height="30" rx="3" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
            <rect x="92" y="192" width="43" height="24" fill="#475569" />
            <text x="113" y="208" textAnchor="middle" fill="#F8FAFC" fontSize="9">
              CTWT
            </text>
            {/* Centre of Rotation Line */}
            <line x1="175" y1="160" x2="175" y2="280" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="4 4" />
            {/* Boom */}
            <line x1="185" y1="196" x2="465" y2="48" stroke="#FACC15" strokeWidth="10" strokeLinecap="round" />
            <text x="315" y="108" fill="#FACC15" fontSize="12" fontFamily="JetBrains Mono" transform="rotate(-28 315 108)">
              BOOM LENGTH
            </text>
            {/* Load Line & Hook */}
            <line x1="465" y1="50" x2="465" y2="188" stroke="#38BDF8" strokeWidth="2.5" />
            <rect x="442" y="188" width="46" height="34" rx="3" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" />
            <text x="465" y="209" textAnchor="middle" fill="#F8FAFC" fontSize="11">
              LOAD
            </text>
            {/* Radius Dimension */}
            <line x1="175" y1="274" x2="465" y2="274" stroke="#38BDF8" strokeWidth="2" />
            <line x1="465" y1="224" x2="465" y2="280" stroke="#38BDF8" strokeWidth="1" strokeDasharray="3 3" />
            <text x="320" y="290" textAnchor="middle" fill="#38BDF8" fontSize="12" fontFamily="JetBrains Mono">
              LOAD RADIUS (Centre of Rotation to Hook)
            </text>
          </g>
        );

      case 'welding-positions': {
        const isFillet = activeSubMode === 'fillet';
        const items = isFillet
          ? [
              { code: '1F', label: 'Flat Fillet (45° Cradle)', desc: 'Weld axis horizontal, throat vertical' },
              { code: '2F', label: 'Horizontal Fillet', desc: 'Vertical plate + horizontal plate lap/T' },
              { code: '3F', label: 'Vertical Fillet', desc: 'Plates vertical, travel up or down' },
              { code: '4F', label: 'Overhead Fillet', desc: 'Welding underside of horizontal plate' },
            ]
          : [
              { code: '1G', label: 'Flat Groove', desc: 'Plate flat, welding from top side' },
              { code: '2G', label: 'Horizontal Groove', desc: 'Plate vertical, weld axis horizontal' },
              { code: '3G', label: 'Vertical Groove', desc: 'Plate vertical, weld axis vertical' },
              { code: '4G', label: 'Overhead Groove', desc: 'Plate overhead, welding from underside' },
            ];
        return (
          <g>
            <text x="20" y="26" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
              ASME / CSA PLATE WELDING POSITIONS ({isFillet ? 'FILLET 1F–4F' : 'GROOVE 1G–4G'})
            </text>
            {items.map((item, idx) => {
              const x = 32 + idx * 140;
              return (
                <g
                  key={item.code}
                  className="cursor-pointer"
                  onClick={() => setSelectedCallout(`${item.code} — ${item.label}: ${item.desc}`)}
                >
                  <rect x={x} y="55" width="122" height="190" rx="6" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
                  <text x={x + 61} y="82" textAnchor="middle" fill="#FACC15" fontSize="22" fontWeight="700" fontFamily="JetBrains Mono">
                    {item.code}
                  </text>
                  {/* Visual Plate Icon per Position */}
                  {idx === 0 && (
                    <g transform={`translate(${x + 25}, 125)`}>
                      <rect x="0" y="18" width="72" height="14" fill="#475569" />
                      <polygon points="30,18 42,18 36,10" fill="#F59E0B" />
                    </g>
                  )}
                  {idx === 1 && (
                    <g transform={`translate(${x + 28}, 105)`}>
                      <rect x="26" y="0" width="14" height="64" fill="#475569" />
                      <line x1="16" y1="32" x2="50" y2="32" stroke="#F59E0B" strokeWidth="5" />
                    </g>
                  )}
                  {idx === 2 && (
                    <g transform={`translate(${x + 28}, 105)`}>
                      <rect x="12" y="0" width="18" height="64" fill="#475569" />
                      <rect x="36" y="0" width="18" height="64" fill="#475569" />
                      <line x1="33" y1="8" x2="33" y2="56" stroke="#F59E0B" strokeWidth="5" />
                    </g>
                  )}
                  {idx === 3 && (
                    <g transform={`translate(${x + 25}, 105)`}>
                      <rect x="0" y="10" width="72" height="14" fill="#475569" />
                      <polygon points="30,24 42,24 36,33" fill="#F59E0B" />
                    </g>
                  )}
                  <text x={x + 61} y="205" textAnchor="middle" fill="#F8FAFC" fontSize="11" fontWeight="600">
                    {item.label}
                  </text>
                  <text x={x + 61} y="226" textAnchor="middle" fill="#94A3B8" fontSize="9.5">
                    Click for detail
                  </text>
                </g>
              );
            })}
          </g>
        );
      }

      case 'welding-symbols': {
        return (
          <g>
            <text x="20" y="26" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
              AWS A2.4 / CSA W59 WELDING SYMBOL ANATOMY
            </text>
            {/* Reference Line */}
            <line x1="160" y1="150" x2="430" y2="150" stroke="#F8FAFC" strokeWidth="3" />
            {/* Arrow Line */}
            <line x1="160" y1="150" x2="75" y2="215" stroke="#F8FAFC" strokeWidth="3" />
            <polygon points="75,215 92,211 84,199" fill="#F8FAFC" />
            {/* Tail */}
            <polyline points="465,125 430,150 465,175" fill="none" stroke="#F8FAFC" strokeWidth="2.5" />
            <text x="472" y="155" fill="#38BDF8" fontSize="13" fontFamily="JetBrains Mono">
              SMAW · E7018
            </text>
            {/* All-around circle */}
            {symbolAllAround && <circle cx="160" cy="150" r="10" fill="none" stroke="#FACC15" strokeWidth="2.5" />}
            {/* Field weld flag */}
            {symbolField && (
              <g>
                <line x1="160" y1="150" x2="160" y2="112" stroke="#FACC15" strokeWidth="2.5" />
                <polygon points="160,112 184,120 160,128" fill="#FACC15" />
              </g>
            )}
            {/* Arrow Side Symbol (BELOW line) */}
            {(symbolSide === 'arrow' || symbolSide === 'both') && (
              <g>
                {symbolType === 'fillet' && (
                  <polygon points="260,150 260,185 295,150" fill="none" stroke="#FACC15" strokeWidth="3" />
                )}
                {symbolType === 'vgroove' && (
                  <polyline points="258,185 278,150 298,185" fill="none" stroke="#FACC15" strokeWidth="3" />
                )}
                {symbolType === 'bevel' && (
                  <polyline points="265,150 265,185 295,150" fill="none" stroke="#FACC15" strokeWidth="3" />
                )}
                <text x="232" y="176" fill="#FACC15" fontSize="14" fontFamily="JetBrains Mono">
                  3/8
                </text>
                <text x="308" y="176" fill="#CBD5E1" fontSize="13" fontFamily="JetBrains Mono">
                  {symbolType === 'fillet' ? '3-8' : '60°'}
                </text>
              </g>
            )}
            {/* Other Side Symbol (ABOVE line) */}
            {(symbolSide === 'other' || symbolSide === 'both') && (
              <g>
                {symbolType === 'fillet' && (
                  <polygon points="260,150 260,115 295,150" fill="none" stroke="#38BDF8" strokeWidth="3" />
                )}
                {symbolType === 'vgroove' && (
                  <polyline points="258,115 278,150 298,115" fill="none" stroke="#38BDF8" strokeWidth="3" />
                )}
                {symbolType === 'bevel' && (
                  <polyline points="265,150 265,115 295,150" fill="none" stroke="#38BDF8" strokeWidth="3" />
                )}
                <text x="232" y="132" fill="#38BDF8" fontSize="14" fontFamily="JetBrains Mono">
                  1/4
                </text>
              </g>
            )}
            {/* Labels */}
            <text x="285" y="220" textAnchor="middle" fill="#FACC15" fontSize="11" fontFamily="JetBrains Mono">
              BELOW LINE = ARROW SIDE
            </text>
            <text x="285" y="88" textAnchor="middle" fill="#38BDF8" fontSize="11" fontFamily="JetBrains Mono">
              ABOVE LINE = OTHER SIDE
            </text>
          </g>
        );
      }

      case 'welding-processes':
      case 'welding-joints':
        return (
          <g>
            <text x="20" y="26" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
              {diagramId === 'welding-processes'
                ? 'ARC WELDING PROCESSES · CC (SMAW/GTAW) vs. CV (GMAW/FCAW)'
                : 'FIVE BASIC WELD JOINTS & GROOVE TERMINOLOGY'}
            </text>
            {diagramId === 'welding-processes' ? (
              <g>
                {[
                  { name: 'SMAW', mode: 'CC · DCEP / AC', shield: 'Flux Coating Slag + Gas', note: 'E6010 Root / E7018 Fill' },
                  { name: 'FCAW-G', mode: 'CV · DCEP', shield: 'Flux Core + CO₂ / Ar-CO₂', note: 'E71T-1 High Deposition' },
                  { name: 'GMAW', mode: 'CV · DCEP', shield: 'External 75Ar/25CO₂ or 98/2', note: 'ER70S-6 Solid Wire' },
                  { name: 'GTAW', mode: 'CC · DCEN (Steel)', shield: 'Pure Argon (100% Ar)', note: 'Non-consumable Tungsten' },
                ].map((proc, i) => {
                  const x = 25 + i * 142;
                  return (
                    <g key={proc.name}>
                      <rect x={x} y="55" width="130" height="190" rx="5" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
                      <text x={x + 65} y="85" textAnchor="middle" fill="#FACC15" fontSize="18" fontWeight="700" fontFamily="JetBrains Mono">
                        {proc.name}
                      </text>
                      <text x={x + 65} y="115" textAnchor="middle" fill="#38BDF8" fontSize="11" fontFamily="JetBrains Mono">
                        {proc.mode}
                      </text>
                      <line x1={x + 14} y1="130" x2={x + 116} y2="130" stroke="#1E293B" strokeWidth="1" />
                      <text x={x + 65} y="155" textAnchor="middle" fill="#E2E8F0" fontSize="10.5">
                        {proc.shield.slice(0, 18)}
                      </text>
                      <text x={x + 65} y="172" textAnchor="middle" fill="#E2E8F0" fontSize="10.5">
                        {proc.shield.slice(18)}
                      </text>
                      <text x={x + 65} y="215" textAnchor="middle" fill="#94A3B8" fontSize="10">
                        {proc.note}
                      </text>
                    </g>
                  );
                })}
              </g>
            ) : (
              <g>
                {/* Groove Anatomy & 5 Joint Types */}
                <polygon points="80,90 190,90 220,165 80,165" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
                <polygon points="270,90 380,90 380,165 240,165" fill="#334155" stroke="#94A3B8" strokeWidth="1.5" />
                <rect x="220" y="148" width="20" height="17" fill="#0F172A" />
                <text x="230" y="75" textAnchor="middle" fill="#FACC15" fontSize="11" fontFamily="JetBrains Mono">
                  INCLUDED ANGLE (60°–70°)
                </text>
                <text x="230" y="190" textAnchor="middle" fill="#38BDF8" fontSize="11" fontFamily="JetBrains Mono">
                  ROOT OPENING (GAP) & ROOT FACE (LAND)
                </text>
                {/* Five Joint Labels */}
                {['1. Butt', '2. Corner', '3. Edge', '4. Lap', '5. T-Joint'].map((j, i) => (
                  <g key={j}>
                    <rect x={35 + i * 110} y="220" width="96" height="42" rx="4" fill="#1E293B" stroke="#475569" strokeWidth="1" />
                    <text x={83 + i * 110} y="246" textAnchor="middle" fill="#F8FAFC" fontSize="12" fontWeight="600">
                      {j}
                    </text>
                  </g>
                ))}
              </g>
            )}
          </g>
        );

      case 'boiler-types': {
        const isFireTube = activeSubMode === 'firetube';
        return (
          <g>
            <text x="20" y="26" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
              {isFireTube
                ? 'FIRE-TUBE BOILER (FLUE GAS INSIDE TUBES · WATER IN SHELL)'
                : 'TWO-DRUM WATER-TUBE BOILER (WATER/STEAM INSIDE TUBES · NATURAL CIRCULATION)'}
            </text>
            {isFireTube ? (
              <g>
                <rect x="85" y="70" width="420" height="170" rx="14" fill="#0F172A" stroke="#38BDF8" strokeWidth="3" />
                <rect x="95" y="110" width="400" height="120" fill="#0C4A6E" opacity="0.35" />
                <text x="295" y="96" textAnchor="middle" fill="#38BDF8" fontSize="12" fontFamily="JetBrains Mono">
                  STEAM SPACE (SATURATED STEAM OUTLET)
                </text>
                {/* Furnace & Fire Tubes */}
                <rect x="85" y="175" width="380" height="36" fill="#7C2D12" stroke="#F59E0B" strokeWidth="2" />
                <text x="275" y="198" textAnchor="middle" fill="#FDE68A" fontSize="11" fontFamily="JetBrains Mono">
                  MORRISON CORRUGATED FURNACE (HOT GAS →)
                </text>
                <line x1="110" y1="130" x2="470" y2="130" stroke="#F59E0B" strokeWidth="6" />
                <line x1="110" y1="150" x2="470" y2="150" stroke="#F59E0B" strokeWidth="6" />
                <text x="290" y="144" textAnchor="middle" fill="#0A111A" fontSize="9.5" fontWeight="700">
                  FIRE TUBES (← RETURN PASSES)
                </text>
              </g>
            ) : (
              <g>
                {/* Steam Drum */}
                <circle cx="290" cy="85" r="38" fill="#1E293B" stroke="#38BDF8" strokeWidth="3" />
                <text x="290" y="89" textAnchor="middle" fill="#F8FAFC" fontSize="11" fontWeight="600">
                  STEAM DRUM
                </text>
                {/* Mud Drum */}
                <circle cx="290" cy="240" r="28" fill="#1E293B" stroke="#94A3B8" strokeWidth="3" />
                <text x="290" y="244" textAnchor="middle" fill="#CBD5E1" fontSize="10" fontWeight="600">
                  MUD DRUM
                </text>
                {/* Downcomers (Outside Furnace) */}
                <path d="M 255 95 L 155 120 L 155 215 L 265 238" fill="none" stroke="#38BDF8" strokeWidth="5" />
                <text x="108" y="170" fill="#38BDF8" fontSize="11" fontFamily="JetBrains Mono">
                  DOWNCOMERS
                </text>
                <text x="108" y="185" fill="#94A3B8" fontSize="10">
                  (Cooler Water ↓)
                </text>
                {/* Risers (Inside Furnace) */}
                <path d="M 315 232 L 405 205 L 405 115 L 325 92" fill="none" stroke="#F59E0B" strokeWidth="5" />
                <path d="M 290 212 L 290 123" fill="none" stroke="#F59E0B" strokeWidth="5" />
                <text x="418" y="162" fill="#F59E0B" fontSize="11" fontFamily="JetBrains Mono">
                  RISERS /
                </text>
                <text x="418" y="177" fill="#F59E0B" fontSize="11" fontFamily="JetBrains Mono">
                  WATERWALLS ↑
                </text>
              </g>
            )}
          </g>
        );
      }

      case 'pressure-vessel':
      case 'heat-exchanger':
      case 'tank-construction': {
        const mode = diagramId;
        return (
          <g>
            <text x="20" y="26" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
              {mode === 'heat-exchanger'
                ? 'TEMA SHELL-AND-TUBE HEAT EXCHANGER (BAFFLES · TUBESHEETS · FLOATING HEAD)'
                : mode === 'tank-construction'
                ? 'FIELD-ERECTED STORAGE TANK (ANNULAR PLATE · STAGGERED COURSES · WIND GIRDER)'
                : 'ASME PRESSURE VESSEL (2:1 HEADS · NOZZLE REPAD · FIXED/SLIDING SADDLES)'}
            </text>
            {mode === 'heat-exchanger' ? (
              <g>
                <rect x="85" y="95" width="410" height="125" rx="6" fill="#0F172A" stroke="#64748B" strokeWidth="2.5" />
                {/* Tubesheets */}
                <rect x="145" y="95" width="12" height="125" fill="#FACC15" />
                <rect x="435" y="105" width="10" height="105" fill="#FACC15" />
                {/* Baffles */}
                <line x1="220" y1="95" x2="220" y2="188" stroke="#38BDF8" strokeWidth="3" />
                <line x1="290" y1="127" x2="290" y2="220" stroke="#38BDF8" strokeWidth="3" />
                <line x1="360" y1="95" x2="360" y2="188" stroke="#38BDF8" strokeWidth="3" />
                {/* Tubes */}
                {[120, 140, 160, 180, 198].map((y) => (
                  <line key={y} x1="157" y1={y} x2="435" y2={y} stroke="#94A3B8" strokeWidth="2" />
                ))}
                <text x="115" y="160" textAnchor="middle" fill="#CBD5E1" fontSize="10" fontFamily="JetBrains Mono">
                  CHANNEL
                </text>
                <text x="290" y="248" textAnchor="middle" fill="#38BDF8" fontSize="11" fontFamily="JetBrains Mono">
                  TRANSVERSE BAFFLES FORCE CROSS-FLOW & PREVENT TUBE VIBRATION
                </text>
              </g>
            ) : mode === 'tank-construction' ? (
              <g>
                {/* Annular & Floor Plate */}
                <rect x="110" y="242" width="380" height="12" fill="#FACC15" />
                {/* Shell Courses (staggered vertical seams) */}
                <rect x="130" y="192" width="340" height="50" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
                <rect x="130" y="142" width="340" height="50" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
                <rect x="130" y="92" width="340" height="50" fill="#1E293B" stroke="#94A3B8" strokeWidth="2" />
                {/* Staggered seams */}
                <line x1="220" y1="192" x2="220" y2="242" stroke="#F59E0B" strokeWidth="2" />
                <line x1="360" y1="192" x2="360" y2="242" stroke="#F59E0B" strokeWidth="2" />
                <line x1="290" y1="142" x2="290" y2="192" stroke="#F59E0B" strokeWidth="2" />
                <line x1="220" y1="92" x2="220" y2="142" stroke="#F59E0B" strokeWidth="2" />
                {/* Wind Girder */}
                <rect x="118" y="96" width="364" height="8" fill="#38BDF8" />
                <text x="300" y="76" textAnchor="middle" fill="#38BDF8" fontSize="11" fontFamily="JetBrains Mono">
                  TOP WIND GIRDER + STAGGERED SHELL SEAMS + THICKER ANNULAR RING
                </text>
              </g>
            ) : (
              <g>
                {/* Cylindrical Shell + 2:1 Heads */}
                <path d="M 140 90 C 90 90 90 210 140 210 L 440 210 C 490 210 490 90 440 90 Z" fill="#1E293B" stroke="#94A3B8" strokeWidth="3" />
                {/* Nozzle + Repad */}
                <rect x="275" y="55" width="36" height="35" fill="#334155" stroke="#94A3B8" strokeWidth="2" />
                <rect x="262" y="84" width="62" height="10" fill="#FACC15" />
                <text x="293" y="46" textAnchor="middle" fill="#FACC15" fontSize="10.5" fontFamily="JetBrains Mono">
                  NOZZLE + REPAD (WITH 1/4" WEEP HOLE)
                </text>
                {/* Saddles */}
                <rect x="165" y="210" width="44" height="44" fill="#334155" stroke="#38BDF8" strokeWidth="2" />
                <rect x="375" y="210" width="44" height="44" fill="#334155" stroke="#F59E0B" strokeWidth="2" />
                <text x="187" y="272" textAnchor="middle" fill="#38BDF8" fontSize="10.5" fontFamily="JetBrains Mono">
                  FIXED SADDLE
                </text>
                <text x="397" y="272" textAnchor="middle" fill="#F59E0B" fontSize="10.5" fontFamily="JetBrains Mono">
                  SLIDING SADDLE (SLOTTED)
                </text>
              </g>
            )}
          </g>
        );
      }

      case 'orthographic-projection':
      case 'isometric-drawing':
      case 'plate-layout':
      default: {
        if (diagramId === 'orthographic-projection') {
          return (
            <g>
              <text x="20" y="26" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
                THIRD-ANGLE ORTHOGRAPHIC PROJECTION (NORTH AMERICAN STANDARD)
              </text>
              {/* Top View */}
              <rect x="110" y="55" width="140" height="65" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" />
              <circle cx="180" cy="87" r="18" fill="none" stroke="#FACC15" strokeWidth="2" />
              <text x="180" y="48" textAnchor="middle" fill="#38BDF8" fontSize="11" fontFamily="JetBrains Mono">
                TOP VIEW (PLAN)
              </text>
              {/* Projection lines */}
              <line x1="110" y1="120" x2="110" y2="155" stroke="#475569" strokeDasharray="3 3" />
              <line x1="250" y1="120" x2="250" y2="155" stroke="#475569" strokeDasharray="3 3" />
              {/* Front View */}
              <rect x="110" y="155" width="140" height="90" fill="#1E293B" stroke="#F8FAFC" strokeWidth="2" />
              <line x1="162" y1="155" x2="162" y2="245" stroke="#94A3B8" strokeDasharray="5 4" strokeWidth="1.5" />
              <line x1="198" y1="155" x2="198" y2="245" stroke="#94A3B8" strokeDasharray="5 4" strokeWidth="1.5" />
              <text x="180" y="266" textAnchor="middle" fill="#F8FAFC" fontSize="11" fontFamily="JetBrains Mono">
                FRONT VIEW (HIDDEN BORE DASHED)
              </text>
              {/* Right Side View */}
              <rect x="315" y="155" width="90" height="90" fill="#1E293B" stroke="#F59E0B" strokeWidth="2" />
              <text x="360" y="266" textAnchor="middle" fill="#F59E0B" fontSize="11" fontFamily="JetBrains Mono">
                RIGHT SIDE VIEW
              </text>
            </g>
          );
        }
        if (diagramId === 'isometric-drawing') {
          return (
            <g>
              <text x="20" y="26" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
                ISOMETRIC PIPING & 3D ROLLING OFFSET (30° PLAN AXES)
              </text>
              {/* Isometric Box */}
              <polygon points="160,180 320,105 440,162 280,237" fill="none" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="160" y1="180" x2="160" y2="95" stroke="#334155" strokeDasharray="4 4" />
              <line x1="440" y1="162" x2="440" y2="77" stroke="#334155" strokeDasharray="4 4" />
              <line x1="160" y1="95" x2="440" y2="77" stroke="#FACC15" strokeWidth="4" />
              {/* Axes labels */}
              <text x="235" y="130" fill="#38BDF8" fontSize="11" fontFamily="JetBrains Mono">
                RUN (30° AXIS)
              </text>
              <text x="385" y="205" fill="#22C55E" fontSize="11" fontFamily="JetBrains Mono">
                SET (30° AXIS)
              </text>
              <text x="450" y="122" fill="#F59E0B" fontSize="11" fontFamily="JetBrains Mono">
                RISE (90°)
              </text>
              <text x="300" y="72" textAnchor="middle" fill="#FACC15" fontSize="12" fontFamily="JetBrains Mono">
                TRAVEL = √(RUN² + SET² + RISE²)
              </text>
            </g>
          );
        }
        return (
          <g>
            <text x="20" y="26" fill="#94A3B8" fontSize="12" fontFamily="JetBrains Mono">
              PARALLEL-LINE CYLINDER STRETCH-OUT vs. RADIAL-LINE CONE FRUSTUM
            </text>
            {/* Left: Parallel Line */}
            <rect x="45" y="75" width="230" height="150" fill="#1E293B" stroke="#38BDF8" strokeWidth="2" />
            {[1, 2, 3, 4, 5].map((i) => (
              <line key={i} x1={45 + i * 38} y1="75" x2={45 + i * 38} y2="225" stroke="#475569" strokeDasharray="4 3" />
            ))}
            <path d="M 45 140 Q 100 95 160 140 T 275 140" fill="none" stroke="#FACC15" strokeWidth="3" />
            <text x="160" y="248" textAnchor="middle" fill="#38BDF8" fontSize="11" fontFamily="JetBrains Mono">
              STRETCH-OUT = π × (OD - t)
            </text>
            {/* Right: Radial Line Cone */}
            <path d="M 380 220 A 150 150 0 0 1 540 120 L 495 95 A 95 95 0 0 0 390 165 Z" fill="#1E293B" stroke="#F59E0B" strokeWidth="2.5" />
            <text x="455" y="248" textAnchor="middle" fill="#F59E0B" fontSize="11" fontFamily="JetBrains Mono">
              RADIAL-LINE SECTOR (CONE)
            </text>
          </g>
        );
      }
    }
  };

  return (
    <div className="bg-[#0D1622] border border-[#2A394A] rounded-lg overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#2A394A] bg-[#111B27]">
        <div>
          <p className="text-xs font-mono text-amber-400">TECHNICAL DIAGRAM</p>
          <h4 className="text-base font-semibold text-slate-100">{title ?? DIAGRAM_LABELS[diagramId]}</h4>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded border border-[#2A394A] text-slate-300 hover:text-white hover:bg-[#182433] transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-2 text-xs font-mono text-slate-300 tabular-nums">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded border border-[#2A394A] text-slate-300 hover:text-white hover:bg-[#182433] transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded border border-[#2A394A] text-slate-300 hover:text-white hover:bg-[#182433] transition-colors"
            title="Reset zoom"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Controls per Diagram */}
      {diagramId === 'sling-angles' && (
        <div className="px-4 py-2.5 border-b border-[#2A394A] bg-[#111B27]/60 flex flex-wrap items-center gap-4">
          <label className="text-xs font-medium text-slate-300 flex items-center gap-3">
            <span>Horizontal Sling Angle: <strong className="font-mono text-amber-400">{slingAngle}°</strong></span>
            <input
              type="range"
              min={15}
              max={85}
              step={5}
              value={slingAngle}
              onChange={(e) => setSlingAngle(Number(e.target.value))}
              className="accent-amber-400 w-40 cursor-pointer"
            />
          </label>
          <div className="flex gap-1.5">
            {[30, 45, 60, 75].map((ang) => (
              <button
                key={ang}
                type="button"
                onClick={() => setSlingAngle(ang)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors ${
                  slingAngle === ang
                    ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold'
                    : 'border-[#2A394A] text-slate-300 hover:bg-[#182433]'
                }`}
              >
                {ang}°
              </button>
            ))}
          </div>
        </div>
      )}

      {diagramId === 'block-and-tackle' && (
        <div className="px-4 py-2.5 border-b border-[#2A394A] bg-[#111B27]/60 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 mr-2">Parts of Line:</span>
          {[2, 3, 4, 5, 6, 8].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setReevingParts(p)}
              className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
                reevingParts === p
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold'
                  : 'border-[#2A394A] text-slate-300 hover:bg-[#182433]'
              }`}
            >
              {p}-Part
            </button>
          ))}
        </div>
      )}

      {diagramId === 'lifting-arrangements' && (
        <div className="px-4 py-2.5 border-b border-[#2A394A] bg-[#111B27]/60 flex flex-wrap gap-2">
          {[
            { id: '4leg', label: '4-Leg Rigid Bridle' },
            { id: 'choker', label: 'Single Choker' },
            { id: 'basket', label: 'Basket Hitch' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveSubMode(m.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded border transition-colors ${
                (activeSubMode === 'default' ? '4leg' : activeSubMode) === m.id
                  ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold'
                  : 'border-[#2A394A] text-slate-300 hover:bg-[#182433]'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {diagramId === 'welding-positions' && (
        <div className="px-4 py-2.5 border-b border-[#2A394A] bg-[#111B27]/60 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveSubMode('groove')}
            className={`px-3 py-1.5 text-xs font-medium rounded border ${
              activeSubMode !== 'fillet' ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold' : 'border-[#2A394A] text-slate-300'
            }`}
          >
            Groove (1G–4G)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubMode('fillet')}
            className={`px-3 py-1.5 text-xs font-medium rounded border ${
              activeSubMode === 'fillet' ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold' : 'border-[#2A394A] text-slate-300'
            }`}
          >
            Fillet (1F–4F)
          </button>
        </div>
      )}

      {diagramId === 'boiler-types' && (
        <div className="px-4 py-2.5 border-b border-[#2A394A] bg-[#111B27]/60 flex gap-2">
          <button
            type="button"
            onClick={() => setActiveSubMode('watertube')}
            className={`px-3 py-1.5 text-xs font-medium rounded border ${
              activeSubMode !== 'firetube' ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold' : 'border-[#2A394A] text-slate-300'
            }`}
          >
            Water-Tube Boiler
          </button>
          <button
            type="button"
            onClick={() => setActiveSubMode('firetube')}
            className={`px-3 py-1.5 text-xs font-medium rounded border ${
              activeSubMode === 'firetube' ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold' : 'border-[#2A394A] text-slate-300'
            }`}
          >
            Fire-Tube Boiler
          </button>
        </div>
      )}

      {diagramId === 'welding-symbols' && (
        <div className="px-4 py-2.5 border-b border-[#2A394A] bg-[#111B27]/60 flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            {(['arrow', 'other', 'both'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSymbolSide(s)}
                className={`px-2.5 py-1 text-xs rounded border ${
                  symbolSide === s ? 'bg-amber-500 text-slate-950 border-amber-500 font-semibold' : 'border-[#2A394A] text-slate-300'
                }`}
              >
                {s === 'arrow' ? 'Arrow Side' : s === 'other' ? 'Other Side' : 'Both Sides'}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(['fillet', 'vgroove', 'bevel'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSymbolType(t)}
                className={`px-2.5 py-1 text-xs rounded border ${
                  symbolType === t ? 'bg-sky-500 text-slate-950 border-sky-500 font-semibold' : 'border-[#2A394A] text-slate-300'
                }`}
              >
                {t === 'fillet' ? 'Fillet' : t === 'vgroove' ? 'V-Groove' : 'Bevel'}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
            <input type="checkbox" checked={symbolAllAround} onChange={(e) => setSymbolAllAround(e.target.checked)} className="accent-amber-400" />
            All Around
          </label>
          <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
            <input type="checkbox" checked={symbolField} onChange={(e) => setSymbolField(e.target.checked)} className="accent-amber-400" />
            Field Flag
          </label>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="overflow-auto bg-[#070D14] p-4">
        <div
          className="mx-auto transition-transform duration-150 origin-top-left"
          style={{ width: `${Math.round(600 * zoom)}px`, maxWidth: '100%' }}
        >
          <svg
            viewBox="0 0 600 300"
            className="w-full h-auto border border-[#1E293B] rounded bg-[#0A111A]"
            role="img"
            aria-label={DIAGRAM_LABELS[diagramId]}
          >
            {/* Subtle Technical Blueprint Grid */}
            <defs>
              <pattern id={`grid-${diagramId}`} width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#162232" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="600" height="300" fill={`url(#grid-${diagramId})`} />
            {renderSvgContent()}
          </svg>
        </div>
      </div>

      {selectedCallout && (
        <div className="px-4 py-2.5 bg-[#182433] border-t border-[#2A394A] flex items-center gap-2 text-xs text-amber-300">
          <Info className="w-4 h-4 shrink-0" />
          <span>{selectedCallout}</span>
        </div>
      )}

      {caption && (
        <div className="px-4 py-2.5 border-t border-[#2A394A] text-xs text-slate-400 bg-[#111B27]">
          {caption}
        </div>
      )}
    </div>
  );
};

import {
  CraneCommand,
  CraneLiftPhase,
  EnvironmentMode,
  LegCalculation,
  LiftFailureAnalysis,
  LiftFailureCause,
  LoadDefinition,
  RiggingConfiguration,
  RiggingScenario,
  RiggingSessionRecord,
  RiggingShackleSpec,
  RiggingSimulationState,
  RiggingSlingSpec,
  RiggingStaticsResult,
  RiggingTrainingMode,
  RiggingWarning,
  UnitDisplayMode,
} from '../types/academy';

const LB_TO_KG = 0.45359237;
const FT_TO_M = 0.3048;

export function lbToKg(lb: number): number {
  return lb * LB_TO_KG;
}

export function ftToM(ft: number): number {
  return ft * FT_TO_M;
}

export function formatWeight(lb: number, unit: UnitDisplayMode, decimals = 0): string {
  if (unit === 'metric') {
    return `${lbToKg(lb).toLocaleString('en-CA', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })} kg`;
  }
  return `${lb.toLocaleString('en-CA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} lb`;
}

export function formatLength(ft: number, unit: UnitDisplayMode, decimals = 2): string {
  if (unit === 'metric') {
    return `${ftToM(ft).toFixed(decimals)} m`;
  }
  return `${ft.toFixed(decimals)} ft`;
}

export function getEffectiveSlingWll(
  sling: RiggingSlingSpec,
  hitchType: RiggingConfiguration['hitchType']
): number {
  if (hitchType === 'choker') return sling.chokerWllLb;
  if (hitchType === 'basket') return sling.basketWllLb;
  return sling.verticalWllLb;
}

/**
 * Deterministic 2D/3D static equilibrium solver for 2-leg and indeterminate multi-leg lifts.
 * Explicitly avoids naive equal-division on 3/4-leg rigid structures (uses 2 effective legs).
 */
export function calculateRiggingStatics(
  load: LoadDefinition,
  config: RiggingConfiguration,
  sling: RiggingSlingSpec,
  shackle: RiggingShackleSpec
): RiggingStaticsResult {
  const warnings: RiggingWarning[] = [];

  const leftPt =
    load.attachmentPoints.find((p) => p.id === config.leftPointId) ?? load.attachmentPoints[0];
  const rightPt =
    load.attachmentPoints.find((p) => p.id === config.rightPointId) ??
    load.attachmentPoints[load.attachmentPoints.length - 1];

  const baseWll = getEffectiveSlingWll(sling, config.hitchType);
  const indeterminateWarning = config.legCount >= 3 && load.isRigidStructure;
  const effectiveLoadBearingLegs = indeterminateWarning ? 2 : 2;

  if (indeterminateWarning) {
    warnings.push({
      severity: 'caution',
      code: 'INDETERMINATE_MULTILEG',
      message: `${config.legCount}-leg bridle on a rigid structure is statically indeterminate.`,
      recommendation:
        'Canadian/ASME rigging practice sizes slings assuming only 2 active opposing legs carry the full load unless an engineered equalizer is installed.',
    });
  }

  const dx = rightPt.localXFt - leftPt.localXFt;
  const dy = rightPt.localYFt - leftPt.localYFt;
  const span = Math.hypot(dx, dy);

  if (dx <= 0.5) {
    const fallbackLeg: LegCalculation = {
      legLabel: 'Left Leg (A)',
      pointId: leftPt.id,
      lengthFt: config.leftLengthFt,
      horizontalSpanFt: 0,
      verticalDropFt: 0,
      horizontalAngleDeg: 0,
      tensionLb: load.weightLb,
      effectiveWllLb: baseWll,
      utilizationPct: 999,
      status: 'overload',
    };
    return {
      valid: false,
      geometryError: 'Left attachment point must be strictly to the left of the right attachment point.',
      totalLoadWeightLb: load.weightLb,
      hookHeightAbovePickFt: 0,
      totalHorizontalSpreadFt: Math.max(0, dx),
      leftLeg: fallbackLeg,
      rightLeg: { ...fallbackLeg, legLabel: 'Right Leg (B)', pointId: rightPt.id },
      maxTensionLb: load.weightLb,
      minHorizontalAngleDeg: 0,
      cgPositionXFt: load.cgOffsetXFt,
      hookToCgOffsetXFt: 0,
      predictedStaticTiltDeg: 0,
      predictedVerticalShareLeftPct: 50,
      predictedVerticalShareRightPct: 50,
      indeterminateWarning,
      effectiveLoadBearingLegs,
      overloadedComponent: 'geometry',
      willFailOnLift: true,
      predictedFailureReason: 'Invalid attachment point pairing (Left >= Right).',
      warnings: [
        {
          severity: 'critical',
          code: 'INVALID_PICK_SPAN',
          message: 'Left and right attachment points overlap or are reversed.',
          recommendation: 'Pick a left point (-X) and a right point (+X) spanning across the load CG.',
        },
      ],
    };
  }

  const LA = Math.max(2, config.leftLengthFt);
  const LB = Math.max(2, config.rightLengthFt);

  // Spreader beam holds lower slings vertical (90 deg to load) while upper bridle reaches hook
  let hookLocalX = 0;
  let hookLocalY = 0;
  let worldAngleLeftDeg = 90;
  let worldAngleRightDeg = 90;
  let tensionLeftLb = 0;
  let tensionRightLb = 0;
  let predictedStaticTiltDeg = 0;
  let verticalShareLeftPct = 50;
  let verticalShareRightPct = 50;

  if (config.useSpreaderBeam) {
    // Lower drops are vertical; beam transfers horizontal compression, upper bridle angles from spreader ends.
    const dropLen = Math.max(2.5, Math.min(LA, LB) * 0.45);
    const upperLegLen = Math.max(4.0, (LA + LB) * 0.55);
    const upperHalfSpan = span / 2;

    if (upperLegLen <= upperHalfSpan + 0.15) {
      const invalidLeg: LegCalculation = {
        legLabel: 'Left Leg (A)',
        pointId: leftPt.id,
        lengthFt: LA,
        horizontalSpanFt: upperHalfSpan,
        verticalDropFt: 0,
        horizontalAngleDeg: 0,
        tensionLb: load.weightLb,
        effectiveWllLb: baseWll,
        utilizationPct: 999,
        status: 'overload',
      };
      return {
        valid: false,
        geometryError: 'Upper slings too short for spreader beam span. Increase sling lengths or narrow pick span.',
        totalLoadWeightLb: load.weightLb,
        hookHeightAbovePickFt: 0,
        totalHorizontalSpreadFt: dx,
        leftLeg: invalidLeg,
        rightLeg: { ...invalidLeg, legLabel: 'Right Leg (B)', pointId: rightPt.id },
        maxTensionLb: load.weightLb,
        minHorizontalAngleDeg: 0,
        cgPositionXFt: load.cgOffsetXFt,
        hookToCgOffsetXFt: 0,
        predictedStaticTiltDeg: 0,
        predictedVerticalShareLeftPct: 50,
        predictedVerticalShareRightPct: 50,
        indeterminateWarning,
        effectiveLoadBearingLegs,
        overloadedComponent: 'geometry',
        willFailOnLift: true,
        predictedFailureReason: 'Slings too short to close geometry over spreader beam.',
        warnings: [
          {
            severity: 'critical',
            code: 'GEOMETRY_TOO_SHORT',
            message: 'Combined sling length cannot span the selected pick points.',
            recommendation: 'Increase sling lengths or select closer lifting lugs.',
          },
        ],
      };
    }

    const upperH = Math.sqrt(Math.max(0.01, upperLegLen * upperLegLen - upperHalfSpan * upperHalfSpan));
    const upperAngleDeg = (Math.atan2(upperH, upperHalfSpan) * 180) / Math.PI;
    const midX = (leftPt.localXFt + rightPt.localXFt) / 2;
    const midY = (leftPt.localYFt + rightPt.localYFt) / 2;
    hookLocalX = midX;
    hookLocalY = midY + dropLen + upperH;

    // CG moment distribution between left & right vertical drops
    const dA = Math.max(0.1, load.cgOffsetXFt - leftPt.localXFt);
    const dB = Math.max(0.1, rightPt.localXFt - load.cgOffsetXFt);
    const clampedShareLeft =
      load.cgOffsetXFt <= leftPt.localXFt
        ? 0.92
        : load.cgOffsetXFt >= rightPt.localXFt
        ? 0.08
        : dB / (dA + dB);
    verticalShareLeftPct = Math.round(clampedShareLeft * 1000) / 10;
    verticalShareRightPct = Math.round((1 - clampedShareLeft) * 1000) / 10;

    // Static tilt if CG isn't centered beneath hook
    const hookToCgX = load.cgOffsetXFt - hookLocalX;
    const hookAboveCgY = Math.max(1.0, hookLocalY - load.cgOffsetYFt);
    predictedStaticTiltDeg = (-Math.atan2(hookToCgX, hookAboveCgY) * 180) / Math.PI;

    // Vertical drop tensions vs upper bridle tension
    const lowerLeftT = load.weightLb * clampedShareLeft;
    const lowerRightT = load.weightLb * (1 - clampedShareLeft);
    const upperBridleT = load.weightLb / (2 * Math.sin((upperAngleDeg * Math.PI) / 180));
    tensionLeftLb = Math.max(lowerLeftT, upperBridleT);
    tensionRightLb = Math.max(lowerRightT, upperBridleT);
    worldAngleLeftDeg = Math.min(90, upperAngleDeg);
    worldAngleRightDeg = Math.min(90, upperAngleDeg);
  } else {
    // Check triangle inequality for 2-leg bridle connecting A -> Hook -> B
    if (LA + LB <= span + 0.25 || Math.abs(LA - LB) >= span - 0.1) {
      const reason =
        LA + LB <= span + 0.25
          ? `Slings (${LA.toFixed(1)} ft + ${LB.toFixed(1)} ft) cannot bridge the ${span.toFixed(1)} ft lug span.`
          : `Difference between left (${LA.toFixed(1)} ft) and right (${LB.toFixed(1)} ft) sling lengths exceeds span ${span.toFixed(1)} ft.`;
      const badLeg: LegCalculation = {
        legLabel: 'Left Leg (A)',
        pointId: leftPt.id,
        lengthFt: LA,
        horizontalSpanFt: dx / 2,
        verticalDropFt: 0,
        horizontalAngleDeg: 0,
        tensionLb: load.weightLb,
        effectiveWllLb: baseWll,
        utilizationPct: 999,
        status: 'overload',
      };
      return {
        valid: false,
        geometryError: reason,
        totalLoadWeightLb: load.weightLb,
        hookHeightAbovePickFt: 0,
        totalHorizontalSpreadFt: dx,
        leftLeg: badLeg,
        rightLeg: { ...badLeg, legLabel: 'Right Leg (B)', pointId: rightPt.id },
        maxTensionLb: load.weightLb,
        minHorizontalAngleDeg: 0,
        cgPositionXFt: load.cgOffsetXFt,
        hookToCgOffsetXFt: 0,
        predictedStaticTiltDeg: 0,
        predictedVerticalShareLeftPct: 50,
        predictedVerticalShareRightPct: 50,
        indeterminateWarning,
        effectiveLoadBearingLegs,
        overloadedComponent: 'geometry',
        willFailOnLift: true,
        predictedFailureReason: reason,
        warnings: [
          {
            severity: 'critical',
            code: 'TRIANGLE_INEQUALITY_FAIL',
            message: reason,
            recommendation: 'Use longer slings, balance left/right sling lengths, or select narrower pick points.',
          },
        ],
      };
    }

    // Solve circle-circle intersection in plane of load (A at (xA, yA), B at (xB, yB))
    const ux = dx / span;
    const uy = dy / span;
    const proj = (span * span + LA * LA - LB * LB) / (2 * span);
    const perpSq = Math.max(0.01, LA * LA - proj * proj);
    const perp = Math.sqrt(perpSq);

    // Perpendicular unit vector pointing upward (-uy, ux)
    hookLocalX = leftPt.localXFt + proj * ux - perp * uy;
    hookLocalY = leftPt.localYFt + proj * uy + perp * ux;

    // Equilibrium rotation phi aligns vector (Hook - CG) vertically (+Y):
    // Rotating (rx, ry) CCW by phi gives rx' = rx*cos(phi) - ry*sin(phi) = 0 => phi = +atan2(rx, ry).
    const rx = hookLocalX - load.cgOffsetXFt;
    const ry = Math.max(0.5, hookLocalY - load.cgOffsetYFt);
    const phiRad = Math.atan2(rx, ry);
    predictedStaticTiltDeg = (phiRad * 180) / Math.PI;
    if (Object.is(predictedStaticTiltDeg, -0)) predictedStaticTiltDeg = 0;

    // Rotate sling unit vectors uA = (H - A)/LA, uB = (H - B)/LB by phiRad into world space
    const c = Math.cos(phiRad);
    const s = Math.sin(phiRad);

    const uAxLocal = (hookLocalX - leftPt.localXFt) / LA;
    const uAyLocal = (hookLocalY - leftPt.localYFt) / LA;
    const uBxLocal = (hookLocalX - rightPt.localXFt) / LB;
    const uByLocal = (hookLocalY - rightPt.localYFt) / LB;

    const uAx = uAxLocal * c - uAyLocal * s;
    const uAy = uAxLocal * s + uAyLocal * c;
    const uBx = uBxLocal * c - uByLocal * s;
    const uBy = uBxLocal * s + uByLocal * c;

    worldAngleLeftDeg = Math.max(1, Math.min(90, (Math.asin(Math.max(0.02, Math.min(1, uAy))) * 180) / Math.PI));
    worldAngleRightDeg = Math.max(1, Math.min(90, (Math.asin(Math.max(0.02, Math.min(1, uBy))) * 180) / Math.PI));

    // Solve 2x2 linear static equilibrium:
    // T_A * uAx + T_B * uBx = 0
    // T_A * uAy + T_B * uBy = W
    const det = uAx * uBy - uBx * uAy;
    if (Math.abs(det) < 1e-4) {
      tensionLeftLb = load.weightLb / 2;
      tensionRightLb = load.weightLb / 2;
    } else {
      tensionLeftLb = Math.max(0, (0 * uBy - uBx * load.weightLb) / det);
      tensionRightLb = Math.max(0, (uAx * load.weightLb - 0 * uAy) / det);
    }

    const vertLeft = tensionLeftLb * Math.max(0, uAy);
    const vertRight = tensionRightLb * Math.max(0, uBy);
    const vertSum = Math.max(1, vertLeft + vertRight);
    verticalShareLeftPct = Math.round((vertLeft / vertSum) * 1000) / 10;
    verticalShareRightPct = Math.round((vertRight / vertSum) * 1000) / 10;
  }

  // Evaluate leg statuses against effective WLL
  const utilLeft = (tensionLeftLb / Math.max(1, baseWll)) * 100;
  const utilRight = (tensionRightLb / Math.max(1, baseWll)) * 100;

  const getLegStatus = (util: number, angleDeg: number): LegCalculation['status'] => {
    if (util > 100 || angleDeg < 30) return 'overload';
    if (angleDeg < 45 || util > 85) return 'critical';
    if (angleDeg < 60 || util > 70) return 'caution';
    return 'safe';
  };

  const leftLeg: LegCalculation = {
    legLabel: 'Left Leg (A)',
    pointId: leftPt.id,
    lengthFt: LA,
    horizontalSpanFt: Math.abs(hookLocalX - leftPt.localXFt),
    verticalDropFt: Math.max(0, hookLocalY - leftPt.localYFt),
    horizontalAngleDeg: Math.round(worldAngleLeftDeg * 10) / 10,
    tensionLb: Math.round(tensionLeftLb),
    effectiveWllLb: baseWll,
    utilizationPct: Math.round(utilLeft * 10) / 10,
    status: getLegStatus(utilLeft, worldAngleLeftDeg),
  };

  const rightLeg: LegCalculation = {
    legLabel: 'Right Leg (B)',
    pointId: rightPt.id,
    lengthFt: LB,
    horizontalSpanFt: Math.abs(rightPt.localXFt - hookLocalX),
    verticalDropFt: Math.max(0, hookLocalY - rightPt.localYFt),
    horizontalAngleDeg: Math.round(worldAngleRightDeg * 10) / 10,
    tensionLb: Math.round(tensionRightLb),
    effectiveWllLb: baseWll,
    utilizationPct: Math.round(utilRight * 10) / 10,
    status: getLegStatus(utilRight, worldAngleRightDeg),
  };

  const maxTensionLb = Math.max(leftLeg.tensionLb, rightLeg.tensionLb);
  const minHorizontalAngleDeg = Math.min(leftLeg.horizontalAngleDeg, rightLeg.horizontalAngleDeg);
  const hookToCgOffsetXFt = Math.round((hookLocalX - load.cgOffsetXFt) * 100) / 100;

  // Shackle capacity & side-loading check
  const effectiveShackleWll =
    minHorizontalAngleDeg < 45
      ? Math.round(shackle.wllLb * (1 - shackle.allowSideLoadDeratePct / 100))
      : shackle.wllLb;

  // Determine safety warnings and failure triggers
  let overloadedComponent: RiggingStaticsResult['overloadedComponent'] = 'none';
  let willFailOnLift = false;
  let predictedFailureReason: string | null = null;

  if (sling.condition === 'damaged-frayed') {
    warnings.push({
      severity: 'critical',
      code: 'DAMAGED_SLING',
      message: `Selected sling (${sling.name}) has kinked strands and broken wires.`,
      recommendation: 'Tag out of service immediately and switch to a serviceable inspected sling.',
    });
    overloadedComponent = 'connection';
    willFailOnLift = true;
    predictedFailureReason = 'Damaged wire rope sling parted under initial tension.';
  } else if (sling.condition === 'missing-tag') {
    warnings.push({
      severity: 'critical',
      code: 'MISSING_TAG',
      message: 'Selected sling is missing a legible rated capacity identification tag.',
      recommendation: 'Ontario Reg. 213/91 & ASME B30.9 forbid lifting with untagged slings. Replace sling.',
    });
    overloadedComponent = 'connection';
    willFailOnLift = true;
    predictedFailureReason = 'Untagged synthetic sling rejected / failed unverified capacity check.';
  }

  if (!config.shacklePinTightened) {
    warnings.push({
      severity: 'critical',
      code: 'UNSECURED_SHACKLE',
      message: 'Shackle pin is not fully seated or moused/cotter-pinned.',
      recommendation: 'Seat and secure shackle pins before taking slack.',
    });
    overloadedComponent = 'connection';
    willFailOnLift = true;
    predictedFailureReason = 'Unsecured shackle pin backed out under load.';
  }

  if (
    (load.sharpEdges || leftPt.requiresSoftener || rightPt.requiresSoftener) &&
    !config.useEdgeSofteners &&
    sling.category !== 'alloy-chain'
  ) {
    warnings.push({
      severity: 'critical',
      code: 'SHARP_EDGE_UNPROTECTED',
      message: 'Sharp steel edges without corner softeners risk cutting web or wire rope slings under tension.',
      recommendation: 'Enable Edge Softeners / Corner Pads or switch to Alloy Chain where appropriate.',
    });
    overloadedComponent = 'connection';
    willFailOnLift = true;
    predictedFailureReason = 'Unprotected sharp edge severed sling body during lift-off.';
  }

  if (minHorizontalAngleDeg < 30) {
    warnings.push({
      severity: 'critical',
      code: 'ANGLE_BELOW_30',
      message: `Minimum sling angle is ${minHorizontalAngleDeg.toFixed(1)} deg (< 30 deg). Tension multiplier exceeds 2.0x per leg!`,
      recommendation: 'Lengthen slings, move pick points inward, or use a spreader beam to exceed 45–60 deg.',
    });
    if (!willFailOnLift) {
      overloadedComponent = leftLeg.tensionLb >= rightLeg.tensionLb ? 'left-sling' : 'right-sling';
      willFailOnLift = true;
      predictedFailureReason = `Severe shallow sling angle (${minHorizontalAngleDeg.toFixed(1)} deg) multiplied tension past failure limit.`;
    }
  } else if (minHorizontalAngleDeg < 45) {
    warnings.push({
      severity: 'caution',
      code: 'ANGLE_BELOW_45',
      message: `Horizontal angle ${minHorizontalAngleDeg.toFixed(1)} deg is below the 45 deg recommended threshold.`,
      recommendation: 'Target 60 deg or steeper horizontal sling angles to control leg tension and shackle side-loading.',
    });
  }

  if (leftLeg.tensionLb > leftLeg.effectiveWllLb) {
    warnings.push({
      severity: 'critical',
      code: 'LEFT_SLING_OVER_WLL',
      message: `Left leg tension (${leftLeg.tensionLb.toLocaleString()} lb) exceeds effective WLL (${leftLeg.effectiveWllLb.toLocaleString()} lb).`,
      recommendation: 'Upgrade sling capacity, increase sling angle, or rebalance CG share.',
    });
    if (!willFailOnLift) {
      overloadedComponent = 'left-sling';
      willFailOnLift = true;
      predictedFailureReason = 'Left sling tension exceeded simulated WLL and overload threshold.';
    }
  }

  if (rightLeg.tensionLb > rightLeg.effectiveWllLb) {
    warnings.push({
      severity: 'critical',
      code: 'RIGHT_SLING_OVER_WLL',
      message: `Right leg tension (${rightLeg.tensionLb.toLocaleString()} lb) exceeds effective WLL (${rightLeg.effectiveWllLb.toLocaleString()} lb).`,
      recommendation: 'Upgrade sling capacity, increase sling angle, or rebalance CG share.',
    });
    if (!willFailOnLift) {
      overloadedComponent = 'right-sling';
      willFailOnLift = true;
      predictedFailureReason = 'Right sling tension exceeded simulated WLL and overload threshold.';
    }
  }

  if (maxTensionLb > effectiveShackleWll) {
    warnings.push({
      severity: 'critical',
      code: 'SHACKLE_OVERLOAD',
      message: `Peak leg tension (${maxTensionLb.toLocaleString()} lb) exceeds effective shackle capacity (${effectiveShackleWll.toLocaleString()} lb).`,
      recommendation: 'Step up to a higher-WLL Bolt-Type Anchor Shackle and keep angles steep.',
    });
    if (!willFailOnLift) {
      overloadedComponent = 'shackle';
      willFailOnLift = true;
      predictedFailureReason = 'Shackle bow/pin deformed beyond rated limit under excessive tension.';
    }
  }

  if (Math.abs(predictedStaticTiltDeg) > 10) {
    warnings.push({
      severity: 'critical',
      code: 'SEVERE_CG_TILT',
      message: `Hook-to-CG offset (${hookToCgOffsetXFt.toFixed(2)} ft) predicts ${Math.abs(predictedStaticTiltDeg).toFixed(1)} deg tilt on lift-off!`,
      recommendation: 'Align pick points symmetrically around the true CG or adjust sling leg lengths.',
    });
    if (!willFailOnLift && Math.abs(predictedStaticTiltDeg) > 16) {
      willFailOnLift = true;
      overloadedComponent = 'connection';
      predictedFailureReason = `Excessive ${Math.abs(predictedStaticTiltDeg).toFixed(1)} deg load tilt caused rigging slip / instability.`;
    }
  } else if (Math.abs(predictedStaticTiltDeg) > 4.5) {
    warnings.push({
      severity: 'caution',
      code: 'MODERATE_CG_TILT',
      message: `Predicted suspended tilt is ${Math.abs(predictedStaticTiltDeg).toFixed(1)} deg due to CG or leg asymmetry.`,
      recommendation: 'Shift pick points toward CG or balance sling lengths for a level pick.',
    });
  }

  if (!config.inspectedHardware) {
    warnings.push({
      severity: 'caution',
      code: 'UNINSPECTED_GEAR',
      message: 'Pre-lift rigging inspection checklist has not been signed off.',
      recommendation: 'Inspect sling tags, wire strands, shackle pins, and hook latch before hoisting.',
    });
  }

  return {
    valid: true,
    totalLoadWeightLb: load.weightLb,
    hookHeightAbovePickFt: Math.round((hookLocalY - (leftPt.localYFt + rightPt.localYFt) / 2) * 100) / 100,
    totalHorizontalSpreadFt: Math.round(dx * 100) / 100,
    leftLeg,
    rightLeg,
    maxTensionLb,
    minHorizontalAngleDeg: Math.round(minHorizontalAngleDeg * 10) / 10,
    cgPositionXFt: load.cgOffsetXFt,
    hookToCgOffsetXFt,
    predictedStaticTiltDeg:
      Math.round(predictedStaticTiltDeg * 10) / 10 === 0
        ? 0
        : Math.round(predictedStaticTiltDeg * 10) / 10,
    predictedVerticalShareLeftPct: verticalShareLeftPct,
    predictedVerticalShareRightPct: verticalShareRightPct,
    indeterminateWarning,
    effectiveLoadBearingLegs,
    overloadedComponent,
    willFailOnLift,
    predictedFailureReason,
    warnings,
  };
}

// ============================================================================
// DETERMINISTIC FIXED-TIMESTEP CRANE & RIGID-BODY PHYSICS ENGINE
// ============================================================================

export function createInitialSimState(
  load: LoadDefinition,
  config: RiggingConfiguration,
  statics: RiggingStaticsResult,
  targetZoneXFt: number,
  targetZoneZFt: number
): RiggingSimulationState {
  const initialLoadY = load.heightFt / 2;
  const pickPlaneY = initialLoadY + load.heightFt / 2;
  const slackFt = 1.25;
  const hookHeightAtTaut = pickPlaneY + Math.max(2, statics.hookHeightAbovePickFt);
  const startHookY = hookHeightAtTaut - slackFt;
  const craneStartX = config.hookOffsetXFt;
  const craneStartZ = config.hookOffsetZFt;

  const initialFrame = {
    tSec: 0,
    phase: 'grounded' as const,
    craneXFt: craneStartX,
    craneZFt: craneStartZ,
    hookYFt: startHookY,
    loadXFt: 0,
    loadYFt: initialLoadY,
    loadZFt: 0,
    tiltZDeg: 0,
    tiltXDeg: 0,
    swingXDeg: 0,
    swingZDeg: 0,
    velYFtPerSec: 0,
    liveTensionLeftLb: 0,
    liveTensionRightLb: 0,
    dynamicFactor: 1,
    slackRemainingFt: slackFt,
    grounded: true,
    collisionActive: false,
    failed: false,
    failureCause: 'none' as const,
  };

  return {
    phase: 'grounded',
    activeCommand: 'idle',
    tSec: 0,
    craneXFt: craneStartX,
    craneZFt: craneStartZ,
    hookYFt: startHookY,
    loadXFt: 0,
    loadYFt: initialLoadY,
    loadZFt: 0,
    loadVx: 0,
    loadVy: 0,
    loadVz: 0,
    tiltZDeg: 0,
    tiltZVelDeg: 0,
    tiltXDeg: 0,
    swingXDeg: 0,
    swingXVel: 0,
    swingZDeg: 0,
    swingZVel: 0,
    liveTensionLeftLb: 0,
    liveTensionRightLb: 0,
    dynamicFactor: 1.0,
    slackRemainingFt: slackFt,
    collisionCount: 0,
    collisionDetail: null,
    failed: false,
    failureCause: 'none',
    emergencyStopLatched: false,
    targetZoneXFt,
    targetZoneZFt,
    landedInTarget: false,
    lastSignalIssuedAtSec: null,
    signalCommsLost: false,
    frames: [initialFrame],
    failureAnalysis: null,
  };
}

export function issueCraneCommand(
  state: RiggingSimulationState,
  command: CraneCommand,
  load: LoadDefinition,
  config: RiggingConfiguration,
  statics: RiggingStaticsResult,
  targetZoneXFt: number,
  targetZoneZFt: number
): RiggingSimulationState {
  if (command === 'reset') {
    return createInitialSimState(load, config, statics, targetZoneXFt, targetZoneZFt);
  }

  // Emergency Stop ALWAYS overrides everything immediately and latches brake
  if (command === 'emergency-stop') {
    const nextPhase: CraneLiftPhase = state.failed ? 'failed' : 'emergency-stopped';
    const lastFrame = state.frames[state.frames.length - 1];
    const stopFrame = lastFrame
      ? { ...lastFrame, tSec: Math.round(state.tSec * 1000) / 1000, phase: nextPhase }
      : null;
    return {
      ...state,
      phase: nextPhase,
      activeCommand: 'emergency-stop',
      emergencyStopLatched: true,
      loadVx: 0,
      loadVy: 0,
      loadVz: 0,
      frames: stopFrame && state.frames.length < 1800 ? [...state.frames, stopFrame] : state.frames,
    };
  }

  if (state.failed) {
    return state;
  }

  if (command === 'stop') {
    const nextPhase: CraneLiftPhase = state.loadYFt <= load.heightFt / 2 + 0.03 ? 'grounded' : 'stopped';
    const lastFrame = state.frames[state.frames.length - 1];
    const stopFrame = lastFrame
      ? { ...lastFrame, tSec: Math.round(state.tSec * 1000) / 1000, phase: nextPhase }
      : null;
    return {
      ...state,
      phase: nextPhase,
      activeCommand: 'stop',
      emergencyStopLatched: false,
      signalCommsLost: false,
      lastSignalIssuedAtSec: state.tSec,
      frames: stopFrame && state.frames.length < 1800 ? [...state.frames, stopFrame] : state.frames,
    };
  }

  // Clear E-stop latch only when explicit valid motion command is issued
  const nextState: RiggingSimulationState = {
    ...state,
    emergencyStopLatched: false,
    signalCommsLost: false,
    activeCommand: command,
    lastSignalIssuedAtSec: state.tSec,
  };

  if (command === 'take-slack') {
    nextState.phase = 'taking-slack';
  } else if (command === 'test-lift') {
    nextState.phase = 'test-lift-hold';
  } else if (command === 'hoist') {
    nextState.phase = 'suspended';
  } else if (command === 'lower') {
    nextState.phase = 'lowering';
  } else if (
    command === 'bridge-left' ||
    command === 'bridge-right' ||
    command === 'trolley-fwd' ||
    command === 'trolley-back'
  ) {
    if (state.loadYFt <= load.heightFt / 2 + 0.05 && state.slackRemainingFt > 0.05) {
      // Cannot drag grounded load horizontally without hoisting clear first
      nextState.phase = 'stopped';
      nextState.activeCommand = 'stop';
    } else {
      nextState.phase = 'suspended';
    }
  }

  return nextState;
}

function buildFailureAnalysis(
  cause: LiftFailureCause,
  state: RiggingSimulationState,
  statics: RiggingStaticsResult,
  sling: RiggingSlingSpec,
  shackle: RiggingShackleSpec
): LiftFailureAnalysis {
  const peakLeft = Math.max(
    state.liveTensionLeftLb,
    ...state.frames.map((f) => f.liveTensionLeftLb)
  );
  const peakRight = Math.max(
    state.liveTensionRightLb,
    ...state.frames.map((f) => f.liveTensionRightLb)
  );
  const peakTilt = Math.max(
    Math.abs(state.tiltZDeg),
    ...state.frames.map((f) => Math.abs(f.tiltZDeg))
  );

  switch (cause) {
    case 'damaged-hardware-failure':
      return {
        occurred: true,
        cause,
        title: 'Defective / Untagged Sling Failure',
        overloadedPart: sling.name,
        primaryReason:
          sling.condition === 'missing-tag'
            ? 'Untagged synthetic sling rejected / failed unverified capacity limit.'
            : 'Pre-existing broken wires and kinking caused premature wire rope parting.',
        physicsExplanation:
          'Damaged or untagged rigging loses unpredictable structural reserve factor even below nominal book WLL.',
        recommendedCorrections: [
          'Perform mandatory pre-lift inspection and tag out damaged or untagged slings.',
          'Select a serviceable rated sling matching the load weight and hitch factor.',
        ],
        peakLeftTensionLb: Math.round(peakLeft),
        peakRightTensionLb: Math.round(peakRight),
        peakTiltDeg: Math.round(peakTilt * 10) / 10,
        timeOfFailureSec: Math.round(state.tSec * 100) / 100,
      };
    case 'unsecured-connection-slip':
      return {
        occurred: true,
        cause,
        title: 'Unsecured Shackle Pin Release',
        overloadedPart: shackle.name,
        primaryReason: 'Shackle pin was not fully seated/tightened prior to taking tension.',
        physicsExplanation:
          'Under initial lift-off load and slight rotational torque, an unseated screw or bolt pin rotates free and drops the leg.',
        recommendedCorrections: [
          'Seat and tighten all shackle pins (use bolt-type shackles with cotter pins for dynamic/vessel lifts).',
          'Perform a 6-inch Test Lift to verify positive connection before raising higher.',
        ],
        peakLeftTensionLb: Math.round(peakLeft),
        peakRightTensionLb: Math.round(peakRight),
        peakTiltDeg: Math.round(peakTilt * 10) / 10,
        timeOfFailureSec: Math.round(state.tSec * 100) / 100,
      };
    case 'sharp-edge-cut':
      return {
        occurred: true,
        cause,
        title: 'Sharp-Edge Sling Cut Failure',
        overloadedPart: sling.name,
        primaryReason: 'Unprotected 90-degree steel corner sheared sling fibres/strands under tension.',
        physicsExplanation:
          'Concentrated bearing pressure at a sharp plate or flange edge multiplies local shear stress well above tensile WLL.',
        recommendedCorrections: [
          'Install Edge Softeners / corner pads at all contact edges.',
          'Consider Alloy Chain or a Spreader Beam to keep sling contact vertical and protected.',
        ],
        peakLeftTensionLb: Math.round(peakLeft),
        peakRightTensionLb: Math.round(peakRight),
        peakTiltDeg: Math.round(peakTilt * 10) / 10,
        timeOfFailureSec: Math.round(state.tSec * 100) / 100,
      };
    case 'sling-overload-angle':
      return {
        occurred: true,
        cause,
        title: 'Shallow Sling Angle Overload',
        overloadedPart: peakLeft >= peakRight ? 'Left Sling Leg (A)' : 'Right Sling Leg (B)',
        primaryReason: `Horizontal sling angle (${statics.minHorizontalAngleDeg.toFixed(1)}°) multiplied leg tension above safe limits.`,
        physicsExplanation:
          'As horizontal sling angle θ drops below 30°, T = W / (2 sin θ) exceeds 100% of total load weight per leg plus dynamic hoisting acceleration.',
        recommendedCorrections: [
          'Lengthen both slings to achieve >= 60° horizontal angle.',
          'Move lifting points inward (if load allows) or insert a Spreader Beam.',
        ],
        peakLeftTensionLb: Math.round(peakLeft),
        peakRightTensionLb: Math.round(peakRight),
        peakTiltDeg: Math.round(peakTilt * 10) / 10,
        timeOfFailureSec: Math.round(state.tSec * 100) / 100,
      };
    case 'sling-overload-asymmetric':
      return {
        occurred: true,
        cause,
        title: 'Asymmetric / WLL Sling Overload',
        overloadedPart: peakLeft >= peakRight ? 'Left Sling Leg (A)' : 'Right Sling Leg (B)',
        primaryReason: `Peak leg tension (${Math.max(peakLeft, peakRight).toLocaleString()} lb) exceeded effective WLL (${statics.leftLeg.effectiveWllLb.toLocaleString()} lb).`,
        physicsExplanation:
          'CG offset or choker hitch derating concentrated excessive share of load onto one leg, exceeding simulated structural limit.',
        recommendedCorrections: [
          'Step up to a higher-WLL sling (5/8", 3/4" wire rope, or Grade 100 chain).',
          'Re-position pick points symmetrically around true CG or change from choker to basket/spreader.',
        ],
        peakLeftTensionLb: Math.round(peakLeft),
        peakRightTensionLb: Math.round(peakRight),
        peakTiltDeg: Math.round(peakTilt * 10) / 10,
        timeOfFailureSec: Math.round(state.tSec * 100) / 100,
      };
    case 'shackle-overload':
      return {
        occurred: true,
        cause,
        title: 'Shackle Capacity / Side-Load Failure',
        overloadedPart: shackle.name,
        primaryReason: `Leg force (${Math.max(peakLeft, peakRight).toLocaleString()} lb) exceeded rated shackle WLL (${shackle.wllLb.toLocaleString()} lb).`,
        physicsExplanation:
          'Undersized or side-loaded shackles deform at the bow and shear pins when shallow angles compound tensile load.',
        recommendedCorrections: [
          'Upgrade to a 3/4" (4.75T) or 1" (8.5T) Bolt-Type Anchor Shackle.',
          'Increase sling angle above 60° to reduce shackle side-loading.',
        ],
        peakLeftTensionLb: Math.round(peakLeft),
        peakRightTensionLb: Math.round(peakRight),
        peakTiltDeg: Math.round(peakTilt * 10) / 10,
        timeOfFailureSec: Math.round(state.tSec * 100) / 100,
      };
    case 'excessive-tilt-drop':
      return {
        occurred: true,
        cause,
        title: 'Unbalanced CG Load Shift & Drop',
        overloadedPart: 'Attachment Geometry / Balance',
        primaryReason: `Severe CG misalignment produced ${peakTilt.toFixed(1)}° load tilt and rigging slip.`,
        physicsExplanation:
          'When the crane hook sits far from the centre of gravity, gravity exerts an overturning torque τ = W · Δx until the load swings violently and slips.',
        recommendedCorrections: [
          'Align attachment points to straddle the true CG marker.',
          'Equalize left/right sling lengths so the hook hangs directly above CG.',
        ],
        peakLeftTensionLb: Math.round(peakLeft),
        peakRightTensionLb: Math.round(peakRight),
        peakTiltDeg: Math.round(peakTilt * 10) / 10,
        timeOfFailureSec: Math.round(state.tSec * 100) / 100,
      };
    case 'obstacle-collision':
      return {
        occurred: true,
        cause,
        title: 'Structural Stanchion Collision',
        overloadedPart: 'Crane Bridge / Load Impact',
        primaryReason: state.collisionDetail ?? 'Suspended load struck bay stanchion or barrier.',
        physicsExplanation:
          'Excessive bridge/trolley travel or unchecked pendulum swing drove the load beyond safe shop bay clearance.',
        recommendedCorrections: [
          'Hoist load cleanly above floor obstacles, attach a tag line, and travel smoothly.',
          'Use Stop or Emergency Stop before approaching bay columns.',
        ],
        peakLeftTensionLb: Math.round(peakLeft),
        peakRightTensionLb: Math.round(peakRight),
        peakTiltDeg: Math.round(peakTilt * 10) / 10,
        timeOfFailureSec: Math.round(state.tSec * 100) / 100,
      };
    default:
      return {
        occurred: false,
        cause: 'none',
        title: 'Nominal Lift',
        overloadedPart: 'None',
        primaryReason: 'All parameters stayed within simulated safe bounds.',
        physicsExplanation: 'Static and dynamic tensions remained below rated limits.',
        recommendedCorrections: [],
        peakLeftTensionLb: Math.round(peakLeft),
        peakRightTensionLb: Math.round(peakRight),
        peakTiltDeg: Math.round(peakTilt * 10) / 10,
        timeOfFailureSec: null,
      };
  }
}

export function stepRiggingSimulation(
  prev: RiggingSimulationState,
  dtSec: number,
  load: LoadDefinition,
  config: RiggingConfiguration,
  statics: RiggingStaticsResult,
  sling: RiggingSlingSpec,
  shackle: RiggingShackleSpec,
  options: {
    environment: EnvironmentMode;
    requiresSignalControl?: boolean;
  }
): RiggingSimulationState {
  const dt = Math.min(0.05, Math.max(0.004, dtSec));
  const next: RiggingSimulationState = {
    ...prev,
    tSec: prev.tSec + dt,
  };

  const floorLoadCenterY = load.heightFt / 2;
  const pickPlaneOffset = load.heightFt / 2;
  const tautHookOffsetAboveLoadCenter = pickPlaneOffset + Math.max(2, statics.hookHeightAbovePickFt);
  const testLiftHookY = floorLoadCenterY + 0.55 + tautHookOffsetAboveLoadCenter;

  // Signal-loss dead-man failsafe: if operating in Signal Mode and actively moving for >3.8s without signal refresh, safe Stop
  if (
    options.requiresSignalControl &&
    !next.failed &&
    !next.emergencyStopLatched &&
    next.activeCommand !== 'idle' &&
    next.activeCommand !== 'stop' &&
    next.activeCommand !== 'emergency-stop' &&
    next.lastSignalIssuedAtSec !== null &&
    next.tSec - next.lastSignalIssuedAtSec > 3.8
  ) {
    next.activeCommand = 'stop';
    next.phase = next.loadYFt <= floorLoadCenterY + 0.03 ? 'grounded' : 'stopped';
    next.signalCommsLost = true;
  }

  // Handle post-failure deterministic fall/settle so replay shows drop & tilt
  if (next.failed) {
    if (next.loadYFt > floorLoadCenterY) {
      next.loadVy -= 32.174 * dt;
      next.loadYFt = Math.max(floorLoadCenterY, next.loadYFt + next.loadVy * dt);
      next.tiltZDeg = Math.max(-38, Math.min(38, next.tiltZDeg + next.tiltZVelDeg * dt));
    } else {
      next.loadVy = 0;
      next.tiltZVelDeg *= 0.8;
    }
    const frame = {
      tSec: Math.round(next.tSec * 1000) / 1000,
      phase: next.phase,
      craneXFt: next.craneXFt,
      craneZFt: next.craneZFt,
      hookYFt: next.hookYFt,
      loadXFt: next.loadXFt,
      loadYFt: next.loadYFt,
      loadZFt: next.loadZFt,
      tiltZDeg: next.tiltZDeg,
      tiltXDeg: next.tiltXDeg,
      swingXDeg: next.swingXDeg,
      swingZDeg: next.swingZDeg,
      velYFtPerSec: next.loadVy,
      liveTensionLeftLb: 0,
      liveTensionRightLb: 0,
      dynamicFactor: 1,
      slackRemainingFt: next.slackRemainingFt,
      grounded: next.loadYFt <= floorLoadCenterY + 0.03,
      collisionActive: next.collisionCount > 0,
      failed: true,
      failureCause: next.failureCause,
    };
    if (next.frames.length < 1800) {
      next.frames = [...next.frames, frame];
    }
    return next;
  }

  // Crane kinematic velocities (ft/sec)
  let hookVelY = 0;
  let craneVelX = 0;
  let craneVelZ = 0;

  if (!next.emergencyStopLatched && next.phase !== 'stopped') {
    switch (next.activeCommand) {
      case 'take-slack':
        if (next.slackRemainingFt > 0.02) {
          hookVelY = 1.1;
        } else {
          hookVelY = 0;
          next.activeCommand = 'stop';
          next.phase = 'stopped';
        }
        break;
      case 'test-lift':
        if (next.hookYFt < testLiftHookY - 0.03) {
          hookVelY = 1.25;
        } else {
          hookVelY = 0;
          next.hookYFt = testLiftHookY;
          next.activeCommand = 'stop';
          next.phase = 'test-lift-hold';
        }
        break;
      case 'hoist':
        if (next.hookYFt < 18.5) {
          hookVelY = 2.0;
        } else {
          hookVelY = 0;
        }
        break;
      case 'lower':
        if (next.loadYFt > floorLoadCenterY + 0.01) {
          hookVelY = -1.6;
        } else if (next.slackRemainingFt < 1.25) {
          hookVelY = -0.8;
        } else {
          hookVelY = 0;
          next.activeCommand = 'stop';
        }
        break;
      case 'bridge-left':
        craneVelX = -3.2;
        break;
      case 'bridge-right':
        craneVelX = 3.2;
        break;
      case 'trolley-fwd':
        craneVelZ = 2.6;
        break;
      case 'trolley-back':
        craneVelZ = -2.6;
        break;
      default:
        break;
    }
  }

  const prevCraneVx = (next.craneXFt - prev.craneXFt) / dt;
  const prevCraneVz = (next.craneZFt - prev.craneZFt) / dt;

  next.craneXFt = Math.max(-16.0, Math.min(16.0, next.craneXFt + craneVelX * dt));
  next.craneZFt = Math.max(-7.5, Math.min(7.5, next.craneZFt + craneVelZ * dt));
  next.hookYFt = Math.max(floorLoadCenterY + 1.5, Math.min(19.0, next.hookYFt + hookVelY * dt));

  const desiredLoadYFromHook = next.hookYFt - tautHookOffsetAboveLoadCenter;
  const isTaut = desiredLoadYFromHook >= floorLoadCenterY - 0.01;
  next.slackRemainingFt = Math.max(0, floorLoadCenterY - desiredLoadYFromHook);

  const accelX = (craneVelX - prevCraneVx) / dt;
  const accelZ = (craneVelZ - prevCraneVz) / dt;

  if (!isTaut) {
    // Grounded with slack in slings
    next.loadYFt = floorLoadCenterY;
    next.loadVy = 0;
    next.tiltZDeg *= 0.85;
    next.tiltZVelDeg = 0;
    next.swingXDeg *= 0.85;
    next.swingZDeg *= 0.85;
    next.liveTensionLeftLb = 0;
    next.liveTensionRightLb = 0;
    next.dynamicFactor = 1.0;

    const distToTarget = Math.hypot(
      next.loadXFt - next.targetZoneXFt,
      next.loadZFt - next.targetZoneZFt
    );
    if ((prev.landedInTarget || prev.activeCommand === 'lower') && distToTarget <= 2.2) {
      next.landedInTarget = true;
      next.phase = 'landed-target';
    } else if (next.phase !== 'taking-slack' && next.phase !== 'emergency-stopped') {
      next.phase = 'grounded';
    }
  } else {
    // Load suspended or lifting off deck
    const prevLoadVy = next.loadVy;
    next.loadYFt = Math.max(floorLoadCenterY, desiredLoadYFromHook);
    next.loadVy = hookVelY;

    // Rotational tilt toward static CG equilibrium
    const targetTilt = statics.valid ? statics.predictedStaticTiltDeg : 0;
    const tiltError = targetTilt - next.tiltZDeg;
    const tiltAccel = 18.0 * tiltError - 4.2 * next.tiltZVelDeg;
    next.tiltZVelDeg += tiltAccel * dt;
    next.tiltZDeg += next.tiltZVelDeg * dt;

    // Pendulum sway around hook (excited by crane acceleration, offset hook start, and outdoor wind)
    const effPendulumLen = Math.max(4, tautHookOffsetAboveLoadCenter);
    const omegaSq = 32.174 / effPendulumLen;
    const damping = config.tagLineAttached
      ? 2.1
      : options.environment === 'outdoor-yard'
      ? 0.35
      : 0.65;
    const windGustX =
      options.environment === 'outdoor-yard' && !config.tagLineAttached
        ? Math.sin(next.tSec * 1.4) * 1.1
        : 0;
    const targetSwXFromPull = Math.max(-14, Math.min(14, (next.craneXFt - next.loadXFt) * 3.5));

    const swingXAcc =
      -omegaSq * (next.swingXDeg - targetSwXFromPull * 0.25) -
      damping * next.swingXVel -
      accelX * 1.2 +
      windGustX;
    const swingZAcc =
      -omegaSq * next.swingZDeg - damping * next.swingZVel - accelZ * 1.2;

    next.swingXVel += swingXAcc * dt;
    next.swingXDeg = Math.max(-18, Math.min(18, next.swingXDeg + next.swingXVel * dt));
    next.swingZVel += swingZAcc * dt;
    next.swingZDeg = Math.max(-18, Math.min(18, next.swingZDeg + next.swingZVel * dt));

    // Load world X/Z follows crane with pendulum swing displacement
    const swingRadX = (next.swingXDeg * Math.PI) / 180;
    const swingRadZ = (next.swingZDeg * Math.PI) / 180;
    next.loadXFt += (next.craneXFt + Math.sin(swingRadX) * 2.4 - next.loadXFt) * Math.min(1, 6.5 * dt);
    next.loadZFt += (next.craneZFt + Math.sin(swingRadZ) * 2.4 - next.loadZFt) * Math.min(1, 6.5 * dt);

    // Dynamic load factor from vertical hoist acceleration & initial liftoff jerk
    const verticalAccG = Math.max(0, (next.loadVy - prevLoadVy) / dt / 32.174);
    const liftoffTransient = next.loadYFt - floorLoadCenterY < 0.2 && next.loadVy > 0.2 ? 0.08 : 0;
    next.dynamicFactor = Math.round((1.0 + Math.min(0.28, verticalAccG * 0.4 + liftoffTransient)) * 100) / 100;

    next.liveTensionLeftLb = Math.round(statics.leftLeg.tensionLb * next.dynamicFactor);
    next.liveTensionRightLb = Math.round(statics.rightLeg.tensionLb * next.dynamicFactor);

    // Phase classification while taut
    if (next.loadYFt <= floorLoadCenterY + 0.03) {
      const distToTarget = Math.hypot(
        next.loadXFt - next.targetZoneXFt,
        next.loadZFt - next.targetZoneZFt
      );
      if (distToTarget <= 2.2) {
        next.landedInTarget = true;
        next.phase = 'landed-target';
      } else {
        next.landedInTarget = false;
      }
    } else if (next.phase !== 'test-lift-hold' && !next.emergencyStopLatched && next.activeCommand !== 'stop') {
      next.phase = next.activeCommand === 'lower' ? 'lowering' : 'suspended';
    }

    // Check bay column / boundary collisions
    const halfLen = load.lengthFt / 2;
    const nearLeftWall = next.loadXFt - halfLen < -21.0;
    const nearRightWall = next.loadXFt + halfLen > 21.0;
    if (nearLeftWall || nearRightWall) {
      next.collisionCount += 1;
      next.collisionDetail = nearLeftWall
        ? 'Load struck West bay column boundary.'
        : 'Load struck East bay column boundary.';
      next.failed = true;
      next.failureCause = 'obstacle-collision';
      next.phase = 'failed';
      next.failureAnalysis = buildFailureAnalysis(
        'obstacle-collision',
        next,
        statics,
        sling,
        shackle
      );
    }

    // Deterministic failure checks once load bears full weight (clear of blocking > 0.06 ft)
    if (!next.failed && next.loadYFt > floorLoadCenterY + 0.06) {
      let triggeredCause: LiftFailureCause = 'none';

      if (sling.condition === 'damaged-frayed' || sling.condition === 'missing-tag') {
        triggeredCause = 'damaged-hardware-failure';
      } else if (!config.shacklePinTightened) {
        triggeredCause = 'unsecured-connection-slip';
      } else if (
        (load.sharpEdges ||
          load.attachmentPoints.some(
            (p) => (p.id === config.leftPointId || p.id === config.rightPointId) && p.requiresSoftener
          )) &&
        !config.useEdgeSofteners &&
        sling.category !== 'alloy-chain'
      ) {
        triggeredCause = 'sharp-edge-cut';
      } else if (Math.abs(next.tiltZDeg) > 17.5 || Math.abs(statics.predictedStaticTiltDeg) > 16) {
        triggeredCause = 'excessive-tilt-drop';
      } else if (
        statics.minHorizontalAngleDeg < 30 &&
        Math.max(next.liveTensionLeftLb, next.liveTensionRightLb) > statics.leftLeg.effectiveWllLb * 1.05
      ) {
        triggeredCause = 'sling-overload-angle';
      } else if (
        Math.max(next.liveTensionLeftLb, next.liveTensionRightLb) >
        statics.leftLeg.effectiveWllLb * 1.1
      ) {
        triggeredCause = 'sling-overload-asymmetric';
      } else if (
        Math.max(next.liveTensionLeftLb, next.liveTensionRightLb) >
        shackle.wllLb * 1.15
      ) {
        triggeredCause = 'shackle-overload';
      }

      if (triggeredCause !== 'none') {
        next.failed = true;
        next.failureCause = triggeredCause;
        next.phase = 'failed';
        next.tiltZVelDeg = statics.predictedStaticTiltDeg >= 0 ? 18 : -18;
        next.failureAnalysis = buildFailureAnalysis(triggeredCause, next, statics, sling, shackle);
      }
    }
  }

  const frame = {
    tSec: Math.round(next.tSec * 1000) / 1000,
    phase: next.phase,
    craneXFt: Math.round(next.craneXFt * 1000) / 1000,
    craneZFt: Math.round(next.craneZFt * 1000) / 1000,
    hookYFt: Math.round(next.hookYFt * 1000) / 1000,
    loadXFt: Math.round(next.loadXFt * 1000) / 1000,
    loadYFt: Math.round(next.loadYFt * 1000) / 1000,
    loadZFt: Math.round(next.loadZFt * 1000) / 1000,
    tiltZDeg: Math.round(next.tiltZDeg * 100) / 100,
    tiltXDeg: Math.round(next.tiltXDeg * 100) / 100,
    swingXDeg: Math.round(next.swingXDeg * 100) / 100,
    swingZDeg: Math.round(next.swingZDeg * 100) / 100,
    velYFtPerSec: Math.round(next.loadVy * 100) / 100,
    liveTensionLeftLb: next.liveTensionLeftLb,
    liveTensionRightLb: next.liveTensionRightLb,
    dynamicFactor: next.dynamicFactor,
    slackRemainingFt: Math.round(next.slackRemainingFt * 100) / 100,
    grounded: next.loadYFt <= floorLoadCenterY + 0.03,
    collisionActive: next.collisionCount > 0,
    failed: next.failed,
    failureCause: next.failureCause,
  };

  if (next.frames.length < 1800) {
    next.frames = [...next.frames, frame];
  }

  return next;
}

export function evaluateRiggingAttempt(
  state: RiggingSimulationState,
  statics: RiggingStaticsResult,
  scenario: RiggingScenario,
  mode: RiggingTrainingMode,
  config: RiggingConfiguration,
  usedSignalMode: boolean
): RiggingSessionRecord {
  const peakTilt = Math.max(0, ...state.frames.map((f) => Math.abs(f.tiltZDeg)));
  const peakTension = Math.max(0, ...state.frames.map((f) => Math.max(f.liveTensionLeftLb, f.liveTensionRightLb)));

  const criteria = [
    {
      label: 'Pre-Lift Hardware Inspection & Secured Pins',
      passed: config.inspectedHardware && config.shacklePinTightened,
      detail:
        config.inspectedHardware && config.shacklePinTightened
          ? 'Hardware inspected and pins secured.'
          : 'Pre-lift inspection or pin security incomplete.',
    },
    {
      label: `Safe Sling Angle (>= ${scenario.minAllowedAngleDeg}°)`,
      passed: statics.valid && statics.minHorizontalAngleDeg >= scenario.minAllowedAngleDeg,
      detail: `Measured minimum angle: ${statics.minHorizontalAngleDeg.toFixed(1)}°`,
    },
    {
      label: 'Tension Within Effective Sling & Shackle WLL',
      passed:
        statics.valid &&
        statics.leftLeg.utilizationPct <= 100 &&
        statics.rightLeg.utilizationPct <= 100 &&
        !state.failed,
      detail: `Max leg utilization: ${Math.max(statics.leftLeg.utilizationPct, statics.rightLeg.utilizationPct).toFixed(1)}%`,
    },
    {
      label: `Load Balance & Tilt Control (<= ${scenario.maxAllowedTiltDeg}°)`,
      passed: Math.abs(statics.predictedStaticTiltDeg) <= scenario.maxAllowedTiltDeg && peakTilt <= scenario.maxAllowedTiltDeg + 1.5,
      detail: `Peak tilt: ${peakTilt.toFixed(1)}°`,
    },
    {
      label: 'Target Zone Placement & Zero Collisions',
      passed: state.landedInTarget && state.collisionCount === 0 && !state.failed,
      detail: state.landedInTarget ? 'Landed inside target bay pad.' : 'Load not yet landed in target bay.',
    },
  ];

  if (scenario.requiresTagLine) {
    criteria.push({
      label: 'Tag Line Control Attached',
      passed: config.tagLineAttached,
      detail: config.tagLineAttached ? 'Tag line attached for swing damping.' : 'Tag line omitted.',
    });
  }
  if (scenario.requiresSignalControl) {
    criteria.push({
      label: 'Standardized Hand-Signal Crane Operation',
      passed: usedSignalMode,
      detail: usedSignalMode ? 'Operated via crane hand signals.' : 'Direct buttons used instead of hand signals.',
    });
  }

  const passedCount = criteria.filter((c) => c.passed).length;
  const scorePct = Math.round((passedCount / criteria.length) * 100);
  const passed = criteria.every((c) => c.passed);

  return {
    id: `rig-${Date.now()}`,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    mode,
    completedAt: new Date().toISOString(),
    passed,
    scorePct,
    maxTensionLb: Math.round(peakTension || statics.maxTensionLb),
    minAngleDeg: statics.minHorizontalAngleDeg,
    peakTiltDeg: Math.round(peakTilt * 10) / 10,
    failureCause: state.failureCause,
    criteriaBreakdown: criteria,
  };
}

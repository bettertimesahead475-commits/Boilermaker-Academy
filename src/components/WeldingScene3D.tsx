import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  CameraPreset,
  GraphicsQuality,
  MachineSettings,
  WeldInstantMetrics,
  WeldSamplePoint,
} from '../types/academy';
import { ELECTRODE_PROFILES } from '../utils/weldingPhysics';

export interface LivePose {
  progress: number; // 0..1 along 6-inch seam
  lateralOffsetMm: number; // -6..+6 mm
  arcLengthMm: number; // 0.5..8.0 mm
  travelAngleDeg: number; // -25..+35 deg (positive = drag)
  workAngleDeg: number; // 15..120 deg
  electrodeRemainingPct: number; // 0..100
}

interface WeldingScene3DProps {
  settings: MachineSettings;
  pose: LivePose;
  arcActive: boolean;
  instantMetrics: WeldInstantMetrics | null;
  samples: WeldSamplePoint[];
  slagChipped: boolean;
  showDefectOverlay: boolean;
  cameraPreset: CameraPreset;
  graphicsQuality: GraphicsQuality;
  isReplaying: boolean;
  onAimJoint: (progress: number, lateralOffsetMm: number) => void;
  onSetTrigger: (active: boolean) => void;
}

const SEAM_HALF_LEN = 1.5; // Total seam length = 3.0 world units (= 6 inches -> 0.5 units per inch)
const MAX_BEAD_INSTANCES = 320;
const SPARK_COUNT = 72;
const SMOKE_COUNT = 26;

// Reusable scratch objects (zero per-frame allocations)
const _dummy = new THREE.Object3D();
const _color = new THREE.Color();
const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _localHit = new THREE.Vector3();

function createProceduralTextures() {
  // 1. Mill-scale / brushed steel plate albedo
  const steelCanvas = document.createElement('canvas');
  steelCanvas.width = 256;
  steelCanvas.height = 256;
  const sCtx = steelCanvas.getContext('2d')!;
  sCtx.fillStyle = '#48525e';
  sCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const w = 8 + Math.random() * 44;
    const v = 58 + Math.floor(Math.random() * 34);
    sCtx.fillStyle = `rgba(${v},${v + 5},${v + 12},0.18)`;
    sCtx.fillRect(x, y, w, 1.5);
  }
  const steelColorMap = new THREE.CanvasTexture(steelCanvas);
  steelColorMap.colorSpace = THREE.SRGBColorSpace;
  steelColorMap.wrapS = THREE.RepeatWrapping;
  steelColorMap.wrapT = THREE.RepeatWrapping;
  steelColorMap.repeat.set(2, 2);

  // 2. Roughness map (linear)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 256;
  roughCanvas.height = 256;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#888888';
  rCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1200; i++) {
    const g = 95 + Math.floor(Math.random() * 90);
    rCtx.fillStyle = `rgb(${g},${g},${g})`;
    rCtx.fillRect(Math.random() * 256, Math.random() * 256, 10 + Math.random() * 28, 2);
  }
  const steelRoughMap = new THREE.CanvasTexture(roughCanvas);
  steelRoughMap.wrapS = THREE.RepeatWrapping;
  steelRoughMap.wrapT = THREE.RepeatWrapping;

  // 3. Industrial floor concrete texture
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = 256;
  floorCanvas.height = 256;
  const fCtx = floorCanvas.getContext('2d')!;
  fCtx.fillStyle = '#141b24';
  fCtx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const c = 18 + Math.floor(Math.random() * 18);
    fCtx.fillStyle = `rgba(${c},${c + 5},${c + 12},0.45)`;
    fCtx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
  }
  fCtx.strokeStyle = 'rgba(255,255,255,0.03)';
  fCtx.lineWidth = 1;
  fCtx.strokeRect(0, 0, 256, 256);
  const floorMap = new THREE.CanvasTexture(floorCanvas);
  floorMap.colorSpace = THREE.SRGBColorSpace;
  floorMap.wrapS = THREE.RepeatWrapping;
  floorMap.wrapT = THREE.RepeatWrapping;
  floorMap.repeat.set(8, 8);

  // 4. Leather glove pebble texture
  const gloveCanvas = document.createElement('canvas');
  gloveCanvas.width = 128;
  gloveCanvas.height = 128;
  const gCtx = gloveCanvas.getContext('2d')!;
  gCtx.fillStyle = '#8b5a2b';
  gCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 450; i++) {
    const shade = Math.random() > 0.5 ? 'rgba(210,160,100,0.22)' : 'rgba(60,32,12,0.25)';
    gCtx.fillStyle = shade;
    gCtx.beginPath();
    gCtx.arc(Math.random() * 128, Math.random() * 128, 1.5 + Math.random() * 2.5, 0, Math.PI * 2);
    gCtx.fill();
  }
  const gloveMap = new THREE.CanvasTexture(gloveCanvas);
  gloveMap.colorSpace = THREE.SRGBColorSpace;

  return { steelColorMap, steelRoughMap, floorMap, gloveMap };
}

const EnvironmentSetup: React.FC = () => {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    return () => {
      scene.environment = null;
      envRT.dispose();
      roomEnv.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

function getCouponTransform(position: MachineSettings['position']): {
  pos: [number, number, number];
  rot: [number, number, number];
} {
  switch (position) {
    case '1F':
      return { pos: [0, 0.85, 0], rot: [-Math.PI / 4, 0, 0] };
    case '1G':
      return { pos: [0, 0.82, 0], rot: [0, 0, 0] };
    case '2F':
      return { pos: [0, 0.82, 0], rot: [0, 0, 0] };
    case '2G':
      return { pos: [0, 1.15, -0.1], rot: [Math.PI / 2, 0, 0] };
    case '3F-UP':
    case '3G-UP':
      return { pos: [0, 1.45, -0.1], rot: [0, 0, Math.PI / 2] };
    case '3F-DOWN':
    case '3G-DOWN':
      return { pos: [0, 1.45, -0.1], rot: [0, 0, -Math.PI / 2] };
    case '4F':
    case '4G':
      return { pos: [0, 1.85, 0], rot: [Math.PI, 0, 0] };
    default:
      return { pos: [0, 0.85, 0], rot: [0, 0, 0] };
  }
}

interface InnerSceneProps extends WeldingScene3DProps {
  isSoftwareGl: boolean;
}

const WeldingWorkshopInner: React.FC<InnerSceneProps> = ({
  settings,
  pose,
  arcActive,
  instantMetrics,
  samples,
  slagChipped,
  showDefectOverlay,
  cameraPreset,
  graphicsQuality,
  isReplaying,
  isSoftwareGl,
  onAimJoint,
  onSetTrigger,
}) => {
  const { camera } = useThree();
  const textures = useMemo(() => createProceduralTextures(), []);

  useEffect(() => {
    return () => {
      textures.steelColorMap.dispose();
      textures.steelRoughMap.dispose();
      textures.floorMap.dispose();
      textures.gloveMap.dispose();
    };
  }, [textures]);

  const couponGroupRef = useRef<THREE.Group>(null);
  const arcLightRef = useRef<THREE.PointLight>(null);
  const puddleRef = useRef<THREE.Mesh>(null);
  const beadMeshRef = useRef<THREE.InstancedMesh>(null);
  const slagMeshRef = useRef<THREE.InstancedMesh>(null);
  const defectMeshRef = useRef<THREE.InstancedMesh>(null);
  const sparkMeshRef = useRef<THREE.InstancedMesh>(null);
  const smokeGroupRef = useRef<THREE.Group>(null);

  const [isDraggingSeam, setIsDraggingSeam] = useState(false);

  const couponTransform = useMemo(() => getCouponTransform(settings.position), [settings.position]);
  const plateThicknessScale = Math.max(0.7, Math.min(1.8, settings.materialThicknessIn / 0.375));
  const profile = ELECTRODE_PROFILES[settings.electrode];

  // Spark & smoke deterministic particle state pools (allocated once)
  const sparkPool = useMemo(
    () =>
      Array.from({ length: SPARK_COUNT }, () => ({
        x: 0,
        y: -10,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        life: 0,
        maxLife: 0.4,
      })),
    []
  );
  const smokePool = useMemo(
    () =>
      Array.from({ length: SMOKE_COUNT }, (_, i) => ({
        x: 0,
        y: -10,
        z: 0,
        vy: 0.45 + (i % 5) * 0.08,
        driftX: (Math.random() - 0.5) * 0.14,
        driftZ: (Math.random() - 0.5) * 0.14,
        age: i / SMOKE_COUNT,
      })),
    []
  );

  // Seam tip local position (in CouponAssembly space)
  const seamX = -SEAM_HALF_LEN + pose.progress * (SEAM_HALF_LEN * 2);
  const seamLateral = pose.lateralOffsetMm * 0.018;
  const isFilletOrLap = settings.jointPrep === 't-fillet' || settings.jointPrep === 'lap';

  // Surface normal bisector in local CouponAssembly coordinates
  const bisectorAngle = isFilletOrLap ? Math.PI / 4 : Math.PI / 2;
  const arcGapUnits = Math.max(0.015, pose.arcLengthMm * 0.018);

  // Compute tool angle quaternion in local coupon coordinates
  // Work angle tilts laterally across the joint; Travel angle tilts along X (drag tilts back toward -X)
  const workTiltRad = ((pose.workAngleDeg - (isFilletOrLap ? 45 : 90)) * Math.PI) / 180;
  const bisectorNormalRad = isFilletOrLap ? Math.PI / 4 : 0; // tilt 45 deg toward +Z for T/Lap corner
  const travelTiltRad = (pose.travelAngleDeg * Math.PI) / 180;

  // Electrode / Gun length visuals
  const isWireProcess = settings.process === 'FCAW-G' || settings.process === 'FCAW-S' || settings.process === 'GMAW';
  const rodLengthUnits = isWireProcess ? 0.14 : Math.max(0.14, (pose.electrodeRemainingPct / 100) * 0.72);
  const rodColor =
    settings.electrode === 'E6010' || settings.electrode === 'E6011'
      ? '#8b3e2f'
      : settings.electrode === 'E6013'
      ? '#9b856b'
      : '#4b5563';

  // Sync dynamic weld bead, slag crust, and defect markers whenever samples / slag state update
  useEffect(() => {
    const beadMesh = beadMeshRef.current;
    const slagMesh = slagMeshRef.current;
    const defectMesh = defectMeshRef.current;
    if (!beadMesh || !slagMesh || !defectMesh) return;

    const visibleCount = Math.min(samples.length, MAX_BEAD_INSTANCES);
    const nowMs = samples.length > 0 ? samples[samples.length - 1].tMs : 0;

    for (let i = 0; i < MAX_BEAD_INSTANCES; i++) {
      if (i >= visibleCount) {
        _dummy.position.set(0, -50, 0);
        _dummy.scale.set(0.0001, 0.0001, 0.0001);
        _dummy.updateMatrix();
        beadMesh.setMatrixAt(i, _dummy.matrix);
        slagMesh.setMatrixAt(i, _dummy.matrix);
        defectMesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }

      const s = samples[i];
      const bx = -SEAM_HALF_LEN + s.progress * (SEAM_HALF_LEN * 2);
      const bz = s.lateralOffsetMm * 0.018;
      const by = isFilletOrLap ? 0.025 : 0.012;

      const widthScale = Math.max(0.045, s.beadWidthMm * 0.0115);
      const heightScale = Math.max(0.028, s.reinforcementMm * 0.016);
      const lengthScale = 0.055;

      // Porosity creates pitted/irregular bead profile; undercut thins edges visually
      const wobble = s.defects.porosity ? 0.82 : s.defects.excessiveBuildup ? 1.25 : 1.0;

      _dummy.position.set(bx, by, bz);
      _dummy.rotation.set(isFilletOrLap ? Math.PI / 4 : 0, 0, 0);
      _dummy.scale.set(lengthScale, heightScale * wobble, widthScale);
      _dummy.updateMatrix();
      beadMesh.setMatrixAt(i, _dummy.matrix);

      // Heat cooling glow color gradient
      const ageMs = Math.max(0, nowMs - s.tMs);
      const heat = Math.max(0, 1 - ageMs / 3500);
      if (heat > 0.72) {
        _color.setHex(0xffd27d);
      } else if (heat > 0.35) {
        _color.setHex(0xff6b2b);
      } else if (s.defects.porosity) {
        _color.setHex(0x3a3f47);
      } else if (s.defects.incompleteFusion) {
        _color.setHex(0x525b66);
      } else {
        _color.setHex(0x94a3b8);
      }
      beadMesh.setColorAt(i, _color);

      // Slag layer covers solidified SMAW/FCAW beads until chipped
      if (profile.slags && !slagChipped && ageMs > 450) {
        _dummy.position.set(bx, by + heightScale * 0.55, bz);
        _dummy.rotation.set(isFilletOrLap ? Math.PI / 4 : 0, 0, 0);
        _dummy.scale.set(lengthScale * 1.04, heightScale * 0.65, widthScale * 1.06);
        _dummy.updateMatrix();
        slagMesh.setMatrixAt(i, _dummy.matrix);
        _color.set(profile.slagColor);
        slagMesh.setColorAt(i, _color);
      } else {
        _dummy.position.set(0, -50, 0);
        _dummy.scale.set(0.0001, 0.0001, 0.0001);
        _dummy.updateMatrix();
        slagMesh.setMatrixAt(i, _dummy.matrix);
      }

      // Defect highlight marker (shown post-chip or when showDefectOverlay enabled)
      const hasDefect =
        s.defects.undercut ||
        s.defects.porosity ||
        s.defects.overlap ||
        s.defects.incompleteFusion ||
        s.defects.burnThrough;

      if (hasDefect && (showDefectOverlay || slagChipped)) {
        const edgeOffset = s.defects.undercut ? widthScale * 0.85 : 0;
        _dummy.position.set(bx, by + heightScale * 0.9, bz + edgeOffset);
        _dummy.rotation.set(0, 0, 0);
        _dummy.scale.set(0.032, 0.024, 0.032);
        _dummy.updateMatrix();
        defectMesh.setMatrixAt(i, _dummy.matrix);
        if (s.defects.undercut) _color.setHex(0xef4444);
        else if (s.defects.porosity) _color.setHex(0xf59e0b);
        else _color.setHex(0xa855f7);
        defectMesh.setColorAt(i, _color);
      } else {
        _dummy.position.set(0, -50, 0);
        _dummy.scale.set(0.0001, 0.0001, 0.0001);
        _dummy.updateMatrix();
        defectMesh.setMatrixAt(i, _dummy.matrix);
      }
    }

    beadMesh.instanceMatrix.needsUpdate = true;
    if (beadMesh.instanceColor) beadMesh.instanceColor.needsUpdate = true;
    slagMesh.instanceMatrix.needsUpdate = true;
    if (slagMesh.instanceColor) slagMesh.instanceColor.needsUpdate = true;
    defectMesh.instanceMatrix.needsUpdate = true;
    if (defectMesh.instanceColor) defectMesh.instanceColor.needsUpdate = true;
  }, [samples, slagChipped, showDefectOverlay, isFilletOrLap, profile.slags, profile.slagColor]);

  // Camera presets smoothly adapt to position (flat vs vertical vs overhead)
  useEffect(() => {
    if (cameraPreset === 'orbit') return;
    const isOverhead = settings.position === '4F' || settings.position === '4G';
    const isVertical = settings.position.startsWith('3');

    if (cameraPreset === 'first-person') {
      if (isOverhead) {
        _camTargetPos.set(0.25, 0.95, 1.35);
        _camLookAt.set(0, 1.85, 0);
      } else if (isVertical) {
        _camTargetPos.set(0.15, 1.35, 1.75);
        _camLookAt.set(0, 1.45, -0.1);
      } else {
        _camTargetPos.set(-0.15, 1.65, 1.55);
        _camLookAt.set(0, 0.85, 0);
      }
    } else if (cameraPreset === 'side') {
      _camTargetPos.set(0, couponTransform.pos[1] + (isOverhead ? -0.35 : 0.35), 2.15);
      _camLookAt.set(0, couponTransform.pos[1], couponTransform.pos[2]);
    } else if (cameraPreset === 'overhead') {
      if (isOverhead) {
        _camTargetPos.set(0, 0.55, 0.65);
        _camLookAt.set(0, 1.85, 0);
      } else {
        _camTargetPos.set(0, couponTransform.pos[1] + 1.95, 0.45);
        _camLookAt.set(0, couponTransform.pos[1], couponTransform.pos[2]);
      }
    }
    camera.position.copy(_camTargetPos);
    camera.lookAt(_camLookAt);
  }, [cameraPreset, settings.position, couponTransform, camera]);

  // Per-frame arc flicker, sparks, and rising smoke simulation
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const activeSparkCap =
      graphicsQuality === 'low' || isSoftwareGl ? 24 : graphicsQuality === 'medium' ? 48 : SPARK_COUNT;

    // 1. Arc light & puddle glow
    if (arcLightRef.current) {
      if (arcActive) {
        const flicker = 0.78 + Math.random() * 0.48;
        const stabilityBoost = instantMetrics ? instantMetrics.arcStability / 100 : 0.9;
        arcLightRef.current.intensity = (6.5 + (1 - stabilityBoost) * 3.5) * flicker;
      } else {
        arcLightRef.current.intensity = 0;
      }
    }

    if (puddleRef.current) {
      puddleRef.current.visible = arcActive;
      if (arcActive) {
        const pulse = 1 + Math.sin(performance.now() * 0.03) * 0.08;
        const w = instantMetrics ? instantMetrics.beadWidthMm * 0.011 : 0.08;
        puddleRef.current.scale.set(w * 1.3 * pulse, 0.035, w * pulse);
      }
    }

    // 2. Sparks InstancedMesh update
    const sparkMesh = sparkMeshRef.current;
    if (sparkMesh) {
      const spatterRate = arcActive ? (instantMetrics?.spatterIntensity ?? 0.3) : 0;
      for (let i = 0; i < SPARK_COUNT; i++) {
        const sp = sparkPool[i];
        if (i >= activeSparkCap) {
          _dummy.position.set(0, -50, 0);
          _dummy.scale.set(0.0001, 0.0001, 0.0001);
          _dummy.updateMatrix();
          sparkMesh.setMatrixAt(i, _dummy.matrix);
          continue;
        }

        if (sp.life <= 0) {
          if (arcActive && Math.random() < spatterRate * 0.65) {
            sp.x = seamX + (Math.random() - 0.5) * 0.05;
            sp.y = 0.04;
            sp.z = seamLateral + (Math.random() - 0.5) * 0.05;
            sp.vx = (Math.random() - 0.5) * 2.4 - 0.5;
            sp.vy = 0.7 + Math.random() * 2.2;
            sp.vz = (Math.random() - 0.3) * 2.2;
            sp.maxLife = 0.22 + Math.random() * 0.38;
            sp.life = sp.maxLife;
          } else {
            _dummy.position.set(0, -50, 0);
            _dummy.scale.set(0.0001, 0.0001, 0.0001);
            _dummy.updateMatrix();
            sparkMesh.setMatrixAt(i, _dummy.matrix);
            continue;
          }
        }

        sp.life -= dt;
        sp.vy -= 5.8 * dt;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.z += sp.vz * dt;
        if (sp.y < -0.1) {
          sp.y = -0.1;
          sp.vy *= -0.35;
        }

        const ratio = Math.max(0, sp.life / sp.maxLife);
        _dummy.position.set(sp.x, sp.y, sp.z);
        _dummy.scale.setScalar(0.015 * ratio + 0.004);
        _dummy.updateMatrix();
        sparkMesh.setMatrixAt(i, _dummy.matrix);
      }
      sparkMesh.instanceMatrix.needsUpdate = true;
    }

    // 3. Rising weld fume smoke plume
    const smokeGrp = smokeGroupRef.current;
    if (smokeGrp) {
      smokeGrp.children.forEach((child, idx) => {
        if (graphicsQuality === 'low' && idx % 2 === 1) {
          child.visible = false;
          return;
        }
        const sm = smokePool[idx];
        if (!sm) return;
        sm.age += dt * (arcActive ? 0.52 : 0.25);
        if (sm.age >= 1) {
          if (arcActive) {
            sm.age = 0;
            sm.x = seamX + (Math.random() - 0.5) * 0.06;
            sm.y = 0.08;
            sm.z = seamLateral + (Math.random() - 0.5) * 0.06;
          } else {
            child.visible = false;
            return;
          }
        }
        child.visible = true;
        sm.x += sm.driftX * dt;
        sm.y += sm.vy * dt;
        sm.z += sm.driftZ * dt;
        child.position.set(sm.x, sm.y, sm.z);
        const puffScale = 0.05 + sm.age * 0.22;
        child.scale.setScalar(puffScale);
        const mat = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
        mat.opacity = Math.max(0, (1 - sm.age) * 0.22);
      });
    }
  });

  // Raycast pointer aim directly onto the joint plane
  const handlePointerAim = (e: ThreeEvent<PointerEvent>) => {
    if (isReplaying) return;
    if (cameraPreset === 'orbit' && !isDraggingSeam) return;
    if (!couponGroupRef.current) return;
    e.stopPropagation();
    _localHit.copy(e.point);
    couponGroupRef.current.worldToLocal(_localHit);
    const nextProgress = Math.max(0.02, Math.min(0.98, (_localHit.x + SEAM_HALF_LEN) / (SEAM_HALF_LEN * 2)));
    const nextLateral = Math.max(-5.5, Math.min(5.5, _localHit.z / 0.018));
    onAimJoint(nextProgress, Number(nextLateral.toFixed(1)));
  };

  return (
    <>
      <EnvironmentSetup />
      <color attach="background" args={['#090e15']} />
      <fog attach="fog" args={['#090e15', 7, 16]} />

      {/* 3-Point Industrial Shop Lighting */}
      <ambientLight intensity={0.42} color="#b9c8db" />
      <directionalLight
        position={[3.5, 5.5, 4.0]}
        intensity={1.35}
        color="#f8fafc"
        castShadow={graphicsQuality !== 'low' && !isSoftwareGl}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4.0, 2.5, -3.0]} intensity={0.55} color="#7dd3fc" />
      <pointLight position={[0, 3.6, 0]} intensity={1.1} distance={9} color="#fde68a" />

      {/* Welding Booth Floor & Table */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[16, 16]} />
          <meshStandardMaterial map={textures.floorMap} roughness={0.92} metalness={0.1} />
        </mesh>

        {/* Steel Welding Table Top */}
        <mesh position={[0, 0.72, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.4, 0.08, 2.5]} />
          <meshStandardMaterial
            map={textures.steelColorMap}
            roughnessMap={textures.steelRoughMap}
            metalness={0.75}
            roughness={0.52}
          />
        </mesh>

        {/* Table Legs */}
        {[
          [-1.95, 0.34, -1.0],
          [1.95, 0.34, -1.0],
          [-1.95, 0.34, 1.0],
          [1.95, 0.34, 1.0],
        ].map(([lx, ly, lz], i) => (
          <mesh key={i} position={[lx, ly, lz]}>
            <boxGeometry args={[0.1, 0.68, 0.1]} />
            <meshStandardMaterial color="#1f2937" metalness={0.65} roughness={0.55} />
          </mesh>
        ))}

        {/* Positioner Post & Clamp Arm */}
        <mesh position={[0, 1.35, -0.95]}>
          <cylinderGeometry args={[0.075, 0.095, 1.35, 16]} />
          <meshStandardMaterial color="#334155" metalness={0.75} roughness={0.4} />
        </mesh>
        <mesh position={[0, couponTransform.pos[1], -0.58]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.8, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.78} roughness={0.35} />
        </mesh>

        {/* Booth Back Curtain Wall + Exhaust Hood */}
        <mesh position={[0, 2.0, -2.1]}>
          <boxGeometry args={[5.4, 4.0, 0.06]} />
          <meshStandardMaterial color="#141c24" roughness={0.85} metalness={0.2} />
        </mesh>
        <mesh position={[-2.7, 2.0, -0.4]}>
          <boxGeometry args={[0.06, 4.0, 3.4]} />
          <meshStandardMaterial color="#101820" roughness={0.88} metalness={0.2} />
        </mesh>
        <mesh position={[2.7, 2.0, -0.4]}>
          <boxGeometry args={[0.06, 4.0, 3.4]} />
          <meshStandardMaterial color="#101820" roughness={0.88} metalness={0.2} />
        </mesh>
        {/* Fume Extractor Hood Above Table */}
        <mesh position={[0, 2.95, -0.35]}>
          <coneGeometry args={[1.25, 0.65, 4]} />
          <meshStandardMaterial color="#27323f" metalness={0.65} roughness={0.45} />
        </mesh>
      </group>

      {/* Oriented Steel Coupon + Seam + Dynamic Bead + Gloved Hand Assembly */}
      <group
        ref={couponGroupRef}
        position={couponTransform.pos}
        rotation={couponTransform.rot}
      >
        {/* Copper Ground Clamp on Right Plate */}
        <group position={[1.42, -0.02, 0.45]}>
          <mesh>
            <boxGeometry args={[0.18, 0.07, 0.14]} />
            <meshStandardMaterial color="#b45309" metalness={0.88} roughness={0.28} />
          </mesh>
          <mesh position={[0.16, -0.02, 0.08]} rotation={[0, 0.3, Math.PI / 2]}>
            <cylinderGeometry args={[0.022, 0.022, 0.32, 8]} />
            <meshStandardMaterial color="#111827" roughness={0.75} />
          </mesh>
        </group>

        {/* Steel Plates according to Joint Preparation */}
        {settings.jointPrep === 'v-groove' && (
          <group>
            {/* Left Beveled Plate */}
            <mesh position={[0, -0.05 * plateThicknessScale, -0.44]} receiveShadow castShadow>
              <boxGeometry args={[3.2, 0.12 * plateThicknessScale, 0.8]} />
              <meshStandardMaterial
                map={textures.steelColorMap}
                roughnessMap={textures.steelRoughMap}
                metalness={0.78}
                roughness={0.45}
              />
            </mesh>
            {/* Bright Ground Bevel Edge Left */}
            <mesh position={[0, 0.0, -0.04]} rotation={[Math.PI / 4, 0, 0]}>
              <boxGeometry args={[3.2, 0.09 * plateThicknessScale, 0.04]} />
              <meshStandardMaterial color="#9aa6b2" metalness={0.92} roughness={0.24} />
            </mesh>

            {/* Right Beveled Plate */}
            <mesh position={[0, -0.05 * plateThicknessScale, 0.44]} receiveShadow castShadow>
              <boxGeometry args={[3.2, 0.12 * plateThicknessScale, 0.8]} />
              <meshStandardMaterial
                map={textures.steelColorMap}
                roughnessMap={textures.steelRoughMap}
                metalness={0.78}
                roughness={0.45}
              />
            </mesh>
            {/* Bright Ground Bevel Edge Right */}
            <mesh position={[0, 0.0, 0.04]} rotation={[-Math.PI / 4, 0, 0]}>
              <boxGeometry args={[3.2, 0.09 * plateThicknessScale, 0.04]} />
              <meshStandardMaterial color="#9aa6b2" metalness={0.92} roughness={0.24} />
            </mesh>
          </group>
        )}

        {settings.jointPrep === 't-fillet' && (
          <group>
            {/* Horizontal Base Plate */}
            <mesh position={[0, -0.07 * plateThicknessScale, 0.24]} receiveShadow castShadow>
              <boxGeometry args={[3.2, 0.14 * plateThicknessScale, 1.35]} />
              <meshStandardMaterial
                map={textures.steelColorMap}
                roughnessMap={textures.steelRoughMap}
                metalness={0.78}
                roughness={0.45}
              />
            </mesh>
            {/* Upright Web Plate */}
            <mesh position={[0, 0.56, -0.07 * plateThicknessScale]} receiveShadow castShadow>
              <boxGeometry args={[3.2, 1.12, 0.14 * plateThicknessScale]} />
              <meshStandardMaterial
                map={textures.steelColorMap}
                roughnessMap={textures.steelRoughMap}
                metalness={0.78}
                roughness={0.45}
              />
            </mesh>
            {/* Bright Wire-Brushed Corner Joint Strip */}
            <mesh position={[0, 0.005, 0.02]}>
              <boxGeometry args={[3.16, 0.012, 0.06]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.25} />
            </mesh>
          </group>
        )}

        {settings.jointPrep === 'lap' && (
          <group>
            {/* Lower Plate */}
            <mesh position={[0, -0.07 * plateThicknessScale, 0.25]} receiveShadow castShadow>
              <boxGeometry args={[3.2, 0.14 * plateThicknessScale, 1.3]} />
              <meshStandardMaterial
                map={textures.steelColorMap}
                roughnessMap={textures.steelRoughMap}
                metalness={0.78}
                roughness={0.45}
              />
            </mesh>
            {/* Upper Overlapping Plate */}
            <mesh position={[0, 0.07 * plateThicknessScale, -0.35]} receiveShadow castShadow>
              <boxGeometry args={[3.2, 0.14 * plateThicknessScale, 0.72]} />
              <meshStandardMaterial
                map={textures.steelColorMap}
                roughnessMap={textures.steelRoughMap}
                metalness={0.78}
                roughness={0.45}
              />
            </mesh>
          </group>
        )}

        {/* Seam Centerline Target Hairline (subtle chalk/scribe guide) */}
        <mesh position={[0, 0.008, 0]}>
          <boxGeometry args={[3.0, 0.004, 0.008]} />
          <meshBasicMaterial color={arcActive ? '#f59e0b' : '#38bdf8'} transparent opacity={0.45} />
        </mesh>

        {/* Dynamic Parameter-Driven Weld Bead InstancedMesh */}
        <instancedMesh ref={beadMeshRef} args={[undefined, undefined, MAX_BEAD_INSTANCES]} frustumCulled={false}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial metalness={0.85} roughness={0.32} />
        </instancedMesh>

        {/* Solidified Slag Crust InstancedMesh */}
        <instancedMesh ref={slagMeshRef} args={[undefined, undefined, MAX_BEAD_INSTANCES]} frustumCulled={false}>
          <boxGeometry args={[1.2, 0.8, 1.2]} />
          <meshStandardMaterial metalness={0.18} roughness={0.82} />
        </instancedMesh>

        {/* Post-Weld Defect Location Overlay */}
        <instancedMesh ref={defectMeshRef} args={[undefined, undefined, MAX_BEAD_INSTANCES]} frustumCulled={false}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial />
        </instancedMesh>

        {/* Live Arc PointLight & Molten Puddle */}
        <group position={[seamX, 0.02, seamLateral]}>
          <pointLight
            ref={arcLightRef}
            position={[0, 0.16, 0.08]}
            color="#a5d8ff"
            intensity={0}
            distance={4.5}
            decay={2}
          />
          <mesh ref={puddleRef} visible={false} rotation={[isFilletOrLap ? Math.PI / 4 : 0, 0, 0]}>
            <sphereGeometry args={[1, 12, 8]} />
            <meshBasicMaterial color="#fff7ed" />
          </mesh>
          {arcActive && (
            <mesh position={[0, 0.03, 0.02]}>
              <sphereGeometry args={[0.045, 10, 10]} />
              <meshBasicMaterial color="#93c5fd" transparent opacity={0.88} />
            </mesh>
          )}
        </group>

        {/* Sparks Pool */}
        <instancedMesh ref={sparkMeshRef} args={[undefined, undefined, SPARK_COUNT]} frustumCulled={false}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color="#fbbf24" />
        </instancedMesh>

        {/* Rising Smoke Plume */}
        <group ref={smokeGroupRef}>
          {smokePool.map((_, i) => (
            <mesh key={i} visible={false}>
              <sphereGeometry args={[1, 8, 8]} />
              <meshStandardMaterial color="#94a3b8" transparent opacity={0.15} depthWrite={false} roughness={1} />
            </mesh>
          ))}
        </group>

        {/* Virtual Gloved Hand + Stinger / FCAW Gun following Seam & Angles */}
        <group
          position={[seamX, arcGapUnits * Math.sin(bisectorAngle), seamLateral + arcGapUnits * Math.cos(bisectorAngle)]}
          rotation={[bisectorNormalRad + workTiltRad, 0, travelTiltRad]}
        >
          {/* Electrode Rod OR Contact Wire Tip ending right above puddle */}
          <mesh position={[0, rodLengthUnits / 2, 0]}>
            <cylinderGeometry args={[0.014, 0.014, rodLengthUnits, 10]} />
            <meshStandardMaterial
              color={isWireProcess ? '#d97706' : rodColor}
              metalness={isWireProcess ? 0.85 : 0.2}
              roughness={0.6}
            />
          </mesh>

          {!isWireProcess ? (
            /* SMAW Stinger + Leather Gloved Hand */
            <group position={[0, rodLengthUnits, 0]}>
              {/* Copper Jaw */}
              <mesh position={[0, 0.04, 0]} rotation={[0, 0, Math.PI / 6]}>
                <boxGeometry args={[0.045, 0.14, 0.035]} />
                <meshStandardMaterial color="#b45309" metalness={0.88} roughness={0.28} />
              </mesh>
              {/* Insulated Stinger Handle */}
              <mesh position={[0.14, 0.22, 0]} rotation={[0, 0, -Math.PI / 4]}>
                <cylinderGeometry args={[0.036, 0.042, 0.36, 12]} />
                <meshStandardMaterial color="#1f2937" roughness={0.7} />
              </mesh>
              {/* Heavy Leather Welding Glove */}
              <group position={[0.2, 0.28, 0.02]} rotation={[0.1, -0.2, -Math.PI / 4]}>
                {/* Palm */}
                <mesh>
                  <boxGeometry args={[0.17, 0.2, 0.12]} />
                  <meshStandardMaterial map={textures.gloveMap} roughness={0.88} />
                </mesh>
                {/* Fingers curled around handle */}
                <mesh position={[-0.08, 0.01, 0.03]}>
                  <boxGeometry args={[0.09, 0.15, 0.11]} />
                  <meshStandardMaterial map={textures.gloveMap} roughness={0.9} />
                </mesh>
                {/* Thumb */}
                <mesh position={[-0.04, -0.07, 0.07]} rotation={[0.4, 0, 0.3]}>
                  <boxGeometry args={[0.06, 0.09, 0.05]} />
                  <meshStandardMaterial map={textures.gloveMap} roughness={0.9} />
                </mesh>
                {/* Gauntlet Cuff */}
                <mesh position={[0.02, 0.22, 0]}>
                  <cylinderGeometry args={[0.085, 0.072, 0.26, 12]} />
                  <meshStandardMaterial color="#6b4423" roughness={0.92} />
                </mesh>
              </group>
            </group>
          ) : (
            /* FCAW / GMAW Curved Gooseneck Gun + Gloved Hand */
            <group position={[0, rodLengthUnits, 0]}>
              {/* Brass Gas Nozzle */}
              <mesh position={[0, 0.055, 0]}>
                <cylinderGeometry args={[0.026, 0.021, 0.11, 14]} />
                <meshStandardMaterial color="#d4a34a" metalness={0.88} roughness={0.24} />
              </mesh>
              {/* Gooseneck */}
              <mesh position={[0.06, 0.18, 0]} rotation={[0, 0, -Math.PI / 5]}>
                <cylinderGeometry args={[0.018, 0.022, 0.2, 12]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.3} />
              </mesh>
              {/* Trigger Handle */}
              <mesh position={[0.18, 0.28, 0]} rotation={[0, 0, -Math.PI / 3]}>
                <boxGeometry args={[0.075, 0.34, 0.065]} />
                <meshStandardMaterial color="#18181b" roughness={0.72} />
              </mesh>
              {/* Trigger */}
              <mesh position={[0.14, 0.23, 0]}>
                <boxGeometry args={[0.03, 0.06, 0.025]} />
                <meshStandardMaterial color="#dc2626" roughness={0.5} />
              </mesh>
              {/* Welding Glove */}
              <group position={[0.24, 0.33, 0.02]} rotation={[0.1, -0.15, -Math.PI / 3]}>
                <mesh>
                  <boxGeometry args={[0.16, 0.19, 0.12]} />
                  <meshStandardMaterial map={textures.gloveMap} roughness={0.88} />
                </mesh>
                <mesh position={[0.02, 0.21, 0]}>
                  <cylinderGeometry args={[0.082, 0.07, 0.25, 12]} />
                  <meshStandardMaterial color="#6b4423" roughness={0.92} />
                </mesh>
              </group>
            </group>
          )}
        </group>

        {/* Interactive Invisible Seam Raycast Hit Plane */}
        <mesh
          position={[0, 0.05, 0.06]}
          rotation={[-Math.PI / 2 + (isFilletOrLap ? Math.PI / 5 : 0), 0, 0]}
          onPointerDown={(e) => {
            if (cameraPreset === 'orbit') return;
            setIsDraggingSeam(true);
            handlePointerAim(e);
            onSetTrigger(true);
          }}
          onPointerMove={(e) => {
            handlePointerAim(e);
          }}
          onPointerUp={() => {
            setIsDraggingSeam(false);
            onSetTrigger(false);
          }}
          onPointerLeave={() => {
            setIsDraggingSeam(false);
            onSetTrigger(false);
          }}
        >
          <planeGeometry args={[3.4, 1.4]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {cameraPreset === 'orbit' && (
        <OrbitControls
          target={couponTransform.pos}
          enableDamping
          dampingFactor={0.08}
          minDistance={0.8}
          maxDistance={6.5}
        />
      )}
    </>
  );
};

export const WeldingScene3D: React.FC<WeldingScene3DProps> = (props) => {
  const [isSoftwareGl, setIsSoftwareGl] = useState(false);

  const dpr: [number, number] = useMemo(() => {
    if (isSoftwareGl || props.graphicsQuality === 'low') return [1, 1];
    if (props.graphicsQuality === 'medium') return [1, 1.5];
    return [1, 2];
  }, [isSoftwareGl, props.graphicsQuality]);

  return (
    <div className="w-full h-full relative bg-[#090e15] select-none touch-none">
      <Canvas
        shadows={props.graphicsQuality !== 'low' && !isSoftwareGl}
        dpr={dpr}
        camera={{ position: [-0.15, 1.65, 1.55], fov: 44, near: 0.05, far: 40 }}
        gl={{ antialias: props.graphicsQuality !== 'low', powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          try {
            const context = gl.getContext();
            const debugExt = context.getExtension('WEBGL_debug_renderer_info');
            if (debugExt) {
              const renderer = String(context.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) || '');
              if (/SwiftShader|llvmpipe|Software/i.test(renderer)) {
                setIsSoftwareGl(true);
              }
            }
          } catch {
            // ignore
          }
        }}
      >
        <WeldingWorkshopInner {...props} isSoftwareGl={isSoftwareGl} />
      </Canvas>
    </div>
  );
};

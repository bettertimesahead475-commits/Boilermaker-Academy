import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  EnvironmentMode,
  LoadDefinition,
  RiggingCameraPreset,
  RiggingConfiguration,
  RiggingSimFrame,
  RiggingStaticsResult,
} from '../types/academy';

interface RiggingScene3DProps {
  load: LoadDefinition;
  config: RiggingConfiguration;
  statics: RiggingStaticsResult;
  frame: RiggingSimFrame;
  environment: EnvironmentMode;
  targetZoneXFt: number;
  targetZoneZFt: number;
  cameraPreset: RiggingCameraPreset;
  showOverlays: boolean;
  activePickSide: 'left' | 'right';
  onSelectAttachmentPoint: (pointId: string, side: 'left' | 'right') => void;
}

const _camPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _vStart = new THREE.Vector3();
const _vEnd = new THREE.Vector3();
const _vMid = new THREE.Vector3();
const _vDir = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

function useIndustrialTextures() {
  return useMemo(() => {
    // Shop floor concrete texture with hazard stripe grid
    const fCanvas = document.createElement('canvas');
    fCanvas.width = 256;
    fCanvas.height = 256;
    const ctx = fCanvas.getContext('2d')!;
    ctx.fillStyle = '#1b2430';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 800; i++) {
      const c = 24 + Math.floor(Math.random() * 18);
      ctx.fillStyle = `rgba(${c},${c + 4},${c + 8},0.4)`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 3, 3);
    }
    ctx.strokeStyle = 'rgba(148,163,184,0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 256, 256);
    const floorMap = new THREE.CanvasTexture(fCanvas);
    floorMap.colorSpace = THREE.SRGBColorSpace;
    floorMap.wrapS = THREE.RepeatWrapping;
    floorMap.wrapT = THREE.RepeatWrapping;
    floorMap.repeat.set(16, 10);

    // Outdoor yard asphalt/gravel texture
    const yCanvas = document.createElement('canvas');
    yCanvas.width = 256;
    yCanvas.height = 256;
    const yCtx = yCanvas.getContext('2d')!;
    yCtx.fillStyle = '#25292e';
    yCtx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1600; i++) {
      const g = 34 + Math.floor(Math.random() * 28);
      yCtx.fillStyle = `rgb(${g},${g - 2},${g - 5})`;
      yCtx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }
    const yardMap = new THREE.CanvasTexture(yCanvas);
    yardMap.colorSpace = THREE.SRGBColorSpace;
    yardMap.wrapS = THREE.RepeatWrapping;
    yardMap.wrapT = THREE.RepeatWrapping;
    yardMap.repeat.set(16, 12);

    // Brushed steel texture
    const sCanvas = document.createElement('canvas');
    sCanvas.width = 256;
    sCanvas.height = 256;
    const sCtx = sCanvas.getContext('2d')!;
    sCtx.fillStyle = '#566475';
    sCtx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1200; i++) {
      const shade = 72 + Math.floor(Math.random() * 35);
      sCtx.fillStyle = `rgba(${shade},${shade + 8},${shade + 14},0.22)`;
      sCtx.fillRect(Math.random() * 256, Math.random() * 256, 28, 1.5);
    }
    const steelMap = new THREE.CanvasTexture(sCanvas);
    steelMap.colorSpace = THREE.SRGBColorSpace;
    steelMap.wrapS = THREE.RepeatWrapping;
    steelMap.wrapT = THREE.RepeatWrapping;

    return { floorMap, yardMap, steelMap };
  }, []);
}

const EnvironmentLightSetup: React.FC = () => {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const roomEnv = new RoomEnvironment();
    const rt = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = rt.texture;
    return () => {
      scene.environment = null;
      rt.dispose();
      roomEnv.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

const CameraRigController: React.FC<{
  preset: RiggingCameraPreset;
  loadPos: [number, number, number];
  controlsRef: React.RefObject<any>;
}> = ({ preset, loadPos, controlsRef }) => {
  const { camera } = useThree();
  const prevPresetRef = useRef<RiggingCameraPreset>(preset);

  useEffect(() => {
    prevPresetRef.current = preset;
    const [lx, ly, lz] = loadPos;
    if (preset === 'inspector') {
      camera.position.set(lx + 4.5, ly + 4.0, lz + 8.5);
    } else if (preset === 'overhead') {
      camera.position.set(lx + 0.01, 24.5, lz + 0.5);
    } else if (preset === 'side') {
      camera.position.set(lx, ly + 4.5, lz + 19.0);
    } else {
      camera.position.set(11.5, 9.5, 19.5);
    }
    if (controlsRef.current) {
      controlsRef.current.target.set(lx, Math.max(2.2, ly + 1.0), lz);
      controlsRef.current.update();
    }
  }, [preset]); // intentionally snap only when user picks a camera preset

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    if (prevPresetRef.current === 'overhead') {
      _camTarget.set(loadPos[0], 1.5, loadPos[2]);
      controlsRef.current.target.lerp(_camTarget, Math.min(1, delta * 3));
      controlsRef.current.update();
    }
  });

  return null;
};

/** Helper cylinder connecting two world-space 3D points */
const SlingSegment: React.FC<{
  start: [number, number, number];
  end: [number, number, number];
  radius: number;
  color: string;
  broken?: boolean;
}> = ({ start, end, radius, color, broken }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const quat = useMemo(() => new THREE.Quaternion(), []);

  const transform = useMemo(() => {
    _vStart.set(start[0], start[1], start[2]);
    _vEnd.set(end[0], end[1], end[2]);
    if (broken) {
      // Show separated snapped upper half dangling near hook
      _vEnd.lerpVectors(_vEnd, _vStart, 0.42);
    }
    const len = Math.max(0.05, _vStart.distanceTo(_vEnd));
    _vMid.addVectors(_vStart, _vEnd).multiplyScalar(0.5);
    _vDir.subVectors(_vEnd, _vStart).normalize();
    quat.setFromUnitVectors(_up, _vDir);
    return { pos: [_vMid.x, _vMid.y, _vMid.z] as [number, number, number], len, quat: quat.clone() };
  }, [start, end, broken, quat]);

  return (
    <mesh ref={meshRef} position={transform.pos} quaternion={transform.quat} castShadow>
      <cylinderGeometry args={[radius, radius, transform.len, 10]} />
      <meshStandardMaterial color={color} metalness={0.45} roughness={0.4} />
    </mesh>
  );
};

const LoadAssemblyMesh: React.FC<{
  load: LoadDefinition;
  config: RiggingConfiguration;
  steelMap: THREE.CanvasTexture;
  showOverlays: boolean;
  onSelectPoint: (pointId: string, xFt: number) => void;
}> = ({ load, config, steelMap, showOverlays, onSelectPoint }) => {
  const L = load.lengthFt;
  const W = load.widthFt;
  const H = load.heightFt;

  return (
    <group>
      {load.shape === 'i-beam' && (
        <group>
          <mesh position={[0, -H / 2 + 0.14, 0]} castShadow receiveShadow>
            <boxGeometry args={[L, 0.28, W]} />
            <meshStandardMaterial map={steelMap} color="#5e6b7a" metalness={0.78} roughness={0.38} />
          </mesh>
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[L, H - 0.56, 0.24]} />
            <meshStandardMaterial map={steelMap} color="#4e5a68" metalness={0.78} roughness={0.42} />
          </mesh>
          <mesh position={[0, H / 2 - 0.14, 0]} castShadow receiveShadow>
            <boxGeometry args={[L, 0.28, W]} />
            <meshStandardMaterial map={steelMap} color="#637080" metalness={0.78} roughness={0.36} />
          </mesh>
        </group>
      )}

      {load.shape === 'uneven-beam' && (
        <group>
          {/* Left shallow section */}
          <mesh position={[-L * 0.22, -H * 0.12, 0]} castShadow receiveShadow>
            <boxGeometry args={[L * 0.56, H * 0.65, W]} />
            <meshStandardMaterial map={steelMap} color="#586675" metalness={0.76} roughness={0.4} />
          </mesh>
          {/* Heavy haunch right section */}
          <mesh position={[L * 0.24, 0.05, 0]} castShadow receiveShadow>
            <boxGeometry args={[L * 0.52, H, W * 1.1]} />
            <meshStandardMaterial map={steelMap} color="#475569" metalness={0.8} roughness={0.35} />
          </mesh>
        </group>
      )}

      {load.shape === 'offset-assembly' && (
        <group>
          {/* Main pipe header */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.75, 0.75, L, 20]} />
            <meshStandardMaterial map={steelMap} color="#64748b" metalness={0.75} roughness={0.35} />
          </mesh>
          {/* Heavy left isolation valve body & bonnet */}
          <mesh position={[-L * 0.28, 0.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.2, 2.4, 2.2]} />
            <meshStandardMaterial color="#b45309" metalness={0.65} roughness={0.38} />
          </mesh>
          <mesh position={[-L * 0.28, 1.55, 0.9]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <torusGeometry args={[0.75, 0.12, 10, 20]} />
            <meshStandardMaterial color="#dc2626" metalness={0.4} roughness={0.45} />
          </mesh>
          {/* Right stub flange */}
          <mesh position={[L / 2 - 0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[1.15, 1.15, 0.3, 20]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.82} roughness={0.3} />
          </mesh>
        </group>
      )}

      {load.shape === 'pipe-spool' && (
        <group>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[0.68, 0.68, L, 24]} />
            <meshStandardMaterial map={steelMap} color="#6d7c8d" metalness={0.8} roughness={0.32} />
          </mesh>
          {/* Weld-neck flanges at ends */}
          <mesh position={[-L / 2 + 0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[1.05, 1.05, 0.3, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.84} roughness={0.28} />
          </mesh>
          <mesh position={[L / 2 - 0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[1.05, 1.05, 0.3, 24]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.84} roughness={0.28} />
          </mesh>
          {/* Branch tee */}
          <mesh position={[1.2, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.45, 0.45, 1.6, 16]} />
            <meshStandardMaterial color="#64748b" metalness={0.78} roughness={0.35} />
          </mesh>
        </group>
      )}

      {load.shape === 'plate-bundle' && (
        <group>
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <mesh
              key={idx}
              position={[0, -H / 2 + 0.12 + idx * (H / 6), 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[L, H / 7.2, W]} />
              <meshStandardMaterial
                map={steelMap}
                color={idx % 2 === 0 ? '#5b6775' : '#4a5563'}
                metalness={0.78}
                roughness={0.4}
              />
            </mesh>
          ))}
          {/* Banding straps */}
          {[-4.5, 0, 4.5].map((bx) => (
            <mesh key={bx} position={[bx, 0, 0]}>
              <boxGeometry args={[0.18, H + 0.06, W + 0.08]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.35} roughness={0.5} />
            </mesh>
          ))}
        </group>
      )}

      {load.shape === 'structural-frame' && (
        <group>
          {/* Top & bottom perimeter girders */}
          <mesh position={[0, -H / 2 + 0.2, W / 2 - 0.25]} castShadow>
            <boxGeometry args={[L, 0.4, 0.4]} />
            <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.4} />
          </mesh>
          <mesh position={[0, -H / 2 + 0.2, -W / 2 + 0.25]} castShadow>
            <boxGeometry args={[L, 0.4, 0.4]} />
            <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.4} />
          </mesh>
          <mesh position={[0, H / 2 - 0.2, W / 2 - 0.25]} castShadow>
            <boxGeometry args={[L, 0.4, 0.4]} />
            <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.38} />
          </mesh>
          <mesh position={[0, H / 2 - 0.2, -W / 2 + 0.25]} castShadow>
            <boxGeometry args={[L, 0.4, 0.4]} />
            <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.38} />
          </mesh>
          {[-L / 2 + 0.25, -L * 0.2, L * 0.2, L / 2 - 0.25].map((px) => (
            <group key={px} position={[px, 0, 0]}>
              <mesh position={[0, 0, W / 2 - 0.25]} castShadow>
                <boxGeometry args={[0.4, H, 0.4]} />
                <meshStandardMaterial color="#526071" metalness={0.75} roughness={0.4} />
              </mesh>
              <mesh position={[0, 0, -W / 2 + 0.25]} castShadow>
                <boxGeometry args={[0.4, H, 0.4]} />
                <meshStandardMaterial color="#526071" metalness={0.75} roughness={0.4} />
              </mesh>
              <mesh position={[0, H / 2 - 0.2, 0]} castShadow>
                <boxGeometry args={[0.35, 0.35, W]} />
                <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.4} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {load.shape === 'cylindrical-vessel' && (
        <group>
          {/* Main shell */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
            <cylinderGeometry args={[H / 2, H / 2, L - 2.6, 28]} />
            <meshStandardMaterial map={steelMap} color="#cbd5e1" metalness={0.62} roughness={0.32} />
          </mesh>
          {/* Ellipsoidal heads */}
          <mesh position={[-(L - 2.6) / 2, 0, 0]} scale={[0.55, 1, 1]} castShadow>
            <sphereGeometry args={[H / 2, 24, 18]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.65} roughness={0.34} />
          </mesh>
          <mesh position={[(L - 2.6) / 2, 0, 0]} scale={[0.55, 1, 1]} castShadow>
            <sphereGeometry args={[H / 2, 24, 18]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.65} roughness={0.34} />
          </mesh>
          {/* Saddles */}
          {[-L * 0.28, L * 0.28].map((sx) => (
            <mesh key={sx} position={[sx, -H / 2 + 0.35, 0]} castShadow>
              <boxGeometry args={[0.9, 0.7, W * 0.85]} />
              <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.5} />
            </mesh>
          ))}
          {/* Top manway nozzle */}
          <mesh position={[2.2, H / 2 + 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.65, 0.65, 0.9, 18]} />
            <meshStandardMaterial color="#64748b" metalness={0.75} roughness={0.35} />
          </mesh>
        </group>
      )}

      {/* Attachment Lug Nodes (clickable in 3D!) */}
      {load.attachmentPoints.map((pt) => {
        const isLeftSelected = config.leftPointId === pt.id;
        const isRightSelected = config.rightPointId === pt.id;
        const selected = isLeftSelected || isRightSelected;
        return (
          <group key={pt.id} position={[pt.localXFt, pt.localYFt, pt.localZFt]}>
            {/* Padeye steel ear */}
            <mesh position={[0, 0.12, 0]}>
              <boxGeometry args={[0.38, 0.36, 0.22]} />
              <meshStandardMaterial color={pt.isEngineeredLug ? '#f59e0b' : '#64748b'} metalness={0.7} roughness={0.35} />
            </mesh>
            {/* Interactive clickable selection ring */}
            <mesh
              position={[0, 0.32, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPoint(pt.id, pt.localXFt);
              }}
            >
              <sphereGeometry args={[selected ? 0.34 : 0.24, 16, 16]} />
              <meshStandardMaterial
                color={isLeftSelected ? '#38bdf8' : isRightSelected ? '#f59e0b' : '#94a3b8'}
                emissive={selected ? (isLeftSelected ? '#0284c7' : '#d97706') : '#000000'}
                emissiveIntensity={selected ? 0.65 : 0}
              />
            </mesh>
            {/* Corner edge softener pad */}
            {selected && config.useEdgeSofteners && (
              <mesh position={[0, -0.04, 0]}>
                <boxGeometry args={[0.72, 0.22, W * 0.5]} />
                <meshStandardMaterial color="#0ea5e9" roughness={0.7} />
              </mesh>
            )}
          </group>
        );
      })}

      {/* True Centre of Gravity (CG) Overlay Sphere + Triad */}
      {showOverlays && (
        <group position={[load.cgOffsetXFt, load.cgOffsetYFt, load.cgOffsetZFt]}>
          <mesh>
            <sphereGeometry args={[0.32, 16, 16]} />
            <meshStandardMaterial color="#facc15" emissive="#ca8a04" emissiveIntensity={0.8} />
          </mesh>
          {/* Gravity vector downward */}
          <mesh position={[0, -1.2, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 2.2, 8]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
          <mesh position={[0, -2.35, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.2, 0.45, 10]} />
            <meshStandardMaterial color="#facc15" />
          </mesh>
        </group>
      )}
    </group>
  );
};

const SceneContents: React.FC<RiggingScene3DProps> = ({
  load,
  config,
  statics,
  frame,
  environment,
  targetZoneXFt,
  targetZoneZFt,
  cameraPreset,
  showOverlays,
  activePickSide,
  onSelectAttachmentPoint,
}) => {
  const { floorMap, yardMap, steelMap } = useIndustrialTextures();
  const controlsRef = useRef<any>(null);

  const leftPt =
    load.attachmentPoints.find((p) => p.id === config.leftPointId) ?? load.attachmentPoints[0];
  const rightPt =
    load.attachmentPoints.find((p) => p.id === config.rightPointId) ??
    load.attachmentPoints[load.attachmentPoints.length - 1];

  // Compute live world coordinates of left/right attachment points based on load pose
  const tiltRad = (frame.tiltZDeg * Math.PI) / 180;
  const cosT = Math.cos(tiltRad);
  const sinT = Math.sin(tiltRad);

  const toWorldPoint = (lx: number, ly: number, lz: number): [number, number, number] => {
    const rx = lx * cosT - ly * sinT;
    const ry = lx * sinT + ly * cosT;
    return [frame.loadXFt + rx, frame.loadYFt + ry + 0.25, frame.loadZFt + lz];
  };

  const leftWorld = toWorldPoint(leftPt.localXFt, leftPt.localYFt, leftPt.localZFt);
  const rightWorld = toWorldPoint(rightPt.localXFt, rightPt.localYFt, rightPt.localZFt);
  const hookRingWorld: [number, number, number] = [frame.craneXFt, frame.hookYFt, frame.craneZFt];

  const legColor = (status: string) => {
    if (frame.failed) return '#ef4444';
    if (status === 'overload') return '#ef4444';
    if (status === 'critical') return '#f97316';
    if (status === 'caution') return '#f59e0b';
    return '#22c55e';
  };

  const leftColor = legColor(statics.leftLeg.status);
  const rightColor = legColor(statics.rightLeg.status);

  const spreaderSpan = Math.max(4, rightPt.localXFt - leftPt.localXFt);
  const spreaderY = Math.max(leftWorld[1], rightWorld[1]) + 3.0;
  const spreaderLeft: [number, number, number] = [frame.craneXFt - spreaderSpan / 2, spreaderY, frame.craneZFt];
  const spreaderRight: [number, number, number] = [frame.craneXFt + spreaderSpan / 2, spreaderY, frame.craneZFt];

  return (
    <>
      <EnvironmentLightSetup />
      <color attach="background" args={[environment === 'indoor-shop' ? '#0c131d' : '#182433']} />
      <fog
        attach="fog"
        args={[environment === 'indoor-shop' ? '#0c131d' : '#182433', 28, 72]}
      />

      <ambientLight intensity={environment === 'indoor-shop' ? 0.48 : 0.65} />
      <directionalLight
        position={[14, 24, 16]}
        intensity={environment === 'indoor-shop' ? 1.35 : 1.75}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-12, 14, -8]} intensity={0.45} color="#38bdf8" />

      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 56]} />
        <meshStandardMaterial
          map={environment === 'indoor-shop' ? floorMap : yardMap}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Initial Blocking Dunnage */}
      <mesh position={[-4.5, 0.12, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.24, 3.6]} />
        <meshStandardMaterial color="#854d0e" roughness={0.9} />
      </mesh>
      <mesh position={[4.5, 0.12, 0]} receiveShadow>
        <boxGeometry args={[1.0, 0.24, 3.6]} />
        <meshStandardMaterial color="#854d0e" roughness={0.9} />
      </mesh>

      {/* Target Laydown Zone Pad */}
      <group position={[targetZoneXFt, 0.02, targetZoneZFt]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[12, 5.5]} />
          <meshStandardMaterial
            color={frame.phase === 'landed-target' ? '#16a34a' : '#065f46'}
            opacity={0.45}
            transparent
          />
        </mesh>
        <mesh position={[0, 0.02, 2.75]}>
          <boxGeometry args={[12, 0.05, 0.14]} />
          <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0.02, -2.75]}>
          <boxGeometry args={[12, 0.05, 0.14]} />
          <meshStandardMaterial color="#22c55e" emissive="#16a34a" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* Bay Stanchions / Obstacles (X = ±21.5 ft) */}
      {[-21.5, 21.5].map((cx) => (
        <group key={cx}>
          {[-10, 0, 10].map((cz) => (
            <group key={cz} position={[cx, 0, cz]}>
              <mesh position={[0, 11, 0]} castShadow>
                <boxGeometry args={[0.9, 22, 0.9]} />
                <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.45} />
              </mesh>
              <mesh position={[0, 1.5, 0]}>
                <boxGeometry args={[0.96, 3.0, 0.96]} />
                <meshStandardMaterial color="#eab308" roughness={0.6} />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Overhead Crane Runway Rails & Double-Girder Bridge */}
      <mesh position={[0, 21.6, -10.5]}>
        <boxGeometry args={[46, 0.65, 0.65]} />
        <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.35} />
      </mesh>
      <mesh position={[0, 21.6, 10.5]}>
        <boxGeometry args={[46, 0.65, 0.65]} />
        <meshStandardMaterial color="#475569" metalness={0.75} roughness={0.35} />
      </mesh>

      {/* Moving Crane Bridge at craneXFt */}
      <group position={[frame.craneXFt, 21.0, 0]}>
        <mesh position={[-0.6, 0, 0]} castShadow>
          <boxGeometry args={[0.55, 0.9, 21.5]} />
          <meshStandardMaterial color="#eab308" metalness={0.45} roughness={0.42} />
        </mesh>
        <mesh position={[0.6, 0, 0]} castShadow>
          <boxGeometry args={[0.55, 0.9, 21.5]} />
          <meshStandardMaterial color="#eab308" metalness={0.45} roughness={0.42} />
        </mesh>

        {/* Trolley at craneZFt */}
        <group position={[0, 0.35, frame.craneZFt]}>
          <mesh castShadow>
            <boxGeometry args={[1.9, 0.65, 2.2]} />
            <meshStandardMaterial color="#1e293b" metalness={0.75} roughness={0.35} />
          </mesh>
          {/* Hoist Wire Rope Lines */}
          <mesh position={[-0.25, -(21.35 - frame.hookYFt) / 2, 0]}>
            <cylinderGeometry args={[0.045, 0.045, Math.max(0.5, 21.35 - frame.hookYFt), 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0.25, -(21.35 - frame.hookYFt) / 2, 0]}>
            <cylinderGeometry args={[0.045, 0.045, Math.max(0.5, 21.35 - frame.hookYFt), 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      </group>

      {/* Crane Hook Block */}
      <group position={[frame.craneXFt, frame.hookYFt + 0.55, frame.craneZFt]}>
        <mesh castShadow>
          <boxGeometry args={[0.75, 0.9, 0.45]} />
          <meshStandardMaterial color="#f59e0b" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Hook Clevis Ring */}
        <mesh position={[0, -0.62, 0]}>
          <torusGeometry args={[0.26, 0.08, 10, 20]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.85} roughness={0.25} />
        </mesh>
      </group>

      {/* Spreader Beam (optional) */}
      {config.useSpreaderBeam && (
        <group>
          <mesh position={[frame.craneXFt, spreaderY, frame.craneZFt]} castShadow>
            <boxGeometry args={[spreaderSpan + 1.0, 0.45, 0.45]} />
            <meshStandardMaterial color="#eab308" metalness={0.55} roughness={0.35} />
          </mesh>
          <SlingSegment
            start={hookRingWorld}
            end={spreaderLeft}
            radius={0.06}
            color={leftColor}
            broken={frame.failed && frame.failureCause !== 'obstacle-collision'}
          />
          <SlingSegment
            start={hookRingWorld}
            end={spreaderRight}
            radius={0.06}
            color={rightColor}
            broken={frame.failed && frame.failureCause !== 'obstacle-collision'}
          />
          <SlingSegment
            start={spreaderLeft}
            end={leftWorld}
            radius={0.06}
            color={leftColor}
            broken={frame.failed}
          />
          <SlingSegment
            start={spreaderRight}
            end={rightWorld}
            radius={0.06}
            color={rightColor}
            broken={frame.failed}
          />
        </group>
      )}

      {/* Standard 2-leg / 4-leg Sling Geometry */}
      {!config.useSpreaderBeam && (
        <group>
          <SlingSegment
            start={hookRingWorld}
            end={leftWorld}
            radius={0.065}
            color={leftColor}
            broken={frame.failed && statics.overloadedComponent !== 'right-sling'}
          />
          <SlingSegment
            start={hookRingWorld}
            end={rightWorld}
            radius={0.065}
            color={rightColor}
            broken={frame.failed && statics.overloadedComponent !== 'left-sling'}
          />
          {config.legCount === 4 && (
            <>
              <SlingSegment
                start={hookRingWorld}
                end={[leftWorld[0], leftWorld[1], leftWorld[2] + 0.55]}
                radius={0.05}
                color={leftColor}
                broken={frame.failed}
              />
              <SlingSegment
                start={hookRingWorld}
                end={[rightWorld[0], rightWorld[1], rightWorld[2] - 0.55]}
                radius={0.05}
                color={rightColor}
                broken={frame.failed}
              />
            </>
          )}
        </group>
      )}

      {/* Optional Tag Line */}
      {config.tagLineAttached && (
        <SlingSegment
          start={rightWorld}
          end={[rightWorld[0] + 2.6, 0.2, rightWorld[2] + 4.2]}
          radius={0.03}
          color="#fb923c"
        />
      )}

      {/* Dynamic Load Group */}
      <group
        position={[frame.loadXFt, frame.loadYFt, frame.loadZFt]}
        rotation={[
          (frame.swingZDeg * Math.PI) / 180,
          0,
          ((frame.tiltZDeg - frame.swingXDeg * 0.25) * Math.PI) / 180,
        ]}
      >
        <LoadAssemblyMesh
          load={load}
          config={config}
          steelMap={steelMap}
          showOverlays={showOverlays}
          onSelectPoint={(ptId, xFt) => {
            const side =
              xFt < 0 ? 'left' : xFt > 0 ? 'right' : activePickSide;
            onSelectAttachmentPoint(ptId, side);
          }}
        />
      </group>

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={5}
        maxDistance={42}
        maxPolarAngle={Math.PI / 2 - 0.04}
      />
      <CameraRigController
        preset={cameraPreset}
        loadPos={[frame.loadXFt, frame.loadYFt, frame.loadZFt]}
        controlsRef={controlsRef}
      />
    </>
  );
};

class WebGLErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#0D1622] text-slate-300 p-6 text-center">
          <p className="font-semibold text-amber-400">3D WebGL Viewport Fallback</p>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            WebGL rendering is unavailable in this browser context. All rigging statics calculations, crane controls, and assessment scoring remain active.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export const RiggingScene3D: React.FC<RiggingScene3DProps> = (props) => {
  const [webglReady, setWebglReady] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setWebglReady(false);
    } catch {
      setWebglReady(false);
    }
  }, []);

  if (!webglReady) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0D1622] text-slate-300 p-6 text-center">
        <p className="font-semibold text-amber-400">3D Viewport Ready (Software/Headless Mode)</p>
        <p className="text-xs text-slate-400 mt-1">
          Live Load Y: {props.frame.loadYFt.toFixed(2)} ft · Tilt: {props.frame.tiltZDeg.toFixed(1)}° · Tensions:{' '}
          {props.frame.liveTensionLeftLb} / {props.frame.liveTensionRightLb} lb
        </p>
      </div>
    );
  }

  return (
    <WebGLErrorBoundary>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ position: [11.5, 9.5, 19.5], fov: 44, near: 0.2, far: 140 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <SceneContents {...props} />
      </Canvas>
    </WebGLErrorBoundary>
  );
};

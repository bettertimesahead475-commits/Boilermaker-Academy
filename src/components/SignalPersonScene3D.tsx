import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CraneSignalId } from '../types/academy';

interface SignalPersonScene3DProps {
  signalId: CraneSignalId;
  slowMotion: boolean;
  playing: boolean;
}

const EnvironmentSetup: React.FC = () => {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = new RoomEnvironment();
    const rt = pmrem.fromScene(env, 0.04);
    scene.environment = rt.texture;
    return () => {
      scene.environment = null;
      rt.dispose();
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

const ArticulatedSignalPerson: React.FC<{
  signalId: CraneSignalId;
  slowMotion: boolean;
  playing: boolean;
}> = ({ signalId, slowMotion, playing }) => {
  const timeRef = useRef(0);

  const rightShoulderRef = useRef<THREE.Group>(null);
  const rightElbowRef = useRef<THREE.Group>(null);
  const rightWristRef = useRef<THREE.Group>(null);
  const leftShoulderRef = useRef<THREE.Group>(null);
  const leftElbowRef = useRef<THREE.Group>(null);
  const leftWristRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (playing) {
      timeRef.current += delta * (slowMotion ? 0.42 : 1.0);
    }
    const t = timeRef.current;

    if (
      !rightShoulderRef.current ||
      !rightElbowRef.current ||
      !rightWristRef.current ||
      !leftShoulderRef.current ||
      !leftElbowRef.current ||
      !leftWristRef.current ||
      !torsoRef.current
    ) {
      return;
    }

    // Default neutral standing posture (arms down at sides)
    let rSX = 0.05, rSY = 0, rSZ = -0.14;
    let rEX = -0.15, rEZ = 0;
    let rWX = 0, rWY = 0, rWZ = 0;

    let lSX = 0.05, lSY = 0, lSZ = 0.14;
    let lEX = -0.15, lEZ = 0;
    let lWX = 0, lWY = 0, lWZ = 0;

    switch (signalId) {
      case 'hoist': {
        // Forearm vertical, forefinger pointing up, small horizontal circles
        rSX = -0.65;
        rSZ = -0.35;
        rEX = -2.45;
        rWX = Math.sin(t * 5.2) * 0.25;
        rWZ = Math.cos(t * 5.2) * 0.25;
        break;
      }
      case 'lower': {
        // Arm extended downward, forefinger pointing down, small horizontal circles
        rSX = 0.12;
        rSZ = -0.32;
        rEX = -0.1;
        rWX = Math.sin(t * 5.0) * 0.25;
        rWZ = Math.cos(t * 5.0) * 0.25;
        break;
      }
      case 'stop': {
        // One arm extended horizontally palm down, sweep horizontally back & forth
        rSX = 0;
        rSZ = -1.5;
        rSY = Math.sin(t * 4.5) * 0.55;
        rEX = 0;
        rWY = 0;
        break;
      }
      case 'emergency-stop': {
        // BOTH arms extended horizontally palms down, rapid sweep back & forth
        rSX = 0;
        rSZ = -1.52;
        rSY = Math.sin(t * 6.8) * 0.6;
        rEX = 0;

        lSX = 0;
        lSZ = 1.52;
        lSY = -Math.sin(t * 6.8) * 0.6;
        lEX = 0;
        break;
      }
      case 'move-slowly': {
        // Left hand held flat & motionless in front of right hand giving slow hoist circle
        lSX = -1.1;
        lSZ = 0.25;
        lSY = -0.45;
        lEX = -0.95;

        rSX = -0.6;
        rSZ = -0.25;
        rEX = -2.45;
        rWX = Math.sin(t * 3.0) * 0.18;
        rWZ = Math.cos(t * 3.0) * 0.18;
        break;
      }
      case 'travel': {
        // Arm extended forward, hand open slightly raised, pushing motion
        rSX = -1.35 + Math.sin(t * 4.2) * 0.25;
        rSZ = -0.1;
        rEX = -0.35 + Math.sin(t * 4.2) * 0.25;
        rWX = -0.7;
        break;
      }
      case 'trolley-travel': {
        // Palm up, fingers closed, thumb pointing horizontally with short horizontal jerks
        rSX = -0.55;
        rSZ = -0.55;
        rEX = -1.25;
        rSY = Math.sin(t * 5.5) * 0.24;
        break;
      }
      case 'swing': {
        // Arm extended horizontally pointing with forefinger in direction of swing
        rSX = 0;
        rSZ = -1.52;
        rSY = 0.15 + Math.sin(t * 2.4) * 0.12;
        rEX = 0;
        break;
      }
      case 'boom-up': {
        // Arm extended horizontally, thumb pointing UP
        rSX = -0.2;
        rSZ = -1.38;
        rEX = 0;
        rWZ = 0.12 + Math.sin(t * 3.5) * 0.08;
        break;
      }
      case 'boom-down': {
        // Arm extended horizontally, thumb pointing DOWN
        rSX = -0.2;
        rSZ = -1.38;
        rEX = 0;
        rWZ = -0.25;
        rWX = Math.PI + Math.sin(t * 3.5) * 0.08;
        break;
      }
      case 'use-main-hoist': {
        // Tap fist on top of hard hat
        rSX = -1.85;
        rSZ = -0.65;
        rEX = -1.85 - Math.abs(Math.sin(t * 4.8)) * 0.35;
        break;
      }
      case 'use-aux-hoist': {
        // Left hand taps bent right elbow
        rSX = -0.45;
        rSZ = -0.35;
        rEX = -1.65;

        lSX = -0.95;
        lSY = -0.55;
        lSZ = 0.15;
        lEX = -0.75 + Math.abs(Math.sin(t * 5.0)) * 0.22;
        break;
      }
      case 'dog-everything': {
        // Hands clasped together in front of torso
        rSX = -0.75;
        rSY = 0.55;
        rSZ = -0.25;
        rEX = -0.95;

        lSX = -0.75;
        lSY = -0.55;
        lSZ = 0.25;
        lEX = -0.95;
        break;
      }
    }

    rightShoulderRef.current.rotation.set(rSX, rSY, rSZ);
    rightElbowRef.current.rotation.set(rEX, 0, rEZ);
    rightWristRef.current.rotation.set(rWX, rWY, rWZ);

    leftShoulderRef.current.rotation.set(lSX, lSY, lSZ);
    leftElbowRef.current.rotation.set(lEX, 0, lEZ);
    leftWristRef.current.rotation.set(lWX, lWY, lWZ);
  });

  const fingerUp = signalId === 'hoist' || signalId === 'lower' || signalId === 'swing' || signalId === 'move-slowly';
  const thumbMode =
    signalId === 'boom-up' || signalId === 'boom-down' || signalId === 'trolley-travel';

  return (
    <group position={[0, 0, 0]}>
      {/* Boots & Legs */}
      <mesh position={[-0.22, 0.09, 0.04]} castShadow>
        <boxGeometry args={[0.2, 0.18, 0.36]} />
        <meshStandardMaterial color="#27201a" roughness={0.85} />
      </mesh>
      <mesh position={[0.22, 0.09, 0.04]} castShadow>
        <boxGeometry args={[0.2, 0.18, 0.36]} />
        <meshStandardMaterial color="#27201a" roughness={0.85} />
      </mesh>
      <mesh position={[-0.22, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.12, 0.95, 14]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.85} />
      </mesh>
      <mesh position={[0.22, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.12, 0.95, 14]} />
        <meshStandardMaterial color="#1e3a5f" roughness={0.85} />
      </mesh>

      {/* Torso with Hi-Vis Lime Safety Vest */}
      <group ref={torsoRef} position={[0, 1.5, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.74, 0.88, 0.42]} />
          <meshStandardMaterial color="#a3e635" roughness={0.55} />
        </mesh>
        {/* Reflective Silver Vest Stripes */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.76, 0.1, 0.44]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.25} />
        </mesh>
        <mesh position={[-0.2, 0.22, 0]}>
          <boxGeometry args={[0.1, 0.44, 0.44]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.25} />
        </mesh>
        <mesh position={[0.2, 0.22, 0]}>
          <boxGeometry args={[0.1, 0.44, 0.44]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.25} />
        </mesh>

        {/* Head & CSA Type-1 Hard Hat */}
        <group position={[0, 0.68, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.21, 18, 18]} />
            <meshStandardMaterial color="#d4a373" roughness={0.75} />
          </mesh>
          {/* Hard hat dome + brim */}
          <mesh position={[0, 0.11, 0]} castShadow>
            <sphereGeometry args={[0.24, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.32} metalness={0.15} />
          </mesh>
          <mesh position={[0, 0.1, 0.05]}>
            <cylinderGeometry args={[0.27, 0.27, 0.03, 20]} />
            <meshStandardMaterial color="#f59e0b" roughness={0.32} />
          </mesh>
        </group>

        {/* RIGHT ARM (Character's right = -X when facing +Z camera) */}
        <group ref={rightShoulderRef} position={[-0.46, 0.34, 0]}>
          <mesh>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.24, 0]} castShadow>
            <cylinderGeometry args={[0.095, 0.085, 0.46, 12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.75} />
          </mesh>
          <group ref={rightElbowRef} position={[0, -0.48, 0]}>
            <mesh>
              <sphereGeometry args={[0.085, 12, 12]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, -0.22, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.07, 0.42, 12]} />
              <meshStandardMaterial color="#334155" roughness={0.75} />
            </mesh>
            {/* Right Gloved Hand */}
            <group ref={rightWristRef} position={[0, -0.46, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.14, 0.18, 0.09]} />
                <meshStandardMaterial color="#fb923c" roughness={0.55} />
              </mesh>
              {fingerUp && (
                <mesh position={[0, -0.15, 0]}>
                  <cylinderGeometry args={[0.025, 0.02, 0.16, 8]} />
                  <meshStandardMaterial color="#fb923c" roughness={0.5} />
                </mesh>
              )}
              {thumbMode && (
                <mesh position={[0.1, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.028, 0.024, 0.14, 8]} />
                  <meshStandardMaterial color="#fb923c" roughness={0.5} />
                </mesh>
              )}
            </group>
          </group>
        </group>

        {/* LEFT ARM (+X side) */}
        <group ref={leftShoulderRef} position={[0.46, 0.34, 0]}>
          <mesh>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.24, 0]} castShadow>
            <cylinderGeometry args={[0.095, 0.085, 0.46, 12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.75} />
          </mesh>
          <group ref={leftElbowRef} position={[0, -0.48, 0]}>
            <mesh>
              <sphereGeometry args={[0.085, 12, 12]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[0, -0.22, 0]} castShadow>
              <cylinderGeometry args={[0.08, 0.07, 0.42, 12]} />
              <meshStandardMaterial color="#334155" roughness={0.75} />
            </mesh>
            <group ref={leftWristRef} position={[0, -0.46, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.14, 0.18, 0.09]} />
                <meshStandardMaterial color="#fb923c" roughness={0.55} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
};

export const SignalPersonScene3D: React.FC<SignalPersonScene3DProps> = ({
  signalId,
  slowMotion,
  playing,
}) => {
  const [webglReady, setWebglReady] = useState(true);

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl2') || c.getContext('webgl');
      if (!gl) setWebglReady(false);
    } catch {
      setWebglReady(false);
    }
  }, []);

  if (!webglReady) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0D1622] text-slate-300 p-6 text-center">
        <p className="font-semibold text-amber-400">3D Signalperson Viewport Fallback</p>
        <p className="text-xs text-slate-400 mt-1">
          Signal active: {signalId.toUpperCase()} ({slowMotion ? 'Slow Motion' : 'Real-Time'}).
        </p>
      </div>
    );
  }

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [0.4, 2.0, 4.1], fov: 42, near: 0.1, far: 40 }}
    >
      <EnvironmentSetup />
      <color attach="background" args={['#0d1622']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 7, 5]} intensity={1.4} castShadow />
      <pointLight position={[-3, 3, 2]} intensity={0.45} color="#38bdf8" />

      {/* Floor apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[3.8, 32]} />
        <meshStandardMaterial color="#16202e" roughness={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[1.4, 1.48, 36]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>

      <ArticulatedSignalPerson
        signalId={signalId}
        slowMotion={slowMotion}
        playing={playing}
      />

      <OrbitControls
        makeDefault
        target={[0, 1.35, 0]}
        enableDamping
        minDistance={2.2}
        maxDistance={7.5}
        maxPolarAngle={Math.PI / 2 - 0.05}
      />
    </Canvas>
  );
};

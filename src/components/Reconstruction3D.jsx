import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Play, Pause, RotateCcw, Sparkles, Video, Compass, ArrowUp, ArrowLeft, ArrowRight, Share2, MapPin, CheckCircle2, X, ChevronRight, Hand, Download, Loader, Trash2, ShieldAlert, AlertTriangle, Activity, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { getCaseById, deleteCase, updateCase } from '../services/firestore';
import AlternativeScenarios from './AlternativeScenarios';
import MapView from './MapView';
import CaseAnalysis from './CaseAnalysis';

// --- HELPER FUNCTIONS FOR TYPE-SAFETY COORDINATES ---
const safePos = (pos, fallback = [0, 0, 0]) => {
  if (Array.isArray(pos) && pos.length === 3) {
    return pos.map(n => typeof n === 'number' && !isNaN(n) ? n : 0);
  }
  return fallback;
};

const safeScale = (scale, fallback = [1, 1, 1]) => {
  if (Array.isArray(scale) && scale.length === 3) {
    return scale.map(n => typeof n === 'number' && !isNaN(n) ? n : 1);
  }
  return fallback;
};

// --- CANVAS ERROR BOUNDARY ---
class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('3D Canvas Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020617] gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">3D Engine Error</p>
            <p className="text-gray-400 text-xs mt-1 max-w-[240px]">{String(this.state.error?.message || 'Unknown render error')}</p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white text-xs font-semibold hover:bg-[#8b5cf6] transition"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- SAFE COLOR RESOLVER (null-proof) ---
function resolveColor(color, fallback) {
  const fb = fallback || '#64748b';
  if (!color || typeof color !== 'string') return fb;
  const c = color.toLowerCase().trim();
  if (c === 'red') return '#dc2626';
  if (c === 'blue') return '#2563eb';
  if (c === 'green') return '#16a34a';
  if (c === 'yellow') return '#ca8a04';
  if (c === 'white') return '#f8fafc';
  if (c === 'black') return '#0f172a';
  if (c === 'brown') return '#78350f';
  if (c === 'grey' || c === 'gray') return '#64748b';
  if (c === 'silver') return '#94a3b8';
  if (c === 'orange') return '#ea580c';
  if (c.startsWith('#')) return c;
  return fb;
}

// --- PROCEDURAL VEHICLE ASSETS ---

function VehicleModel({ type, color, scale = [1, 1, 1] }) {
  const hexColor = useMemo(() => resolveColor(color, '#dc2626'), [color]);
  const cleanScale = safeScale(scale);

  if (type === 'scooter' || type === 'motorcycle' || type === 'bike') {
    return (
      <group>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.2, 0.5 * cleanScale[1], 1.2 * cleanScale[2]]} />
          <meshStandardMaterial color={hexColor} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.6, -0.2]} castShadow>
          <boxGeometry args={[0.22, 0.1, 0.5]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.8, 0.4]} castShadow>
          <boxGeometry args={[0.7, 0.08, 0.08]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        {[[0, 0.25, 0.5], [0, 0.25, -0.5]].map((pos, i) => (
          <mesh key={i} position={pos} rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
          </mesh>
        ))}
      </group>
    );
  }

  if (type === 'truck' || type === 'bus') {
    return (
      <group>
        <mesh position={[0, 1.1, 1.2]} castShadow>
          <boxGeometry args={[2.0 * cleanScale[0], 1.6 * cleanScale[1], 1.4 * cleanScale[2]]} />
          <meshStandardMaterial color={hexColor} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.9, -1.0]} castShadow>
          <boxGeometry args={[2.2 * cleanScale[0], 1.2 * cleanScale[1], 3.4 * cleanScale[2]]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
        {[[0.9, 0.45, 1.2], [-0.9, 0.45, 1.2], [0.9, 0.45, -0.6], [-0.9, 0.45, -0.6], [0.9, 0.45, -1.8], [-0.9, 0.45, -1.8]].map((pos, i) => (
          <mesh key={i} position={pos} rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[0.45, 0.45, 0.3, 16]} />
            <meshStandardMaterial color="#050505" roughness={0.9} />
          </mesh>
        ))}
      </group>
    );
  }

  if (type === 'pedestrian') {
    return (
      <group>
        <mesh position={[0, 0.8, 0]} castShadow>
          <capsuleGeometry args={[0.2, 0.8, 8, 16]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.4, 0]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#eab308" />
        </mesh>
      </group>
    );
  }

  if (type === 'suv') {
    return (
      <group>
        {/* Lower SUV body */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1.8 * cleanScale[0], 0.65 * cleanScale[1], 3.8 * cleanScale[2]]} />
          <meshStandardMaterial color={hexColor} roughness={0.4} />
        </mesh>
        {/* Taller Cabin */}
        <mesh position={[0, 1.05, -0.3]} castShadow>
          <boxGeometry args={[1.6 * cleanScale[0], 0.65 * cleanScale[1], 2.2 * cleanScale[2]]} />
          <meshStandardMaterial color={hexColor} roughness={0.4} />
        </mesh>
        {/* Front windshield */}
        <mesh position={[0, 1.0, 0.85]} rotation={[-0.4, 0, 0]}>
          <planeGeometry args={[1.4, 0.55]} />
          <meshPhysicalMaterial color="#020617" metalness={0.9} roughness={0.05} />
        </mesh>
        {/* Wheels */}
        {[[0.88, 0.38, 1.2], [-0.88, 0.38, 1.2], [0.88, 0.38, -1.2], [-0.88, 0.38, -1.2]].map((pos, i) => (
          <mesh key={i} position={pos} rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[0.38, 0.38, 0.24, 16]} />
            <meshStandardMaterial color="#090909" roughness={0.9} />
          </mesh>
        ))}
      </group>
    );
  }

  if (type === 'rickshaw' || type === 'auto_rickshaw' || type === 'tuk_tuk' || type === 'auto') {
    return (
      <group>
        {/* Lower Chassis/Chamber */}
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[1.1 * cleanScale[0], 0.2, 2.0 * cleanScale[2]]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        {/* Yellow Canopy */}
        <mesh position={[0, 0.9, -0.2]} castShadow>
          <boxGeometry args={[1.0 * cleanScale[0], 0.7, 1.3 * cleanScale[2]]} />
          <meshStandardMaterial color={color === 'blue' ? '#ca8a04' : hexColor} roughness={0.4} />
        </mesh>
        {/* Front slanted canopy/nose */}
        <mesh position={[0, 0.65, 0.7]} rotation={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.9 * cleanScale[0], 0.6, 0.5 * cleanScale[2]]} />
          <meshStandardMaterial color="#16a34a" roughness={0.5} />
        </mesh>
        {/* Front windshield frame */}
        <mesh position={[0, 1.05, 0.6]} rotation={[-0.1, 0, 0]}>
          <planeGeometry args={[0.8, 0.45]} />
          <meshPhysicalMaterial color="#020617" metalness={0.9} roughness={0.05} opacity={0.7} transparent />
        </mesh>
        {/* Three wheels: 1 Front center, 2 Rear sides */}
        <mesh position={[0, 0.2, 0.9]} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.12, 12]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
        </mesh>
        {[[0.55, 0.2, -0.6], [-0.55, 0.2, -0.6]].map((pos, i) => (
          <mesh key={i} position={pos} rotation={[0, 0, Math.PI/2]} castShadow>
            <cylinderGeometry args={[0.22, 0.22, 0.14, 12]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.9} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group>
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.7 * cleanScale[0], 0.55 * cleanScale[1], 3.5 * cleanScale[2]]} />
        <meshStandardMaterial color={hexColor} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.85, -0.2]} castShadow>
        <boxGeometry args={[1.5 * cleanScale[0], 0.5 * cleanScale[1], 1.9 * cleanScale[2]]} />
        <meshStandardMaterial color={hexColor} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.85, 0.8]} rotation={[-0.3, 0, 0]}>
        <planeGeometry args={[1.2, 0.45]} />
        <meshPhysicalMaterial color="#020617" metalness={0.9} roughness={0.05} />
      </mesh>
      {[[0.82, 0.35, 1.1], [-0.82, 0.35, 1.1], [0.82, 0.35, -1.1], [-0.82, 0.35, -1.1]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.2, 16]} />
          <meshStandardMaterial color="#090909" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// --- INDOOR SCENE LIGHTING ---
function IndoorCrimeLighting({ victimPos, currentTime }) {
  const pulseLightRef = useRef();
  useFrame((state) => {
    if (!pulseLightRef.current) return;
    if (currentTime >= 4.8 && currentTime <= 7.2) {
      // Subtle pulse, NOT room-filling
      pulseLightRef.current.intensity = 4 + Math.sin(state.clock.elapsedTime * 8) * 2;
    } else {
      pulseLightRef.current.intensity = 0;
    }
  });
  return (
    <>
      {/* Normal room ambient — NOT dark */}
      <ambientLight intensity={0.7} color="#f0f4ff" />
      <hemisphereLight args={['#e0e8ff', '#1a1030', 0.5]} />
      {/* Overhead warm bulb */}
      <pointLight position={[0, 4, 0]} intensity={4} color="#fff8e7" distance={14} decay={2} castShadow />
      {/* Cold forensic fill from side */}
      <directionalLight position={[-5, 8, 5]} intensity={0.8} color="#ccd8ff" castShadow />
      {/* Tight red pulse ONLY around victim - small distance=2.5 */}
      <pointLight
        ref={pulseLightRef}
        position={[victimPos[0], 1.2, victimPos[2]]}
        intensity={0}
        color="#ff0000"
        distance={2.5}
        decay={2}
      />
    </>
  );
}

// --- TRAVELING DIRECTION ARROWS ---
function TravelingArrow({ angle }) {
  const rad = (angle || 0) * (Math.PI / 180);
  const arrowPoints = [
    [0, 0.03, 0],
    [0, 0.03, 2.5]
  ];
  return (
    <group rotation={[0, rad, 0]}>
      <Line points={arrowPoints} color="#00E5FF" lineWidth={3.0} opacity={0.8} transparent />
      <mesh position={[0, 0.03, 2.5]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.18, 0.4, 4]} />
        <meshBasicMaterial color="#00E5FF" />
      </mesh>
    </group>
  );
}

// --- GENERAL PROCEDURAL HOUSE OBJECTS ---
function ProceduralObject({ type, color, scale = [1, 1, 1] }) {
  const hexColor = useMemo(() => resolveColor(color, '#2563eb'), [color]);
  const cleanScale = safeScale(scale);


  switch (type) {
    case 'bed':
      return (
        <group>
          <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.8 * cleanScale[0], 0.7 * cleanScale[1], 2.2 * cleanScale[2]]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.7, -1.05]} castShadow>
            <boxGeometry args={[1.9 * cleanScale[0], 1.0 * cleanScale[1], 0.15]} />
            <meshStandardMaterial color={hexColor} roughness={0.6} />
          </mesh>
        </group>
      );
    case 'table':
    case 'desk':
      return (
        <group>
          <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.6 * cleanScale[0], 0.08 * cleanScale[1], 1.0 * cleanScale[2]]} />
            <meshStandardMaterial color={hexColor} roughness={0.5} />
          </mesh>
          {[[-0.7, -0.5], [0.7, -0.5], [-0.7, 0.5], [0.7, 0.5]].map((pos, i) => (
            <mesh key={i} position={[pos[0], 0.35, pos[1]]}>
              <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          ))}
        </group>
      );
    case 'chair':
      return (
        <group>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.55 * cleanScale[0], 0.06, 0.55 * cleanScale[2]]} />
            <meshStandardMaterial color={hexColor} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.85, -0.24]} rotation={[-0.1, 0, 0]} castShadow>
            <boxGeometry args={[0.5 * cleanScale[0], 0.45, 0.05]} />
            <meshStandardMaterial color={hexColor} roughness={0.6} />
          </mesh>
        </group>
      );
    case 'tree':
      return (
        <group>
          <mesh position={[0, 1.0, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.22, 2.0, 8]} />
            <meshStandardMaterial color="#5c4033" roughness={0.9} />
          </mesh>
          <mesh position={[0, 2.2, 0]} castShadow>
            <sphereGeometry args={[0.8, 12, 12]} />
            <meshStandardMaterial color="#16a34a" roughness={0.6} />
          </mesh>
        </group>
      );
    case 'fence':
      return (
        <group>
          {[[-0.9, 0], [0.9, 0]].map((pos, i) => (
            <mesh key={i} position={[pos[0], 0.5, pos[1]]} castShadow>
              <cylinderGeometry args={[0.06, 0.06, 1.0, 8]} />
              <meshStandardMaterial color="#78350f" />
            </mesh>
          ))}
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1.8, 0.08, 0.04]} />
            <meshStandardMaterial color="#78350f" />
          </mesh>
        </group>
      );
    case 'traffic_signal':
    case 'traffic_light':
    case 'signal':
      return (
        <group>
          {/* Post/Pole */}
          <mesh position={[0, 2.5, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.08, 5.0, 8]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          {/* Arm */}
          <mesh position={[0, 4.8, 0.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 1.8, 8]} />
            <meshStandardMaterial color="#334155" roughness={0.7} />
          </mesh>
          {/* Box housing */}
          <mesh position={[0, 4.8, 1.7]} castShadow>
            <boxGeometry args={[0.4, 0.9, 0.4]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} />
          </mesh>
          {/* Active light mesh (just a colored circle) */}
          <mesh position={[0, 4.8, 1.91]}>
            <circleGeometry args={[0.1, 16]} />
            <meshBasicMaterial color="#ef4444" /> {/* Red signal */}
          </mesh>
        </group>
      );
    default:
      return (
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <boxGeometry args={cleanScale} />
          <meshStandardMaterial color={hexColor} roughness={0.6} />
        </mesh>
      );
  }
}

// --- FORENSIC MANNEQUIN MODEL ---
function Mannequin({ position, rotation = [0, 0, 0], color = "#ef4444", label = "Actor", posture = "standing", timeVisible, showLabel = true, role = 'victim', currentTime = 0 }) {
  const groupRef = useRef();
  const rightArmRef = useRef();
  const leftArmRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    if (posture === 'struggle') {
      if (role === 'suspect') {
        // Torso leans forward aggressively
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 5) * 0.08;
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3) * 0.04;
        
        // Right arm does a rapid stabbing motion down-and-up
        if (rightArmRef.current) {
          rightArmRef.current.rotation.x = -0.8 + Math.sin(state.clock.elapsedTime * 12) * 0.6;
          rightArmRef.current.rotation.z = 0.1;
        }
        // Left arm reaches out to grapple/hold
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = -1.3 + Math.sin(state.clock.elapsedTime * 4) * 0.15;
          leftArmRef.current.rotation.z = -0.15;
        }
      } else {
        // Victim defensive reaction
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 6) * 0.12;
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 5) * 0.08;
        
        // Raised arms blocking the attacks
        if (rightArmRef.current) {
          rightArmRef.current.rotation.x = -1.4 + Math.sin(state.clock.elapsedTime * 8) * 0.15;
          rightArmRef.current.rotation.z = 0.3 + Math.cos(state.clock.elapsedTime * 6) * 0.08;
        }
        if (leftArmRef.current) {
          leftArmRef.current.rotation.x = -1.4 + Math.cos(state.clock.elapsedTime * 8) * 0.15;
          leftArmRef.current.rotation.z = -0.3 - Math.sin(state.clock.elapsedTime * 6) * 0.08;
        }
      }
    } else if (posture === 'falling') {
      // Arms flail backward during a fall
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -0.3 + Math.sin(state.clock.elapsedTime * 6) * 0.3;
        rightArmRef.current.rotation.z = 0.4;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.3 + Math.cos(state.clock.elapsedTime * 6) * 0.3;
        leftArmRef.current.rotation.z = -0.4;
      }
    } else {
      groupRef.current.rotation.y = 0;
      groupRef.current.rotation.z = 0;
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.z = 0;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0;
        leftArmRef.current.rotation.z = 0;
      }
    }
  });

  if (!timeVisible) return null;
  const isProne = posture?.toLowerCase() === 'prone' || posture?.toLowerCase() === 'lying' || posture?.toLowerCase() === 'dead';
  
  const cleanPos = safePos(position);
  if (isProne) {
    cleanPos[1] = 0.27; // Keep above floor level when prone
  }
  
  // Scale: 1.5x makes figures clearly visible without being cartoonishly huge
  const S = 1.5;
  
  // Rotate around X axis to lay down, but preserve the facing Y orientation
  const groupRotation = isProne ? [Math.PI / 2, rotation[1], 0] : rotation;
  
  return (
    <group position={cleanPos} scale={[S, S, S]} rotation={groupRotation}>
      <group ref={groupRef}>
        <mesh position={[0, 0.7, 0]} castShadow>
          <capsuleGeometry args={[0.18, 0.6, 8, 16]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
        </mesh>
        {role === 'victim' && currentTime >= 6.0 && (
          <group>
            {/* Stab stain on chest */}
            <mesh position={[0, 0.8, 0.19]} rotation={[0, 0, 0]}>
              <circleGeometry args={[0.06, 16]} />
              <meshBasicMaterial color="#7f1d1d" />
            </mesh>
            {/* Secondary chest stain */}
            <mesh position={[-0.04, 0.68, 0.19]} rotation={[0, 0, 0]}>
              <circleGeometry args={[0.035, 12]} />
              <meshBasicMaterial color="#7f1d1d" />
            </mesh>
            {/* Stab stain on back */}
            <mesh position={[0, 0.8, -0.19]} rotation={[0, Math.PI, 0]}>
              <circleGeometry args={[0.06, 16]} />
              <meshBasicMaterial color="#7f1d1d" />
            </mesh>
            {/* Secondary back stain */}
            <mesh position={[0.04, 0.68, -0.19]} rotation={[0, Math.PI, 0]}>
              <circleGeometry args={[0.035, 12]} />
              <meshBasicMaterial color="#7f1d1d" />
            </mesh>
          </group>
        )}
        <mesh position={[0, 1.28, 0]} castShadow>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <group position={[-0.28, 1.05, 0]} ref={rightArmRef}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.45, 8, 16]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        </group>
        <group position={[0.28, 1.05, 0]} ref={leftArmRef}>
          <mesh position={[0, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.45, 8, 16]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
        </group>
        {[[-0.11, 0.2, 0], [0.11, 0.2, 0]].map((p, i) => (
          <mesh key={i} position={p} castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.42, 8]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        ))}
      </group>
      {showLabel && (
        <Html distanceFactor={7} position={[0, 1.7, 0]} center zIndexRange={[100, 0]}>
          <div className="bg-[#0b0f19]/90 border border-white/10 text-white font-mono text-[8px] px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap uppercase">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// --- WEAPON / KNIFE OBJECT ---
function WeaponObject({ position, visible }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current || !visible) return;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 15) * 0.4;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 18) * 0.3;
  });
  if (!visible) return null;
  const [x, , z] = safePos(position);
  return (
    <group ref={ref} position={[x, 1.1, z]}>
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.04, 0.35, 0.015]} />
        <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, -0.22, 0]}>
        <boxGeometry args={[0.055, 0.16, 0.04]} />
        <meshStandardMaterial color="#3b1a08" roughness={0.8} />
      </mesh>
    </group>
  );
}

// --- FORENSIC EVIDENCE MARKER ---
function ForensicMarker({ position, index, label, type, timeVisible }) {
  if (!timeVisible) return null;
  const cleanPos = safePos(position);

  const renderMesh = () => {
    if (type === 'blood_stain') return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} receiveShadow>
        <circleGeometry args={[0.35, 16]} />
        <meshBasicMaterial color="#b91c1c" transparent opacity={0.85} depthWrite={false} />
      </mesh>
    );
    if (type === 'phone') return (
      <mesh rotation={[-Math.PI / 2, 0, 0.2]} position={[0, 0.01, 0]} castShadow>
        <boxGeometry args={[0.13, 0.25, 0.02]} />
        <meshStandardMaterial color="#0a0a0a" metalness={0.8} roughness={0.1} />
      </mesh>
    );
    return (
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    );
  };

  return (
    <group position={cleanPos}>
      {renderMesh()}
      {/* Yellow evidence cone */}
      <mesh position={[0.15, 0.14, 0.15]} castShadow>
        <coneGeometry args={[0.06, 0.24, 4]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
    </group>
  );
}

// --- WEATHER EFFECT ---
function RainParticles() {
  const points = useRef();
  const count = 500;
  
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 50;
      arr[i * 3 + 1] = Math.random() * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!points.current) return;
    const geo = points.current.geometry;
    const pos = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) - delta * 18;
      if (y < 0) y = 20;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#94a3b8" size={0.07} transparent opacity={0.4} />
    </points>
  );
}

// --- DYNAMIC ENVIRONMENTS ---
function RoadEnvironment({ sceneType, dimensions }) {
  const dims = dimensions || { width: 20, length: 45 };
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[dims.width, dims.length]} />
        <meshStandardMaterial color="#0c101b" roughness={0.25} metalness={0.2} />
      </mesh>
      {[-3.3, 3.3].map((offset, i) => (
        <Line
          key={i}
          points={[[offset, 0.005, -dims.length/2], [offset, 0.005, dims.length/2]]}
          color="#ffffff"
          lineWidth={1}
          dashed
          dashScale={0.8}
          gapSize={1.5}
          dashSize={1.5}
          opacity={0.4}
          transparent
        />
      ))}
      <Line points={[[-0.1, 0.005, -dims.length/2], [-0.1, 0.005, dims.length/2]]} color="#fbbf24" lineWidth={1.5} opacity={0.7} transparent />
      <Line points={[[0.1, 0.005, -dims.length/2], [0.1, 0.005, dims.length/2]]} color="#fbbf24" lineWidth={1.5} opacity={0.7} transparent />

      {sceneType === 'intersection' && (
        <group>
          {/* Horizontal crossroad plane */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.002, 0]} receiveShadow>
            <planeGeometry args={[dims.length, dims.width]} />
            <meshStandardMaterial color="#0c101b" roughness={0.25} metalness={0.2} />
          </mesh>
          {/* Zebra pedestrian crossings */}
          {[-6, -4, -2, 0, 2, 4, 6].map((x) => (
            <mesh key={x} position={[x, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.7, 3.5]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
            </mesh>
          ))}
          {/* Traffic signals on all 4 corners of the intersection */}
          <group position={[10.5, 0, -10.5]} rotation={[0, 0, 0]}>
            <ProceduralObject type="traffic_signal" color="black" />
          </group>
          <group position={[-10.5, 0, -10.5]} rotation={[0, 0, 0]}>
            <ProceduralObject type="traffic_signal" color="black" />
          </group>
          <group position={[10.5, 0, 10.5]} rotation={[0, Math.PI, 0]}>
            <ProceduralObject type="traffic_signal" color="black" />
          </group>
          <group position={[-10.5, 0, 10.5]} rotation={[0, Math.PI, 0]}>
            <ProceduralObject type="traffic_signal" color="black" />
          </group>
        </group>
      )}
    </group>
  );
}

function ParkEnvironment({ dimensions }) {
  const dims = dimensions || { width: 25, length: 25 };
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[dims.width, dims.length]} />
      <meshStandardMaterial color="#14532d" roughness={0.9} />
    </mesh>
  );
}

function IndoorEnvironment({ sceneType, dimensions }) {
  const dims = dimensions || { width: 12, length: 15 };
  const isWarehouse = sceneType === 'warehouse';
  const floorColor = isWarehouse ? '#475569' : '#8B5A2B';
  const wallColor = isWarehouse ? '#334155' : '#cbd5e1';
  const trimColor = '#1e293b';

  return (
    <group>
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[dims.width + 1.5, 0.3, dims.length + 1.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[dims.width, dims.length]} />
        <meshStandardMaterial color={floorColor} roughness={isWarehouse ? 0.8 : 0.4} metalness={isWarehouse ? 0.1 : 0.3} />
      </mesh>
      <gridHelper args={[Math.max(dims.width, dims.length), 20, "#000000", "#000000"]} position={[0, 0.005, 0]} opacity={0.15} transparent />
      <group>
        <mesh position={[0, 0.25, -dims.length / 2 - 0.2]} receiveShadow castShadow>
          <boxGeometry args={[dims.width + 0.4, 0.5, 0.4]} />
          <meshStandardMaterial color={wallColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.52, -dims.length / 2 - 0.2]} receiveShadow>
          <boxGeometry args={[dims.width + 0.45, 0.04, 0.45]} />
          <meshStandardMaterial color={trimColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.25, dims.length / 2 + 0.2]} receiveShadow castShadow>
          <boxGeometry args={[dims.width + 0.4, 0.5, 0.4]} />
          <meshStandardMaterial color={wallColor} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.52, dims.length / 2 + 0.2]} receiveShadow>
          <boxGeometry args={[dims.width + 0.45, 0.04, 0.45]} />
          <meshStandardMaterial color={trimColor} roughness={0.7} />
        </mesh>
        <mesh position={[dims.width / 2 + 0.2, 0.25, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.4, 0.5, dims.length + 0.4]} />
          <meshStandardMaterial color={wallColor} roughness={0.9} />
        </mesh>
        <mesh position={[dims.width / 2 + 0.2, 0.52, 0]} receiveShadow>
          <boxGeometry args={[0.45, 0.04, dims.length + 0.45]} />
          <meshStandardMaterial color={trimColor} roughness={0.7} />
        </mesh>
        <mesh position={[-dims.width / 2 - 0.2, 0.25, 0]} receiveShadow castShadow>
          <boxGeometry args={[0.4, 0.5, dims.length + 0.4]} />
          <meshStandardMaterial color={wallColor} roughness={0.9} />
        </mesh>
        <mesh position={[-dims.width / 2 - 0.2, 0.52, 0]} receiveShadow>
          <boxGeometry args={[0.45, 0.04, dims.length + 0.45]} />
          <meshStandardMaterial color={trimColor} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// --- CAMERA AUTO-POSITION for indoor scenes ---
function IndoorCameraSetup({ victimPos, currentTime, isPlaying }) {
  const { camera } = useThree();
  const hasSet = useRef(false);

  // On first render, snap camera close to room at front-angle
  useEffect(() => {
    if (hasSet.current) return;
    hasSet.current = true;
    camera.position.set(0, 6.5, 11);
    camera.lookAt(0, 0.25, 0.5);
  }, [camera]);

  // During struggle and post-incident (>= 5s), center the camera on the victim
  useFrame(() => {
    if (isPlaying && currentTime >= 5.0) {
      const tx = victimPos[0];
      const tz = victimPos[2];
      
      // Smoothly track and frame the victim in the middle of the screen
      camera.position.x += (tx - camera.position.x) * 0.02;
      camera.position.y += (5.5 - camera.position.y) * 0.02;
      camera.position.z += ((tz + 9.5) - camera.position.z) * 0.02;
      
      const targetY = currentTime >= 7.0 ? 0.25 : 0.8;
      camera.lookAt(tx, targetY, tz);
    }
  });

  return null;
}

// --- CAMERA AUTO-POSITION for road/accident scenes ---
function RoadCameraSetup() {
  const { camera } = useThree();
  const hasSet = useRef(false);

  useEffect(() => {
    if (hasSet.current) return;
    hasSet.current = true;
    camera.position.set(0, 24, 0.1);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

// --- FORENSIC 3D CONE MODEL ---
function TrafficCone({ position }) {
  return (
    <group position={position}>
      {/* Black base */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.4, 0.04, 0.4]} />
        <meshStandardMaterial color="#0f172a" roughness={0.9} />
      </mesh>
      {/* Orange cone body */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <coneGeometry args={[0.12, 0.5, 16]} />
        <meshStandardMaterial color="#f97316" roughness={0.5} />
      </mesh>
      {/* White stripe */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.12, 16]} />
        <meshStandardMaterial color="#ffffff" roughness={0.7} />
      </mesh>
    </group>
  );
}

// --- FORENSIC 3D POLICE VEHICLE MODEL ---
function PoliceCarModel({ currentTime = 0 }) {
  const flash = Math.floor(currentTime * 6) % 2 === 0;
  return (
    <group>
      {/* Main black body */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.7, 0.55, 3.5]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.4} />
      </mesh>
      {/* White doors */}
      <mesh position={[0, 0.41, 0]} castShadow>
        <boxGeometry args={[1.72, 0.5, 1.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.85, -0.2]} castShadow>
        <boxGeometry args={[1.5, 0.5, 1.9]} />
        <meshStandardMaterial color="#0b0f19" roughness={0.4} />
      </mesh>
      {/* Flashing Police light bar */}
      <group position={[0, 1.15, -0.2]}>
        <mesh>
          <boxGeometry args={[1.2, 0.1, 0.25]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[-0.4, 0.1, 0]}>
          <boxGeometry args={[0.3, 0.12, 0.2]} />
          <meshBasicMaterial color={flash ? "#ef4444" : "#450a0a"} />
        </mesh>
        <mesh position={[0.4, 0.1, 0]}>
          <boxGeometry args={[0.3, 0.12, 0.2]} />
          <meshBasicMaterial color={!flash ? "#3b82f6" : "#082f49"} />
        </mesh>
        <pointLight position={[-0.4, 0.2, 0]} color="#ef4444" intensity={flash ? 4 : 0} distance={5} />
        <pointLight position={[0.4, 0.2, 0]} color="#3b82f6" intensity={!flash ? 4 : 0} distance={5} />
      </group>
      {/* Wheels */}
      {[[0.82, 0.35, 1.1], [-0.82, 0.35, 1.1], [0.82, 0.35, -1.1], [-0.82, 0.35, -1.1]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.2, 16]} />
          <meshStandardMaterial color="#090909" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// --- FORENSIC 3D AMBULANCE VEHICLE MODEL ---
function AmbulanceModel({ currentTime = 0 }) {
  const flash = Math.floor(currentTime * 6) % 2 === 0;
  return (
    <group>
      {/* Main white body */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[1.9, 1.2, 3.8]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Red stripes */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.92, 0.2, 3.82]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.9, 1.2]}>
        <boxGeometry args={[1.8, 0.5, 0.6]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} />
      </mesh>
      {/* Flashing blue beacons */}
      <group position={[0, 1.35, 1.0]}>
        <mesh position={[-0.7, 0, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color={flash ? "#00E5FF" : "#082f49"} />
        </mesh>
        <mesh position={[0.7, 0, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshBasicMaterial color={!flash ? "#00E5FF" : "#082f49"} />
        </mesh>
        <pointLight position={[-0.7, 0.1, 0]} color="#00E5FF" intensity={flash ? 3 : 0} distance={6} />
        <pointLight position={[0.7, 0.1, 0]} color="#00E5FF" intensity={!flash ? 3 : 0} distance={6} />
      </group>
      {/* Wheels */}
      {[[0.9, 0.4, 1.2], [-0.9, 0.4, 1.2], [0.9, 0.4, -1.2], [-0.9, 0.4, -1.2]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[0, 0, Math.PI/2]} castShadow>
          <cylinderGeometry args={[0.4, 0.4, 0.25, 16]} />
          <meshStandardMaterial color="#050505" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

// --- PROCEDURAL ANIMATED SCENE ---
function SimulationScene({ isPlaying, playbackSpeed, currentTime, setCurrentTime, setIsPlaying, weather, scene3D, activeTab, caseData }) {
  const vehicleRefs = useRef([]);
  const debrisRefs = useRef([]);
  const collisionTime = 5.0;

  const dims = scene3D?.dimensions || { width: 20, length: 45 };
  const sceneType = (scene3D?.sceneType || 'bedroom').toLowerCase();

  const isRoad = ['road', 'highway', 'intersection', 'parking_lot'].includes(sceneType);
  const isPark = ['park', 'forest', 'beach', 'field', 'garden'].includes(sceneType);
  const isIndoor = !isRoad && !isPark;
  const impact = safePos(scene3D?.impactPoint?.position, [0, 0, 0]);

  useFrame((state, delta) => {
    if (!isPlaying || activeTab === 'heatmap') return;

    setCurrentTime((prev) => {
      const next = prev + (delta * playbackSpeed);
      const pauseTime = isIndoor ? 8.5 : 6.5;
      if (prev < pauseTime && next >= pauseTime) {
        setTimeout(() => setIsPlaying(false), 0);
        return pauseTime;
      }
      if (next >= 10.0) return 0.0;
      return next;
    });

    scene3D?.layoutObjects?.forEach((item, idx) => {
      const ref = vehicleRefs.current[idx];
      if (!ref) return;

      const isVehicleType = ['car', 'suv', 'truck', 'scooter', 'vehicle', 'rickshaw', 'bus'].includes(item.type);
      if (!isVehicleType) return;

      let angle = (item.rotation || 0);
      if (caseData?.caseId === 'ACC-2026-014' && item.id && typeof item.id === 'string') {
        const lowerId = item.id.toLowerCase();
        if (lowerId.includes('civic')) {
          angle = 180;
        } else if (lowerId.includes('fortuner')) {
          angle = -90;
        }
      }
      const rad = angle * (Math.PI / 180);
      const dirX = Math.sin(rad);
      const dirZ = Math.cos(rad);
      const speedFactor = 0.8;

      const cleanPos = safePos(item.position);

      if (currentTime < collisionTime) {
        const distanceLeft = collisionTime - currentTime;
        const x = impact[0] - dirX * speedFactor * distanceLeft;
        const z = impact[2] - dirZ * speedFactor * distanceLeft;
        ref.position.set(x, cleanPos[1], z);
        ref.rotation.y = rad;
      } else {
        const tSince = currentTime - collisionTime;
        let x = impact[0];
        let z = impact[2];
        let rot = rad;

        if (item.type === 'truck') {
          x += dirX * speedFactor * tSince * 0.45;
          z += dirZ * speedFactor * tSince * 0.45;
          rot += tSince * 0.2;
        } else if (item.type === 'car' || item.type === 'suv') {
          x += dirX * speedFactor * tSince * 0.35 + (idx % 2 === 0 ? 1 : -1) * tSince * 0.5;
          z += dirZ * speedFactor * tSince * 0.35 + tSince * 0.25;
          rot += tSince * 1.5;
        } else {
          x += dirX * speedFactor * tSince * 0.2 + Math.sin(tSince * 4) * 1.0;
          z += dirZ * speedFactor * tSince * 0.2 + Math.cos(tSince * 4) * 1.0;
          rot += tSince * 4;
        }

        ref.position.set(x, cleanPos[1], z);
        ref.rotation.y = rot;
      }
    });

    debrisRefs.current.forEach((mesh, idx) => {
      if (!mesh) return;
      const postCol = currentTime > collisionTime;
      const tCol = currentTime - collisionTime;
      mesh.visible = postCol;
      if (postCol) {
        const spreadRad = (idx * 45) * (Math.PI / 180);
        const speed = 2.0 + (idx % 3) * 0.4;
        const x = impact[0] + Math.sin(spreadRad) * tCol * speed;
        const y = 0.05 + Math.abs(Math.sin(state.clock.elapsedTime * 6 + idx)) * 0.8;
        const z = impact[2] + Math.cos(spreadRad) * tCol * speed;
        mesh.position.set(x, y, z);
        mesh.rotation.x += delta * 12;
        mesh.rotation.y += delta * 6;
      }
    });
  });

  const resolvedActors = useMemo(() => {
    const list = [...(scene3D?.actors || [])];
    const hasSuspect = list.some(a => a.type === 'suspect');
    const hasVictim = list.some(a => a.type === 'victim');

    // In indoor homicide/crime scenes, if there's a victim but no suspect, inject a virtual suspect for dynamic reconstruction
    if (!isRoad && !hasSuspect && hasVictim) {
      list.push({
        id: 'virtual_suspect',
        type: 'suspect',
        label: 'Suspect',
        position: [0, 0, 0], // positionOverride will handle the path animation
        posture: 'standing'
      });
    }
    return list;
  }, [scene3D?.actors, isRoad]);

  const victimActor = useMemo(() => resolvedActors.find(a => a.type === 'victim'), [resolvedActors]);
  const victimPos = useMemo(() => victimActor ? safePos(victimActor.position) : [0, 0, 0], [victimActor]);

  const { entryPos, exitPos } = useMemo(() => {
    const entryPoints = scene3D?.layoutObjects?.filter(o => o.type === 'door' || o.type === 'window') || [];
    let entry = [-dims.width / 2 + 0.5, 0.01, -dims.length / 4];
    let exit = [dims.width / 2 - 0.5, 0.01, dims.length / 3];

    if (entryPoints.length >= 1) {
      entry = [entryPoints[0].position[0], 0.01, entryPoints[0].position[2]];
      exit = entryPoints.length >= 2 
        ? [entryPoints[entryPoints.length - 1].position[0], 0.01, entryPoints[entryPoints.length - 1].position[2]]
        : entry;
    }
    return { entryPos: entry, exitPos: exit };
  }, [scene3D, dims]);

  const animatedSuspectData = useMemo(() => {
    const suspectActor = resolvedActors.find(a => a.type === 'suspect');
    if (!suspectActor) return null;
    const baseSuspectPos = safePos(suspectActor.position);

    let pos = baseSuspectPos;
    let rot = 0;

    if (currentTime < 5.0) {
      const ratio = currentTime / 5.0;
      pos = [
        entryPos[0] + (victimPos[0] - entryPos[0]) * ratio,
        baseSuspectPos[1],
        entryPos[2] + (victimPos[2] - entryPos[2]) * ratio
      ];
      rot = Math.atan2(victimPos[0] - entryPos[0], victimPos[2] - entryPos[2]);
    } else if (currentTime >= 5.0 && currentTime < 7.0) {
      const dx = entryPos[0] - victimPos[0];
      const dz = entryPos[2] - victimPos[2];
      const dist = Math.hypot(dx, dz) || 1;
      // 0.75m separation prevents overlapping/clipping of mannequins
      pos = [victimPos[0] + (dx/dist)*0.75, baseSuspectPos[1], victimPos[2] + (dz/dist)*0.75];
      rot = Math.atan2(victimPos[0] - pos[0], victimPos[2] - pos[2]);
    } else {
      const ratio = (currentTime - 7.0) / 3.0;
      const dx = entryPos[0] - victimPos[0];
      const dz = entryPos[2] - victimPos[2];
      const dist = Math.hypot(dx, dz) || 1;
      const strugglePos = [victimPos[0] + (dx/dist)*0.75, baseSuspectPos[1], victimPos[2] + (dz/dist)*0.75];

      pos = [
        strugglePos[0] + (exitPos[0] - strugglePos[0]) * ratio,
        baseSuspectPos[1],
        strugglePos[2] + (exitPos[2] - strugglePos[2]) * ratio
      ];
      rot = Math.atan2(exitPos[0] - strugglePos[0], exitPos[2] - strugglePos[2]);
    }

    return { position: pos, rotation: rot };
  }, [currentTime, resolvedActors, entryPos, exitPos, victimPos]);

  // Helper is moved to the parent component for 2D fixed rendering.

  return (
    <>
      <fog attach="fog" args={['#090d16', 20, 100]} />

      {/* Scene-aware lighting */}
      {isRoad ? (
        <>
          <ambientLight intensity={0.4} color="#f8fafc" />
          <hemisphereLight args={['#1e293b', '#020617', 0.8]} />
          <directionalLight position={[15, 30, 15]} intensity={0.7} color="#ffffff" castShadow />
        </>
      ) : (
        <IndoorCrimeLighting victimPos={victimPos} currentTime={currentTime} />
      )}

      {/* Auto-position camera for indoor scenes */}
      {!isRoad && <IndoorCameraSetup victimPos={victimPos} currentTime={currentTime} isPlaying={isPlaying} />}

      {/* Auto-position camera for road scenes */}
      {isRoad && <RoadCameraSetup />}

      {/* DYNAMIC BASE ENVIRONMENT */}
      {isRoad ? (
        <RoadEnvironment sceneType={sceneType} dimensions={dims} />
      ) : isPark ? (
        <ParkEnvironment dimensions={dims} />
      ) : (
        <IndoorEnvironment sceneType={sceneType} dimensions={dims} />
      )}

      {/* CCTV Field of View Sector Overlay in 3D */}
      {isRoad && sceneType === 'intersection' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[10.5, 0.005, 10.5]}>
          <ringGeometry args={[0, 16, 32, 1, Math.PI, Math.PI / 2]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.07} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* ─── DYNAMIC SKID MARKS ─── */}
      {isRoad && sceneType === 'intersection' && currentTime >= 3.0 && (
        <group>
          {/* V1 Tyre skid marks (Civic) */}
          <mesh position={[0.7, 0.012, 5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[0.08, 10]} />
            <meshBasicMaterial color="#000000" transparent opacity={Math.min(0.85, (currentTime - 3) * 0.45)} />
          </mesh>
          <mesh position={[-0.7, 0.012, 5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[0.08, 10]} />
            <meshBasicMaterial color="#000000" transparent opacity={Math.min(0.85, (currentTime - 3) * 0.45)} />
          </mesh>

          {/* V2 Tyre skid marks (Fortuner) */}
          <mesh position={[5, 0.014, 0.7]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
            <planeGeometry args={[0.08, 10]} />
            <meshBasicMaterial color="#000000" transparent opacity={Math.min(0.85, (currentTime - 3) * 0.45)} />
          </mesh>
          <mesh position={[5, 0.014, -0.7]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} receiveShadow>
            <planeGeometry args={[0.08, 10]} />
            <meshBasicMaterial color="#000000" transparent opacity={Math.min(0.85, (currentTime - 3) * 0.45)} />
          </mesh>
        </group>
      )}

      {/* ─── EMERGENCY FIRST RESPONDERS & BLOCKADES (POST-COLLISION >= 5.5s) ─── */}
      {isRoad && sceneType === 'intersection' && currentTime >= 5.5 && (
        <group>
          {/* Police Cruiser V3 */}
          <group position={[6.5, 0, 7.5]} rotation={[0, Math.PI / 6, 0]}>
            <PoliceCarModel currentTime={currentTime} />
          </group>
          {/* Ambulance V4 */}
          <group position={[-6.5, 0, 6.5]} rotation={[0, -Math.PI / 8, 0]}>
            <AmbulanceModel currentTime={currentTime} />
          </group>
          {/* Traffic cones safety blockade */}
          <TrafficCone position={[2.2, 0, -2.2]} />
          <TrafficCone position={[-2.2, 0, 2.2]} />
          <TrafficCone position={[2.5, 0, 2.5]} />
          <TrafficCone position={[-2.5, 0, -2.5]} />
        </group>
      )}

      {/* ─── PROCEDURAL LAYOUT OBJECTS MAPPING (WITH REF REGISTRY) ─── */}
      {scene3D?.layoutObjects?.map((item, idx) => {
        if (currentTime < 1.0) return null;

        const isVehicle = ['car', 'suv', 'truck', 'scooter', 'vehicle', 'rickshaw', 'bus'].includes(item.type);
        const cleanItemPos = safePos(item.position);
        
        let angle = (item.rotation || 0);
        if (caseData?.caseId === 'ACC-2026-014' && item.id && typeof item.id === 'string') {
          const lowerId = item.id.toLowerCase();
          if (lowerId.includes('civic')) {
            angle = 180;
          } else if (lowerId.includes('fortuner')) {
            angle = -90;
          }
        }
        const rotationRad = angle * (Math.PI / 180);

        return (
          <group 
            key={idx} 
            ref={isVehicle ? (el) => { vehicleRefs.current[idx] = el; } : null}
            position={cleanItemPos} 
            rotation={[0, rotationRad, 0]}
          >
            {isVehicle && <TravelingArrow angle={angle} />}
            <VehicleModel type={item.type} color={item.color} scale={item.scale} />
            {!isVehicle && <ProceduralObject type={item.type} color={item.color} scale={item.scale} />}

            {/* Vehicle Telemetry Tag */}
            {isVehicle && (
              <Html distanceFactor={13} position={[0, (item.scale ? item.scale[1]/2 + 0.5 : 0.9), 0]} center>
                <div className="bg-[#0b1224]/95 border border-white/20 px-2 py-1 rounded shadow-2xl flex flex-col items-center">
                  <span className="font-bold text-[9px] uppercase tracking-wider select-none text-white">{item.id}</span>
                  <span className="text-[#00E5FF] text-[8px] font-mono select-none mt-0.5 font-bold">
                    {currentTime < collisionTime ? `${item.speed || 40} km/h` : '0 km/h (Rest)'}
                  </span>
                </div>
              </Html>
            )}

            {/* Primary Cause floating label above vehicles when paused at 6.5s */}
            {isVehicle && currentTime >= 6.45 && currentTime <= 6.55 && (
              <Html distanceFactor={11} position={[0, 3.5, 0]} center zIndexRange={[100, 0]}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col items-center select-none pointer-events-none">
                  <div className="bg-[#0b1320]/95 border border-red-500/40 p-2 rounded shadow-2xl backdrop-blur-xl whitespace-nowrap">
                    <p className="text-[10px] text-red-400 font-semibold tracking-wider uppercase mb-0.5 font-mono">Incident Target</p>
                    <p className="text-[12px] text-white font-bold font-mono">{item.id} — {item.speed || 40} km/h</p>
                  </div>
                  <div className="w-0.5 h-8 bg-gradient-to-b from-red-500/60 to-transparent" />
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                </motion.div>
              </Html>
            )}

            {/* Furniture labels only shown in road/outdoor scenes, not indoor murder scenes */}
            {isVehicle && isRoad && (
              <Html distanceFactor={7} position={[0, (item.scale ? item.scale[1]/2 + 0.6 : 1.0), 0]} center zIndexRange={[100, 0]}>
                <div className="bg-[#0b1224]/95 border border-slate-500/50 px-1.5 py-0.5 rounded shadow-xl whitespace-nowrap flex items-center gap-1">
                  <div className="w-1 h-1 rounded-full bg-slate-400" />
                  <span className="text-[7px] font-bold font-mono text-slate-200 uppercase tracking-widest">{item.id.replace(/_/g, ' ')}</span>
                </div>
              </Html>
            )}
          </group>
        );
      })}

      {/* ─── DYNAMIC COLLISION SHOCKWAVE ─── */}
      {isRoad && scene3D?.impactPoint && currentTime >= collisionTime && (
        <group position={impact}>
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.03, 0]}>
            <ringGeometry args={[0.2, 2.5, 32]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.6} />
          </mesh>
          <Html distanceFactor={10} position={[0, 1.4, 0]} center>
            <div className="bg-[#0b1320]/95 border border-orange-500/50 p-2.5 rounded shadow-[0_10px_40px_rgba(245,158,11,0.3)] backdrop-blur-xl whitespace-nowrap text-center select-none">
              <p className="text-[10px] text-orange-400 font-semibold tracking-wider uppercase mb-0.5">Collision Impact Point</p>
              {scene3D.impactPoint.confidence && (
                <p className="text-[9px] text-gray-400 font-bold">Confidence: {scene3D.impactPoint.confidence}%</p>
              )}
            </div>
          </Html>

          {/* Central Cause Floating marker popup inside 3D space when paused at 6.5s */}
          {currentTime >= 6.45 && currentTime <= 6.55 && (
            <Html distanceFactor={11} position={[0, 3.5, 0]} center zIndexRange={[100, 0]}>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="relative flex flex-col items-center select-none pointer-events-none">
                <div className="bg-[#0f172a]/95 border border-[#00E5FF]/45 p-3 rounded-lg shadow-2xl backdrop-blur-xl max-w-[220px] text-center">
                  <p className="text-[10px] text-[#00E5FF] font-semibold tracking-wider uppercase mb-1 font-mono">Primary Cause</p>
                  <p className="text-xs text-white font-bold leading-tight">{caseData?.aiAnalysis?.incidentType || 'Unsafe high-speed overtaking'}</p>
                </div>
                <div className="w-0.5 h-10 bg-gradient-to-b from-[#00E5FF]/60 to-transparent" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] shadow-[0_0_10px_#00E5FF]" />
              </motion.div>
            </Html>
          )}
        </group>
      )}

      {/* ─── FLYING DEBRIS PIECES ─── */}
      {isRoad && Array.from({ length: 8 }).map((_, idx) => (
        <mesh
          key={idx}
          ref={(el) => { debrisRefs.current[idx] = el; }}
          position={[0, 0, 0]}
        >
          <boxGeometry args={[0.15, 0.15, 0.15]} />
          <meshStandardMaterial color={idx % 2 === 0 ? '#b91c1c' : '#f97316'} roughness={0.3} metalness={0.6} />
        </mesh>
      ))}

      {/* ─── ACTOR MANNEQUINS & SUSPECT TRAJECTORY PATH ANIMATION ─── */}
      {resolvedActors.map((actor, idx) => {
        if (currentTime < 1.0) return null;
        const colorMap = actor.type === 'victim' ? '#cbd5e1' : actor.type === 'suspect' ? '#3b82f6' : '#a855f7';
        
        const isSuspect = actor.type === 'suspect';
        const isVictim = actor.type === 'victim';
        
        let positionOverride = actor.position;
        let rotationOverride = [0, 0, 0];
        let postureOverride = actor.posture;

        if (isSuspect) {
          positionOverride = animatedSuspectData ? animatedSuspectData.position : actor.position;
          rotationOverride = animatedSuspectData ? [0, animatedSuspectData.rotation, 0] : [0, 0, 0];
          if (!isRoad) {
            postureOverride = (currentTime >= 5.0 && currentTime < 7.0) ? 'struggle' : 'standing';
          }
        } else if (isVictim) {
          if (!isRoad) {
            const dx = entryPos[0] - victimPos[0];
            const dz = entryPos[2] - victimPos[2];
            const dist = Math.hypot(dx, dz) || 1;
            const dirX = dx / dist;
            const dirZ = dz / dist;
            const faceAngle = Math.atan2(dx, dz);

            if (currentTime < 5.0) {
              postureOverride = 'standing';
              positionOverride = victimPos;
              rotationOverride = [0, faceAngle, 0];
            } else if (currentTime >= 5.0 && currentTime < 7.0) {
              postureOverride = 'struggle';
              positionOverride = victimPos;
              rotationOverride = [0, faceAngle, 0];
            } else if (currentTime >= 7.0 && currentTime < 8.0) {
              // Smooth falling transition
              postureOverride = 'falling';
              const t = currentTime - 7.0; // 0 to 1
              rotationOverride = [t * Math.PI / 2, faceAngle, 0];
              // Displace victim backward as they fall from the strike
              positionOverride = [
                victimPos[0] - dirX * 0.8 * t,
                t * 0.27,
                victimPos[2] - dirZ * 0.8 * t
              ];
            } else {
              // Fallen prone on the ground
              postureOverride = 'prone';
              rotationOverride = [Math.PI / 2, faceAngle, 0];
              positionOverride = [
                victimPos[0] - dirX * 0.8,
                0.27,
                victimPos[2] - dirZ * 0.8
              ];
            }
          } else {
            const isProne = actor.posture?.toLowerCase() === 'prone' || actor.posture?.toLowerCase() === 'lying';
            postureOverride = isProne ? 'prone' : actor.posture;
            positionOverride = actor.position;
          }
        }

        return (
          <Mannequin
            key={idx}
            position={positionOverride}
            rotation={rotationOverride}
            posture={postureOverride}
            label={actor.label}
            color={colorMap}
            timeVisible={true}
            showLabel={isRoad}  // Only show text tag in road/car scenes
            role={actor.type}
            currentTime={currentTime}
          />
        );
      })}

      {/* Dynamic growing blood puddle under the victim's final fallen position */}
      {!isRoad && currentTime >= 7.0 && (
        (() => {
          const dx = entryPos[0] - victimPos[0];
          const dz = entryPos[2] - victimPos[2];
          const dist = Math.hypot(dx, dz) || 1;
          const dirX = dx / dist;
          const dirZ = dz / dist;
          const fallenX = victimPos[0] - dirX * 0.8;
          const fallenZ = victimPos[2] - dirZ * 0.8;
          
          const growTime = currentTime - 7.0;
          const radius = Math.min(growTime * 0.15, 0.45); // Grows up to 0.45m radius
          
          return (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[fallenX, 0.005, fallenZ]} receiveShadow>
              <circleGeometry args={[radius, 32]} />
              <meshStandardMaterial color="#7f1d1d" roughness={0.15} metalness={0.15} transparent opacity={0.9} />
            </mesh>
          );
        })()
      )}

      {/* ─── WEAPON / KNIFE during assault ─── */}
      {!isRoad && currentTime >= 5.0 && currentTime < 7.5 && (
        (() => {
          // Place weapon midway between suspect and victim
          const sData = animatedSuspectData;
          const sPos = sData ? sData.position : victimPos;
          const midX = (sPos[0] + victimPos[0]) / 2;
          const midZ = (sPos[2] + victimPos[2]) / 2;
          return <WeaponObject position={[midX, 0, midZ]} visible={true} />;
        })()
      )}
      {!isRoad && (
        <group>
          {/* Floor trajectory: cyan = approach, orange = escape */}
          <Line 
            points={[entryPos, [victimPos[0], 0.02, victimPos[2]]]} 
            color="#00E5FF" 
            lineWidth={2} 
            dashed 
            dashScale={1.5}
            gapSize={0.3}
            dashSize={0.5}
          />
          <Line 
            points={[[victimPos[0], 0.02, victimPos[2]], exitPos]} 
            color="#f97316" 
            lineWidth={2} 
            dashed 
            dashScale={1.5}
            gapSize={0.3}
            dashSize={0.5}
          />

          {/* Glowing entry marker on floor */}
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[entryPos[0], 0.01, entryPos[2]]}>
            <circleGeometry args={[0.22, 32]} />
            <meshBasicMaterial color="#00E5FF" transparent opacity={0.5} depthWrite={false} />
          </mesh>
          {/* Glowing exit marker on floor */}
          <mesh rotation={[-Math.PI/2, 0, 0]} position={[exitPos[0], 0.01, exitPos[2]]}>
            <circleGeometry args={[0.22, 32]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.5} depthWrite={false} />
          </mesh>

          {/* Red point light during struggle — no text, just dramatic light */}
          {currentTime >= 4.8 && currentTime <= 7.2 && (
            <group position={[victimPos[0], 0, victimPos[2]]}>
              <pointLight color="#ef4444" intensity={20} distance={4} decay={2} position={[0, 1.5, 0]} />
              {/* Pulsing red ring on floor */}
              <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[0.3, 0.7, 32]} />
                <meshBasicMaterial color="#ef4444" transparent opacity={0.4} depthWrite={false} />
              </mesh>
            </group>
          )}
        </group>
      )}

      {/* ─── FORENSIC EVIDENCE MARKERS ─── */}
      {scene3D?.evidenceList?.map((item, idx) => {
        const isVisible = currentTime >= (4.0 + idx * 0.8);
        return (
          <ForensicMarker 
            key={idx}
            position={item.position}
            index={idx + 1}
            label={item.label}
            type={item.type}
            timeVisible={isVisible}
          />
        );
      })}


      {/* Weather Rain Effect */}
      {weather?.toLowerCase() === 'rain' && <RainParticles />}
    </>
  );
}

// --- CORE EXPORT PANEL ---
export default function Reconstruction3D({ caseId, onGoBack, onGoToReport, onGoToTimeline, onGoToHeatmap }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(0.75);
  const [currentTime, setCurrentTime] = useState(0.0);
  const [activeTab, setActiveTab] = useState('3d');
  const [cameraMode, setCameraMode] = useState('orbit');
  const controlsRef = useRef();

  const [caseData, setCaseData] = useState(null);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [summaryClosedByUser, setSummaryClosedByUser] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      setSummaryClosedByUser(false);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!caseId) {
      setCaseData(null);
      return;
    }
    getCaseById(caseId).then(data => {
      setCaseData(data);
    }).catch(err => {
      console.error("Error loading case in 3D Reconstruction view:", err);
    });
  }, [caseId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTutorial(false);
      setIsPlaying(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleCompleteCase = async () => {
    if (!caseId) return;
    const confirm = window.confirm("Are you sure you want to mark this investigation as Completed/Closed?");
    if (!confirm) return;

    try {
      await updateCase(caseId, { status: 'Completed' });
      setCaseData(prev => prev ? { ...prev, status: 'Completed' } : null);
      alert("Case marked as Completed successfully!");
      onGoBack();
    } catch (err) {
      console.error("Failed to complete case:", err);
      alert("Error completing case. Please try again.");
    }
  };

  const handleDeleteCase = async () => {
    if (!caseId) return;
    const confirm = window.confirm("WARNING: Are you sure you want to permanently DELETE this case? All recorded data will be lost forever. This action cannot be undone.");
    if (!confirm) return;

    try {
      await deleteCase(caseId);
      alert("Case deleted successfully!");
      onGoBack();
    } catch (err) {
      console.error("Failed to delete case:", err);
      alert("Error deleting case. Please try again.");
    }
  };

  const handleExportVideo = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    setIsRecordingVideo(true);
    setCurrentTime(0.0);
    setIsPlaying(true);

    const stream = canvas.captureStream(30);
    let options = { mimeType: 'video/webm;codecs=vp9' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: 'video/webm' };
    }
    
    const chunks = [];
    const mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Case-${caseData?.caseId || 'reconstruction'}-3D-render.webm`;
      a.click();
      setIsRecordingVideo(false);
    };

    mediaRecorder.start();

    setTimeout(() => {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      setIsPlaying(false);
    }, 10000);
  };

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const camera = controls.object;
    const target = new THREE.Vector3(0, 0, 0);

    switch (cameraMode) {
      case 'top':
        camera.position.set(0, 32, 0.5);
        camera.up.set(0, 0, -1);
        break;
      case 'front':
        camera.position.set(0, 12, 26);
        camera.up.set(0, 1, 0);
        break;
      case 'left':
        camera.position.set(-26, 12, 0);
        camera.up.set(0, 1, 0);
        break;
      default:
        camera.position.set(-18, 18, 18);
        camera.up.set(0, 1, 0);
        break;
    }

    camera.lookAt(target);
    controls.target.copy(target);
    controls.update();
  }, [cameraMode]);

  const weather = caseData?.weather || caseData?.aiAnalysis?.weather || 'Clear';

  const scene3D = useMemo(() => {
    return caseData?.aiAnalysis?.scene3D || null;
  }, [caseData]);

  // Fallback vehicle accident intersection layout (default road crash matching user request)
  const fallbackScene3D = useMemo(() => {
    return {
      sceneType: "intersection",
      dimensions: { width: 20, length: 45 },
      layoutObjects: [
        { id: "Red SUV", type: "suv", color: "red", position: [-8, 0, -2], rotation: 90, scale: [1, 1, 1] },
        { id: "Blue Scooter", type: "scooter", color: "blue", position: [2, 0, 10], rotation: 180, scale: [1, 1, 1] }
      ],
      actors: [],
      impactPoint: {
        position: [2, 0, -2],
        confidence: 94
      },
      evidenceList: [
        { type: "blood_stain", position: [3, 0.01, -3], label: "Marker #1: Pedestrian blood splatter" },
        { type: "phone", position: [1.5, 0.01, 1], label: "Marker #2: Discarded cell phone" }
      ],
      isEstimated: true
    };
  }, []);

  const activeScene = scene3D || fallbackScene3D;
  const isIndoor = !['road', 'highway', 'intersection', 'parking_lot'].includes(activeScene?.sceneType || 'bedroom');

  const currentPhase = useMemo(() => {
    const t = currentTime;
    if (isIndoor) {
      if (t < 1.0) return { title: "Forensic Initialization", desc: "Scanning room geometry and physical evidence markers." };
      if (t >= 1.0 && t < 5.0) return { title: "Suspect Entry Phase", desc: "Tracing initial ingress path and movement." };
      if (t >= 5.0 && t < 7.0) return { title: "Kinetic Interaction Stage", desc: "Struggle or assault events identified in the environment." };
      return { title: "Suspect Flight Phase", desc: "Tracing escape route and post-incident state." };
    } else {
      const impact = safePos(activeScene?.impactPoint?.position, [0, 0, 0]);
      if (t < 1.0) return { title: "Forensic Initialization", desc: "Compiling vehicle telemetries, direction vectors, and environmental parameters." };
      if (t >= 1.0 && t < 3.0) return { title: "Pre-Impact Stage", desc: "Vehicles traveling at initial speeds along recorded paths." };
      if (t >= 3.0 && t < 5.0) return { title: "Braking & Reaction Stage", desc: "Emergency braking initiated. Vehicles leaving skid marks on asphalt." };
      if (t >= 5.0 && t < 7.0) return { title: "Impact Collision Stage", desc: `Collision occurs at point [${impact.map(n => n.toFixed(1)).join(', ')}]. Kinetic energy exchange causes vehicle swerve.` };
      return { title: "Post-Impact Rest Stage", desc: "Vehicles swerve to a stop. Forensic markers mapped." };
    }
  }, [currentTime, activeScene, isIndoor]);

  return (
    <div className="min-h-[100dvh] bg-[#05060A] text-white p-3 md:p-6 pb-24 md:pb-6 flex flex-col">
      <div className="mx-auto w-full max-w-[1400px] flex flex-col flex-1 gap-4 md:gap-6 text-left">
        
        {/* Title */}
        <div className="flex flex-col gap-2 pt-2 md:pt-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#a78bfa] text-center md:text-left">3D Accident Reconstruction</p>
        </div>

        {/* 3D Container Box */}
        <div className="flex-1 rounded-3xl md:rounded-[40px] border border-white/10 bg-[#0B0F19]/80 shadow-[0_20px_80px_rgba(31,25,54,0.4)] backdrop-blur-2xl overflow-hidden flex flex-col relative">
          
          {/* Top Header Bar */}
          <div className="flex flex-col gap-4 border-b border-white/10 bg-[#0c1224]/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onGoBack} className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-[#c084fc] transition hover:bg-white/10">
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="space-y-1 text-left">
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#a78bfa]/80">Investigation Space</p>
                <p className="text-sm font-semibold text-white">{caseData ? caseData.caseId || caseId : caseId}</p>
                <p className="text-[10px] uppercase tracking-[0.35em] text-[#cbd5e1]/80 font-bold">
                  {(activeScene?.sceneType || 'scene').toUpperCase()} ({activeScene?.dimensions?.width ?? '?'}m x {activeScene?.dimensions?.length ?? '?'}m)
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 justify-end">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#111827]/80 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-[#7dd3fc]">
                <MapPin className="h-3.5 w-3.5" />
                PROCEDURAL
              </span>
              
              <button className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-[#c084fc] transition hover:bg-white/10" title="Share Space">
                <Share2 className="h-5 w-5" />
              </button>

              {caseData?.status !== 'Completed' && (
                <button 
                  onClick={handleCompleteCase}
                  className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-green-500/20 bg-green-500/5 text-green-400 transition hover:bg-green-500/20 hover:border-green-500/40"
                  title="Mark Investigation as Completed"
                >
                  <CheckCircle2 className="h-5 w-5" />
                </button>
              )}

              <button 
                onClick={handleDeleteCase}
                className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/5 text-red-400 transition hover:bg-red-500/20 hover:border-red-500/40"
                title="Delete Case"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex flex-col gap-3 px-4 py-4 border-b border-white/10 sm:flex-row sm:items-center sm:justify-between bg-[#0b0e1b]/70">
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {[
                { id: '3d', label: '3D Simulation' },
                { id: 'case_analysis', label: 'Case Analysis' },
                { id: 'timeline', label: 'Timeline View' },
                { id: 'map', label: 'Map View' },
                { id: 'scenarios', label: 'Alternative Scenarios' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-3xl px-4 py-2.5 text-xs font-semibold tracking-wider transition ${activeTab === tab.id ? 'bg-[#7c3aed] text-white shadow-glowPurple' : 'bg-white/5 border border-white/5 text-slate-300 hover:bg-white/10'}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {activeTab === '3d' && (activeScene.isEstimated || !scene3D) && (
              <span className="text-[10px] font-mono text-yellow-500 border border-yellow-500/30 bg-yellow-500/5 px-3 py-1.5 rounded-full uppercase tracking-wider text-center flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                AI Generated (Estimated Placements - Incomplete details)
              </span>
            )}
          </div>

          {/* Core Viewport */}
          <div className="relative flex-1 min-h-[420px] bg-[#020617]">
            {activeTab === '3d' && (
              <>
                {/* 3D Interactive Canvas */}
                <div className="absolute inset-0 z-0">
                  <CanvasErrorBoundary>
                  <Canvas camera={{ position: [-18, 18, 18], fov: 40, near: 0.1, far: 200 }} shadows>
                    <color attach="background" args={[isIndoor ? '#090d16' : '#020617']} />
                    <SimulationScene 
                      isPlaying={isPlaying} 
                      playbackSpeed={playbackSpeed} 
                      currentTime={currentTime} 
                      setCurrentTime={setCurrentTime}
                      activeTab={activeTab}
                      setIsPlaying={setIsPlaying}
                      weather={weather}
                      scene3D={activeScene}
                      caseData={caseData}
                    />
                    <OrbitControls
                      ref={controlsRef}
                      enablePan={true}
                      enableRotate={true}
                      enableZoom={true}
                      maxPolarAngle={Math.PI / 2.1}
                      minDistance={4}
                      maxDistance={80}
                    />
                  </Canvas>
                  </CanvasErrorBoundary>
                </div>

                {/* Scanning overlay text */}
                <div className="absolute top-4 left-4 z-10 pointer-events-none font-mono text-[10px] text-gray-400 space-y-1">
                  <p className="text-[#00E5FF] animate-pulse">● RADAR SCANNING SIMULATION</p>
                  <p>SCAN VELOCITY: {playbackSpeed.toFixed(2)}X</p>
                  <p>COORDINATES GRID: 1.0m CELL</p>
                </div>

                {/* 2D Fixed HUD Overlay - Always Readable */}
                <div className="absolute bottom-24 left-4 z-10 max-w-sm bg-[#080b1e]/90 border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md select-none text-left pointer-events-none">
                  <div className="flex items-center gap-2 text-[#00E5FF] mb-1">
                    <Activity className="w-3.5 h-3.5 animate-pulse" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{currentPhase.title}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{currentPhase.desc}</p>
                </div>

                {/* Floating Tutorial Overlay */}
                <AnimatePresence>
                  {showTutorial && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none bg-black/40 backdrop-blur-[2px]"
                    >
                      <div className="flex flex-col items-center gap-4 text-center">
                        <div className="flex items-center gap-3">
                          <ArrowLeft className="w-6 h-6 text-white/70 animate-pulse" />
                          <Hand className="w-12 h-12 text-white/90" />
                          <ArrowRight className="w-6 h-6 text-white/70 animate-pulse" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold text-xl tracking-wide">3D Interactive Control</h3>
                          <p className="text-gray-300 text-sm mt-1">Left-click & drag to rotate<br/>Right-click & drag to pan • Scroll to zoom</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI Summary float block */}
                {/* AI Summary float block */}
                {!isPlaying && currentTime >= 6.4 && !summaryClosedByUser && (
                  <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-2 right-2 z-40 w-80 rounded-2xl border border-white/10 bg-[#0B0F19]/95 shadow-[0_20px_80px_rgba(0,0,0,0.6)] backdrop-blur-3xl overflow-hidden flex flex-col max-h-[90%]"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-white/5 bg-[#0e1324]/90 px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-[#a78bfa]" />
                        <h3 className="font-bold text-white text-xs uppercase tracking-widest font-mono">AI Summary</h3>
                      </div>
                      <button onClick={() => setSummaryClosedByUser(true)} className="text-slate-400 hover:text-white transition">
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="p-5 flex flex-col gap-4 text-left overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                      {/* Classification */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Most Likely Scenario:</span>
                        <h4 className="text-lg font-bold text-white font-sans">{caseData?.aiAnalysis?.incidentType || 'Collision'}</h4>
                        
                        {/* Cyan Divider Bar */}
                        <div className="w-full h-1 bg-[#1e293b] rounded-full overflow-hidden mt-2.5">
                          <div className="h-full bg-[#00E5FF] rounded-full" style={{ width: `${(caseData?.aiAnalysis?.confidenceScore || 0.94) * 100}%` }} />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400 block mt-1.5">
                          Confidence score: {Math.round((caseData?.aiAnalysis?.confidenceScore || 0.94) * 100)}%
                        </span>
                      </div>

                      {/* Evidence Used List */}
                      <div className="space-y-1.5 mt-2">
                        <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block">Evidence Used</span>
                        <div className="flex flex-col gap-2 mt-1 text-xs font-sans text-slate-300">
                          {[
                            'Vehicle Dynamics',
                            'Vehicle Trajectory',
                            'Collision Analysis',
                            'Road Geometry'
                          ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-[#22c55e] fill-[#22c55e]/10" />
                              <span className="font-medium text-slate-200 text-[11px]">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* AI Findings narrative box */}
                      <div className="space-y-1.5 mt-2">
                        <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest block">AI Findings</span>
                        <div className="bg-[#080c14]/90 border border-white/5 p-4 rounded-xl text-[11.5px] font-sans leading-relaxed text-slate-300 text-left">
                          {caseData?.aiAnalysis?.executiveSummary || "The exact root cause is being verified. Speeding and loss of control are primary factors."}
                        </div>
                      </div>

                      {/* Action buttons list */}
                      <div className="flex flex-col gap-2 mt-2">
                        <button 
                          onClick={onGoToReport}
                          className="w-full rounded-xl bg-[#2563eb] hover:bg-[#3b82f6] py-3 text-xs font-bold text-white transition flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(37,99,235,0.25)] border-none"
                        >
                          Generate Report
                        </button>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setActiveTab('scenarios')} 
                            className="flex-1 py-2.5 px-2 bg-[#121829] hover:bg-[#1a233d] text-slate-300 hover:text-white rounded-lg text-[9.5px] font-bold font-mono tracking-wide border border-white/5 transition uppercase text-center"
                          >
                            Compare Scenarios
                          </button>
                          <button 
                            onClick={() => setActiveTab('map')} 
                            className="flex-1 py-2.5 px-2 bg-[#121829] hover:bg-[#1a233d] text-slate-300 hover:text-white rounded-lg text-[9.5px] font-bold font-mono tracking-wide border border-white/5 transition uppercase text-center"
                          >
                            Heatmap Confidence
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}

            {activeTab === 'case_analysis' && (
              <div className="absolute inset-0 overflow-y-auto custom-scrollbar bg-[#05060A]">
                <CaseAnalysis caseId={caseId} />
              </div>
            )}

            {activeTab === 'scenarios' && (
              <AlternativeScenarios 
                caseId={caseId} 
                onBack={() => setActiveTab('3d')} 
              />
            )}
            {activeTab === 'map' && (
              <MapView 
                caseId={caseId} 
                onBack={() => setActiveTab('3d')} 
              />
            )}
            {activeTab === 'timeline' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0b0e1b]/40 backdrop-blur-sm">
                <p className="text-sm font-mono text-gray-400 mb-4">Forensic Timeline Overview</p>
                <button 
                  onClick={onGoToTimeline}
                  className="px-6 py-3 bg-[#7c3aed] text-white rounded-xl font-mono text-xs uppercase tracking-wider shadow-glowPurple hover:bg-[#8b5cf6] transition"
                >
                  Open Full Case Timeline
                </button>
              </div>
            )}
          </div>

          {/* Timeline & Playback Controller */}
          {!['scenarios', 'map'].includes(activeTab) && (
            <div className="px-4 py-5 border-t border-white/10 bg-[#0b1122]/95 space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsPlaying(!isPlaying)} className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-[#7c3aed] text-white shadow-[0_20px_40px_rgba(124,58,237,0.28)] transition hover:bg-[#8b5cf6]">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  </button>
                  <button onClick={() => setCurrentTime(0.0)} className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-[#d1d5db] hover:bg-white/10 transition">
                    <RotateCcw className="h-5 w-5" />
                  </button>
                  <button onClick={() => setPlaybackSpeed(prev => prev === 0.5 ? 0.75 : prev === 0.75 ? 1.0 : prev === 1.0 ? 1.5 : 0.5)} className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#e0def8] hover:bg-white/10 transition">
                    {playbackSpeed.toFixed(2)}x
                  </button>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 rounded-full bg-white/5 px-4 py-3">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.02"
                        value={currentTime}
                        onChange={(e) => setCurrentTime(parseFloat(e.target.value))}
                        className="w-full accent-[#7c3aed] h-2 bg-transparent cursor-pointer"
                      />
                    </div>
                    <span className="min-w-[96px] text-right text-xs uppercase tracking-[0.24em] text-[#9ca3af]">{currentTime.toFixed(2)} / 10.00s</span>
                  </div>
                </div>

                <button 
                  onClick={handleExportVideo}
                  disabled={isRecordingVideo}
                  title="Export 3D Video Reconstruction"
                  className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-[#00E5FF] hover:bg-[#1e293b]/50 hover:border-[#00E5FF]/40 transition disabled:opacity-50"
                >
                  {isRecordingVideo ? (
                    <Loader className="h-5 w-5 animate-spin text-[#00E5FF]" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                </button>
              </div>

              {/* Camera Angle Shortcuts */}
              {activeTab === '3d' && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'orbit', label: 'Orbit Cam', icon: <Video className="h-4 w-4" /> },
                    { id: 'top', label: 'Top View', icon: <ArrowUp className="h-4 w-4" /> },
                    { id: 'front', label: 'Front View', icon: <ArrowRight className="h-4 w-4" /> },
                    { id: 'left', label: 'Left View', icon: <ArrowLeft className="h-4 w-4" /> }
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setCameraMode(item.id)}
                      className={`rounded-3xl border px-4 py-3 text-sm transition flex flex-col items-center justify-center gap-2 ${cameraMode === item.id ? 'border-[#7c3aed] bg-[#7c3aed]/10 text-white' : 'border-white/10 bg-white/5 text-[#e5e7eb] hover:bg-white/10'}`}
                    >
                      {item.icon}
                      <span className="text-[10px] uppercase font-mono tracking-widest font-bold hidden md:inline">{item.label}</span>
                    </button>
                  ))}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
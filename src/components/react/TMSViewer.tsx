import { useRef, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

// Animated E-field sphere that pulses and shifts color
function EFieldSphere({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const t = clock.getElapsedTime()
      meshRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.08)
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <sphereGeometry args={[0.35, 32, 32]} />
      <meshStandardMaterial
        color={hovered ? '#22d3ee' : '#818cf8'}
        emissive={hovered ? '#22d3ee' : '#818cf8'}
        emissiveIntensity={hovered ? 1.2 : 0.6}
        transparent
        opacity={0.55}
        roughness={0.1}
        metalness={0.2}
      />
    </mesh>
  )
}

// Small field intensity dots
function FieldDots({ coilPos }: { coilPos: [number, number, number] }) {
  const points = useRef<THREE.Points | null>(null)
  const count = 120
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const r = 0.4 + Math.random() * 0.6
    positions[i * 3] = coilPos[0] + r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = coilPos[1] + r * Math.sin(phi) * Math.sin(theta) * 0.7
    positions[i * 3 + 2] = coilPos[2] + r * Math.cos(phi)

    const intensity = 1 - (r - 0.4) / 0.6
    colors[i * 3] = 0.3 + intensity * 0.7
    colors[i * 3 + 1] = 0.3 + intensity * 0.5
    colors[i * 3 + 2] = 1
  }

  useFrame(({ clock }) => {
    if (points.current) {
      points.current.rotation.y = clock.getElapsedTime() * 0.15
    }
  })

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  return (
    <points ref={points}>
      <bufferGeometry ref={geo as any} />
      <pointsMaterial size={0.04} vertexColors sizeAttenuation />
    </points>
  )
}

// TMS Coil — stylized figure-8
function TMSCoil({ position, onClick }: {
  position: [number, number, number]
  onClick: () => void
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 1.5) * 0.05
    }
  })

  return (
    <group ref={groupRef} position={position} onClick={onClick} dispose={null}>
      {/* Handle */}
      <mesh>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 16]} />
        <meshStandardMaterial color="#374151" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Left loop */}
      <mesh position={[-0.18, 0.1, 0]}>
        <torusGeometry args={[0.2, 0.04, 12, 32]} />
        <meshStandardMaterial color="#06b6d4" metalness={0.9} roughness={0.1} emissive="#06b6d4" emissiveIntensity={0.3} />
      </mesh>
      {/* Right loop */}
      <mesh position={[0.18, 0.1, 0]}>
        <torusGeometry args={[0.2, 0.04, 12, 32]} />
        <meshStandardMaterial color="#8b5cf6" metalness={0.9} roughness={0.1} emissive="#8b5cf6" emissiveIntensity={0.3} />
      </mesh>
      {/* Center connector */}
      <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 0.36, 12]} />
        <meshStandardMaterial color="#6366f1" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

// Brain surface
function Brain() {
  return (
    <mesh scale={[1.1, 0.9, 0.85]}>
      <sphereGeometry args={[1, 64, 64]} />
      <MeshDistortMaterial
        color="#f0abfc"
        distort={0.25}
        speed={0.4}
        roughness={0.6}
        metalness={0.1}
      />
    </mesh>
  )
}

// Main scene
function TMSVisualization({ coilPosition }: { coilPosition: number }) {
  const positions: [number, number, number][] = [
    [0, 1.1, 0],
    [-0.6, 0.85, 0.3],
    [0.6, 0.85, -0.3],
  ]

  const coilPos = positions[coilPosition]

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[3, 3, 3]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-3, -1, -3]} intensity={0.5} color="#a78bfa" />
      <pointLight position={coilPos} intensity={0.8} color="#22d3ee" />

      <Brain />
      <TMSCoil position={coilPos} onClick={() => {}} />
      <EFieldSphere position={coilPos} />
      <FieldDots coilPos={coilPos} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 0.72}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  )
}

// Position preset labels
const PRESETS = [
  { label: 'Left DLPFC', desc: 'Depression target' },
  { label: 'Right DLPFC', desc: 'Anxiety / dual' },
  { label: 'Motor Cortex', desc: 'Movement / pain' },
]

export default function TMSViewer() {
  const [coilPos, setCoilPos] = useState(0)
  const [mounted, setMounted] = useState(false)

  return (
    <div className="w-full">
      {/* 3D Canvas */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 to-slate-800 border border-slate-700/50"
        style={{ height: '420px' }}>
        {!mounted && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-slate-400 text-sm">Loading simulation…</div>
          </div>
        )}
        <Canvas
          camera={{ position: [0, 0.5, 3.5], fov: 45 }}
          onCreated={() => setMounted(true)}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <TMSVisualization coilPosition={coilPos} />
          </Suspense>
        </Canvas>

        {/* Overlay label */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/70 backdrop-blur-sm border border-slate-600/40 rounded-lg px-3 py-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-medium text-slate-200 tracking-wide uppercase">TMS Simulation</span>
        </div>

        {/* Legend */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 bg-slate-900/70 backdrop-blur-sm rounded px-2 py-1">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
            <span className="text-[10px] text-slate-300">E-field intensity</span>
          </div>
        </div>
      </div>

      {/* Coil position selector */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            onClick={() => setCoilPos(i)}
            className={`text-center px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-200 ${
              coilPos === i
                ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-600/25'
                : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50'
            }`}
          >
            <div className="font-semibold text-xs">{p.label}</div>
            <div className="text-[10px] opacity-70 mt-0.5">{p.desc}</div>
          </button>
        ))}
      </div>

      <p className="text-center text-slate-400 text-xs mt-3">
        Drag to rotate · Click a target zone above
      </p>
    </div>
  )
}
